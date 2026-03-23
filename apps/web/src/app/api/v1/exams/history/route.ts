import { NextResponse } from 'next/server'
import { prisma } from '@fuxie/database'
import { getServerUser } from '@/lib/auth/server-auth'

/**
 * GET /api/v1/exams/history
 * Returns user's last 10 exam attempts with template info
 */
export async function GET() {
    try {
        const user = await getServerUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const attempts = await prisma.examAttempt.findMany({
            where: {
                userId: user.userId,
                completedAt: { not: null },
            },
            select: {
                id: true,
                totalScore: true,
                maxScore: true,
                percentScore: true,
                passed: true,
                completedAt: true,
                exam: {
                    select: {
                        id: true,
                        slug: true,
                        title: true,
                        examType: true,
                        cefrLevel: true,
                    },
                },
            },
            orderBy: { completedAt: 'desc' },
            take: 10,
        })

        return NextResponse.json({ success: true, data: attempts })
    } catch (err) {
        console.error('Exam history error:', err)
        return NextResponse.json({ error: 'Internal error' }, { status: 500 })
    }
}
