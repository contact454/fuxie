import { SessionError } from './errors'

export const SESSION_POLICY = {
    contractVersion: 2,
    gradingVersion: 'vocab-nfc-lower-v1',
    rewardPolicyVersion: 'session-v2-2026-09',
    initialHearts: 5,
    lifetimeMs: 24 * 60 * 60 * 1000,
    retentionMs: 90 * 24 * 60 * 60 * 1000,
    maxNewAttemptsPerDay: 20,
    maxBodyBytes: 8192,
} as const

export function sessionCatalog() {
    const enabled = process.env.FUXIE_SESSION_V2_ENABLED
    const production = process.env.NODE_ENV === 'production'
    const revision = process.env.FUXIE_SESSION_CATALOG_REVISION?.trim()
    const ids = [...new Set((process.env.FUXIE_SESSION_CATALOG_IDS ?? '').split(',').map(id => id.trim()).filter(Boolean))]
    // This candidate has no human-approved serving catalog. An environment flag
    // cannot promote H0 candidates into production learning content.
    if (enabled === 'false' || production) {
        throw new SessionError(503, 'SESSION_UNAVAILABLE', 'Session learning is temporarily unavailable')
    }
    if (ids.length > 500 || ids.some(id => id.length > 128) || (revision?.length ?? 0) > 128) {
        throw new SessionError(503, 'SESSION_UNAVAILABLE', 'Session catalog configuration is invalid')
    }
    return { revision: revision || 'development-published-v1', ids: ids.length ? ids : null }
}
