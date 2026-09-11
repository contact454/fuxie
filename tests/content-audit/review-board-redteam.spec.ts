import { describe, it, expect } from 'vitest'
import fc from 'fast-check'

import {
  type ReadingQuestion,
  FORBIDDEN_REDTEAM_KEYS,
} from '../../scripts/lib/review-board-contract'
import {
  REDTEAM_REVIEWER_ID,
  REDTEAM_DIMENSION,
  buildRedTeamPrompt,
  findRedTeamLeaks,
  validateRedTeamOutput,
  computeRedFlag,
  resolveStoredAnswer,
  buildRedTeamCase,
  runRedTeamItem,
  createMockRedTeamRunner,
} from '../../scripts/lib/review-board-redteam'

/**
 * Spec `fuxie-content-review-board` — Task 4.2 (Red-team blind reviewer).
 *
 * Runs under `vitest.property.config.ts` (npm `test:property`) alongside the
 * other `tests/content-audit/*` suites. Covers:
 *   - payload isolation (Property 2 / Req 3.5) at key + serialized level
 *   - prompt-level isolation (stored answer value never in the built prompt)
 *   - red-team output validator accept/reject (Req 3.2)
 *   - redFlag normalization cases (Req 3.3): richtig/falsch, ja/nein,
 *     correctIndex match/mismatch, MC letter vs value, ambiguous -> redFlag
 *   - deterministic mock runner returns a valid output, no provider call
 */

// --- fast-check arbitraries (mirror review-board.spec.ts) ------------------

// A reading question that always carries answer-bearing fields, so the prompt
// isolation property is exercised against real leak surfaces. The stem/options
// are constrained to printable text to keep the "value appears in prompt" check
// meaningful.
const readingQuestionArb: fc.Arbitrary<ReadingQuestion> = fc.record({
  stem: fc.option(fc.string({ minLength: 1 }), { nil: undefined }),
  statement: fc.option(fc.string({ minLength: 1 }), { nil: undefined }),
  situation: fc.option(fc.string({ minLength: 1 }), { nil: undefined }),
  options: fc.option(fc.array(fc.string({ minLength: 1 }), { maxLength: 5 }), { nil: undefined }),
  answer: fc.oneof(fc.string({ minLength: 3 }), fc.integer({ min: 0, max: 5 })),
  correctIndex: fc.integer({ min: 0, max: 5 }),
  solution: fc.string({ minLength: 3 }),
  explanation: fc.string({ minLength: 3 }),
  key_evidence: fc.string({ minLength: 3 }),
})

// ---------------------------------------------------------------------------
// Payload isolation — Property 2 / Req 3.5 (key + serialized)
// **Validates: Requirements 3.1, 3.5**
// ---------------------------------------------------------------------------
describe('Red-team payload isolation (Property 2)', () => {
  it('built prompt payload only carries stem/options, never answer-bearing keys', () => {
    fc.assert(
      fc.property(readingQuestionArb, (q) => {
        const { payload } = buildRedTeamPrompt(q)
        const keys = Object.keys(payload)
        expect(keys.every((k) => k === 'stem' || k === 'options')).toBe(true)
        const serialized = JSON.stringify(payload)
        for (const forbidden of FORBIDDEN_REDTEAM_KEYS) {
          expect(keys).not.toContain(forbidden)
          expect(serialized).not.toContain(`"${forbidden}"`)
        }
      }),
    )
  })
})

// ---------------------------------------------------------------------------
// Prompt-level isolation — the rendered prompt never carries a forbidden key
// nor (in the payload surface) the stored answer value.
// **Validates: Requirements 3.1, 3.5**
// ---------------------------------------------------------------------------
describe('Red-team prompt isolation (rendered prompt string)', () => {
  it('rendered prompt + payload never contain a forbidden answer-bearing key', () => {
    fc.assert(
      fc.property(readingQuestionArb, (q) => {
        const prompt = buildRedTeamPrompt(q)
        for (const forbidden of FORBIDDEN_REDTEAM_KEYS) {
          // The serialized prompt must not embed the JSON key of any leak field.
          expect(prompt.prompt.includes(`"${forbidden}"`)).toBe(false)
        }
      }),
    )
  })

  it('findRedTeamLeaks reports no leak for any generated question', () => {
    fc.assert(
      fc.property(readingQuestionArb, (q) => {
        const prompt = buildRedTeamPrompt(q)
        const stored = resolveStoredAnswer(q)
        expect(findRedTeamLeaks(prompt, stored ?? undefined)).toEqual([])
      }),
    )
  })

  it('a string answer value that is NOT part of stem/options never appears in the payload', () => {
    const q: ReadingQuestion = {
      stem: 'Der Hund läuft im Park.',
      options: ['der', 'die', 'das'],
      answer: 'SECRET_ANSWER_TOKEN_XYZ',
      correctIndex: 0,
      solution: 'SECRET_ANSWER_TOKEN_XYZ',
      explanation: 'Weil "Hund" maskulin ist, nimmt es SECRET_ANSWER_TOKEN_XYZ.',
      key_evidence: 'SECRET_ANSWER_TOKEN_XYZ',
    }
    const prompt = buildRedTeamPrompt(q)
    expect(JSON.stringify(prompt.payload)).not.toContain('SECRET_ANSWER_TOKEN_XYZ')
    expect(prompt.prompt).not.toContain('SECRET_ANSWER_TOKEN_XYZ')
    expect(findRedTeamLeaks(prompt, q.answer)).toEqual([])
  })

  it('does not mutate a deep-frozen input question', () => {
    const q: ReadingQuestion = Object.freeze({
      stem: 'x',
      options: Object.freeze(['a', 'b']) as unknown as string[],
      answer: 'a',
      correctIndex: 0,
    })
    const before = JSON.stringify(q)
    expect(() => buildRedTeamPrompt(q)).not.toThrow()
    expect(JSON.stringify(q)).toBe(before)
  })
})

// ---------------------------------------------------------------------------
// Output validator accept/reject — Req 3.2
// ---------------------------------------------------------------------------
describe('validateRedTeamOutput', () => {
  it('accepts a well-formed { predictedAnswer, confidence, rationale }', () => {
    const r = validateRedTeamOutput({
      reviewer: 'redteam_blind',
      predictedAnswer: 'der',
      confidence: 'high',
      rationale: 'Hund is masculine.',
    })
    expect(r.ok).toBe(true)
    expect(r.errors).toEqual([])
  })

  it('accepts without the optional reviewer field', () => {
    const r = validateRedTeamOutput({
      predictedAnswer: 'B',
      confidence: 'low',
      rationale: 'guessing',
    })
    expect(r.ok).toBe(true)
  })

  it.each([
    ['not an object', 42],
    ['null', null],
    ['array', [{ predictedAnswer: 'a', confidence: 'high', rationale: 'r' }]],
    ['missing predictedAnswer', { confidence: 'high', rationale: 'r' }],
    ['empty predictedAnswer', { predictedAnswer: '   ', confidence: 'high', rationale: 'r' }],
    ['bad confidence', { predictedAnswer: 'a', confidence: 'sure', rationale: 'r' }],
    ['missing rationale', { predictedAnswer: 'a', confidence: 'high' }],
    ['empty rationale', { predictedAnswer: 'a', confidence: 'high', rationale: '' }],
    ['wrong reviewer', { reviewer: 'german_linguist', predictedAnswer: 'a', confidence: 'high', rationale: 'r' }],
  ])('rejects %s', (_label, input) => {
    const r = validateRedTeamOutput(input as unknown)
    expect(r.ok).toBe(false)
    expect(r.errors.length).toBeGreaterThan(0)
  })
})

// ---------------------------------------------------------------------------
// redFlag normalization cases — Req 3.3
// ---------------------------------------------------------------------------
describe('computeRedFlag normalization', () => {
  it('richtig/falsch: match -> no redFlag, mismatch -> redFlag', () => {
    expect(computeRedFlag('richtig', 'Richtig')).toBe(false)
    expect(computeRedFlag('falsch', 'falsch')).toBe(false)
    expect(computeRedFlag('richtig', 'falsch')).toBe(true)
    expect(computeRedFlag('Falsch', 'richtig')).toBe(true)
  })

  it('ja/nein collapse to truthy/falsy and align with richtig/falsch', () => {
    expect(computeRedFlag('ja', 'richtig')).toBe(false)
    expect(computeRedFlag('nein', 'falsch')).toBe(false)
    expect(computeRedFlag('ja', 'falsch')).toBe(true)
    expect(computeRedFlag('yes', 'nein')).toBe(true)
  })

  it('MC correctIndex resolves against options: match/mismatch', () => {
    const options = ['der', 'die', 'das']
    // stored correctIndex 0 -> "der", predicted text "der" -> match
    expect(computeRedFlag('der', 0, options)).toBe(false)
    // predicted letter "A" -> options[0] "der" -> match
    expect(computeRedFlag('A', 0, options)).toBe(false)
    // predicted index "1" -> "die", stored 0 -> "der" -> mismatch
    expect(computeRedFlag('1', 0, options)).toBe(true)
    // predicted letter "C" -> "das", stored index 2 -> "das" -> match
    expect(computeRedFlag('C', 2, options)).toBe(false)
  })

  it('MC letter vs option value compare like-for-like', () => {
    const options = ['Berlin', 'München', 'Hamburg']
    expect(computeRedFlag('B', 'München', options)).toBe(false)
    expect(computeRedFlag('München', 1, options)).toBe(false)
    expect(computeRedFlag('A', 'Hamburg', options)).toBe(true)
  })

  it('ambiguous / unparseable predictions are conservatively flagged', () => {
    expect(computeRedFlag('', 'richtig')).toBe(true)
    expect(computeRedFlag(null, 'der')).toBe(true)
    expect(computeRedFlag(undefined, 0, ['a', 'b'])).toBe(true)
    // missing stored answer also escalates
    expect(computeRedFlag('der', null)).toBe(true)
    expect(computeRedFlag('der', undefined)).toBe(true)
  })

  it('resolveStoredAnswer prefers answer, then correctIndex, then solution', () => {
    expect(resolveStoredAnswer({ answer: 'der', correctIndex: 1, solution: 'das' })).toBe('der')
    expect(resolveStoredAnswer({ correctIndex: 2, solution: 'das' })).toBe(2)
    expect(resolveStoredAnswer({ solution: 'das' })).toBe('das')
    expect(resolveStoredAnswer({ stem: 'x' })).toBe(null)
  })
})

// ---------------------------------------------------------------------------
// Mock runner — deterministic valid output, no provider call
// ---------------------------------------------------------------------------
describe('createMockRedTeamRunner + runRedTeamItem', () => {
  it('mock runner returns a schema-valid output (no provider call)', async () => {
    const runner = createMockRedTeamRunner()
    const c = buildRedTeamCase('item-1', { stem: 'x', options: ['der', 'die', 'das'], answer: 'der' })
    const raw = await runner(c)
    const v = validateRedTeamOutput(raw)
    expect(v.ok).toBe(true)
    expect((raw as { reviewer: string }).reviewer).toBe(REDTEAM_REVIEWER_ID)
  })

  it('runRedTeamItem: agreeing prediction -> redFlag false', async () => {
    // mock predicts first option "der"; stored answer "der" -> agree
    const runner = createMockRedTeamRunner()
    const res = await runRedTeamItem(
      'item-agree',
      { stem: 'Welcher Artikel?', options: ['der', 'die', 'das'], answer: 'der' },
      runner,
    )
    expect(res.output).not.toBeNull()
    expect(res.redFlag).toBe(false)
  })

  it('runRedTeamItem: disagreeing prediction -> redFlag true', async () => {
    // force a wrong self-solve to simulate "item teaches wrong answer"
    const runner = createMockRedTeamRunner(() => 'das')
    const res = await runRedTeamItem(
      'item-disagree',
      { stem: 'Welcher Artikel?', options: ['der', 'die', 'das'], answer: 'der' },
      runner,
    )
    expect(res.output?.predictedAnswer).toBe('das')
    expect(res.redFlag).toBe(true)
  })

  it('runRedTeamItem: invalid runner output -> output null, conservative redFlag true', async () => {
    const badRunner: typeof runRedTeamItem extends never ? never : Parameters<typeof runRedTeamItem>[2] =
      async () => ({ predictedAnswer: '', confidence: 'nope', rationale: '' })
    const res = await runRedTeamItem(
      'item-bad',
      { stem: 'x', options: ['der', 'die'], answer: 'der' },
      badRunner,
    )
    expect(res.output).toBeNull()
    expect(res.validation.ok).toBe(false)
    expect(res.redFlag).toBe(true)
  })

  it('case id and dimension follow the red-team identity', () => {
    const c = buildRedTeamCase('item-x', { stem: 'x' })
    expect(c.caseId).toBe('item-x::redteam_blind')
    expect(c.prompt.dimension).toBe(REDTEAM_DIMENSION)
    expect(c.prompt.reviewer).toBe(REDTEAM_REVIEWER_ID)
  })
})
