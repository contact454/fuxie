/**
 * Spec `fuxie-content-review-board` — pure contract module (single source of truth).
 *
 * These small, dependency-free types + functions encode the EXACT contract that
 * the production Tier-1 / Tier-2 modules MUST satisfy. They were originally
 * scaffolded under `tests/content-audit/review-board-helpers.ts` (task 1.1) so
 * the 5 correctness properties (design §"Correctness Properties") were runnable
 * before any production code landed.
 *
 * Task 1.2 promotes them into this production module so there is a SINGLE
 * source of truth shared by BOTH:
 *   - `scripts/content-german-lint.ts` (Tier-1 gate, this spec)
 *   - `tests/content-audit/review-board-helpers.ts` (re-exports for the PBT suite)
 *
 * Semantics mirror design.md (Components 1, 3, 4 + Data Models / Invariants):
 *   - Tier1Result.objectiveVerdict = FAIL iff any finding has severity='error'
 *   - buildRedTeamPayload(q) carries ONLY { stem, options } (no answer leakage)
 *   - combineLabels(t1, agg) -> ItemLabel with two SEPARATE labels +
 *     mandatory notReviewedNote, never the word "approved"
 *   - status='escalate' iff objective=FAIL ∨ redFlag ∨ confidence != 'high'
 */

// ---------------------------------------------------------------------------
// Tier-1 (deterministic gate) — Component 1
// ---------------------------------------------------------------------------

export type Tier1Severity = 'error' | 'warning'

export interface Tier1Finding {
  file: string
  jsonPath: string
  rule: string
  severity: Tier1Severity
  message: string
  offset?: { start: number; end: number; excerpt: string }
  suggestion?: string
}

export interface Tier1Result {
  scope: { files: number; deStrings: number }
  findings: Tier1Finding[]
  objectiveVerdict: 'PASS' | 'FAIL'
  infraError?: string
}

/**
 * Objective verdict is FAIL iff ≥ 1 finding has severity='error' (Req 1.5).
 * Pure function over the findings list.
 */
export function computeObjectiveVerdict(findings: readonly Tier1Finding[]): 'PASS' | 'FAIL' {
  return findings.some((f) => f.severity === 'error') ? 'FAIL' : 'PASS'
}

/**
 * Build a Tier1Result from a scope + findings, computing the verdict.
 * `infraError` (e.g. LanguageTool unavailable) forces a non-PASS state so the
 * gate never reports a false PASS (Req 1.9).
 */
export function buildTier1Result(
  scope: { files: number; deStrings: number },
  findings: Tier1Finding[],
  infraError?: string,
): Tier1Result {
  const objectiveVerdict = infraError ? 'FAIL' : computeObjectiveVerdict(findings)
  return { scope, findings, objectiveVerdict, ...(infraError ? { infraError } : {}) }
}

/**
 * Process exit code for the Tier-1 gate.
 *   0  -> PASS (no blocking error)
 *   1  -> FAIL (≥ 1 severity=error content finding)  => exit ≠ 0 (BLOCKING)
 *   2  -> infrastructure error (distinct from content fail, Req 1.9)
 */
export function tier1ExitCode(result: Tier1Result): number {
  if (result.infraError) return 2
  return result.objectiveVerdict === 'FAIL' ? 1 : 0
}

// ---------------------------------------------------------------------------
// Tier-2 (advisory board) — Components 3 & 4
// ---------------------------------------------------------------------------

export type Confidence = 'high' | 'medium' | 'low'

export type ReviewerId =
  | 'german_linguist'
  | 'cefr_pedagogy'
  | 'vn_localization'
  | 'redteam_blind'

export interface ReviewerOutput {
  reviewer: ReviewerId
  dimension: 'German' | 'pedagogy' | 'CEFR' | 'VN' | 'answer'
  verdict: 'ok' | 'concern' | 'fail'
  severity: 'P0' | 'P1' | 'P2' | 'none'
  rationale: string
  evidence: string
}

export interface AggregateResult {
  itemId: string
  consensus: 'ok' | 'concern' | 'fail'
  confidence: Confidence
  perDimension: ReviewerOutput[]
  redFlag: boolean
  estimatedCostUsd: number
}

/** Minimal shape of a reading question fed to the red-team builder. */
export interface ReadingQuestion {
  stem?: string
  statement?: string
  situation?: string
  options?: string[]
  // Answer-bearing fields that MUST NOT leak to the red-team payload:
  answer?: unknown
  correctIndex?: unknown
  solution?: unknown
  explanation?: unknown
  key_evidence?: unknown
  [extra: string]: unknown
}

/** Keys that must NEVER appear in the red-team payload (Req 3.1, 3.5). */
export const FORBIDDEN_REDTEAM_KEYS = [
  'answer',
  'correctIndex',
  'solution',
  'explanation',
  'key_evidence',
] as const

/**
 * Component 3 — red-team blind payload builder. Selects ONLY the prompt stem
 * (statement | stem | situation) and options. Never copies answer-bearing
 * fields, so the answer cannot leak into the red-team context.
 */
export function buildRedTeamPayload(q: ReadingQuestion): { stem: string; options?: string[] } {
  const stem = q.statement ?? q.stem ?? q.situation ?? ''
  const payload: { stem: string; options?: string[] } = { stem }
  if (q.options !== undefined) payload.options = q.options
  return payload
}

// ---------------------------------------------------------------------------
// Dual-label combiner — Component 4
// ---------------------------------------------------------------------------

export const NOT_REVIEWED_NOTE = 'Chưa được người rành tiếng Đức duyệt.'

export interface ItemLabel {
  objective: 'PASS' | 'FAIL'
  subjective: {
    kind: 'AI-ADVISORY'
    confidence: Confidence
    notReviewedNote: string
  }
  redFlag: boolean
  status: 'advisory-pass (low-assurance)' | 'escalate'
}

/**
 * Component 4 — dual-label combiner. Produces two SEPARATE labels (objective +
 * subjective). `advisory-pass (low-assurance)` is the ONLY self-assignable
 * state and only when objective=PASS ∧ confidence=high ∧ redFlag=false
 * (Req 5.4). It still carries notReviewedNote and is never "approved".
 */
export function combineLabels(t1: Tier1Result, agg: AggregateResult): ItemLabel {
  const objective = t1.objectiveVerdict
  const subjective = {
    kind: 'AI-ADVISORY' as const,
    confidence: agg.confidence,
    notReviewedNote: NOT_REVIEWED_NOTE,
  }
  const advisoryPass = objective === 'PASS' && agg.confidence === 'high' && !agg.redFlag
  const status = advisoryPass ? ('advisory-pass (low-assurance)' as const) : ('escalate' as const)
  return { objective, subjective, redFlag: agg.redFlag, status }
}

/**
 * Escalation rule (Req 5.5): an item escalates iff objective=FAIL ∨ redFlag ∨
 * confidence != 'high'. Equivalent to status !== 'advisory-pass (low-assurance)'.
 */
export function shouldEscalate(label: ItemLabel): boolean {
  return (
    label.objective === 'FAIL' ||
    label.redFlag === true ||
    label.subjective.confidence !== 'high'
  )
}

/** Build the escalation queue from a batch of labelled items (Req 6.2). */
export function buildEscalationQueue<T extends { label: ItemLabel }>(items: T[]): T[] {
  return items.filter((it) => shouldEscalate(it.label))
}
