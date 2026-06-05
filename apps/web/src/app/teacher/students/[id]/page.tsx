import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'
import { prisma } from '@fuxie/database'
import { getServerUser } from '@/lib/auth/server-auth'
import { getStudentRiskProfile } from '@/lib/analytics/teacher-analytics'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const student = await prisma.user.findUnique({
    where: { id },
    include: { profile: { select: { displayName: true } } },
  })
  return {
    title: student?.profile?.displayName
      ? `${student.profile.displayName} | Fuxie Teacher`
      : 'Student Profile | Fuxie Teacher',
  }
}

const TARGET_TYPE_LABELS: Record<string, string> = {
  xp: 'Target XP',
  vocabulary: 'Vocabulary',
  grammar: 'Grammar',
  listening: 'Listening',
  reading: 'Reading',
  writing: 'Writing',
  speaking: 'Speaking',
  exam: 'Exam',
  lesson: 'Lesson',
}

const SKILL_LABELS: Record<string, string> = {
  HOEREN: 'Listening',
  LESEN: 'Reading',
  SCHREIBEN: 'Writing',
  SPRECHEN: 'Speaking',
  GRAMMATIK: 'Grammar',
  WORTSCHATZ: 'Vocabulary',
}

export default async function StudentProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const serverUser = await getServerUser()
  if (!serverUser) redirect('/login')

  const { id: studentId } = await params

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
            select: {
              title: true,
              targetType: true,
              dueDate: true,
              classroom: { select: { name: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
      },
      assessments: {
        orderBy: { assessedAt: 'desc' },
        take: 12,
      },
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
  const pendingCount = student.studentSubmissions.filter((submission) => submission.status === 'pending').length
  const completedCount = student.studentSubmissions.filter((submission) => submission.status !== 'pending').length

  const latestSkillScores: Record<string, number> = {}
  for (const assessment of student.assessments) {
    if (!(assessment.skill in latestSkillScores)) {
      latestSkillScores[assessment.skill] = assessment.score
    }
  }

  const risk = getStudentRiskProfile({
    id: student.id,
    displayName: profile?.displayName || student.email,
    email: student.email,
    currentLevel: profile?.currentLevel || 'A1',
    totalXp: profile?.totalXp || 0,
    totalStudyMinutes: profile?.totalStudyMinutes || 0,
    totalLessonsCompleted: profile?.totalLessonsCompleted || 0,
    currentStreak: streak?.currentStreak || 0,
    lastActive: streak?.lastActivityDate || null,
    dailyActivities: student.dailyActivities,
    pendingAssignments: pendingCount,
    skillScores: latestSkillScores,
  })

  const totalMinutesLast7Days = student.dailyActivities
    .slice(0, 7)
    .reduce((sum, day) => sum + day.totalMinutes, 0)

  const totalXpLast7Days = student.dailyActivities
    .slice(0, 7)
    .reduce((sum, day) => sum + day.xpEarned, 0)

  return (
    <div>
      <Link href="/teacher/classrooms" style={{ color: "var(--color-text-muted)", textDecoration: 'none', fontSize: '0.85rem' }}>{"← Quay lai" /* // locale-allow */}</Link>

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
        <div style={{ flex: 1, minWidth: '220px' }}>
          <h1 style={{ color: 'var(--color-text-inverse)', fontSize: '1.4rem', fontWeight: 800, margin: '0 0 4px' }}>
            {profile?.displayName || student.email}
          </h1>
          <p style={{ color: "var(--color-text-subtle)", margin: '0 0 8px', fontSize: '0.85rem' }}>{student.email}</p>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {student.studentEnrollments.map((enrollmentItem) => (
              <span key={enrollmentItem.id} style={{
                background: '#334155', color: "var(--color-text-subtle)", padding: '2px 10px',
                borderRadius: '6px', fontSize: '0.75rem',
              }}>
                {enrollmentItem.classroom.name}
              </span>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ color: 'var(--color-fuxie-primary)', fontSize: '1.5rem', fontWeight: 800 }}>{profile?.currentLevel || 'A1'}</div>
            <div style={{ color: "var(--color-text-muted)", fontSize: '0.75rem' }}>Level</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ color: 'var(--color-fuxie-reward)', fontSize: '1.5rem', fontWeight: 800 }}>{(profile?.totalXp || 0).toLocaleString()}</div>
            <div style={{ color: "var(--color-text-muted)", fontSize: '0.75rem' }}>XP</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ color: 'var(--color-fuxie-energy)', fontSize: '1.5rem', fontWeight: 800 }}>{streak?.currentStreak || 0}</div>
            <div style={{ color: "var(--color-text-muted)", fontSize: '0.75rem' }}>Streak</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(300px, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <div style={{ background: '#1e293b', borderRadius: '16px', border: '1px solid #334155', padding: '20px' }}>
          <h2 style={{ color: 'var(--color-text-inverse)', fontSize: '1rem', fontWeight: 700, margin: '0 0 12px' }}>Risk assessment</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <span style={{
              padding: '6px 10px',
              borderRadius: '999px',
              fontSize: '0.78rem',
              fontWeight: 700,
              color: risk.level === 'high' ? '#fecaca' : risk.level === 'medium' ? '#fde68a' : '#bbf7d0',
              background: risk.level === 'high' ? '#7f1d1d' : risk.level === 'medium' ? '#78350f' : '#14532d',
            }}>
              {risk.level.toUpperCase()}
            </span>
            <span style={{ color: "var(--color-text-subtle)", fontSize: '0.85rem' }}>
              {risk.inactiveDays != null ? `${risk.inactiveDays} ngay khong hoc` : 'Chua co du lieu activity'}
            </span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '10px', marginBottom: '14px' }}>
            <div style={{ background: '#0f172a', borderRadius: '12px', padding: '14px' }}>
              <div style={{ color: "var(--color-text-muted)", fontSize: '0.75rem' }}>{"7 day minutes" /* // locale-allow */}</div>
              <div style={{ color: 'var(--color-text-inverse)', fontSize: '1.2rem', fontWeight: 800 }}>{risk.recentMinutes7d}</div>
            </div>
            <div style={{ background: '#0f172a', borderRadius: '12px', padding: '14px' }}>
              <div style={{ color: "var(--color-text-muted)", fontSize: '0.75rem' }}>Pending work</div>
              <div style={{ color: 'var(--color-text-inverse)', fontSize: '1.2rem', fontWeight: 800 }}>{risk.pendingAssignments}</div>
            </div>
            <div style={{ background: '#0f172a', borderRadius: '12px', padding: '14px' }}>
              <div style={{ color: "var(--color-text-muted)", fontSize: '0.75rem' }}>{"7 day XP" /* // locale-allow */}</div>
              <div style={{ color: 'var(--color-text-inverse)', fontSize: '1.2rem', fontWeight: 800 }}>{totalXpLast7Days}</div>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {risk.reasons.length > 0 ? risk.reasons.map((reason) => (
              <div key={reason} style={{
                background: '#0f172a',
                borderRadius: '10px',
                padding: '10px 12px',
                color: 'var(--color-text-subtle)',
                fontSize: '0.84rem',
                border: '1px solid #334155',
              }}>
                {reason}
              </div>
            )) : (
              <div style={{
                background: '#0f172a',
                borderRadius: '10px',
                padding: '10px 12px',
                color: 'var(--color-text-success)',
                fontSize: '0.84rem',
                border: '1px solid #334155',
              }}>
                Student is currently on track.
              </div>
            )}
          </div>
        </div>

        <div style={{ background: '#1e293b', borderRadius: '16px', border: '1px solid #334155', padding: '20px' }}>
          <h2 style={{ color: 'var(--color-text-inverse)', fontSize: '1rem', fontWeight: 700, margin: '0 0 12px' }}>Skill focus</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '14px' }}>
            <div>
              <div style={{ color: "var(--color-text-muted)", fontSize: '0.75rem', marginBottom: '6px' }}>Weakest skills</div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {risk.weakestSkills.length > 0 ? risk.weakestSkills.map((skill) => (
                  <span key={skill} style={{ background: '#7f1d1d', color: 'var(--color-text-danger)', padding: '4px 10px', borderRadius: '999px', fontSize: '0.78rem', fontWeight: 600 }}>
                    {SKILL_LABELS[skill] || skill}
                  </span>
                )) : <span style={{ color: "var(--color-text-subtle)", fontSize: '0.84rem' }}>{"No weak skills flagged" /* // locale-allow */}</span>}
              </div>
            </div>
            <div>
              <div style={{ color: "var(--color-text-muted)", fontSize: '0.75rem', marginBottom: '6px' }}>Strongest skills</div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {risk.strongestSkills.length > 0 ? risk.strongestSkills.map((skill) => (
                  <span key={skill} style={{ background: '#14532d', color: 'var(--color-text-success)', padding: '4px 10px', borderRadius: '999px', fontSize: '0.78rem', fontWeight: 600 }}>
                    {SKILL_LABELS[skill] || skill}
                  </span>
                )) : <span style={{ color: "var(--color-text-subtle)", fontSize: '0.84rem' }}>{"Not enough assessment data" /* // locale-allow */}</span>}
              </div>
            </div>
          </div>
          <div style={{ color: "var(--color-text-subtle)", fontSize: '0.84rem', lineHeight: 1.5 }}>
            Prioritize the weakest skill first, then use short assignment cycles to rebuild momentum.
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '24px' }}>
        {[
          { label: 'Minutes (7 days)', value: totalMinutesLast7Days, color: "var(--color-text-brand)" },
          { label: 'Total study minutes', value: profile?.totalStudyMinutes || 0, color: 'var(--color-text-success)' },
          { label: 'Lessons completed', value: profile?.totalLessonsCompleted || 0, color: 'var(--color-cefr-c1)' },
          { label: 'Words learned', value: profile?.totalWordsLearned || 0, color: 'var(--color-text-warning)' },
          { label: 'Pending assignments', value: pendingCount, color: pendingCount > 0 ? '#f87171' : '#94a3b8' },
          { label: 'Completed assignments', value: completedCount, color: 'var(--color-text-success)' },
        ].map((stat) => (
          <div key={stat.label} style={{
            background: '#1e293b', borderRadius: '14px', padding: '16px',
            border: '1px solid #334155',
          }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: stat.color }}>{stat.value}</div>
            <div style={{ fontSize: '0.8rem', color: "var(--color-text-subtle)" }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {Object.keys(latestSkillScores).length > 0 && (
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{ color: 'var(--color-text-inverse)', fontSize: '1.1rem', fontWeight: 700, margin: '0 0 12px' }}>{"Latest skill scores" /* // locale-allow */}</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '10px' }}>
            {Object.entries(latestSkillScores).map(([skill, score]) => (
              <div key={skill} style={{
                background: '#1e293b', borderRadius: '12px', padding: '14px',
                border: '1px solid #334155',
              }}>
                <div style={{ color: "var(--color-text-subtle)", fontSize: '0.8rem', marginBottom: '6px' }}>
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
                  <span style={{ color: 'var(--color-text-subtle)', fontWeight: 700, fontSize: '0.85rem' }}>
                    {Math.round(score * 100)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {student.dailyActivities.length > 0 && (
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{ color: 'var(--color-text-inverse)', fontSize: '1.1rem', fontWeight: 700, margin: '0 0 12px' }}>30-day activity</h2>
          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
            {student.dailyActivities.map((day) => {
              const intensity = Math.min(day.totalMinutes / 30, 1)
              return (
                <div
                  key={day.date.toISOString()}
                  title={`${day.date.toLocaleDateString('vi-VN')}: ${day.totalMinutes} min, ${day.xpEarned} XP`}
                  style={{
                    width: '28px', height: '28px', borderRadius: '6px',
                    background: day.totalMinutes === 0
                      ? '#1e293b'
                      : `rgba(59, 130, 246, ${0.2 + intensity * 0.8})`,
                    border: '1px solid #334155',
                  }}
                />
              )
            })}
          </div>
        </div>
      )}

      <h2 style={{ color: 'var(--color-text-inverse)', fontSize: '1.1rem', fontWeight: 700, margin: '0 0 12px' }}>Assignment history</h2>
      {student.studentSubmissions.length === 0 ? (
        <div style={{ background: '#1e293b', borderRadius: '14px', padding: '32px', textAlign: 'center', border: '1px solid #334155' }}>
          <p style={{ color: "var(--color-text-subtle)" }}>{"No submissions yet." /* // locale-allow */}</p>
        </div>
      ) : (
        <div style={{ background: '#1e293b', borderRadius: '14px', border: '1px solid #334155', overflow: 'hidden' }}>
          {student.studentSubmissions.map((submission, index) => (
            <div key={submission.id} style={{
              padding: '14px 20px',
              borderBottom: index < student.studentSubmissions.length - 1 ? '1px solid #334155' : 'none',
              display: 'flex', alignItems: 'center', gap: '12px',
            }}>
              <span style={{
                width: '32px', height: '32px', borderRadius: '8px',
                background: submission.status === 'pending' ? '#334155' : '#164e63',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', flexShrink: 0,
              }}>
                {submission.status === 'pending' ? '⏳' : submission.status === 'completed' ? '✅' : submission.status === 'late' ? '⚠️' : '📝'}
              </span>
              <div style={{ flex: 1 }}>
                <div style={{ color: 'var(--color-text-subtle)', fontWeight: 600, fontSize: '0.9rem' }}>{submission.assignment.title}</div>
                <div style={{ color: "var(--color-text-muted)", fontSize: '0.8rem' }}>
                  {TARGET_TYPE_LABELS[submission.assignment.targetType] || submission.assignment.targetType}
                  {' · '}
                  {submission.assignment.classroom.name}
                  {submission.assignment.dueDate && ` · Due: ${new Date(submission.assignment.dueDate).toLocaleDateString('vi-VN')}`}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                {submission.score != null ? (
                  <span style={{
                    color: submission.score >= 70 ? '#10b981' : submission.score >= 40 ? '#f59e0b' : '#f87171',
                    fontWeight: 700, fontSize: '0.95rem',
                  }}>
                    {submission.score}{submission.maxScore ? `/${submission.maxScore}` : '%'}
                  </span>
                ) : (
                  <span style={{
                    fontSize: '0.8rem', fontWeight: 600,
                    color: submission.status === 'pending' ? '#f59e0b' : '#94a3b8',
                  }}>
                    {submission.status === 'pending' ? 'Pending' : 'Submitted'}
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
