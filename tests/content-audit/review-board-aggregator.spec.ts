import { describe, it, expect, vi } from 'vitest'

import {
  type AggregateResult,
  type ItemLabel,
  type ReviewerOutput,
  type Tier1Result,
  buildTier1Result,
} from '../../scripts/lib/review-board-contract'
import {
  type ReviewBoardItem,
  createMockReviewerRunner,
} from '../../scripts/lib/review-board-reviewers'
import { createMockRedTeamRunner } from '../../scripts/lib/review-board-redteam'
import {
  type ModelPricing,
  type BoardItemInput,
  DEFAULT_CALLS_PER_ITEM,
  FREE_TIER_PRICING,
  EXAMPLE_PAID_PRICING,
  aggregate,
  aggregateAndLabel,
  deriveConsensus,
  deriveConfidence,
  costPerCallFor,
  flatPricing,
  estimateBoardCost,
  filterByLevel,
  planBatches,
  buildBoardPlan,
  formatDryRunReport,
  executeBoard,
} from '../../scripts/lib/review-board-aggregator'

/**
 * Spec `fuxie-content-review-board` — Task 4.3 unit tests.
 *
 * Covers: consensus rules, the confidence table, redFlag passthrough, the
 * combineLabels integration (2 separate labels + notReviewedNote + no
 * "approved" + advisory-pass only on PASS∧high∧¬redFlag), the escalation rule,
 * cost-estimate math, and the dry-run path (prints an estimate WITHOUT calling
 * any provider runner).
 *
 * No real provider call is made anywhere — the injected mock runners stand in
 * for the provider (Req 2.6, 7.6).
 */

// --- builders ---------------------------------------------------------------

function reviewer(
  verdict: ReviewerOutput['verdict'],
  severity: ReviewerOutput['severity'] = verdict === 'ok' ? 'none' : 'P2',
  reviewerId: ReviewerOutput['reviewer'] = 'german_linguist',
): ReviewerOutput {
  return {
    reviewer: reviewerId,
    dimension: 'German',
    verdict,
    severity,
    rationale: 'test',
    evidence: 'test',
  }
}

const PASS: Tier1Result = buildTier1Result({ files: 1, deStrings: 1 }, [])
const FAIL: Tier1Result = buildTier1Result({ files: 1, deStrings: 1 }, [
  { file: 'f', jsonPath: 'p', rule: 'r', severity: 'error', message: 'm' },
])

// ---------------------------------------------------------------------------
// Consensus rules (Req 3.4)
// ---------------------------------------------------------------------------
describe('deriveConsensus', () => {
  it("returns 'fail' if any reviewer verdict is 'fail'", () => {
    expect(deriveConsensus([reviewer('ok'), reviewer('fail')])).toBe('fail')
  })

  it("returns 'fail' if any reviewer severity is P0 or P1 even without a 'fail' verdict", () => {
    expect(deriveConsensus([reviewer('concern', 'P1')])).toBe('fail')
    expect(deriveConsensus([reviewer('concern', 'P0')])).toBe('fail')
  })

  it("returns 'concern' if any reviewer raises a concern but no hard fail", () => {
    expect(deriveConsensus([reviewer('ok'), reviewer('concern', 'P2')])).toBe('concern')
  })

  it("returns 'ok' when all reviewers are ok", () => {
    expect(deriveConsensus([reviewer('ok'), reviewer('ok'), reviewer('ok')])).toBe('ok')
  })

  it("returns 'ok' for an empty board (vacuous)", () => {
    expect(deriveConsensus([])).toBe('ok')
  })
})

// ---------------------------------------------------------------------------
// Confidence table (Req 3.4, 5.4)
// ---------------------------------------------------------------------------
describe('deriveConfidence', () => {
  const allOk = [reviewer('ok'), reviewer('ok'), reviewer('ok')]

  it("is 'high' only when all reviewers ok AND red-team high AND no redFlag", () => {
    expect(deriveConfidence(allOk, { redFlag: false, confidence: 'high' })).toBe('high')
  })

  it("degrades to 'medium' when red-team self-confidence is medium", () => {
    expect(deriveConfidence(allOk, { redFlag: false, confidence: 'medium' })).toBe('medium')
  })

  it("degrades to 'medium' when a reviewer raises a (non-blocking) concern", () => {
    const withConcern = [reviewer('ok'), reviewer('concern', 'P2')]
    expect(deriveConfidence(withConcern, { redFlag: false, confidence: 'high' })).toBe('medium')
  })

  it("is 'low' when redFlag is set, regardless of reviewers", () => {
    expect(deriveConfidence(allOk, { redFlag: true, confidence: 'high' })).toBe('low')
  })

  it("is 'low' when consensus is fail", () => {
    const withFail = [reviewer('ok'), reviewer('fail')]
    expect(deriveConfidence(withFail, { redFlag: false, confidence: 'high' })).toBe('low')
  })

  it("is 'low' when red-team self-confidence is low", () => {
    expect(deriveConfidence(allOk, { redFlag: false, confidence: 'low' })).toBe('low')
  })

  it("never reaches 'high' on an empty board", () => {
    expect(deriveConfidence([], { redFlag: false, confidence: 'high' })).not.toBe('high')
  })
})

// ---------------------------------------------------------------------------
// aggregate() — shape, redFlag passthrough, perDimension, cost
// ---------------------------------------------------------------------------
describe('aggregate', () => {
  const reviewers = [reviewer('ok'), reviewer('ok'), reviewer('ok')]

  it('passes the red-team redFlag straight through', () => {
    const agg = aggregate('item-1', reviewers, { redFlag: true, confidence: 'high' })
    expect(agg.redFlag).toBe(true)
    expect(agg.confidence).toBe('low') // redFlag forces low
  })

  it('carries the reviewer outputs as perDimension', () => {
    const agg = aggregate('item-1', reviewers, { redFlag: false, confidence: 'high' })
    expect(agg.perDimension).toHaveLength(3)
    expect(agg.itemId).toBe('item-1')
  })

  it('estimates cost as (reviewers + 1 red-team) * costPerCall', () => {
    const agg = aggregate('item-1', reviewers, { redFlag: false, confidence: 'high' }, { costPerCall: 0.01 })
    // 3 reviewers + 1 red-team = 4 calls * 0.01
    expect(agg.estimatedCostUsd).toBeCloseTo(0.04, 6)
  })

  it('defaults estimated cost to 0 (mock / free path spends nothing)', () => {
    const agg = aggregate('item-1', reviewers, { redFlag: false, confidence: 'high' })
    expect(agg.estimatedCostUsd).toBe(0)
  })

  it('does not mutate the input reviewer array', () => {
    const input = [reviewer('ok')]
    const agg = aggregate('x', input, { redFlag: false, confidence: 'high' })
    agg.perDimension.push(reviewer('fail'))
    expect(input).toHaveLength(1)
  })
})

// ---------------------------------------------------------------------------
// combineLabels integration via aggregateAndLabel (Req 5.1–5.4)
// ---------------------------------------------------------------------------
describe('aggregateAndLabel — dual-label integration', () => {
  const allOk = [reviewer('ok'), reviewer('ok'), reviewer('ok')]

  it('produces two separate labels with the mandatory notReviewedNote', () => {
    const { label } = aggregateAndLabel('i', PASS, allOk, { redFlag: false, confidence: 'high' })
    expect(label).toHaveProperty('objective')
    expect(label).toHaveProperty('subjective')
    expect(label.subjective.kind).toBe('AI-ADVISORY')
    expect(label.subjective.notReviewedNote).toMatch(/chưa được người rành tiếng Đức duyệt/i)
  })

  it('never emits the token "approved"', () => {
    const cases: Array<[Tier1Result, AggregateResult['confidence'], boolean]> = [
      [PASS, 'high', false],
      [PASS, 'medium', false],
      [FAIL, 'high', false],
      [PASS, 'high', true],
    ]
    for (const [t1, conf, redFlag] of cases) {
      const reviewers = conf === 'high' && !redFlag ? allOk : [reviewer('concern', 'P2')]
      const rt = { redFlag, confidence: conf } as const
      const { label } = aggregateAndLabel('i', t1, reviewers, rt)
      expect(JSON.stringify(label).toLowerCase()).not.toContain('approved')
    }
  })

  it("assigns advisory-pass ONLY when PASS ∧ confidence=high ∧ ¬redFlag", () => {
    const { label } = aggregateAndLabel('i', PASS, allOk, { redFlag: false, confidence: 'high' })
    expect(label.status).toBe('advisory-pass (low-assurance)')
  })

  it('escalates when objective=FAIL even if reviewers are clean', () => {
    const { label } = aggregateAndLabel('i', FAIL, allOk, { redFlag: false, confidence: 'high' })
    expect(label.status).toBe('escalate')
  })

  it('escalates when redFlag is set', () => {
    const { label } = aggregateAndLabel('i', PASS, allOk, { redFlag: true, confidence: 'high' })
    expect(label.status).toBe('escalate')
  })

  it('escalates when confidence is not high', () => {
    const reviewers = [reviewer('concern', 'P2')]
    const { label } = aggregateAndLabel('i', PASS, reviewers, { redFlag: false, confidence: 'medium' })
    expect(label.subjective.confidence).not.toBe('high')
    expect(label.status).toBe('escalate')
  })
})

// ---------------------------------------------------------------------------
// Cost estimate math (Req 7.3)
// ---------------------------------------------------------------------------
describe('cost accounting', () => {
  it('free-tier pricing costs nothing', () => {
    expect(costPerCallFor(FREE_TIER_PRICING)).toBe(0)
    expect(estimateBoardCost(1282, FREE_TIER_PRICING).estimatedCostUsd).toBe(0)
  })

  it('costPerCallFor sums input + output token costs', () => {
    const pricing: ModelPricing = {
      inputTokensPerCall: 1000,
      outputTokensPerCall: 1000,
      usdPer1kInputTokens: 0.002,
      usdPer1kOutputTokens: 0.004,
    }
    // (1000/1000)*0.002 + (1000/1000)*0.004 = 0.006
    expect(costPerCallFor(pricing)).toBeCloseTo(0.006, 6)
  })

  it('flatPricing encodes a flat per-call price', () => {
    expect(costPerCallFor(flatPricing(0.01))).toBeCloseTo(0.01, 6)
  })

  it('estimateBoardCost = itemCount * callsPerItem * costPerCall', () => {
    const est = estimateBoardCost(1282, EXAMPLE_PAID_PRICING, DEFAULT_CALLS_PER_ITEM)
    expect(est.itemCount).toBe(1282)
    expect(est.callsPerItem).toBe(4)
    expect(est.totalCalls).toBe(1282 * 4)
    // perCall = (1200/1000)*0.0005 + (300/1000)*0.0015 = 0.0006 + 0.00045 = 0.00105
    expect(est.usdPerCall).toBeCloseTo(0.00105, 6)
    expect(est.estimatedCostUsd).toBeCloseTo(1282 * 4 * 0.00105, 4)
  })

  it('defaults to 4 calls per item and free pricing', () => {
    const est = estimateBoardCost(10)
    expect(est.callsPerItem).toBe(4)
    expect(est.totalCalls).toBe(40)
    expect(est.estimatedCostUsd).toBe(0)
  })

  it('clamps negative / fractional item counts', () => {
    expect(estimateBoardCost(-5).itemCount).toBe(0)
    expect(estimateBoardCost(3.9).itemCount).toBe(3)
  })
})

// ---------------------------------------------------------------------------
// Batch planning + level filtering (Req 2.7)
// ---------------------------------------------------------------------------
describe('planning', () => {
  const items = [
    { itemId: 'a1-1', level: 'a1' },
    { itemId: 'a1-2', level: 'a1' },
    { itemId: 'b1-1', level: 'b1' },
  ]

  it('filters by level (case-insensitive)', () => {
    expect(filterByLevel(items, 'A1').map((i) => i.itemId)).toEqual(['a1-1', 'a1-2'])
    expect(filterByLevel(items)).toHaveLength(3)
  })

  it('splits ids into fixed-size batches', () => {
    const batches = planBatches(['x', 'y', 'z', 'w'], 2)
    expect(batches).toHaveLength(2)
    expect(batches[0].itemIds).toEqual(['x', 'y'])
    expect(batches[1].itemIds).toEqual(['z', 'w'])
  })

  it('a single batch when no batchSize is given', () => {
    const batches = planBatches(['x', 'y', 'z'])
    expect(batches).toHaveLength(1)
    expect(batches[0].size).toBe(3)
  })

  it('buildBoardPlan scopes by level and bounds spend via batches', () => {
    const plan = buildBoardPlan(items, { level: 'a1', batchSize: 1, pricing: EXAMPLE_PAID_PRICING })
    expect(plan.totalItems).toBe(2)
    expect(plan.batches).toHaveLength(2)
    expect(plan.cost.totalCalls).toBe(2 * 4)
  })
})

// ---------------------------------------------------------------------------
// Dry-run: prints an estimate WITHOUT calling any provider runner (Req 7.3)
// ---------------------------------------------------------------------------
describe('executeBoard — dry-run', () => {
  const reviewItem: ReviewBoardItem = { itemId: 'i1', level: 'a1', stem: 'Was ist das?' }
  const inputs: BoardItemInput[] = [
    {
      itemId: 'i1',
      level: 'a1',
      reviewItem,
      question: { stem: 'Was ist das?', options: ['A', 'B'], answer: 'A' },
      tier1: PASS,
    },
  ]

  it('produces a cost estimate and report without invoking the runners', async () => {
    const reviewerRunner = vi.fn(createMockReviewerRunner())
    const redTeamRunner = vi.fn(createMockRedTeamRunner())

    const result = await executeBoard(inputs, {
      dryRun: true,
      pricing: EXAMPLE_PAID_PRICING,
      reviewerRunner,
      redTeamRunner,
    })

    expect(result.dryRun).toBe(true)
    expect(result.items).toHaveLength(0)
    expect(result.estimatedCostUsd).toBeGreaterThan(0)
    expect(result.report).toContain('DRY RUN')
    expect(result.report).toContain('ESTIMATED COST')
    // The provider runners were NEVER called — no credit spent.
    expect(reviewerRunner).not.toHaveBeenCalled()
    expect(redTeamRunner).not.toHaveBeenCalled()
  })

  it('formatDryRunReport surfaces the estimate', () => {
    const plan = buildBoardPlan(inputs, { pricing: EXAMPLE_PAID_PRICING })
    const report = formatDryRunReport(plan)
    expect(report).toMatch(/ESTIMATED COST:\s+\$/)
    expect(report).toContain('WITHOUT calling any provider')
  })
})

// ---------------------------------------------------------------------------
// Live run goes only through injected mock runners (no real provider credit)
// ---------------------------------------------------------------------------
describe('executeBoard — live run via mock runners', () => {
  const reviewItem: ReviewBoardItem = {
    itemId: 'i1',
    level: 'a1',
    stem: 'Was ist das?',
    options: ['Haus', 'Auto'],
    answer: 'Haus',
  }
  const inputs: BoardItemInput[] = [
    {
      itemId: 'i1',
      level: 'a1',
      reviewItem,
      question: { stem: 'Was ist das?', options: ['Haus', 'Auto'], answer: 'Haus' },
      tier1: PASS,
    },
  ]

  it('aggregates + labels each item and builds the escalation queue', async () => {
    const result = await executeBoard(inputs, {
      dryRun: false,
      pricing: FREE_TIER_PRICING,
      reviewerRunner: createMockReviewerRunner(),
      // mock red-team predicts the first option "Haus" => agrees with stored answer
      redTeamRunner: createMockRedTeamRunner(),
    })

    expect(result.dryRun).toBe(false)
    expect(result.items).toHaveLength(1)
    const item = result.items[0]
    // all-ok reviewers + agreeing red-team + PASS => advisory-pass
    expect(item.aggregate.consensus).toBe('ok')
    expect(item.aggregate.redFlag).toBe(false)
    expect(item.label.status).toBe('advisory-pass (low-assurance)')
    expect(result.escalationQueue).toHaveLength(0)
  })

  it('escalates when the red-team disagrees with the stored answer', async () => {
    const result = await executeBoard(inputs, {
      dryRun: false,
      reviewerRunner: createMockReviewerRunner(),
      // force a disagreeing prediction
      redTeamRunner: createMockRedTeamRunner(() => 'Auto'),
    })
    const item = result.items[0]
    expect(item.aggregate.redFlag).toBe(true)
    expect(item.label.status).toBe('escalate')
    expect(result.escalationQueue).toHaveLength(1)
  })

  it('throws on a live run with no runners provided', async () => {
    await expect(executeBoard(inputs, { dryRun: false })).rejects.toThrow(/requires both/)
  })
})
