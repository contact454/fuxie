import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@fuxie/database'
import { withAuth, NotFoundError } from '@/lib/auth/middleware'
import { handleApiError } from '@/lib/api/error-handler'
import { calculateReview, createNewCard } from '@fuxie/srs-engine'
import { XP_REWARDS } from '@fuxie/shared/constants'
import type { SrsRating } from '@fuxie/shared/types'

/**
 * GET /api/v1/srs/review
 * Get due cards for the current user
 */
export async function GET(req: NextRequest) {
    try {
        const auth = await withAuth(req)
        const user = await prisma.user.findUnique({
            where: { firebaseUid: auth.userId },
            select: { id: true },
        })
        if (!user) throw new NotFoundError('User not found')

        const limit = Number(req.nextUrl.searchParams.get('limit') ?? '20')

        const cards = await prisma.srsCard.findMany({
            where: {
                userId: user.id,
                nextReviewAt: { lte: new Date() },
            },
            orderBy: { nextReviewAt: 'asc' },
            take: Math.min(limit, 50),
            select: {
                id: true,
                interval: true,
                repetitions: true,
                easeFactor: true,
                nextReviewAt: true,
                state: true,
                totalReviews: true,
                totalCorrect: true,
                lapseCount: true,
                vocabularyItem: {
                    select: {
                        id: true,
                        word: true,
                        article: true,
                        plural: true,
                        wordType: true,
                        cefrLevel: true,
                        meaningVi: true,
                        meaningEn: true,
                        ipa: true,
                        audioUrl: true,
                        imageUrl: true,
                        exampleSentence1: true,
                        exampleTranslation1: true,
                        exampleSentence2: true,
                        exampleTranslation2: true,
                        notes: true,
                        conjugation: true,
                    },
                },
            },
        })

        // Also get total due count
        const totalDue = await prisma.srsCard.count({
            where: {
                userId: user.id,
                nextReviewAt: { lte: new Date() },
            },
        })

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
        const user = await prisma.user.findUnique({
            where: { firebaseUid: auth.userId },
            select: { id: true },
        })
        if (!user) throw new NotFoundError('User not found')

        const body = await req.json()
        const { cardId, rating, responseTimeMs } = reviewSchema.parse(body)

        // Get current card
        const card = await prisma.srsCard.findFirst({
            where: { id: cardId, userId: user.id },
        })
        if (!card) throw new NotFoundError('Card not found')

        // Calculate SM-2 review
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

        // Calculate XP
        const xpEarned = rating === 'AGAIN' ? 0 : XP_REWARDS.SRS_CORRECT

        // Update card + create review log + update stats in transaction
        const todayStart = new Date()
        todayStart.setHours(0, 0, 0, 0)

        await prisma.$transaction([
            // 1. Update SRS card
            prisma.srsCard.update({
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
            }),
            // 2. Create review log
            prisma.srsReviewLog.create({
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
            }),
            // 3. Update daily activity
            prisma.dailyActivity.upsert({
                where: {
                    userId_date: {
                        userId: user.id,
                        date: todayStart,
                    },
                },
                update: {
                    srsReviewed: { increment: 1 },
                    xpEarned: { increment: xpEarned },
                },
                create: {
                    userId: user.id,
                    date: todayStart,
                    srsReviewed: 1,
                    xpEarned,
                },
            }),
            // 4. Update user profile XP
            prisma.userProfile.updateMany({
                where: { userId: user.id },
                data: {
                    totalXp: { increment: xpEarned },
                },
            }),
        ])

        return NextResponse.json({
            success: true,
            data: {
                cardId,
                newInterval: result.interval,
                newState: result.state,
                nextReviewAt: result.nextReviewAt.toISOString(),
                xpEarned,
            },
        })
    } catch (error) {
        return handleApiError(error)
    }
}
