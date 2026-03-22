import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getReadingExerciseList, groupReadingExercisesByTeil, type CefrLevel } from '@/lib/content/reading'

const VALID_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const
const querySchema = z.object({ level: z.enum(VALID_LEVELS).default('A1') })

// GET /api/v1/reading?level=A1 — List reading exercises grouped by Teil
export async function GET(req: NextRequest) {
    try {
        const { level } = querySchema.parse({
            level: req.nextUrl.searchParams.get('level') || undefined,
        })

        const exercises = await getReadingExerciseList(level as CefrLevel)
        const teile = groupReadingExercisesByTeil(exercises)

        return NextResponse.json({
            success: true,
            data: {
                level,
                totalExercises: exercises.length,
                teile,
            },
        }, {
            headers: {
                'Cache-Control': 'private, max-age=60, stale-while-revalidate=300',
            },
        })
    } catch (error) {
        console.error('[Reading API] Error:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to load reading data' },
            { status: 500 }
        )
    }
}
