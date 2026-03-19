import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@fuxie/database'

const VALID_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const
const querySchema = z.object({ level: z.enum(VALID_LEVELS).default('A1') })

// GET /api/v1/reading?level=A1 — List reading exercises grouped by Teil
export async function GET(req: NextRequest) {
    try {
        const { level } = querySchema.parse({
            level: req.nextUrl.searchParams.get('level') || undefined,
        })

        const exercises = await prisma.readingExercise.findMany({
            where: { cefrLevel: level },
            orderBy: [{ teil: 'asc' }, { sortOrder: 'asc' }],
            select: {
                id: true,
                exerciseId: true,
                cefrLevel: true,
                teil: true,
                teilName: true,
                topic: true,
                metadataJson: true,
                sortOrder: true,
                _count: { select: { questions: true } },
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
        console.error('[Reading API] Error:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to load reading data' },
            { status: 500 }
        )
    }
}
