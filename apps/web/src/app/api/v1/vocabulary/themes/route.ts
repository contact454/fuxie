import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@fuxie/database'
import { withAuth } from '@/lib/auth/middleware'
import { getDbUserByFirebaseUid } from '@/lib/auth/db-user'
import { getVocabularyThemes, mapVocabularyThemes, type CefrLevel } from '@/lib/content/vocabulary'
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
        const user = await getDbUserByFirebaseUid(auth.userId)

        const themes = await getVocabularyThemes(level as CefrLevel)

        // Get user's SRS progress per theme — aggregated in DB (avoids loading thousands of cards into JS)
        let srsProgress: Record<string, { total: number; learned: number; due: number }> = {}
        if (user) {
            const stats = await prisma.$queryRaw<
                { themeId: string; total: bigint; learned: bigint; due: bigint }[]
            >`
                SELECT vi."themeId",
                       COUNT(*)::bigint AS total,
                       COUNT(*) FILTER (WHERE sc.state = 2)::bigint AS learned,
                       COUNT(*) FILTER (WHERE sc."nextReviewAt" <= NOW())::bigint AS due
                FROM srs_cards sc
                JOIN vocabulary_items vi ON vi.id = sc."vocabularyItemId"
                WHERE sc."userId" = ${user.id}
                  AND vi."themeId" IS NOT NULL
                GROUP BY vi."themeId"
            `
            for (const row of stats) {
                srsProgress[row.themeId] = {
                    total: Number(row.total),
                    learned: Number(row.learned),
                    due: Number(row.due),
                }
            }
        }

        const data = mapVocabularyThemes(themes).map((theme) => ({
            ...theme,
            srsProgress: srsProgress[theme.id] ?? { total: 0, learned: 0, due: 0 },
        }))

        return NextResponse.json({ success: true, data }, {
            headers: {
                'Cache-Control': 'private, max-age=60, stale-while-revalidate=300',
            },
        })
    } catch (error) {
        return handleApiError(error)
    }
}
