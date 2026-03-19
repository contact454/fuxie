/**
 * Firebase service account credentials for server-side auth.
 *
 * Uses environment variables for ALL environments.
 * NEVER hardcode credentials in source code.
 *
 * Required env vars:
 * - FIREBASE_SERVICE_ACCOUNT_KEY: JSON string of Firebase service account
 * - NEXT_PUBLIC_FIREBASE_PROJECT_ID: Firebase project ID
 * - NEXT_PUBLIC_FIREBASE_API_KEY: Firebase API key
 *
 * NOTE: Edge Runtime middleware CAN access env vars if they are
 * explicitly exposed in next.config.ts env{} block.
 */

function getServiceAccount() {
    const envKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
    if (envKey) {
        try {
            const parsed = JSON.parse(envKey)
            return {
                projectId: parsed.project_id,
                clientEmail: parsed.client_email,
                privateKey: parsed.private_key,
            }
        } catch {
            console.error('[Fuxie] Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY')
        }
    }

    // In development, check individual env vars as fallback
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')

    if (projectId && clientEmail && privateKey) {
        return { projectId, clientEmail, privateKey }
    }

    // During `next build` (Vercel), don't crash — routes are collected but not executed.
    // At runtime, the env vars will be available and this code won't be reached.
    if (process.env.NEXT_PHASE === 'phase-production-build') {
        console.warn('[Fuxie] ⚠️  Skipping Firebase init during build phase (credentials unavailable)')
        return { projectId: '', clientEmail: '', privateKey: '' }
    }

    throw new Error(
        '[Fuxie] Missing Firebase credentials. Set FIREBASE_SERVICE_ACCOUNT_KEY env var ' +
        '(JSON string) or individual NEXT_PUBLIC_FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, ' +
        'FIREBASE_PRIVATE_KEY env vars.'
    )
}

export const serverCredentials = {
    serviceAccount: getServiceAccount(),
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
}
