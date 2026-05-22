import Link from 'next/link'
import { redirect } from 'next/navigation'
import { prisma } from '@fuxie/database'
import { getServerUser } from '@/lib/auth/server-auth'
import { summarizeClassroomAnalytics } from '@/lib/analytics/teacher-analytics'
import {
  isSlice4VisualQaFixture,
  Slice4TeacherOverdueFixture,
} from '@/components/visual-fixtures/slice-4-staff-fixtures'

export const metadata = {
  title: 'Teacher Dashboard | Fuxie',
  description: 'Bang dieu khien giao vien',
}

export default async function TeacherOverviewPage({ searchParams }: { searchParams: Promise<{ state?: string; fixture?: string }> }) {
  const visualParams = await searchParams
  if (isSlice4VisualQaFixture(visualParams, 'error')) {
    return <Slice4TeacherOverdueFixture />
  }

  const serverUser = await getServerUser()
  if (!serverUser) redirect('/login')

  const [classrooms, recentSubmissions] = await Promise.all([
    prisma.classroom.findMany({
      where: { teacherId: serverUser.userId, isArchived: false },
      include: {
        enrollments: {
          where: { removedAt: null },
          include: {
            student: {
              include: {
                profile: {
                  select: {
                    displayName: true,
                    totalXp: true,
                    totalStudyMinutes: true,
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
        },
        assignments: {
          include: {
            _count: {
              select: {
                submissions: {
                  where: { status: { not: 'pending' } },
                },
              },
            },
          },
        },
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

  const totalStudents = classrooms.reduce((sum, classroom) => sum + classroom._count.enrollments, 0)
  const totalAssignments = classrooms.reduce((sum, classroom) => sum + classroom._count.assignments, 0)
  const classroomSummaries = classrooms.map((classroom) => ({
    classroomId: classroom.id,
    classroomName: classroom.name,
    summary: summarizeClassroomAnalytics(
      classroom.enrollments.map((enrollment) => ({
        id: enrollment.student.id,
        displayName: enrollment.student.profile?.displayName || enrollment.student.email,
        email: enrollment.student.email,
        totalXp: enrollment.student.profile?.totalXp || 0,
        totalStudyMinutes: enrollment.student.profile?.totalStudyMinutes || 0,
        currentStreak: enrollment.student.streak?.currentStreak || 0,
        lastActive: enrollment.student.streak?.lastActivityDate || null,
        dailyActivities: enrollment.student.dailyActivities,
      })),
      classroom.assignments.map((assignment) => ({
        id: assignment.id,
        title: assignment.title,
        dueDate: assignment.dueDate,
        submissionCount: assignment._count.submissions,
        totalStudents: classroom._count.enrollments,
      }))
    ),
  }))

  const atRiskStudents = classroomSummaries.reduce((sum, item) => sum + item.summary.atRiskCount, 0)
  const overdueAssignments = classroomSummaries.reduce((sum, item) => sum + item.summary.overdueAssignments, 0)
  const studentsNeedingAttention = classroomSummaries
    .flatMap((item) =>
      item.summary.topRiskStudents.map((student) => ({
        ...student,
        classroomId: item.classroomId,
        classroomName: item.classroomName,
      }))
    )
    .sort((a, b) => {
      const levelRank = { high: 2, medium: 1, low: 0 }
      return levelRank[b.level] - levelRank[a.level]
    })
    .slice(0, 5)

  return (
    <div>
      <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-text-inverse)', margin: '0 0 8px' }}>
        Xin chao, Giao vien!
      </h1>
      <p style={{ color: "var(--color-text-subtle)", margin: '0 0 32px', fontSize: '0.95rem' }}>
        Tổng quan lớp học, học viên cần chú ý, và bài giao quá hạn.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        {[
          { label: 'Lop hoc', value: classrooms.length, icon: '🏫', color: "var(--color-text-brand)" },
          { label: 'Học viên', value: totalStudents, icon: '👥', color: 'var(--color-text-success)' },
          { label: 'Bai giao', value: totalAssignments, icon: '📋', color: 'var(--color-text-warning)' },
          { label: 'Can chu y', value: atRiskStudents, icon: '⚠️', color: atRiskStudents > 0 ? '#f87171' : '#8b5cf6' },
          { label: 'Qua han', value: overdueAssignments, icon: '🕒', color: overdueAssignments > 0 ? '#fb7185' : '#94a3b8' },
          { label: 'Da nop', value: recentSubmissions.length, icon: '✅', color: 'var(--color-cefr-c1)' },
        ].map((stat) => (
          <div key={stat.label} style={{
            background: '#1e293b',
            borderRadius: '16px',
            padding: '20px',
            border: '1px solid #334155',
          }}>
            <div style={{ fontSize: '1.5rem', marginBottom: '4px' }}>{stat.icon}</div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: stat.color }}>{stat.value}</div>
            <div style={{ fontSize: '0.85rem', color: "var(--color-text-subtle)" }}>{stat.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--color-text-inverse)', margin: 0 }}>Lop hoc cua ban</h2>
        <Link href="/teacher/classrooms" style={{ color: "var(--color-text-brand)", textDecoration: 'none', fontSize: '0.9rem' }}>
          Xem tat ca →
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
          <p style={{ color: "var(--color-text-subtle)", marginBottom: '16px' }}>Ban chua co lop hoc nao.</p>
          <Link href="/teacher/classrooms" style={{
            display: 'inline-block',
            background: '#3b82f6',
            color: 'white',
            padding: '10px 20px',
            borderRadius: '10px',
            textDecoration: 'none',
            fontWeight: 600,
          }}>
            + Tao lop hoc moi
          </Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px', marginBottom: '32px' }}>
          {classrooms.map((classroom, index) => {
            const summary = classroomSummaries[index]?.summary

            return (
              <Link key={classroom.id} href={`/teacher/classrooms/${classroom.id}`} style={{
                background: '#1e293b',
                borderRadius: '16px',
                padding: '20px',
                textDecoration: 'none',
                border: '1px solid #334155',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-text-inverse)', margin: 0 }}>{classroom.name}</h3>
                  <span style={{
                    background: '#1e3a5f',
                    color: 'var(--color-fuxie-primary)',
                    padding: '2px 8px',
                    borderRadius: '6px',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                  }}>{classroom.cefrLevel}</span>
                </div>
                <div style={{ display: 'flex', gap: '16px', fontSize: '0.85rem', color: "var(--color-text-subtle)", marginBottom: '10px' }}>
                  <span>👥 {classroom._count.enrollments} học viên</span>
                  <span>📋 {classroom._count.assignments} bai giao</span>
                </div>
                {summary && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '8px', fontSize: '0.78rem', color: "var(--color-text-subtle)" }}>
                    <span>Active 7 ngay: <strong style={{ color: 'var(--color-text-subtle)' }}>{summary.activeLast7Days}</strong></span>
                    <span>Can chu y: <strong style={{ color: summary.atRiskCount > 0 ? '#fca5a5' : '#e2e8f0' }}>{summary.atRiskCount}</strong></span>
                    <span>Avg completion: <strong style={{ color: 'var(--color-text-subtle)' }}>{summary.averageCompletionRate}%</strong></span>
                    <span>Qua han: <strong style={{ color: summary.overdueAssignments > 0 ? '#fda4af' : '#e2e8f0' }}>{summary.overdueAssignments}</strong></span>
                  </div>
                )}
              </Link>
            )
          })}
        </div>
      )}

      {studentsNeedingAttention.length > 0 && (
        <>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--color-text-inverse)', margin: '0 0 16px' }}>
            Học viên cần chú ý
          </h2>
          <div style={{ background: '#1e293b', borderRadius: '16px', border: '1px solid #334155', overflow: 'hidden', marginBottom: '32px' }}>
            {studentsNeedingAttention.map((student, index) => (
              <Link
                key={`${student.classroomId}-${student.id}`}
                href={`/teacher/students/${student.id}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '14px 20px',
                  borderBottom: index < studentsNeedingAttention.length - 1 ? '1px solid #334155' : 'none',
                  textDecoration: 'none',
                }}
              >
                <span style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '10px',
                  background: student.level === 'high' ? '#7f1d1d' : '#78350f',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: "var(--color-text-inverse)",
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  flexShrink: 0,
                }}>
                  {student.level === 'high' ? 'H' : 'M'}
                </span>
                <div style={{ flex: 1 }}>
                  <div style={{ color: 'var(--color-text-subtle)', fontWeight: 600, fontSize: '0.9rem' }}>{student.displayName}</div>
                  <div style={{ color: "var(--color-text-muted)", fontSize: '0.8rem' }}>
                    {student.classroomName}
                    {student.inactiveDays != null ? ` · ${student.inactiveDays} ngay khong hoc` : ''}
                    {` · ${student.recentMinutes7d} phut / 7 ngay`}
                  </div>
                </div>
                <div style={{ color: student.level === 'high' ? '#fca5a5' : '#fcd34d', fontSize: '0.8rem', textAlign: 'right', maxWidth: '260px' }}>
                  {student.reasons.slice(0, 2).join(' · ')}
                </div>
              </Link>
            ))}
          </div>
        </>
      )}

      {recentSubmissions.length > 0 && (
        <>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--color-text-inverse)', margin: '0 0 16px' }}>
            Hoat dong gan day
          </h2>
          <div style={{ background: '#1e293b', borderRadius: '16px', border: '1px solid #334155', overflow: 'hidden' }}>
            {recentSubmissions.map((submission, index) => (
              <div key={submission.id} style={{
                padding: '14px 20px',
                borderBottom: index < recentSubmissions.length - 1 ? '1px solid #334155' : 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
              }}>
                <span style={{
                  width: '32px',
                  height: '32px',
                  background: '#164e63',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.9rem',
                }}>
                  {submission.status === 'completed' ? '✅' : '📝'}
                </span>
                <div style={{ flex: 1 }}>
                  <span style={{ color: 'var(--color-text-subtle)', fontWeight: 600, fontSize: '0.9rem' }}>
                    {submission.student.profile?.displayName || submission.student.email}
                  </span>
                  <span style={{ color: "var(--color-text-muted)", fontSize: '0.85rem' }}>
                    {' '}đã hoàn thành{' '}
                  </span>
                  <span style={{ color: "var(--color-text-subtle)", fontWeight: 500, fontSize: '0.9rem' }}>
                    {submission.assignment.title}
                  </span>
                </div>
                {submission.score != null && (
                  <span style={{
                    color: submission.score >= 70 ? '#10b981' : '#f59e0b',
                    fontWeight: 700,
                    fontSize: '0.9rem',
                  }}>
                    {submission.score}{submission.maxScore ? `/${submission.maxScore}` : '%'}
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
