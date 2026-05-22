import {
    ACADEMIC_REVIEW_DIMENSIONS,
    type AcademicReviewDimension,
    type AiEvalAcademicReviewPack,
} from './eval-academic-review-pack.js'

export const ACADEMIC_SIGNOFF_SCHEMA_VERSION = 'ai-eval-academic-signoff-v1'
export const GERMAN_ACADEMIC_LEAD_ROLE = 'Head of German Pedagogy / Academic Lead'

export type AcademicSignoffDecision = 'approved' | 'changes_requested' | 'rejected'
export type AcademicSignoffState = AcademicSignoffDecision | 'pending'

export interface AiEvalAcademicSignoffRecord {
    schemaVersion: typeof ACADEMIC_SIGNOFF_SCHEMA_VERSION
    suiteVersion: string
    reviewPackGeneratedAt: string
    generatedAt: string
    reviewedAt: string | null
    reviewer: {
        name: string
        role: typeof GERMAN_ACADEMIC_LEAD_ROLE
    }
    overallDecision: AcademicSignoffState
    rules: {
        owner: typeof GERMAN_ACADEMIC_LEAD_ROLE
        runtimeEffect: 'none'
        allowedDecisions: AcademicSignoffDecision[]
    }
    cases: AiEvalAcademicCaseSignoff[]
}

export interface AiEvalAcademicCaseSignoff {
    id: string
    decision: AcademicSignoffState
    dimensionDecisions: Record<AcademicReviewDimension, AcademicSignoffState>
    reviewerNotes: string
    followUpActions: string[]
}

export interface AiEvalAcademicSignoffValidation {
    valid: boolean
    summary: {
        totalCases: number
        approvedCases: number
        changesRequestedCases: number
        rejectedCases: number
        pendingCases: number
        derivedOverallDecision: AcademicSignoffState
    }
    issues: Array<{
        severity: 'error' | 'warning'
        code: string
        message: string
    }>
}

export function buildAiEvalAcademicSignoffTemplate(
    pack: AiEvalAcademicReviewPack,
    options: {
        generatedAt?: Date
        reviewerName?: string
    } = {},
): AiEvalAcademicSignoffRecord {
    return {
        schemaVersion: ACADEMIC_SIGNOFF_SCHEMA_VERSION,
        suiteVersion: pack.suiteVersion,
        reviewPackGeneratedAt: pack.generatedAt,
        generatedAt: (options.generatedAt ?? new Date()).toISOString(),
        reviewedAt: null,
        reviewer: {
            name: options.reviewerName ?? 'pending',
            role: GERMAN_ACADEMIC_LEAD_ROLE,
        },
        overallDecision: 'pending',
        rules: {
            owner: GERMAN_ACADEMIC_LEAD_ROLE,
            runtimeEffect: 'none',
            allowedDecisions: ['approved', 'changes_requested', 'rejected'],
        },
        cases: pack.groups
            .flatMap((group) => group.cases)
            .map((testCase) => ({
                id: testCase.id,
                decision: 'pending',
                dimensionDecisions: pendingDimensionDecisions(),
                reviewerNotes: '',
                followUpActions: [],
            })),
    }
}

export function validateAiEvalAcademicSignoff(
    record: AiEvalAcademicSignoffRecord,
    pack: AiEvalAcademicReviewPack,
    options: { requireFinal?: boolean } = {},
): AiEvalAcademicSignoffValidation {
    const issues: AiEvalAcademicSignoffValidation['issues'] = []
    const packCaseIds = pack.groups.flatMap((group) => group.cases.map((testCase) => testCase.id))
    const packCaseIdSet = new Set(packCaseIds)
    const recordCaseIds = record.cases.map((testCase) => testCase.id)
    const recordCaseIdSet = new Set(recordCaseIds)

    if (record.schemaVersion !== ACADEMIC_SIGNOFF_SCHEMA_VERSION) {
        pushIssue(issues, 'error', 'SCHEMA_VERSION_MISMATCH', `Expected ${ACADEMIC_SIGNOFF_SCHEMA_VERSION}`)
    }
    if (record.suiteVersion !== pack.suiteVersion) {
        pushIssue(issues, 'error', 'SUITE_VERSION_MISMATCH', `Expected suite ${pack.suiteVersion}`)
    }
    if (record.reviewPackGeneratedAt !== pack.generatedAt) {
        pushIssue(issues, 'warning', 'REVIEW_PACK_TIMESTAMP_MISMATCH', 'Signoff record was generated from a different review pack timestamp')
    }
    if (record.reviewer.role !== GERMAN_ACADEMIC_LEAD_ROLE) {
        pushIssue(issues, 'error', 'INVALID_REVIEWER_ROLE', `Reviewer role must be ${GERMAN_ACADEMIC_LEAD_ROLE}`)
    }
    if (options.requireFinal && isPendingName(record.reviewer.name)) {
        pushIssue(issues, 'error', 'MISSING_REVIEWER_NAME', 'Final signoff requires the Academic Lead reviewer name')
    }
    if (options.requireFinal && !isIsoDate(record.reviewedAt)) {
        pushIssue(issues, 'error', 'MISSING_REVIEWED_AT', 'Final signoff requires reviewedAt as an ISO timestamp')
    }

    for (const caseId of packCaseIds) {
        if (!recordCaseIdSet.has(caseId)) {
            pushIssue(issues, 'error', 'MISSING_CASE_SIGNOFF', `Missing signoff for ${caseId}`)
        }
    }

    for (const caseId of recordCaseIds) {
        if (!packCaseIdSet.has(caseId)) {
            pushIssue(issues, 'error', 'UNKNOWN_CASE_SIGNOFF', `Unknown signoff case ${caseId}`)
        }
        if (recordCaseIds.indexOf(caseId) !== recordCaseIds.lastIndexOf(caseId)) {
            pushIssue(issues, 'error', 'DUPLICATE_CASE_SIGNOFF', `Duplicate signoff case ${caseId}`)
        }
    }

    for (const caseSignoff of record.cases) {
        validateCaseSignoff(caseSignoff, issues, options.requireFinal ?? false)
    }

    const summary = summarizeCaseDecisions(record.cases)
    if (options.requireFinal && summary.pendingCases > 0) {
        pushIssue(issues, 'error', 'PENDING_CASE_DECISION', 'Final signoff cannot contain pending case decisions')
    }
    if (options.requireFinal && record.overallDecision === 'pending') {
        pushIssue(issues, 'error', 'PENDING_OVERALL_DECISION', 'Final signoff requires approved, changes_requested, or rejected')
    }
    if (record.overallDecision !== summary.derivedOverallDecision) {
        pushIssue(
            issues,
            options.requireFinal ? 'error' : 'warning',
            'OVERALL_DECISION_MISMATCH',
            `Overall decision should be ${summary.derivedOverallDecision}`,
        )
    }

    return {
        valid: issues.every((issue) => issue.severity !== 'error'),
        summary,
        issues,
    }
}

export function renderAiEvalAcademicSignoffMarkdown(
    record: AiEvalAcademicSignoffRecord,
    validation: AiEvalAcademicSignoffValidation,
) {
    const lines = [
        '# AI Eval Academic Signoff',
        '',
        `Schema: ${record.schemaVersion}`,
        `Suite: ${record.suiteVersion}`,
        `Review pack generated at: ${record.reviewPackGeneratedAt}`,
        `Reviewer: ${record.reviewer.name}`,
        `Reviewer role: ${record.reviewer.role}`,
        `Reviewed at: ${record.reviewedAt ?? 'pending'}`,
        `Overall decision: ${record.overallDecision}`,
        `Derived decision: ${validation.summary.derivedOverallDecision}`,
        `Runtime effect: ${record.rules.runtimeEffect}`,
        '',
        '## Role Rules',
        '',
        `- Owner: ${record.rules.owner}`,
        '- AI / LLM Engineer prepares eval evidence and prompt backlog handoff.',
        '- German Academic Lead owns approve, changes-requested, or reject decisions.',
        '- QA Automation Engineer verifies schema validation and report generation.',
        '- Data / Analytics Engineer uses this only as evidence metadata, not learner analytics.',
        '- Signoff records do not change runtime AI behavior by themselves.',
        '',
        '## Summary',
        '',
        `- Cases: ${validation.summary.totalCases}`,
        `- Approved: ${validation.summary.approvedCases}`,
        `- Changes requested: ${validation.summary.changesRequestedCases}`,
        `- Rejected: ${validation.summary.rejectedCases}`,
        `- Pending: ${validation.summary.pendingCases}`,
        `- Valid: ${validation.valid ? 'yes' : 'no'}`,
        '',
        '## Issues',
        '',
    ]

    if (validation.issues.length === 0) {
        lines.push('- None')
    } else {
        for (const issue of validation.issues) {
            lines.push(`- ${issue.severity.toUpperCase()} ${issue.code}: ${issue.message}`)
        }
    }

    lines.push('', '## Case Decisions', '')
    lines.push('| Case | Decision | Dimensions | Follow-up actions | Notes |')
    lines.push('| --- | --- | --- | --- | --- |')

    for (const caseSignoff of record.cases) {
        lines.push([
            caseSignoff.id,
            caseSignoff.decision,
            ACADEMIC_REVIEW_DIMENSIONS
                .map((dimension) => `${dimension}: ${caseSignoff.dimensionDecisions[dimension] ?? 'missing'}`)
                .join('<br>'),
            caseSignoff.followUpActions.length > 0 ? caseSignoff.followUpActions.join('<br>') : 'n/a',
            caseSignoff.reviewerNotes || 'n/a',
        ].map(escapeMarkdownTable).join(' | ').replace(/^/, '| ').replace(/$/, ' |'))
    }

    lines.push('', '## Prompt Backlog Handoff', '')
    const followUps = record.cases.flatMap((caseSignoff) => (
        caseSignoff.followUpActions.map((action) => `${caseSignoff.id}: ${action}`)
    ))
    if (followUps.length === 0) {
        lines.push('- No follow-up actions recorded yet')
    } else {
        for (const followUp of followUps) {
            lines.push(`- ${followUp}`)
        }
    }

    return `${lines.join('\n')}\n`
}

function validateCaseSignoff(
    caseSignoff: AiEvalAcademicCaseSignoff,
    issues: AiEvalAcademicSignoffValidation['issues'],
    requireFinal: boolean,
) {
    if (!isSignoffState(caseSignoff.decision)) {
        pushIssue(issues, 'error', 'INVALID_CASE_DECISION', `${caseSignoff.id} has invalid decision`)
    }

    for (const dimension of ACADEMIC_REVIEW_DIMENSIONS) {
        const decision = caseSignoff.dimensionDecisions[dimension]
        if (!isSignoffState(decision)) {
            pushIssue(issues, 'error', 'MISSING_DIMENSION_DECISION', `${caseSignoff.id} missing ${dimension}`)
        }
        if (requireFinal && decision === 'pending') {
            pushIssue(issues, 'error', 'PENDING_DIMENSION_DECISION', `${caseSignoff.id} has pending ${dimension}`)
        }
    }

    if (caseSignoff.decision === 'approved') {
        const nonApprovedDimension = ACADEMIC_REVIEW_DIMENSIONS.find((dimension) => (
            caseSignoff.dimensionDecisions[dimension] !== 'approved'
        ))
        if (nonApprovedDimension) {
            pushIssue(issues, 'error', 'APPROVED_CASE_HAS_OPEN_DIMENSION', `${caseSignoff.id} cannot be approved while ${nonApprovedDimension} is open`)
        }
    }

    if (
        (caseSignoff.decision === 'changes_requested' || caseSignoff.decision === 'rejected')
        && caseSignoff.followUpActions.length === 0
    ) {
        pushIssue(issues, 'error', 'MISSING_FOLLOW_UP_ACTION', `${caseSignoff.id} requires at least one follow-up action`)
    }

    const textFields = [caseSignoff.reviewerNotes, ...caseSignoff.followUpActions]
    for (const value of textFields) {
        if (containsSensitiveMarker(value)) {
            pushIssue(issues, 'error', 'PRIVACY_UNSAFE_SIGNOFF_TEXT', `${caseSignoff.id} contains unsafe raw-data markers`)
        }
    }
}

function summarizeCaseDecisions(cases: AiEvalAcademicCaseSignoff[]): AiEvalAcademicSignoffValidation['summary'] {
    const approvedCases = cases.filter((item) => item.decision === 'approved').length
    const changesRequestedCases = cases.filter((item) => item.decision === 'changes_requested').length
    const rejectedCases = cases.filter((item) => item.decision === 'rejected').length
    const pendingCases = cases.filter((item) => item.decision === 'pending').length

    return {
        totalCases: cases.length,
        approvedCases,
        changesRequestedCases,
        rejectedCases,
        pendingCases,
        derivedOverallDecision: deriveOverallDecision({
            approvedCases,
            changesRequestedCases,
            rejectedCases,
            pendingCases,
            totalCases: cases.length,
        }),
    }
}

function deriveOverallDecision(counts: {
    totalCases: number
    approvedCases: number
    changesRequestedCases: number
    rejectedCases: number
    pendingCases: number
}): AcademicSignoffState {
    if (counts.pendingCases > 0 || counts.totalCases === 0) return 'pending'
    if (counts.rejectedCases > 0) return 'rejected'
    if (counts.changesRequestedCases > 0) return 'changes_requested'
    return counts.approvedCases === counts.totalCases ? 'approved' : 'pending'
}

function pendingDimensionDecisions() {
    return Object.fromEntries(
        ACADEMIC_REVIEW_DIMENSIONS.map((dimension) => [dimension, 'pending']),
    ) as Record<AcademicReviewDimension, 'pending'>
}

function isSignoffState(value: unknown): value is AcademicSignoffState {
    return value === 'pending' || value === 'approved' || value === 'changes_requested' || value === 'rejected'
}

function isPendingName(value: string) {
    return !value.trim() || value.trim().toLowerCase() === 'pending'
}

function isIsoDate(value: string | null) {
    if (!value) return false
    const timestamp = Date.parse(value)
    return Number.isFinite(timestamp)
}

function containsSensitiveMarker(value: string) {
    return /\b(raw submission|raw answer|transcript|audio file|provider payload|prompt text|secret|token)\b/i.test(value)
}

function pushIssue(
    issues: AiEvalAcademicSignoffValidation['issues'],
    severity: 'error' | 'warning',
    code: string,
    message: string,
) {
    issues.push({ severity, code, message })
}

function escapeMarkdownTable(value: string) {
    return value.replace(/\|/g, '\\|').replace(/\r?\n/g, '<br>')
}
