import { describe, expect, it } from 'vitest'
import fc from 'fast-check'

import {
    buildRuntimeEnvReport,
    classifyDatabaseProvider,
    formatRuntimeEnvReport,
} from '../scripts/lib/runtime-env-audit'

describe('runtime environment audit', () => {
    it('classifies database provider without exposing host identity', () => {
        expect(classifyDatabaseProvider('postgresql://user:pass@ep-demo.neon.tech/db')).toBe('neon')
        expect(classifyDatabaseProvider('postgresql://user:pass@private-db.internal/db')).toBe('generic-postgres')
        expect(classifyDatabaseProvider('mysql://user:pass@db.internal/db')).toBe('unknown')
        expect(classifyDatabaseProvider(undefined)).toBe('unconfigured')
    })

    it('keeps BullMQ Redis and Upstash cache as independent contracts', () => {
        const report = buildRuntimeEnvReport({
            REDIS_URL: 'rediss://user:password@redis.internal:6380',
        })

        expect(report.services.bullmqRedis).toBe('configured')
        expect(report.services.upstashCache).toBe('unconfigured')
    })

    it('reports partial grouped configuration instead of treating presence as health', () => {
        const report = buildRuntimeEnvReport({
            R2_ACCOUNT_ID: 'account-id',
            R2_BUCKET: 'bucket-name',
            UPSTASH_REDIS_REST_URL: 'https://cache.example.invalid',
        })

        expect(report.services.r2Storage).toBe('partial')
        expect(report.services.upstashCache).toBe('partial')
        expect(report.database.connectionCheck).toBe('not_run')
        expect(report.database.providerIdentityEvidence).toBe('unresolved')
        expect(report.database.restorePathEvidence).toBe('unresolved')
    })

    it('never serializes raw credentials, DSNs, account ids, project ids, or private hosts', () => {
        const secrets = [
            'db-user-secret',
            'db-password-secret',
            'private-db.internal',
            'redis-password-secret',
            'firebase-project-secret',
            'firebase-client-secret@example.invalid',
            'firebase-private-key-secret',
            'openrouter-secret',
            'gemini-secret',
            'groq-secret',
            'r2-account-secret',
            'r2-access-secret',
            'r2-private-secret',
            'r2-bucket-secret',
            'upstash-token-secret',
        ]

        const report = buildRuntimeEnvReport({
            DATABASE_URL: 'postgresql://db-user-secret:db-password-secret@private-db.internal/app',
            REDIS_URL: 'rediss://default:redis-password-secret@redis.internal:6380',
            FIREBASE_SERVICE_ACCOUNT_KEY: JSON.stringify({
                project_id: 'firebase-project-secret',
                client_email: 'firebase-client-secret@example.invalid',
                private_key: 'firebase-private-key-secret',
            }),
            NEXT_PUBLIC_FIREBASE_API_KEY: 'firebase-public-api-secret',
            NEXT_PUBLIC_FIREBASE_PROJECT_ID: 'firebase-project-secret',
            NEXT_PUBLIC_FIREBASE_APP_ID: 'firebase-app-secret',
            UPSTASH_REDIS_REST_URL: 'https://upstash.internal',
            UPSTASH_REDIS_REST_TOKEN: 'upstash-token-secret',
            OPENROUTER_API_KEY: 'openrouter-secret',
            GEMINI_API_KEY: 'gemini-secret',
            GROQ_API_KEY: 'groq-secret',
            AI_SERVICE_URL: 'https://ai.internal',
            R2_ACCOUNT_ID: 'r2-account-secret',
            R2_ACCESS_KEY_ID: 'r2-access-secret',
            R2_SECRET_ACCESS_KEY: 'r2-private-secret',
            R2_BUCKET: 'r2-bucket-secret',
            R2_PUBLIC_URL: 'https://r2-public.example.invalid',
        })

        const serialized = formatRuntimeEnvReport(report)
        for (const secret of secrets) {
            expect(serialized).not.toContain(secret)
        }
        expect(serialized).not.toContain('upstash.internal')
        expect(serialized).not.toContain('ai.internal')
        expect(serialized).not.toContain('redis.internal')
    })

    it('redacts arbitrary secret material by construction', () => {
        fc.assert(
            fc.property(
                fc.string({ minLength: 1, maxLength: 80 }),
                (raw) => {
                    const secret = `SENSITIVE_VALUE_${Buffer.from(raw).toString('hex')}`
                    const report = buildRuntimeEnvReport({
                        OPENROUTER_API_KEY: secret,
                        GEMINI_API_KEY: secret,
                        GROQ_API_KEY: secret,
                        R2_SECRET_ACCESS_KEY: secret,
                        UPSTASH_REDIS_REST_TOKEN: secret,
                    })
                    expect(formatRuntimeEnvReport(report)).not.toContain(secret)
                }
            ),
            { numRuns: 100 }
        )
    })
})
