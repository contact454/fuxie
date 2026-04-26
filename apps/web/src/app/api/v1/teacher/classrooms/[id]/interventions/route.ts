import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@fuxie/database'
import { handleApiError } from '@/lib/api/error-handler'
import { requireTeacher } from '@/lib/auth/teacher-guard'
import { getClassroomInterventionRecommendations } from '@/lib/analytics/teacher-interventions'

const autoAssignSchema = z.object({
    recommendationId: z.string().trim().min(1),
    dueDays: z.coerce.number().int().min(1).max(14).optional(),
})

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        const teacher = await requireTeacher(request)
        const { id } = await params
        const result = await getClassroomInterventionRecommendations(id, teacher.userId)

        if (!result) {
            return NextResponse.json(
                { success: false, error: 'Classroom not found.' },
                { status: 404 },
            )
        }

        return NextResponse.json({ success: true, data: result })
    } catch (err) {
        return handleApiError(err)
    }
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        const teacher = await requireTeacher(request)
        const { id } = await params
        const { recommendationId, dueDays } = autoAssignSchema.parse(await request.json())

        const result = await getClassroomInterventionRecommendations(id, teacher.userId)
        if (!result) {
            return NextResponse.json(
                { success: false, error: 'Classroom not found.' },
                { status: 404 },
            )
        }

        const recommendation = result.recommendations.find((item) => item.id === recommendationId)
        if (!recommendation) {
            return NextResponse.json(
                { success: false, error: 'Recommendation is no longer available.' },
                { status: 404 },
            )
        }

        const targetStudentIds = recommendation.targetStudentIds.length > 0
            ? recommendation.targetStudentIds
            : await getActiveStudentIds(id)

        if (targetStudentIds.length === 0) {
            return NextResponse.json(
                { success: false, error: 'No target students available.' },
                { status: 400 },
            )
        }

        const daysUntilDue = Math.max(1, Math.min(14, dueDays ?? recommendation.dueDays))
        const dueDate = new Date()
        dueDate.setDate(dueDate.getDate() + daysUntilDue)

        const assignment = await prisma.$transaction(async (tx) => {
            const created = await tx.assignment.create({
                data: {
                    classroomId: id,
                    title: recommendation.title,
                    description: recommendation.description,
                    targetType: recommendation.targetType,
                    targetId: recommendation.targetId,
                    targetMeta: {
                        ...recommendation.targetMeta,
                        targetStudentIds,
                        targetStudentCount: targetStudentIds.length,
                        createdFromRecommendationAt: new Date().toISOString(),
                    },
                    dueDate,
                },
            })

            await tx.assignmentSubmission.createMany({
                data: targetStudentIds.map((studentId) => ({
                    assignmentId: created.id,
                    studentId,
                    status: 'pending',
                })),
                skipDuplicates: true,
            })

            return created
        })

        return NextResponse.json({
            success: true,
            data: {
                id: assignment.id,
                title: assignment.title,
                description: assignment.description,
                targetType: assignment.targetType,
                targetId: assignment.targetId,
                targetMeta: assignment.targetMeta,
                dueDate: assignment.dueDate,
                submissionCount: 0,
                totalStudents: targetStudentIds.length,
                createdAt: assignment.createdAt,
            },
        }, { status: 201 })
    } catch (err) {
        return handleApiError(err)
    }
}

async function getActiveStudentIds(classroomId: string) {
    const enrollments = await prisma.classEnrollment.findMany({
        where: { classroomId, removedAt: null },
        select: { studentId: true },
    })
    return enrollments.map((enrollment) => enrollment.studentId)
}
