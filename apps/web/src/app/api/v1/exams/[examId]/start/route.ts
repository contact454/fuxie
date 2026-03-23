import { NextResponse } from 'next/server'
import { prisma } from '@fuxie/database'
import { getServerUser } from '@/lib/auth/server-auth'

/**
 * POST /api/v1/exams/[examId]/start
 * Creates an ExamAttempt and returns exam structure (without answers)
 */
export async function POST(
    _request: Request,
    { params }: { params: Promise<{ examId: string }> }
) {
    try {
        const user = await getServerUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { examId } = await params

        // Fetch exam with full structure
        const exam = await prisma.examTemplate.findUnique({
            where: { id: examId },
            select: {
                id: true,
                slug: true,
                title: true,
                examType: true,
                cefrLevel: true,
                totalMinutes: true,
                totalPoints: true,
                passingScore: true,
                sections: {
                    orderBy: { sortOrder: 'asc' },
                    select: {
                        id: true,
                        title: true,
                        skill: true,
                        totalMinutes: true,
                        totalPoints: true,
                        instructions: true,
                        tasks: {
                            orderBy: { sortOrder: 'asc' },
                            select: {
                                id: true,
                                title: true,
                                exerciseType: true,
                                contentJson: true,
                                audioUrl: true,
                                imageUrl: true,
                                maxPoints: true,
                            },
                        },
                    },
                },
            },
        })

        if (!exam) {
            return NextResponse.json({ error: 'Exam not found' }, { status: 404 })
        }

        // Strip correct answers from contentJson
        const sanitizedSections = exam.sections.map(section => ({
            ...section,
            tasks: section.tasks.map(task => ({
                ...task,
                contentJson: stripAnswers(task.contentJson as Record<string, unknown>, task.exerciseType),
            })),
        }))

        // Create attempt
        const attempt = await prisma.examAttempt.create({
            data: {
                userId: user.userId,
                examId: exam.id,
                startedAt: new Date(),
            },
        })

        return NextResponse.json({
            success: true,
            data: {
                attemptId: attempt.id,
                exam: {
                    ...exam,
                    sections: sanitizedSections,
                },
            },
        })
    } catch (err) {
        console.error('Exam start error:', err)
        return NextResponse.json({ error: 'Internal error' }, { status: 500 })
    }
}

/**
 * Remove correct answers from contentJson so users can't cheat
 */
function stripAnswers(content: Record<string, unknown>, exerciseType: string): Record<string, unknown> {
    if (!content) return content

    switch (exerciseType) {
        case 'TRUE_FALSE':
        case 'MULTIPLE_CHOICE': {
            const items = (content.items as Array<Record<string, unknown>>) ?? []
            return {
                ...content,
                items: items.map(({ correctAnswer, explanation, ...rest }) => rest),
            }
        }
        case 'MATCHING': {
            const { correctMapping, explanation, ...rest } = content
            return rest
        }
        case 'FILL_IN_BLANK': {
            const items = (content.items as Array<Record<string, unknown>>) ?? []
            return {
                ...content,
                items: items.map(({ correctAnswer, explanation, ...rest }) => rest),
            }
        }
        default:
            return content
    }
}
