import { describe, expect, it } from 'vitest'
import {
    buildAiEvalArtifactReadout,
    renderAiEvalArtifactReadoutMarkdown,
    type AiEvalArtifact,
} from './eval-artifact-readout.js'

describe('AI eval artifact readout', () => {
    it('summarizes completed and blocked provider artifacts without exposing raw output', () => {
        const readout = buildAiEvalArtifactReadout([
            completedArtifact(),
            {
                runAt: '2026-05-13T09:00:00.000Z',
                status: 'blocked_missing_provider_key',
                suiteVersion: 'ai-eval-harness-v1',
                providerCases: 2,
                requiredEnv: 'GEMINI_API_KEY or GOOGLE_AI_API_KEY',
                cases: [
                    { id: 'AI-A1-WRITE-001', surface: 'writing', level: 'A1', promptVersion: 'ai-eval-writing-a1-v1' },
                    { id: 'AI-A2-SPEAK-001', surface: 'speaking', level: 'A2', promptVersion: 'ai-eval-speaking-a2-v1' },
                ],
            },
        ], new Date('2026-05-13T10:00:00.000Z'))

        expect(readout).toMatchObject({
            generatedAt: '2026-05-13T10:00:00.000Z',
            counts: {
                totalRuns: 2,
                completedRuns: 1,
                blockedRuns: 1,
                providerCasesRequested: 4,
                completedCases: 2,
                passedCases: 1,
                failedCases: 1,
            },
            rates: {
                completedRunRate: 50,
                casePassRate: 50,
            },
            latestRun: {
                runAt: '2026-05-13T09:00:00.000Z',
                status: 'blocked_missing_provider_key',
            },
            quality: {
                medianLatencyMs: 1300,
                totalEstimatedCostUsd: 0.0075,
            },
            blockers: [
                {
                    status: 'blocked_missing_provider_key',
                    runs: 1,
                    requiredEnv: 'GEMINI_API_KEY or GOOGLE_AI_API_KEY',
                },
            ],
            splits: {
                runsByStatus: [
                    { key: 'blocked_missing_provider_key', runs: 1 },
                    { key: 'completed', runs: 1 },
                ],
                casesByModel: [
                    { key: 'gemini-3-flash-preview', cases: 1 },
                    { key: 'gemini-3.1-flash-lite-preview', cases: 1 },
                ],
            },
        })
    })

    it('renders markdown QA evidence without provider raw output', () => {
        const readout = buildAiEvalArtifactReadout([completedArtifact()], new Date('2026-05-13T10:00:00.000Z'))
        const markdown = renderAiEvalArtifactReadoutMarkdown(readout)

        expect(markdown).toContain('# AI Eval Artifact Readout')
        expect(markdown).toContain('- Case pass rate: 50% (1/2)')
        expect(markdown).toContain('- gemini-3.1-flash-lite-preview: 1')
        expect(markdown).not.toContain('raw provider text')
    })

    it('keeps empty artifact directories deterministic', () => {
        const readout = buildAiEvalArtifactReadout([], new Date('2026-05-13T10:00:00.000Z'))

        expect(readout).toMatchObject({
            counts: {
                totalRuns: 0,
                completedRuns: 0,
                blockedRuns: 0,
                completedCases: 0,
                passedCases: 0,
                failedCases: 0,
            },
            rates: {
                completedRunRate: 0,
                casePassRate: 0,
            },
            latestRun: {
                runAt: null,
                status: 'unknown',
            },
            quality: {
                medianLatencyMs: null,
                totalEstimatedCostUsd: null,
            },
        })
    })
})

function completedArtifact(): AiEvalArtifact {
    return {
        runAt: '2026-05-13T08:00:00.000Z',
        status: 'completed',
        suiteVersion: 'ai-eval-harness-v1:provider',
        providerCases: 2,
        summary: {
            totalCases: 2,
            passedCases: 1,
            failedCases: 1,
            passRate: 50,
            medianLatencyMs: 1300,
            totalEstimatedCostUsd: 0.0075,
        },
        cases: [
            {
                id: 'AI-A1-WRITE-001',
                surface: 'writing',
                level: 'A1',
                passed: true,
                metrics: {
                    latencyMs: 1200,
                    estimatedCostUsd: 0.003,
                },
                provider: {
                    model: 'gemini-3.1-flash-lite-preview',
                    promptVersion: 'ai-eval-writing-a1-v1',
                    latencyMs: 1200,
                },
            },
            {
                id: 'AI-B2-WRITE-001',
                surface: 'writing',
                level: 'B2',
                passed: false,
                metrics: {
                    latencyMs: 1400,
                    estimatedCostUsd: 0.0045,
                },
                provider: {
                    model: 'gemini-3-flash-preview',
                    promptVersion: 'ai-eval-writing-b2-v1',
                    latencyMs: 1400,
                },
            },
        ],
    }
}
