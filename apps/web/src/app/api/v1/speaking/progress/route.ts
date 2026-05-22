import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@fuxie/database'
import { getServerUser } from '@/lib/auth/server-auth'
import { z } from 'zod'
import { buildLearningQuestRewardPayload } from '@/lib/gamification/learning-quest-rewards'
import { buildSpeakingQuestEpisodeReceipt } from '@/lib/gamification/speaking-quest-episode'
import { getLearningQuestMasteryPayload } from '@/lib/gamification/skill-mastery-data'
import { calculateSpeakingXp, recordLearningActivity } from '@/lib/progress/learning-activity'
import { invalidateLearnerProgressCaches } from '@/lib/progress/cache-invalidation'
import { recordAnalyticsEvent } from '@/lib/analytics/events'

const SpeakingProgressSchema = z.object({
    lessonId: z.string().min(1),
    score: z.number().int().min(0).max(100),
    maxScore: z.number().int().min(1).max(100),
    stars: z.number().int().min(0).max(3),
    questEpisode: z.object({
        episodeId: z.string().max(180),
        skill: z.literal('speaking'),
        sourceId: z.string().max(180),
        cefrLevel: z.string().max(12),
        checkpointCount: z.number().int().min(1).max(6),
        completedCheckpoints: z.number().int().min(0).max(6).optional(),
        nextEpisodeHref: z.string().max(240).optional(),
        exerciseType: z.literal('nachsprechen').optional(),
        pronunciationFeedbackState: z.enum(['evaluated', 'needs_retry', 'failed']).optional(),
    }).optional(),
})

export async function POST(req: NextRequest) {
    try {
        const serverUser = await getServerUser()
        if (!serverUser) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

        const { enforceRateLimit, getRequestClientKey } = await import('@/lib/api/rate-limit')
        const limited = enforceRateLimit(getRequestClientKey(req, serverUser.userId) + ':speaking-progress', {
            keyPrefix: 'gamification-anti-cheat',
            windowMs: 60_000, // 1 minute window
            max: 5, // max 5 lesson completions per minute (humans take at least 15s per lesson)
        })
        if (limited) return limited

        const body = await req.json()
        const parsed = SpeakingProgressSchema.safeParse(body)
        if (!parsed.success) {
            return NextResponse.json(
                { error: 'Invalid input', details: parsed.error.flatten().fieldErrors },
                { status: 400 }
            )
        }
        const { lessonId, score, maxScore, stars, questEpisode } = parsed.data
        const percentScore = Math.round((score / maxScore) * 100)
        const meaningfulCompletion = percentScore > 0
        const eligibleQuestEpisode = questEpisode
            && questEpisode.sourceId === lessonId
            && (questEpisode.exerciseType ?? 'nachsprechen') === 'nachsprechen'
            && meaningfulCompletion
            ? questEpisode
            : null

        const result = await prisma.$transaction(async (tx) => {
            const existing = await tx.speakingProgress.findFirst({
                where: { userId: serverUser.userId, lessonId },
                select: { id: true, score: true, attempts: true, completed: true },
            })

            const now = new Date()
            const firstCompletion = !existing?.completed

            const savedProgress = await (existing
                ? tx.speakingProgress.update({
                    where: { id: existing.id },
                    data: {
                        ...(score > (existing.score ?? 0) ? { score, maxScore, stars } : {}),
                        completed: true,
                        attempts: (existing.attempts ?? 0) + 1,
                        lastAt: now,
                    },
                })
                : tx.speakingProgress.create({
                    data: {
                        userId: serverUser.userId,
                        lessonId,
                        score,
                        maxScore,
                        stars,
                        completed: true,
                        attempts: 1,
                        lastAt: now,
                    },
                }))

            const questEpisodeReceipt = eligibleQuestEpisode
                ? buildSpeakingQuestEpisodeReceipt({
                    episodeId: eligibleQuestEpisode.episodeId,
                    lessonId,
                    cefrLevel: eligibleQuestEpisode.cefrLevel,
                    scorePercent: percentScore,
                    completedCheckpoints: eligibleQuestEpisode.completedCheckpoints,
                    checkpointCount: eligibleQuestEpisode.checkpointCount,
                    nextEpisodeHref: eligibleQuestEpisode.nextEpisodeHref,
                    pronunciationFeedbackState: eligibleQuestEpisode.pronunciationFeedbackState ?? (percentScore >= 50 ? 'evaluated' : 'needs_retry'),
                })
                : null

            const activity = meaningfulCompletion
                ? await recordLearningActivity(tx, {
                    userId: serverUser.userId,
                    lessonId,
                    score,
                    maxScore,
                    percentScore,
                    xpEarned: calculateSpeakingXp(),
                    lessonsCompleted: firstCompletion ? 1 : 0,
                    exercisesCompleted: firstCompletion ? 0 : 1,
                    analytics: {
                        role: serverUser.role,
                        actionId: lessonId,
                        actionType: 'speaking_submission',
                        skill: 'SPRECHEN',
                        source: 'speaking.progress',
                        metadata: {
                            first_completion: firstCompletion,
                            ...(eligibleQuestEpisode ? {
                                episode_id: eligibleQuestEpisode.episodeId,
                                checkpoint_count: eligibleQuestEpisode.checkpointCount,
                            } : {}),
                        },
                    },
                })
                : { xpEarned: 0, streak: null }

            if (questEpisodeReceipt) {
                await recordAnalyticsEvent(tx, {
                    userId: serverUser.userId,
                    role: serverUser.role,
                    eventName: 'quest_episode_completed',
                    source: 'speaking.quest_episode.completed',
                    actionId: questEpisodeReceipt.episodeId,
                    actionType: 'speaking_submission',
                    level: questEpisodeReceipt.cefrLevel,
                    skill: 'speaking',
                    metadata: {
                        episodeId: questEpisodeReceipt.episodeId,
                        skill: 'speaking',
                        lessonId,
                        cefrLevel: questEpisodeReceipt.cefrLevel,
                        checkpointId: 'refine',
                        checkpointCount: questEpisodeReceipt.checkpointCount,
                        scorePercent: percentScore,
                        accuracyBand: questEpisodeReceipt.accuracyBand,
                        feedbackState: questEpisodeReceipt.pronunciationFeedbackState,
                    },
                })
            }

            return {
                ...activity,
                progressId: savedProgress.id,
                questEpisodeReceipt,
            }
        })

        invalidateLearnerProgressCaches(serverUser.userId).catch(() => {})
        const mastery = await getLearningQuestMasteryPayload({
            userId: serverUser.userId,
            skill: 'speaking',
            currentLevel: eligibleQuestEpisode?.cefrLevel,
            ...(eligibleQuestEpisode ? {
                sourceActionId: result.progressId,
                sourceActionType: 'speaking_submission' as const,
                source: 'speaking.progress',
                persistBadgeUnlock: true,
            } : {}),
        }).catch(() => ({}))

        return NextResponse.json({
            ok: true,
            saved: true,
            xpEarned: result.xpEarned,
            streak: result.streak,
            ...(result.questEpisodeReceipt ? {
                questEpisodeReceipt: result.questEpisodeReceipt,
                nextEpisodeHref: result.questEpisodeReceipt.nextEpisodeHref,
            } : {}),
            ...buildLearningQuestRewardPayload({
                skill: 'speaking',
                xpEarned: result.xpEarned,
                streak: result.streak,
                nextQuestHref: result.questEpisodeReceipt?.nextEpisodeHref,
                ...mastery,
            }),
        })
    } catch (error) {
        console.error('[Speaking Progress API] Error:', error)
        return NextResponse.json(
            { error: 'Failed to save speaking progress' },
            { status: 500 }
        )
    }
}
