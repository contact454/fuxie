import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@fuxie/database'

// GET /api/v1/listening/:lessonId — Get lesson with questions
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ lessonId: string }> }
) {
    try {
        const { lessonId } = await params

        const lesson = await prisma.listeningLesson.findUnique({
            where: { lessonId },
            include: {
                questions: {
                    orderBy: { sortOrder: 'asc' },
                    select: {
                        id: true,
                        questionNumber: true,
                        questionType: true,
                        questionText: true,
                        questionTextVi: true,
                        options: true,
                        sortOrder: true,
                    },
                },
            },
        })

        if (!lesson) {
            return NextResponse.json(
                { success: false, error: 'Lesson not found' },
                { status: 404 }
            )
        }

        return NextResponse.json({ success: true, data: lesson })
    } catch (error) {
        console.error('[Listening API] Error:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to load lesson' },
            { status: 500 }
        )
    }
}
