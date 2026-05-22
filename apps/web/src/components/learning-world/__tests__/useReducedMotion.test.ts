// Feature: fuxie-learning-world-lab-v0, Property 12: Reduced-motion read defaults to 'reduce'
//
// Vai chinh: QA Automation Engineer
// Vai phoi hop: Frontend Engineer
//
// Spec ref: `.kiro/specs/fuxie-learning-world-lab-v0/requirements.md`
// Requirement 5.6: "IF the Reduced_Motion_Preference cannot be read or
// returns an invalid value, THEN THE Learning_World_Canvas SHALL default
// to treating the preference as `reduce`."
//
// This file exercises the pure helper `resolveReducedMotionPreference`
// from `../useReducedMotion`. The helper is intentionally DOM-free, so
// these tests run in the Vitest `node` environment and never import
// `react-dom`, `jsdom`, `window`, `document`, or any other browser API.
//
// Test plan (mirrors task 10.2):
//
//   - Property 12.1 — coalesced default-safe behaviour: for any reader
//     drawn from a generator that randomly produces (a) thrown errors,
//     (b) `null`/`undefined` returns, or (c) `{ matches: <arbitrary JS
//     value> }` returns, `resolveReducedMotionPreference(reader)` is
//     `'no-preference'` iff the reader returned `{ matches: false }`
//     under strict equality, and `'reduce'` in every other case.
//     ≥100 fast-check iterations.
//
//   - Property 12.2 — thrown readers always default to `'reduce'`,
//     regardless of the thrown value's shape. ≥100 iterations.
//
//   - Property 12.3 — `null` / `undefined` readers always default to
//     `'reduce'`. ≥100 iterations.
//
//   - Property 12.4 — readers returning `{ matches: x }` are
//     `'no-preference'` iff `x === false` (strict literal `false`),
//     otherwise `'reduce'`. ≥100 iterations across boolean / number /
//     NaN / string / null / undefined / object `x` values.
//
// Validates: Requirements 5.6

import fc from 'fast-check'
import { describe, expect, it } from 'vitest'

import {
    resolveReducedMotionPreference,
    type ReducedMotionPreference,
} from '../useReducedMotion'

const NUM_RUNS = 100

// ---------------------------------------------------------------------------
// Generators
// ---------------------------------------------------------------------------

/**
 * Arbitrary JavaScript value the reader's `.matches` property might hold.
 * Includes the literal `false` (the only value that should produce
 * `'no-preference'`) plus a wide range of "invalid" values that must
 * coerce to `'reduce'`.
 */
const arbAnyJsValue: fc.Arbitrary<unknown> = fc.oneof(
    fc.boolean(),
    fc.constant(undefined),
    fc.constant(null),
    fc.constant(Number.NaN),
    fc.constant(Number.POSITIVE_INFINITY),
    fc.constant(Number.NEGATIVE_INFINITY),
    fc.integer(),
    fc.double(),
    fc.string(),
    fc.constantFrom(0, 1, -0, '', 'true', 'false'),
    fc.record({}),
    fc.array(fc.anything(), { maxLength: 3 }),
)

type Reader = () => { matches: unknown } | null | undefined

/** Reader that always throws. The thrown value's shape is randomised. */
const arbThrowingReader: fc.Arbitrary<{
    reader: Reader
    expected: ReducedMotionPreference
}> = fc.string().map((message) => ({
    reader: (() => {
        throw new Error(message)
    }) as Reader,
    expected: 'reduce',
}))

/** Reader that returns `null` or `undefined`. */
const arbNullishReader: fc.Arbitrary<{
    reader: Reader
    expected: ReducedMotionPreference
}> = fc.constantFrom(null, undefined).map((value) => ({
    reader: (() => value) as Reader,
    expected: 'reduce',
}))

/**
 * Reader that returns `{ matches: x }` where `x` is any JS value.
 * Expected output is `'no-preference'` iff `x === false` (strict),
 * else `'reduce'`.
 */
const arbMatchesReader: fc.Arbitrary<{
    reader: Reader
    expected: ReducedMotionPreference
}> = arbAnyJsValue.map((matches) => ({
    reader: (() => ({ matches })) as Reader,
    expected: matches === false ? 'no-preference' : 'reduce',
}))

/** Coalesced reader generator covering all three branches uniformly. */
const arbAnyReader = fc.oneof(
    arbThrowingReader,
    arbNullishReader,
    arbMatchesReader,
)

// ---------------------------------------------------------------------------
// Property 12.1 — coalesced default-safe behaviour (Req 5.6)
// ---------------------------------------------------------------------------

describe('Property 12.1 — resolveReducedMotionPreference defaults to reduce (Req 5.6)', () => {
    it('returns no-preference iff reader yields { matches: false }, else reduce', () => {
        fc.assert(
            fc.property(arbAnyReader, ({ reader, expected }) => {
                expect(resolveReducedMotionPreference(reader)).toBe(expected)
            }),
            { numRuns: NUM_RUNS },
        )
    })
})

// ---------------------------------------------------------------------------
// Property 12.2 — thrown readers default to reduce (Req 5.6)
// ---------------------------------------------------------------------------

describe('Property 12.2 — thrown readers default to reduce (Req 5.6)', () => {
    it('returns reduce when the reader throws, regardless of thrown payload', () => {
        const arbThrownPayload = fc.oneof(
            fc.string().map((m) => new Error(m)),
            fc.string(),
            fc.integer(),
            fc.constant(null),
            fc.constant(undefined),
            fc.record({ message: fc.string() }),
        )

        fc.assert(
            fc.property(arbThrownPayload, (payload) => {
                const reader: Reader = () => {
                    throw payload
                }
                expect(resolveReducedMotionPreference(reader)).toBe('reduce')
            }),
            { numRuns: NUM_RUNS },
        )
    })
})

// ---------------------------------------------------------------------------
// Property 12.3 — null/undefined readers default to reduce (Req 5.6)
// ---------------------------------------------------------------------------

describe('Property 12.3 — null/undefined readers default to reduce (Req 5.6)', () => {
    it('returns reduce when the reader returns null or undefined', () => {
        fc.assert(
            fc.property(fc.constantFrom(null, undefined), (value) => {
                const reader: Reader = () => value
                expect(resolveReducedMotionPreference(reader)).toBe('reduce')
            }),
            { numRuns: NUM_RUNS },
        )
    })
})

// ---------------------------------------------------------------------------
// Property 12.4 — { matches: x } strict-false discriminator (Req 5.6)
// ---------------------------------------------------------------------------

describe('Property 12.4 — { matches: x } discriminator is strict false (Req 5.6)', () => {
    it('returns no-preference iff matches === false (strict), else reduce', () => {
        fc.assert(
            fc.property(arbAnyJsValue, (matches) => {
                const reader: Reader = () => ({ matches })
                const result = resolveReducedMotionPreference(reader)
                if (matches === false) {
                    expect(result).toBe('no-preference')
                } else {
                    expect(result).toBe('reduce')
                }
            }),
            { numRuns: NUM_RUNS },
        )
    })

    it('explicit examples: matches=false → no-preference; falsy non-false → reduce', () => {
        // Strict-false ⇒ no-preference (the only "opt-out" path).
        expect(
            resolveReducedMotionPreference(() => ({ matches: false })),
        ).toBe('no-preference')

        // Every other shape (including missing/non-boolean/falsy) ⇒ reduce.
        const reduceCases: Array<() => { matches: unknown } | null | undefined> = [
            () => ({ matches: true }),
            () => ({ matches: 0 }),
            () => ({ matches: '' }),
            () => ({ matches: null }),
            () => ({ matches: undefined }),
            () => ({ matches: Number.NaN }),
            () => ({ matches: 'false' }),
            () => ({ matches: {} }),
            () => ({ matches: [] }),
            // Object missing the `matches` key entirely.
            () => ({}) as unknown as { matches: unknown },
        ]

        for (const reader of reduceCases) {
            expect(resolveReducedMotionPreference(reader)).toBe('reduce')
        }
    })
})
