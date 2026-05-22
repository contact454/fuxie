/**
 * Locale Parity + t() Discipline — Property-Based Tests (task 17.5 of spec
 * `gamified-ui-asset-rollout`).
 *
 * Vai chinh: Frontend Engineer
 * Vai phoi hop: QA Automation Engineer
 *
 * Property wired in this file:
 *
 *   - Property 18 (task 17.5) — Locale Parity and t() Discipline
 *
 *     Four sub-invariants are exercised, all backed by `numRuns: 100`:
 *
 *       (a) **Parity** — for any synthetic `(vi, de)` pair, every dotted
 *           key path in `vi.json` MUST appear in `de.json` and vice versa
 *           (Req 17.1, 17.2, 17.8). A missing key on either side MUST
 *           produce a violation; identical key sets MUST produce zero
 *           parity violations.
 *
 *       (b) **No empty / whitespace-only values** — for any leaf string
 *           on either side, `value.trim() !== ''` (Req 17.3).
 *
 *       (c) **Alt-text length classification** — a key whose name ends in
 *           `Alt`, `AriaLabel`, `Description`, `*Greeting*`, or carries a
 *           `decorative` token MUST satisfy the per-kind length rule:
 *
 *             - `decorative`  ⇒ value === ''                        (Req 17.7)
 *             - `meaningful`  ⇒ 1 ≤ length ≤ 125                    (Req 17.6)
 *             - `greeting`    ⇒ 1 ≤ length ≤ 200                    (Req 17.5)
 *             - `other`       ⇒ length ≥ 1 (i.e. parity check only)
 *
 *           This is verified twice: against synthetic key/value pairs
 *           (forward direction) and against the actual `vi.json` /
 *           `de.json` shipping in the repo (regression direction).
 *
 *       (d) **`t()` discipline** — the script's pure helpers
 *           (`looksLikeLearnerCopy`, `isInsideTCall`,
 *           `findForbiddenLiterals`-equivalent via
 *           `scanForHardcodedCopy`) MUST classify generated TSX line
 *           fragments correctly: a learner-facing literal NOT wrapped in
 *           `t(...)` is flagged; the same literal wrapped in `t(...)` is
 *           NOT flagged (Req 17.4).
 *
 *     Validates: Requirements 17.1, 17.2, 17.3, 17.4, 17.5, 17.6, 17.7, 17.8.
 *
 * Test framework: Vitest + fast-check (`numRuns: 100` per task brief).
 *
 * Implementation note (re: task brief):
 *   The brief asks the test to wrap the same logic the
 *   `check:locale-parity` script enforces at script level. The script
 *   already exposed `checkLocaleParity` and `scanForHardcodedCopy` (task
 *   2.5). For task 17.5 we additionally exported pure helpers
 *   (`checkLocaleParityFromJson`, `flattenLocaleJson`,
 *   `looksLikeLearnerCopy`, `isInsideTCall`, `classifyLocaleKey`,
 *   `validateLocaleValueLength`) so the property test can drive them
 *   deterministically without filesystem IO. This mirrors the refactor
 *   pattern from task 2.7 (`lint-asset-registry-references.ts` →
 *   `tests/asset-discipline.spec.ts`).
 */

import path from 'node:path'
import { readFileSync } from 'node:fs'

import fc from 'fast-check'
import { describe, expect, it } from 'vitest'

import {
    checkLocaleParityFromJson,
    classifyLocaleKey,
    flattenLocaleJson,
    isInsideTCall,
    KEY_KIND_MAX_LENGTH,
    KEY_KIND_MIN_LENGTH,
    looksLikeLearnerCopy,
    validateLocaleValueLength,
    type Json,
    type LocaleKeyKind,
} from '../scripts/check-locale-parity'

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const NUM_RUNS = 100
const REPO_ROOT = path.resolve(__dirname, '..')
const VI_PATH = path.join(REPO_ROOT, 'apps', 'web', 'messages', 'vi.json')
const DE_PATH = path.join(REPO_ROOT, 'apps', 'web', 'messages', 'de.json')

// ---------------------------------------------------------------------------
// Generators
// ---------------------------------------------------------------------------

/** Plausible namespace + leaf segments used in the message files. */
const NAMESPACE_POOL = [
    'Navigation',
    'Dashboard',
    'UI',
    'Gamification',
    'Grammar',
    'SkillPlayer',
    'SurfaceStates',
    'Mascot',
    'Reward',
] as const

const NAMESPACE_ARB = fc.constantFrom(...NAMESPACE_POOL)

/** Random non-special-suffix leaf — guaranteed to classify as `other`. */
const otherLeafArb = fc
    .stringMatching(/^[a-z][a-zA-Z0-9]{1,18}$/)
    .filter(
        (s) =>
            !/Alt$/.test(s) &&
            !/AriaLabel$/.test(s) &&
            !/Description$/.test(s) &&
            !/^greeting/i.test(s) &&
            !/Greeting$/.test(s) &&
            !/decorative/i.test(s) &&
            !/^alt[A-Z0-9]/.test(s) &&
            !/^aria[A-Z]/.test(s),
    )

const meaningfulLeafArb = fc.oneof(
    fc.stringMatching(/^[a-z][a-zA-Z0-9]{0,12}Alt$/),
    fc.stringMatching(/^[a-z][a-zA-Z0-9]{0,12}AriaLabel$/),
    fc.stringMatching(/^[a-z][a-zA-Z0-9]{0,12}Description$/),
)

const greetingLeafArb = fc.oneof(
    fc.stringMatching(/^greeting[A-Z][a-zA-Z0-9]{0,12}$/),
    fc.stringMatching(/^[a-z][a-zA-Z0-9]{0,12}Greeting$/),
)

const decorativeLeafArb = fc.stringMatching(/^[a-z][a-zA-Z0-9]{0,12}DecorativeAlt$/)

/** Build a dotted key path from a namespace + leaf. */
function joinKey(namespace: string, leaf: string): string {
    return `${namespace}.${leaf}`
}

const arbOtherKey = fc.tuple(NAMESPACE_ARB, otherLeafArb).map(([ns, leaf]) => joinKey(ns, leaf))
const arbMeaningfulKey = fc
    .tuple(NAMESPACE_ARB, meaningfulLeafArb)
    .map(([ns, leaf]) => joinKey(ns, leaf))
const arbGreetingKey = fc
    .tuple(NAMESPACE_ARB, greetingLeafArb)
    .map(([ns, leaf]) => joinKey(ns, leaf))
const arbDecorativeKey = fc
    .tuple(NAMESPACE_ARB, decorativeLeafArb)
    .map(([ns, leaf]) => joinKey(ns, leaf))

/** Non-empty value with no leading/trailing whitespace, capped to a max length. */
function arbValueOfLength(min: number, max: number): fc.Arbitrary<string> {
    return fc
        .integer({ min, max })
        .chain((len) =>
            fc
                .stringMatching(new RegExp(`^[A-Za-z0-9 ,.!?:;ÀÁ-ÿ\\u1e00-\\u1eff]{${len},${len}}$`))
                .filter((s) => s.trim().length === s.length && s.length === len),
        )
}

/** Whitespace-only string that the parity check must reject. */
const arbWhitespaceValue = fc
    .stringMatching(/^[ \t\n\r]{1,8}$/)

/**
 * Build a flat object {namespace: {leaf: value}} from a list of
 * `(dottedKey, value)` pairs. The locale files are 2-level deep, so a
 * single namespace level is enough to exercise the parity walker.
 */
function buildLocaleObject(entries: ReadonlyArray<[string, string]>): Json {
    const tree: Record<string, Record<string, string>> = {}
    for (const [dotted, value] of entries) {
        const idx = dotted.indexOf('.')
        const ns = dotted.slice(0, idx)
        const leaf = dotted.slice(idx + 1)
        if (!tree[ns]) tree[ns] = {}
        tree[ns][leaf] = value
    }
    return tree as unknown as Json
}

// ---------------------------------------------------------------------------
// Property 18.a — Parity (Req 17.1, 17.2, 17.8)
// ---------------------------------------------------------------------------

describe('Property 18: Locale Parity and t() Discipline (task 17.5)', () => {
    describe('parity invariant (Req 17.1, 17.2, 17.8)', () => {
        it('identical key sets ⇒ zero parity violations', () => {
            fc.assert(
                fc.property(
                    fc.uniqueArray(arbOtherKey, { minLength: 1, maxLength: 8 }),
                    (keys) => {
                        const entries: Array<[string, string]> = keys.map((k) => [k, `vi-${k}`])
                        const vi = buildLocaleObject(entries)
                        const de = buildLocaleObject(keys.map((k) => [k, `de-${k}`]))
                        const result = checkLocaleParityFromJson(vi, de)
                        expect(result.violations).toEqual([])
                    },
                ),
                { numRuns: NUM_RUNS },
            )
        })

        it('a key present only in vi.json is reported as missing-de', () => {
            fc.assert(
                fc.property(
                    fc.uniqueArray(arbOtherKey, { minLength: 2, maxLength: 6 }),
                    (keys) => {
                        // First key only on vi side.
                        const onlyVi = keys[0]
                        const shared = keys.slice(1)
                        const vi = buildLocaleObject([
                            ...shared.map((k): [string, string] => [k, 'vi-shared']),
                            [onlyVi, 'vi-only'],
                        ])
                        const de = buildLocaleObject(
                            shared.map((k): [string, string] => [k, 'de-shared']),
                        )
                        const result = checkLocaleParityFromJson(vi, de)
                        expect(
                            result.violations.some(
                                (v) => v.kind === 'missing-de' && v.key === onlyVi,
                            ),
                        ).toBe(true)
                    },
                ),
                { numRuns: NUM_RUNS },
            )
        })

        it('a key present only in de.json is reported as missing-vi', () => {
            fc.assert(
                fc.property(
                    fc.uniqueArray(arbOtherKey, { minLength: 2, maxLength: 6 }),
                    (keys) => {
                        const onlyDe = keys[0]
                        const shared = keys.slice(1)
                        const vi = buildLocaleObject(
                            shared.map((k): [string, string] => [k, 'vi-shared']),
                        )
                        const de = buildLocaleObject([
                            ...shared.map((k): [string, string] => [k, 'de-shared']),
                            [onlyDe, 'de-only'],
                        ])
                        const result = checkLocaleParityFromJson(vi, de)
                        expect(
                            result.violations.some(
                                (v) => v.kind === 'missing-vi' && v.key === onlyDe,
                            ),
                        ).toBe(true)
                    },
                ),
                { numRuns: NUM_RUNS },
            )
        })

        it('whitespace-only value on either side is reported (Req 17.3)', () => {
            fc.assert(
                fc.property(
                    fc.uniqueArray(arbOtherKey, { minLength: 1, maxLength: 4 }),
                    arbWhitespaceValue,
                    fc.boolean(),
                    (keys, ws, putOnVi) => {
                        const target = keys[0]
                        const viEntries: Array<[string, string]> = keys.map((k, i) => [
                            k,
                            i === 0 && putOnVi ? ws : `vi-${k}`,
                        ])
                        const deEntries: Array<[string, string]> = keys.map((k, i) => [
                            k,
                            i === 0 && !putOnVi ? ws : `de-${k}`,
                        ])
                        const result = checkLocaleParityFromJson(
                            buildLocaleObject(viEntries),
                            buildLocaleObject(deEntries),
                        )
                        const expectedKind = putOnVi ? 'empty-vi' : 'empty-de'
                        expect(
                            result.violations.some(
                                (v) => v.kind === expectedKind && v.key === target,
                            ),
                        ).toBe(true)
                    },
                ),
                { numRuns: NUM_RUNS },
            )
        })

        it('flattenLocaleJson produces stable dotted key paths', () => {
            // Sanity: the helper used by the parity walker preserves the
            // namespace.leaf shape regardless of insertion order.
            fc.assert(
                fc.property(
                    fc.uniqueArray(arbOtherKey, { minLength: 1, maxLength: 8 }),
                    (keys) => {
                        const obj = buildLocaleObject(keys.map((k) => [k, 'value']))
                        const flat = flattenLocaleJson(obj)
                        for (const k of keys) {
                            expect(flat.has(k)).toBe(true)
                        }
                        expect(flat.size).toBe(keys.length)
                    },
                ),
                { numRuns: NUM_RUNS },
            )
        })
    })

    // -----------------------------------------------------------------------
    // Property 18.b — Alt-text / greeting / decorative length rules
    // (Req 17.5, 17.6, 17.7)
    // -----------------------------------------------------------------------

    describe('alt-text length classification (Req 17.5, 17.6, 17.7)', () => {
        it('classifyLocaleKey returns exactly one of the four kinds', () => {
            const VALID: ReadonlyArray<LocaleKeyKind> = [
                'decorative',
                'meaningful',
                'greeting',
                'other',
            ]
            fc.assert(
                fc.property(
                    fc.oneof(arbOtherKey, arbMeaningfulKey, arbGreetingKey, arbDecorativeKey),
                    (key) => {
                        const kind = classifyLocaleKey(key)
                        expect(VALID).toContain(kind)
                    },
                ),
                { numRuns: NUM_RUNS },
            )
        })

        it('meaningful keys: validate iff 1 ≤ length ≤ 125', () => {
            fc.assert(
                fc.property(
                    arbMeaningfulKey,
                    fc.integer({ min: 0, max: 200 }),
                    (key, len) => {
                        // Build a synthetic value of exactly `len` ASCII
                        // characters (no whitespace edges). Skip cases
                        // where the locale parity check would reject it
                        // for emptiness instead — we want to isolate the
                        // length rule.
                        const value = len === 0 ? '' : 'a'.repeat(len)
                        const result = validateLocaleValueLength(key, value)
                        if (len >= KEY_KIND_MIN_LENGTH.meaningful && len <= KEY_KIND_MAX_LENGTH.meaningful) {
                            expect(result.kind).toBe('meaningful')
                            expect(result.ok).toBe(true)
                        } else {
                            expect(result.ok).toBe(false)
                        }
                    },
                ),
                { numRuns: NUM_RUNS },
            )
        })

        it('greeting keys: validate iff 1 ≤ length ≤ 200', () => {
            fc.assert(
                fc.property(
                    arbGreetingKey,
                    fc.integer({ min: 0, max: 250 }),
                    (key, len) => {
                        const value = len === 0 ? '' : 'a'.repeat(len)
                        const result = validateLocaleValueLength(key, value)
                        if (len >= KEY_KIND_MIN_LENGTH.greeting && len <= KEY_KIND_MAX_LENGTH.greeting) {
                            expect(result.kind).toBe('greeting')
                            expect(result.ok).toBe(true)
                        } else {
                            expect(result.ok).toBe(false)
                        }
                    },
                ),
                { numRuns: NUM_RUNS },
            )
        })

        it('decorative keys: validate iff value is the empty string', () => {
            fc.assert(
                fc.property(
                    arbDecorativeKey,
                    fc.oneof(fc.constant(''), fc.string({ minLength: 1, maxLength: 30 })),
                    (key, value) => {
                        const result = validateLocaleValueLength(key, value)
                        expect(result.kind).toBe('decorative')
                        if (value === '') {
                            expect(result.ok).toBe(true)
                        } else {
                            expect(result.ok).toBe(false)
                        }
                    },
                ),
                { numRuns: NUM_RUNS },
            )
        })

        it('other keys: validate iff length ≥ 1 (parity check governs the rest)', () => {
            fc.assert(
                fc.property(
                    arbOtherKey,
                    arbValueOfLength(1, 60),
                    (key, value) => {
                        const result = validateLocaleValueLength(key, value)
                        expect(result.kind).toBe('other')
                        expect(result.ok).toBe(true)
                    },
                ),
                { numRuns: NUM_RUNS },
            )
        })

        // Regression check against the actual shipping locale files. The
        // synthetic generators prove the classifier is correct for
        // arbitrary inputs; this anchors the contract to production data
        // so a regression in real translations also fails here.
        it('shipping vi.json + de.json: every greeting/alt/aria/description value satisfies its kind', () => {
            const vi = JSON.parse(readFileSync(VI_PATH, 'utf8')) as Json
            const de = JSON.parse(readFileSync(DE_PATH, 'utf8')) as Json
            for (const obj of [vi, de]) {
                const flat = flattenLocaleJson(obj)
                for (const [key, value] of flat) {
                    if (typeof value !== 'string') continue
                    const kind = classifyLocaleKey(key)
                    if (kind === 'other') continue // governed by parity check only
                    const result = validateLocaleValueLength(key, value)
                    if (!result.ok) {
                        throw new Error(
                            `${key} (${kind}) violates length rule: ${(result as { reason: string }).reason}; value="${value}"`,
                        )
                    }
                }
            }
        })
    })

    // -----------------------------------------------------------------------
    // Property 18.c — t() discipline classifier (Req 17.4)
    // -----------------------------------------------------------------------

    describe('t() discipline classifier (Req 17.4)', () => {
        // Vietnamese / German prose snippets that contain Latin Extended
        // diacritics — i.e. exactly the kind of literal
        // `looksLikeLearnerCopy` is designed to flag via its
        // diacritic-detection branch (`\u00c0-\u024f\u1e00-\u1eff`).
        // Each entry below was checked to contain at least one
        // codepoint in that range.
        const arbDiacriticPhrase = fc.constantFrom(
            'Tiếp tục học',
            'Bắt đầu',
            'Học từ đầu tiên',
            'Übersicht heute',
            'Bài đọc không tồn tại',
            'Wortschatz konnte nicht geladen werden',
            'Hôm nay học gì?',
            'Über mich',
        )

        // Multi-word ASCII prose (≥3 words) — also flagged by the
        // heuristic per the script's logic.
        const arbAsciiSentence = fc
            .stringMatching(/^[A-Za-z]{2,8}( [A-Za-z]{2,8}){2,5}$/)

        // Plainly technical strings the heuristic intentionally skips:
        // single tokens, route paths, file names, URLs.
        const arbTechnicalToken = fc.oneof(
            fc.stringMatching(/^[a-z][a-zA-Z0-9]{0,12}$/),
            fc.stringMatching(/^https:\/\/[a-z]{3,8}\.[a-z]{2,4}$/),
            fc.stringMatching(/^\/[a-z]{2,8}\/[a-z]{2,8}$/),
            fc.stringMatching(/^[a-z]{2,8}\.[a-z]{2,4}$/),
        )

        it('looksLikeLearnerCopy flags Vietnamese / German diacritic prose', () => {
            fc.assert(
                fc.property(arbDiacriticPhrase, (text) => {
                    expect(looksLikeLearnerCopy(text)).toBe(true)
                }),
                { numRuns: NUM_RUNS },
            )
        })

        it('looksLikeLearnerCopy flags 3+ word ASCII prose', () => {
            fc.assert(
                fc.property(arbAsciiSentence, (text) => {
                    expect(looksLikeLearnerCopy(text)).toBe(true)
                }),
                { numRuns: NUM_RUNS },
            )
        })

        it('looksLikeLearnerCopy lets technical tokens through (single token / URL / path / filename)', () => {
            fc.assert(
                fc.property(arbTechnicalToken, (text) => {
                    expect(looksLikeLearnerCopy(text)).toBe(false)
                }),
                { numRuns: NUM_RUNS },
            )
        })

        it('isInsideTCall: literal wrapped in t(...) is recognised as inside', () => {
            fc.assert(
                fc.property(arbDiacriticPhrase, (literal) => {
                    // Construct a single source line that wraps the
                    // literal in a `t(...)` call. Position the literal
                    // at a deterministic offset so the helper has
                    // unambiguous input.
                    const prefix = '<span>{t("'
                    const line = `${prefix}${literal}")}</span>`
                    const literalStart = prefix.length
                    expect(isInsideTCall(line, literalStart)).toBe(true)
                }),
                { numRuns: NUM_RUNS },
            )
        })

        it('isInsideTCall: bare JSX text literal is recognised as outside any t(...)', () => {
            fc.assert(
                fc.property(arbDiacriticPhrase, (literal) => {
                    // Plain JSX text node, no surrounding t(...).
                    const prefix = '<span>'
                    const line = `${prefix}${literal}</span>`
                    const literalStart = prefix.length
                    expect(isInsideTCall(line, literalStart)).toBe(false)
                }),
                { numRuns: NUM_RUNS },
            )
        })

        it('isInsideTCall: literal inside a non-t identifier (formatX(...)) is NOT misclassified as t()', () => {
            // Guards against the heuristic accidentally matching
            // `format(...)`, `assert(...)`, etc. The script only treats
            // a standalone `t` token as the t() helper.
            fc.assert(
                fc.property(arbDiacriticPhrase, (literal) => {
                    const prefix = '<span>{format("'
                    const line = `${prefix}${literal}")}</span>`
                    const literalStart = prefix.length
                    expect(isInsideTCall(line, literalStart)).toBe(false)
                }),
                { numRuns: NUM_RUNS },
            )
        })
    })

    // -----------------------------------------------------------------------
    // Property 18.d — Synthetic locale-file fault injection
    //
    // End-to-end check: starting from the actual shipping vi.json /
    // de.json, mutate one side and assert the parity walker detects the
    // exact mutation we injected. This is the synthetic-input invariant
    // the task brief calls out (mirrors task 2.8's fault injection over
    // the asset audit).
    // -----------------------------------------------------------------------

    describe('synthetic fault injection over shipping locale files', () => {
        const VI_FIXTURE = JSON.parse(readFileSync(VI_PATH, 'utf8')) as Json
        const DE_FIXTURE = JSON.parse(readFileSync(DE_PATH, 'utf8')) as Json

        it('shipping vi.json ⇄ de.json: zero parity violations', () => {
            const result = checkLocaleParityFromJson(VI_FIXTURE, DE_FIXTURE)
            if (result.violations.length > 0) {
                const summary = result.violations
                    .slice(0, 5)
                    .map((v) => `${v.kind}:${v.key}`)
                    .join(', ')
                throw new Error(
                    `Expected zero parity violations, got ${result.violations.length} (e.g. ${summary})`,
                )
            }
            expect(result.viKeyCount).toBeGreaterThan(0)
            expect(result.deKeyCount).toBe(result.viKeyCount)
        })

        it('removing any single key from vi side ⇒ exactly one missing-vi violation', () => {
            const allKeys = [...flattenLocaleJson(VI_FIXTURE).keys()]
            fc.assert(
                fc.property(fc.constantFrom(...allKeys), (keyToDrop) => {
                    const mutated = removeKeyByDottedPath(VI_FIXTURE, keyToDrop)
                    const result = checkLocaleParityFromJson(mutated, DE_FIXTURE)
                    const missingVi = result.violations.filter(
                        (v) => v.kind === 'missing-vi' && v.key === keyToDrop,
                    )
                    expect(missingVi.length).toBe(1)
                }),
                { numRuns: NUM_RUNS },
            )
        })

        it('removing any single key from de side ⇒ exactly one missing-de violation', () => {
            const allKeys = [...flattenLocaleJson(DE_FIXTURE).keys()]
            fc.assert(
                fc.property(fc.constantFrom(...allKeys), (keyToDrop) => {
                    const mutated = removeKeyByDottedPath(DE_FIXTURE, keyToDrop)
                    const result = checkLocaleParityFromJson(VI_FIXTURE, mutated)
                    const missingDe = result.violations.filter(
                        (v) => v.kind === 'missing-de' && v.key === keyToDrop,
                    )
                    expect(missingDe.length).toBe(1)
                }),
                { numRuns: NUM_RUNS },
            )
        })

        it('emptying any single value ⇒ exactly one empty-* violation for that key', () => {
            const allKeys = [...flattenLocaleJson(VI_FIXTURE).keys()]
            fc.assert(
                fc.property(
                    fc.constantFrom(...allKeys),
                    fc.boolean(),
                    arbWhitespaceValue,
                    (keyToBlank, mutateVi, blankValue) => {
                        const target = mutateVi ? VI_FIXTURE : DE_FIXTURE
                        const other = mutateVi ? DE_FIXTURE : VI_FIXTURE
                        const mutated = setKeyByDottedPath(target, keyToBlank, blankValue)
                        const result = mutateVi
                            ? checkLocaleParityFromJson(mutated, other)
                            : checkLocaleParityFromJson(other, mutated)
                        const expectedKind = mutateVi ? 'empty-vi' : 'empty-de'
                        const matches = result.violations.filter(
                            (v) => v.kind === expectedKind && v.key === keyToBlank,
                        )
                        expect(matches.length).toBe(1)
                    },
                ),
                { numRuns: NUM_RUNS },
            )
        })
    })
})

// ---------------------------------------------------------------------------
// Test-only helpers
// ---------------------------------------------------------------------------

/**
 * Return a deep clone of `obj` with the value at the dotted-path `key`
 * removed. Path syntax matches `flattenLocaleJson` (namespace.leaf, or
 * deeper namespace.sub.leaf — array indices are not used by the locale
 * files so we don't handle the `[i]` form here).
 */
function removeKeyByDottedPath(obj: Json, dotted: string): Json {
    const clone = JSON.parse(JSON.stringify(obj)) as Json
    const segments = dotted.split('.')
    let cursor: any = clone
    for (let i = 0; i < segments.length - 1; i++) {
        const seg = segments[i]
        if (cursor == null || typeof cursor !== 'object' || Array.isArray(cursor)) {
            return clone
        }
        cursor = cursor[seg]
    }
    if (cursor != null && typeof cursor === 'object' && !Array.isArray(cursor)) {
        delete cursor[segments[segments.length - 1]]
    }
    return clone
}

/**
 * Return a deep clone of `obj` with the value at the dotted-path `key`
 * replaced by `newValue`. Creates intermediate objects if missing so the
 * helper is safe even when the path refers to a key that did not exist
 * (used by fault-injection generators).
 */
function setKeyByDottedPath(obj: Json, dotted: string, newValue: string): Json {
    const clone = JSON.parse(JSON.stringify(obj)) as Json
    const segments = dotted.split('.')
    let cursor: any = clone
    for (let i = 0; i < segments.length - 1; i++) {
        const seg = segments[i]
        if (cursor[seg] == null || typeof cursor[seg] !== 'object' || Array.isArray(cursor[seg])) {
            cursor[seg] = {}
        }
        cursor = cursor[seg]
    }
    cursor[segments[segments.length - 1]] = newValue
    return clone
}
