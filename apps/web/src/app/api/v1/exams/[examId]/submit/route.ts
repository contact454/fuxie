import { NextResponse } from 'next/server'
import { prisma, Prisma } from '@fuxie/database'
import { getServerUser } from '@/lib/auth/server-auth'
import { gradeExamTask } from '@/lib/assessment/submission-grading'
import { calculateExamXp, recordLearningActivity } from '@/lib/progress/learning-activity'

interface SubmitBody {
    attemptId: string
    answers: Array<{ taskId: string; answerJson: Record<string, unknown> }>
}

/**
 * POST /api/v1/exams/[examId]/submit
 * Auto-grades MC/TF/Matching, saves results, awards XP
 */
export async function POST(
    request: Request,
    { params }: { params: Promise<{ examId: string }> }
) {
    try {
        const user = await getServerUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { examId } = await params
        const body: SubmitBody = await request.json()
        const { attemptId, answers } = body

        // Verify attempt belongs to user
        const attempt = await prisma.examAttempt.findFirst({
            where: { id: attemptId, userId: user.userId, examId },
        })
        if (!attempt) return NextResponse.json({ error: 'Attempt not found' }, { status: 404 })
        if (attempt.completedAt) return NextResponse.json({ error: 'Already submitted' }, { status: 400 })

        // Fetch exam tasks with correct answers for grading
        const exam = await prisma.examTemplate.findUnique({
            where: { id: examId },
            select: {
                passingScore: true,
                totalPoints: true,
                sections: {
                    orderBy: { sortOrder: 'asc' },
                    select: {
                        id: true,
                        skill: true,
                        totalPoints: true,
                        tasks: {
                            select: {
                                id: true,
                                exerciseType: true,
                                contentJson: true,
                                maxPoints: true,
                            },
                        },
                    },
                },
            },
        })
        if (!exam) return NextResponse.json({ error: 'Exam not found' }, { status: 404 })

        // Build task lookup
        const taskMap = new Map<string, { exerciseType: string; contentJson: Record<string, unknown>; maxPoints: number; sectionId: string }>()
        for (const section of exam.sections) {
            for (const task of section.tasks) {
                taskMap.set(task.id, {
                    exerciseType: task.exerciseType,
                    contentJson: task.contentJson as Record<string, unknown>,
                    maxPoints: task.maxPoints,
                    sectionId: section.id,
                })
            }
        }

        // Grade each answer
        const gradedAnswers: Array<{
            taskId: string
            score: number
            maxScore: number
            isCorrect: boolean
            details: Record<string, unknown>
        }> = []

        for (const ans of answers) {
            const task = taskMap.get(ans.taskId)
            if (!task) continue

            const result = gradeExamTask(task.exerciseType, task.contentJson, ans.answerJson, task.maxPoints)
            gradedAnswers.push({
                taskId: ans.taskId,
                score: result.score,
                maxScore: task.maxPoints,
                isCorrect: result.score === task.maxPoints,
                details: result.details,
            })
        }

        // Calculate section scores
        const sectionScores: Record<string, { score: number; maxScore: number; skill: string }> = {}
        for (const section of exam.sections) {
            sectionScores[section.id] = { score: 0, maxScore: section.totalPoints, skill: section.skill }
        }
        for (const ga of gradedAnswers) {
            const task = taskMap.get(ga.taskId)
            if (task && sectionScores[task.sectionId]) {
                sectionScores[task.sectionId]!.score += ga.score
            }
        }

        const totalScore = gradedAnswers.reduce((sum, a) => sum + a.score, 0)
        const maxScore = exam.totalPoints
        const percentScore = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0
        const passed = percentScore >= exam.passingScore
        const baseXpEarned = calculateExamXp(passed)
        const timeSpentSeconds = Math.max(
            0,
            Math.round((Date.now() - attempt.startedAt.getTime()) / 1000)
        )

        // Save answers + update attempt in a transaction
        const progress = await prisma.$transaction(async (tx) => {
            // Save individual answers
            for (const ga of gradedAnswers) {
                await tx.examAnswer.create({
                    data: {
                        attemptId,
                        taskId: ga.taskId,
                        answerJson: (answers.find(a => a.taskId === ga.taskId)?.answerJson ?? {}) as Prisma.InputJsonValue,
                        score: ga.score,
                        maxScore: ga.maxScore,
                        isCorrect: ga.isCorrect,
                        rubricScores: ga.details as Prisma.InputJsonValue,
                    },
                })
            }

            // Update attempt
            await tx.examAttempt.update({
                where: { id: attemptId },
                data: {
                    completedAt: new Date(),
                    totalScore,
                    maxScore,
                    passed,
                    percentScore,
                    scoreBreakdown: sectionScores as unknown as Prisma.InputJsonValue,
                },
            })

            return recordLearningActivity(tx, {
                userId: user.userId,
                exerciseId: examId,
                score: totalScore,
                maxScore,
                percentScore,
                xpEarned: baseXpEarned,
                timeSpentSeconds,
                exercisesCompleted: 1,
            })
        })

        return NextResponse.json({
            success: true,
            data: {
                attemptId,
                totalScore,
                maxScore,
                percentScore,
                passed,
                xpEarned: progress.xpEarned,
                streak: progress.streak,
                sectionScores: Object.values(sectionScores),
                answers: gradedAnswers,
            },
        })
    } catch (err) {
        console.error('Exam submit error:', err)
        return NextResponse.json({ error: 'Internal error' }, { status: 500 })
    }
}

