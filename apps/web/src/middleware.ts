import { NextRequest, NextResponse } from 'next/server'
import {
    authMiddleware,
    redirectToHome,
    redirectToLogin,
} from 'next-firebase-auth-edge'
import { authConfig } from '@/lib/auth/config'

const AUTH_PAGES = ['/', '/login', '/register']

export async function middleware(request: NextRequest) {
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
        '/((?!_next|favicon.ico|__/auth|mascot|api/v1|.*\\.).*)',
    ],
}
