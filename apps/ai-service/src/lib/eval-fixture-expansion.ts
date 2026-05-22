import {
    ACADEMIC_REVIEW_DIMENSIONS,
    type AcademicReviewDimension,
    type AiEvalAcademicReviewPack,
} from './eval-academic-review-pack.js'
import {
    validateAiEvalAcademicSignoff,
    type AcademicSignoffDecision,
    type AiEvalAcademicSignoffRecord,
} from './eval-academic-signoff.js'
import type { AiEvalCase, AiEvalFixture } from './eval-harness.js'

export const AI_EVAL_FIXTURE_EXPANSION_SCHEMA_VERSION = 'ai-eval-fixture-expansion-v1'

export type AiEvalFixtureExpansionRecommendation = 'update_existing_case' | 'add_regression_case' | 'manual_review'

export interface AiEvalFixtureExpansionPlan {
    schemaVersion: typeof AI_EVAL_FIXTURE_EXPANSION_SCHEMA_VERSION
    generatedAt: string
    suiteVersion: string
    objective: string
    rules: {
        runtimeEffect: 'none'
        fixtureEffect: 'proposal_only'
        academicOwner: 'Head of German Pedagogy / Academic Lead'
        implementationOwner: 'AI / LLM Engineer'
    }
    summary: {
        sourceCases: number
        followUpActions: number
        proposals: number
        blocked: boolean
    }
    blockers: Array<{
        code: string
        message: string
    }>
    proposals: AiEvalFixtureExpansionProposal[]
}

export interface AiEvalFixtureExpansionProposal {
    id: string
    sourceCaseId: string
    sourceDecision: AcademicSignoffDecision
    level: string
    surface: string
    dimensionFocus: AcademicReviewDimension[]
    followUpAction: string
    recommendation: AiEvalFixtureExpansionRecommendation
    candidateCaseId: string
    fixtureChange: {
        effect: 'proposal_only'
        expectedSignalsToConsider: string[]
        expectedCriteriaToConsider: string[]
        promptBacklogHint: string
    }
    owners: {
        academic: 'Head of German Pedagogy / Academic Lead'
        implementation: 'AI / LLM Engineer'
        qa: 'QA Automation Engineer'
    }
}

export function buildAiEvalFixtureExpansionPlan(
    fixture: AiEvalFixture,
    reviewPack: AiEvalAcademicReviewPack,
    signoff: AiEvalAcademicSignoffRecord,
    options: { generatedAt?: Date; requireFinal?: boolean } = {},
): AiEvalFixtureExpansionPlan {
    const validation = validateAiEvalAcademicSignoff(signoff, reviewPack, {
        requireFinal: options.requireFinal ?? true,
    })
    const fixtureCases = new Map(fixture.cases.map((testCase) => [testCase.id, testCase]))
    const reviewCases = new Map(
        reviewPack.groups.flatMap((group) => group.cases.map((testCase) => [testCase.id, testCase])),
    )
    const blockers = validation.issues
        .filter((issue) => issue.severity === 'error')
        .map((issue) => ({
            code: issue.code,
            message: issue.message,
        }))

    const proposals = validation.valid
        ? buildProposals(signoff, fixtureCases, reviewCases)
        : []

    return {
        schemaVersion: AI_EVAL_FIXTURE_EXPANSION_SCHEMA_VERSION,
        generatedAt: (options.generatedAt ?? new Date()).toISOString(),
        suiteVersion: fixture.suiteVersion,
        objective: 'Convert Academic Lead signoff follow-up actions into proposal-only AI eval fixture expansion backlog.',
        rules: {
            runtimeEffect: 'none',
            fixtureEffect: 'proposal_only',
            academicOwner: 'Head of German Pedagogy / Academic Lead',
            implementationOwner: 'AI / LLM Engineer',
        },
        summary: {
            sourceCases: signoff.cases.length,
            followUpActions: countFollowUpActions(signoff),
            proposals: proposals.length,
            blocked: blockers.length > 0,
        },
        blockers,
        proposals,
    }
}

export function renderAiEvalFixtureExpansionPlanMarkdown(plan: AiEvalFixtureExpansionPlan) {
    const lines = [
        '# AI Eval Fixture Expansion Proposal',
        '',
        `Schema: ${plan.schemaVersion}`,
        `Generated at: ${plan.generatedAt}`,
        `Suite: ${plan.suiteVersion}`,
        '',
        '## Objective',
        '',
        plan.objective,
        '',
        '## Rules',
        '',
        `- Runtime effect: ${plan.rules.runtimeEffect}`,
        `- Fixture effect: ${plan.rules.fixtureEffect}`,
        `- Academic owner: ${plan.rules.academicOwner}`,
        `- Implementation owner: ${plan.rules.implementationOwner}`,
        '- This report does not mutate `baseline.json`.',
        '- Prompt changes and fixture edits require a separate implementation step.',
        '',
        '## Summary',
        '',
        `- Source cases: ${plan.summary.sourceCases}`,
        `- Follow-up actions: ${plan.summary.followUpActions}`,
        `- Proposals: ${plan.summary.proposals}`,
        `- Blocked: ${plan.summary.blocked ? 'yes' : 'no'}`,
        '',
        '## Blockers',
        '',
    ]

    if (plan.blockers.length === 0) {
        lines.push('- None')
    } else {
        for (const blocker of plan.blockers) {
            lines.push(`- ${blocker.code}: ${blocker.message}`)
        }
    }

    lines.push('', '## Proposals', '')
    if (plan.proposals.length === 0) {
        lines.push('- No fixture expansion proposals yet')
    } else {
        lines.push('| Proposal | Source case | Decision | Level | Surface | Dimension focus | Recommendation | Candidate case | Follow-up action |')
        lines.push('| --- | --- | --- | --- | --- | --- | --- | --- | --- |')
        for (const proposal of plan.proposals) {
            lines.push([
                proposal.id,
                proposal.sourceCaseId,
                proposal.sourceDecision,
                proposal.level,
                proposal.surface,
                proposal.dimensionFocus.join(', '),
                proposal.recommendation,
                proposal.candidateCaseId,
                proposal.followUpAction,
            ].map(escapeMarkdownTable).join(' | ').replace(/^/, '| ').replace(/$/, ' |'))
        }
    }

    lines.push('', '## Prompt Backlog Handoff', '')
    if (plan.proposals.length === 0) {
        lines.push('- No prompt backlog items generated')
    } else {
        for (const proposal of plan.proposals) {
            lines.push(`- ${proposal.candidateCaseId}: ${proposal.fixtureChange.promptBacklogHint}`)
        }
    }

    return `${lines.join('\n')}\n`
}

function buildProposals(
    signoff: AiEvalAcademicSignoffRecord,
    fixtureCases: Map<string, AiEvalCase>,
    reviewCases: Map<string, AiEvalAcademicReviewPack['groups'][number]['cases'][number]>,
) {
    const proposals: AiEvalFixtureExpansionProposal[] = []

    for (const caseSignoff of signoff.cases) {
        if (caseSignoff.decision !== 'changes_requested' && caseSignoff.decision !== 'rejected') {
            continue
        }

        const sourceDecision = caseSignoff.decision
        const fixtureCase = fixtureCases.get(caseSignoff.id)
        const reviewCase = reviewCases.get(caseSignoff.id)
        const dimensionFocus = openDimensions(caseSignoff.dimensionDecisions)

        caseSignoff.followUpActions.forEach((followUpAction, index) => {
            const candidateCaseId = candidateId(caseSignoff.id, index + 1)
            proposals.push({
                id: `FX-${candidateCaseId}`,
                sourceCaseId: caseSignoff.id,
                sourceDecision,
                level: fixtureCase?.level ?? reviewCase?.level ?? 'unknown',
                surface: fixtureCase?.surface ?? reviewCase?.surface ?? 'unknown',
                dimensionFocus,
                followUpAction,
                recommendation: recommendationFor(sourceDecision, fixtureCase),
                candidateCaseId,
                fixtureChange: {
                    effect: 'proposal_only',
                    expectedSignalsToConsider: fixtureCase?.expected.requiredSignals ?? reviewCase?.expectedSignals ?? [],
                    expectedCriteriaToConsider: fixtureCase?.expected.requiredCriteria ?? reviewCase?.expectedCriteria ?? [],
                    promptBacklogHint: buildPromptBacklogHint(caseSignoff.id, followUpAction, dimensionFocus),
                },
                owners: {
                    academic: 'Head of German Pedagogy / Academic Lead',
                    implementation: 'AI / LLM Engineer',
                    qa: 'QA Automation Engineer',
                },
            })
        })
    }

    return proposals
}

function openDimensions(decisions: Record<AcademicReviewDimension, string>) {
    const dimensions = ACADEMIC_REVIEW_DIMENSIONS.filter((dimension) => (
        decisions[dimension] === 'changes_requested' || decisions[dimension] === 'rejected'
    ))

    return dimensions.length > 0 ? dimensions : [...ACADEMIC_REVIEW_DIMENSIONS]
}

function recommendationFor(decision: AcademicSignoffDecision, fixtureCase: AiEvalCase | undefined): AiEvalFixtureExpansionRecommendation {
    if (!fixtureCase) return 'manual_review'
    return decision === 'rejected' ? 'add_regression_case' : 'update_existing_case'
}

function candidateId(sourceCaseId: string, index: number) {
    return `${sourceCaseId}-FOLLOWUP-${String(index).padStart(2, '0')}`
}

function buildPromptBacklogHint(
    sourceCaseId: string,
    followUpAction: string,
    dimensionFocus: AcademicReviewDimension[],
) {
    return `${sourceCaseId}: ${followUpAction} [focus: ${dimensionFocus.join(', ')}]`
}

function countFollowUpActions(signoff: AiEvalAcademicSignoffRecord) {
    return signoff.cases.reduce((total, item) => total + item.followUpActions.length, 0)
}

function escapeMarkdownTable(value: string) {
    return value.replace(/\|/g, '\\|').replace(/\r?\n/g, '<br>')
}
