import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@fuxie/database'
import { withDbAuth } from '@/lib/auth/middleware'
import { handleApiError } from '@/lib/api/error-handler'
import { recordAnalyticsEvent } from '@/lib/analytics/events'

const onboardingSchema = z.object({
    estimatedLevel: z.enum(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']),
    targetLevel: z.enum(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']),
    targetExam: z.enum(['GOETHE', 'TELC', 'OESD']).nullable().optional(),
    targetExamDate: z.string().datetime().nullable().optional(),
    studyGoalMinutes: z.union([z.literal(5), z.literal(10), z.literal(20), z.literal(30)]).optional(),
})

/**
 * PATCH /api/v1/auth/onboarding
 * 
 * Saves onboarding results: estimated level, target level, exam preferences.
 * Sets onboardingCompleted = true to prevent re-showing the wizard.
 */
export async function PATCH(req: NextRequest) {
    try {
        const auth = await withDbAuth(req)
        const body = await req.json()
        const data = onboardingSchema.parse(body)

        // Update profile + learning path in parallel
        await Promise.all([
            prisma.userProfile.update({
                where: { userId: auth.userId },
                data: {
                    currentLevel: data.estimatedLevel,
                    targetLevel: data.targetLevel,
                    targetExam: data.targetExam ?? null,
                    targetExamDate: data.targetExamDate ? new Date(data.targetExamDate) : null,
                    studyGoalMinutes: data.studyGoalMinutes ?? 10,
                    onboardingCompleted: true,
                },
            }),
            prisma.learningPath.updateMany({
                where: { userId: auth.userId },
                data: {
                    currentCefrLevel: data.estimatedLevel,
                    targetCefrLevel: data.targetLevel,
                    targetExamType: data.targetExam ?? null,
                },
            }),
        ])

        await recordAnalyticsEvent(prisma, {
            userId: auth.userId,
            role: auth.role,
            eventName: 'onboarding_completed',
            source: 'onboarding.wizard',
            level: data.estimatedLevel,
            metadata: {
                estimated_level: data.estimatedLevel,
                target_level: data.targetLevel,
                target_exam: data.targetExam ?? null,
                daily_study_minutes: data.studyGoalMinutes ?? 10,
            },
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        return handleApiError(error)
    }
}
