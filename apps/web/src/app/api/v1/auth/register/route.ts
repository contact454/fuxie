import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@fuxie/database'
import { RegisterSchema } from '@fuxie/shared/validators'
import { withAuth } from '@/lib/auth/middleware'
import { handleApiError } from '@/lib/api/error-handler'

/**
 * POST /api/v1/auth/register
 *
 * Idempotent: creates User + Profile + Settings + Streak + LearningPath in DB.
 * If user already exists, returns existing data (200).
 * If new user, creates everything in a transaction (201).
 */
export async function POST(req: NextRequest) {
    try {
        const auth = await withAuth(req)
        const body = await req.json()
        const data = RegisterSchema.parse({
            ...body,
            firebaseUid: auth.userId,
            email: auth.email,
        })

        // Check if user already exists (idempotent)
        const existing = await prisma.user.findUnique({
            where: { firebaseUid: data.firebaseUid },
            select: {
                id: true,
                email: true,
                role: true,
                profile: {
                    select: {
                        displayName: true,
                        currentLevel: true,
                        targetLevel: true,
                        targetExam: true,
                        totalXp: true,
                    },
                },
            },
        })

        if (existing) {
            return NextResponse.json({ success: true, data: existing }, { status: 200 })
        }

        // Create new user with all relations
        const user = await prisma.$transaction(async (tx) => {
            const newUser = await tx.user.create({
                data: {
                    firebaseUid: data.firebaseUid,
                    email: data.email,
                    role: 'LEARNER',
                    emailVerified: false,
                },
            })

            await Promise.all([
                tx.userProfile.create({
                    data: {
                        userId: newUser.id,
                        displayName: data.displayName ?? null,
                        nativeLanguage: data.nativeLanguage,
                        currentLevel: 'A1',
                        targetLevel: data.targetLevel ?? 'B1',
                        targetExam: data.targetExam ?? null,
                    },
                }),
                tx.userSettings.create({
                    data: { userId: newUser.id },
                }),
                tx.userStreak.create({
                    data: { userId: newUser.id },
                }),
                tx.learningPath.create({
                    data: {
                        userId: newUser.id,
                        currentCefrLevel: 'A1',
                        targetCefrLevel: data.targetLevel ?? 'B1',
                        targetExamType: data.targetExam ?? null,
                    },
                }),
            ])

            return tx.user.findUnique({
                where: { id: newUser.id },
                select: {
                    id: true,
                    email: true,
                    role: true,
                    profile: {
                        select: {
                            displayName: true,
                            currentLevel: true,
                            targetLevel: true,
                            targetExam: true,
                            totalXp: true,
                        },
                    },
                },
            })
        })

        return NextResponse.json({ success: true, data: user }, { status: 201 })
    } catch (error) {
        return handleApiError(error)
    }
}
