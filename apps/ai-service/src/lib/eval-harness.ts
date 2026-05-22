export const AI_EVAL_FORBIDDEN_OUTPUT_PATTERNS = [
    /\bofficial\s+(goethe|telc|oesd|osd)\s+score\b/i,
    /\bguaranteed\s+(pass|result|score)\b/i,
    /\bwill\s+pass\s+(goethe|telc|oesd|osd)\b/i,
    /\bchac\s+chan\s+do\b/i,
    /\bdam\s+bao\s+do\b/i,
] as const

const CEFR_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const

export type AiEvalSurface = 'writing' | 'speaking' | 'chat' | 'fallback'
export type AiEvalSeverity = 'error' | 'warning'
export type CefrLevel = typeof CEFR_LEVELS[number]

export interface AiEvalFixture {
    suiteVersion: string
    cases: AiEvalCase[]
}

export interface AiEvalCase {
    id: string
    surface: AiEvalSurface
    level: CefrLevel
    description: string
    expected: AiEvalExpectation
    observed: AiEvalObservedOutput
    providerPrompt?: AiEvalProviderPrompt
}

export interface AiEvalProviderPrompt {
    model?: string
    promptVersion: string
    prompt: string
    responseContract: 'ai_eval_observed_output_v1'
}

export interface AiEvalExpectation {
    minScorePercent?: number
    maxScorePercent?: number
    estimatedLevel?: CefrLevel
    allowedEstimatedLevels?: CefrLevel[]
    requiredCriteria?: string[]
    requiredSignals?: string[]
    maxIssueCount?: number
    minIssueCount?: number
    maxCorrectionCount?: number
    minCorrectionCount?: number
    fallbackRequired?: boolean
    expectedStatus?: 'generated' | 'failed'
}

export interface AiEvalObservedOutput {
    status: 'generated' | 'failed'
    scorePercent?: number | null
    estimatedLevel?: string | null
    criteria?: Array<{ id?: string; name?: string; score?: number; maxScore?: number }>
    correctionCount?: number | null
    issueCount?: number | null
    signals?: string[]
    fallbackAction?: string | null
    latencyMs?: number | null
    estimatedCostUsd?: number | null
    outputExcerpt?: string | null
    providerStatus?: string | null
}

export interface AiEvalIssue {
    severity: AiEvalSeverity
    code: string
    message: string
}

export interface AiEvalCaseResult {
    id: string
    surface: AiEvalSurface
    level: CefrLevel
    passed: boolean
    issues: AiEvalIssue[]
    metrics: {
        scorePercent: number | null
        correctionCount: number | null
        issueCount: number | null
        latencyMs: number | null
        estimatedCostUsd: number | null
    }
}

export interface AiEvalSuiteResult {
    suiteVersion: string
    summary: {
        totalCases: number
        passedCases: number
        failedCases: number
        passRate: number
        surfaces: Array<{ surface: AiEvalSurface; totalCases: number; passedCases: number; failedCases: number }>
        averageScorePercent: number | null
        medianLatencyMs: number | null
        totalEstimatedCostUsd: number | null
    }
    cases: AiEvalCaseResult[]
}

export function runAiEvalSuite(fixture: AiEvalFixture): AiEvalSuiteResult {
    const cases = fixture.cases.map(evaluateAiEvalCase)
    const passedCases = cases.filter((item) => item.passed).length
    const failedCases = cases.length - passedCases
    const scoreValues = cases.map((item) => item.metrics.scorePercent).filter(isNumber)
    const latencyValues = cases.map((item) => item.metrics.latencyMs).filter(isNumber)
    const costValues = cases.map((item) => item.metrics.estimatedCostUsd).filter(isNumber)

    return {
        suiteVersion: fixture.suiteVersion,
        summary: {
            totalCases: cases.length,
            passedCases,
            failedCases,
            passRate: percent(passedCases, cases.length),
            surfaces: surfaceSummary(cases),
            averageScorePercent: average(scoreValues),
            medianLatencyMs: median(latencyValues),
            totalEstimatedCostUsd: costValues.length > 0
                ? roundToFourDecimals(costValues.reduce((sum, value) => sum + value, 0))
                : null,
        },
        cases,
    }
}

export function evaluateAiEvalCase(testCase: AiEvalCase): AiEvalCaseResult {
    const issues: AiEvalIssue[] = []
    validateStatus(testCase, issues)
    validateScore(testCase, issues)
    validateEstimatedLevel(testCase, issues)
    validateCriteria(testCase, issues)
    validateCounts(testCase, issues)
    validateSignals(testCase, issues)
    validateFallback(testCase, issues)
    validateOutputSafety(testCase, issues)

    return {
        id: testCase.id,
        surface: testCase.surface,
        level: testCase.level,
        passed: issues.every((issue) => issue.severity !== 'error'),
        issues,
        metrics: {
            scorePercent: nullableNumber(testCase.observed.scorePercent),
            correctionCount: nullableNumber(testCase.observed.correctionCount),
            issueCount: nullableNumber(testCase.observed.issueCount),
            latencyMs: nullableNumber(testCase.observed.latencyMs),
            estimatedCostUsd: nullableNumber(testCase.observed.estimatedCostUsd),
        },
    }
}

function validateStatus(testCase: AiEvalCase, issues: AiEvalIssue[]) {
    const expectedStatus = testCase.expected.expectedStatus
    if (expectedStatus && testCase.observed.status !== expectedStatus) {
        pushIssue(issues, 'error', 'STATUS_MISMATCH', `Expected ${expectedStatus}, got ${testCase.observed.status}`)
    }
}

function validateScore(testCase: AiEvalCase, issues: AiEvalIssue[]) {
    const score = testCase.observed.scorePercent
    if (score === undefined || score === null) {
        if (testCase.surface !== 'chat' && testCase.surface !== 'fallback') {
            pushIssue(issues, 'error', 'MISSING_SCORE', 'Missing scorePercent for graded AI output')
        }
        return
    }

    if (score < 0 || score > 100) {
        pushIssue(issues, 'error', 'INVALID_SCORE_RANGE', 'scorePercent must be between 0 and 100')
    }
    if (testCase.expected.minScorePercent !== undefined && score < testCase.expected.minScorePercent) {
        pushIssue(issues, 'error', 'SCORE_TOO_LOW', `Expected score >= ${testCase.expected.minScorePercent}, got ${score}`)
    }
    if (testCase.expected.maxScorePercent !== undefined && score > testCase.expected.maxScorePercent) {
        pushIssue(issues, 'error', 'SCORE_TOO_HIGH', `Expected score <= ${testCase.expected.maxScorePercent}, got ${score}`)
    }
}

function validateEstimatedLevel(testCase: AiEvalCase, issues: AiEvalIssue[]) {
    const expected = testCase.expected.estimatedLevel
    const allowed = testCase.expected.allowedEstimatedLevels
    const actual = testCase.observed.estimatedLevel

    if (!expected && !allowed) return
    if (!actual) {
        pushIssue(issues, 'error', 'MISSING_ESTIMATED_LEVEL', 'Missing estimatedLevel')
        return
    }

    if (!isCefrLevel(actual)) {
        pushIssue(issues, 'error', 'INVALID_ESTIMATED_LEVEL', `estimatedLevel must be CEFR A1-C2, got ${actual}`)
        return
    }

    if (allowed && !allowed.includes(actual)) {
        pushIssue(issues, 'error', 'ESTIMATED_LEVEL_OUTSIDE_ALLOWED_RANGE', `Expected one of ${allowed.join(', ')}, got ${actual}`)
        return
    }

    if (expected && actual !== expected) {
        pushIssue(issues, 'error', 'ESTIMATED_LEVEL_MISMATCH', `Expected ${expected}, got ${actual}`)
    }
}

function validateCriteria(testCase: AiEvalCase, issues: AiEvalIssue[]) {
    const requiredCriteria = testCase.expected.requiredCriteria ?? []
    if (requiredCriteria.length === 0) return

    const observedCriteria = new Set(
        (testCase.observed.criteria ?? []).flatMap((criterion) => [
            normalizeKey(criterion.id),
            normalizeKey(criterion.name),
        ]).filter(Boolean)
    )

    for (const criterion of requiredCriteria) {
        if (!observedCriteria.has(normalizeKey(criterion))) {
            pushIssue(issues, 'error', 'MISSING_RUBRIC_CRITERION', `Missing rubric criterion "${criterion}"`)
        }
    }
}

function validateCounts(testCase: AiEvalCase, issues: AiEvalIssue[]) {
    validateBoundedCount(issues, 'correction', nullableNumber(testCase.observed.correctionCount), {
        min: testCase.expected.minCorrectionCount,
        max: testCase.expected.maxCorrectionCount,
    })
    validateBoundedCount(issues, 'issue', nullableNumber(testCase.observed.issueCount), {
        min: testCase.expected.minIssueCount,
        max: testCase.expected.maxIssueCount,
    })
}

function validateSignals(testCase: AiEvalCase, issues: AiEvalIssue[]) {
    const signals = new Set((testCase.observed.signals ?? []).map(normalizeKey))
    for (const requiredSignal of testCase.expected.requiredSignals ?? []) {
        if (!signals.has(normalizeKey(requiredSignal))) {
            pushIssue(issues, 'error', 'MISSING_REQUIRED_SIGNAL', `Missing required signal "${requiredSignal}"`)
        }
    }
}

function validateFallback(testCase: AiEvalCase, issues: AiEvalIssue[]) {
    if (!testCase.expected.fallbackRequired) return

    if (testCase.observed.status !== 'failed') {
        pushIssue(issues, 'error', 'FALLBACK_STATUS_NOT_FAILED', 'Fallback case should have failed provider status')
    }
    if (!testCase.observed.fallbackAction) {
        pushIssue(issues, 'error', 'MISSING_FALLBACK_ACTION', 'Fallback case must include a learner-safe fallback action')
    }
}

function validateOutputSafety(testCase: AiEvalCase, issues: AiEvalIssue[]) {
    const excerpt = testCase.observed.outputExcerpt ?? ''
    if (excerpt.length > 512) {
        pushIssue(issues, 'warning', 'OUTPUT_EXCERPT_TOO_LONG', 'Eval output excerpt should stay concise and controlled')
    }

    for (const pattern of AI_EVAL_FORBIDDEN_OUTPUT_PATTERNS) {
        if (pattern.test(toAsciiLower(excerpt))) {
            pushIssue(issues, 'error', 'OFFICIAL_SCORE_OVERCLAIM', 'AI output appears to overclaim official exam scoring or guaranteed results')
            return
        }
    }
}

function validateBoundedCount(
    issues: AiEvalIssue[],
    label: string,
    value: number | null,
    bounds: { min?: number; max?: number },
) {
    if (bounds.min === undefined && bounds.max === undefined) return
    if (value === null) {
        pushIssue(issues, 'error', `MISSING_${label.toUpperCase()}_COUNT`, `Missing ${label} count`)
        return
    }
    if (bounds.min !== undefined && value < bounds.min) {
        pushIssue(issues, 'error', `${label.toUpperCase()}_COUNT_TOO_LOW`, `Expected ${label} count >= ${bounds.min}, got ${value}`)
    }
    if (bounds.max !== undefined && value > bounds.max) {
        pushIssue(issues, 'error', `${label.toUpperCase()}_COUNT_TOO_HIGH`, `Expected ${label} count <= ${bounds.max}, got ${value}`)
    }
}

function surfaceSummary(cases: AiEvalCaseResult[]) {
    return [...new Set(cases.map((item) => item.surface))]
        .sort()
        .map((surface) => {
            const scopedCases = cases.filter((item) => item.surface === surface)
            const passedCases = scopedCases.filter((item) => item.passed).length
            return {
                surface,
                totalCases: scopedCases.length,
                passedCases,
                failedCases: scopedCases.length - passedCases,
            }
        })
}

function pushIssue(issues: AiEvalIssue[], severity: AiEvalSeverity, code: string, message: string) {
    issues.push({ severity, code, message })
}

function nullableNumber(value: unknown) {
    return typeof value === 'number' && Number.isFinite(value) ? value : null
}

function isCefrLevel(value: string): value is CefrLevel {
    return CEFR_LEVELS.includes(value as CefrLevel)
}

function normalizeKey(value: unknown) {
    return typeof value === 'string' ? value.trim().toLowerCase() : ''
}

function toAsciiLower(value: string) {
    return value
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '')
        .toLowerCase()
}

function percent(numerator: number, denominator: number) {
    if (denominator <= 0) return 0
    return Math.round((numerator / denominator) * 10000) / 100
}

function average(values: number[]) {
    if (values.length === 0) return null
    return Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 100) / 100
}

function median(values: number[]) {
    if (values.length === 0) return null
    const sorted = [...values].sort((a, b) => a - b)
    const middle = Math.floor(sorted.length / 2)

    if (sorted.length % 2 === 1) {
        return sorted[middle]!
    }

    return Math.round(((sorted[middle - 1]! + sorted[middle]!) / 2) * 100) / 100
}

function roundToFourDecimals(value: number) {
    return Math.round(value * 10000) / 10000
}

function isNumber(value: number | null): value is number {
    return typeof value === 'number'
}
