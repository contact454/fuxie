'use client'
import Link from 'next/link'
import { useState } from 'react'

interface Student {
  id: string
  displayName: string
  email: string
  avatarUrl: string | null
  currentLevel: string
  totalXp: number
  totalStudyMinutes: number
  totalLessonsCompleted: number
  currentStreak: number
  lastActive: string | null
  enrolledAt: string
  analytics: {
    riskLevel: 'low' | 'medium' | 'high'
    riskReasons: string[]
    recentMinutes7d: number
    inactiveDays: number | null
  }
}

interface ClassAssignment {
  id: string
  title: string
  description: string | null
  targetType: string
  targetId?: string | null
  targetMeta?: unknown
  dueDate: string | null
  submissionCount: number
  totalStudents: number
  createdAt: string
}

interface InterventionRecommendation {
  id: string
  title: string
  description: string
  targetType: string
  targetId: string | null
  targetMeta: Record<string, unknown>
  targetStudentIds: string[]
  targetStudentNames: string[]
  priority: number
  reason: string
  dueDays: number
  estimatedMinutes: number
}

interface ClassroomData {
  id: string
  name: string
  description: string | null
  joinCode: string
  cefrLevel: string
  students: Student[]
  assignments: ClassAssignment[]
  analytics: {
    studentCount: number
    activeLast7Days: number
    atRiskCount: number
    highRiskCount: number
    averageXp: number
    averageStudyMinutes: number
    averageCompletionRate: number
    overdueAssignments: number
    topRiskStudents: Array<{
      id: string
      displayName: string
      level: 'low' | 'medium' | 'high'
      reasons: string[]
      recentMinutes7d: number
      inactiveDays: number | null
    }>
  }
  interventions: InterventionRecommendation[]
}

interface Props {
  classroom: ClassroomData
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

export default function ClassroomDetailClient({ classroom }: Props) {
  const [tab, setTab] = useState<'students' | 'assignments'>('students')
  const [copiedCode, setCopiedCode] = useState(false)
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [assignForm, setAssignForm] = useState({ title: '', description: '', targetType: 'vocabulary', dueDate: '' })
  const [assigning, setAssigning] = useState(false)
  const [assignments, setAssignments] = useState(classroom.assignments)
  const [interventions, setInterventions] = useState(classroom.interventions)
  const [assigningIntervention, setAssigningIntervention] = useState<string | null>(null)

  const copyCode = () => {
    navigator.clipboard.writeText(classroom.joinCode)
    setCopiedCode(true)
    setTimeout(() => setCopiedCode(false), 2000)
  }

  const handleAssignIntervention = async (recommendationId: string) => {
    setAssigningIntervention(recommendationId)
    try {
      const res = await fetch(`/api/v1/teacher/classrooms/${classroom.id}/interventions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recommendationId }),
      })
      const data = await res.json()
      if (data.success) {
        setAssignments((prev) => [{
          id: data.data.id,
          title: data.data.title,
          description: data.data.description,
          targetType: data.data.targetType,
          targetId: data.data.targetId,
          targetMeta: data.data.targetMeta,
          dueDate: data.data.dueDate,
          submissionCount: data.data.submissionCount,
          totalStudents: data.data.totalStudents,
          createdAt: data.data.createdAt,
        }, ...prev])
        setInterventions((prev) => prev.filter((item) => item.id !== recommendationId))
      }
    } catch (error) {
      console.error(error)
    } finally {
      setAssigningIntervention(null)
    }
  }

  const handleAssign = async () => {
    if (!assignForm.title.trim()) return
    setAssigning(true)
    try {
      const res = await fetch('/api/v1/teacher/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          classroomId: classroom.id,
          title: assignForm.title,
          description: assignForm.description || null,
          targetType: assignForm.targetType,
          dueDate: assignForm.dueDate || null,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setAssignments((prev) => [{
          id: data.data.id,
          title: data.data.title,
          description: assignForm.description || null,
          targetType: data.data.targetType,
          dueDate: data.data.dueDate,
          submissionCount: 0,
          totalStudents: classroom.students.length,
          createdAt: new Date().toISOString(),
        }, ...prev])
        setShowAssignModal(false)
        setAssignForm({ title: '', description: '', targetType: 'vocabulary', dueDate: '' })
      }
    } catch (error) {
      console.error(error)
    } finally {
      setAssigning(false)
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <Link href="/teacher/classrooms" style={{ color: "var(--color-text-muted)", textDecoration: 'none', fontSize: '0.85rem' }}>{"← Quay lai" /* // locale-allow */}</Link>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-text-inverse)', margin: '8px 0 4px' }}>{classroom.name}</h1>
          {classroom.description && <p style={{ color: "var(--color-text-subtle)", margin: 0, fontSize: '0.9rem' }}>{classroom.description}</p>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            background: '#0f172a', borderRadius: '10px', padding: '8px 16px',
            display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid #334155',
          }}>
            <span style={{ color: "var(--color-text-muted)", fontSize: '0.85rem' }}>Ma lop:</span>
            <span style={{ color: 'var(--color-fuxie-energy)', fontWeight: 700, fontFamily: 'monospace', fontSize: '1.1rem' }}>{classroom.joinCode}</span>
            <button onClick={copyCode} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: copiedCode ? '#10b981' : '#64748b', fontSize: '0.8rem',
            }}>{copiedCode ? 'OK' : 'Copy'}</button>
          </div>
          <span style={{
            background: '#1e3a5f', color: 'var(--color-fuxie-primary)',
            padding: '6px 14px', borderRadius: '8px', fontWeight: 700, fontSize: '0.9rem',
          }}>{classroom.cefrLevel}</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '20px' }}>
        {[
          { label: 'Học viên hoạt động 7 ngày qua', value: classroom.analytics.activeLast7Days, color: "var(--color-text-brand)" },
          { label: 'Can chu y', value: classroom.analytics.atRiskCount, color: classroom.analytics.atRiskCount > 0 ? '#f87171' : '#94a3b8' },
          { label: 'Nguy co cao', value: classroom.analytics.highRiskCount, color: classroom.analytics.highRiskCount > 0 ? '#fb7185' : '#94a3b8' },
          { label: 'Avg completion', value: `${classroom.analytics.averageCompletionRate}%`, color: 'var(--color-text-success)' },
          { label: 'Avg XP', value: classroom.analytics.averageXp, color: 'var(--color-fuxie-reward)' },
          { label: 'Qua han', value: classroom.analytics.overdueAssignments, color: classroom.analytics.overdueAssignments > 0 ? '#fb7185' : '#94a3b8' },
        ].map((item) => (
          <div key={item.label} style={{
            background: '#1e293b',
            borderRadius: '14px',
            padding: '16px',
            border: '1px solid #334155',
          }}>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: item.color }}>{item.value}</div>
            <div style={{ fontSize: '0.8rem', color: "var(--color-text-subtle)" }}>{item.label}</div>
          </div>
        ))}
      </div>

      {classroom.analytics.topRiskStudents.length > 0 && (
        <div style={{ background: '#1e293b', borderRadius: '16px', border: '1px solid #334155', overflow: 'hidden', marginBottom: '24px' }}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid #334155', color: 'var(--color-text-inverse)', fontWeight: 700 }}>
            Học viên cần hỗ trợ
          </div>
          {classroom.analytics.topRiskStudents.map((student, index) => (
            <Link
              key={student.id}
              href={`/teacher/students/${student.id}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '14px 18px',
                borderBottom: index < classroom.analytics.topRiskStudents.length - 1 ? '1px solid #334155' : 'none',
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
                fontWeight: 700,
                fontSize: '0.8rem',
                flexShrink: 0,
              }}>
                {student.level === 'high' ? 'H' : 'M'}
              </span>
              <div style={{ flex: 1 }}>
                <div style={{ color: 'var(--color-text-subtle)', fontWeight: 600 }}>{student.displayName}</div>
                <div style={{ color: "var(--color-text-muted)", fontSize: '0.8rem' }}>
                  {student.inactiveDays != null ? `${student.inactiveDays} ngay khong hoc` : 'Chua co activity'}
                  {` · ${student.recentMinutes7d} phut / 7 ngay`}
                </div>
              </div>
              <div style={{ color: student.level === 'high' ? '#fca5a5' : '#fcd34d', fontSize: '0.8rem', maxWidth: '260px', textAlign: 'right' }}>
                {student.reasons.slice(0, 2).join(' · ')}
              </div>
            </Link>
          ))}
        </div>
      )}

      {interventions.length > 0 && (
        <div style={{ background: '#1e293b', borderRadius: '16px', border: '1px solid #334155', padding: '18px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap' }}>
            <div>
              <h2 style={{ color: 'var(--color-text-inverse)', fontSize: '1rem', fontWeight: 700, margin: 0 }}>Intervention suggestions</h2>
              <p style={{ color: "var(--color-text-muted)", fontSize: '0.82rem', margin: '4px 0 0' }}>{"Generated from risk, weak skill, assignment, and activity signals." /* // locale-allow */}</p>
            </div>
            <span style={{ color: "var(--color-text-subtle)", fontSize: '0.82rem' }}>{interventions.length} suggestions</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px' }}>
            {interventions.slice(0, 4).map((item) => (
              <div key={item.id} style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '14px', padding: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', marginBottom: '8px' }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ color: "var(--color-text-muted)", fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 700 }}>
                      {TARGET_TYPE_LABELS[item.targetType] || item.targetType}
                    </div>
                    <div style={{ color: 'var(--color-text-inverse)', fontSize: '0.95rem', fontWeight: 700, marginTop: '4px' }}>{item.title}</div>
                  </div>
                  <span style={{ color: 'var(--color-fuxie-reward)', fontWeight: 800, fontSize: '0.85rem' }}>{item.priority}</span>
                </div>
                <p style={{ color: "var(--color-text-subtle)", fontSize: '0.8rem', lineHeight: 1.45, margin: '0 0 10px' }}>{item.description}</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', color: "var(--color-text-muted)", fontSize: '0.76rem', marginBottom: '12px' }}>
                  <span>{item.reason}</span>
                  <span>{item.targetStudentIds.length} students</span>
                </div>
                <button
                  onClick={() => handleAssignIntervention(item.id)}
                  disabled={assigningIntervention === item.id}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '10px',
                    background: '#2563eb',
                    color: 'white',
                    border: 'none',
                    cursor: 'pointer',
                    fontWeight: 700,
                    fontSize: '0.84rem',
                    opacity: assigningIntervention === item.id ? 0.65 : 1,
                  }}
                >
                  {assigningIntervention === item.id ? 'Creating...' : `Auto-assign (${item.dueDays} days)`}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: '4px', marginBottom: '24px', background: '#1e293b', borderRadius: '12px', padding: '4px' }}>
        {(['students', 'assignments'] as const).map((value) => (
          <button key={value} onClick={() => setTab(value)} style={{
            flex: 1, padding: '10px', borderRadius: '8px', border: 'none', cursor: 'pointer',
            background: tab === value ? '#3b82f6' : 'transparent',
            color: tab === value ? 'white' : '#94a3b8',
            fontWeight: 600, fontSize: '0.9rem',
          }}>
            {value === 'students' ? `Học viên (${classroom.students.length})` : `Bài tập (${assignments.length})`}
          </button>
        ))}
      </div>

      {tab === 'students' && (
        <div>
          {classroom.students.length === 0 ? (
            <div style={{ background: '#1e293b', borderRadius: '16px', padding: '40px', textAlign: 'center', border: '1px solid #334155' }}>
              <div style={{ fontSize: '3rem', marginBottom: '12px' }}>👥</div>
              <p style={{ color: "var(--color-text-subtle)" }}>{"Chưa có học viên nào trong lớp này." /* // locale-allow */}</p>
            </div>
          ) : (
            <div style={{ background: '#1e293b', borderRadius: '16px', border: '1px solid #334155', overflow: 'hidden' }}>
              <div style={{
                display: 'grid', gridTemplateColumns: '2.2fr 0.8fr 0.9fr 0.9fr 0.9fr 1.4fr',
                padding: '12px 20px', borderBottom: '1px solid #334155', fontSize: '0.8rem', color: "var(--color-text-muted)", fontWeight: 600,
              }}>
                <span>{"Học viên" /* // locale-allow */}</span>
                <span>Level</span>
                <span>XP</span>
                <span>Streak</span>
                <span>7 ngay</span>
                <span>Risk</span>
              </div>
              {classroom.students.map((student, index) => (
                <Link key={student.id} href={`/teacher/students/${student.id}`} style={{
                  display: 'grid', gridTemplateColumns: '2.2fr 0.8fr 0.9fr 0.9fr 0.9fr 1.4fr',
                  padding: '14px 20px', textDecoration: 'none',
                  borderBottom: index < classroom.students.length - 1 ? '1px solid #334155' : 'none',
                  alignItems: 'center',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '36px', height: '36px', borderRadius: '10px',
                      background: '#334155', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: "var(--color-text-subtle)", fontWeight: 700, fontSize: '0.85rem',
                    }}>
                      {student.displayName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ color: 'var(--color-text-subtle)', fontWeight: 600, fontSize: '0.9rem' }}>{student.displayName}</div>
                      <div style={{ color: "var(--color-text-muted)", fontSize: '0.75rem' }}>{student.email}</div>
                    </div>
                  </div>
                  <span style={{ color: 'var(--color-fuxie-primary)', fontWeight: 600, fontSize: '0.85rem' }}>{student.currentLevel}</span>
                  <span style={{ color: 'var(--color-fuxie-reward)', fontWeight: 600, fontSize: '0.9rem' }}>{student.totalXp.toLocaleString()}</span>
                  <span style={{ color: student.currentStreak > 0 ? '#f97316' : '#475569', fontWeight: 600, fontSize: '0.9rem' }}>
                    {student.currentStreak > 0 ? `${student.currentStreak}` : '—'}
                  </span>
                  <span style={{ color: "var(--color-text-subtle)", fontSize: '0.9rem' }}>{student.analytics.recentMinutes7d}m</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span style={{
                      color: student.analytics.riskLevel === 'high' ? '#fca5a5' : student.analytics.riskLevel === 'medium' ? '#fcd34d' : '#86efac',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                    }}>
                      {student.analytics.riskLevel.toUpperCase()}
                    </span>
                    <span style={{ color: "var(--color-text-muted)", fontSize: '0.72rem' }}>
                      {student.analytics.riskReasons[0] || 'On track'}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'assignments' && (
        <div>
          <div style={{ marginBottom: '16px' }}>
            <button onClick={() => setShowAssignModal(true)} style={{
              background: '#3b82f6', color: 'white', border: 'none',
              padding: '10px 20px', borderRadius: '10px', fontWeight: 600, cursor: 'pointer', fontSize: '0.9rem',
            }}>{"+ Giao bai moi" /* // locale-allow */}</button>
          </div>

          {assignments.length === 0 ? (
            <div style={{ background: '#1e293b', borderRadius: '16px', padding: '40px', textAlign: 'center', border: '1px solid #334155' }}>
              <div style={{ fontSize: '3rem', marginBottom: '12px' }}>📋</div>
              <p style={{ color: "var(--color-text-subtle)" }}>{"Chưa có bài tập nào được giao." /* // locale-allow */}</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {assignments.map((assignment) => {
                const completionPercent = assignment.totalStudents > 0
                  ? Math.round((assignment.submissionCount / assignment.totalStudents) * 100)
                  : 0
                const isOverdue = assignment.dueDate && new Date(assignment.dueDate) < new Date()

                return (
                  <div key={assignment.id} style={{
                    background: '#1e293b', borderRadius: '14px', padding: '20px',
                    border: '1px solid #334155',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                      <div>
                        <h3 style={{ color: 'var(--color-text-inverse)', fontSize: '1rem', fontWeight: 700, margin: '0 0 4px' }}>{assignment.title}</h3>
                        <span style={{ color: "var(--color-text-subtle)", fontSize: '0.8rem' }}>
                          {TARGET_TYPE_LABELS[assignment.targetType] || assignment.targetType}
                        </span>
                      </div>
                      {assignment.dueDate && (
                        <span style={{
                          fontSize: '0.8rem', fontWeight: 600,
                          color: isOverdue ? '#f87171' : '#94a3b8',
                        }}>
                          {isOverdue ? 'Qua han' : new Date(assignment.dueDate).toLocaleDateString('vi-VN')}
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ flex: 1, background: '#334155', borderRadius: '6px', height: '8px', overflow: 'hidden' }}>
                        <div style={{
                          width: `${completionPercent}%`,
                          height: '100%',
                          background: completionPercent >= 100 ? '#10b981' : '#3b82f6',
                          borderRadius: '6px',
                        }} />
                      </div>
                      <span style={{ color: "var(--color-text-subtle)", fontSize: '0.85rem', fontWeight: 600, minWidth: '84px', textAlign: 'right' }}>
                        {assignment.submissionCount}/{assignment.totalStudents}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {showAssignModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
        }} onClick={() => setShowAssignModal(false)}>
          <div onClick={(event) => event.stopPropagation()} style={{
            background: '#1e293b', borderRadius: '20px', padding: '32px',
            width: '100%', maxWidth: '520px', border: '1px solid #334155',
          }}>
            <h2 style={{ color: 'var(--color-text-inverse)', fontSize: '1.2rem', fontWeight: 700, margin: '0 0 20px' }}>{"Giao bài tập mới" /* // locale-allow */}</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ color: "var(--color-text-subtle)", fontSize: '0.85rem', display: 'block', marginBottom: '6px' }}>{"Tieu de *" /* // locale-allow */}</label>
                <input value={assignForm.title} onChange={(event) => setAssignForm((form) => ({ ...form, title: event.target.value }))}
                  style={{
                    width: '100%', padding: '10px 14px', borderRadius: '10px',
                    background: '#0f172a', border: '1px solid #334155', color: 'var(--color-text-inverse)',
                    fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box',
                  }} />
              </div>
              <div>
                <label style={{ color: "var(--color-text-subtle)", fontSize: '0.85rem', display: 'block', marginBottom: '6px' }}>Loai bai</label>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {Object.entries(TARGET_TYPE_LABELS).map(([key, label]) => (
                    <button key={key} onClick={() => setAssignForm((form) => ({ ...form, targetType: key }))}
                      style={{
                        padding: '6px 12px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                        fontSize: '0.8rem', fontWeight: 500,
                        background: assignForm.targetType === key ? '#3b82f6' : '#334155',
                        color: assignForm.targetType === key ? 'white' : '#94a3b8',
                      }}>{label}</button>
                  ))}
                </div>
              </div>
              <div>
                <label style={{ color: "var(--color-text-subtle)", fontSize: '0.85rem', display: 'block', marginBottom: '6px' }}>Han nop</label>
                <input type="datetime-local" value={assignForm.dueDate}
                  onChange={(event) => setAssignForm((form) => ({ ...form, dueDate: event.target.value }))}
                  style={{
                    width: '100%', padding: '10px 14px', borderRadius: '10px',
                    background: '#0f172a', border: '1px solid #334155', color: 'var(--color-text-inverse)',
                    fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box',
                  }} />
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' }}>
                <button onClick={() => setShowAssignModal(false)} style={{
                  padding: '10px 20px', borderRadius: '10px', background: '#334155',
                  color: "var(--color-text-subtle)", border: 'none', cursor: 'pointer', fontWeight: 500,
                }}>Huy</button>
                <button onClick={handleAssign} disabled={assigning} style={{
                  padding: '10px 20px', borderRadius: '10px', background: '#3b82f6',
                  color: 'white', border: 'none', cursor: 'pointer', fontWeight: 600,
                  opacity: assigning ? 0.6 : 1,
                }}>{assigning ? 'Dang giao...' : 'Giao bai'}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
