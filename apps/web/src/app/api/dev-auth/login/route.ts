import { NextRequest, NextResponse } from 'next/server'
import { DEV_AUTH_COOKIE, getDevAuthUser, isDevAuthEnabled, normalizeDevRole } from '@/lib/auth/dev-auth'

export async function GET(req: NextRequest) {
    if (!isDevAuthEnabled()) {
        return NextResponse.json(
            { success: false, error: 'Dev auth is disabled' },
            { status: 404 }
        )
    }

    const role = normalizeDevRole(req.nextUrl.searchParams.get('role')) ?? 'learner'
    const user = getDevAuthUser(role)
    const redirectTo = req.nextUrl.searchParams.get('redirect') || '/dashboard'

    if (!user) {
        return NextResponse.json(
            { success: false, error: 'Unknown dev auth role' },
            { status: 400 }
        )
    }

    const targetUrl = new URL(redirectTo, req.nextUrl.origin)
    const res = NextResponse.redirect(targetUrl)
    res.cookies.set(DEV_AUTH_COOKIE, role, {
        httpOnly: true,
        sameSite: 'lax',
        secure: false,
        path: '/',
        maxAge: 60 * 60 * 8,
    })
    return res
}
