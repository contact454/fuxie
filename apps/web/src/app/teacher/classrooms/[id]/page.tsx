import { redirect, notFound } from 'next/navigation'
import { prisma } from '@fuxie/database'
import { getServerUser } from '@/lib/auth/server-auth'
import ClassroomDetailClient from './ClassroomDetailClient'
import { getStudentRiskProfile, summarizeClassroomAnalytics } from '@/lib/analytics/teacher-analytics'
import { getClassroomInterventionRecommendations } from '@/lib/analytics/teacher-interventions'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const classroom = await prisma.classroom.findUnique({
    where: { id },
    select: { name: true },
  })
  return {
    title: classroom ? `${classroom.name} | Fuxie Teacher` : 'Classroom | Fuxie Teacher',
  }
}

export default async function ClassroomDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const serverUser = await getServerUser()
  if (!serverUser) redirect('/login')

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
              dailyActivities: {
                orderBy: { date: 'desc' },
                take: 7,
                select: {
                  date: true,
                  totalMinutes: true,
                  xpEarned: true,
                  lessonsCompleted: true,
                  exercisesCompleted: true,
                },
              },
            },
          },
        },
        orderBy: { enrolledAt: 'asc' },
      },
      assignments: {
        include: {
          submissions: {
            select: { status: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      },
      _count: { select: { enrollments: true } },
    },
  })

  if (!classroom || classroom.teacherId !== serverUser.userId) notFound()

  const students = classroom.enrollments.map((enrollment) => {
    const student = enrollment.student
    const risk = getStudentRiskProfile({
      id: student.id,
      displayName: student.profile?.displayName || student.email,
      email: student.email,
      currentLevel: student.profile?.currentLevel || 'A1',
      totalXp: student.profile?.totalXp || 0,
      totalStudyMinutes: student.profile?.totalStudyMinutes || 0,
      totalLessonsCompleted: student.profile?.totalLessonsCompleted || 0,
      currentStreak: student.streak?.currentStreak || 0,
      lastActive: student.streak?.lastActivityDate || null,
      dailyActivities: student.dailyActivities,
    })

    return {
      id: student.id,
      displayName: student.profile?.displayName || student.email,
      email: student.email,
      avatarUrl: student.profile?.avatarUrl || null,
      currentLevel: student.profile?.currentLevel || 'A1',
      totalXp: student.profile?.totalXp || 0,
      totalStudyMinutes: student.profile?.totalStudyMinutes || 0,
      totalLessonsCompleted: student.profile?.totalLessonsCompleted || 0,
      currentStreak: student.streak?.currentStreak || 0,
      lastActive: student.streak?.lastActivityDate?.toISOString() || null,
      enrolledAt: enrollment.enrolledAt.toISOString(),
      analytics: {
        riskLevel: risk.level,
        riskReasons: risk.reasons,
        recentMinutes7d: risk.recentMinutes7d,
        inactiveDays: risk.inactiveDays,
      },
    }
  })

  const assignments = classroom.assignments.map((assignment) => ({
    id: assignment.id,
    title: assignment.title,
    description: assignment.description,
    targetType: assignment.targetType,
    dueDate: assignment.dueDate?.toISOString() || null,
    submissionCount: assignment.submissions.filter((submission) => submission.status !== 'pending').length,
    totalStudents: assignment.submissions.length || classroom._count.enrollments,
    createdAt: assignment.createdAt.toISOString(),
  }))

  const summary = summarizeClassroomAnalytics(
    classroom.enrollments.map((enrollment) => ({
      id: enrollment.student.id,
      displayName: enrollment.student.profile?.displayName || enrollment.student.email,
      email: enrollment.student.email,
      currentLevel: enrollment.student.profile?.currentLevel || 'A1',
      totalXp: enrollment.student.profile?.totalXp || 0,
      totalStudyMinutes: enrollment.student.profile?.totalStudyMinutes || 0,
      totalLessonsCompleted: enrollment.student.profile?.totalLessonsCompleted || 0,
      currentStreak: enrollment.student.streak?.currentStreak || 0,
      lastActive: enrollment.student.streak?.lastActivityDate || null,
      dailyActivities: enrollment.student.dailyActivities,
    })),
    classroom.assignments.map((assignment) => ({
      id: assignment.id,
      title: assignment.title,
      dueDate: assignment.dueDate,
      submissionCount: assignment.submissions.filter((submission) => submission.status !== 'pending').length,
      totalStudents: assignment.submissions.length || classroom._count.enrollments,
    }))
  )

  const interventionResult = await getClassroomInterventionRecommendations(classroom.id, serverUser.userId)

  return (
    <ClassroomDetailClient
      classroom={{
        id: classroom.id,
        name: classroom.name,
        description: classroom.description,
        joinCode: classroom.joinCode,
        cefrLevel: classroom.cefrLevel,
        students,
        assignments,
        analytics: summary,
        interventions: interventionResult?.recommendations ?? [],
      }}
    />
  )
}
