type EnvSource = Record<string, string | undefined>

export interface AssertEnvOptions {
    allowInBuild?: boolean
    prefix?: string
    source?: EnvSource
}

function hasValue(value: string | undefined): boolean {
    return typeof value === 'string' && value.trim().length > 0
}

export function isBuildPhase(source: EnvSource = process.env): boolean {
    return source.NEXT_PHASE === 'phase-production-build'
}

export function getMissingEnvVars(
    keys: string[],
    source: EnvSource = process.env
): string[] {
    return keys.filter((key) => !hasValue(source[key]))
}

export function formatEnvError(prefix: string, missingKeys: string[]): string {
    return `${prefix} Missing required environment variables: ${missingKeys.join(', ')}`
}

export function assertEnvVars(keys: string[], options: AssertEnvOptions = {}): void {
    const {
        allowInBuild = false,
        prefix = '[Env]',
        source = process.env,
    } = options

    const missing = getMissingEnvVars(keys, source)
    if (missing.length === 0) {
        return
    }

    const message = formatEnvError(prefix, missing)
    if (allowInBuild && isBuildPhase(source)) {
        console.warn(`${message} (allowed during build phase)`)
        return
    }

    throw new Error(message)
}

export function hasFirebaseServiceAccountEnv(
    source: EnvSource = process.env
): boolean {
    if (hasValue(source.FIREBASE_SERVICE_ACCOUNT_KEY)) {
        return true
    }

    return [
        source.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        source.FIREBASE_CLIENT_EMAIL,
        source.FIREBASE_PRIVATE_KEY,
    ].every((value) => hasValue(value))
}

export function getGeminiApiKeys(source: EnvSource = process.env): string[] {
    return [
        source.GEMINI_API_KEY,
        source.GOOGLE_AI_API_KEY,
        source.GEMINI_API_KEY_FALLBACK,
    ].filter((value): value is string => hasValue(value))
}
