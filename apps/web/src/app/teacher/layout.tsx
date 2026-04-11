import Link from 'next/link';
import { redirect } from 'next/navigation'
import { getServerUser } from '@/lib/auth/server-auth'
import { prisma } from '@fuxie/database'

export default async function TeacherLayout({ children }: { children: React.ReactNode }) {
  const serverUser = await getServerUser()
  if (!serverUser) redirect('/login')

  // Verify teacher role
  const dbUser = await prisma.user.findUnique({
    where: { id: serverUser.userId },
    select: { role: true },
  })

  if (!dbUser || (dbUser.role !== 'TEACHER' && dbUser.role !== 'ADMIN')) {
    redirect('/dashboard')
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a' }}>
      {/* Teacher nav bar */}
      <nav style={{
        borderBottom: '1px solid #1e293b',
        padding: '12px 24px',
        display: 'flex',
        alignItems: 'center',
        gap: '24px',
        background: '#0f172a',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}>
        <Link href="/teacher" style={{
          fontSize: '1.25rem',
          fontWeight: 800,
          color: '#f97316',
          textDecoration: 'none',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          🦊 Fuxie Teacher
        </Link>
        <div style={{ display: 'flex', gap: '16px', marginLeft: '24px' }}>
          <Link href="/teacher" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 500 }}>
            Tổng quan
          </Link>
          <Link href="/teacher/classrooms" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 500 }}>
            Lớp học
          </Link>
        </div>
        <div style={{ marginLeft: 'auto' }}>
          <Link href="/dashboard" style={{ color: '#64748b', textDecoration: 'none', fontSize: '0.85rem' }}>
            ← Về trang học
          </Link>
        </div>
      </nav>

      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px' }}>
        {children}
      </main>
    </div>
  )
}
