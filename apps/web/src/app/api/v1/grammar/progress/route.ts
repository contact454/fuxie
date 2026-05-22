import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@fuxie/database'
import { getServerUser } from '@/lib/auth/server-auth'
import { z } from 'zod'
import { awardLearningFucoin } from '@/lib/gamification/fucoin'
import { buildGrammarQuestEpisodeReceipt } from '@/lib/gamification/grammar-quest-episode'
import { buildLearningQuestRewardPayload } from '@/lib/gamification/learning-quest-rewards'
import { chooseQuestEpisodeRoute } from '@/lib/gamification/quest-episode-routing'
import { getLearningQuestMasteryPayload } from '@/lib/gamification/skill-mastery-data'
import { getTodayPlan } from '@/lib/personalization/today-plan'
import { calculateGrammarXp, recordLearningActivity } from '@/lib/progress/learning-activity'
import { invalidateLearnerProgressCaches } from '@/lib/progress/cache-invalidation'

const GrammarProgressSchema = z.object({
    lessonId: z.string().min(1),
    score: z.number().int().min(0),
    maxScore: z.number().int().min(1),
    stars: z.number().int().min(0).max(3),
    questEpisode: z.object({
        episodeId: z.string().max(180),
        skill: z.literal('grammar'),
        sourceId: z.string().max(180),
        cefrLevel: z.string().max(12),
        checkpointCount: z.number().int().min(1).max(6),
        nextEpisodeHref: z.string().max(240).optional(),
        currentEpisodeHref: z.string().max(240).optional(),
    }).optional(),
})

export async function POST(req: NextRequest) {
    try {
        const serverUser = await getServerUser()
        if (!serverUser) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

        const body = await req.json()
        const parsed = GrammarProgressSchema.safeParse(body)
        if (!parsed.success) {
            return NextResponse.json(
                { error: 'Invalid input', details: parsed.error.flatten().fieldErrors },
                { status: 400 }
            )
        }
        const { lessonId, score, maxScore, stars, questEpisode } = parsed.data
        const percentScore = Math.round((score / maxScore) * 100)
        const eligibleQuestEpisode = questEpisode && questEpisode.sourceId === lessonId
            ? questEpisode
            : null

        const result = await prisma.$transaction(async (tx) => {
            const existing = await tx.grammarProgress.findFirst({
                where: { userId: serverUser.userId, lessonId },
                select: { id: true, score: true, attempts: true, completed: true },
            })

            const now = new Date()
            const firstCompletion = !existing?.completed

            await (existing
                ? tx.grammarProgress.update({
                    where: { id: existing.id },
                    data: {
                        ...(score > (existing.score ?? 0) ? { score, maxScore, stars } : {}),
                        completed: true,
                        attempts: (existing.attempts ?? 0) + 1,
                        lastAt: now,
                    },
                })
                : tx.grammarProgress.create({
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

            const progress = await recordLearningActivity(tx, {
                userId: serverUser.userId,
                lessonId,
                score,
                maxScore,
                percentScore,
                xpEarned: calculateGrammarXp(percentScore),
                lessonsCompleted: firstCompletion ? 1 : 0,
                exercisesCompleted: firstCompletion ? 0 : 1,
                analytics: {
                    role: serverUser.role,
                    actionId: lessonId,
                    actionType: 'lesson_session',
                    skill: 'GRAMMATIK',
                    source: 'grammar.progress',
                    metadata: {
                        first_completion: firstCompletion,
                        ...(eligibleQuestEpisode ? {
                            episode_id: eligibleQuestEpisode.episodeId,
                            checkpoint_count: eligibleQuestEpisode.checkpointCount,
                        } : {}),
                    },
                },
            })

            const fucoin = await awardLearningFucoin(tx, {
                userId: serverUser.userId,
                kind: 'lesson',
                sourceType: 'learning:grammar',
                sourceId: lessonId,
                accuracy: percentScore,
                reason: `Grammar ${lessonId}`,
                metadata: {
                    lessonId,
                    score,
                    maxScore,
                    percentScore,
                    firstCompletion,
                    ...(eligibleQuestEpisode ? {
                        episodeId: eligibleQuestEpisode.episodeId,
                        checkpointCount: eligibleQuestEpisode.checkpointCount,
                    } : {}),
                },
            })

            return { progress, fucoin }
        })

        invalidateLearnerProgressCaches(serverUser.userId).catch(() => {})
        const mastery = await getLearningQuestMasteryPayload({
            userId: serverUser.userId,
            skill: 'grammar',
            sourceActionId: lessonId,
            sourceActionType: 'lesson_session',
            source: 'grammar.progress',
            persistBadgeUnlock: true,
        }).catch(() => ({}))
        const todayPlan = await getTodayPlan(serverUser.userId).catch(() => null)
        const routeDecision = eligibleQuestEpisode
            ? chooseQuestEpisodeRoute({
                currentSkill: 'grammar',
                accuracy: percentScore,
                fallbackHref: eligibleQuestEpisode.nextEpisodeHref ?? '/grammar',
                retryHref: eligibleQuestEpisode.currentEpisodeHref,
                todayPlanActions: todayPlan?.actions,
                weakSkills: todayPlan?.weakSkills,
            })
            : null
        const questEpisodeReceipt = eligibleQuestEpisode
            ? buildGrammarQuestEpisodeReceipt({
                episodeId: eligibleQuestEpisode.episodeId,
                lessonId,
                cefrLevel: eligibleQuestEpisode.cefrLevel,
                accuracy: percentScore,
                totalQuestions: maxScore,
                answeredQuestions: maxScore,
                checkpointCount: eligibleQuestEpisode.checkpointCount,
                nextEpisodeHref: routeDecision?.nextEpisodeHref ?? eligibleQuestEpisode.nextEpisodeHref,
            })
            : null

        return NextResponse.json({
            ok: true,
            saved: true,
            xpEarned: result.progress.xpEarned,
            streak: result.progress.streak,
            ...(questEpisodeReceipt ? {
                questEpisodeReceipt,
                nextEpisodeHref: questEpisodeReceipt.nextEpisodeHref,
                episodeRouting: routeDecision,
            } : {}),
            ...buildLearningQuestRewardPayload({
                skill: 'grammar',
                xpEarned: result.progress.xpEarned,
                fucoin: result.fucoin,
                streak: result.progress.streak,
                ...mastery,
            }),
        })
    } catch (error) {
        console.error('[Grammar Progress API] Error:', error)
        return NextResponse.json(
            { error: 'Failed to save grammar progress' },
            { status: 500 }
        )
    }
}
