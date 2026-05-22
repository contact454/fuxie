import { describe, expect, it } from 'vitest'
import {
    ACADEMIC_REVIEW_DIMENSIONS,
    buildAiEvalAcademicReviewPack,
} from './eval-academic-review-pack.js'
import {
    buildAiEvalAcademicSignoffTemplate,
    type AiEvalAcademicSignoffRecord,
} from './eval-academic-signoff.js'
import {
    buildAiEvalFixtureExpansionPlan,
    renderAiEvalFixtureExpansionPlanMarkdown,
} from './eval-fixture-expansion.js'
import type { AiEvalFixture } from './eval-harness.js'

describe('AI eval fixture expansion plan', () => {
    it('builds proposal-only fixture backlog from academic follow-up actions', () => {
        const fixtureData = fixture()
        const pack = buildAiEvalAcademicReviewPack(fixtureData, { generatedAt: new Date('2026-05-13T10:00:00.000Z') })
        const signoff = signoffWithFollowUp(pack)
        const plan = buildAiEvalFixtureExpansionPlan(fixtureData, pack, signoff, {
            generatedAt: new Date('2026-05-13T12:00:00.000Z'),
            requireFinal: true,
        })

        expect(plan).toMatchObject({
            schemaVersion: 'ai-eval-fixture-expansion-v1',
            generatedAt: '2026-05-13T12:00:00.000Z',
            suiteVersion: 'ai-eval-harness-v1',
            rules: {
                runtimeEffect: 'none',
                fixtureEffect: 'proposal_only',
                academicOwner: 'Head of German Pedagogy / Academic Lead',
                implementationOwner: 'AI / LLM Engineer',
            },
            summary: {
                sourceCases: 2,
                followUpActions: 1,
                proposals: 1,
                blocked: false,
            },
        })
        expect(plan.proposals[0]).toMatchObject({
            id: 'FX-AI-A1-WRITE-001-FOLLOWUP-01',
            sourceCaseId: 'AI-A1-WRITE-001',
            sourceDecision: 'changes_requested',
            level: 'A1',
            surface: 'writing',
            dimensionFocus: ['CEFR fit', 'Retry usefulness'],
            recommendation: 'update_existing_case',
            candidateCaseId: 'AI-A1-WRITE-001-FOLLOWUP-01',
            fixtureChange: {
                effect: 'proposal_only',
                expectedSignalsToConsider: ['word_order_retry', 'vietnamese_support'],
                expectedCriteriaToConsider: ['Inhalt', 'Korrektheit'],
            },
        })
    })

    it('blocks expansion when final signoff is invalid', () => {
        const fixtureData = fixture()
        const pack = buildAiEvalAcademicReviewPack(fixtureData)
        const signoff = buildAiEvalAcademicSignoffTemplate(pack)
        const plan = buildAiEvalFixtureExpansionPlan(fixtureData, pack, signoff, { requireFinal: true })

        expect(plan.summary.blocked).toBe(true)
        expect(plan.summary.proposals).toBe(0)
        expect(plan.blockers.map((blocker) => blocker.code)).toEqual(expect.arrayContaining([
            'MISSING_REVIEWER_NAME',
            'MISSING_REVIEWED_AT',
            'PENDING_CASE_DECISION',
        ]))
    })

    it('renders markdown with rules, proposals, and prompt backlog handoff', () => {
        const fixtureData = fixture()
        const pack = buildAiEvalAcademicReviewPack(fixtureData)
        const signoff = signoffWithFollowUp(pack)
        const plan = buildAiEvalFixtureExpansionPlan(fixtureData, pack, signoff, { requireFinal: true })
        const markdown = renderAiEvalFixtureExpansionPlanMarkdown(plan)

        expect(markdown).toContain('# AI Eval Fixture Expansion Proposal')
        expect(markdown).toContain('Runtime effect: none')
        expect(markdown).toContain('This report does not mutate `baseline.json`')
        expect(markdown).toContain('AI-A1-WRITE-001-FOLLOWUP-01')
        expect(markdown).toContain('Lower A1 correction density')
    })
})

function signoffWithFollowUp(pack: ReturnType<typeof buildAiEvalAcademicReviewPack>): AiEvalAcademicSignoffRecord {
    const record = buildAiEvalAcademicSignoffTemplate(pack, {
        generatedAt: new Date('2026-05-13T11:00:00.000Z'),
        reviewerName: 'Academic Lead',
    })
    record.reviewedAt = '2026-05-13T11:30:00.000Z'
    record.overallDecision = 'changes_requested'
    record.cases = record.cases.map((testCase) => ({
        ...testCase,
        decision: testCase.id === 'AI-A1-WRITE-001' ? 'changes_requested' : 'approved',
        dimensionDecisions: Object.fromEntries(
            ACADEMIC_REVIEW_DIMENSIONS.map((dimension) => [
                dimension,
                testCase.id === 'AI-A1-WRITE-001' && (dimension === 'CEFR fit' || dimension === 'Retry usefulness')
                    ? 'changes_requested'
                    : 'approved',
            ]),
        ) as AiEvalAcademicSignoffRecord['cases'][number]['dimensionDecisions'],
        reviewerNotes: 'Controlled academic review note',
        followUpActions: testCase.id === 'AI-A1-WRITE-001'
            ? ['Lower A1 correction density and add a one-sentence retry plan']
            : [],
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
