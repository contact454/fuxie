import { NextResponse } from 'next/server'
import { prisma } from '@fuxie/database'
import { getServerUser } from '@/lib/auth/server-auth'

/**
 * GET /api/v1/exams?level=B1&board=GOETHE
 * Returns published exams with user's best attempt
 */
export async function GET(request: Request) {
    try {
        const user = await getServerUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const url = new URL(request.url)
        const level = url.searchParams.get('level')?.toUpperCase()
        const board = url.searchParams.get('board')?.toUpperCase()

        const where: Record<string, unknown> = { status: 'PUBLISHED' }
        if (level) where.cefrLevel = level
        if (board) where.examType = board

        const exams = await prisma.examTemplate.findMany({
            where,
            select: {
                id: true,
                slug: true,
                title: true,
                examType: true,
                cefrLevel: true,
                totalMinutes: true,
                totalPoints: true,
                passingScore: true,
                description: true,
                sections: {
                    select: { skill: true, totalMinutes: true, totalPoints: true },
                    orderBy: { sortOrder: 'asc' },
                },
            },
            orderBy: [{ cefrLevel: 'asc' }, { examType: 'asc' }],
        })

        // Get user's best attempt per exam
        const examIds = exams.map(e => e.id)
        const attempts = examIds.length > 0
            ? await prisma.examAttempt.findMany({
                where: {
                    userId: user.userId,
                    examId: { in: examIds },
                    completedAt: { not: null },
                },
                select: {
                    examId: true,
                    totalScore: true,
                    maxScore: true,
                    passed: true,
                    percentScore: true,
                    completedAt: true,
                },
                orderBy: { completedAt: 'desc' },
            })
            : []

        // Best attempt per exam (highest score)
        const bestAttempts: Record<string, typeof attempts[number]> = {}
        for (const a of attempts) {
            if (!bestAttempts[a.examId] || (a.totalScore ?? 0) > (bestAttempts[a.examId]!.totalScore ?? 0)) {
                bestAttempts[a.examId] = a
            }
        }

        const data = exams.map(exam => ({
            ...exam,
            bestAttempt: bestAttempts[exam.id] ?? null,
        }))

        return NextResponse.json({ success: true, data })
    } catch (err) {
        console.error('Exam list error:', err)
        return NextResponse.json({ error: 'Internal error' }, { status: 500 })
    }
}
