/**
 * Spec `fuxie-content-review-board` — Task 4.3
 * Tier-2 Agent Review Board: Aggregator + dual-label + cost accounting.
 *
 * This module is the FINAL Tier-2 assembly step. It takes the structured
 * outputs of the 3 board reviewers (task 4.1) + the blind red-team result
 * (task 4.2) and produces:
 *
 *   1. `aggregate(...)`            -> AggregateResult { consensus, confidence,
 *                                     perDimension, redFlag, estimatedCostUsd }
 *   2. dual-label via `combineLabels` (REUSED from review-board-contract — the
 *      single source of truth; never reimplemented here). The combiner enforces
 *      two SEPARATE labels, the mandatory notReviewedNote, advisory-pass only
 *      when objective=PASS ∧ confidence=high ∧ redFlag=false, and never the
 *      word "approved" (Req 5.1–5.4, design §Component 4).
 *   3. cost accounting + `--dry-run` planning: `estimateBoardCost(...)` computes
 *      estimated USD BEFORE any provider call (Req 7.3) and `buildBoardPlan` /
 *      `formatDryRunReport` produce a batch plan + estimate that a dry-run can
 *      print WITHOUT spending a single credit.
 *
 * Provider safety (Req 2.7, 7.3, 7.6): every provider call is injected via the
 * runner seams from tasks 4.1 / 4.2 (`ReviewerRunner`, `RedTeamRunner`). The
 * dry-run path never touches a runner at all, so a planning run costs nothing
 * and is fully deterministic.
 *
 * Design references: design.md §"Component 4", §"Data Models", Req 2.7, 3.4,
 * 5.1–5.5, 7.1, 7.3.
 */
import {
  type AggregateResult,
  type Confidence,
  type ItemLabel,
  type ReadingQuestion,
  type ReviewerOutput,
  type Tier1Result,
  combineLabels,
  shouldEscalate,
  buildEscalationQueue,
  NOT_REVIEWED_NOTE,
} from './review-board-contract'
import {
  type ReviewBoardItem,
  type ReviewerRunner,
  type BuildReviewerPromptOptions,
  runReviewBoardItem,
} from './review-board-reviewers'
import {
  type RedTeamRunner,
  type BuildRedTeamPromptOptions,
  runRedTeamItem,
} from './review-board-redteam'

// Re-export the dual-label primitives so downstream callers (task 6.1, tests)
// can import the whole Tier-2 assembly surface from one module.
export {
  combineLabels,
  shouldEscalate,
  buildEscalationQueue,
  NOT_REVIEWED_NOTE,
} from './review-board-contract'

// ---------------------------------------------------------------------------
// Consensus derivation (Req 3.4, design §Component 4)
// ---------------------------------------------------------------------------

/**
 * Consensus is a deterministic roll-up of the reviewer verdicts/severities.
 * The red-team's disagreement is carried SEPARATELY as `redFlag` (it is not a
 * dimension verdict), so consensus here is reviewer-only.
 *
 * Consensus table (worst-wins):
 *
 *   | reviewer signals                                   | consensus |
 *   | -------------------------------------------------- | --------- |
 *   | any verdict='fail'  OR any severity ∈ {P0, P1}     | 'fail'    |
 *   | else any verdict='concern' OR any severity = 'P2'  | 'concern' |
 *   | else (all 'ok' / 'none')                           | 'ok'      |
 *
 * Rationale: a single P0/P1 finding (a learner-facing blocker) outweighs any
 * number of "ok" votes — the board never averages a serious defect away.
 */
export function deriveConsensus(reviewerOutputs: readonly ReviewerOutput[]): 'ok' | 'concern' | 'fail' {
  let sawConcern = false
  for (const r of reviewerOutputs) {
    if (r.verdict === 'fail' || r.severity === 'P0' || r.severity === 'P1') {
      return 'fail'
    }
    if (r.verdict === 'concern' || r.severity === 'P2') {
      sawConcern = true
    }
  }
  return sawConcern ? 'concern' : 'ok'
}

// ---------------------------------------------------------------------------
// Confidence derivation (Req 3.4, 5.4, design §Component 4)
// ---------------------------------------------------------------------------

/** The red-team facts that feed the confidence function. */
export interface RedTeamSignal {
  redFlag: boolean
  confidence: Confidence
}

/**
 * Confidence is a documented function of reviewer agreement + the red-team
 * signal. It is intentionally CONSERVATIVE: `high` is only reachable when every
 * signal is clean, because `high` is the sole gate that lets `combineLabels`
 * self-assign `advisory-pass (low-assurance)` (Req 5.4).
 *
 * Confidence table:
 *
 *   | condition                                                        | confidence |
 *   | ---------------------------------------------------------------- | ---------- |
 *   | ≥1 reviewer AND all reviewers 'ok' AND ¬redFlag AND rt='high'     | 'high'     |
 *   | consensus='fail' OR redFlag OR rt='low'                          | 'low'      |
 *   | everything else (some 'concern', or rt='medium', no hard fail)   | 'medium'   |
 *
 * Notes:
 *   - "all reviewers 'ok'" requires at least one reviewer output, so an empty
 *     board can never reach 'high' (it degrades to 'medium'/'low').
 *   - `rt` is the red-team's self-reported confidence in its blind answer.
 *   - `high` ⇒ ¬redFlag by construction, so the advisory-pass invariant
 *     (PASS ∧ high ∧ ¬redFlag) is consistent with this table.
 */
export function deriveConfidence(
  reviewerOutputs: readonly ReviewerOutput[],
  redTeam: RedTeamSignal,
): Confidence {
  const consensus = deriveConsensus(reviewerOutputs)

  // Low: any hard negative signal anywhere.
  if (consensus === 'fail' || redTeam.redFlag || redTeam.confidence === 'low') {
    return 'low'
  }

  // High: a fully clean board — at least one reviewer, all 'ok', red-team
  // agreed with high self-confidence, no red flag.
  const allOk = reviewerOutputs.length > 0 && reviewerOutputs.every((r) => r.verdict === 'ok')
  if (allOk && !redTeam.redFlag && redTeam.confidence === 'high') {
    return 'high'
  }

  // Everything in between.
  return 'medium'
}

// ---------------------------------------------------------------------------
// Aggregator (design §Component 4 — AggregateResult)
// ---------------------------------------------------------------------------

export interface AggregateOptions {
  /**
   * Estimated USD cost of a SINGLE provider call. The aggregate cost is
   * `(reviewerOutputs.length + 1) * costPerCall` — one call per reviewer plus
   * the red-team call. Defaults to 0 (the deterministic mock / dry-run path
   * spends nothing). Pass `costPerCallFor(pricing)` for a priced estimate.
   */
  costPerCall?: number
}

/**
 * Aggregate the board for ONE item. Pure: never mutates its inputs, never calls
 * a provider.
 *
 *   - consensus       : `deriveConsensus(reviewerOutputs)`
 *   - confidence      : `deriveConfidence(reviewerOutputs, redTeam)`
 *   - perDimension    : the reviewer outputs (unchanged)
 *   - redFlag         : from the red-team result (Req 3.3/3.4)
 *   - estimatedCostUsd: sum of per-call cost estimates for this item
 */
export function aggregate(
  itemId: string,
  reviewerOutputs: readonly ReviewerOutput[],
  redTeam: RedTeamSignal,
  opts: AggregateOptions = {},
): AggregateResult {
  const costPerCall = opts.costPerCall ?? 0
  const calls = reviewerOutputs.length + 1 // reviewers + 1 red-team call
  return {
    itemId,
    consensus: deriveConsensus(reviewerOutputs),
    confidence: deriveConfidence(reviewerOutputs, redTeam),
    perDimension: [...reviewerOutputs],
    redFlag: redTeam.redFlag,
    estimatedCostUsd: round6(calls * costPerCall),
  }
}

/**
 * Aggregate + dual-label in one step. The objective verdict is authoritative
 * and comes from this item's Tier-1 result (design §Component 4); the combiner
 * is REUSED unchanged.
 */
export function aggregateAndLabel(
  itemId: string,
  tier1: Tier1Result,
  reviewerOutputs: readonly ReviewerOutput[],
  redTeam: RedTeamSignal,
  opts: AggregateOptions = {},
): { aggregate: AggregateResult; label: ItemLabel } {
  const agg = aggregate(itemId, reviewerOutputs, redTeam, opts)
  const label = combineLabels(tier1, agg)
  return { aggregate: agg, label }
}

// ---------------------------------------------------------------------------
// Cost accounting (Req 7.3) — estimate BEFORE any provider call
// ---------------------------------------------------------------------------

/**
 * Token-aware pricing for one provider call. A flat per-call price is expressed
 * by setting `usdPer1kOutputTokens`/`usdPer1kInputTokens` to 0 and using
 * {@link flatPricing}. Token counts are per single reviewer/red-team call.
 */
export interface ModelPricing {
  inputTokensPerCall: number
  outputTokensPerCall: number
  usdPer1kInputTokens: number
  usdPer1kOutputTokens: number
}

/**
 * Free-tier default. The provider-runner defaults to `:free` models
 * (`google/gemma-*:free`, `meta-llama/*:free`), so the default estimate is $0 —
 * the board spends no credit unless a paid pricing model is supplied.
 */
export const FREE_TIER_PRICING: ModelPricing = {
  inputTokensPerCall: 0,
  outputTokensPerCall: 0,
  usdPer1kInputTokens: 0,
  usdPer1kOutputTokens: 0,
}

/**
 * Illustrative paid pricing used in docs/tests for a worked example. Values are
 * rough per-call token budgets for a review-board prompt (a few hundred tokens
 * of rubric + item in, a small JSON object out) at a representative price.
 */
export const EXAMPLE_PAID_PRICING: ModelPricing = {
  inputTokensPerCall: 1200,
  outputTokensPerCall: 300,
  usdPer1kInputTokens: 0.0005,
  usdPer1kOutputTokens: 0.0015,
}

/** Build a flat per-call pricing model (no token modelling). */
export function flatPricing(usdPerCall: number): ModelPricing {
  return {
    inputTokensPerCall: 0,
    outputTokensPerCall: 1000,
    usdPer1kInputTokens: 0,
    // 1000 output tokens priced at `usdPerCall` per 1k => exactly `usdPerCall`/call.
    usdPer1kOutputTokens: usdPerCall,
  }
}

/**
 * USD cost of a single provider call:
 *   (inputTokens/1000)*usdPer1kInput + (outputTokens/1000)*usdPer1kOutput
 */
export function costPerCallFor(pricing: ModelPricing): number {
  const input = (pricing.inputTokensPerCall / 1000) * pricing.usdPer1kInputTokens
  const output = (pricing.outputTokensPerCall / 1000) * pricing.usdPer1kOutputTokens
  return round6(input + output)
}

/** The 4 calls per item = 3 board reviewers + 1 blind red-team (design §Component 2). */
export const DEFAULT_CALLS_PER_ITEM = 4

export interface CostEstimate {
  itemCount: number
  callsPerItem: number
  totalCalls: number
  usdPerCall: number
  estimatedCostUsd: number
}

/**
 * Estimate the total USD cost of running the board over `itemCount` items
 * BEFORE any provider call (Req 7.3). Formula:
 *
 *   totalCalls       = itemCount * callsPerItem
 *   estimatedCostUsd = totalCalls * costPerCall(pricing)
 *
 * Default `callsPerItem` is 4 (3 reviewers + red-team).
 */
export function estimateBoardCost(
  itemCount: number,
  pricing: ModelPricing = FREE_TIER_PRICING,
  callsPerItem: number = DEFAULT_CALLS_PER_ITEM,
): CostEstimate {
  const safeItems = Math.max(0, Math.floor(itemCount))
  const usdPerCall = costPerCallFor(pricing)
  const totalCalls = safeItems * callsPerItem
  return {
    itemCount: safeItems,
    callsPerItem,
    totalCalls,
    usdPerCall,
    estimatedCostUsd: round6(totalCalls * usdPerCall),
  }
}

// ---------------------------------------------------------------------------
// Batch planning + dry-run (Req 2.7, 7.3) — bound spend per run
// ---------------------------------------------------------------------------

/** Minimal item identity used for planning/level filtering. */
export interface PlannableItem {
  itemId: string
  level: string
}

/** Filter items to a single CEFR level (case-insensitive). */
export function filterByLevel<T extends PlannableItem>(items: readonly T[], level?: string): T[] {
  if (!level) return [...items]
  const want = level.trim().toLowerCase()
  return items.filter((it) => it.level.trim().toLowerCase() === want)
}

export interface BatchPlanEntry {
  index: number
  itemIds: string[]
  size: number
}

/** Split item ids into fixed-size batches to bound spend per run (Req 2.7). */
export function planBatches(itemIds: readonly string[], batchSize?: number): BatchPlanEntry[] {
  const size = batchSize && batchSize > 0 ? Math.floor(batchSize) : itemIds.length || 1
  const batches: BatchPlanEntry[] = []
  for (let i = 0; i < itemIds.length; i += size) {
    batches.push({
      index: batches.length,
      itemIds: itemIds.slice(i, i + size),
      size: Math.min(size, itemIds.length - i),
    })
  }
  return batches
}

export interface BoardPlan {
  level: string | null
  totalItems: number
  callsPerItem: number
  batchSize: number | null
  batches: BatchPlanEntry[]
  cost: CostEstimate
}

export interface BuildBoardPlanOptions {
  level?: string
  batchSize?: number
  pricing?: ModelPricing
  callsPerItem?: number
}

/**
 * Build the full dry-run plan for a set of items WITHOUT calling any provider:
 * level filtering -> batch split -> cost estimate. This is what a `--dry-run`
 * surfaces so spend is known and bounded before a single credit is used.
 */
export function buildBoardPlan(
  items: readonly PlannableItem[],
  opts: BuildBoardPlanOptions = {},
): BoardPlan {
  const callsPerItem = opts.callsPerItem ?? DEFAULT_CALLS_PER_ITEM
  const pricing = opts.pricing ?? FREE_TIER_PRICING
  const scoped = filterByLevel(items, opts.level)
  const itemIds = scoped.map((it) => it.itemId)
  const batches = planBatches(itemIds, opts.batchSize)
  return {
    level: opts.level ? opts.level.trim().toLowerCase() : null,
    totalItems: scoped.length,
    callsPerItem,
    batchSize: opts.batchSize && opts.batchSize > 0 ? Math.floor(opts.batchSize) : null,
    batches,
    cost: estimateBoardCost(scoped.length, pricing, callsPerItem),
  }
}

/** Render a human-readable dry-run report (printed by `--dry-run`, Req 7.3). */
export function formatDryRunReport(plan: BoardPlan): string {
  const lines: string[] = [
    '=== Fuxie Content Review Board — DRY RUN (no provider call) ===',
    `level:           ${plan.level ?? '(all)'}`,
    `items:           ${plan.totalItems}`,
    `calls/item:      ${plan.callsPerItem}  (3 reviewers + 1 red-team)`,
    `batch size:      ${plan.batchSize ?? '(single batch)'}`,
    `batches:         ${plan.batches.length}`,
    `total calls:     ${plan.cost.totalCalls}`,
    `est. $/call:     $${plan.cost.usdPerCall.toFixed(6)}`,
    `ESTIMATED COST:  $${plan.cost.estimatedCostUsd.toFixed(4)}`,
    'NOTE: dry-run prints this estimate WITHOUT calling any provider; no credit spent.',
  ]
  return lines.join('\n')
}

// ---------------------------------------------------------------------------
// Provider-injectable orchestration (Req 2.6, 7.6) — building block for 6.1
// ---------------------------------------------------------------------------

/**
 * One item ready to be reviewed by the full board. `tier1` supplies the
 * authoritative objective verdict for the dual-label combine.
 */
export interface BoardItemInput {
  itemId: string
  level: string
  /** Reviewer-visible normalized item (answer + explanation visible). */
  reviewItem: ReviewBoardItem
  /** Raw question — the red-team payload is built blind from this. */
  question: ReadingQuestion
  /** This item's Tier-1 objective verdict (authoritative). */
  tier1: Tier1Result
}

export interface BoardItemResult {
  itemId: string
  level: string
  aggregate: AggregateResult
  label: ItemLabel
  escalate: boolean
}

export interface ExecuteBoardOptions extends BuildBoardPlanOptions {
  /** When true, NO runner is called — only the plan/estimate is produced. */
  dryRun: boolean
  reviewerRunner?: ReviewerRunner
  redTeamRunner?: RedTeamRunner
  /** Forwarded to the reviewer/red-team prompt builders (model-differ guard). */
  reviewerPromptOptions?: BuildReviewerPromptOptions
  redTeamPromptOptions?: BuildRedTeamPromptOptions
}

export interface ExecuteBoardResult {
  dryRun: boolean
  plan: BoardPlan
  /** The dry-run report string (also returned on a live run for the log). */
  report: string
  /** Per-item results — EMPTY on a dry-run (no provider call was made). */
  items: BoardItemResult[]
  /** Items that must go to the escalation queue (Req 5.5, 6.2). */
  escalationQueue: BoardItemResult[]
  /** Total estimated USD across the items actually processed. */
  estimatedCostUsd: number
}

/**
 * Execute the board over a set of items, honouring `--dry-run`, `--level` and
 * `--batch-size`.
 *
 *   - dryRun=true  : returns the plan + cost estimate and NEVER calls a runner
 *                    (zero spend, Req 7.3). `items` is empty.
 *   - dryRun=false : routes each scoped item through the injected reviewer +
 *                    red-team runners, aggregates, dual-labels, and collects the
 *                    escalation queue. Requires both runners to be provided.
 *
 * Live runs go ONLY through the injected runners (the seams from tasks 4.1/4.2),
 * so this function spends no real provider credit in tests — a deterministic
 * mock runner stands in for the provider.
 */
export async function executeBoard(
  items: readonly BoardItemInput[],
  opts: ExecuteBoardOptions,
): Promise<ExecuteBoardResult> {
  const plan = buildBoardPlan(items, opts)
  const report = formatDryRunReport(plan)

  if (opts.dryRun) {
    return {
      dryRun: true,
      plan,
      report,
      items: [],
      escalationQueue: [],
      estimatedCostUsd: plan.cost.estimatedCostUsd,
    }
  }

  if (!opts.reviewerRunner || !opts.redTeamRunner) {
    throw new Error(
      '[review-board] a live run requires both reviewerRunner and redTeamRunner; pass dryRun:true to plan only',
    )
  }

  const scopedIds = new Set(filterByLevel(items, opts.level).map((it) => it.itemId))
  const costPerCall = costPerCallFor(opts.pricing ?? FREE_TIER_PRICING)

  const results: BoardItemResult[] = []
  for (const input of items) {
    if (!scopedIds.has(input.itemId)) continue

    const reviewerResults = await runReviewBoardItem(
      input.reviewItem,
      opts.reviewerRunner,
      opts.reviewerPromptOptions ?? {},
    )
    const reviewerOutputs = reviewerResults
      .map((r) => r.output)
      .filter((o): o is ReviewerOutput => o !== null)

    const redTeamResult = await runRedTeamItem(
      input.itemId,
      input.question,
      opts.redTeamRunner,
      opts.redTeamPromptOptions ?? {},
    )
    const redTeam: RedTeamSignal = {
      redFlag: redTeamResult.redFlag,
      confidence: redTeamResult.output?.confidence ?? 'low',
    }

    const { aggregate: agg, label } = aggregateAndLabel(
      input.itemId,
      input.tier1,
      reviewerOutputs,
      redTeam,
      { costPerCall },
    )

    results.push({
      itemId: input.itemId,
      level: input.level,
      aggregate: agg,
      label,
      escalate: shouldEscalate(label),
    })
  }

  return {
    dryRun: false,
    plan,
    report,
    items: results,
    escalationQueue: results.filter((r) => r.escalate),
    estimatedCostUsd: round6(results.reduce((sum, r) => sum + r.aggregate.estimatedCostUsd, 0)),
  }
}

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------

function round6(n: number): number {
  return Math.round((n + Number.EPSILON) * 1e6) / 1e6
}
