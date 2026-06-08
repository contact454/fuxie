import { describe, it, expect } from 'vitest'
import fc from 'fast-check'
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'

import {
  type Tier1Finding,
  type AggregateResult,
  type ItemLabel,
  type ReadingQuestion,
  type Confidence,
  FORBIDDEN_REDTEAM_KEYS,
  NOT_REVIEWED_NOTE,
  buildTier1Result,
  tier1ExitCode,
  buildRedTeamPayload,
  combineLabels,
  shouldEscalate,
  buildEscalationQueue,
} from './review-board-helpers'

/**
 * Spec `fuxie-content-review-board` — 5 correctness properties
 * (design.md §"Correctness Properties" / §"Testing Strategy").
 *
 * These run under `vitest.property.config.ts` (npm `test:property`) alongside
 * the other `tests/content-audit/*` PBT suites. They validate the pure
 * reference helpers in `./review-board-helpers.ts`, which encode the contract
 * the production Tier-1 / Tier-2 modules must satisfy.
 *
 *   Property 1 — Blocking on objective error (Req 1.5, 7.5)
 *   Property 2 — Red-team answer isolation     (Req 3.1, 3.5)
 *   Property 3 — No conflated approval         (Req 5.1, 5.2, 5.3)
 *   Property 4 — Escalation completeness       (Req 5.5, 6.2)
 *   Property 5 — Content read-only             (Req 4.1, 4.5, 6.4)
 */

const ROOT = path.resolve(__dirname, '..', '..')
const CONTENT = path.join(ROOT, 'content')

// --- shared fast-check arbitraries ----------------------------------------

const severityArb = fc.constantFrom<'error' | 'warning'>('error', 'warning')

const findingArb: fc.Arbitrary<Tier1Finding> = fc.record({
  file: fc.string(),
  jsonPath: fc.string(),
  rule: fc.string(),
  severity: severityArb,
  message: fc.string(),
})

const confidenceArb = fc.constantFrom<Confidence>('high', 'medium', 'low')

const aggregateArb: fc.Arbitrary<AggregateResult> = fc.record({
  itemId: fc.string(),
  consensus: fc.constantFrom<'ok' | 'concern' | 'fail'>('ok', 'concern', 'fail'),
  confidence: confidenceArb,
  perDimension: fc.constant([]),
  redFlag: fc.boolean(),
  estimatedCostUsd: fc.double({ min: 0, max: 10, noNaN: true }),
})

// A reading question that always contains some answer-bearing fields so the
// isolation property is exercised against real leak surfaces.
const readingQuestionArb: fc.Arbitrary<ReadingQuestion> = fc.record({
  stem: fc.option(fc.string(), { nil: undefined }),
  statement: fc.option(fc.string(), { nil: undefined }),
  situation: fc.option(fc.string(), { nil: undefined }),
  options: fc.option(fc.array(fc.string()), { nil: undefined }),
  answer: fc.oneof(fc.string(), fc.integer()),
  correctIndex: fc.integer({ min: 0, max: 5 }),
  solution: fc.string(),
  explanation: fc.string(),
  key_evidence: fc.string(),
})

// ---------------------------------------------------------------------------
// Property 1: Blocking On Objective Error — error ⇒ FAIL + exit ≠ 0
// **Validates: Requirements 1.5, 7.5**
// ---------------------------------------------------------------------------
describe('Property 1: Blocking On Objective Error', () => {
  it('any findings set with ≥1 severity=error ⇒ objectiveVerdict=FAIL and exit code ≠ 0', () => {
    fc.assert(
      fc.property(fc.array(findingArb), (findings) => {
        const result = buildTier1Result({ files: 1, deStrings: findings.length }, findings)
        const hasError = findings.some((f) => f.severity === 'error')
        if (hasError) {
          expect(result.objectiveVerdict).toBe('FAIL')
          expect(tier1ExitCode(result)).not.toBe(0)
        } else {
          expect(result.objectiveVerdict).toBe('PASS')
          expect(tier1ExitCode(result)).toBe(0)
        }
      }),
    )
  })

  it('an infrastructure error never reports a false PASS (distinct exit code)', () => {
    fc.assert(
      fc.property(fc.array(findingArb), fc.string({ minLength: 1 }), (findings, infra) => {
        const result = buildTier1Result({ files: 1, deStrings: 0 }, findings, infra)
        expect(result.objectiveVerdict).not.toBe('PASS')
        expect(tier1ExitCode(result)).toBe(2)
      }),
    )
  })
})

// ---------------------------------------------------------------------------
// Property 2: Red-team Answer Isolation — payload never leaks the answer
// **Validates: Requirements 3.1, 3.5**
// ---------------------------------------------------------------------------
describe('Property 2: Red-team Answer Isolation', () => {
  it('buildRedTeamPayload output never contains answer-bearing keys', () => {
    fc.assert(
      fc.property(readingQuestionArb, (q) => {
        const payload = buildRedTeamPayload(q)
        const keys = Object.keys(payload)
        for (const forbidden of FORBIDDEN_REDTEAM_KEYS) {
          expect(keys).not.toContain(forbidden)
        }
        // Defense-in-depth: a deep serialization must not surface the keys either.
        const serialized = JSON.stringify(payload)
        for (const forbidden of FORBIDDEN_REDTEAM_KEYS) {
          expect(serialized).not.toContain(`"${forbidden}"`)
        }
        // Payload only carries the allowed surface.
        expect(keys.every((k) => k === 'stem' || k === 'options')).toBe(true)
      }),
    )
  })
})

// ---------------------------------------------------------------------------
// Property 3: No Conflated Approval — two separate labels, no "approved"
// **Validates: Requirements 5.1, 5.2, 5.3**
// ---------------------------------------------------------------------------
describe('Property 3: No Conflated Approval', () => {
  it('combineLabels yields separate objective+subjective labels with notReviewedNote and no "approved" token', () => {
    fc.assert(
      fc.property(fc.array(findingArb), aggregateArb, (findings, agg) => {
        const t1 = buildTier1Result({ files: 1, deStrings: 0 }, findings)
        const label = combineLabels(t1, agg)

        // Two separate labels exist.
        expect(label).toHaveProperty('objective')
        expect(label).toHaveProperty('subjective')
        expect(['PASS', 'FAIL']).toContain(label.objective)
        expect(label.subjective.kind).toBe('AI-ADVISORY')

        // Subjective always carries the mandatory not-reviewed note.
        expect(label.subjective.notReviewedNote).toBe(NOT_REVIEWED_NOTE)
        expect(label.subjective.notReviewedNote.length).toBeGreaterThan(0)

        // No output (any field, any casing) collapses to the word "approved".
        const serialized = JSON.stringify(label).toLowerCase()
        expect(serialized).not.toContain('approved')
      }),
    )
  })
})

// ---------------------------------------------------------------------------
// Property 4: Escalation Completeness — every risk escalates
// **Validates: Requirements 5.5, 6.2**
// ---------------------------------------------------------------------------
describe('Property 4: Escalation Completeness', () => {
  it('objective=FAIL ∨ redFlag ∨ confidence!=high ⇒ status=escalate and present in queue', () => {
    fc.assert(
      fc.property(fc.array(findingArb), aggregateArb, (findings, agg) => {
        const t1 = buildTier1Result({ files: 1, deStrings: 0 }, findings)
        const label = combineLabels(t1, agg)
        const atRisk =
          label.objective === 'FAIL' || agg.redFlag || agg.confidence !== 'high'

        if (atRisk) {
          expect(label.status).toBe('escalate')
          expect(shouldEscalate(label)).toBe(true)
        } else {
          expect(label.status).toBe('advisory-pass (low-assurance)')
          expect(shouldEscalate(label)).toBe(false)
        }
      }),
    )
  })

  it('buildEscalationQueue contains exactly the at-risk items', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.tuple(fc.array(findingArb), aggregateArb).map(([findings, agg]) => {
            const t1 = buildTier1Result({ files: 1, deStrings: 0 }, findings)
            return { label: combineLabels(t1, agg) }
          }),
        ),
        (items) => {
          const queue = buildEscalationQueue(items)
          const expected = items.filter((it) => shouldEscalate(it.label))
          expect(queue).toEqual(expected)
          // No advisory-pass item ever appears in the queue.
          for (const it of queue) {
            expect(it.label.status).toBe('escalate')
          }
        },
      ),
    )
  })
})

// ---------------------------------------------------------------------------
// Property 5: Content Read-Only — pure helpers never mutate their input,
// and re-hashing the content tree is stable (no write side effects).
// **Validates: Requirements 4.1, 4.5, 6.4**
// ---------------------------------------------------------------------------
describe('Property 5: Content Read-Only', () => {
  it('buildRedTeamPayload does not mutate a deep-frozen input question', () => {
    fc.assert(
      fc.property(readingQuestionArb, (q) => {
        const frozen = deepFreeze(structuredClone(q))
        const before = JSON.stringify(frozen)
        // Must not throw (no write to frozen object) and must not mutate.
        expect(() => buildRedTeamPayload(frozen)).not.toThrow()
        expect(JSON.stringify(frozen)).toBe(before)
      }),
    )
  })

  it('combineLabels does not mutate its deep-frozen inputs', () => {
    fc.assert(
      fc.property(fc.array(findingArb), aggregateArb, (findings, agg) => {
        const t1 = deepFreeze(buildTier1Result({ files: 1, deStrings: 0 }, findings))
        const aggFrozen = deepFreeze(structuredClone(agg))
        const beforeT1 = JSON.stringify(t1)
        const beforeAgg = JSON.stringify(aggFrozen)
        expect(() => combineLabels(t1, aggFrozen)).not.toThrow()
        expect(JSON.stringify(t1)).toBe(beforeT1)
        expect(JSON.stringify(aggFrozen)).toBe(beforeAgg)
      }),
    )
  })

  it('content/ tree hash is stable across two reads (helpers cause no writes)', () => {
    const files = listJson(CONTENT)
    expect(files.length).toBeGreaterThan(0)
    const h1 = files.map(hashFile)
    // Exercise the helpers; none of them touch the filesystem.
    buildRedTeamPayload({ stem: 'x', options: ['a', 'b'], answer: 'a' })
    combineLabels(
      buildTier1Result({ files: 1, deStrings: 0 }, []),
      {
        itemId: 'x',
        consensus: 'ok',
        confidence: 'high',
        perDimension: [],
        redFlag: false,
        estimatedCostUsd: 0,
      },
    )
    const h2 = files.map(hashFile)
    expect(h2).toEqual(h1)
  })
})

// --- local fs helpers (mirror sibling read-only-invariant.spec.ts) ---------

function listJson(dir: string): string[] {
  const out: string[] = []
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fp = path.join(dir, entry.name)
    if (entry.isDirectory()) out.push(...listJson(fp))
    else if (entry.name.endsWith('.json')) out.push(fp)
  }
  return out
}

function hashFile(fp: string): string {
  return crypto.createHash('sha256').update(fs.readFileSync(fp)).digest('hex')
}

function deepFreeze<T>(obj: T): T {
  if (obj && typeof obj === 'object') {
    for (const key of Object.keys(obj as Record<string, unknown>)) {
      const value = (obj as Record<string, unknown>)[key]
      if (value && typeof value === 'object') deepFreeze(value)
    }
    Object.freeze(obj)
  }
  return obj
}
