import { NextResponse } from 'next/server'
import { prisma } from '@fuxie/database'
import { getServerUser } from '@/lib/auth/server-auth'

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

            const result = gradeTask(task.exerciseType, task.contentJson, ans.answerJson, task.maxPoints)
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

        // Save answers + update attempt in a transaction
        await prisma.$transaction(async (tx) => {
            // Save individual answers
            for (const ga of gradedAnswers) {
                await tx.examAnswer.create({
                    data: {
                        attemptId,
                        taskId: ga.taskId,
                        answerJson: answers.find(a => a.taskId === ga.taskId)?.answerJson ?? {},
                        score: ga.score,
                        maxScore: ga.maxScore,
                        isCorrect: ga.isCorrect,
                        rubricScores: ga.details,
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
                    scoreBreakdown: sectionScores,
                },
            })

            // Award XP (10 base + bonus for passing)
            const xp = passed ? 25 : 10
            await tx.userProfile.update({
                where: { userId: user.userId },
                data: { totalXp: { increment: xp } },
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
                sectionScores: Object.values(sectionScores),
                answers: gradedAnswers,
            },
        })
    } catch (err) {
        console.error('Exam submit error:', err)
        return NextResponse.json({ error: 'Internal error' }, { status: 500 })
    }
}

/**
 * Auto-grade a task based on exercise type
 */
function gradeTask(
    exerciseType: string,
    contentJson: Record<string, unknown>,
    userAnswer: Record<string, unknown>,
    maxPoints: number
): { score: number; details: Record<string, unknown> } {
    switch (exerciseType) {
        case 'TRUE_FALSE': {
            const items = (contentJson.items as Array<{ id: string; correctAnswer: string }>) ?? []
            const userAnswers = (userAnswer.answers as Record<string, string>) ?? {}
            let correct = 0
            const itemResults: Record<string, boolean> = {}
            for (const item of items) {
                const isCorrect = userAnswers[item.id]?.toUpperCase() === item.correctAnswer.toUpperCase()
                if (isCorrect) correct++
                itemResults[item.id] = isCorrect
            }
            const pointsPerItem = items.length > 0 ? maxPoints / items.length : 0
            return {
                score: Math.round(correct * pointsPerItem),
                details: { correct, total: items.length, itemResults },
            }
        }

        case 'MULTIPLE_CHOICE': {
            const items = (contentJson.items as Array<{ id: string; correctAnswer: string }>) ?? []
            const userAnswers = (userAnswer.answers as Record<string, string>) ?? {}
            let correct = 0
            const itemResults: Record<string, boolean> = {}
            for (const item of items) {
                const isCorrect = userAnswers[item.id]?.toUpperCase() === item.correctAnswer.toUpperCase()
                if (isCorrect) correct++
                itemResults[item.id] = isCorrect
            }
            const pointsPerItem = items.length > 0 ? maxPoints / items.length : 0
            return {
                score: Math.round(correct * pointsPerItem),
                details: { correct, total: items.length, itemResults },
            }
        }

        case 'MATCHING': {
            const correctMapping = (contentJson.correctMapping as Record<string, string>) ?? {}
            const userMapping = (userAnswer.mapping as Record<string, string>) ?? {}
            let correct = 0
            const totalItems = Object.keys(correctMapping).length
            const itemResults: Record<string, boolean> = {}
            for (const [key, correctVal] of Object.entries(correctMapping)) {
                const isCorrect = userMapping[key]?.toUpperCase() === correctVal.toUpperCase()
                if (isCorrect) correct++
                itemResults[key] = isCorrect
            }
            const pointsPerItem = totalItems > 0 ? maxPoints / totalItems : 0
            return {
                score: Math.round(correct * pointsPerItem),
                details: { correct, total: totalItems, itemResults },
            }
        }

        case 'FILL_IN_BLANK': {
            const items = (contentJson.items as Array<{ id: string; correctAnswer: string }>) ?? []
            const userAnswers = (userAnswer.answers as Record<string, string>) ?? {}
            let correct = 0
            const itemResults: Record<string, boolean> = {}
            for (const item of items) {
                const isCorrect = userAnswers[item.id]?.trim().toLowerCase() === item.correctAnswer.trim().toLowerCase()
                if (isCorrect) correct++
                itemResults[item.id] = isCorrect
            }
            const pointsPerItem = items.length > 0 ? maxPoints / items.length : 0
            return {
                score: Math.round(correct * pointsPerItem),
                details: { correct, total: items.length, itemResults },
            }
        }

        default:
            return { score: 0, details: { error: 'Unsupported exercise type for auto-grading' } }
    }
}
