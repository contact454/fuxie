/**
 * Auth configuration for next-firebase-auth-edge.
 *
 * Uses inline credentials from server-credentials.ts because
 * Edge Runtime middleware CANNOT access process.env for server-only vars.
 */
import { serverCredentials } from './server-credentials'

export const authConfig = {
    cookieName: 'fuxie-auth',
    cookieSignatureKeys: [
        process.env.AUTH_COOKIE_SECRET || (() => {
            if (process.env.NEXT_PHASE === 'phase-production-build') {
                return 'build-phase-placeholder-not-used-at-runtime'
            }
            if (process.env.NODE_ENV === 'production') {
                throw new Error('[Fuxie] AUTH_COOKIE_SECRET env var is REQUIRED in production!')
            }
            console.warn('[Fuxie] ⚠️  Using insecure cookie secret for development. Set AUTH_COOKIE_SECRET env var.')
            return 'dev-only-insecure-cookie-secret-do-not-use-in-prod'
        })(),
    ],
    cookieSerializeOptions: {
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax' as const,
        maxAge: 12 * 60 * 60 * 24, // 12 days
    },
    serviceAccount: serverCredentials.serviceAccount,
    apiKey: serverCredentials.apiKey,
    projectId: serverCredentials.projectId,
}
