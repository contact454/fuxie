import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@fuxie/database'
import { handleApiError } from '@/lib/api/error-handler'
import { requireTeacher } from '@/lib/auth/teacher-guard'

// POST /api/v1/teacher/assignments — create assignment for a classroom
export async function POST(request: NextRequest) {
  try {
    const user = await requireTeacher(request)
    const body = await request.json()
    const { classroomId, title, description, targetType, targetId, targetMeta, dueDate } = body

    if (!classroomId || !title || !targetType) {
      return NextResponse.json(
        { success: false, error: 'classroomId, title, và targetType là bắt buộc.' },
        { status: 400 },
      )
    }

    // Verify classroom ownership
    const classroom = await prisma.classroom.findUnique({
      where: { id: classroomId },
      include: {
        enrollments: { where: { removedAt: null }, select: { studentId: true } },
      },
    })

    if (!classroom || classroom.teacherId !== user.userId) {
      return NextResponse.json(
        { success: false, error: 'Không tìm thấy lớp học.' },
        { status: 404 },
      )
    }

    // Create assignment + auto-create pending submissions for all enrolled students
    const assignment = await prisma.$transaction(async (tx) => {
      const newAssignment = await tx.assignment.create({
        data: {
          classroomId,
          title: title.trim(),
          description: description?.trim() || null,
          targetType,
          targetId: targetId || null,
          targetMeta: targetMeta || null,
          dueDate: dueDate ? new Date(dueDate) : null,
        },
      })

      // Create pending submissions for all current students
      if (classroom.enrollments.length > 0) {
        await tx.assignmentSubmission.createMany({
          data: classroom.enrollments.map(e => ({
            assignmentId: newAssignment.id,
            studentId: e.studentId,
            status: 'pending',
          })),
        })
      }

      return newAssignment
    })

    return NextResponse.json({
      success: true,
      data: {
        id: assignment.id,
        title: assignment.title,
        targetType: assignment.targetType,
        dueDate: assignment.dueDate,
        studentsAssigned: classroom.enrollments.length,
      },
    }, { status: 201 })
  } catch (err) {
    return handleApiError(err)
  }
}
