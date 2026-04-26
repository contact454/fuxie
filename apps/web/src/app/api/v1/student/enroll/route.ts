import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@fuxie/database'
import { handleApiError } from '@/lib/api/error-handler'
import { withDbAuth } from '@/lib/auth/middleware'

const enrollSchema = z.object({
  joinCode: z.string()
    .trim()
    .toUpperCase()
    .regex(/^FUX-[A-HJ-NP-Z2-9]{3,5}$/, 'Invalid join code format'),
})

// POST /api/v1/student/enroll — join a classroom via join code
export async function POST(request: NextRequest) {
  try {
    const user = await withDbAuth(request)
    const { joinCode: normalizedCode } = enrollSchema.parse(await request.json())

    const classroom = await prisma.classroom.findUnique({
      where: { joinCode: normalizedCode },
      select: { id: true, name: true, cefrLevel: true, isArchived: true },
    })

    if (!classroom) {
      return NextResponse.json(
        { success: false, error: 'Mã lớp không hợp lệ. Vui lòng kiểm tra lại.' },
        { status: 404 },
      )
    }

    if (classroom.isArchived) {
      return NextResponse.json(
        { success: false, error: 'Lớp học này đã bị lưu trữ.' },
        { status: 410 },
      )
    }

    // Check if already enrolled
    const existing = await prisma.classEnrollment.findUnique({
      where: {
        classroomId_studentId: {
          classroomId: classroom.id,
          studentId: user.userId,
        },
      },
    })

    if (existing && !existing.removedAt) {
      return NextResponse.json(
        { success: false, error: 'Bạn đã tham gia lớp này rồi.' },
        { status: 409 },
      )
    }

    // Enroll (or re-enroll if previously removed)
    if (existing) {
      await prisma.classEnrollment.update({
        where: { id: existing.id },
        data: { removedAt: null, enrolledAt: new Date() },
      })
    } else {
      await prisma.classEnrollment.create({
        data: {
          classroomId: classroom.id,
          studentId: user.userId,
        },
      })
    }

    // Auto-create pending submissions for existing assignments
    const pendingAssignments = await prisma.assignment.findMany({
      where: { classroomId: classroom.id },
      select: { id: true },
    })

    if (pendingAssignments.length > 0) {
      await prisma.assignmentSubmission.createMany({
        data: pendingAssignments.map(a => ({
          assignmentId: a.id,
          studentId: user.userId,
          status: 'pending',
        })),
        skipDuplicates: true,
      })
    }

    return NextResponse.json({
      success: true,
      data: {
        classroomId: classroom.id,
        classroomName: classroom.name,
        cefrLevel: classroom.cefrLevel,
      },
    })
  } catch (err) {
    return handleApiError(err)
  }
}
