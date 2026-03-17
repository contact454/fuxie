import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@fuxie/database'

// GET /api/v1/writing?level=A1 — List writing exercises grouped by Teil
export async function GET(req: NextRequest) {
    try {
        const level = req.nextUrl.searchParams.get('level') || 'A1'

        const exercises = await prisma.writingExercise.findMany({
            where: { cefrLevel: level as any },
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
        })
    } catch (error) {
        console.error('[Writing API] Error:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to load writing data' },
            { status: 500 }
        )
    }
}
