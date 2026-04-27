type SmokeResult = {
    name: string
    ok: boolean
    status: number | string
    ms: number
    message?: string
}

const webUrl = trimTrailingSlash(process.env.SMOKE_WEB_URL ?? 'http://localhost:3000')
const aiUrl = trimTrailingSlash(process.env.SMOKE_AI_URL ?? process.env.AI_SERVICE_URL ?? 'http://localhost:3001')

async function main() {
    const learnerCookie = await loginDevRole('learner', '/dashboard')
    const teacherCookie = await loginDevRole('teacher', '/teacher')
    const adminCookie = await loginDevRole('admin', '/admin')

    const results: SmokeResult[] = []
    results.push(await check('AI health', `${aiUrl}/health`, 200, 'fuxie-ai-service'))
    results.push(await check('Web DB health', `${webUrl}/api/v1/health`, 200, 'connected'))

    for (const path of [
        '/dashboard',
        '/vocabulary',
        '/grammar',
        '/reading',
        '/listening',
        '/writing',
        '/speaking',
        '/exam',
        '/review',
        '/chat',
    ]) {
        results.push(await check(`Learner page ${path}`, `${webUrl}${path}`, 200, '<!DOCTYPE html>', learnerCookie))
    }

    for (const path of [
        '/api/v1/auth/me',
        '/api/v1/vocabulary?level=A1&limit=10',
        '/api/v1/vocabulary/themes?level=A1',
        '/api/v1/listening?level=A1',
        '/api/v1/reading?level=A1',
        '/api/v1/exams?level=A1&board=GOETHE',
        '/api/v1/personalization/today',
        '/api/v1/srs/due?level=A1&limit=5',
    ]) {
        results.push(await check(`Learner API ${path}`, `${webUrl}${path}`, 200, 'success', learnerCookie))
    }

    results.push(await check('Teacher page', `${webUrl}/teacher`, 200, '<!DOCTYPE html>', teacherCookie))
    results.push(await check('Teacher classrooms API', `${webUrl}/api/v1/teacher/classrooms`, 200, 'success', teacherCookie))
    results.push(await check('Admin page', `${webUrl}/admin`, 200, '<!DOCTYPE html>', adminCookie))
    results.push(await check('Admin ops API', `${webUrl}/api/v1/admin/ops/summary`, 200, 'success', adminCookie))

    const failed = results.filter((result) => !result.ok)
    for (const result of results) {
        const marker = result.ok ? 'PASS' : 'FAIL'
        console.log(`[full-smoke] ${marker} ${result.name} (${result.status}, ${result.ms}ms)`)
        if (result.message) {
            console.log(`             ${result.message}`)
        }
    }

    const slow = results.filter((result) => result.ok && result.ms > 1500)
    if (slow.length > 0) {
        console.log(`[full-smoke] WARN ${slow.length} checks exceeded 1500ms: ${slow.map((r) => r.name).join(', ')}`)
    }

    if (failed.length > 0) {
        process.exit(1)
    }
}

async function loginDevRole(role: 'learner' | 'teacher' | 'admin', redirect: string) {
    const url = `${webUrl}/api/dev-auth/login?role=${role}&redirect=${encodeURIComponent(redirect)}`
    const response = await fetch(url, { redirect: 'manual' })
    const setCookie = response.headers.get('set-cookie')
    if (!setCookie) {
        throw new Error(`Dev auth login did not return a cookie for role ${role}. Is FUXIE_DEV_AUTH_ENABLED=true?`)
    }
    return setCookie.split(';')[0]
}

async function check(name: string, url: string, expectedStatus: number, mustContain?: string, cookie?: string): Promise<SmokeResult> {
    const started = Date.now()
    try {
        const response = await fetch(url, {
            headers: cookie ? { Cookie: cookie } : undefined,
        })
        const text = await response.text()
        const ms = Date.now() - started
        const okStatus = response.status === expectedStatus
        const okBody = mustContain ? text.includes(mustContain) : true
        const ok = okStatus && okBody

        if (ok && ms > 1500 && mustContain === '<!DOCTYPE html>') {
            const warm = await fetchOnce(url, cookie)
            const warmOkStatus = warm.status === expectedStatus
            const warmOkBody = mustContain ? warm.text.includes(mustContain) : true
            if (warmOkStatus && warmOkBody) {
                return {
                    name,
                    ok: true,
                    status: warm.status,
                    ms: warm.ms,
                    message: `Cold request took ${ms}ms; warm retry took ${warm.ms}ms.`,
                }
            }
        }

        return {
            name,
            ok,
            status: response.status,
            ms,
            message: !okStatus
                ? `Expected HTTP ${expectedStatus}, got ${response.status}. Body: ${text.slice(0, 240)}`
                : !okBody
                    ? `Expected body to contain "${mustContain}".`
                    : undefined,
        }
    } catch (error) {
        return {
            name,
            ok: false,
            status: 'network-error',
            ms: Date.now() - started,
            message: error instanceof Error ? error.message : String(error),
        }
    }
}

async function fetchOnce(url: string, cookie?: string) {
    const started = Date.now()
    const response = await fetch(url, {
        headers: cookie ? { Cookie: cookie } : undefined,
    })
    const text = await response.text()
    return {
        status: response.status,
        text,
        ms: Date.now() - started,
    }
}

function trimTrailingSlash(value: string) {
    return value.replace(/\/+$/, '')
}

main().catch((error) => {
    console.error('[full-smoke] Failed:', error instanceof Error ? error.message : String(error))
    process.exit(1)
})
