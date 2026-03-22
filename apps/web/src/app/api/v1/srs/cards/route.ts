import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@fuxie/database'
import { withAuth, NotFoundError } from '@/lib/auth/middleware'
import { getDbUserByFirebaseUid } from '@/lib/auth/db-user'
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
        const user = await getDbUserByFirebaseUid(auth.userId)
        if (!user) throw new NotFoundError('User not found')

        const body = await req.json()
        const { themeSlug, vocabularyItemIds } = createCardsSchema.parse(body)

        // Get vocabulary items
        let itemIds: string[] = []
        let totalRequested = vocabularyItemIds?.length ?? 0

        if (themeSlug) {
            const theme = await prisma.vocabularyTheme.findUnique({
                where: { slug: themeSlug },
                select: { id: true },
            })
            if (!theme) throw new NotFoundError('Theme not found')

            const [totalItems, newItems] = await Promise.all([
                prisma.vocabularyItem.count({
                    where: { themeId: theme.id },
                }),
                prisma.vocabularyItem.findMany({
                    where: {
                        themeId: theme.id,
                        srsCards: {
                            none: { userId: user.id },
                        },
                    },
                    select: { id: true },
                }),
            ])
            totalRequested = totalItems
            itemIds = newItems.map((item) => item.id)

            if (itemIds.length === 0) {
                return NextResponse.json({
                    success: true,
                    data: { created: 0, skipped: totalItems, message: 'All cards already exist' },
                })
            }
        } else if (vocabularyItemIds) {
            const newItems = await prisma.vocabularyItem.findMany({
                where: {
                    id: { in: vocabularyItemIds },
                    srsCards: {
                        none: { userId: user.id },
                    },
                },
                select: { id: true },
            })
            itemIds = newItems.map((item) => item.id)

            if (itemIds.length === 0) {
                return NextResponse.json({
                    success: true,
                    data: { created: 0, skipped: vocabularyItemIds.length, message: 'All cards already exist' },
                })
            }
        }

        // Batch create SRS cards
        const result = await prisma.srsCard.createMany({
            data: itemIds.map((vocabId) => ({
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
                skipped: totalRequested - result.count,
            },
        })
    } catch (error) {
        return handleApiError(error)
    }
}
