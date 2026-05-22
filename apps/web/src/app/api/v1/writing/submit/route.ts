import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@fuxie/database";
import { getServerUser } from "@/lib/auth/server-auth";
import { handleApiError } from "@/lib/api/error-handler";
import { cookies } from "next/headers";
import { buildLearningQuestRewardPayload } from "@/lib/gamification/learning-quest-rewards";
import { buildWritingQuestEpisodeReceipt } from "@/lib/gamification/writing-quest-episode";
import { getLearningQuestMasteryPayload } from "@/lib/gamification/skill-mastery-data";
import {
  calculateWritingXp,
  recordLearningActivity,
} from "@/lib/progress/learning-activity";
import { invalidateLearnerProgressCaches } from "@/lib/progress/cache-invalidation";
import { recordAnalyticsEvent } from "@/lib/analytics/events";
import { gradeWriting } from "../../grade/route";

export const maxDuration = 60; // Prevent Vercel timeout for slow AI API

const writingSubmitSchema = z.object({
  exerciseId: z.string().min(1),
  submittedText: z.string().min(1),
  wordCount: z.number().int().min(0).optional(),
  timeSpentSeconds: z.number().min(0).optional(),
  questEpisode: z
    .object({
      episodeId: z.string().max(180),
      skill: z.literal("writing"),
      sourceId: z.string().max(180),
      cefrLevel: z.string().max(12),
      checkpointCount: z.number().int().min(1).max(6),
      completedCheckpoints: z.number().int().min(0).max(6).optional(),
      nextEpisodeHref: z.string().max(240).optional(),
    })
    .optional(),
});

// POST /api/v1/writing/submit - Submit writing and get AI grading
export async function POST(req: NextRequest) {
  let currentUser: Awaited<ReturnType<typeof getServerUser>> | null = null;
  let currentExercise: Awaited<
    ReturnType<typeof prisma.writingExercise.findUnique>
  > | null = null;
  try {
    const serverUser = await getServerUser();
    currentUser = serverUser;
    if (!serverUser) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const body = await req.json();
    const {
      exerciseId,
      submittedText,
      wordCount,
      timeSpentSeconds,
      questEpisode,
    } = writingSubmitSchema.parse(body);

    const exercise = await prisma.writingExercise.findUnique({
      where: { exerciseId },
    });
    currentExercise = exercise;

    if (!exercise) {
      return NextResponse.json(
        { success: false, error: "Exercise not found" },
        { status: 404 },
      );
    }
    const eligibleQuestEpisode =
      questEpisode &&
      questEpisode.sourceId === exercise.exerciseId &&
      questEpisode.cefrLevel === exercise.cefrLevel
        ? questEpisode
        : null;

    const rubric = exercise.rubricJson as any;
    const locale = (await cookies()).get("NEXT_LOCALE")?.value || "vi";

    let aiRes: any;
    try {
        const res = await gradeWriting({
            textType: exercise.textType,
            register: exercise.register,
            situation: exercise.situation,
            contentPoints: exercise.contentPoints as string[],
            submittedText,
            minWords: exercise.minWords,
            maxWords: exercise.maxWords,
            rubric,
        }, exercise.cefrLevel, locale);
        
        aiRes = await res.json();
    } catch (e: any) {
        console.error("[Writing Grade] OpenRouter call failed:", e);
        await recordWritingAiFailure(
          serverUser,
          exercise,
          "service_status",
          502,
          eligibleQuestEpisode,
        );
        return NextResponse.json(
          { success: false, error: "AI grading service unavailable" },
          { status: 502 },
        );
    }

    const json = aiRes;
    if (!json.success || !json.data) {
      await recordWritingAiFailure(
        serverUser,
        exercise,
        "invalid_response",
        undefined,
        eligibleQuestEpisode,
      );
      return NextResponse.json(
        { success: false, error: "Invalid response from AI grading service" },
        { status: 500 },
      );
    }

    const gradingResult = json.data;
    const baseXpEarned = calculateWritingXp();

    const criteriaMap: Record<string, number> = {};
    for (const c of gradingResult.criteria) {
      criteriaMap[c.id || c.name] = c.score;
    }

    const result = await prisma.$transaction(async (tx) => {
      const attempt = await tx.writingAttempt.create({
        data: {
          userId: serverUser.userId,
          exerciseId: exercise.id,
          submittedText,
          wordCount: wordCount || submittedText.trim().split(/\s+/).length,
          scoreInhalt:
            criteriaMap["Inhalt"] ?? criteriaMap["Vollständigkeit"] ?? null,
          scoreAngemessenheit:
            criteriaMap["Kommunikative Angemessenheit"] ??
            criteriaMap["Formale Richtigkeit"] ??
            null,
          scoreKorrektheit: criteriaMap["Korrektheit"] ?? null,
          scoreSpektrum: criteriaMap["Wortschatz & Strukturen"] ?? null,
          scoreKohaerenz: criteriaMap["Kohärenz & Kohäsion"] ?? null,
          totalScore: gradingResult.totalScore,
          maxScore: gradingResult.maxScore,
          percentScore: gradingResult.percentScore,
          feedbackOverall: gradingResult.overallFeedback,
          feedbackJson: gradingResult.criteria,
          correctionsJson: gradingResult.corrections,
          estimatedLevel: gradingResult.estimatedLevel as any,
          timeSpentSeconds: timeSpentSeconds || null,
        },
      });

      const progress = await recordLearningActivity(tx, {
        userId: serverUser.userId,
        exerciseId: exercise.exerciseId,
        score: gradingResult.totalScore,
        maxScore: gradingResult.maxScore,
        percentScore: gradingResult.percentScore,
        xpEarned: baseXpEarned,
        timeSpentSeconds: timeSpentSeconds ?? null,
        exercisesCompleted: 1,
        analytics: {
          role: serverUser.role,
          actionId: exercise.exerciseId,
          actionType: "writing_submission",
          level: exercise.cefrLevel,
          skill: "SCHREIBEN",
          source: "writing.submit",
          metadata: {
            word_count: attempt.wordCount,
            ...(eligibleQuestEpisode
              ? {
                  episode_id: eligibleQuestEpisode.episodeId,
                  checkpoint_count: eligibleQuestEpisode.checkpointCount,
                }
              : {}),
          },
        },
      });

      await recordAnalyticsEvent(tx, {
        userId: serverUser.userId,
        role: serverUser.role,
        eventName: "ai_feedback_generated",
        source: "writing.grade",
        actionId: exercise.exerciseId,
        actionType: "writing_submission",
        level: exercise.cefrLevel,
        skill: "SCHREIBEN",
        metadata: {
          flow: "writing",
          score_percent: gradingResult.percentScore,
          estimated_level: gradingResult.estimatedLevel ?? null,
          criteria_count: Array.isArray(gradingResult.criteria)
            ? gradingResult.criteria.length
            : 0,
          correction_count: Array.isArray(gradingResult.corrections)
            ? gradingResult.corrections.length
            : 0,
          word_count: attempt.wordCount,
          duration_seconds: timeSpentSeconds ?? null,
          provider_status: "success",
          ...(eligibleQuestEpisode
            ? {
                episode_id: eligibleQuestEpisode.episodeId,
                checkpoint_count: eligibleQuestEpisode.checkpointCount,
              }
            : {}),
        },
      });

      const questEpisodeReceipt = eligibleQuestEpisode
        ? buildWritingQuestEpisodeReceipt({
            episodeId: eligibleQuestEpisode.episodeId,
            exerciseId: exercise.exerciseId,
            cefrLevel: exercise.cefrLevel,
            scorePercent: gradingResult.percentScore,
            completedCheckpoints: eligibleQuestEpisode.completedCheckpoints,
            checkpointCount: eligibleQuestEpisode.checkpointCount,
            nextEpisodeHref: eligibleQuestEpisode.nextEpisodeHref,
            feedbackSummaryState: "generated",
          })
        : null;

      if (questEpisodeReceipt) {
        await recordAnalyticsEvent(tx, {
          userId: serverUser.userId,
          role: serverUser.role,
          eventName: "quest_episode_completed",
          source: "writing.quest_episode.completed",
          actionId: questEpisodeReceipt.episodeId,
          actionType: "writing_submission",
          level: exercise.cefrLevel,
          skill: "writing",
          metadata: {
            episodeId: questEpisodeReceipt.episodeId,
            skill: "writing",
            exerciseId: exercise.exerciseId,
            cefrLevel: exercise.cefrLevel,
            checkpointId: "revise",
            checkpointCount: questEpisodeReceipt.checkpointCount,
            scorePercent: gradingResult.percentScore,
            accuracyBand: questEpisodeReceipt.accuracyBand,
            feedbackState: questEpisodeReceipt.feedbackSummaryState,
          },
        });
      }

      return {
        attempt,
        progress,
        questEpisodeReceipt,
      };
    });

    invalidateLearnerProgressCaches(serverUser.userId).catch(() => {});
    const mastery = await getLearningQuestMasteryPayload({
      userId: serverUser.userId,
      skill: "writing",
      currentLevel: exercise.cefrLevel,
      sourceActionId: result.attempt.id,
      sourceActionType: "writing_submission",
      source: "writing.submit",
      persistBadgeUnlock: true,
    }).catch(() => ({}));

    return NextResponse.json({
      success: true,
      data: {
        attemptId: result.attempt.id,
        xpEarned: result.progress.xpEarned,
        streak: result.progress.streak,
        ...(result.questEpisodeReceipt
          ? {
              questEpisodeReceipt: result.questEpisodeReceipt,
              nextEpisodeHref: result.questEpisodeReceipt.nextEpisodeHref,
            }
          : {}),
        ...buildLearningQuestRewardPayload({
          skill: "writing",
          xpEarned: result.progress.xpEarned,
          streak: result.progress.streak,
          ...mastery,
        }),
        ...gradingResult,
      },
    });
  } catch (error: unknown) {
    if (
      error instanceof Error &&
      (error.message.includes("API_KEY") || error.message.includes("GEMINI"))
    ) {
      if (currentUser && currentExercise) {
        await recordWritingAiFailure(
          currentUser,
          currentExercise,
          "provider_configuration",
        );
      }
      return NextResponse.json(
        {
          success: false,
          error: "AI service not configured. Please set GEMINI_API_KEY.",
        },
        { status: 503 },
      );
    }

    if (currentUser && currentExercise) {
      await recordWritingAiFailure(
        currentUser,
        currentExercise,
        "unexpected_error",
      );
    }

    return handleApiError(error);
  }
}

async function recordWritingAiFailure(
  serverUser: NonNullable<Awaited<ReturnType<typeof getServerUser>>>,
  exercise: NonNullable<
    Awaited<ReturnType<typeof prisma.writingExercise.findUnique>>
  >,
  errorType: string,
  statusCode?: number,
  questEpisode?: z.infer<typeof writingSubmitSchema>["questEpisode"] | null,
) {
  try {
    await recordAnalyticsEvent(prisma, {
      userId: serverUser.userId,
      role: serverUser.role,
      eventName: "ai_feedback_failed",
      source: "writing.grade",
      actionId: exercise.exerciseId,
      actionType: "writing_submission",
      level: exercise.cefrLevel,
      skill: "SCHREIBEN",
      metadata: {
        flow: "writing",
        error_type: errorType,
        status_code: statusCode ?? null,
        ...(questEpisode
          ? {
              episode_id: questEpisode.episodeId,
              checkpoint_count: questEpisode.checkpointCount,
            }
          : {}),
      },
    });
  } catch (analyticsError) {
    console.error(
      "[Writing Grade] Failed to record AI eval analytics:",
      analyticsError,
    );
  }
}
