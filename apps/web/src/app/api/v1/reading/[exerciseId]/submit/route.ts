import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@fuxie/database'
import { getServerUser } from '@/lib/auth/server-auth'
import { handleApiError } from '@/lib/api/error-handler'
import { gradeReadingSubmission } from '@/lib/assessment/submission-grading'
import { awardLearningFucoin } from '@/lib/gamification/fucoin'
import { buildLearningQuestRewardPayload } from '@/lib/gamification/learning-quest-rewards'
import { buildReadingQuestEpisodeReceipt } from '@/lib/gamification/reading-quest-episode'
import { getLearningQuestMasteryPayload } from '@/lib/gamification/skill-mastery-data'
import { calculateReadingXp, recordLearningActivity } from '@/lib/progress/learning-activity'
import { invalidateLearnerProgressCaches } from '@/lib/progress/cache-invalidation'

const readingSubmitSchema = z.object({
    answers: z.record(z.string(), z.string()),   // { questionId: userAnswer }
    timeTaken: z.number().min(0).optional(),
    questEpisode: z.object({
        episodeId: z.string().max(180),
        skill: z.literal('reading'),
        sourceId: z.string().max(180),
        cefrLevel: z.string().max(12),
        checkpointCount: z.number().int().min(1).max(6),
        nextEpisodeHref: z.string().max(240).optional(),
    }).optional(),
})

// POST /api/v1/reading/:exerciseId/submit — Submit reading answers
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ exerciseId: string }> }
) {
    try {
        const serverUser = await getServerUser()
        if (!serverUser) {
            return NextResponse.json(
                { success: false, error: 'Not authenticated' },
                { status: 401 }
            )
        }

        const { exerciseId } = await params
        const body = await req.json()
        const { answers, timeTaken, questEpisode } = readingSubmitSchema.parse(body)

        // Get exercise with correct answers
        const exercise = await prisma.readingExercise.findUnique({
            where: { exerciseId },
            include: {
                questions: {
                    orderBy: { sortOrder: 'asc' },
                    select: {
                        id: true,
                        questionNumber: true,
                        questionType: true,
                        statement: true,
                        linkedText: true,
                        options: true,
                        correctAnswer: true,
                        points: true,
                        explanation: true,
                    },
                },
            },
        })

        if (!exercise) {
            return NextResponse.json(
                { success: false, error: 'Exercise not found' },
                { status: 404 }
            )
        }
        const eligibleQuestEpisode = questEpisode
            && questEpisode.sourceId === exercise.exerciseId
            && questEpisode.cefrLevel === exercise.cefrLevel
            ? questEpisode
            : null

        const { score, totalQuestions, percentage, responseData, questionResults } =
            gradeReadingSubmission(exercise.questions, answers)
        const baseXpEarned = calculateReadingXp(percentage)

        // Save attempt + unified learning activity
        const { attempt, progress, fucoin } = await prisma.$transaction(async (tx) => {
            const newAttempt = await tx.readingAttempt.create({
                data: {
                    userId: serverUser.userId,
                    exerciseId: exercise.id,
                    score,
                    totalQuestions,
                    percentage,
                    timeTaken: timeTaken ?? null,
                    responses: {
                        create: responseData,
                    },
                },
            })

            const activity = await recordLearningActivity(tx, {
                userId: serverUser.userId,
                exerciseId: exercise.exerciseId,
                score,
                maxScore: totalQuestions,
                percentScore: percentage,
                xpEarned: baseXpEarned,
                timeSpentSeconds: timeTaken ?? null,
                exercisesCompleted: 1,
                analytics: {
                    role: serverUser.role,
                    actionId: exercise.exerciseId,
                    actionType: 'reading_task',
                    level: exercise.cefrLevel,
                    skill: 'LESEN',
                    source: 'reading.submit',
                    ...(eligibleQuestEpisode ? { metadata: {
                        episode_id: eligibleQuestEpisode.episodeId,
                        checkpoint_count: eligibleQuestEpisode.checkpointCount,
                    } } : {}),
                },
            })

            const learningFucoin = await awardLearningFucoin(tx, {
                userId: serverUser.userId,
                kind: 'activity',
                sourceType: 'learning:reading',
                sourceId: newAttempt.id,
                accuracy: percentage,
                reason: `Reading ${exercise.exerciseId}`,
                metadata: {
                    attemptId: newAttempt.id,
                    exerciseId: exercise.exerciseId,
                    score,
                    totalQuestions,
                    percentage,
                    ...(eligibleQuestEpisode ? {
                        episodeId: eligibleQuestEpisode.episodeId,
                        checkpointCount: eligibleQuestEpisode.checkpointCount,
                    } : {}),
                },
            })

            return {
                attempt: newAttempt,
                progress: activity,
                fucoin: learningFucoin,
            }
        })

        invalidateLearnerProgressCaches(serverUser.userId).catch(() => {})
        const mastery = await getLearningQuestMasteryPayload({
            userId: serverUser.userId,
            skill: 'reading',
            currentLevel: exercise.cefrLevel,
            sourceActionId: exercise.exerciseId,
            sourceActionType: 'reading_task',
            source: 'reading.submit',
            persistBadgeUnlock: true,
        }).catch(() => ({}))
        const questEpisodeReceipt = eligibleQuestEpisode
            ? buildReadingQuestEpisodeReceipt({
                episodeId: eligibleQuestEpisode.episodeId,
                exerciseId: exercise.exerciseId,
                cefrLevel: exercise.cefrLevel,
                accuracy: percentage,
                totalQuestions,
                answeredQuestions: Object.keys(answers).length,
                checkpointCount: eligibleQuestEpisode.checkpointCount,
                nextEpisodeHref: eligibleQuestEpisode.nextEpisodeHref,
            })
            : null

        return NextResponse.json({
            success: true,
            data: {
                attemptId: attempt.id,
                score,
                totalQuestions,
                percentage,
                xpEarned: progress.xpEarned,
                ...(questEpisodeReceipt ? {
                    questEpisodeReceipt,
                    nextEpisodeHref: questEpisodeReceipt.nextEpisodeHref,
                } : {}),
                ...buildLearningQuestRewardPayload({
                    skill: 'reading',
                    xpEarned: progress.xpEarned,
                    fucoin,
                    streak: progress.streak,
                    ...mastery,
                }),
                streak: progress.streak,
                timeTaken,
                questionResults,
            },
        })
    } catch (error) {
        return handleApiError(error)
    }
}
