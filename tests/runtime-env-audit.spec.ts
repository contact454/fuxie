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

    it('maps learner-facing Google Cloud TTS to the Firebase admin credential contract', () => {
        const unconfigured = buildRuntimeEnvReport({})
        expect(unconfigured.services.firebaseAdmin).toBe('unconfigured')
        expect(unconfigured.services.googleCloudTtsRuntime).toBe('unconfigured')

        const configured = buildRuntimeEnvReport({
            FIREBASE_SERVICE_ACCOUNT_KEY: JSON.stringify({
                project_id: 'project',
                client_email: 'tts@example.invalid',
                private_key: 'private-key',
            }),
        })
        expect(configured.services.firebaseAdmin).toBe('configured')
        expect(configured.services.googleCloudTtsRuntime).toBe('configured')
    })

    it('keeps Google Cloud batch TTS/GCS explicit env separate from implicit ADC', () => {
        const implicit = buildRuntimeEnvReport({})
        expect(implicit.services.googleCloudTtsBatch).toBe('unknown')
        expect(implicit.services.gcsAudioStorage).toBe('unknown')

        const explicit = buildRuntimeEnvReport({
            GOOGLE_APPLICATION_CREDENTIALS: '/private/google-credentials.json',
            GCS_BUCKET_AUDIO: 'private-audio-bucket',
        })
        expect(explicit.services.googleCloudTtsBatch).toBe('configured')
        expect(explicit.services.gcsAudioStorage).toBe('configured')
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

    it('never serializes raw credentials, DSNs, account ids, project ids, bucket names, or private hosts', () => {
        const secrets = [
            'db-user-secret',
            'db-password-secret',
            'private-db.internal',
            'redis-password-secret',
            'firebase-public-api-secret',
            'firebase-auth-domain-secret',
            'firebase-project-secret',
            'firebase-storage-secret',
            'firebase-sender-secret',
            'firebase-app-secret',
            'firebase-client-secret@example.invalid',
            'firebase-private-key-secret',
            'openrouter-secret',
            'gemini-secret',
            'groq-secret',
            '/private/google-credentials.json',
            'google-project-secret',
            'gcs-bucket-secret',
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
            NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: 'firebase-auth-domain-secret',
            NEXT_PUBLIC_FIREBASE_PROJECT_ID: 'firebase-project-secret',
            NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: 'firebase-storage-secret',
            NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: 'firebase-sender-secret',
            NEXT_PUBLIC_FIREBASE_APP_ID: 'firebase-app-secret',
            UPSTASH_REDIS_REST_URL: 'https://upstash.internal',
            UPSTASH_REDIS_REST_TOKEN: 'upstash-token-secret',
            OPENROUTER_API_KEY: 'openrouter-secret',
            GEMINI_API_KEY: 'gemini-secret',
            GROQ_API_KEY: 'groq-secret',
            AI_SERVICE_URL: 'https://ai.internal',
            GOOGLE_APPLICATION_CREDENTIALS: '/private/google-credentials.json',
            GOOGLE_CLOUD_PROJECT: 'google-project-secret',
            GCS_BUCKET_AUDIO: 'gcs-bucket-secret',
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
        expect(serialized).not.toContain('r2-public.example.invalid')
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
                        GOOGLE_CLOUD_PROJECT: secret,
                        GCS_BUCKET_AUDIO: secret,
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
