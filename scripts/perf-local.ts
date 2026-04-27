type Role = 'learner' | 'teacher' | 'admin'

type PerfTarget = {
    name: string
    path: string
    role: Role
    budgetMs: number
    mustContain?: string
}

type PerfResult = {
    target: PerfTarget
    coldMs: number
    warmMs: number[]
    status: number
    bytes: number
    ok: boolean
    budgetOk: boolean
    message?: string
}

const webUrl = trimTrailingSlash(process.env.PERF_WEB_URL ?? process.env.SMOKE_WEB_URL ?? 'http://localhost:3000')
const warmRuns = Number(process.env.PERF_WARM_RUNS ?? 3)
const warnOnly = process.argv.includes('--warn-only') || process.env.PERF_STRICT === '0'

const targets: PerfTarget[] = [
    { name: 'Learner dashboard', path: '/dashboard', role: 'learner', budgetMs: 600, mustContain: '<!DOCTYPE html>' },
    { name: 'Learner vocabulary', path: '/vocabulary', role: 'learner', budgetMs: 600, mustContain: '<!DOCTYPE html>' },
    { name: 'Learner review', path: '/review', role: 'learner', budgetMs: 600, mustContain: '<!DOCTYPE html>' },
    { name: 'Learner today plan API', path: '/api/v1/personalization/today', role: 'learner', budgetMs: 450, mustContain: 'success' },
    { name: 'Learner SRS due API', path: '/api/v1/srs/due?level=A1&limit=5', role: 'learner', budgetMs: 450, mustContain: 'success' },
    { name: 'Teacher dashboard', path: '/teacher', role: 'teacher', budgetMs: 700, mustContain: '<!DOCTYPE html>' },
    { name: 'Teacher classrooms API', path: '/api/v1/teacher/classrooms', role: 'teacher', budgetMs: 450, mustContain: 'success' },
    { name: 'Admin dashboard', path: '/admin', role: 'admin', budgetMs: 800, mustContain: '<!DOCTYPE html>' },
    { name: 'Admin ops API', path: '/api/v1/admin/ops/summary', role: 'admin', budgetMs: 450, mustContain: 'success' },
]

async function main() {
    const cookies = {
        learner: await loginDevRole('learner', '/dashboard'),
        teacher: await loginDevRole('teacher', '/teacher'),
        admin: await loginDevRole('admin', '/admin'),
    }

    const results: PerfResult[] = []
    for (const target of targets) {
        results.push(await measureTarget(target, cookies[target.role]))
    }

    for (const result of results) {
        const median = medianOf(result.warmMs)
        const max = Math.max(...result.warmMs)
        const marker = result.ok && result.budgetOk ? 'PASS' : warnOnly && result.ok ? 'WARN' : 'FAIL'
        console.log(
            `[perf-local] ${marker} ${result.target.name} cold=${result.coldMs}ms warmMedian=${median}ms warmMax=${max}ms budget=${result.target.budgetMs}ms status=${result.status} bytes=${result.bytes}`,
        )
        if (result.message) {
            console.log(`             ${result.message}`)
        }
    }

    const failures = results.filter((result) => !result.ok || (!warnOnly && !result.budgetOk))
    if (failures.length > 0) {
        console.error(
            `[perf-local] ${failures.length} target(s) failed. Use --warn-only or PERF_STRICT=0 when measuring noisy local dev runs.`,
        )
        process.exit(1)
    }
}

async function measureTarget(target: PerfTarget, cookie: string): Promise<PerfResult> {
    const cold = await request(target, cookie)
    const warmMs: number[] = []
    let latest = cold

    for (let i = 0; i < warmRuns; i++) {
        latest = await request(target, cookie)
        warmMs.push(latest.ms)
    }

    const bodyOk = target.mustContain ? latest.text.includes(target.mustContain) : true
    const statusOk = latest.status >= 200 && latest.status < 300
    const median = medianOf(warmMs)
    const budgetOk = median <= target.budgetMs

    return {
        target,
        coldMs: cold.ms,
        warmMs,
        status: latest.status,
        bytes: latest.text.length,
        ok: statusOk && bodyOk,
        budgetOk,
        message: statusOk && !bodyOk
            ? `Expected response body to contain "${target.mustContain}".`
            : !statusOk
                ? `Expected 2xx response, got ${latest.status}. Body: ${latest.text.slice(0, 180)}`
                : !budgetOk
                    ? `Warm median ${median}ms exceeded budget ${target.budgetMs}ms.`
                : undefined,
    }
}

async function request(target: PerfTarget, cookie: string) {
    const started = Date.now()
    const response = await fetch(`${webUrl}${target.path}`, {
        headers: { Cookie: cookie },
    })
    const text = await response.text()
    return {
        status: response.status,
        text,
        ms: Date.now() - started,
    }
}

async function loginDevRole(role: Role, redirect: string) {
    const response = await fetch(
        `${webUrl}/api/dev-auth/login?role=${role}&redirect=${encodeURIComponent(redirect)}`,
        { redirect: 'manual' },
    )
    const setCookie = response.headers.get('set-cookie')
    if (!setCookie) {
        throw new Error(`Dev auth login did not return a cookie for role ${role}. Is FUXIE_DEV_AUTH_ENABLED=true?`)
    }
    return setCookie.split(';')[0]
}

function medianOf(values: number[]) {
    const sorted = [...values].sort((a, b) => a - b)
    const middle = Math.floor(sorted.length / 2)
    return sorted[middle] ?? 0
}

function trimTrailingSlash(value: string) {
    return value.replace(/\/+$/, '')
}

main().catch((error) => {
    console.error('[perf-local] Failed:', error instanceof Error ? error.message : String(error))
    process.exit(1)
})
