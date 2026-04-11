import { redirect, notFound } from 'next/navigation'
import { prisma } from '@fuxie/database'
import { getServerUser } from '@/lib/auth/server-auth'
import ClassroomDetailClient from './ClassroomDetailClient'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const classroom = await prisma.classroom.findUnique({
    where: { id },
    select: { name: true },
  })
  return {
    title: classroom ? `${classroom.name} | Fuxie Teacher` : 'Lớp học | Fuxie Teacher',
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
            },
          },
        },
        orderBy: { enrolledAt: 'asc' },
      },
      assignments: {
        include: {
          _count: {
            select: {
              submissions: { where: { status: { not: 'pending' } } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      },
      _count: { select: { enrollments: true } },
    },
  })

  if (!classroom || classroom.teacherId !== serverUser.userId) notFound()

  const data = {
    id: classroom.id,
    name: classroom.name,
    description: classroom.description,
    joinCode: classroom.joinCode,
    cefrLevel: classroom.cefrLevel,
    students: classroom.enrollments.map(e => ({
      id: e.student.id,
      displayName: e.student.profile?.displayName || e.student.email,
      email: e.student.email,
      avatarUrl: e.student.profile?.avatarUrl || null,
      currentLevel: e.student.profile?.currentLevel || 'A1',
      totalXp: e.student.profile?.totalXp || 0,
      totalStudyMinutes: e.student.profile?.totalStudyMinutes || 0,
      totalLessonsCompleted: e.student.profile?.totalLessonsCompleted || 0,
      currentStreak: e.student.streak?.currentStreak || 0,
      lastActive: e.student.streak?.lastActivityDate?.toISOString() || null,
      enrolledAt: e.enrolledAt.toISOString(),
    })),
    assignments: classroom.assignments.map(a => ({
      id: a.id,
      title: a.title,
      description: a.description,
      targetType: a.targetType,
      dueDate: a.dueDate?.toISOString() || null,
      submissionCount: a._count.submissions,
      totalStudents: classroom._count.enrollments,
      createdAt: a.createdAt.toISOString(),
    })),
  }

  return <ClassroomDetailClient classroom={data} />
}
