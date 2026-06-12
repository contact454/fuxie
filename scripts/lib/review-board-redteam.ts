/**
 * Spec `fuxie-content-review-board` — Task 4.2
 * Tier-2 Agent Review Board: the RED-TEAM (blind) reviewer.
 *
 * The red-team reviewer is the "objective-ising" signal of the board
 * (design.md §"Decision 2", Req 3.1–3.5): it is asked to SOLVE the question
 * itself WITHOUT ever seeing the stored answer / explanation. If its
 * self-solved prediction disagrees with the stored answer, that disagreement is
 * a strong, near-objective signal that the item may "teach the wrong answer"
 * (P0) — detectable without a German-speaking human in the loop.
 *
 * Single source of truth (REUSE — never redefined here):
 *   - `buildRedTeamPayload`     -> selects ONLY { stem, options } (no leak)
 *   - `FORBIDDEN_REDTEAM_KEYS`  -> the answer-bearing keys that must NOT leak
 *   - `ReadingQuestion`, `Confidence` types
 * all imported from `review-board-contract.ts`.
 *
 * Provider safety (mirrors task 4.1): the red-team reviewer runs in its OWN
 * independent context, on a model that DIFFERS from the content-generating
 * model (reusing the 4.1 model-differ guard), and all provider work goes
 * through an injectable `RedTeamRunner`. This module therefore spends NO real
 * provider credit and is fully testable with the deterministic mock below.
 *
 * Property 2 (Red-team Answer Isolation): the payload AND the rendered prompt
 * string built here must never contain an answer-bearing key NOR the stored
 * answer value. The unit suite asserts both surfaces.
 */
import {
  type Confidence,
  type ReadingQuestion,
  FORBIDDEN_REDTEAM_KEYS,
  buildRedTeamPayload,
} from './review-board-contract'
import {
  type ReviewerModelConfig,
  assertReviewerModelDiffers,
} from './review-board-reviewers'

// ---------------------------------------------------------------------------
// Identity + versioning (mirrors the 4.1 reviewer module style)
// ---------------------------------------------------------------------------

export const REDTEAM_REVIEWER_ID = 'redteam_blind' as const
export const REDTEAM_DIMENSION = 'answer' as const

/** Versioned prompt family for the red-team reviewer (Req 3.1). */
export const REDTEAM_PROMPT_VERSION = 'review-board-redteam-v1'

/** Contract tag the provider response must satisfy (mirrors harness style). */
export const REDTEAM_RESPONSE_CONTRACT = 'review_board_redteam_output_v1' as const

/**
 * Structured red-team output (design.md `RedTeamOutput`). The model returns the
 * answer it self-solved, plus its own confidence and a rationale. `reviewer` is
 * fixed; it is optional on input (the validator fills/repairs it) but always
 * present on a validated `RedTeamOutput`.
 */
export interface RedTeamOutput {
  reviewer: typeof REDTEAM_REVIEWER_ID
  predictedAnswer: string
  confidence: Confidence
  rationale: string
}

const CONFIDENCE_VALUES: readonly Confidence[] = ['high', 'medium', 'low'] as const

// ---------------------------------------------------------------------------
// Blind prompt builder (Req 3.1, 3.2, 3.5)
// ---------------------------------------------------------------------------

export interface RedTeamPrompt {
  reviewer: typeof REDTEAM_REVIEWER_ID
  dimension: typeof REDTEAM_DIMENSION
  promptVersion: string
  responseContract: typeof REDTEAM_RESPONSE_CONTRACT
  /** Model the reviewer runs on (validated to differ, if configured). */
  model?: string
  /** The blind payload this prompt was built from (audit surface). */
  payload: { stem: string; options?: string[] }
  prompt: string
}

export interface BuildRedTeamPromptOptions {
  /** When provided, enforces the model-must-differ constraint (Req 2.2). */
  model?: ReviewerModelConfig
}

/**
 * Build the red-team prompt for one reading question.
 *
 * CRITICAL (Property 2 / Req 3.5): the prompt is constructed ONLY from
 * `buildRedTeamPayload(q)` — i.e. the stem + options. It never references the
 * stored answer, correctIndex, solution, explanation, or key_evidence. The
 * model is instructed to solve the question itself and return strict JSON.
 */
export function buildRedTeamPrompt(
  q: ReadingQuestion,
  opts: BuildRedTeamPromptOptions = {},
): RedTeamPrompt {
  if (opts.model) assertReviewerModelDiffers(opts.model)

  // The ONLY data crossing into the prompt context. Building from this payload
  // (not from `q`) is what guarantees no answer-bearing field can leak.
  const payload = buildRedTeamPayload(q)

  const optionLines =
    payload.options && payload.options.length > 0
      ? payload.options
          .map((opt, i) => `  ${String.fromCharCode(65 + i)}. ${stringifyField(opt)}`)
          .join('\n')
      : '  (no options provided — answer in your own words)'

  const prompt = [
    `# Fuxie Content Review Board — Red-Team (blind answer check)`,
    `# prompt_version: ${REDTEAM_PROMPT_VERSION}`,
    '',
    'You are an independent German reading examinee. You are given ONLY the',
    'question stem and answer options. You do NOT have the answer key, the',
    'explanation, or any hint. Solve the question yourself, honestly, as a',
    'careful test-taker would.',
    '',
    '## Question stem:',
    stringifyField(payload.stem),
    '',
    '## Options:',
    optionLines,
    '',
    '## Output contract (STRICT):',
    `Return ONE JSON object, nothing else. Schema (${REDTEAM_RESPONSE_CONTRACT}):`,
    '{',
    `  "predictedAnswer": "<the answer you chose: the option letter, the option `,
    `text, or — if there are no options — your own short answer>",`,
    '  "confidence": "high" | "medium" | "low",',
    '  "rationale": "<one or two sentences: why you chose this answer>"',
    '}',
    'Rules: choose exactly ONE answer. Do not invent an answer key; report only',
    'what YOU concluded from the stem and options. Do not return any text',
    'outside the JSON object.',
  ].join('\n')

  const out: RedTeamPrompt = {
    reviewer: REDTEAM_REVIEWER_ID,
    dimension: REDTEAM_DIMENSION,
    promptVersion: REDTEAM_PROMPT_VERSION,
    responseContract: REDTEAM_RESPONSE_CONTRACT,
    payload,
    prompt,
  }
  if (opts.model) out.model = opts.model.reviewerModel
  return out
}

function stringifyField(value: string): string {
  return JSON.stringify(value ?? '')
}

/**
 * Defense-in-depth assertion (Property 2): a built red-team prompt must NOT
 * contain any forbidden answer-bearing key, and — when a stored answer value is
 * known — must NOT contain that value verbatim. Returns the list of leaks found
 * (empty = clean). Pure; callers decide whether to throw.
 */
export function findRedTeamLeaks(
  prompt: RedTeamPrompt,
  storedAnswerValue?: unknown,
): string[] {
  const leaks: string[] = []
  const haystack = `${prompt.prompt}\n${JSON.stringify(prompt.payload)}`
  for (const key of FORBIDDEN_REDTEAM_KEYS) {
    // The prompt legitimately never serialises these object keys.
    if (haystack.includes(`"${key}"`)) leaks.push(`forbidden-key:${key}`)
  }
  if (storedAnswerValue != null) {
    const v = String(storedAnswerValue).trim()
    // Skip trivial values that could coincide with normal prose / option text.
    if (v.length >= 3 && JSON.stringify(prompt.payload).includes(v)) {
      // Only flag if the stored answer value appears in the PAYLOAD surface;
      // option text legitimately appears in the prompt, but the payload is
      // stem+options only, so a stored-answer string there is the leak signal.
      // (We intentionally check the payload, not the rendered options block.)
      leaks.push('stored-answer-value-in-payload')
    }
  }
  return leaks
}

// ---------------------------------------------------------------------------
// Output validation (Req 3.2) — { predictedAnswer, confidence, rationale }
// ---------------------------------------------------------------------------

export interface RedTeamValidationResult {
  ok: boolean
  errors: string[]
}

/**
 * Validate a candidate red-team output. Enforces:
 *   - predictedAnswer : non-empty string
 *   - confidence      : "high" | "medium" | "low"
 *   - rationale       : non-empty string
 * If `reviewer` is present it must equal `redteam_blind`. Rejects free-text /
 * missing / mistyped fields and out-of-set confidence.
 */
export function validateRedTeamOutput(obj: unknown): RedTeamValidationResult {
  const errors: string[] = []

  if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) {
    return { ok: false, errors: ['output must be a JSON object'] }
  }
  const o = obj as Record<string, unknown>

  if ('reviewer' in o && o.reviewer !== REDTEAM_REVIEWER_ID) {
    errors.push(`reviewer must be "${REDTEAM_REVIEWER_ID}" when present`)
  }
  if (!isNonEmptyString(o.predictedAnswer)) {
    errors.push('predictedAnswer must be a non-empty string')
  }
  if (!isConfidence(o.confidence)) {
    errors.push('confidence must be one of "high" | "medium" | "low"')
  }
  if (!isNonEmptyString(o.rationale)) {
    errors.push('rationale must be a non-empty string')
  }

  return { ok: errors.length === 0, errors }
}

function isConfidence(v: unknown): v is Confidence {
  return typeof v === 'string' && (CONFIDENCE_VALUES as readonly string[]).includes(v)
}
function isNonEmptyString(v: unknown): v is string {
  return typeof v === 'string' && v.trim().length > 0
}

// ---------------------------------------------------------------------------
// redFlag comparison (Req 3.3) — predictedAnswer vs stored answer
// ---------------------------------------------------------------------------

/**
 * Normalize a free-text token for comparison: lowercased, trimmed, internal
 * whitespace collapsed, and surrounding quotes / punctuation stripped. Umlauts
 * and inner letters are preserved (so "Häuser" stays distinct from "Hauser").
 */
function normalizeText(value: string): string {
  return value
    .normalize('NFC')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/^[\s"'`*.,;:!?()[\]{}-]+/, '')
    .replace(/[\s"'`*.,;:!?()[\]{}-]+$/, '')
    .trim()
}

/**
 * Map truthy/falsy German + English synonyms to a single canonical token so
 * that, e.g., a "Richtig/Falsch" question and a "Ja/Nein" question compare
 * consistently (richtig ≈ ja ≈ true ≈ yes; falsch ≈ nein ≈ false ≈ no).
 * Multi-letter words only — single letters are left alone so they can still be
 * resolved as multiple-choice option letters (A/B/C…).
 */
const TRUTHY = new Set(['richtig', 'wahr', 'true', 'yes', 'ja', 'correct', 'right'])
const FALSY = new Set(['falsch', 'unwahr', 'false', 'no', 'nein', 'incorrect', 'wrong'])

function canonToken(text: string): string {
  const n = normalizeText(text)
  if (TRUTHY.has(n)) return '__TRUE__'
  if (FALSY.has(n)) return '__FALSE__'
  return n
}

/**
 * Resolve a raw answer value to its underlying option text when possible:
 *   - a numeric index (number or "2") within range -> options[index]
 *   - a single A–Z letter within range            -> options[letter-'A']
 * Otherwise the raw stringified value is returned untouched.
 */
function resolveToOptionText(value: string | number, options?: string[]): string {
  const s = String(value).trim()
  if (options && options.length > 0) {
    if (/^\d+$/.test(s)) {
      const idx = Number(s)
      if (idx >= 0 && idx < options.length) return options[idx]
    }
    if (/^[a-zA-Z]$/.test(s)) {
      const idx = s.toUpperCase().charCodeAt(0) - 65
      if (idx >= 0 && idx < options.length) return options[idx]
    }
  }
  return s
}

/**
 * Canonical comparison form for an answer value: resolve index/letter to the
 * option text first, then canonicalise truthy/falsy synonyms. Returns `null`
 * for an empty / unparseable value.
 */
function canonicalAnswer(
  value: string | number | null | undefined,
  options?: string[],
): string | null {
  if (value == null) return null
  const s = typeof value === 'number' ? String(value) : value
  if (s.trim() === '') return null
  return canonToken(resolveToOptionText(value, options))
}

/**
 * Compute the red-team `redFlag` (Req 3.3): `true` when the model's self-solved
 * `predictedAnswer` DISAGREES with the stored answer.
 *
 * Normalization rules (documented):
 *   1. Index / letter answers are resolved against `options` to option text so
 *      a stored `correctIndex` and a predicted letter/text compare like-for-like.
 *   2. richtig/falsch and ja/nein (+ EN synonyms) collapse to a shared truthy /
 *      falsy token so a true-false answer and a yes-no answer agree sensibly.
 *   3. Remaining strings compare on a normalized form (case/whitespace/quote
 *      and surrounding punctuation insensitive).
 *
 * Conservative ambiguity handling: if EITHER side is empty or unparseable
 * (canonical form is `null`), we return `true` (redFlag). An unparseable
 * self-solve — or a missing stored answer — is itself a signal worth escalating
 * rather than silently passing.
 */
export function computeRedFlag(
  predictedAnswer: string | number | null | undefined,
  storedAnswer: string | number | null | undefined,
  options?: string[],
): boolean {
  const predicted = canonicalAnswer(predictedAnswer, options)
  const stored = canonicalAnswer(storedAnswer, options)
  if (predicted === null || stored === null) return true // ambiguous -> escalate
  return predicted !== stored
}

/**
 * Resolve the stored answer of a reading question for comparison purposes:
 * prefer `answer`, then `correctIndex`, then `solution`. Read-only over `q`.
 */
export function resolveStoredAnswer(q: ReadingQuestion): string | number | null {
  if (q.answer != null && (typeof q.answer === 'string' || typeof q.answer === 'number')) {
    return q.answer
  }
  if (
    q.correctIndex != null &&
    (typeof q.correctIndex === 'string' || typeof q.correctIndex === 'number')
  ) {
    return q.correctIndex
  }
  if (q.solution != null && (typeof q.solution === 'string' || typeof q.solution === 'number')) {
    return q.solution
  }
  return null
}

// ---------------------------------------------------------------------------
// Injectable runner (mirrors 4.1) — no real provider credit here
// ---------------------------------------------------------------------------

/** A single red-team unit of work: solving one item blind. */
export interface RedTeamCase {
  caseId: string
  itemId: string
  prompt: RedTeamPrompt
}

/**
 * Injectable provider seam. The real implementation (task 4.3 / 6.1) routes
 * this through `ai-eval-provider-runner` against a model that differs from the
 * content model. Keeping it injectable means this task spends NO provider
 * credit and is fully testable with the deterministic mock below.
 */
export type RedTeamRunner = (request: RedTeamCase) => Promise<unknown>

export interface RunRedTeamResult {
  caseId: string
  itemId: string
  output: RedTeamOutput | null
  validation: RedTeamValidationResult
  /** Disagreement with the stored answer (Req 3.3). */
  redFlag: boolean
}

/** Build the single red-team case for one item. */
export function buildRedTeamCase(
  itemId: string,
  q: ReadingQuestion,
  opts: BuildRedTeamPromptOptions = {},
): RedTeamCase {
  return {
    caseId: `${itemId}::${REDTEAM_REVIEWER_ID}`,
    itemId,
    prompt: buildRedTeamPrompt(q, opts),
  }
}

/**
 * Run the red-team reviewer for one item through an injected runner, validate
 * the structured output, and compute the redFlag against the stored answer.
 *
 * Conservative handling (Req 3.3): if the output fails validation (an
 * unparseable self-solve), `output` is `null` and `redFlag` is `true` — the
 * item escalates rather than silently passing.
 */
export async function runRedTeamItem(
  itemId: string,
  q: ReadingQuestion,
  runner: RedTeamRunner,
  opts: BuildRedTeamPromptOptions = {},
): Promise<RunRedTeamResult> {
  const c = buildRedTeamCase(itemId, q, opts)
  const raw = await runner(c)
  const validation = validateRedTeamOutput(raw)
  if (!validation.ok) {
    return { caseId: c.caseId, itemId, output: null, validation, redFlag: true }
  }
  const candidate = raw as RedTeamOutput
  const output: RedTeamOutput = {
    reviewer: REDTEAM_REVIEWER_ID,
    predictedAnswer: candidate.predictedAnswer,
    confidence: candidate.confidence,
    rationale: candidate.rationale,
  }
  const redFlag = computeRedFlag(output.predictedAnswer, resolveStoredAnswer(q), q.options)
  return { caseId: c.caseId, itemId, output, validation, redFlag }
}

/**
 * Deterministic mock red-team runner (cost-aware, no provider call). It "solves"
 * the question blind from the payload only — by default it picks the FIRST
 * option (or echoes the stem when there are no options). A custom `predict`
 * function may be injected for tests that need a specific predicted answer.
 */
export function createMockRedTeamRunner(
  predict?: (payload: { stem: string; options?: string[] }) => string,
): RedTeamRunner {
  return async (request) => {
    const { payload } = request.prompt
    const predictedAnswer =
      predict?.(payload) ??
      (payload.options && payload.options.length > 0
        ? payload.options[0]
        : payload.stem || 'unknown')
    const out: RedTeamOutput = {
      reviewer: REDTEAM_REVIEWER_ID,
      predictedAnswer,
      confidence: 'high',
      rationale: '[mock] blind self-solve from stem/options only — no provider called.',
    }
    return out
  }
}
