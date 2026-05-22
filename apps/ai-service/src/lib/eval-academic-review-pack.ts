import type { AiEvalArtifactReadout } from './eval-artifact-readout.js'
import { runAiEvalSuite, type AiEvalCase, type AiEvalFixture } from './eval-harness.js'

export const ACADEMIC_REVIEW_DIMENSIONS = [
    'CEFR fit',
    'German correctness',
    'Vietnamese learner usefulness',
    'Exam-claim caution',
    'Retry usefulness',
    'Safety/privacy',
] as const

export type AcademicReviewDimension = typeof ACADEMIC_REVIEW_DIMENSIONS[number]

export interface AiEvalAcademicReviewPack {
    suiteVersion: string
    generatedAt: string
    signoffStatus: 'pending_academic_review'
    automatedEvidence: {
        offlinePassRate: number
        offlinePassedCases: number
        offlineTotalCases: number
        latestProviderRunStatus: string
        providerCasePassRate: number | null
    }
    groups: Array<{
        level: string
        surface: string
        cases: AiEvalAcademicReviewCase[]
    }>
    signoffDimensions: AcademicReviewDimension[]
    residualRisks: string[]
}

export interface AiEvalAcademicReviewCase {
    id: string
    level: string
    surface: string
    description: string
    automatedStatus: 'passed' | 'failed'
    scorePercent: number | null
    estimatedLevel: string | null
    expectedSignals: string[]
    observedSignals: string[]
    expectedCriteria: string[]
    observedCriteria: string[]
    outputExcerpt: string | null
    academicChecklist: Record<AcademicReviewDimension, 'pending'>
}

export function buildAiEvalAcademicReviewPack(
    fixture: AiEvalFixture,
    options: {
        artifactReadout?: AiEvalArtifactReadout
        generatedAt?: Date
    } = {},
): AiEvalAcademicReviewPack {
    const suite = runAiEvalSuite(fixture)
    const reviewCases = fixture.cases.map((testCase) => {
        const result = suite.cases.find((item) => item.id === testCase.id)
        return buildReviewCase(testCase, result?.passed ?? false)
    })

    return {
        suiteVersion: fixture.suiteVersion,
        generatedAt: (options.generatedAt ?? new Date()).toISOString(),
        signoffStatus: 'pending_academic_review',
        automatedEvidence: {
            offlinePassRate: suite.summary.passRate,
            offlinePassedCases: suite.summary.passedCases,
            offlineTotalCases: suite.summary.totalCases,
            latestProviderRunStatus: options.artifactReadout?.latestRun.status ?? 'unknown',
            providerCasePassRate: options.artifactReadout?.counts.completedCases
                ? options.artifactReadout.rates.casePassRate
                : null,
        },
        groups: groupReviewCases(reviewCases),
        signoffDimensions: [...ACADEMIC_REVIEW_DIMENSIONS],
        residualRisks: [
            'Automated CI pass is not academic signoff.',
            'Provider quality remains pending when provider runs are blocked or unavailable.',
            'Academic reviewer must confirm CEFR fit, German naturalness, and Vietnamese learner usefulness from controlled excerpts.',
        ],
    }
}

export function renderAiEvalAcademicReviewPackMarkdown(pack: AiEvalAcademicReviewPack) {
    const lines = [
        '# AI Eval Academic Review Pack',
        '',
        `Generated at: ${pack.generatedAt}`,
        `Suite: ${pack.suiteVersion}`,
        `Academic signoff status: ${pack.signoffStatus}`,
        '',
        '> CI pass is automated evidence only. It is not German Academic Lead signoff.',
        '',
        '## Automated Evidence',
        '',
        `- Offline pass rate: ${pack.automatedEvidence.offlinePassRate}% (${pack.automatedEvidence.offlinePassedCases}/${pack.automatedEvidence.offlineTotalCases})`,
        `- Latest provider run status: ${pack.automatedEvidence.latestProviderRunStatus}`,
        `- Provider case pass rate: ${formatNullablePercent(pack.automatedEvidence.providerCasePassRate)}`,
        '',
        '## Review Dimensions',
        '',
        ...pack.signoffDimensions.map((dimension) => `- [ ] ${dimension}`),
        '',
        '## Case Review',
        '',
    ]

    for (const group of pack.groups) {
        lines.push(`### ${group.level} ${group.surface}`, '')
        lines.push('| Case | Description | Automated | Score | Estimated level | Criteria | Signals | Output excerpt | Academic review |')
        lines.push('| --- | --- | --- | --- | --- | --- | --- | --- | --- |')

        for (const testCase of group.cases) {
            lines.push([
                testCase.id,
                testCase.description,
                testCase.automatedStatus,
                formatNullable(testCase.scorePercent),
                testCase.estimatedLevel ?? 'n/a',
                `Expected: ${listOrNa(testCase.expectedCriteria)}<br>Observed: ${listOrNa(testCase.observedCriteria)}`,
                `Expected: ${listOrNa(testCase.expectedSignals)}<br>Observed: ${listOrNa(testCase.observedSignals)}`,
                testCase.outputExcerpt ? escapeMarkdownTable(testCase.outputExcerpt) : 'n/a',
                pack.signoffDimensions.map((dimension) => `${dimension}: pending`).join('<br>'),
            ].map(escapeMarkdownTable).join(' | ').replace(/^/, '| ').replace(/$/, ' |'))
        }

        lines.push('')
    }

    lines.push('## Residual Risks', '')
    for (const risk of pack.residualRisks) {
        lines.push(`- ${risk}`)
    }

    lines.push('', '## Signoff', '')
    lines.push('- German Academic Lead: pending')
    lines.push('- Date: pending')
    lines.push('- Decision: pending')

    return `${lines.join('\n')}\n`
}

function buildReviewCase(testCase: AiEvalCase, passed: boolean): AiEvalAcademicReviewCase {
    return {
        id: testCase.id,
        level: testCase.level,
        surface: testCase.surface,
        description: testCase.description,
        automatedStatus: passed ? 'passed' : 'failed',
        scorePercent: numberOrNull(testCase.observed.scorePercent),
        estimatedLevel: testCase.observed.estimatedLevel ?? null,
        expectedSignals: testCase.expected.requiredSignals ?? [],
        observedSignals: testCase.observed.signals ?? [],
        expectedCriteria: testCase.expected.requiredCriteria ?? [],
        observedCriteria: (testCase.observed.criteria ?? []).map((criterion) => criterion.name ?? criterion.id ?? 'unknown'),
        outputExcerpt: testCase.observed.outputExcerpt ?? null,
        academicChecklist: Object.fromEntries(
            ACADEMIC_REVIEW_DIMENSIONS.map((dimension) => [dimension, 'pending']),
        ) as Record<AcademicReviewDimension, 'pending'>,
    }
}

function groupReviewCases(cases: AiEvalAcademicReviewCase[]) {
    const buckets = new Map<string, { level: string; surface: string; cases: AiEvalAcademicReviewCase[] }>()

    for (const testCase of cases) {
        const key = `${testCase.level}:${testCase.surface}`
        const bucket = buckets.get(key) ?? {
            level: testCase.level,
            surface: testCase.surface,
            cases: [],
        }
        bucket.cases.push(testCase)
        buckets.set(key, bucket)
    }

    return [...buckets.values()].sort((a, b) => (
        levelRank(a.level) - levelRank(b.level)
        || a.surface.localeCompare(b.surface)
    ))
}

function levelRank(level: string) {
    return ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].indexOf(level)
}

function numberOrNull(value: unknown) {
    return typeof value === 'number' && Number.isFinite(value) ? value : null
}

function formatNullable(value: number | null) {
    return value === null ? 'n/a' : String(value)
}

function formatNullablePercent(value: number | null) {
    return value === null ? 'n/a' : `${value}%`
}

function listOrNa(values: string[]) {
    return values.length === 0 ? 'n/a' : values.join(', ')
}

function escapeMarkdownTable(value: string) {
    return value.replace(/\|/g, '\\|').replace(/\r?\n/g, '<br>')
}
