import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma, Prisma } from '@fuxie/database'
import { handleApiError } from '@/lib/api/error-handler'
import { requireTeacher } from '@/lib/auth/teacher-guard'
import { cacheInvalidatePrefix } from '@/lib/cache/redis'

const assignmentTargetTypes = [
  'xp',
  'lesson',
  'exam',
  'speaking',
  'vocabulary',
  'grammar',
  'writing',
  'reading',
  'listening',
] as const

const createAssignmentSchema = z.object({
  classroomId: z.string().uuid(),
  title: z.string().trim().min(2).max(140),
  description: z.string().trim().max(1000).nullable().optional(),
  targetType: z.enum(assignmentTargetTypes),
  targetId: z.string().trim().min(1).max(160).nullable().optional(),
  targetMeta: z.record(z.unknown()).nullable().optional(),
  dueDate: z.string().trim().min(1).nullable().optional(),
})

// POST /api/v1/teacher/assignments — create assignment for a classroom
export async function POST(request: NextRequest) {
  try {
    const user = await requireTeacher(request)
    const { classroomId, title, description, targetType, targetId, targetMeta, dueDate } =
      createAssignmentSchema.parse(await request.json())
    const parsedDueDate = parseOptionalDueDate(dueDate)

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
          targetMeta: targetMeta ? targetMeta as Prisma.InputJsonValue : Prisma.JsonNull,
          dueDate: parsedDueDate,
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

    cacheInvalidatePrefix(`teacher:classrooms:${user.userId}`).catch(() => {})

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

function parseOptionalDueDate(value: string | null | undefined): Date | null {
  if (!value) {
    return null
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    throw new z.ZodError([{
      code: z.ZodIssueCode.custom,
      path: ['dueDate'],
      message: 'Invalid dueDate',
    }])
  }

  return date
}
