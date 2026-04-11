import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@fuxie/database'
import { withAuth } from '@/lib/auth/middleware'
import { handleApiError } from '@/lib/api/error-handler'

const onboardingSchema = z.object({
    estimatedLevel: z.enum(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']),
    targetLevel: z.enum(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']),
    targetExam: z.enum(['GOETHE', 'TELC', 'OESD']).nullable().optional(),
    targetExamDate: z.string().datetime().nullable().optional(),
})

/**
 * PATCH /api/v1/auth/onboarding
 * 
 * Saves onboarding results: estimated level, target level, exam preferences.
 * Sets onboardingCompleted = true to prevent re-showing the wizard.
 */
export async function PATCH(req: NextRequest) {
    try {
        const auth = await withAuth(req)
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

        return NextResponse.json({ success: true })
    } catch (error) {
        return handleApiError(error)
    }
}
