type SmokeCase = {
    name: string
    url: string
    method?: 'GET' | 'POST'
    body?: unknown
    expectedStatus: number
    mustContain?: string
}

const webUrl = trimTrailingSlash(process.env.SMOKE_WEB_URL ?? 'http://localhost:3000')
const aiUrl = trimTrailingSlash(process.env.SMOKE_AI_URL ?? process.env.AI_SERVICE_URL ?? 'http://localhost:3001')
const checkDb = process.env.SMOKE_CHECK_DB === 'true' || process.argv.includes('--db')

const cases: SmokeCase[] = [
    {
        name: 'AI service health',
        url: `${aiUrl}/health`,
        expectedStatus: 200,
        mustContain: 'fuxie-ai-service',
    },
    ...(checkDb
        ? [
            {
                name: 'Web DB health',
                url: `${webUrl}/api/v1/health`,
                expectedStatus: 200,
                mustContain: 'connected',
            },
        ]
        : []),
    {
        name: 'Web root renders',
        url: webUrl,
        expectedStatus: 200,
        mustContain: '<!DOCTYPE html>',
    },
    {
        name: 'Login page renders',
        url: `${webUrl}/login`,
        expectedStatus: 200,
        mustContain: '<!DOCTYPE html>',
    },
    {
        name: 'Live credentials require auth',
        url: `${webUrl}/api/v1/chat/credentials`,
        expectedStatus: 401,
        mustContain: 'Unauthorized',
    },
    {
        name: 'Generate API requires auth',
        url: `${webUrl}/api/v1/generate`,
        method: 'POST',
        body: { type: 'vocabulary', cefrLevel: 'A1', topic: 'Alltag' },
        expectedStatus: 401,
        mustContain: 'UNAUTHORIZED',
    },
    {
        name: 'Grade API requires auth',
        url: `${webUrl}/api/v1/grade`,
        method: 'POST',
        body: { type: 'grammar', cefrLevel: 'A1', sentence: 'Ich bin hier.' },
        expectedStatus: 401,
        mustContain: 'UNAUTHORIZED',
    },
]

async function main() {
    const results = await Promise.all(cases.map(runCase))
    const failed = results.filter((result) => !result.ok)

    for (const result of results) {
        const marker = result.ok ? 'PASS' : 'FAIL'
        console.log(`[smoke] ${marker} ${result.name} (${result.status})`)
        if (!result.ok) {
            console.log(`        ${result.message}`)
        }
    }

    if (failed.length > 0) {
        process.exit(1)
    }
}

async function runCase(testCase: SmokeCase) {
    try {
        const response = await fetch(testCase.url, {
            method: testCase.method ?? 'GET',
            headers: testCase.body ? { 'Content-Type': 'application/json' } : undefined,
            body: testCase.body ? JSON.stringify(testCase.body) : undefined,
        })
        const text = await response.text()
        const statusMatches = response.status === testCase.expectedStatus
        const bodyMatches = testCase.mustContain ? text.includes(testCase.mustContain) : true

        return {
            name: testCase.name,
            ok: statusMatches && bodyMatches,
            status: response.status,
            message: statusMatches
                ? `Expected response body to contain "${testCase.mustContain}".`
                : `Expected HTTP ${testCase.expectedStatus}, got ${response.status}.`,
        }
    } catch (error) {
        return {
            name: testCase.name,
            ok: false,
            status: 'network-error',
            message: error instanceof Error ? error.message : String(error),
        }
    }
}

function trimTrailingSlash(value: string) {
    return value.replace(/\/+$/, '')
}

main()
