import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@fuxie/database'

const VALID_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const
const querySchema = z.object({ level: z.enum(VALID_LEVELS).default('A1') })

// GET /api/v1/writing?level=A1 — List writing exercises grouped by Teil
export async function GET(req: NextRequest) {
    try {
        const { level } = querySchema.parse({
            level: req.nextUrl.searchParams.get('level') || undefined,
        })

        const exercises = await prisma.writingExercise.findMany({
            where: { cefrLevel: level },
            orderBy: [{ teil: 'asc' }, { sortOrder: 'asc' }],
            select: {
                id: true,
                exerciseId: true,
                cefrLevel: true,
                teil: true,
                teilName: true,
                topic: true,
                textType: true,
                register: true,
                minWords: true,
                maxWords: true,
                timeMinutes: true,
                sortOrder: true,
            },
        })

        // Group by Teil
        const teilMap: Record<number, {
            teil: number
            teilName: string
            exercises: typeof exercises
            totalExercises: number
        }> = {}

        for (const ex of exercises) {
            if (!teilMap[ex.teil]) {
                teilMap[ex.teil] = {
                    teil: ex.teil,
                    teilName: ex.teilName,
                    exercises: [],
                    totalExercises: 0,
                }
            }
            const entry = teilMap[ex.teil]!
            entry.exercises.push(ex)
            entry.totalExercises++
        }

        const teile = Object.values(teilMap).sort((a, b) => a.teil - b.teil)

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
        console.error('[Writing API] Error:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to load writing data' },
            { status: 500 }
        )
    }
}
