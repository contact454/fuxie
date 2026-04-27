import { redirect } from 'next/navigation'
import { prisma } from '@fuxie/database'
import { getServerUser } from '@/lib/auth/server-auth'
import { ClassroomsClientDynamic } from './ClassroomsClientDynamic'

export const metadata = {
  title: 'Lớp học | Fuxie Teacher',
  description: 'Quản lý lớp học — Tạo lớp, thêm học viên, giao bài',
}

export default async function ClassroomsPage() {
  const serverUser = await getServerUser()
  if (!serverUser) redirect('/login')

  const classrooms = await prisma.classroom.findMany({
    where: { teacherId: serverUser.userId, isArchived: false },
    include: {
      _count: { select: { enrollments: true, assignments: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  const formatted = classrooms.map(c => ({
    id: c.id,
    name: c.name,
    description: c.description,
    joinCode: c.joinCode,
    cefrLevel: c.cefrLevel,
    studentCount: c._count.enrollments,
    assignmentCount: c._count.assignments,
    createdAt: c.createdAt.toISOString(),
  }))

  return <ClassroomsClientDynamic initialClassrooms={formatted} />
}
