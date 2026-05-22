'use client'
import Link from 'next/link';


import { useState } from 'react'

interface Classroom {
  id: string
  name: string
  description: string | null
  joinCode: string
  cefrLevel: string
  studentCount: number
  assignmentCount: number
  createdAt: string
}

interface Props {
  initialClassrooms: Classroom[]
}

const CEFR_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']

export default function ClassroomsClient({ initialClassrooms }: Props) {
  const [classrooms, setClassrooms] = useState<Classroom[]>(initialClassrooms)
  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({ name: '', description: '', cefrLevel: 'A1' })
  const [error, setError] = useState('')
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  const handleCreate = async () => {
    if (!form.name.trim()) { setError('Tên lớp là bắt buộc.'); return }
    setCreating(true)
    setError('')
    try {
      const res = await fetch('/api/v1/teacher/classrooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!data.success) { setError(data.error || 'Lỗi tạo lớp.'); return }
      setClassrooms(prev => [{ ...data.data, studentCount: 0, assignmentCount: 0, createdAt: new Date().toISOString() }, ...prev])
      setShowCreate(false)
      setForm({ name: '', description: '', cefrLevel: 'A1' })
    } catch { setError('Lỗi kết nối.') }
    finally { setCreating(false) }
  }

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(code)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-text-inverse)', margin: '0 0 4px' }}>Lớp học</h1>
          <p style={{ color: "var(--color-text-subtle)", margin: 0, fontSize: '0.9rem' }}>{classrooms.length} lớp đang hoạt động</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          style={{
            background: '#3b82f6', color: 'white', border: 'none',
            padding: '10px 20px', borderRadius: '10px', fontWeight: 600,
            cursor: 'pointer', fontSize: '0.95rem',
          }}
        >
          + Tạo lớp mới
        </button>
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
        }} onClick={() => setShowCreate(false)}>
          <div onClick={e => e.stopPropagation()} style={{
            background: '#1e293b', borderRadius: '20px', padding: '32px',
            width: '100%', maxWidth: '480px', border: '1px solid #334155',
          }}>
            <h2 style={{ color: 'var(--color-text-inverse)', fontSize: '1.2rem', fontWeight: 700, margin: '0 0 20px' }}>
              🏫 Tạo lớp học mới
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ color: "var(--color-text-subtle)", fontSize: '0.85rem', display: 'block', marginBottom: '6px' }}>Tên lớp *</label>
                <input
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="VD: Lớp A1 sáng thứ 2"
                  style={{
                    width: '100%', padding: '10px 14px', borderRadius: '10px',
                    background: '#0f172a', border: '1px solid #334155', color: 'var(--color-text-inverse)',
                    fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box',
                  }}
                />
              </div>
              <div>
                <label style={{ color: "var(--color-text-subtle)", fontSize: '0.85rem', display: 'block', marginBottom: '6px' }}>Mô tả</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Mô tả ngắn về lớp học..."
                  rows={2}
                  style={{
                    width: '100%', padding: '10px 14px', borderRadius: '10px',
                    background: '#0f172a', border: '1px solid #334155', color: 'var(--color-text-inverse)',
                    fontSize: '0.95rem', outline: 'none', resize: 'vertical', boxSizing: 'border-box',
                  }}
                />
              </div>
              <div>
                <label style={{ color: "var(--color-text-subtle)", fontSize: '0.85rem', display: 'block', marginBottom: '6px' }}>Trình độ CEFR</label>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {CEFR_LEVELS.map(lv => (
                    <button key={lv} onClick={() => setForm(f => ({ ...f, cefrLevel: lv }))}
                      style={{
                        padding: '6px 14px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                        fontWeight: 600, fontSize: '0.85rem',
                        background: form.cefrLevel === lv ? '#3b82f6' : '#334155',
                        color: form.cefrLevel === lv ? 'white' : '#94a3b8',
                      }}
                    >{lv}</button>
                  ))}
                </div>
              </div>
              {error && <div style={{ color: 'var(--color-text-danger)', fontSize: '0.85rem' }}>{error}</div>}
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' }}>
                <button onClick={() => setShowCreate(false)} style={{
                  padding: '10px 20px', borderRadius: '10px', background: '#334155',
                  color: "var(--color-text-subtle)", border: 'none', cursor: 'pointer', fontWeight: 500,
                }}>Hủy</button>
                <button onClick={handleCreate} disabled={creating} style={{
                  padding: '10px 20px', borderRadius: '10px', background: '#3b82f6',
                  color: 'white', border: 'none', cursor: 'pointer', fontWeight: 600,
                  opacity: creating ? 0.6 : 1,
                }}>{creating ? 'Đang tạo...' : 'Tạo lớp'}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Classrooms Grid */}
      {classrooms.length === 0 ? (
        <div style={{
          background: '#1e293b', borderRadius: '20px', padding: '60px 20px',
          textAlign: 'center', border: '1px solid #334155',
        }}>
          <div style={{ fontSize: '4rem', marginBottom: '16px' }}>🏫</div>
          <p style={{ color: "var(--color-text-subtle)", fontSize: '1.05rem', marginBottom: '20px' }}>
            Chưa có lớp học nào. Hãy tạo lớp đầu tiên của bạn!
          </p>
          <button onClick={() => setShowCreate(true)} style={{
            background: '#3b82f6', color: 'white', border: 'none',
            padding: '12px 24px', borderRadius: '12px', fontWeight: 600, fontSize: '1rem', cursor: 'pointer',
          }}>+ Tạo lớp học mới</button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
          {classrooms.map(c => (
            <Link key={c.id} href={`/teacher/classrooms/${c.id}`} style={{
              background: '#1e293b', borderRadius: '16px', padding: '24px',
              textDecoration: 'none', border: '1px solid #334155',
              transition: 'border-color 0.2s, transform 0.15s',
              display: 'block',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-text-inverse)', margin: 0, lineHeight: 1.3 }}>{c.name}</h3>
                <span style={{
                  background: '#1e3a5f', color: 'var(--color-fuxie-primary)',
                  padding: '3px 10px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 700, flexShrink: 0,
                }}>{c.cefrLevel}</span>
              </div>
              {c.description && (
                <p style={{ color: "var(--color-text-muted)", fontSize: '0.85rem', margin: '0 0 16px', lineHeight: 1.4 }}>{c.description}</p>
              )}
              <div style={{ display: 'flex', gap: '20px', fontSize: '0.9rem', color: "var(--color-text-subtle)", marginBottom: '12px' }}>
                <span>👥 {c.studentCount} học viên</span>
                <span>📋 {c.assignmentCount} bài giao</span>
              </div>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                background: '#0f172a', borderRadius: '8px', padding: '8px 12px',
              }}>
                <span style={{ fontSize: '0.8rem', color: "var(--color-text-muted)" }}>Mã lớp:</span>
                <span style={{ fontWeight: 700, color: 'var(--color-fuxie-energy)', fontSize: '0.95rem', fontFamily: 'monospace', flex: 1 }}>{c.joinCode}</span>
                <button
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); copyCode(c.joinCode) }}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: copiedCode === c.joinCode ? '#10b981' : '#64748b',
                    fontSize: '0.8rem', fontWeight: 500,
                  }}
                >{copiedCode === c.joinCode ? '✓ Đã sao chép' : '📋 Sao chép'}</button>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
