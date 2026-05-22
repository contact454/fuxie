import { describe, expect, it } from 'vitest'
import { evaluateAiEvalCase, runAiEvalSuite, type AiEvalFixture } from './eval-harness.js'

describe('AI eval harness', () => {
    it('passes calibrated writing and speaking cases with safe bounded evidence', () => {
        const suite = runAiEvalSuite({
            suiteVersion: 'test-v1',
            cases: [
                {
                    id: 'AI-A1-WRITE-001',
                    surface: 'writing',
                    level: 'A1',
                    description: 'A1 writing correction stays bounded and rubric-aligned.',
                    expected: {
                        expectedStatus: 'generated',
                        minScorePercent: 35,
                        maxScorePercent: 75,
                        allowedEstimatedLevels: ['A1', 'A2'],
                        requiredCriteria: ['Inhalt', 'Korrektheit'],
                        minCorrectionCount: 1,
                        maxCorrectionCount: 3,
                        requiredSignals: ['word_order_retry'],
                    },
                    observed: {
                        status: 'generated',
                        scorePercent: 58,
                        estimatedLevel: 'A1',
                        criteria: [
                            { id: 'Inhalt', name: 'Inhalt', score: 3, maxScore: 5 },
                            { id: 'Korrektheit', name: 'Korrektheit', score: 2, maxScore: 5 },
                        ],
                        correctionCount: 2,
                        signals: ['word_order_retry'],
                        latencyMs: 1200,
                        estimatedCostUsd: 0.0021,
                    },
                },
                {
                    id: 'AI-A2-SPEAK-001',
                    surface: 'speaking',
                    level: 'A2',
                    description: 'A2 speaking feedback has a score and a small number of issues.',
                    expected: {
                        expectedStatus: 'generated',
                        minScorePercent: 50,
                        maxScorePercent: 90,
                        minIssueCount: 1,
                        maxIssueCount: 3,
                        requiredSignals: ['retry_prompt'],
                    },
                    observed: {
                        status: 'generated',
                        scorePercent: 72,
                        issueCount: 2,
                        signals: ['retry_prompt'],
                        latencyMs: 1600,
                        estimatedCostUsd: 0.003,
                    },
                },
            ],
        })

        expect(suite.summary).toMatchObject({
            totalCases: 2,
            passedCases: 2,
            failedCases: 0,
            passRate: 100,
            averageScorePercent: 65,
            medianLatencyMs: 1400,
            totalEstimatedCostUsd: 0.0051,
        })
        expect(suite.cases.every((testCase) => testCase.passed)).toBe(true)
    })

    it('fails cases with score drift, missing rubric criteria, and exam overclaims', () => {
        const result = evaluateAiEvalCase({
            id: 'AI-B1-GRADE-001',
            surface: 'writing',
            level: 'B1',
            description: 'B1 grading should avoid official exam score claims.',
            expected: {
                expectedStatus: 'generated',
                minScorePercent: 45,
                maxScorePercent: 80,
                estimatedLevel: 'B1',
                requiredCriteria: ['Inhalt', 'Korrektheit', 'Kohaerenz'],
            },
            observed: {
                status: 'generated',
                scorePercent: 91,
                estimatedLevel: 'B2',
                criteria: [
                    { id: 'Inhalt', score: 5, maxScore: 5 },
                    { id: 'Korrektheit', score: 5, maxScore: 5 },
                ],
                outputExcerpt: 'This is an official Goethe score and you will pass Goethe.',
            },
        })

        expect(result.passed).toBe(false)
        expect(result.issues.map((issue) => issue.code)).toEqual(expect.arrayContaining([
            'SCORE_TOO_HIGH',
            'ESTIMATED_LEVEL_MISMATCH',
            'MISSING_RUBRIC_CRITERION',
            'OFFICIAL_SCORE_OVERCLAIM',
        ]))
    })

    it('requires learner-safe fallback action for provider failure cases', () => {
        const result = evaluateAiEvalCase({
            id: 'AI-FALLBACK-001',
            surface: 'fallback',
            level: 'A1',
            description: 'Provider timeout should offer non-AI study continuation.',
            expected: {
                expectedStatus: 'failed',
                fallbackRequired: true,
                requiredSignals: ['non_ai_next_action'],
            },
            observed: {
                status: 'failed',
                providerStatus: 'timeout',
                fallbackAction: '/vocabulary',
                signals: ['non_ai_next_action'],
            },
        })

        expect(result.passed).toBe(true)
    })

    it('reports missing fallback action as release-blocking', () => {
        const result = evaluateAiEvalCase({
            id: 'AI-FALLBACK-002',
            surface: 'fallback',
            level: 'A2',
            description: 'Rate limit without fallback should fail.',
            expected: {
                expectedStatus: 'failed',
                fallbackRequired: true,
            },
            observed: {
                status: 'failed',
                providerStatus: 'rate_limited',
            },
        })

        expect(result.passed).toBe(false)
        expect(result.issues.map((issue) => issue.code)).toContain('MISSING_FALLBACK_ACTION')
    })

    it('keeps empty suites deterministic for CI', () => {
        const result = runAiEvalSuite({ suiteVersion: 'empty', cases: [] } satisfies AiEvalFixture)

        expect(result.summary).toMatchObject({
            totalCases: 0,
            passedCases: 0,
            failedCases: 0,
            passRate: 0,
            averageScorePercent: null,
            medianLatencyMs: null,
            totalEstimatedCostUsd: null,
        })
    })
})
