import { NextRequest } from 'next/server'
import { withDbAuth } from '@/lib/auth/middleware'
import { prisma } from '@fuxie/database'

/**
 * Require the authenticated user to have TEACHER or ADMIN role.
 * Throws 403 if the user is a LEARNER or CONTENT_CREATOR.
 */
export async function requireTeacher(request: NextRequest) {
  const dbUser = await withDbAuth(request)

  if (!dbUser || (dbUser.role !== 'TEACHER' && dbUser.role !== 'ADMIN')) {
    const err = Object.assign(
      new Error('Bạn không có quyền truy cập trang giáo viên.'),
      { status: 403 }
    )
    throw err
  }

  return dbUser
}

/**
 * Generate a unique 7-character join code (FUX-XXX).
 * Retries up to 5 times if collision occurs.
 */
export async function generateJoinCode(): Promise<string> {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // No I/O/0/1 to avoid confusion
  for (let attempt = 0; attempt < 5; attempt++) {
    let code = 'FUX-'
    for (let i = 0; i < 3; i++) {
      code += chars[Math.floor(Math.random() * chars.length)]
    }
    const existing = await prisma.classroom.findUnique({ where: { joinCode: code } })
    if (!existing) return code
  }
  // Fallback: longer code
  let code = 'FUX-'
  for (let i = 0; i < 5; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}
