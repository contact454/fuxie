import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { withAuth } from '@/lib/auth/middleware'
import { getDbUserByFirebaseUid } from '@/lib/auth/db-user'
import { getVocabularyThemes, mapVocabularyThemes, type CefrLevel } from '@/lib/content/vocabulary'
import { getVocabularyThemeSrsProgress } from '@/lib/srs/stats'
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

        const user = await getDbUserByFirebaseUid(auth.userId)
        const themes = await getVocabularyThemes(level as CefrLevel)
        const srsProgress = user
            ? await getVocabularyThemeSrsProgress(user.id, level)
            : {}

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
