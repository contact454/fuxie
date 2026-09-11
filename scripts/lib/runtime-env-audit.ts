export type EnvSource = Record<string, string | undefined>

export type ConfigState = 'configured' | 'partial' | 'unconfigured' | 'invalid' | 'unknown'
export type DatabaseProvider = 'neon' | 'generic-postgres' | 'unknown' | 'unconfigured'

export interface RuntimeEnvReport {
    source: 'process.env'
    database: {
        configuration: ConfigState
        provider: DatabaseProvider
        connectionCheck: 'not_run'
        providerIdentityEvidence: 'unresolved'
        restorePathEvidence: 'unresolved'
    }
    services: {
        firebaseAdmin: ConfigState
        firebasePublic: ConfigState
        bullmqRedis: ConfigState
        upstashCache: ConfigState
        aiService: ConfigState
        openrouter: ConfigState
        gemini: ConfigState
        groqStt: ConfigState
        googleCloudTtsRuntime: ConfigState
        googleCloudTtsBatch: ConfigState
        gcsAudioStorage: ConfigState
        r2Storage: ConfigState
    }
    notes: string[]
}

function hasValue(value: string | undefined): boolean {
    return typeof value === 'string' && value.trim().length > 0
}

function groupedState(source: EnvSource, keys: string[]): ConfigState {
    const present = keys.filter((key) => hasValue(source[key])).length
    if (present === 0) return 'unconfigured'
    if (present === keys.length) return 'configured'
    return 'partial'
}

function validUrlState(value: string | undefined, allowedProtocols?: string[]): ConfigState {
    if (!hasValue(value)) return 'unconfigured'
    try {
        const url = new URL(value as string)
        if (allowedProtocols && !allowedProtocols.includes(url.protocol)) return 'invalid'
        return 'configured'
    } catch {
        return 'invalid'
    }
}

export function classifyDatabaseProvider(value: string | undefined): DatabaseProvider {
    if (!hasValue(value)) return 'unconfigured'
    try {
        const url = new URL(value as string)
        if (!['postgres:', 'postgresql:'].includes(url.protocol)) return 'unknown'
        return url.hostname.toLowerCase().endsWith('.neon.tech') ? 'neon' : 'generic-postgres'
    } catch {
        return 'unknown'
    }
}

function firebaseAdminState(source: EnvSource): ConfigState {
    if (hasValue(source.FIREBASE_SERVICE_ACCOUNT_KEY)) {
        try {
            const parsed = JSON.parse(source.FIREBASE_SERVICE_ACCOUNT_KEY as string) as Record<string, unknown>
            return ['project_id', 'client_email', 'private_key'].every((key) => Boolean(parsed[key]))
                ? 'configured'
                : 'partial'
        } catch {
            return 'invalid'
        }
    }

    return groupedState(source, [
        'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
        'FIREBASE_CLIENT_EMAIL',
        'FIREBASE_PRIVATE_KEY',
    ])
}

function googleCloudCredentialState(source: EnvSource): ConfigState {
    if (hasValue(source.GOOGLE_APPLICATION_CREDENTIALS) || hasValue(source.GOOGLE_CLOUD_PROJECT)) {
        return 'configured'
    }

    // Google client libraries may authenticate through Application Default Credentials
    // supplied by the runtime/host. No explicit env key therefore means unknown, not absent.
    return 'unknown'
}

export function buildRuntimeEnvReport(source: EnvSource = process.env): RuntimeEnvReport {
    const databaseConfiguration = validUrlState(source.DATABASE_URL, ['postgres:', 'postgresql:'])
    const firebaseAdmin = firebaseAdminState(source)
    const googleCloudCredential = googleCloudCredentialState(source)

    return {
        source: 'process.env',
        database: {
            configuration: databaseConfiguration,
            provider: classifyDatabaseProvider(source.DATABASE_URL),
            connectionCheck: 'not_run',
            providerIdentityEvidence: 'unresolved',
            restorePathEvidence: 'unresolved',
        },
        services: {
            firebaseAdmin,
            firebasePublic: groupedState(source, [
                'NEXT_PUBLIC_FIREBASE_API_KEY',
                'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
                'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
                'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
                'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
                'NEXT_PUBLIC_FIREBASE_APP_ID',
            ]),
            bullmqRedis: validUrlState(source.REDIS_URL, ['redis:', 'rediss:']),
            upstashCache: groupedState(source, [
                'UPSTASH_REDIS_REST_URL',
                'UPSTASH_REDIS_REST_TOKEN',
            ]),
            aiService: validUrlState(source.AI_SERVICE_URL, ['http:', 'https:']),
            openrouter: groupedState(source, ['OPENROUTER_API_KEY']),
            gemini: [source.GEMINI_API_KEY, source.GOOGLE_AI_API_KEY, source.GEMINI_API_KEY_FALLBACK]
                .some(hasValue)
                ? 'configured'
                : 'unconfigured',
            groqStt: groupedState(source, ['GROQ_API_KEY']),
            // Learner-facing web/AI-service TTS exchanges the Firebase service account
            // for a Google OAuth token, so its configuration contract is Firebase admin.
            googleCloudTtsRuntime: firebaseAdmin,
            // Batch TTS/GCS scripts use Google client libraries and may rely on ADC.
            googleCloudTtsBatch: googleCloudCredential,
            gcsAudioStorage: hasValue(source.GCS_BUCKET_AUDIO)
                ? googleCloudCredential
                : googleCloudCredential === 'configured'
                    ? 'configured'
                    : 'unknown',
            r2Storage: groupedState(source, [
                'R2_ACCOUNT_ID',
                'R2_ACCESS_KEY_ID',
                'R2_SECRET_ACCESS_KEY',
                'R2_BUCKET',
                'R2_PUBLIC_URL',
            ]),
        },
        notes: [
            'Configuration presence is not provider health evidence.',
            'Database provider identity and restore-path evidence stay unresolved until verified in the actual provider control plane.',
            'BullMQ Redis and Upstash web cache are independent service contracts.',
            'Learner-facing Google Cloud TTS uses the Firebase service account; batch Google Cloud tooling may instead use Application Default Credentials.',
            'Google Cloud batch TTS/GCS state unknown does not mean unavailable because ADC may be supplied outside process.env.',
        ],
    }
}

export function formatRuntimeEnvReport(report: RuntimeEnvReport): string {
    return JSON.stringify(report, null, 2)
}
