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
        process.env.AUTH_COOKIE_SECRET || 'fuxie-cookie-secret-change-in-production-2026',
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
