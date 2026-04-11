import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@fuxie/database'
import { handleApiError } from '@/lib/api/error-handler'
import { withAuth } from '@/lib/auth/middleware'

// GET /api/v1/student/assignments — list assignments for current student
export async function GET(request: NextRequest) {
  try {
    const user = await withAuth(request)

    const submissions = await prisma.assignmentSubmission.findMany({
      where: { studentId: user.userId },
      include: {
        assignment: {
          include: {
            classroom: {
              select: { name: true, cefrLevel: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })

    return NextResponse.json({
      success: true,
      data: submissions.map(s => ({
        id: s.id,
        assignmentId: s.assignmentId,
        title: s.assignment.title,
        description: s.assignment.description,
        targetType: s.assignment.targetType,
        targetId: s.assignment.targetId,
        targetMeta: s.assignment.targetMeta,
        classroomName: s.assignment.classroom.name,
        cefrLevel: s.assignment.classroom.cefrLevel,
        dueDate: s.assignment.dueDate,
        status: s.status,
        score: s.score,
        maxScore: s.maxScore,
        teacherNote: s.teacherNote,
        completedAt: s.completedAt,
      })),
    })
  } catch (err) {
    return handleApiError(err)
  }
}
