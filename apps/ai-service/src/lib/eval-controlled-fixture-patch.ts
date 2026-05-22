import type { AiEvalFixtureExpansionPlan, AiEvalFixtureExpansionProposal } from './eval-fixture-expansion.js'
import type { AiEvalCase, AiEvalFixture } from './eval-harness.js'

export const AI_EVAL_CONTROLLED_FIXTURE_PATCH_SCHEMA_VERSION = 'ai-eval-controlled-fixture-patch-v1'

export interface AiEvalControlledFixturePatch {
    schemaVersion: typeof AI_EVAL_CONTROLLED_FIXTURE_PATCH_SCHEMA_VERSION
    generatedAt: string
    suiteVersion: string
    mode: 'preview' | 'apply'
    rules: {
        source: 'fixture_expansion_proposal'
        baselineMutation: 'disabled_in_preview' | 'enabled_by_apply_flag'
        runtimeEffect: 'none'
    }
    summary: {
        sourceCases: number
        proposalCount: number
        candidateCases: number
        blocked: boolean
        changed: boolean
    }
    blockers: Array<{
        code: string
        message: string
    }>
    changes: AiEvalControlledFixturePatchChange[]
    fixture: AiEvalFixture
}

export interface AiEvalControlledFixturePatchChange {
    proposalId: string
    sourceCaseId: string
    candidateCaseId: string
    operation: 'add_regression_case' | 'clone_followup_case'
    level: string
    surface: string
    description: string
}

export function buildAiEvalControlledFixturePatch(
    fixture: AiEvalFixture,
    plan: AiEvalFixtureExpansionPlan,
    options: {
        generatedAt?: Date
        mode?: 'preview' | 'apply'
        proposalIds?: string[]
    } = {},
): AiEvalControlledFixturePatch {
    const selectedProposalIds = options.proposalIds?.length ? new Set(options.proposalIds) : null
    const proposals = selectedProposalIds
        ? plan.proposals.filter((proposal) => selectedProposalIds.has(proposal.id))
        : plan.proposals
    const blockers = validatePatchInputs(fixture, plan, proposals, selectedProposalIds)
    const changes = blockers.length === 0
        ? proposals.map((proposal) => buildChange(proposal))
        : []
    const patchedFixture = blockers.length === 0
        ? applyCandidateCases(fixture, proposals)
        : cloneFixture(fixture)
    const mode = options.mode ?? 'preview'

    return {
        schemaVersion: AI_EVAL_CONTROLLED_FIXTURE_PATCH_SCHEMA_VERSION,
        generatedAt: (options.generatedAt ?? new Date()).toISOString(),
        suiteVersion: fixture.suiteVersion,
        mode,
        rules: {
            source: 'fixture_expansion_proposal',
            baselineMutation: mode === 'apply' ? 'enabled_by_apply_flag' : 'disabled_in_preview',
            runtimeEffect: 'none',
        },
        summary: {
            sourceCases: fixture.cases.length,
            proposalCount: proposals.length,
            candidateCases: changes.length,
            blocked: blockers.length > 0,
            changed: blockers.length === 0 && changes.length > 0,
        },
        blockers,
        changes,
        fixture: patchedFixture,
    }
}

export function renderAiEvalControlledFixturePatchMarkdown(patch: AiEvalControlledFixturePatch) {
    const lines = [
        '# AI Eval Controlled Fixture Patch',
        '',
        `Schema: ${patch.schemaVersion}`,
        `Generated at: ${patch.generatedAt}`,
        `Suite: ${patch.suiteVersion}`,
        `Mode: ${patch.mode}`,
        '',
        '## Rules',
        '',
        `- Source: ${patch.rules.source}`,
        `- Baseline mutation: ${patch.rules.baselineMutation}`,
        `- Runtime effect: ${patch.rules.runtimeEffect}`,
        '- Preview mode never writes `baseline.json`.',
        '- Apply mode requires an explicit `--apply` flag.',
        '- Generated reports omit provider prompt text and raw provider output.',
        '',
        '## Summary',
        '',
        `- Source cases: ${patch.summary.sourceCases}`,
        `- Proposals selected: ${patch.summary.proposalCount}`,
        `- Candidate cases: ${patch.summary.candidateCases}`,
        `- Blocked: ${patch.summary.blocked ? 'yes' : 'no'}`,
        `- Changed: ${patch.summary.changed ? 'yes' : 'no'}`,
        '',
        '## Blockers',
        '',
    ]

    if (patch.blockers.length === 0) {
        lines.push('- None')
    } else {
        for (const blocker of patch.blockers) {
            lines.push(`- ${blocker.code}: ${blocker.message}`)
        }
    }

    lines.push('', '## Controlled Changes', '')
    if (patch.changes.length === 0) {
        lines.push('- No fixture changes prepared')
    } else {
        lines.push('| Operation | Source case | Candidate case | Level | Surface | Description |')
        lines.push('| --- | --- | --- | --- | --- | --- |')
        for (const change of patch.changes) {
            lines.push([
                change.operation,
                change.sourceCaseId,
                change.candidateCaseId,
                change.level,
                change.surface,
                change.description,
            ].map(escapeMarkdownTable).join(' | ').replace(/^/, '| ').replace(/$/, ' |'))
        }
    }

    return `${lines.join('\n')}\n`
}

function validatePatchInputs(
    fixture: AiEvalFixture,
    plan: AiEvalFixtureExpansionPlan,
    proposals: AiEvalFixtureExpansionProposal[],
    selectedProposalIds: Set<string> | null,
) {
    const blockers: AiEvalControlledFixturePatch['blockers'] = []
    const fixtureCaseIds = new Set(fixture.cases.map((testCase) => testCase.id))
    const planProposalIds = new Set(plan.proposals.map((proposal) => proposal.id))

    if (plan.summary.blocked) {
        blockers.push({ code: 'EXPANSION_PLAN_BLOCKED', message: 'Fixture expansion plan is blocked' })
    }
    if (fixture.suiteVersion !== plan.suiteVersion) {
        blockers.push({ code: 'SUITE_VERSION_MISMATCH', message: `Expected plan suite ${fixture.suiteVersion}` })
    }
    if (selectedProposalIds) {
        for (const proposalId of selectedProposalIds) {
            if (!planProposalIds.has(proposalId)) {
                blockers.push({ code: 'UNKNOWN_PROPOSAL_ID', message: `Unknown proposal ${proposalId}` })
            }
        }
    }

    for (const proposal of proposals) {
        if (!fixtureCaseIds.has(proposal.sourceCaseId)) {
            blockers.push({ code: 'MISSING_SOURCE_CASE', message: `Missing source case ${proposal.sourceCaseId}` })
        }
        if (fixtureCaseIds.has(proposal.candidateCaseId)) {
            blockers.push({ code: 'DUPLICATE_CANDIDATE_CASE', message: `Candidate case already exists ${proposal.candidateCaseId}` })
        }
        if (proposal.recommendation === 'manual_review') {
            blockers.push({ code: 'MANUAL_REVIEW_REQUIRED', message: `Proposal ${proposal.id} requires manual review` })
        }
        if (proposal.fixtureChange.effect !== 'proposal_only') {
            blockers.push({ code: 'UNSAFE_FIXTURE_EFFECT', message: `Proposal ${proposal.id} is not proposal-only` })
        }
    }

    return blockers
}

function applyCandidateCases(fixture: AiEvalFixture, proposals: AiEvalFixtureExpansionProposal[]): AiEvalFixture {
    const sourceCases = new Map(fixture.cases.map((testCase) => [testCase.id, testCase]))
    const candidateCases = proposals.flatMap((proposal) => {
        const sourceCase = sourceCases.get(proposal.sourceCaseId)
        return sourceCase ? [buildCandidateCase(sourceCase, proposal)] : []
    })

    return {
        ...cloneFixture(fixture),
        cases: [...cloneFixture(fixture).cases, ...candidateCases],
    }
}

function buildCandidateCase(sourceCase: AiEvalCase, proposal: AiEvalFixtureExpansionProposal): AiEvalCase {
    const followUp = sanitizeFollowUpAction(proposal.followUpAction)
    const providerPrompt = sourceCase.providerPrompt
        ? {
            ...sourceCase.providerPrompt,
            promptVersion: `${sourceCase.providerPrompt.promptVersion}-followup-${suffixFromCandidateId(proposal.candidateCaseId)}`,
            prompt: `${sourceCase.providerPrompt.prompt} Academic follow-up focus: ${followUp}`,
        }
        : undefined

    return {
        ...structuredClone(sourceCase),
        id: proposal.candidateCaseId,
        description: `Academic follow-up regression for ${sourceCase.id}: ${followUp}`,
        expected: {
            ...structuredClone(sourceCase.expected),
            requiredCriteria: proposal.fixtureChange.expectedCriteriaToConsider.length > 0
                ? [...proposal.fixtureChange.expectedCriteriaToConsider]
                : sourceCase.expected.requiredCriteria,
            requiredSignals: proposal.fixtureChange.expectedSignalsToConsider.length > 0
                ? [...proposal.fixtureChange.expectedSignalsToConsider]
                : sourceCase.expected.requiredSignals,
        },
        observed: {
            ...structuredClone(sourceCase.observed),
            outputExcerpt: sourceCase.observed.outputExcerpt
                ? `${sourceCase.observed.outputExcerpt} Follow-up focus: ${followUp}`
                : `Follow-up focus: ${followUp}`,
        },
        providerPrompt,
    }
}

function buildChange(proposal: AiEvalFixtureExpansionProposal): AiEvalControlledFixturePatchChange {
    return {
        proposalId: proposal.id,
        sourceCaseId: proposal.sourceCaseId,
        candidateCaseId: proposal.candidateCaseId,
        operation: proposal.recommendation === 'add_regression_case' ? 'add_regression_case' : 'clone_followup_case',
        level: proposal.level,
        surface: proposal.surface,
        description: sanitizeFollowUpAction(proposal.followUpAction),
    }
}

function cloneFixture(fixture: AiEvalFixture): AiEvalFixture {
    return structuredClone(fixture)
}

function sanitizeFollowUpAction(value: string) {
    return value
        .replace(/\b(raw submission|raw answer|transcript|audio file|provider payload|prompt text|secret|token)\b/gi, '[redacted]')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 220)
}

function suffixFromCandidateId(candidateCaseId: string) {
    return candidateCaseId.split('-').at(-1)?.toLowerCase() ?? '01'
}

function escapeMarkdownTable(value: string) {
    return value.replace(/\|/g, '\\|').replace(/\r?\n/g, '<br>')
}
