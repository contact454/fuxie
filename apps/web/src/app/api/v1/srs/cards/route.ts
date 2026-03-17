import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@fuxie/database'
import { withAuth, NotFoundError } from '@/lib/auth/middleware'
import { handleApiError } from '@/lib/api/error-handler'

const createCardsSchema = z.object({
    themeSlug: z.string().optional(),
    vocabularyItemIds: z.array(z.string().uuid()).optional(),
}).refine((data) => data.themeSlug || data.vocabularyItemIds, {
    message: 'Either themeSlug or vocabularyItemIds must be provided',
})

/**
 * POST /api/v1/srs/cards
 * Create SRS cards from vocabulary items (by theme or specific IDs)
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
        const { themeSlug, vocabularyItemIds } = createCardsSchema.parse(body)

        // Get vocabulary items
        let itemIds: string[] = []

        if (themeSlug) {
            const theme = await prisma.vocabularyTheme.findUnique({
                where: { slug: themeSlug },
                select: { id: true },
            })
            if (!theme) throw new NotFoundError('Theme not found')

            const items = await prisma.vocabularyItem.findMany({
                where: { themeId: theme.id },
                select: { id: true },
            })
            itemIds = items.map((i) => i.id)
        } else if (vocabularyItemIds) {
            itemIds = vocabularyItemIds
        }

        // Filter out items that already have SRS cards for this user
        const existingCards = await prisma.srsCard.findMany({
            where: {
                userId: user.id,
                vocabularyItemId: { in: itemIds },
            },
            select: { vocabularyItemId: true },
        })
        const existingIds = new Set(existingCards.map((c) => c.vocabularyItemId))
        const newIds = itemIds.filter((id) => !existingIds.has(id))

        if (newIds.length === 0) {
            return NextResponse.json({
                success: true,
                data: { created: 0, skipped: itemIds.length, message: 'All cards already exist' },
            })
        }

        // Batch create SRS cards
        const result = await prisma.srsCard.createMany({
            data: newIds.map((vocabId) => ({
                userId: user.id,
                vocabularyItemId: vocabId,
                interval: 0,
                repetitions: 0,
                easeFactor: 2.5,
                state: 0,
                nextReviewAt: new Date(), // Due immediately
                lapseCount: 0,
            })),
            skipDuplicates: true,
        })

        return NextResponse.json({
            success: true,
            data: {
                created: result.count,
                skipped: itemIds.length - result.count,
            },
        })
    } catch (error) {
        return handleApiError(error)
    }
}
