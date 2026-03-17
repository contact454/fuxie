import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@fuxie/database'

// GET /api/v1/listening?level=A1 — List listening lessons grouped by Teil
export async function GET(req: NextRequest) {
    try {
        const level = req.nextUrl.searchParams.get('level') || 'A1'

        const lessons = await prisma.listeningLesson.findMany({
            where: { cefrLevel: level as any },
            orderBy: [{ teil: 'asc' }, { sortOrder: 'asc' }],
            select: {
                id: true,
                lessonId: true,
                cefrLevel: true,
                teil: true,
                teilName: true,
                title: true,
                topic: true,
                taskType: true,
                audioUrl: true,
                audioDuration: true,
                backgroundScene: true,
                sortOrder: true,
                _count: { select: { questions: true } },
            },
        })

        // Group by Teil
        const teilMap: Record<number, {
            teil: number
            teilName: string
            lessons: typeof lessons
            totalLessons: number
        }> = {}

        for (const lesson of lessons) {
            if (!teilMap[lesson.teil]) {
                teilMap[lesson.teil] = {
                    teil: lesson.teil,
                    teilName: lesson.teilName,
                    lessons: [],
                    totalLessons: 0,
                }
            }
            const entry = teilMap[lesson.teil]!
            entry.lessons.push(lesson)
            entry.totalLessons++
        }

        const teile = Object.values(teilMap).sort((a, b) => a.teil - b.teil)

        return NextResponse.json({
            success: true,
            data: {
                level,
                totalLessons: lessons.length,
                teile,
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
