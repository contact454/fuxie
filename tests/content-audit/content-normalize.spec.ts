import { describe, it, expect } from 'vitest'
import fc from 'fast-check'
import { normalizeContentRecord, CONTENT_FIELD_MAP } from '../../packages/shared/src/content-schema'

/**
 * Spec `content-read-normalize-shim` (Option C, RB-P2-01).
 *
 * Property 1: Spelling-Agnostic — snake input ≡ camel input.
 * Property 2: Idempotent — normalize² ≡ normalize.
 * Property 3: Value-Invariance + No-Mutation — values preserved, input untouched.
 */

const SNAKE_KEYS = Object.keys(CONTENT_FIELD_MAP)
const CAMEL_OF = CONTENT_FIELD_MAP

// Arbitrary JSON-ish value (no functions/undefined to keep deep-equal clean).
const valueArb: fc.Arbitrary<unknown> = fc.oneof(
  fc.string(),
  fc.integer(),
  fc.boolean(),
  fc.constant(null),
  fc.array(fc.string(), { maxLength: 3 }),
)

// Build a record using snake keys; then a camel twin with identical values.
const fieldSubsetArb = fc.uniqueArray(fc.constantFrom(...SNAKE_KEYS), { maxLength: SNAKE_KEYS.length })

describe('content-schema helpers (pure)', () => {
  it('CONTENT_FIELD_MAP is snake -> camel and frozen', () => {
    expect(Object.isFrozen(CONTENT_FIELD_MAP)).toBe(true)
    for (const [s, c] of Object.entries(CONTENT_FIELD_MAP)) {
      expect(s).toMatch(/_/)
      expect(c).not.toMatch(/_/)
    }
  })

  it('non-object input is returned as-is (no-op)', () => {
    expect(normalizeContentRecord(null as unknown)).toBeNull()
    expect(normalizeContentRecord(42 as unknown)).toBe(42)
    expect(normalizeContentRecord('x' as unknown)).toBe('x')
  })

  it('unknown fields pass through unchanged', () => {
    const r = normalizeContentRecord({ id: 'Q1', answer: 'b', foo: 1 })
    expect(r).toEqual({ id: 'Q1', answer: 'b', foo: 1 })
  })
})

describe('Property 1: Spelling-Agnostic', () => {
  it('snake input normalizes equal to camel-twin input', () => {
    fc.assert(
      fc.property(fieldSubsetArb, fc.array(valueArb, { minLength: 0, maxLength: SNAKE_KEYS.length }), (keys, vals) => {
        const snake: Record<string, unknown> = {}
        const camel: Record<string, unknown> = {}
        keys.forEach((k, i) => {
          const v = vals[i % Math.max(vals.length, 1)] ?? i
          snake[k] = v
          camel[CAMEL_OF[k]] = v
        })
        expect(normalizeContentRecord(snake)).toEqual(normalizeContentRecord(camel))
      }),
      { numRuns: 100 },
    )
  })
})

describe('Property 2: Idempotent', () => {
  it('normalize(normalize(x)) deep-equals normalize(x)', () => {
    fc.assert(
      fc.property(fieldSubsetArb, fc.array(valueArb, { maxLength: SNAKE_KEYS.length }), (keys, vals) => {
        const x: Record<string, unknown> = { id: 'Q', extra: 'keep' }
        keys.forEach((k, i) => { x[k] = vals[i % Math.max(vals.length, 1)] ?? i })
        const once = normalizeContentRecord(x)
        const twice = normalizeContentRecord(once)
        expect(twice).toEqual(once)
      }),
      { numRuns: 100 },
    )
  })
})

describe('Property 3: Value-Invariance + No-Mutation', () => {
  it('values are preserved (only keys may change) and input is not mutated', () => {
    fc.assert(
      fc.property(fieldSubsetArb, fc.array(valueArb, { maxLength: SNAKE_KEYS.length }), (keys, vals) => {
        const input: Record<string, unknown> = {}
        keys.forEach((k, i) => { input[k] = vals[i % Math.max(vals.length, 1)] ?? i })
        const snapshot = JSON.parse(JSON.stringify(input))
        const out = normalizeContentRecord(input)
        // input untouched
        expect(input).toEqual(snapshot)
        // every value present in output under camel key with same value
        for (const k of keys) {
          const camel = CAMEL_OF[k]
          expect(out[camel]).toEqual(input[k])
        }
      }),
      { numRuns: 100 },
    )
  })

  it('camel wins when both spellings present', () => {
    const r = normalizeContentRecord({ word_count: 1, wordCount: 2 })
    expect(r.wordCount).toBe(2)
    expect('word_count' in r).toBe(false)
  })

  it('nested metadata/scoring/explanation normalized one level', () => {
    const r = normalizeContentRecord({
      metadata: { target_grammar: ['Präsens'], word_count: 50 },
      scoring: { total_points: 5, pass_threshold: 3 },
      explanation: { key_evidence: 'abc', de: 'x' },
    })
    expect((r.metadata as any).targetGrammar).toEqual(['Präsens'])
    expect((r.metadata as any).wordCount).toBe(50)
    expect((r.scoring as any).totalPoints).toBe(5)
    expect((r.scoring as any).passThreshold).toBe(3)
    expect((r.explanation as any).keyEvidence).toBe('abc')
    expect((r.explanation as any).de).toBe('x')
  })
})
