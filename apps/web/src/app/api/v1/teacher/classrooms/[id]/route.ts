import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@fuxie/database'
import { handleApiError } from '@/lib/api/error-handler'
import { requireTeacher } from '@/lib/auth/teacher-guard'

// GET /api/v1/teacher/classrooms/[id] — classroom detail + students summary
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireTeacher(request)
    const { id } = await params

    const classroom = await prisma.classroom.findUnique({
      where: { id },
      include: {
        enrollments: {
          where: { removedAt: null },
          include: {
            student: {
              include: {
                profile: {
                  select: {
                    displayName: true,
                    avatarUrl: true,
                    currentLevel: true,
                    totalXp: true,
                    totalStudyMinutes: true,
                    totalLessonsCompleted: true,
                  },
                },
                streak: {
                  select: { currentStreak: true, lastActivityDate: true },
                },
              },
            },
          },
          orderBy: { enrolledAt: 'asc' },
        },
        assignments: {
          include: {
            _count: { select: { submissions: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
        _count: { select: { enrollments: true } },
      },
    })

    if (!classroom || classroom.teacherId !== user.userId) {
      return NextResponse.json(
        { success: false, error: 'Không tìm thấy lớp học.' },
        { status: 404 },
      )
    }

    // Format students
    const students = classroom.enrollments.map(e => ({
      id: e.student.id,
      displayName: e.student.profile?.displayName || e.student.email,
      avatarUrl: e.student.profile?.avatarUrl,
      email: e.student.email,
      currentLevel: e.student.profile?.currentLevel || 'A1',
      totalXp: e.student.profile?.totalXp || 0,
      totalStudyMinutes: e.student.profile?.totalStudyMinutes || 0,
      totalLessonsCompleted: e.student.profile?.totalLessonsCompleted || 0,
      currentStreak: e.student.streak?.currentStreak || 0,
      lastActive: e.student.streak?.lastActivityDate,
      enrolledAt: e.enrolledAt,
    }))

    // Format assignments
    const assignments = classroom.assignments.map(a => ({
      id: a.id,
      title: a.title,
      description: a.description,
      targetType: a.targetType,
      targetId: a.targetId,
      targetMeta: a.targetMeta,
      dueDate: a.dueDate,
      startDate: a.startDate,
      submissionCount: a._count.submissions,
      totalStudents: classroom._count.enrollments,
      createdAt: a.createdAt,
    }))

    return NextResponse.json({
      success: true,
      data: {
        id: classroom.id,
        name: classroom.name,
        description: classroom.description,
        joinCode: classroom.joinCode,
        cefrLevel: classroom.cefrLevel,
        isArchived: classroom.isArchived,
        students,
        assignments,
        createdAt: classroom.createdAt,
      },
    })
  } catch (err) {
    return handleApiError(err)
  }
}

// DELETE /api/v1/teacher/classrooms/[id] — archive classroom
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireTeacher(request)
    const { id } = await params

    const classroom = await prisma.classroom.findUnique({ where: { id } })
    if (!classroom || classroom.teacherId !== user.userId) {
      return NextResponse.json(
        { success: false, error: 'Không tìm thấy lớp học.' },
        { status: 404 },
      )
    }

    await prisma.classroom.update({
      where: { id },
      data: { isArchived: true },
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    return handleApiError(err)
  }
}
