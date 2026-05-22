import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@fuxie/database'
import { z } from 'zod'
import { cookies } from 'next/headers'
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
                        uiLanguage: true,
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

const updateProfileSchema = z.object({
    uiLanguage: z.enum(['vi', 'en', 'de']).optional(),
})

/**
 * PATCH /api/v1/auth/me
 * Updates current user profile (e.g. uiLanguage)
 */
export async function PATCH(req: NextRequest) {
    try {
        const auth = await withAuth(req)
        const body = await req.json()
        const { uiLanguage } = updateProfileSchema.parse(body)

        if (uiLanguage) {
            const user = await prisma.user.findUnique({
                where: { firebaseUid: auth.userId, deletedAt: null },
            })
            if (!user) throw new NotFoundError('User not found')

            await prisma.userProfile.upsert({
                where: { userId: user.id },
                create: { userId: user.id, uiLanguage },
                update: { uiLanguage },
            })

            const cookieStore = await cookies()
            cookieStore.set('NEXT_LOCALE', uiLanguage, { maxAge: 60 * 60 * 24 * 365, path: '/' })
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        return handleApiError(error)
    }
}
