import Link from 'next/link';
import { redirect, notFound } from 'next/navigation'
import { prisma } from '@fuxie/database'
import { getServerUser } from '@/lib/auth/server-auth'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const student = await prisma.user.findUnique({
    where: { id },
    include: { profile: { select: { displayName: true } } },
  })
  return {
    title: student?.profile?.displayName
      ? `${student.profile.displayName} | Fuxie Teacher`
      : 'Hồ sơ học viên | Fuxie Teacher',
  }
}

export default async function StudentProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const serverUser = await getServerUser()
  if (!serverUser) redirect('/login')

  const { id: studentId } = await params

  // Verify teacher has this student
  const enrollment = await prisma.classEnrollment.findFirst({
    where: {
      studentId,
      removedAt: null,
      classroom: { teacherId: serverUser.userId, isArchived: false },
    },
    include: { classroom: { select: { name: true } } },
  })
  if (!enrollment) notFound()

  const student = await prisma.user.findUnique({
    where: { id: studentId },
    include: {
      profile: true,
      streak: true,
      dailyActivities: {
        orderBy: { date: 'desc' },
        take: 30,
      },
      studentSubmissions: {
        where: {
          assignment: { classroom: { teacherId: serverUser.userId } },
        },
        include: {
          assignment: {
            select: { title: true, targetType: true, dueDate: true, classroom: { select: { name: true } } },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
      },
      assessments: {
        orderBy: { assessedAt: 'desc' },
        take: 6,
      },
      // Enrolled classrooms for this teacher
      studentEnrollments: {
        where: {
          removedAt: null,
          classroom: { teacherId: serverUser.userId, isArchived: false },
        },
        include: { classroom: { select: { name: true, cefrLevel: true } } },
      },
    },
  })

  if (!student) notFound()

  const profile = student.profile
  const streak = student.streak

  // Skill scores for radar chart data
  const skillMap: Record<string, number> = {}
  for (const a of student.assessments) {
    if (!(a.skill in skillMap)) skillMap[a.skill] = a.score
  }

  const totalMinutesLast7Days = student.dailyActivities
    .slice(0, 7)
    .reduce((s, d) => s + d.totalMinutes, 0)

  const pendingCount = student.studentSubmissions.filter(s => s.status === 'pending').length
  const completedCount = student.studentSubmissions.filter(s => s.status !== 'pending').length

  const TARGET_TYPE_LABELS: Record<string, string> = {
    xp: '🎯 XP', vocabulary: '📚 Từ vựng', grammar: '📐 Ngữ pháp',
    listening: '🎧 Nghe', reading: '📖 Đọc', writing: '✍️ Viết',
    speaking: '🎤 Nói', exam: '📝 Thi thử', lesson: '📕 Bài học',
  }

  const SKILL_LABELS: Record<string, string> = {
    HOEREN: '🎧 Nghe', LESEN: '📖 Đọc', SCHREIBEN: '✍️ Viết',
    SPRECHEN: '🎤 Nói', GRAMMATIK: '📐 Ngữ pháp', WORTSCHATZ: '📚 Từ vựng',
  }

  return (
    <div>
      <Link href="/teacher/classrooms" style={{ color: '#64748b', textDecoration: 'none', fontSize: '0.85rem' }}>← Quay lại</Link>

      {/* Profile header */}
      <div style={{
        background: '#1e293b', borderRadius: '20px', padding: '28px',
        border: '1px solid #334155', marginTop: '12px', marginBottom: '24px',
        display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap',
      }}>
        <div style={{
          width: '64px', height: '64px', borderRadius: '16px',
          background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'white', fontWeight: 800, fontSize: '1.5rem', flexShrink: 0,
        }}>
          {(profile?.displayName || 'L').charAt(0).toUpperCase()}
        </div>
        <div style={{ flex: 1, minWidth: '200px' }}>
          <h1 style={{ color: '#f8fafc', fontSize: '1.4rem', fontWeight: 800, margin: '0 0 4px' }}>
            {profile?.displayName || student.email}
          </h1>
          <p style={{ color: '#94a3b8', margin: '0 0 4px', fontSize: '0.85rem' }}>{student.email}</p>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {student.studentEnrollments.map(e => (
              <span key={e.id} style={{
                background: '#334155', color: '#94a3b8', padding: '2px 10px',
                borderRadius: '6px', fontSize: '0.75rem',
              }}>
                {e.classroom.name}
              </span>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ color: '#60a5fa', fontSize: '1.5rem', fontWeight: 800 }}>{profile?.currentLevel || 'A1'}</div>
            <div style={{ color: '#64748b', fontSize: '0.75rem' }}>Level</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ color: '#fbbf24', fontSize: '1.5rem', fontWeight: 800 }}>{(profile?.totalXp || 0).toLocaleString()}</div>
            <div style={{ color: '#64748b', fontSize: '0.75rem' }}>XP</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ color: '#f97316', fontSize: '1.5rem', fontWeight: 800 }}>{streak?.currentStreak || 0}🔥</div>
            <div style={{ color: '#64748b', fontSize: '0.75rem' }}>Streak</div>
          </div>
        </div>
      </div>

      {/* Stats cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '24px' }}>
        {[
          { label: 'Phút học (7 ngày)', value: totalMinutesLast7Days, icon: '⏱️', color: '#3b82f6' },
          { label: 'Tổng phút học', value: profile?.totalStudyMinutes || 0, icon: '📊', color: '#10b981' },
          { label: 'Bài đã xong', value: profile?.totalLessonsCompleted || 0, icon: '✅', color: '#8b5cf6' },
          { label: 'Từ đã học', value: profile?.totalWordsLearned || 0, icon: '📚', color: '#f59e0b' },
          { label: 'Bài giao chờ', value: pendingCount, icon: '📋', color: pendingCount > 0 ? '#f87171' : '#64748b' },
          { label: 'Bài giao xong', value: completedCount, icon: '🏆', color: '#10b981' },
        ].map(stat => (
          <div key={stat.label} style={{
            background: '#1e293b', borderRadius: '14px', padding: '16px',
            border: '1px solid #334155',
          }}>
            <div style={{ fontSize: '1.2rem', marginBottom: '2px' }}>{stat.icon}</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: stat.color }}>{stat.value}</div>
            <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Skill scores */}
      {Object.keys(skillMap).length > 0 && (
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{ color: '#f8fafc', fontSize: '1.1rem', fontWeight: 700, margin: '0 0 12px' }}>Điểm theo kỹ năng</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '10px' }}>
            {Object.entries(skillMap).map(([skill, score]) => (
              <div key={skill} style={{
                background: '#1e293b', borderRadius: '12px', padding: '14px',
                border: '1px solid #334155',
              }}>
                <div style={{ color: '#94a3b8', fontSize: '0.8rem', marginBottom: '6px' }}>
                  {SKILL_LABELS[skill] || skill}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ flex: 1, background: '#334155', borderRadius: '4px', height: '6px', overflow: 'hidden' }}>
                    <div style={{
                      width: `${Math.min(score * 100, 100)}%`, height: '100%',
                      background: score >= 0.8 ? '#10b981' : score >= 0.5 ? '#f59e0b' : '#f87171',
                      borderRadius: '4px',
                    }} />
                  </div>
                  <span style={{ color: '#e2e8f0', fontWeight: 700, fontSize: '0.85rem' }}>
                    {Math.round(score * 100)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent activity (heatmap-ish) */}
      {student.dailyActivities.length > 0 && (
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{ color: '#f8fafc', fontSize: '1.1rem', fontWeight: 700, margin: '0 0 12px' }}>Hoạt động 30 ngày gần nhất</h2>
          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
            {student.dailyActivities.map(d => {
              const intensity = Math.min(d.totalMinutes / 30, 1)
              return (
                <div key={d.date.toISOString()} title={`${d.date.toLocaleDateString('vi-VN')}: ${d.totalMinutes} phút, ${d.xpEarned} XP`}
                  style={{
                    width: '28px', height: '28px', borderRadius: '6px',
                    background: d.totalMinutes === 0
                      ? '#1e293b'
                      : `rgba(59, 130, 246, ${0.2 + intensity * 0.8})`,
                    border: '1px solid #334155',
                  }} />
              )
            })}
          </div>
        </div>
      )}

      {/* Submissions history */}
      <h2 style={{ color: '#f8fafc', fontSize: '1.1rem', fontWeight: 700, margin: '0 0 12px' }}>Bài giao đã nộp</h2>
      {student.studentSubmissions.length === 0 ? (
        <div style={{ background: '#1e293b', borderRadius: '14px', padding: '32px', textAlign: 'center', border: '1px solid #334155' }}>
          <p style={{ color: '#94a3b8' }}>Chưa có bài nộp nào.</p>
        </div>
      ) : (
        <div style={{ background: '#1e293b', borderRadius: '14px', border: '1px solid #334155', overflow: 'hidden' }}>
          {student.studentSubmissions.map((s, i) => (
            <div key={s.id} style={{
              padding: '14px 20px',
              borderBottom: i < student.studentSubmissions.length - 1 ? '1px solid #334155' : 'none',
              display: 'flex', alignItems: 'center', gap: '12px',
            }}>
              <span style={{
                width: '32px', height: '32px', borderRadius: '8px',
                background: s.status === 'pending' ? '#334155' : '#164e63',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', flexShrink: 0,
              }}>
                {s.status === 'pending' ? '⏳' : s.status === 'completed' ? '✅' : s.status === 'late' ? '⚠️' : '📝'}
              </span>
              <div style={{ flex: 1 }}>
                <div style={{ color: '#e2e8f0', fontWeight: 600, fontSize: '0.9rem' }}>{s.assignment.title}</div>
                <div style={{ color: '#64748b', fontSize: '0.8rem' }}>
                  {TARGET_TYPE_LABELS[s.assignment.targetType] || s.assignment.targetType}
                  {' · '}
                  {s.assignment.classroom.name}
                  {s.assignment.dueDate && ` · Hạn: ${new Date(s.assignment.dueDate).toLocaleDateString('vi-VN')}`}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                {s.score != null ? (
                  <span style={{
                    color: s.score >= 70 ? '#10b981' : s.score >= 40 ? '#f59e0b' : '#f87171',
                    fontWeight: 700, fontSize: '0.95rem',
                  }}>
                    {s.score}{s.maxScore ? `/${s.maxScore}` : '%'}
                  </span>
                ) : (
                  <span style={{
                    fontSize: '0.8rem', fontWeight: 600,
                    color: s.status === 'pending' ? '#f59e0b' : '#94a3b8',
                  }}>
                    {s.status === 'pending' ? 'Chưa làm' : 'Đã nộp'}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
