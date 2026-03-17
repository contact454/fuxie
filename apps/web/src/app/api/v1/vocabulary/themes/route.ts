import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@fuxie/database'
import { withAuth } from '@/lib/auth/middleware'
import { handleApiError } from '@/lib/api/error-handler'

const VALID_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const

const querySchema = z.object({
    level: z.enum(VALID_LEVELS).default('A1'),
})

/**
 * GET /api/v1/vocabulary/themes
 * List vocabulary themes with word counts + user SRS progress
 */
export async function GET(req: NextRequest) {
    try {
        const auth = await withAuth(req)

        const params = Object.fromEntries(req.nextUrl.searchParams)
        const { level } = querySchema.parse(params)

        // Get DB user
        const user = await prisma.user.findUnique({
            where: { firebaseUid: auth.userId },
            select: { id: true },
        })

        const themes = await prisma.vocabularyTheme.findMany({
            where: { cefrLevel: level },
            orderBy: { sortOrder: 'asc' },
            select: {
                id: true,
                slug: true,
                name: true,
                nameVi: true,
                nameEn: true,
                cefrLevel: true,
                sortOrder: true,
                imageUrl: true,
                _count: {
                    select: { items: true },
                },
            },
        })

        // Get user's SRS progress per theme
        let srsProgress: Record<string, { total: number; learned: number; due: number }> = {}
        if (user) {
            const cards = await prisma.srsCard.findMany({
                where: { userId: user.id },
                select: {
                    vocabularyItem: { select: { themeId: true } },
                    state: true,
                    nextReviewAt: true,
                },
            })

            const now = new Date()
            for (const card of cards) {
                const themeId = card.vocabularyItem?.themeId
                if (!themeId) continue
                if (!srsProgress[themeId]) {
                    srsProgress[themeId] = { total: 0, learned: 0, due: 0 }
                }
                srsProgress[themeId].total++
                if (card.state === 2) srsProgress[themeId].learned++
                if (card.nextReviewAt <= now) srsProgress[themeId].due++
            }
        }

        const data = themes.map((theme) => ({
            ...theme,
            wordCount: theme._count.items,
            _count: undefined,
            srsProgress: srsProgress[theme.id] ?? { total: 0, learned: 0, due: 0 },
        }))

        return NextResponse.json({ success: true, data })
    } catch (error) {
        return handleApiError(error)
    }
}
