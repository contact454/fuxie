import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@fuxie/database'
import { handleApiError } from '@/lib/api/error-handler'
import { withAuth } from '@/lib/auth/middleware'

// POST /api/v1/student/enroll — join a classroom via join code
export async function POST(request: NextRequest) {
  try {
    const user = await withAuth(request)
    const body = await request.json()
    const { joinCode } = body

    if (!joinCode || typeof joinCode !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Mã lớp (joinCode) là bắt buộc.' },
        { status: 400 },
      )
    }

    const normalizedCode = joinCode.trim().toUpperCase()

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
