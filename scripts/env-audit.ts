import { existsSync, readFileSync } from 'node:fs'
import net from 'node:net'
import dotenv from 'dotenv'

import { buildRuntimeEnvReport, formatRuntimeEnvReport } from './lib/runtime-env-audit'

type Severity = 'error' | 'warn' | 'info'
type EnvSource = Record<string, string | undefined>

interface Finding {
    severity: Severity
    file: string
    message: string
}

const envFiles = [
    '.env',
    'apps/web/.env',
    '.env.production',
    '.env.vercel-prod',
    'apps/ai-service/.env',
]

const findings: Finding[] = []

async function main() {
    const runtimeMode = process.argv.includes('--runtime')
    const checkServices = process.argv.includes('--check-services')

    if (runtimeMode) {
        const source: EnvSource = process.env
        await auditSource('process.env', source, checkServices, true)
        printFindings()
        console.log('[env-audit] RUNTIME_REPORT')
        console.log(formatRuntimeEnvReport(buildRuntimeEnvReport(source)))
    } else {
        for (const file of envFiles) {
            if (!existsSync(file)) {
                continue
            }

            const source = dotenv.parse(readFileSync(file, 'utf8'))
            await auditSource(file, source, checkServices, false)
        }

        printFindings()
    }

    if (findings.some((finding) => finding.severity === 'error')) {
        process.exit(1)
    }
}

async function auditSource(
    label: string,
    source: EnvSource,
    checkServices: boolean,
    redactTargets: boolean
) {
    auditFirebase(label, source)
    auditUrl(label, source, 'DATABASE_URL', ['postgres:', 'postgresql:'])
    auditUrl(label, source, 'REDIS_URL', ['redis:', 'rediss:'])
    auditGemini(label, source)

    if (checkServices) {
        await auditReachable(label, source, 'DATABASE_URL', redactTargets)
        await auditReachable(label, source, 'REDIS_URL', redactTargets)
    }
}

function auditFirebase(file: string, source: EnvSource) {
    const raw = source.FIREBASE_SERVICE_ACCOUNT_KEY
    if (!raw) {
        if (file.includes('production')) {
            add('warn', file, 'FIREBASE_SERVICE_ACCOUNT_KEY is not set')
        }
        return
    }

    try {
        const parsed = JSON.parse(raw)
        const missing = ['project_id', 'client_email', 'private_key'].filter((key) => !parsed[key])
        if (missing.length > 0) {
            add('error', file, `FIREBASE_SERVICE_ACCOUNT_KEY is missing ${missing.join(', ')}`)
            return
        }

        const publicProjectId = source.NEXT_PUBLIC_FIREBASE_PROJECT_ID
        if (publicProjectId && publicProjectId !== parsed.project_id) {
            add('error', file, 'Firebase public project id does not match service account project id')
        }
    } catch {
        add('error', file, 'FIREBASE_SERVICE_ACCOUNT_KEY is not valid JSON after dotenv parsing')
    }
}

function auditUrl(file: string, source: EnvSource, key: string, protocols: string[]) {
    const value = source[key]
    if (!value) {
        return
    }

    try {
        const url = new URL(value)
        if (!protocols.includes(url.protocol)) {
            add('error', file, `${key} must use one of: ${protocols.join(', ')}`)
        }
    } catch {
        add('error', file, `${key} is not a valid URL`)
    }
}

function auditGemini(file: string, source: EnvSource) {
    const hasGeminiKey = Boolean(source.GEMINI_API_KEY || source.GOOGLE_AI_API_KEY)
    if (!hasGeminiKey && !file.endsWith('.env.example')) {
        add('warn', file, 'Gemini key is not set')
    }
}

async function auditReachable(
    file: string,
    source: EnvSource,
    key: string,
    redactTarget = false
) {
    const value = source[key]
    if (!value) {
        return
    }

    let url: URL
    try {
        url = new URL(value)
    } catch {
        return
    }

    const port = Number(url.port || defaultPort(url.protocol))
    if (!url.hostname || !port) {
        return
    }

    const reachable = await canConnect(url.hostname, port, 1500)
    if (!reachable) {
        add(
            'warn',
            file,
            redactTarget
                ? `${key} target is not reachable`
                : `${key} target is not reachable at ${url.hostname}:${port}`
        )
    }
}

function defaultPort(protocol: string) {
    if (protocol === 'postgres:' || protocol === 'postgresql:') {
        return '5432'
    }
    if (protocol === 'redis:') {
        return '6379'
    }
    if (protocol === 'rediss:') {
        return '6380'
    }
    return ''
}

function canConnect(host: string, port: number, timeoutMs: number) {
    return new Promise<boolean>((resolve) => {
        const socket = net.createConnection({ host, port })
        const finish = (result: boolean) => {
            socket.destroy()
            resolve(result)
        }

        socket.setTimeout(timeoutMs)
        socket.once('connect', () => finish(true))
        socket.once('timeout', () => finish(false))
        socket.once('error', () => finish(false))
    })
}

function add(severity: Severity, file: string, message: string) {
    findings.push({ severity, file, message })
}

function printFindings() {
    if (findings.length === 0) {
        console.log('[env-audit] No env issues found')
        return
    }

    for (const finding of findings) {
        console.log(`[env-audit] ${finding.severity.toUpperCase()} ${finding.file}: ${finding.message}`)
    }
}

main().catch((error) => {
    console.error('[env-audit] Failed:', error instanceof Error ? error.message : String(error))
    process.exit(1)
})
