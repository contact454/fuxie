export type AiEvalArtifactStatus = 'completed' | 'blocked_missing_provider_key' | 'blocked_no_provider_cases' | 'unknown'

export interface AiEvalArtifact {
    runAt?: string
    status?: string
    suiteVersion?: string
    providerCases?: number
    requiredEnv?: string
    summary?: {
        totalCases?: number
        passedCases?: number
        failedCases?: number
        passRate?: number
        medianLatencyMs?: number | null
        totalEstimatedCostUsd?: number | null
    }
    cases?: Array<{
        id?: string
        surface?: string
        level?: string
        passed?: boolean
        metrics?: {
            latencyMs?: number | null
            estimatedCostUsd?: number | null
        }
        provider?: {
            model?: string
            promptVersion?: string
            latencyMs?: number
        } | null
        promptVersion?: string
    }>
    artifactPath?: string
}

type NormalizedAiEvalArtifact = Omit<AiEvalArtifact, 'status'> & { status: AiEvalArtifactStatus }

export interface AiEvalArtifactReadout {
    generatedAt: string
    counts: {
        totalRuns: number
        completedRuns: number
        blockedRuns: number
        providerCasesRequested: number
        completedCases: number
        passedCases: number
        failedCases: number
    }
    rates: {
        completedRunRate: number
        casePassRate: number
    }
    latestRun: {
        runAt: string | null
        status: AiEvalArtifactStatus
        suiteVersion: string | null
    }
    quality: {
        medianLatencyMs: number | null
        totalEstimatedCostUsd: number | null
    }
    blockers: Array<{
        status: AiEvalArtifactStatus
        runs: number
        requiredEnv: string | null
    }>
    splits: {
        runsByStatus: Array<{ key: AiEvalArtifactStatus; runs: number }>
        casesByModel: Array<{ key: string; cases: number }>
        casesByPromptVersion: Array<{ key: string; cases: number }>
    }
}

export function buildAiEvalArtifactReadout(
    artifacts: AiEvalArtifact[],
    generatedAt = new Date(),
): AiEvalArtifactReadout {
    const normalized = artifacts.map(normalizeArtifact)
    const completed = normalized.filter((artifact) => artifact.status === 'completed')
    const blocked = normalized.filter((artifact) => artifact.status !== 'completed')
    const latest = [...normalized].sort(compareRunAtDesc)[0] ?? null
    const completedCases = sum(completed.map((artifact) => numberValue(artifact.summary?.totalCases)))
    const passedCases = sum(completed.map((artifact) => numberValue(artifact.summary?.passedCases)))
    const failedCases = sum(completed.map((artifact) => numberValue(artifact.summary?.failedCases)))
    const latencyValues = completed.flatMap(latenciesFromArtifact)
    const costValues = completed.map((artifact) => numberValue(artifact.summary?.totalEstimatedCostUsd)).filter(isNumber)

    return {
        generatedAt: generatedAt.toISOString(),
        counts: {
            totalRuns: normalized.length,
            completedRuns: completed.length,
            blockedRuns: blocked.length,
            providerCasesRequested: sum(normalized.map((artifact) => numberValue(artifact.providerCases))),
            completedCases,
            passedCases,
            failedCases,
        },
        rates: {
            completedRunRate: percent(completed.length, normalized.length),
            casePassRate: percent(passedCases, completedCases),
        },
        latestRun: {
            runAt: latest?.runAt ?? null,
            status: latest?.status ?? 'unknown',
            suiteVersion: latest?.suiteVersion ?? null,
        },
        quality: {
            medianLatencyMs: median(latencyValues),
            totalEstimatedCostUsd: costValues.length > 0
                ? roundToFourDecimals(sum(costValues))
                : null,
        },
        blockers: blockerSummary(blocked),
        splits: {
            runsByStatus: runsByStatus(normalized),
            casesByModel: caseProviderSplit(completed, 'model'),
            casesByPromptVersion: caseProviderSplit(completed, 'promptVersion'),
        },
    }
}

export function renderAiEvalArtifactReadoutMarkdown(readout: AiEvalArtifactReadout) {
    const lines = [
        '# AI Eval Artifact Readout',
        '',
        `Generated at: ${readout.generatedAt}`,
        '',
        '## Summary',
        '',
        `- Runs: ${readout.counts.totalRuns}`,
        `- Completed runs: ${readout.counts.completedRuns}`,
        `- Blocked runs: ${readout.counts.blockedRuns}`,
        `- Completed run rate: ${readout.rates.completedRunRate}%`,
        `- Provider cases requested: ${readout.counts.providerCasesRequested}`,
        `- Case pass rate: ${readout.rates.casePassRate}% (${readout.counts.passedCases}/${readout.counts.completedCases})`,
        `- Median latency: ${formatNullable(readout.quality.medianLatencyMs)} ms`,
        `- Estimated cost: ${formatNullable(readout.quality.totalEstimatedCostUsd)} USD`,
        '',
        '## Latest Run',
        '',
        `- Run at: ${readout.latestRun.runAt ?? 'n/a'}`,
        `- Status: ${readout.latestRun.status}`,
        `- Suite: ${readout.latestRun.suiteVersion ?? 'n/a'}`,
        '',
        '## Blockers',
        '',
    ]

    if (readout.blockers.length === 0) {
        lines.push('- None')
    } else {
        for (const blocker of readout.blockers) {
            lines.push(`- ${blocker.status}: ${blocker.runs} run(s)${blocker.requiredEnv ? `, requires ${blocker.requiredEnv}` : ''}`)
        }
    }

    lines.push('', '## Splits', '', '### Runs By Status', '')
    for (const item of readout.splits.runsByStatus) {
        lines.push(`- ${item.key}: ${item.runs}`)
    }

    lines.push('', '### Cases By Model', '')
    if (readout.splits.casesByModel.length === 0) {
        lines.push('- n/a')
    } else {
        for (const item of readout.splits.casesByModel) {
            lines.push(`- ${item.key}: ${item.cases}`)
        }
    }

    lines.push('', '### Cases By Prompt Version', '')
    if (readout.splits.casesByPromptVersion.length === 0) {
        lines.push('- n/a')
    } else {
        for (const item of readout.splits.casesByPromptVersion) {
            lines.push(`- ${item.key}: ${item.cases}`)
        }
    }

    return `${lines.join('\n')}\n`
}

function normalizeArtifact(artifact: AiEvalArtifact): NormalizedAiEvalArtifact {
    return {
        ...artifact,
        status: normalizeStatus(artifact.status),
    }
}

function normalizeStatus(value: unknown): AiEvalArtifactStatus {
    if (value === 'completed' || value === 'blocked_missing_provider_key' || value === 'blocked_no_provider_cases') {
        return value
    }

    return 'unknown'
}

function compareRunAtDesc(a: AiEvalArtifact, b: AiEvalArtifact) {
    return timestamp(b.runAt) - timestamp(a.runAt)
}

function timestamp(value: unknown) {
    if (typeof value !== 'string') return 0
    const time = Date.parse(value)
    return Number.isFinite(time) ? time : 0
}

function blockerSummary(artifacts: NormalizedAiEvalArtifact[]) {
    const buckets = new Map<string, { status: AiEvalArtifactStatus; runs: number; requiredEnv: string | null }>()

    for (const artifact of artifacts) {
        const key = `${artifact.status}:${artifact.requiredEnv ?? ''}`
        const existing = buckets.get(key) ?? {
            status: artifact.status,
            runs: 0,
            requiredEnv: typeof artifact.requiredEnv === 'string' ? artifact.requiredEnv : null,
        }
        existing.runs += 1
        buckets.set(key, existing)
    }

    return [...buckets.values()].sort((a, b) => b.runs - a.runs || a.status.localeCompare(b.status))
}

function runsByStatus(artifacts: NormalizedAiEvalArtifact[]) {
    const buckets = new Map<AiEvalArtifactStatus, number>()
    for (const artifact of artifacts) {
        buckets.set(artifact.status, (buckets.get(artifact.status) ?? 0) + 1)
    }

    return [...buckets.entries()]
        .map(([key, runs]) => ({ key, runs }))
        .sort((a, b) => b.runs - a.runs || a.key.localeCompare(b.key))
}

function caseProviderSplit(
    artifacts: AiEvalArtifact[],
    key: 'model' | 'promptVersion',
) {
    const buckets = new Map<string, number>()

    for (const artifact of artifacts) {
        for (const testCase of artifact.cases ?? []) {
            const value = key === 'promptVersion'
                ? testCase.provider?.promptVersion ?? testCase.promptVersion
                : testCase.provider?.model
            const bucketKey = typeof value === 'string' && value.trim() ? value : 'unknown'
            buckets.set(bucketKey, (buckets.get(bucketKey) ?? 0) + 1)
        }
    }

    return [...buckets.entries()]
        .map(([splitKey, cases]) => ({ key: splitKey, cases }))
        .sort((a, b) => b.cases - a.cases || a.key.localeCompare(b.key))
}

function latenciesFromArtifact(artifact: AiEvalArtifact) {
    const caseLatencies = (artifact.cases ?? [])
        .map((testCase) => numberValue(testCase.provider?.latencyMs) ?? numberValue(testCase.metrics?.latencyMs))
        .filter(isNumber)

    if (caseLatencies.length > 0) return caseLatencies

    const summaryLatency = numberValue(artifact.summary?.medianLatencyMs)
    return summaryLatency === null ? [] : [summaryLatency]
}

function sum(values: Array<number | null>): number {
    return values.reduce<number>((total, value) => total + (value ?? 0), 0)
}

function numberValue(value: unknown) {
    return typeof value === 'number' && Number.isFinite(value) ? value : null
}

function isNumber(value: number | null): value is number {
    return typeof value === 'number'
}

function percent(numerator: number, denominator: number) {
    if (denominator <= 0) return 0
    return Math.round((numerator / denominator) * 10000) / 100
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

function formatNullable(value: number | null) {
    return value === null ? 'n/a' : String(value)
}
