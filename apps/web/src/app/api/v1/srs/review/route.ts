import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@fuxie/database'
import { withAuth, NotFoundError } from '@/lib/auth/middleware'
import { getDbUserByFirebaseUid } from '@/lib/auth/db-user'
import { handleApiError } from '@/lib/api/error-handler'
import { calculateReview } from '@fuxie/srs-engine'
import { countDueSrsCards, getDueSrsCards } from '@/lib/srs/due-cards'
import { XP_REWARDS } from '@fuxie/shared/constants'
import type { SrsRating } from '@fuxie/shared/types'
import { recordLearningActivity } from '@/lib/progress/learning-activity'
import { invalidateLearnerSrsCaches } from '@/lib/progress/cache-invalidation'

/**
 * GET /api/v1/srs/review
 * Get due cards for the current user
 */
export async function GET(req: NextRequest) {
    try {
        const auth = await withAuth(req)
        const user = await getDbUserByFirebaseUid(auth.userId)
        if (!user) throw new NotFoundError('User not found')

        const limit = Number(req.nextUrl.searchParams.get('limit') ?? '20')
        const now = new Date()

        const [cards, totalDue] = await Promise.all([
            getDueSrsCards({ userId: user.id, now, limit }),
            countDueSrsCards({ userId: user.id, now }),
        ])

        return NextResponse.json({
            success: true,
            data: {
                cards,
                totalDue,
                sessionSize: cards.length,
            },
        })
    } catch (error) {
        return handleApiError(error)
    }
}

const reviewSchema = z.object({
    cardId: z.string().uuid(),
    rating: z.enum(['AGAIN', 'HARD', 'GOOD', 'EASY']),
    responseTimeMs: z.number().int().optional(),
})

/**
 * POST /api/v1/srs/review
 * Submit a review for a card
 */
export async function POST(req: NextRequest) {
    try {
        const auth = await withAuth(req)
        const user = await getDbUserByFirebaseUid(auth.userId)
        if (!user) throw new NotFoundError('User not found')

        const body = await req.json()
        const { cardId, rating, responseTimeMs } = reviewSchema.parse(body)

        const card = await prisma.srsCard.findFirst({
            where: { id: cardId, userId: user.id },
        })
        if (!card) throw new NotFoundError('Card not found')

        const result = calculateReview(
            {
                interval: card.interval,
                repetitions: card.repetitions,
                easeFactor: card.easeFactor,
                state: card.state,
                lapseCount: card.lapseCount,
            },
            rating as SrsRating
        )

        const baseXpEarned = rating === 'AGAIN' ? 0 : XP_REWARDS.SRS_CORRECT

        const progress = await prisma.$transaction(async (tx) => {
            await tx.srsCard.update({
                where: { id: cardId },
                data: {
                    interval: result.interval,
                    repetitions: result.repetitions,
                    easeFactor: result.easeFactor,
                    state: result.state,
                    lapseCount: result.lapseCount,
                    nextReviewAt: result.nextReviewAt,
                    lastReviewedAt: new Date(),
                    totalReviews: { increment: 1 },
                    totalCorrect: rating !== 'AGAIN' ? { increment: 1 } : undefined,
                    totalIncorrect: rating === 'AGAIN' ? { increment: 1 } : undefined,
                },
            })

            await tx.srsReviewLog.create({
                data: {
                    userId: user.id,
                    cardId,
                    rating: rating as SrsRating,
                    responseTimeMs,
                    prevInterval: card.interval,
                    prevEaseFactor: card.easeFactor,
                    prevState: card.state,
                    newInterval: result.interval,
                    newEaseFactor: result.easeFactor,
                    newState: result.state,
                },
            })

            return recordLearningActivity(tx, {
                userId: user.id,
                xpEarned: baseXpEarned,
                srsReviewed: 1,
                updateStreak: true,
                analytics: {
                    actionId: cardId,
                    actionType: 'srs_review',
                    skill: 'SRS',
                    source: 'srs.review',
                    metadata: {
                        response_time_ms: responseTimeMs ?? null,
                    },
                },
            })
        })

        invalidateLearnerSrsCaches(user.id).catch(() => {})

        return NextResponse.json({
            success: true,
            data: {
                cardId,
                newInterval: result.interval,
                newState: result.state,
                nextReviewAt: result.nextReviewAt.toISOString(),
                xpEarned: progress.xpEarned,
                streak: progress.streak,
            },
        })
    } catch (error) {
        return handleApiError(error)
    }
}
