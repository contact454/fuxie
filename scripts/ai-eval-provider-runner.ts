import 'dotenv/config'
import fs from 'node:fs'
import path from 'node:path'
import { getGeminiApiKeys } from '@fuxie/shared/env'
import { getModel } from '../apps/ai-service/src/lib/gemini.js'
import { parseGeminiJson } from '../apps/ai-service/src/lib/parse-json.ts'
import {
    runAiEvalSuite,
    type AiEvalCase,
    type AiEvalFixture,
    type AiEvalObservedOutput,
    type AiEvalSuiteResult,
} from '../apps/ai-service/src/lib/eval-harness.ts'

export interface ProviderEvalRunOptions {
    fixture: AiEvalFixture
    artifactDir: string
    now?: Date
    apiKey?: string
}

export interface ProviderEvalRunResult {
    status: 'completed' | 'blocked_missing_provider_key' | 'blocked_no_provider_cases'
    artifactPath: string
    providerCases: number
    suiteResult: AiEvalSuiteResult | null
}

export async function runProviderBackedAiEval(options: ProviderEvalRunOptions): Promise<ProviderEvalRunResult> {
    const providerCases = options.fixture.cases.filter((testCase) => testCase.providerPrompt)
    const runAt = options.now ?? new Date()

    if (providerCases.length === 0) {
        const artifactPath = writeArtifact(options.artifactDir, runAt, {
            status: 'blocked_no_provider_cases',
            suiteVersion: options.fixture.suiteVersion,
            providerCases: 0,
            cases: [],
        })
        return { status: 'blocked_no_provider_cases', artifactPath, providerCases: 0, suiteResult: null }
    }

    const apiKey = options.apiKey ?? getGeminiApiKeys(process.env)[0]
    if (!apiKey) {
        const artifactPath = writeArtifact(options.artifactDir, runAt, {
            status: 'blocked_missing_provider_key',
            suiteVersion: options.fixture.suiteVersion,
            providerCases: providerCases.length,
            requiredEnv: 'GEMINI_API_KEY or GOOGLE_AI_API_KEY',
            cases: providerCases.map((testCase) => ({
                id: testCase.id,
                surface: testCase.surface,
                level: testCase.level,
                promptVersion: testCase.providerPrompt?.promptVersion,
            })),
        })
        return { status: 'blocked_missing_provider_key', artifactPath, providerCases: providerCases.length, suiteResult: null }
    }

    const observedByCaseId = new Map<string, ProviderObservedCase>()

    for (const testCase of providerCases) {
        observedByCaseId.set(testCase.id, await runProviderCase(testCase))
    }

    const providerFixture: AiEvalFixture = {
        suiteVersion: `${options.fixture.suiteVersion}:provider`,
        cases: options.fixture.cases.map((testCase) => {
            const providerObserved = observedByCaseId.get(testCase.id)
            if (!providerObserved) return testCase

            return {
                ...testCase,
                observed: providerObserved.observed,
            }
        }),
    }
    const suiteResult = runAiEvalSuite(providerFixture)
    const artifactPath = writeArtifact(options.artifactDir, runAt, {
        status: 'completed',
        suiteVersion: providerFixture.suiteVersion,
        providerCases: providerCases.length,
        summary: suiteResult.summary,
        cases: suiteResult.cases.map((testCase) => {
            const providerObserved = observedByCaseId.get(testCase.id)
            return {
                ...testCase,
                provider: providerObserved?.provider ?? null,
            }
        }),
    })

    return {
        status: 'completed',
        artifactPath,
        providerCases: providerCases.length,
        suiteResult,
    }
}

interface ProviderObservedCase {
    observed: AiEvalObservedOutput
    provider: {
        model: string
        promptVersion: string
        latencyMs: number
        usage: Record<string, unknown> | null
        rawOutput: string
    }
}

async function runProviderCase(
    testCase: AiEvalCase,
): Promise<ProviderObservedCase> {
    const providerPrompt = testCase.providerPrompt
    if (!providerPrompt) {
        throw new Error(`Missing providerPrompt for ${testCase.id}`)
    }

    const modelName = providerPrompt.model ?? defaultModelForLevel(testCase.level)
    const model = getModel(modelName)
    const startedAt = Date.now()
    const result = await model.generateContent(providerPrompt.prompt)
    const latencyMs = Date.now() - startedAt
    const rawOutput = result.response.text()
    const parsed = parseGeminiJson(rawOutput) as Partial<AiEvalObservedOutput>

    return {
        observed: normalizeProviderObservedOutput(parsed, latencyMs),
        provider: {
            model: modelName,
            promptVersion: providerPrompt.promptVersion,
            latencyMs,
            usage: usageMetadata(result.response),
            rawOutput,
        },
    }
}

function normalizeProviderObservedOutput(
    value: Partial<AiEvalObservedOutput>,
    latencyMs: number,
): AiEvalObservedOutput {
    return {
        status: value.status === 'failed' ? 'failed' : 'generated',
        scorePercent: numberOrNull(value.scorePercent),
        estimatedLevel: typeof value.estimatedLevel === 'string' ? value.estimatedLevel : null,
        criteria: Array.isArray(value.criteria) ? value.criteria : [],
        correctionCount: numberOrNull(value.correctionCount),
        issueCount: numberOrNull(value.issueCount),
        signals: Array.isArray(value.signals) ? value.signals.filter((item): item is string => typeof item === 'string') : [],
        fallbackAction: typeof value.fallbackAction === 'string' ? value.fallbackAction : null,
        latencyMs,
        estimatedCostUsd: numberOrNull(value.estimatedCostUsd),
        outputExcerpt: typeof value.outputExcerpt === 'string' ? value.outputExcerpt.slice(0, 512) : null,
        providerStatus: typeof value.providerStatus === 'string' ? value.providerStatus : 'success',
    }
}

function usageMetadata(response: unknown): Record<string, unknown> | null {
    if (!response || typeof response !== 'object') return null
    const usage = (response as { usageMetadata?: unknown }).usageMetadata
    if (!usage || typeof usage !== 'object' || Array.isArray(usage)) return null
    return usage as Record<string, unknown>
}

function writeArtifact(artifactDir: string, runAt: Date, payload: Record<string, unknown>) {
    fs.mkdirSync(artifactDir, { recursive: true })
    const artifactPath = path.join(artifactDir, `ai-eval-provider-${timestampKey(runAt)}.json`)
    fs.writeFileSync(artifactPath, `${JSON.stringify({
        runAt: runAt.toISOString(),
        ...payload,
    }, null, 2)}\n`, 'utf8')
    return artifactPath
}

function timestampKey(date: Date) {
    return date.toISOString().replace(/[:.]/g, '-')
}

function defaultModelForLevel(level: string) {
    return ['A1', 'A2', 'B1'].includes(level)
        ? 'google/gemma-4-31b-it:free'
        : 'meta-llama/llama-3.3-70b-instruct:free'
}

function numberOrNull(value: unknown) {
    return typeof value === 'number' && Number.isFinite(value) ? value : null
}
