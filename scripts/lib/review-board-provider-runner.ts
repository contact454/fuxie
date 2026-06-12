/**
 * Spec `fuxie-content-review-board` — follow-up: REAL Tier-2 provider runner.
 *
 * Vai chinh: AI / LLM Engineer
 * Vai phoi hop: QA Automation Engineer, German Academic Lead, DevOps
 *
 * Provides live, FREE-tier provider-backed `ReviewerRunner` + `RedTeamRunner`
 * for the review board. They route the prompts built by tasks 4.1/4.2 through
 * the existing OpenRouter client (`getModel`) and parse the JSON response with
 * the shared `parseGeminiJson`. The structured output is validated by the
 * CALLER (`runReviewBoardItem` / `runRedTeamItem`); this module only produces
 * a parsed object — on any failure it returns a deliberately INVALID object so
 * the caller's validator fails and the item escalates conservatively (never a
 * fabricated pass).
 *
 * Cost: defaults to `:free` OpenRouter models only (≈ $0). The reviewer/red-team
 * models are DISTINCT from the declared content-generation model (Req 2.2 —
 * independent second opinion).
 *
 * Rate-limit safety: bounded by the caller's sequential loop; here each call
 * retries with exponential backoff on 429 / "Too many requests" / 5xx.
 */
import { getModel } from '../../apps/ai-service/src/lib/gemini.ts'
import { parseGeminiJson } from '../../apps/ai-service/src/lib/parse-json.ts'
import type { ReviewerCase, ReviewerRunner } from './review-board-reviewers'
import type { RedTeamCase, RedTeamRunner } from './review-board-redteam'

// Free-tier OpenRouter models (mirror gemini.ts getModelForLevel).
export const DEFAULT_REVIEWER_MODEL = 'google/gemma-4-31b-it:free'
export const DEFAULT_REDTEAM_MODEL = 'meta-llama/llama-3.3-70b-instruct:free'
/**
 * Label for the model/agent that GENERATED the reading content under review.
 * The regenerated explanations (PR #21) were produced by the Kiro content
 * pipeline, NOT by these free OpenRouter models — so any free model differs
 * (Req 2.2). Kept as a string label for the differ note, not a live model id.
 */
export const DEFAULT_CONTENT_MODEL = 'kiro-content-pipeline'

/** Injectable raw text generator (model id, prompt) -> response text. */
export type GenerateText = (model: string, prompt: string) => Promise<string>

/** Default generator: OpenRouter via the shared getModel wrapper. */
export const defaultGenerateText: GenerateText = async (model, prompt) => {
  const result = await getModel(model).generateContent(prompt)
  return result.response.text()
}

export interface ProviderRunnerStats {
  reviewerCalls: number
  redTeamCalls: number
  /** raw provider attempts including retries. */
  providerAttempts: number
  retries: number
  reviewerFailures: number
  redTeamFailures: number
}

export function newProviderRunnerStats(): ProviderRunnerStats {
  return {
    reviewerCalls: 0,
    redTeamCalls: 0,
    providerAttempts: 0,
    retries: 0,
    reviewerFailures: 0,
    redTeamFailures: 0,
  }
}

export interface ProviderRunnerOptions {
  reviewerModel?: string
  redTeamModel?: string
  /** Injectable generator (tests pass a fake; default = OpenRouter). */
  generate?: GenerateText
  /** Max RETRIES after the first attempt (default 3). */
  maxRetries?: number
  /** Base backoff in ms (default 2000 → 2s, 4s, 8s). */
  baseDelayMs?: number
  /** Fixed throttle (ms) applied BEFORE every provider call to respect
   * free-tier per-minute limits (default 0 = no throttle). */
  throttleMs?: number
  /** Shared stats accumulator (reused across reviewer + red-team runners). */
  stats?: ProviderRunnerStats
  /** Sleep impl (tests inject a no-op to avoid real delays). */
  sleep?: (ms: number) => Promise<void>
}

/**
 * Errors that are clearly the CALLER's fault (bad request / auth / unknown
 * model) — never worth retrying. Everything else (rate limits, 5xx, transient
 * provider/network errors, and the many non-standard free-tier error strings
 * OpenRouter returns) is treated as RETRYABLE: free-tier rate-limit messages
 * are inconsistent, so we default to retry-with-backoff rather than failing on
 * an unrecognized string.
 */
const NON_RETRYABLE = /\b(400|401|403|404|invalid.?api.?key|unauthorized|forbidden|not\s*found|no\s+endpoints|invalid\s+model)\b/i

function isRetryable(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err)
  return !NON_RETRYABLE.test(msg)
}

const defaultSleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))

/**
 * Call the generator with exponential backoff on retryable errors. Throws the
 * last error if all attempts fail. Increments `stats.providerAttempts` per
 * attempt and `stats.retries` per retry.
 */
export async function callWithRetry(
  generate: GenerateText,
  model: string,
  prompt: string,
  opts: ProviderRunnerOptions,
): Promise<string> {
  const maxRetries = opts.maxRetries ?? 3
  const baseDelay = opts.baseDelayMs ?? 2000
  const sleep = opts.sleep ?? defaultSleep
  const stats = opts.stats
  let lastErr: unknown
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    if (opts.throttleMs && opts.throttleMs > 0) await sleep(opts.throttleMs)
    if (stats) stats.providerAttempts++
    try {
      return await generate(model, prompt)
    } catch (err) {
      lastErr = err
      if (attempt === maxRetries || !isRetryable(err)) break
      if (stats) stats.retries++
      await sleep(baseDelay * 2 ** attempt)
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error(String(lastErr))
}

/** A sentinel object that ALWAYS fails the reviewer/red-team validators. */
function providerFailureObject(reason: string): Record<string, unknown> {
  return { __provider_error__: reason }
}

/**
 * REAL reviewer runner. Sends `case.prompt.prompt` to the reviewer model and
 * returns the parsed JSON object (validated by the caller). On parse/transport
 * failure returns an invalid object → caller validation fails → item escalates.
 */
export function createProviderReviewerRunner(opts: ProviderRunnerOptions = {}): ReviewerRunner {
  const generate = opts.generate ?? defaultGenerateText
  const model = opts.reviewerModel ?? DEFAULT_REVIEWER_MODEL
  const stats = opts.stats
  return async (request: ReviewerCase) => {
    if (stats) stats.reviewerCalls++
    try {
      const raw = await callWithRetry(generate, request.prompt.model ?? model, request.prompt.prompt, opts)
      return parseGeminiJson(raw)
    } catch (err) {
      if (stats) stats.reviewerFailures++
      return providerFailureObject(err instanceof Error ? err.message : String(err))
    }
  }
}

/**
 * REAL red-team runner. Sends the blind `case.prompt.prompt` (stem + options
 * only — no answer leak, guaranteed upstream) to the red-team model and returns
 * the parsed JSON. On failure returns an invalid object → validator fails →
 * `runRedTeamItem` sets output=null and redFlag=true (conservative escalate).
 */
export function createProviderRedTeamRunner(opts: ProviderRunnerOptions = {}): RedTeamRunner {
  const generate = opts.generate ?? defaultGenerateText
  const model = opts.redTeamModel ?? DEFAULT_REDTEAM_MODEL
  const stats = opts.stats
  return async (request: RedTeamCase) => {
    if (stats) stats.redTeamCalls++
    try {
      const raw = await callWithRetry(generate, request.prompt.model ?? model, request.prompt.prompt, opts)
      return parseGeminiJson(raw)
    } catch (err) {
      if (stats) stats.redTeamFailures++
      return providerFailureObject(err instanceof Error ? err.message : String(err))
    }
  }
}
