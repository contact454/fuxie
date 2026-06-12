/**
 * Spec `fuxie-content-review-board` — Task 4.1
 * Tier-2 Agent Review Board: the THREE non-red-team reviewers.
 *
 * Scope of this module (task 4.1 only):
 *   - German_Linguist   (dimension: German)
 *   - CEFR_Pedagogy     (dimensions: pedagogy / CEFR)
 *   - VN_Localization   (dimension: VN)
 *
 * NOT in this module (clean seams left for later tasks):
 *   - redteam_blind / buildRedTeamPayload  -> task 4.2 (already partly in
 *     `review-board-contract.ts`)
 *   - Aggregator / combineLabels / dual-label / cost note -> task 4.3
 *
 * Design references: design.md §"Component 2: Tier-2 Board", the `ReviewerOutput`
 * data model, and Req 2.1–2.6. The `ReviewerId` / `ReviewerOutput` types are
 * REUSED from `review-board-contract.ts` (single source of truth) — never
 * redefined here.
 *
 * Rubric provenance (Req 2.5) — each reviewer's checklist is DERIVED from the
 * personnel persona files + the two content-quality rubric docs. Every
 * checklist line is tagged in-comment with the source that informs it:
 *   [GAL]  .agents/personnel/german-academic-lead.md
 *   [CQA]  .agents/personnel/content-qa-linguistic-reviewer.md
 *   [VNL]  .agents/personnel/vietnamese-german-localization-specialist.md
 *   [GCD]  .agents/personnel/german-curriculum-designer.md
 *   [CEFR] docs/content-quality/cefr-audit-checklist.md
 *   [STYLE] docs/content-quality/bilingual-style-guide.md
 *
 * Provider safety (Req 2.2, 2.6): every reviewer runs in an INDEPENDENT context
 * (its own prompt string, no shared state) and MUST use a model DIFFERENT from
 * the model that generated the content under review. Provider calls go through
 * an injectable `ReviewerRunner`, so this module needs NO real provider credit
 * — a deterministic dry-run / mock runner is provided for tests.
 */
import type { ReviewerId, ReviewerOutput } from './review-board-contract'

// ---------------------------------------------------------------------------
// Versioning + reviewer identity
// ---------------------------------------------------------------------------

/** Versioned prompt family for the 3 board reviewers (Req 2.5). */
export const REVIEWER_PROMPT_VERSION = 'review-board-reviewers-v1'

/** Contract tag the provider response must satisfy (mirrors harness style). */
export const REVIEWER_RESPONSE_CONTRACT = 'review_board_reviewer_output_v1' as const

/** The 3 reviewers owned by task 4.1 (red-team `redteam_blind` is task 4.2). */
export type BoardReviewerId = Extract<
  ReviewerId,
  'german_linguist' | 'cefr_pedagogy' | 'vn_localization'
>

export const BOARD_REVIEWER_IDS: readonly BoardReviewerId[] = [
  'german_linguist',
  'cefr_pedagogy',
  'vn_localization',
] as const

export type ReviewerDimension = ReviewerOutput['dimension']
export type ReviewerVerdict = ReviewerOutput['verdict']
export type ReviewerSeverity = ReviewerOutput['severity']

export const VERDICT_VALUES: readonly ReviewerVerdict[] = ['ok', 'concern', 'fail'] as const
export const SEVERITY_VALUES: readonly ReviewerSeverity[] = ['P0', 'P1', 'P2', 'none'] as const

/**
 * Allowed `dimension` value(s) per reviewer (Req 2.1, 2.3). The three reviewers
 * cover German / pedagogy+CEFR / VN respectively — `answer` is reserved for the
 * red-team reviewer (task 4.2) and is intentionally NOT allowed here.
 */
export const REVIEWER_ALLOWED_DIMENSIONS: Record<BoardReviewerId, readonly ReviewerDimension[]> = {
  german_linguist: ['German'],
  cefr_pedagogy: ['pedagogy', 'CEFR'],
  vn_localization: ['VN'],
}

// ---------------------------------------------------------------------------
// Reading item normalization (reviewer-visible surface)
// ---------------------------------------------------------------------------

/**
 * Normalized reading item handed to a board reviewer. UNLIKE the red-team
 * payload (task 4.2), these three reviewers ARE allowed to see the answer and
 * the explanation — their job is to judge correctness/quality of exactly those.
 */
export interface ReviewBoardItem {
  itemId: string
  level: string
  type?: string
  /** statement ?? stem ?? situation */
  stem: string
  options?: string[]
  answer?: string | number | null
  /** explanation.de */
  de?: string
  /** explanation.vi */
  vi?: string
  /** explanation.key_evidence */
  keyEvidence?: string
}

/** Loose shape of a raw reading question (mirrors reading-explanation-lib). */
export interface RawReadingQuestion {
  id?: string | number
  type?: string
  stem?: string
  statement?: string
  situation?: string
  options?: string[]
  answer?: string | number | null
  correctIndex?: number | null
  solution?: string | number | null
  explanation?: {
    de?: string
    vi?: string
    key_evidence?: string
    [k: string]: unknown
  }
  [k: string]: unknown
}

function answerOf(q: RawReadingQuestion): string | number | null {
  if (q.answer != null) return q.answer
  if (q.correctIndex != null) return q.correctIndex
  if (q.solution != null) return q.solution as string | number
  return null
}

/**
 * Turn a raw reading question into a normalized `ReviewBoardItem`. Pure,
 * read-only over its input (never mutates `q`).
 */
export function normalizeReadingItem(
  q: RawReadingQuestion,
  ctx: { itemId: string; level: string },
): ReviewBoardItem {
  const stem = q.statement ?? q.stem ?? q.situation ?? ''
  const exp = q.explanation ?? {}
  const item: ReviewBoardItem = {
    itemId: ctx.itemId,
    level: ctx.level,
    stem,
  }
  if (q.type !== undefined) item.type = q.type
  if (q.options !== undefined) item.options = q.options
  const ans = answerOf(q)
  if (ans !== null) item.answer = ans
  if (typeof exp.de === 'string') item.de = exp.de
  if (typeof exp.vi === 'string') item.vi = exp.vi
  if (typeof exp.key_evidence === 'string') item.keyEvidence = exp.key_evidence
  return item
}

// ---------------------------------------------------------------------------
// Rubrics (Req 2.5) — derived from personnel + content-quality docs
// ---------------------------------------------------------------------------

export interface ReviewerRubric {
  reviewer: BoardReviewerId
  /** Human label used in the prompt header. */
  title: string
  /** Persona framing distilled from the personnel file(s). */
  persona: string
  /** Allowed `dimension` value(s) the reviewer may emit. */
  allowedDimensions: readonly ReviewerDimension[]
  /** Rubric checklist lines (each tagged with its source doc in comments). */
  checklist: readonly string[]
  /** Plain-language provenance, surfaced in the prompt for traceability. */
  sources: readonly string[]
}

export const REVIEWER_RUBRICS: Record<BoardReviewerId, ReviewerRubric> = {
  // -------------------------------------------------------------------------
  // German linguist — correctness + naturalness of the GERMAN strings.
  // Persona: German Academic Lead + Content QA / Linguistic Reviewer.
  // -------------------------------------------------------------------------
  german_linguist: {
    reviewer: 'german_linguist',
    title: 'German Linguist',
    persona:
      'Senior German-as-a-foreign-language linguist and content QA reviewer. ' +
      'You judge whether the German strings are grammatical, natural, idiomatic, ' +
      'and level-appropriate, and whether the explanation is linguistically sound.',
    allowedDimensions: REVIEWER_ALLOWED_DIMENSIONS.german_linguist,
    checklist: [
      // [STYLE] German must be natural, idiomatic, level-appropriate for the CEFR level.
      'The German (stem, options, explanation.de) is grammatical, natural and idiomatic.',
      // [STYLE] Example sentences must demonstrate the target word/grammar/skill directly.
      'The German explanation directly demonstrates the target point, not generic filler.',
      // [STYLE] A1-A2 short/concrete/high-frequency; B1-B2 connected; C1-C2 teachable not obscure.
      'Sentence complexity and vocabulary match the declared level register.',
      // [STYLE] Distractors must be plausible but fair, no trick wording unless inference is tested.
      'Option distractors are plausible but fair (no unfair trick wording).',
      // [CEFR] Release-blocking: ungrammatical, unnatural, or misleading German sentence.
      'No ungrammatical, unnatural, or misleading German sentence (treat as P0/P1).',
      // [GAL]/[CQA] German is natural and correct; catch semantic (not only surface) errors.
      'Catch semantic German errors, not just surface typos.',
    ],
    sources: [
      'bilingual-style-guide.md §German Content Standard',
      'cefr-audit-checklist.md §Release-Blocking Findings (ungrammatical/unnatural German)',
      'german-academic-lead.md §Quality Checklist (natural & correct German)',
      'content-qa-linguistic-reviewer.md §Core Expertise (German correctness)',
    ],
  },

  // -------------------------------------------------------------------------
  // CEFR / pedagogy — level fit + teachability + evidence support.
  // Persona: German Academic Lead + German Curriculum Designer.
  // -------------------------------------------------------------------------
  cefr_pedagogy: {
    reviewer: 'cefr_pedagogy',
    title: 'CEFR & Pedagogy Reviewer',
    persona:
      'CEFR alignment and pedagogy reviewer (academic lead + curriculum designer). ' +
      'You judge whether the item fits its declared CEFR level, has a clear, ' +
      'teachable learning objective, and whether the answer is supported by text evidence.',
    allowedDimensions: REVIEWER_ALLOWED_DIMENSIONS.cefr_pedagogy,
    checklist: [
      // [CEFR] Level Fit Checks A1-C2 — topic, input length, task complexity match level.
      'Topic, input length and task complexity fit the declared CEFR level.',
      // [CEFR] Skill Check (Reading): question answer is supported by text evidence.
      'The answer is supported by the provided key_evidence / source text.',
      // [CEFR] Release-blocking: CEFR mismatch that shifts learner expectation a full level.
      'No CEFR mismatch that shifts the learner expectation by a full level or more (P0/P1).',
      // [GAL] Task has a clear learning objective; level matches CEFR expectations.
      'The item has a clear, single learning objective appropriate to the level.',
      // [GCD] Objective is specific & teachable; practice load fits the level.
      'The explanation is teachable and the cognitive load fits the level.',
      // [GCD] Sequence moves recognition -> production (no over-leveled inference for low levels).
      'Required inference is appropriate (not over-leveled for A1/A2).',
    ],
    sources: [
      'cefr-audit-checklist.md §Level Fit Checks / §Skill Checks / §Release-Blocking Findings',
      'german-academic-lead.md §Quality Checklist (level & objective)',
      'german-curriculum-designer.md §Quality Checklist (teachable, recognition->production)',
    ],
  },

  // -------------------------------------------------------------------------
  // VN localization — Vietnamese explanation quality + bilingual fidelity.
  // Persona: Vietnamese-German Localization Specialist + Content QA.
  // -------------------------------------------------------------------------
  vn_localization: {
    reviewer: 'vn_localization',
    title: 'Vietnamese Localization Reviewer',
    persona:
      'Vietnamese-German localization specialist. You judge whether the ' +
      'Vietnamese explanation (explanation.vi) is natural, accurate, preserves the ' +
      'German meaning, and helps Vietnamese learners without replacing German practice.',
    allowedDimensions: REVIEWER_ALLOWED_DIMENSIONS.vn_localization,
    checklist: [
      // [STYLE] VI explanations clarify the learning target, not replace German practice.
      'The Vietnamese explanation clarifies the learning target without replacing German practice.',
      // [STYLE] VI preserves meaning and register, not word-for-word when unnatural.
      'The Vietnamese preserves the German meaning and register (not awkward word-for-word).',
      // [STYLE] Mojibake / replacement chars are a release blocker.
      'No mojibake, replacement characters, or encoding damage in the Vietnamese (P0 if present).',
      // [STYLE] Use VI to explain why the answer is correct + the learner mistake pattern.
      'The Vietnamese explains WHY the answer is correct and the common learner mistake.',
      // [VNL] Vietnamese natural & concise; no false friends / misleading shortcuts.
      'The Vietnamese is natural and concise, with no false friends or misleading shortcuts.',
    ],
    sources: [
      'bilingual-style-guide.md §Vietnamese Support Standard',
      'vietnamese-german-localization-specialist.md §Quality Checklist (natural VI, meaning preserved)',
      'content-qa-linguistic-reviewer.md §Core Expertise (Vietnamese explanation with wrong meaning)',
    ],
  },
}

// ---------------------------------------------------------------------------
// Model-must-differ guard (Req 2.2)
// ---------------------------------------------------------------------------

/**
 * Configuration that pins the reviewer model and the content-generating model.
 * The reviewer model MUST differ from the content model so the board provides
 * an independent second opinion (Req 2.2).
 */
export interface ReviewerModelConfig {
  /** Model id each reviewer will run on (provider-runner configurable). */
  reviewerModel: string
  /** Model id that GENERATED the content under review (for the differ guard). */
  contentModel: string
}

export function reviewerModelDiffers(reviewerModel: string, contentModel: string): boolean {
  return normalizeModelId(reviewerModel) !== normalizeModelId(contentModel)
}

/** Throws if the reviewer model is the same as the content-generating model. */
export function assertReviewerModelDiffers(cfg: ReviewerModelConfig): void {
  if (!cfg.reviewerModel || !cfg.contentModel) {
    throw new Error(
      '[review-board] both reviewerModel and contentModel must be set to enforce the model-must-differ constraint (Req 2.2)',
    )
  }
  if (!reviewerModelDiffers(cfg.reviewerModel, cfg.contentModel)) {
    throw new Error(
      `[review-board] reviewer model "${cfg.reviewerModel}" must DIFFER from the content-generating model "${cfg.contentModel}" (Req 2.2)`,
    )
  }
}

function normalizeModelId(id: string): string {
  return id.trim().toLowerCase()
}

// ---------------------------------------------------------------------------
// Prompt building (Req 2.1, 2.5) — independent context per reviewer
// ---------------------------------------------------------------------------

export interface ReviewerPrompt {
  reviewer: BoardReviewerId
  dimensionScope: readonly ReviewerDimension[]
  promptVersion: string
  responseContract: typeof REVIEWER_RESPONSE_CONTRACT
  /** Model the reviewer will run on (already validated to differ, if configured). */
  model?: string
  prompt: string
}

export interface BuildReviewerPromptOptions {
  /** When provided, enforces the model-must-differ constraint (Req 2.2). */
  model?: ReviewerModelConfig
}

/**
 * Build a single reviewer's prompt for one item. Each call is a SELF-CONTAINED
 * context: the returned prompt embeds the persona, the rubric checklist, the
 * item fields, and a strict output contract — no shared state between reviewers
 * (Req 2.1, 2.6).
 */
export function buildReviewerPrompt(
  reviewer: BoardReviewerId,
  item: ReviewBoardItem,
  opts: BuildReviewerPromptOptions = {},
): ReviewerPrompt {
  const rubric = REVIEWER_RUBRICS[reviewer]
  if (opts.model) assertReviewerModelDiffers(opts.model)

  const checklist = rubric.checklist.map((line, i) => `  ${i + 1}. ${line}`).join('\n')
  const sources = rubric.sources.map((s) => `  - ${s}`).join('\n')
  const allowedDims = rubric.allowedDimensions.map((d) => `"${d}"`).join(' | ')

  const prompt = [
    `# Fuxie Content Review Board — ${rubric.title}`,
    `# prompt_version: ${REVIEWER_PROMPT_VERSION}`,
    '',
    `You are: ${rubric.persona}`,
    '',
    'You are reviewing ONE German reading item written for Vietnamese learners.',
    'Review independently. Do not assume any other reviewer has seen this item.',
    'You MAY see the answer and explanation — judging their correctness is your job.',
    '',
    '## Rubric (apply every line):',
    checklist,
    '',
    '## Rubric sources:',
    sources,
    '',
    '## Item under review:',
    renderItem(item),
    '',
    '## Output contract (STRICT):',
    `Return ONE JSON object, nothing else. Schema (${REVIEWER_RESPONSE_CONTRACT}):`,
    '{',
    `  "reviewer": "${reviewer}",`,
    `  "dimension": ${allowedDims},`,
    '  "verdict": "ok" | "concern" | "fail",',
    '  "severity": "P0" | "P1" | "P2" | "none",',
    '  "rationale": "<concise reason, references the rubric line you applied>",',
    '  "evidence": "<cite the exact field/snippet, e.g. explanation.de: \\"...\\">"',
    '}',
    'Rules: severity MUST be "none" when verdict is "ok"; use "P0" only for ' +
      'learner-facing release blockers. "evidence" MUST quote a concrete field; ' +
      'do not return free text outside the JSON object.',
  ].join('\n')

  const out: ReviewerPrompt = {
    reviewer,
    dimensionScope: rubric.allowedDimensions,
    promptVersion: REVIEWER_PROMPT_VERSION,
    responseContract: REVIEWER_RESPONSE_CONTRACT,
    prompt,
  }
  if (opts.model) out.model = opts.model.reviewerModel
  return out
}

function renderItem(item: ReviewBoardItem): string {
  const lines: string[] = [
    `- itemId: ${item.itemId}`,
    `- level: ${item.level}`,
  ]
  if (item.type) lines.push(`- type: ${item.type}`)
  lines.push(`- stem/statement: ${stringifyField(item.stem)}`)
  if (item.options) lines.push(`- options: ${JSON.stringify(item.options)}`)
  if (item.answer !== undefined) lines.push(`- answer: ${JSON.stringify(item.answer)}`)
  if (item.keyEvidence !== undefined) lines.push(`- explanation.key_evidence: ${stringifyField(item.keyEvidence)}`)
  if (item.de !== undefined) lines.push(`- explanation.de: ${stringifyField(item.de)}`)
  if (item.vi !== undefined) lines.push(`- explanation.vi: ${stringifyField(item.vi)}`)
  return lines.join('\n')
}

function stringifyField(value: string): string {
  return JSON.stringify(value ?? '')
}

/** Build the full board (3 reviewers) for one item, each its own context. */
export function buildBoardPrompts(
  item: ReviewBoardItem,
  opts: BuildReviewerPromptOptions = {},
): ReviewerPrompt[] {
  return BOARD_REVIEWER_IDS.map((reviewer) => buildReviewerPrompt(reviewer, item, opts))
}

// ---------------------------------------------------------------------------
// Structured output validation (Req 2.4)
// ---------------------------------------------------------------------------

export interface ValidationResult {
  ok: boolean
  errors: string[]
}

/**
 * Validate a candidate object against the `ReviewerOutput` schema (Req 2.4).
 * Rejects free-text-only / missing / mistyped fields, out-of-set enums, and —
 * when `expectedReviewer` is given — a dimension outside that reviewer's
 * allowed set or a mismatched reviewer id.
 */
export function validateReviewerOutput(
  obj: unknown,
  opts: { expectedReviewer?: BoardReviewerId } = {},
): ValidationResult {
  const errors: string[] = []

  if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) {
    return { ok: false, errors: ['output must be a JSON object'] }
  }
  const o = obj as Record<string, unknown>

  // reviewer
  if (!isBoardReviewerId(o.reviewer)) {
    errors.push(`reviewer must be one of ${BOARD_REVIEWER_IDS.join(' | ')}`)
  } else if (opts.expectedReviewer && o.reviewer !== opts.expectedReviewer) {
    errors.push(`reviewer must be "${opts.expectedReviewer}", got "${String(o.reviewer)}"`)
  }

  // dimension
  if (!isReviewerDimension(o.dimension)) {
    errors.push('dimension must be one of "German" | "pedagogy" | "CEFR" | "VN" | "answer"')
  } else {
    const reviewerForDims = opts.expectedReviewer ?? (isBoardReviewerId(o.reviewer) ? o.reviewer : undefined)
    if (reviewerForDims) {
      const allowed = REVIEWER_ALLOWED_DIMENSIONS[reviewerForDims]
      if (!allowed.includes(o.dimension)) {
        errors.push(
          `dimension "${o.dimension}" not allowed for ${reviewerForDims} (allowed: ${allowed.join(', ')})`,
        )
      }
    }
  }

  // verdict
  if (!isVerdict(o.verdict)) {
    errors.push('verdict must be one of "ok" | "concern" | "fail"')
  }

  // severity
  if (!isSeverity(o.severity)) {
    errors.push('severity must be one of "P0" | "P1" | "P2" | "none"')
  }

  // verdict/severity coherence: ok <=> none
  if (isVerdict(o.verdict) && isSeverity(o.severity)) {
    if (o.verdict === 'ok' && o.severity !== 'none') {
      errors.push('severity must be "none" when verdict is "ok"')
    }
    if (o.verdict !== 'ok' && o.severity === 'none') {
      errors.push('severity must not be "none" when verdict is "concern" or "fail"')
    }
  }

  // rationale + evidence: non-empty strings (reject free-text-only / missing)
  if (!isNonEmptyString(o.rationale)) {
    errors.push('rationale must be a non-empty string')
  }
  if (!isNonEmptyString(o.evidence)) {
    errors.push('evidence must be a non-empty string')
  }

  return { ok: errors.length === 0, errors }
}

function isBoardReviewerId(v: unknown): v is BoardReviewerId {
  return typeof v === 'string' && (BOARD_REVIEWER_IDS as readonly string[]).includes(v)
}
function isReviewerDimension(v: unknown): v is ReviewerDimension {
  return v === 'German' || v === 'pedagogy' || v === 'CEFR' || v === 'VN' || v === 'answer'
}
function isVerdict(v: unknown): v is ReviewerVerdict {
  return typeof v === 'string' && (VERDICT_VALUES as readonly string[]).includes(v)
}
function isSeverity(v: unknown): v is ReviewerSeverity {
  return typeof v === 'string' && (SEVERITY_VALUES as readonly string[]).includes(v)
}
function isNonEmptyString(v: unknown): v is string {
  return typeof v === 'string' && v.trim().length > 0
}

// ---------------------------------------------------------------------------
// Harness integration seam (Req 2.6) — injectable runner, no real credit here
// ---------------------------------------------------------------------------

/** A single review unit of work: one reviewer reviewing one item. */
export interface ReviewerCase {
  caseId: string
  itemId: string
  reviewer: BoardReviewerId
  prompt: ReviewerPrompt
}

/** Build the per-item review cases (one per board reviewer). */
export function buildReviewBoardCases(
  item: ReviewBoardItem,
  opts: BuildReviewerPromptOptions = {},
): ReviewerCase[] {
  return BOARD_REVIEWER_IDS.map((reviewer) => ({
    caseId: `${item.itemId}::${reviewer}`,
    itemId: item.itemId,
    reviewer,
    prompt: buildReviewerPrompt(reviewer, item, opts),
  }))
}

/**
 * Injectable provider seam. The real implementation (task 4.3 / 6.1) will route
 * this through `ai-eval-provider-runner` against a model that differs from the
 * content model. Keeping it injectable means this task spends NO provider
 * credit and is fully testable with the deterministic mock below.
 */
export type ReviewerRunner = (request: ReviewerCase) => Promise<unknown>

export interface RunReviewerResult {
  caseId: string
  itemId: string
  reviewer: BoardReviewerId
  output: ReviewerOutput | null
  validation: ValidationResult
}

/** Run all board reviewers for one item through an injected runner + validate. */
export async function runReviewBoardItem(
  item: ReviewBoardItem,
  runner: ReviewerRunner,
  opts: BuildReviewerPromptOptions = {},
): Promise<RunReviewerResult[]> {
  const cases = buildReviewBoardCases(item, opts)
  const results: RunReviewerResult[] = []
  for (const c of cases) {
    const raw = await runner(c)
    const validation = validateReviewerOutput(raw, { expectedReviewer: c.reviewer })
    results.push({
      caseId: c.caseId,
      itemId: c.itemId,
      reviewer: c.reviewer,
      output: validation.ok ? (raw as ReviewerOutput) : null,
      validation,
    })
  }
  return results
}

/**
 * Deterministic dry-run / mock runner (Req 2.6, cost-aware). Produces a valid
 * `ReviewerOutput` per reviewer WITHOUT calling any provider. Verdict is
 * derived deterministically from the item so tests are stable.
 */
export function createMockReviewerRunner(): ReviewerRunner {
  return async (request) => buildMockReviewerOutput(request.reviewer)
}

/** Build a single deterministic mock output for a reviewer (no provider call). */
export function buildMockReviewerOutput(reviewer: BoardReviewerId): ReviewerOutput {
  const dimension = REVIEWER_ALLOWED_DIMENSIONS[reviewer][0] as ReviewerDimension
  return {
    reviewer,
    dimension,
    verdict: 'ok',
    severity: 'none',
    rationale: `[dry-run] ${REVIEWER_RUBRICS[reviewer].title} mock review — no provider called.`,
    evidence: 'dry-run: no item field inspected',
  }
}
