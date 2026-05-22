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
    buildAiEvalControlledFixturePatch,
    renderAiEvalControlledFixturePatchMarkdown,
} from './eval-controlled-fixture-patch.js'
import { buildAiEvalFixtureExpansionPlan } from './eval-fixture-expansion.js'
import { runAiEvalSuite, type AiEvalFixture } from './eval-harness.js'

describe('AI eval controlled fixture patch', () => {
    it('previews a controlled follow-up candidate without mutating the source fixture', () => {
        const fixtureData = fixture()
        const plan = expansionPlan(fixtureData)
        const patch = buildAiEvalControlledFixturePatch(fixtureData, plan, {
            generatedAt: new Date('2026-05-13T13:00:00.000Z'),
            mode: 'preview',
        })

        expect(patch).toMatchObject({
            schemaVersion: 'ai-eval-controlled-fixture-patch-v1',
            generatedAt: '2026-05-13T13:00:00.000Z',
            mode: 'preview',
            rules: {
                baselineMutation: 'disabled_in_preview',
                runtimeEffect: 'none',
            },
            summary: {
                sourceCases: 2,
                proposalCount: 1,
                candidateCases: 1,
                blocked: false,
                changed: true,
            },
        })
        expect(fixtureData.cases).toHaveLength(2)
        expect(patch.fixture.cases).toHaveLength(3)
        expect(patch.fixture.cases.at(-1)).toMatchObject({
            id: 'AI-A1-WRITE-001-FOLLOWUP-01',
            level: 'A1',
            surface: 'writing',
            expected: {
                requiredCriteria: ['Inhalt', 'Korrektheit'],
                requiredSignals: ['word_order_retry', 'vietnamese_support'],
            },
        })
        expect(runAiEvalSuite(patch.fixture).summary.failedCases).toBe(0)
    })

    it('blocks duplicate candidate ids and manual-review proposals', () => {
        const fixtureData = fixture()
        const plan = expansionPlan(fixtureData)
        fixtureData.cases.push({
            ...fixtureData.cases[0]!,
            id: 'AI-A1-WRITE-001-FOLLOWUP-01',
        })
        plan.proposals[0]!.recommendation = 'manual_review'

        const patch = buildAiEvalControlledFixturePatch(fixtureData, plan)

        expect(patch.summary.blocked).toBe(true)
        expect(patch.summary.changed).toBe(false)
        expect(patch.blockers.map((blocker) => blocker.code)).toEqual(expect.arrayContaining([
            'DUPLICATE_CANDIDATE_CASE',
            'MANUAL_REVIEW_REQUIRED',
        ]))
    })

    it('renders a privacy-safe markdown preview without provider prompt text', () => {
        const fixtureData = fixture()
        const patch = buildAiEvalControlledFixturePatch(fixtureData, expansionPlan(fixtureData))
        const markdown = renderAiEvalControlledFixturePatchMarkdown(patch)

        expect(markdown).toContain('# AI Eval Controlled Fixture Patch')
        expect(markdown).toContain('Preview mode never writes `baseline.json`')
        expect(markdown).toContain('AI-A1-WRITE-001-FOLLOWUP-01')
        expect(markdown).toContain('Lower A1 correction density')
        expect(markdown).not.toContain('You are evaluating a synthetic Fuxie')
    })
})

function expansionPlan(fixtureData: AiEvalFixture) {
    const pack = buildAiEvalAcademicReviewPack(fixtureData, {
        generatedAt: new Date('2026-05-13T10:00:00.000Z'),
    })
    return buildAiEvalFixtureExpansionPlan(fixtureData, pack, signoffWithFollowUp(pack), {
        generatedAt: new Date('2026-05-13T12:00:00.000Z'),
        requireFinal: true,
    })
}

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
                providerPrompt: {
                    model: 'gemini-3.1-flash-lite-preview',
                    promptVersion: 'ai-eval-writing-a1-v1',
                    responseContract: 'ai_eval_observed_output_v1',
                    prompt: 'You are evaluating a synthetic Fuxie AI writing feedback output.',
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
