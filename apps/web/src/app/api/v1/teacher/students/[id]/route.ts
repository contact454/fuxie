import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@fuxie/database'
import { handleApiError } from '@/lib/api/error-handler'
import { requireTeacher } from '@/lib/auth/teacher-guard'

// GET /api/v1/teacher/students/[id] — detailed student profile for teacher view
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const teacher = await requireTeacher(request)
    const { id: studentId } = await params

    // Verify teacher has this student in at least one classroom
    const enrollment = await prisma.classEnrollment.findFirst({
      where: {
        studentId,
        removedAt: null,
        classroom: { teacherId: teacher.userId, isArchived: false },
      },
    })

    if (!enrollment) {
      return NextResponse.json(
        { success: false, error: 'Học viên này không thuộc lớp học nào của bạn.' },
        { status: 403 },
      )
    }

    // Fetch comprehensive student data
    const student = await prisma.user.findUnique({
      where: { id: studentId },
      include: {
        profile: true,
        streak: true,
        // Recent daily activities (last 30 days)
        dailyActivities: {
          orderBy: { date: 'desc' },
          take: 30,
          select: {
            date: true,
            totalMinutes: true,
            xpEarned: true,
            lessonsCompleted: true,
            exercisesCompleted: true,
          },
        },
        // Assignment submissions for this teacher
        studentSubmissions: {
          where: {
            assignment: {
              classroom: { teacherId: teacher.userId },
            },
          },
          include: {
            assignment: {
              select: { title: true, targetType: true, dueDate: true, classroom: { select: { name: true } } },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
        // Skill assessments
        assessments: {
          orderBy: { assessedAt: 'desc' },
          take: 6, // Latest per skill
          select: { skill: true, cefrLevel: true, score: true, assessedAt: true },
        },
      },
    })

    if (!student) {
      return NextResponse.json(
        { success: false, error: 'Không tìm thấy học viên.' },
        { status: 404 },
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        id: student.id,
        email: student.email,
        profile: student.profile ? {
          displayName: student.profile.displayName,
          avatarUrl: student.profile.avatarUrl,
          currentLevel: student.profile.currentLevel,
          targetLevel: student.profile.targetLevel,
          totalXp: student.profile.totalXp,
          totalWordsLearned: student.profile.totalWordsLearned,
          totalLessonsCompleted: student.profile.totalLessonsCompleted,
          totalStudyMinutes: student.profile.totalStudyMinutes,
        } : null,
        streak: student.streak ? {
          currentStreak: student.streak.currentStreak,
          longestStreak: student.streak.longestStreak,
          lastActivityDate: student.streak.lastActivityDate,
        } : null,
        dailyActivities: student.dailyActivities,
        submissions: student.studentSubmissions.map(s => ({
          id: s.id,
          title: s.assignment.title,
          classroomName: s.assignment.classroom.name,
          targetType: s.assignment.targetType,
          dueDate: s.assignment.dueDate,
          status: s.status,
          score: s.score,
          maxScore: s.maxScore,
          completedAt: s.completedAt,
        })),
        skillScores: student.assessments,
      },
    })
  } catch (err) {
    return handleApiError(err)
  }
}
