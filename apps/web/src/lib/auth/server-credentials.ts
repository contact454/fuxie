import { assertEnvVars, hasFirebaseServiceAccountEnv, isBuildPhase } from '@fuxie/shared/env'

function emptyServiceAccount() {
    return { projectId: '', clientEmail: '', privateKey: '' }
}

function canUsePlaceholderServiceAccount() {
    return isBuildPhase(process.env) || process.env.NODE_ENV !== 'production'
}

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
    assertEnvVars(
        ['NEXT_PUBLIC_FIREBASE_PROJECT_ID', 'NEXT_PUBLIC_FIREBASE_API_KEY'],
        { allowInBuild: true, prefix: '[Fuxie/Web]' }
    )

    const envKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
    if (envKey) {
        try {
            const parsed = JSON.parse(envKey)
            if (!parsed.project_id || !parsed.client_email || !parsed.private_key) {
                throw new Error('Service account JSON is missing required fields.')
            }

            return {
                projectId: parsed.project_id,
                clientEmail: parsed.client_email,
                privateKey: parsed.private_key,
            }
        } catch {
            if (canUsePlaceholderServiceAccount()) {
                if (!isBuildPhase(process.env)) {
                    console.warn('[Fuxie/Web] Ignoring invalid FIREBASE_SERVICE_ACCOUNT_KEY outside production.')
                }
                return emptyServiceAccount()
            }

            throw new Error('[Fuxie] Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY. Provide valid Firebase service account JSON.')
        }
    }

    if (!hasFirebaseServiceAccountEnv(process.env)) {
        if (canUsePlaceholderServiceAccount()) {
            return emptyServiceAccount()
        }

        throw new Error(
            '[Fuxie] Missing Firebase credentials. Set FIREBASE_SERVICE_ACCOUNT_KEY env var ' +
            '(JSON string) or individual NEXT_PUBLIC_FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, ' +
            'FIREBASE_PRIVATE_KEY env vars.'
        )
    }

    // In development, check individual env vars as fallback
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')

    if (projectId && clientEmail && privateKey) {
        return { projectId, clientEmail, privateKey }
    }

    throw new Error('[Fuxie] Firebase credentials are present but incomplete.')
}

export const serverCredentials = {
    serviceAccount: getServiceAccount(),
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
}
