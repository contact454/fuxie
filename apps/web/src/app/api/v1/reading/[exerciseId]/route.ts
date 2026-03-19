import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@fuxie/database'

// GET /api/v1/reading/:exerciseId — Get single reading exercise with questions
export async function GET(
    _req: NextRequest,
    { params }: { params: Promise<{ exerciseId: string }> }
) {
    try {
        const { exerciseId } = await params

        const exercise = await prisma.readingExercise.findUnique({
            where: { exerciseId },
            select: {
                exerciseId: true,
                cefrLevel: true,
                teil: true,
                teilName: true,
                topic: true,
                textsJson: true,
                imagesJson: true,
                questions: {
                    select: {
                        id: true,
                        questionNumber: true,
                        questionType: true,
                        statement: true,
                        linkedText: true,
                        options: true,
                        sortOrder: true,
                        // NOTE: correctAnswer intentionally excluded to prevent leaking answers
                    },
                    orderBy: { sortOrder: 'asc' },
                },
            },
        })

        if (!exercise) {
            return NextResponse.json(
                { success: false, error: 'Exercise not found' },
                { status: 404 }
            )
        }

        return NextResponse.json({ success: true, data: exercise }, {
            headers: {
                'Cache-Control': 'private, max-age=60, stale-while-revalidate=300',
            },
        })
    } catch (error) {
        console.error('[Reading API] Error:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to load exercise' },
            { status: 500 }
        )
    }
}
