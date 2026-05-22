import { describe, expect, it } from 'vitest'
import {
    buildAiEvalAcademicReviewPack,
    renderAiEvalAcademicReviewPackMarkdown,
} from './eval-academic-review-pack.js'
import type { AiEvalArtifactReadout } from './eval-artifact-readout.js'
import type { AiEvalFixture } from './eval-harness.js'

describe('AI eval academic review pack', () => {
    it('groups eval cases by CEFR level and surface with academic signoff pending', () => {
        const pack = buildAiEvalAcademicReviewPack(fixture(), {
            artifactReadout: readout(),
            generatedAt: new Date('2026-05-13T10:00:00.000Z'),
        })

        expect(pack).toMatchObject({
            suiteVersion: 'ai-eval-harness-v1',
            generatedAt: '2026-05-13T10:00:00.000Z',
            signoffStatus: 'pending_academic_review',
            automatedEvidence: {
                offlinePassRate: 100,
                offlinePassedCases: 5,
                offlineTotalCases: 5,
                latestProviderRunStatus: 'completed',
                providerCasePassRate: 80,
            },
        })
        expect(pack.groups.map((group) => `${group.level}:${group.surface}`)).toEqual([
            'A1:fallback',
            'A1:writing',
            'A2:speaking',
            'B1:writing',
            'B2:writing',
        ])
    })

    it('includes the required academic checklist dimensions for every case', () => {
        const pack = buildAiEvalAcademicReviewPack(fixture())
        const reviewCase = pack.groups.flatMap((group) => group.cases).find((item) => item.id === 'AI-A1-WRITE-001')

        expect(pack.signoffDimensions).toEqual([
            'CEFR fit',
            'German correctness',
            'Vietnamese learner usefulness',
            'Exam-claim caution',
            'Retry usefulness',
            'Safety/privacy',
        ])
        expect(reviewCase?.academicChecklist).toMatchObject({
            'CEFR fit': 'pending',
            'German correctness': 'pending',
            'Vietnamese learner usefulness': 'pending',
            'Exam-claim caution': 'pending',
            'Retry usefulness': 'pending',
            'Safety/privacy': 'pending',
        })
    })

    it('renders controlled excerpts without provider prompts or raw output', () => {
        const markdown = renderAiEvalAcademicReviewPackMarkdown(buildAiEvalAcademicReviewPack(fixture()))

        expect(markdown).toContain('# AI Eval Academic Review Pack')
        expect(markdown).toContain('CI pass is automated evidence only')
        expect(markdown).toContain('Ubungshinweis: Stelle die Zeitangabe nach dem Verb')
        expect(markdown).toContain('German Academic Lead: pending')
        expect(markdown).not.toContain('raw provider text')
        expect(markdown).not.toContain('You are evaluating a synthetic Fuxie AI writing feedback output')
    })
})

function fixture(): AiEvalFixture {
    return {
        suiteVersion: 'ai-eval-harness-v1',
        cases: [
            {
                id: 'AI-A1-WRITE-001',
                surface: 'writing',
                level: 'A1',
                description: 'A1 writing feedback prioritizes word order.',
                expected: {
                    expectedStatus: 'generated',
                    minScorePercent: 35,
                    maxScorePercent: 75,
                    allowedEstimatedLevels: ['A1', 'A2'],
                    requiredCriteria: ['Inhalt', 'Korrektheit'],
                    minCorrectionCount: 1,
                    maxCorrectionCount: 3,
                    requiredSignals: ['word_order_retry', 'vietnamese_support'],
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
                    signals: ['word_order_retry', 'vietnamese_support'],
                    outputExcerpt: 'Ubungshinweis: Stelle die Zeitangabe nach dem Verb.',
                },
                providerPrompt: {
                    model: 'gemini-3.1-flash-lite-preview',
                    promptVersion: 'ai-eval-writing-a1-v1',
                    responseContract: 'ai_eval_observed_output_v1',
                    prompt: 'You are evaluating a synthetic Fuxie AI writing feedback output. raw provider text',
                },
            },
            {
                id: 'AI-A2-SPEAK-001',
                surface: 'speaking',
                level: 'A2',
                description: 'A2 speaking support gives a retry prompt.',
                expected: {
                    expectedStatus: 'generated',
                    minScorePercent: 50,
                    maxScorePercent: 90,
                    minIssueCount: 1,
                    maxIssueCount: 3,
                    requiredSignals: ['retry_prompt', 'confidence_building'],
                },
                observed: {
                    status: 'generated',
                    scorePercent: 72,
                    issueCount: 2,
                    signals: ['retry_prompt', 'confidence_building'],
                    outputExcerpt: 'Gut gemacht. Wiederhole den Satz langsamer.',
                },
            },
            {
                id: 'AI-B1-GRADE-001',
                surface: 'writing',
                level: 'B1',
                description: 'B1 practice grading avoids official pass/fail claims.',
                expected: {
                    expectedStatus: 'generated',
                    minScorePercent: 45,
                    maxScorePercent: 80,
                    allowedEstimatedLevels: ['A2', 'B1'],
                    requiredCriteria: ['Inhalt', 'Korrektheit', 'Kohaerenz'],
                    minCorrectionCount: 1,
                    maxCorrectionCount: 4,
                    requiredSignals: ['practice_score_only', 'register_feedback'],
                },
                observed: {
                    status: 'generated',
                    scorePercent: 68,
                    estimatedLevel: 'B1',
                    criteria: [
                        { id: 'Inhalt', name: 'Inhalt', score: 4, maxScore: 5 },
                        { id: 'Korrektheit', name: 'Korrektheit', score: 3, maxScore: 5 },
                        { id: 'Kohaerenz', name: 'Kohaerenz & Kohaesion', score: 3, maxScore: 5 },
                    ],
                    correctionCount: 3,
                    signals: ['practice_score_only', 'register_feedback'],
                    outputExcerpt: 'Das ist eine Ubungsbewertung, keine offizielle Prufungsbewertung.',
                },
            },
            {
                id: 'AI-B2-WRITE-001',
                surface: 'writing',
                level: 'B2',
                description: 'B2 opinion essay feedback prioritizes argument structure.',
                expected: {
                    expectedStatus: 'generated',
                    minScorePercent: 45,
                    maxScorePercent: 85,
                    allowedEstimatedLevels: ['B1', 'B2'],
                    requiredCriteria: ['Inhalt', 'Korrektheit', 'Kohaerenz'],
                    minCorrectionCount: 1,
                    maxCorrectionCount: 5,
                    requiredSignals: ['argument_structure', 'retry_plan'],
                },
                observed: {
                    status: 'generated',
                    scorePercent: 74,
                    estimatedLevel: 'B2',
                    criteria: [
                        { id: 'Inhalt', name: 'Inhalt', score: 4, maxScore: 5 },
                        { id: 'Korrektheit', name: 'Korrektheit', score: 3, maxScore: 5 },
                        { id: 'Kohaerenz', name: 'Kohaerenz & Kohaesion', score: 4, maxScore: 5 },
                    ],
                    correctionCount: 4,
                    signals: ['argument_structure', 'retry_plan'],
                    outputExcerpt: 'Starte mit These, Grund und Beispiel.',
                },
            },
            {
                id: 'AI-FALLBACK-001',
                surface: 'fallback',
                level: 'A1',
                description: 'Provider timeout gives a retryable AI error.',
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
            },
        ],
    }
}

function readout(): AiEvalArtifactReadout {
    return {
        generatedAt: '2026-05-13T10:00:00.000Z',
        counts: {
            totalRuns: 1,
            completedRuns: 1,
            blockedRuns: 0,
            providerCasesRequested: 5,
            completedCases: 5,
            passedCases: 4,
            failedCases: 1,
        },
        rates: {
            completedRunRate: 100,
            casePassRate: 80,
        },
        latestRun: {
            runAt: '2026-05-13T09:00:00.000Z',
            status: 'completed',
            suiteVersion: 'ai-eval-harness-v1:provider',
        },
        quality: {
            medianLatencyMs: 1200,
            totalEstimatedCostUsd: 0.01,
        },
        blockers: [],
        splits: {
            runsByStatus: [{ key: 'completed', runs: 1 }],
            casesByModel: [{ key: 'gemini-3.1-flash-lite-preview', cases: 5 }],
            casesByPromptVersion: [{ key: 'ai-eval-writing-a1-v1', cases: 1 }],
        },
    }
}
