import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@fuxie/database'
import { withAuth, NotFoundError } from '@/lib/auth/middleware'
import { handleApiError } from '@/lib/api/error-handler'

/**
 * GET /api/v1/auth/me
 * Returns current user with profile
 */
export async function GET(req: NextRequest) {
    try {
        const auth = await withAuth(req)

        const user = await prisma.user.findUnique({
            where: { firebaseUid: auth.userId, deletedAt: null },
            select: {
                id: true,
                email: true,
                role: true,
                profile: {
                    select: {
                        displayName: true,
                        avatarUrl: true,
                        nativeLanguage: true,
                        currentLevel: true,
                        targetLevel: true,
                        targetExam: true,
                        targetExamDate: true,
                        studyGoalMinutes: true,
                        totalXp: true,
                        totalWordsLearned: true,
                        totalLessonsCompleted: true,
                        totalStudyMinutes: true,
                    },
                },
                streak: {
                    select: {
                        currentStreak: true,
                        longestStreak: true,
                        freezesAvailable: true,
                    },
                },
                settings: true,
            },
        })

        if (!user) {
            throw new NotFoundError('User not found')
        }

        return NextResponse.json({ success: true, data: user })
    } catch (error) {
        return handleApiError(error)
    }
}
