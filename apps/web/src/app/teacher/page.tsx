import Link from 'next/link';
import { redirect } from 'next/navigation'
import { prisma } from '@fuxie/database'
import { getServerUser } from '@/lib/auth/server-auth'

export const metadata = {
  title: 'Teacher Dashboard | Fuxie',
  description: 'Bảng điều khiển giáo viên — Quản lý lớp học và theo dõi tiến trình học viên',
}

export default async function TeacherOverviewPage() {
  const serverUser = await getServerUser()
  if (!serverUser) redirect('/login')

  // Fetch overview stats
  const [classrooms, recentSubmissions] = await Promise.all([
    prisma.classroom.findMany({
      where: { teacherId: serverUser.userId, isArchived: false },
      include: {
        _count: { select: { enrollments: true, assignments: true } },
      },
      orderBy: { updatedAt: 'desc' },
      take: 6,
    }),
    prisma.assignmentSubmission.findMany({
      where: {
        assignment: { classroom: { teacherId: serverUser.userId } },
        completedAt: { not: null },
      },
      include: {
        student: { include: { profile: { select: { displayName: true } } } },
        assignment: { select: { title: true, targetType: true } },
      },
      orderBy: { completedAt: 'desc' },
      take: 10,
    }),
  ])

  const totalStudents = classrooms.reduce((sum, c) => sum + c._count.enrollments, 0)
  const totalAssignments = classrooms.reduce((sum, c) => sum + c._count.assignments, 0)

  return (
    <div>
      <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#f8fafc', margin: '0 0 8px' }}>
        Xin chào, Giáo viên! 🦊
      </h1>
      <p style={{ color: '#94a3b8', margin: '0 0 32px', fontSize: '0.95rem' }}>
        Tổng quan hoạt động của các lớp học.
      </p>

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        {[
          { label: 'Lớp học', value: classrooms.length, icon: '🏫', color: '#3b82f6' },
          { label: 'Học viên', value: totalStudents, icon: '👥', color: '#10b981' },
          { label: 'Bài giao', value: totalAssignments, icon: '📋', color: '#f59e0b' },
          { label: 'Đã nộp', value: recentSubmissions.length, icon: '✅', color: '#8b5cf6' },
        ].map((stat) => (
          <div key={stat.label} style={{
            background: '#1e293b',
            borderRadius: '16px',
            padding: '20px',
            border: '1px solid #334155',
          }}>
            <div style={{ fontSize: '1.5rem', marginBottom: '4px' }}>{stat.icon}</div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: stat.color }}>{stat.value}</div>
            <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Classrooms */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#f8fafc', margin: 0 }}>Lớp học của bạn</h2>
        <Link href="/teacher/classrooms" style={{ color: '#3b82f6', textDecoration: 'none', fontSize: '0.9rem' }}>
          Xem tất cả →
        </Link>
      </div>

      {classrooms.length === 0 ? (
        <div style={{
          background: '#1e293b',
          borderRadius: '16px',
          padding: '40px',
          textAlign: 'center',
          border: '1px solid #334155',
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '12px' }}>🏫</div>
          <p style={{ color: '#94a3b8', marginBottom: '16px' }}>Bạn chưa có lớp học nào.</p>
          <Link href="/teacher/classrooms" style={{
            display: 'inline-block',
            background: '#3b82f6',
            color: 'white',
            padding: '10px 20px',
            borderRadius: '10px',
            textDecoration: 'none',
            fontWeight: 600,
          }}>
            + Tạo lớp học mới
          </Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px', marginBottom: '32px' }}>
          {classrooms.map(c => (
            <Link key={c.id} href={`/teacher/classrooms/${c.id}`} style={{
              background: '#1e293b',
              borderRadius: '16px',
              padding: '20px',
              textDecoration: 'none',
              border: '1px solid #334155',
              transition: 'border-color 0.2s',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#f8fafc', margin: 0 }}>{c.name}</h3>
                <span style={{
                  background: '#1e3a5f',
                  color: '#60a5fa',
                  padding: '2px 8px',
                  borderRadius: '6px',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                }}>{c.cefrLevel}</span>
              </div>
              <div style={{ display: 'flex', gap: '16px', fontSize: '0.85rem', color: '#94a3b8' }}>
                <span>👥 {c._count.enrollments} học viên</span>
                <span>📋 {c._count.assignments} bài giao</span>
              </div>
              <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '8px' }}>
                Mã lớp: <strong style={{ color: '#f97316' }}>{c.joinCode}</strong>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Recent Activity */}
      {recentSubmissions.length > 0 && (
        <>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#f8fafc', margin: '0 0 16px' }}>
            Hoạt động gần đây
          </h2>
          <div style={{ background: '#1e293b', borderRadius: '16px', border: '1px solid #334155', overflow: 'hidden' }}>
            {recentSubmissions.map((s, i) => (
              <div key={s.id} style={{
                padding: '14px 20px',
                borderBottom: i < recentSubmissions.length - 1 ? '1px solid #334155' : 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
              }}>
                <span style={{
                  width: '32px', height: '32px',
                  background: '#164e63', borderRadius: '8px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.9rem',
                }}>
                  {s.status === 'completed' ? '✅' : '📝'}
                </span>
                <div style={{ flex: 1 }}>
                  <span style={{ color: '#e2e8f0', fontWeight: 600, fontSize: '0.9rem' }}>
                    {s.student.profile?.displayName || s.student.email}
                  </span>
                  <span style={{ color: '#64748b', fontSize: '0.85rem' }}>
                    {' '}đã hoàn thành{' '}
                  </span>
                  <span style={{ color: '#94a3b8', fontWeight: 500, fontSize: '0.9rem' }}>
                    {s.assignment.title}
                  </span>
                </div>
                {s.score != null && (
                  <span style={{
                    color: s.score >= 70 ? '#10b981' : '#f59e0b',
                    fontWeight: 700,
                    fontSize: '0.9rem',
                  }}>
                    {s.score}{s.maxScore ? `/${s.maxScore}` : '%'}
                  </span>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
