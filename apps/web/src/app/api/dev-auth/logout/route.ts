import { NextResponse } from 'next/server'
import { DEV_AUTH_COOKIE, isDevAuthEnabled } from '@/lib/auth/dev-auth'

export async function GET() {
    if (!isDevAuthEnabled()) {
        return NextResponse.json(
            { success: false, error: 'Dev auth is disabled' },
            { status: 404 }
        )
    }

    const res = NextResponse.redirect(new URL('/login', process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'))
    res.cookies.delete(DEV_AUTH_COOKIE)
    return res
}
