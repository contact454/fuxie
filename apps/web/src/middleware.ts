import { NextRequest, NextResponse } from 'next/server'
import {
    authMiddleware,
    redirectToHome,
    redirectToLogin,
} from 'next-firebase-auth-edge'
import { authConfig } from '@/lib/auth/config'
import { DEV_AUTH_COOKIE, getDevAuthUser, isDevAuthEnabled } from '@/lib/auth/dev-auth'

const AUTH_PAGES = ['/', '/login', '/register']
const DEV_PUBLIC_PATHS = ['/fuxie-live-qa', '/fuxie-world-lab']
const DEV_VISUAL_QA_PATHS = [
    '/admin',
    '/badges',
    '/chat',
    '/course',
    '/dashboard',
    '/exam',
    '/grammar',
    '/listening',
    '/profile',
    '/reading',
    '/review',
    '/session',
    '/speaking',
    '/teacher',
    '/vocabulary',
    '/writing',
]

function isDevVisualQaRequest(request: NextRequest) {
    if (process.env.NODE_ENV === 'production') return false
    if (request.nextUrl.searchParams.get('fixture') !== 'visual-qa') return false

    return DEV_VISUAL_QA_PATHS.some((path) => (
        request.nextUrl.pathname === path ||
        request.nextUrl.pathname.startsWith(`${path}/`)
    ))
}

export async function middleware(request: NextRequest) {
    const requestHeaders = new Headers(request.headers)

    if (
        process.env.NODE_ENV !== 'production' &&
        DEV_PUBLIC_PATHS.includes(request.nextUrl.pathname)
    ) {
        return NextResponse.next()
    }

    if (isDevVisualQaRequest(request)) {
        requestHeaders.set('x-fuxie-visual-qa', '1')
        return NextResponse.next({ request: { headers: requestHeaders } })
    }

    const devUser = getDevAuthUser(request.cookies.get(DEV_AUTH_COOKIE)?.value)
    if (isDevAuthEnabled() && devUser) {
        if (AUTH_PAGES.includes(request.nextUrl.pathname)) {
            return redirectToHome(request, { path: '/dashboard' })
        }

        return NextResponse.next()
    }

    return authMiddleware(request, {
        loginPath: '/api/auth/login',
        logoutPath: '/api/auth/logout',
        ...authConfig,
        handleValidToken: async ({ token, decodedToken }, headers) => {
            // Authenticated user trying to access root/login/register → redirect to dashboard
            if (AUTH_PAGES.includes(request.nextUrl.pathname)) {
                return redirectToHome(request, { path: '/dashboard' })
            }

            // All other pages — allow through
            return NextResponse.next({ request: { headers } })
        },
        handleInvalidToken: async (reason) => {
            // Unauthenticated user — redirect to login (except for public pages)
            return redirectToLogin(request, {
                path: '/login',
                publicPaths: [
                    '/login',
                    '/register',
                    '/api/auth/login',
                    '/api/auth/logout',
                ],
            })
        },
        handleError: async (error) => {
            console.error('[Fuxie Middleware] Auth error:', error)
            return redirectToLogin(request, { path: '/login' })
        },
    })
}

export const config = {
    matcher: [
        '/((?!_next|favicon.ico|__/auth|mascot|api/v1|api/dev-auth|.*\\.).*)',
    ],
}
