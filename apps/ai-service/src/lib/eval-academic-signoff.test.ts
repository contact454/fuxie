import { describe, expect, it } from 'vitest'
import {
    ACADEMIC_REVIEW_DIMENSIONS,
    buildAiEvalAcademicReviewPack,
} from './eval-academic-review-pack.js'
import {
    buildAiEvalAcademicSignoffTemplate,
    renderAiEvalAcademicSignoffMarkdown,
    validateAiEvalAcademicSignoff,
    type AiEvalAcademicSignoffRecord,
} from './eval-academic-signoff.js'
import type { AiEvalFixture } from './eval-harness.js'

describe('AI eval academic signoff', () => {
    it('builds a pending template from the academic review pack with explicit owner rules', () => {
        const pack = buildAiEvalAcademicReviewPack(fixture(), { generatedAt: new Date('2026-05-13T10:00:00.000Z') })
        const record = buildAiEvalAcademicSignoffTemplate(pack, { generatedAt: new Date('2026-05-13T11:00:00.000Z') })
        const validation = validateAiEvalAcademicSignoff(record, pack)

        expect(record).toMatchObject({
            schemaVersion: 'ai-eval-academic-signoff-v1',
            suiteVersion: 'ai-eval-harness-v1',
            reviewPackGeneratedAt: '2026-05-13T10:00:00.000Z',
            generatedAt: '2026-05-13T11:00:00.000Z',
            reviewedAt: null,
            reviewer: {
                name: 'pending',
                role: 'Head of German Pedagogy / Academic Lead',
            },
            overallDecision: 'pending',
            rules: {
                owner: 'Head of German Pedagogy / Academic Lead',
                runtimeEffect: 'none',
            },
        })
        expect(record.cases).toHaveLength(2)
        expect(validation.valid).toBe(true)
        expect(validation.summary).toMatchObject({
            totalCases: 2,
            pendingCases: 2,
            derivedOverallDecision: 'pending',
        })
    })

    it('validates final approved signoff only when every dimension is approved', () => {
        const pack = buildAiEvalAcademicReviewPack(fixture())
        const record = approvedRecord(pack)
        const validation = validateAiEvalAcademicSignoff(record, pack, { requireFinal: true })

        expect(validation.valid).toBe(true)
        expect(validation.summary).toMatchObject({
            approvedCases: 2,
            changesRequestedCases: 0,
            rejectedCases: 0,
            pendingCases: 0,
            derivedOverallDecision: 'approved',
        })
    })

    it('requires follow-up actions for changes requested and derives the overall decision', () => {
        const pack = buildAiEvalAcademicReviewPack(fixture())
        const record = approvedRecord(pack)
        record.overallDecision = 'changes_requested'
        record.cases[1]!.decision = 'changes_requested'
        record.cases[1]!.dimensionDecisions['Retry usefulness'] = 'changes_requested'

        const validation = validateAiEvalAcademicSignoff(record, pack, { requireFinal: true })

        expect(validation.valid).toBe(false)
        expect(validation.summary.derivedOverallDecision).toBe('changes_requested')
        expect(validation.issues.map((issue) => issue.code)).toContain('MISSING_FOLLOW_UP_ACTION')

        record.cases[1]!.followUpActions = ['Revise retry prompt so A2 learner gets one concrete repeat action']
        const fixed = validateAiEvalAcademicSignoff(record, pack, { requireFinal: true })
        expect(fixed.valid).toBe(true)
    })

    it('rejects unsafe raw-data markers in signoff notes', () => {
        const pack = buildAiEvalAcademicReviewPack(fixture())
        const record = approvedRecord(pack)
        record.cases[0]!.reviewerNotes = 'See raw submission from learner'

        const validation = validateAiEvalAcademicSignoff(record, pack, { requireFinal: true })

        expect(validation.valid).toBe(false)
        expect(validation.issues.map((issue) => issue.code)).toContain('PRIVACY_UNSAFE_SIGNOFF_TEXT')
    })

    it('renders role rules and prompt backlog handoff without changing runtime behavior', () => {
        const pack = buildAiEvalAcademicReviewPack(fixture())
        const record = approvedRecord(pack)
        record.overallDecision = 'changes_requested'
        record.cases[0]!.decision = 'changes_requested'
        record.cases[0]!.dimensionDecisions['CEFR fit'] = 'changes_requested'
        record.cases[0]!.followUpActions = ['Lower A1 correction density in the writing prompt']
        const validation = validateAiEvalAcademicSignoff(record, pack, { requireFinal: true })
        const markdown = renderAiEvalAcademicSignoffMarkdown(record, validation)

        expect(markdown).toContain('# AI Eval Academic Signoff')
        expect(markdown).toContain('German Academic Lead owns approve, changes-requested, or reject decisions')
        expect(markdown).toContain('Runtime effect: none')
        expect(markdown).toContain('AI-A1-WRITE-001: Lower A1 correction density in the writing prompt')
    })
})

function approvedRecord(pack: ReturnType<typeof buildAiEvalAcademicReviewPack>): AiEvalAcademicSignoffRecord {
    const record = buildAiEvalAcademicSignoffTemplate(pack, {
        generatedAt: new Date('2026-05-13T11:00:00.000Z'),
        reviewerName: 'Academic Lead',
    })
    record.reviewedAt = '2026-05-13T12:00:00.000Z'
    record.overallDecision = 'approved'
    record.cases = record.cases.map((testCase) => ({
        ...testCase,
        decision: 'approved',
        dimensionDecisions: Object.fromEntries(
            ACADEMIC_REVIEW_DIMENSIONS.map((dimension) => [dimension, 'approved']),
        ) as AiEvalAcademicSignoffRecord['cases'][number]['dimensionDecisions'],
        reviewerNotes: 'Approved from controlled eval excerpt',
    }))
    return record
}

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
        ],
    }
}
