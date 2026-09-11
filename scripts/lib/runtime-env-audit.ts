export type EnvSource = Record<string, string | undefined>

export type ConfigState = 'configured' | 'partial' | 'unconfigured' | 'invalid'
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

export function buildRuntimeEnvReport(source: EnvSource = process.env): RuntimeEnvReport {
    const databaseConfiguration = validUrlState(source.DATABASE_URL, ['postgres:', 'postgresql:'])

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
            firebaseAdmin: firebaseAdminState(source),
            firebasePublic: groupedState(source, [
                'NEXT_PUBLIC_FIREBASE_API_KEY',
                'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
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
        ],
    }
}

export function formatRuntimeEnvReport(report: RuntimeEnvReport): string {
    return JSON.stringify(report, null, 2)
}
