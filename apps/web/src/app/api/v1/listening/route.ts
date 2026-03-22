import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getListeningLessonList, groupListeningLessonsByTeil, type CefrLevel } from '@/lib/content/listening'

const VALID_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const
const querySchema = z.object({ level: z.enum(VALID_LEVELS).default('A1') })

// GET /api/v1/listening?level=A1 — List listening lessons grouped by Teil
export async function GET(req: NextRequest) {
    try {
        const { level } = querySchema.parse({
            level: req.nextUrl.searchParams.get('level') || undefined,
        })

        const lessons = await getListeningLessonList(level as CefrLevel)
        const teile = groupListeningLessonsByTeil(lessons)

        return NextResponse.json({
            success: true,
            data: {
                level,
                totalLessons: lessons.length,
                teile,
            },
        }, {
            headers: {
                'Cache-Control': 'private, max-age=60, stale-while-revalidate=300',
            },
        })
    } catch (error) {
        console.error('[Listening API] Error:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to load listening data' },
            { status: 500 }
        )
    }
}
