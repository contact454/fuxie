'use client'
import Link from 'next/link';


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
}

interface ClassAssignment {
  id: string
  title: string
  description: string | null
  targetType: string
  dueDate: string | null
  submissionCount: number
  totalStudents: number
  createdAt: string
}

interface ClassroomData {
  id: string
  name: string
  description: string | null
  joinCode: string
  cefrLevel: string
  students: Student[]
  assignments: ClassAssignment[]
}

interface Props {
  classroom: ClassroomData
}

const TARGET_TYPE_LABELS: Record<string, string> = {
  xp: '🎯 Mục tiêu XP',
  vocabulary: '📚 Từ vựng',
  grammar: '📐 Ngữ pháp',
  listening: '🎧 Nghe',
  reading: '📖 Đọc',
  writing: '✍️ Viết',
  speaking: '🎤 Nói',
  exam: '📝 Thi thử',
  lesson: '📕 Bài học',
}

export default function ClassroomDetailClient({ classroom }: Props) {
  const [tab, setTab] = useState<'students' | 'assignments'>('students')
  const [copiedCode, setCopiedCode] = useState(false)
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [assignForm, setAssignForm] = useState({ title: '', description: '', targetType: 'vocabulary', dueDate: '' })
  const [assigning, setAssigning] = useState(false)
  const [assignments, setAssignments] = useState(classroom.assignments)

  const copyCode = () => {
    navigator.clipboard.writeText(classroom.joinCode)
    setCopiedCode(true)
    setTimeout(() => setCopiedCode(false), 2000)
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
        setAssignments(prev => [{
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
    } catch (e) { console.error(e) }
    finally { setAssigning(false) }
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <Link href="/teacher/classrooms" style={{ color: '#64748b', textDecoration: 'none', fontSize: '0.85rem' }}>← Quay lại</Link>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f8fafc', margin: '8px 0 4px' }}>{classroom.name}</h1>
          {classroom.description && <p style={{ color: '#94a3b8', margin: 0, fontSize: '0.9rem' }}>{classroom.description}</p>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            background: '#0f172a', borderRadius: '10px', padding: '8px 16px',
            display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid #334155',
          }}>
            <span style={{ color: '#64748b', fontSize: '0.85rem' }}>Mã lớp:</span>
            <span style={{ color: '#f97316', fontWeight: 700, fontFamily: 'monospace', fontSize: '1.1rem' }}>{classroom.joinCode}</span>
            <button onClick={copyCode} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: copiedCode ? '#10b981' : '#64748b', fontSize: '0.8rem',
            }}>{copiedCode ? '✓' : '📋'}</button>
          </div>
          <span style={{
            background: '#1e3a5f', color: '#60a5fa',
            padding: '6px 14px', borderRadius: '8px', fontWeight: 700, fontSize: '0.9rem',
          }}>{classroom.cefrLevel}</span>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '24px', background: '#1e293b', borderRadius: '12px', padding: '4px' }}>
        {(['students', 'assignments'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            flex: 1, padding: '10px', borderRadius: '8px', border: 'none', cursor: 'pointer',
            background: tab === t ? '#3b82f6' : 'transparent',
            color: tab === t ? 'white' : '#94a3b8',
            fontWeight: 600, fontSize: '0.9rem',
          }}>
            {t === 'students' ? `👥 Học viên (${classroom.students.length})` : `📋 Bài tập (${assignments.length})`}
          </button>
        ))}
      </div>

      {/* Students Tab */}
      {tab === 'students' && (
        <div>
          {classroom.students.length === 0 ? (
            <div style={{ background: '#1e293b', borderRadius: '16px', padding: '40px', textAlign: 'center', border: '1px solid #334155' }}>
              <div style={{ fontSize: '3rem', marginBottom: '12px' }}>👥</div>
              <p style={{ color: '#94a3b8' }}>Chưa có học viên nào. Chia sẻ mã lớp <strong style={{ color: '#f97316' }}>{classroom.joinCode}</strong> cho học viên!</p>
            </div>
          ) : (
            <div style={{ background: '#1e293b', borderRadius: '16px', border: '1px solid #334155', overflow: 'hidden' }}>
              {/* Table header */}
              <div style={{
                display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr',
                padding: '12px 20px', borderBottom: '1px solid #334155', fontSize: '0.8rem', color: '#64748b', fontWeight: 600,
              }}>
                <span>Học viên</span>
                <span>Level</span>
                <span>XP</span>
                <span>Streak</span>
                <span>Phút học</span>
                <span>Bài xong</span>
              </div>
              {classroom.students.map((s, i) => (
                <Link key={s.id} href={`/teacher/students/${s.id}`} style={{
                  display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr',
                  padding: '14px 20px', textDecoration: 'none',
                  borderBottom: i < classroom.students.length - 1 ? '1px solid #334155' : 'none',
                  alignItems: 'center', transition: 'background 0.15s',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '36px', height: '36px', borderRadius: '10px',
                      background: '#334155', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#94a3b8', fontWeight: 700, fontSize: '0.85rem',
                    }}>
                      {s.displayName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ color: '#e2e8f0', fontWeight: 600, fontSize: '0.9rem' }}>{s.displayName}</div>
                      <div style={{ color: '#64748b', fontSize: '0.75rem' }}>{s.email}</div>
                    </div>
                  </div>
                  <span style={{ color: '#60a5fa', fontWeight: 600, fontSize: '0.85rem' }}>{s.currentLevel}</span>
                  <span style={{ color: '#fbbf24', fontWeight: 600, fontSize: '0.9rem' }}>{s.totalXp.toLocaleString()}</span>
                  <span style={{ color: s.currentStreak > 0 ? '#f97316' : '#475569', fontWeight: 600, fontSize: '0.9rem' }}>
                    {s.currentStreak > 0 ? `🔥 ${s.currentStreak}` : '—'}
                  </span>
                  <span style={{ color: '#94a3b8', fontSize: '0.9rem' }}>{s.totalStudyMinutes}</span>
                  <span style={{ color: '#94a3b8', fontSize: '0.9rem' }}>{s.totalLessonsCompleted}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Assignments Tab */}
      {tab === 'assignments' && (
        <div>
          <div style={{ marginBottom: '16px' }}>
            <button onClick={() => setShowAssignModal(true)} style={{
              background: '#3b82f6', color: 'white', border: 'none',
              padding: '10px 20px', borderRadius: '10px', fontWeight: 600, cursor: 'pointer', fontSize: '0.9rem',
            }}>+ Giao bài mới</button>
          </div>

          {assignments.length === 0 ? (
            <div style={{ background: '#1e293b', borderRadius: '16px', padding: '40px', textAlign: 'center', border: '1px solid #334155' }}>
              <div style={{ fontSize: '3rem', marginBottom: '12px' }}>📋</div>
              <p style={{ color: '#94a3b8' }}>Chưa có bài tập nào được giao.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {assignments.map(a => {
                const completionPercent = a.totalStudents > 0 ? Math.round((a.submissionCount / a.totalStudents) * 100) : 0
                const isOverdue = a.dueDate && new Date(a.dueDate) < new Date()
                return (
                  <div key={a.id} style={{
                    background: '#1e293b', borderRadius: '14px', padding: '20px',
                    border: '1px solid #334155',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                      <div>
                        <h3 style={{ color: '#f8fafc', fontSize: '1rem', fontWeight: 700, margin: '0 0 4px' }}>{a.title}</h3>
                        <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>
                          {TARGET_TYPE_LABELS[a.targetType] || a.targetType}
                        </span>
                      </div>
                      {a.dueDate && (
                        <span style={{
                          fontSize: '0.8rem', fontWeight: 600,
                          color: isOverdue ? '#f87171' : '#94a3b8',
                        }}>
                          {isOverdue ? '⚠️ Quá hạn' : `📅 ${new Date(a.dueDate).toLocaleDateString('vi-VN')}`}
                        </span>
                      )}
                    </div>
                    {/* Progress bar */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ flex: 1, background: '#334155', borderRadius: '6px', height: '8px', overflow: 'hidden' }}>
                        <div style={{
                          width: `${completionPercent}%`,
                          height: '100%',
                          background: completionPercent >= 100 ? '#10b981' : '#3b82f6',
                          borderRadius: '6px',
                          transition: 'width 0.3s ease',
                        }} />
                      </div>
                      <span style={{ color: '#94a3b8', fontSize: '0.85rem', fontWeight: 600, minWidth: '70px', textAlign: 'right' }}>
                        {a.submissionCount}/{a.totalStudents} nộp
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Assign Modal */}
      {showAssignModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
        }} onClick={() => setShowAssignModal(false)}>
          <div onClick={e => e.stopPropagation()} style={{
            background: '#1e293b', borderRadius: '20px', padding: '32px',
            width: '100%', maxWidth: '520px', border: '1px solid #334155',
          }}>
            <h2 style={{ color: '#f8fafc', fontSize: '1.2rem', fontWeight: 700, margin: '0 0 20px' }}>📋 Giao bài tập mới</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ color: '#94a3b8', fontSize: '0.85rem', display: 'block', marginBottom: '6px' }}>Tiêu đề *</label>
                <input value={assignForm.title} onChange={e => setAssignForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="VD: Ôn tập từ vựng Essen & Trinken"
                  style={{
                    width: '100%', padding: '10px 14px', borderRadius: '10px',
                    background: '#0f172a', border: '1px solid #334155', color: '#f8fafc',
                    fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box',
                  }} />
              </div>
              <div>
                <label style={{ color: '#94a3b8', fontSize: '0.85rem', display: 'block', marginBottom: '6px' }}>Loại bài</label>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {Object.entries(TARGET_TYPE_LABELS).map(([key, label]) => (
                    <button key={key} onClick={() => setAssignForm(f => ({ ...f, targetType: key }))}
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
                <label style={{ color: '#94a3b8', fontSize: '0.85rem', display: 'block', marginBottom: '6px' }}>Hạn nộp</label>
                <input type="datetime-local" value={assignForm.dueDate}
                  onChange={e => setAssignForm(f => ({ ...f, dueDate: e.target.value }))}
                  style={{
                    width: '100%', padding: '10px 14px', borderRadius: '10px',
                    background: '#0f172a', border: '1px solid #334155', color: '#f8fafc',
                    fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box',
                  }} />
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' }}>
                <button onClick={() => setShowAssignModal(false)} style={{
                  padding: '10px 20px', borderRadius: '10px', background: '#334155',
                  color: '#94a3b8', border: 'none', cursor: 'pointer', fontWeight: 500,
                }}>Hủy</button>
                <button onClick={handleAssign} disabled={assigning} style={{
                  padding: '10px 20px', borderRadius: '10px', background: '#3b82f6',
                  color: 'white', border: 'none', cursor: 'pointer', fontWeight: 600,
                  opacity: assigning ? 0.6 : 1,
                }}>{assigning ? 'Đang giao...' : 'Giao bài'}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
