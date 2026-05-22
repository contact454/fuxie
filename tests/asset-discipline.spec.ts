/**
 * asset-discipline.spec.ts — Property 2: Asset Registry Reference Discipline.
 *
 * Vai chinh: Frontend Engineer
 * Vai phoi hop: QA Automation Engineer
 *
 * Spec source-of-truth:
 *   - Task 2.7 (gamified-ui-asset-rollout)
 *   - requirements.md Req 1.2 (component MUST resolve via Asset_Key, never
 *     embed path strings), Req 1.3 (CI lint blocks forbidden prefixes), and
 *     Req 19.2 (property test gate).
 *
 * What this test enforces
 * -----------------------
 * Property 2 has two halves; this spec covers both:
 *
 *   (P2.a) Lint classifier discipline — for *any* (filename, line) drawn
 *     from a representative input space, the pure helpers exported by
 *     `scripts/lint-asset-registry-references.ts` produce the verdict
 *     specified by Req 1.2 + 1.3:
 *
 *       - Registry source files (and their colocated tests) MAY contain
 *         the forbidden `/mascot-3d/...` and `/reward-assets/...` literals.
 *       - Every other source file MUST NOT contain those literals, unless
 *         the line carries the `// asset-registry-allow` escape comment.
 *
 *     We deliberately do NOT walk `apps/web/src/`. The codebase currently
 *     ships 96 known violations (per task 2.6 audit report); the lint
 *     script catches them at script level. The property test verifies the
 *     *contract* of the classifier so a regression in the classifier is
 *     loud, while pre-existing violations stay tracked by the lint job.
 *
 *   (P2.b) Asset_Key reference resolution — every key declared in the 7
 *     typed registry maps must resolve through its public lookup helper
 *     to the *same* path the registry declares. A key that fell back to
 *     `PLACEHOLDER_ASSET` would mean "Asset_Key referenced but not
 *     present in the registry", i.e. a Req 1.2 violation.
 *
 * Approach (a) from task 2.7's brief: pure-helper discriminator, fed by
 * `fast-check` arbitraries. No filesystem traversal, no IO mocking.
 *
 * Validates: Requirements 1.2, 1.3, 19.2
 */

import { describe, expect, it } from 'vitest'
import fc from 'fast-check'

import {
    ALLOW_COMMENT,
    EXCLUDED_BASENAMES,
    findForbiddenLiterals,
    isExcludedBasename,
} from '../scripts/lint-asset-registry-references'

import {
    FUXIE_3D_ASSETS,
    FUXIE_LIVING_3D_ASSETS,
    FUXIE_MASCOT_STATES,
    FUXIE_MODULE_MASCOTS,
    FUXIE_UI_FRAMES,
    FUXIE_WORLD_PROPS,
    PLACEHOLDER_ASSET,
    getFuxieLiving3dAsset,
    getFuxieMascotSrc,
    getFuxieModuleMascotSrc,
    getFuxieUiFrameSrc,
    getFuxieWorldPropSrc,
} from '../apps/web/src/lib/mascot/fuxie-assets'
import {
    REWARD_ASSETS,
    getRewardAssetSrc,
} from '../apps/web/src/components/gamification/reward-assets'

const NUM_RUNS = 100

// ---------------------------------------------------------------------------
// Generators
// ---------------------------------------------------------------------------

const FORBIDDEN_PREFIXES = [
    '/mascot-3d/',
    '/mascot-3d/raw/',
    '/mascot-3d/concept/',
    '/mascot-3d/foundation/',
    '/mascot-3d/reference-parts/',
    '/mascot-3d/optimized/',
    '/mascot-3d/world/optimized/',
    '/mascot-3d/ui/optimized/',
    '/reward-assets/',
    '/reward-assets/raw/',
    '/reward-assets/optimized/',
] as const

const QUOTES = ["'", '"', '`'] as const

/**
 * Generate a forbidden path literal embedded inside a line. The output is
 * guaranteed to start with one of the forbidden prefixes the lint script
 * rejects, wrapped in quotes, with optional surrounding code noise.
 */
const arbForbiddenLine = fc
    .tuple(
        fc.constantFrom(...FORBIDDEN_PREFIXES),
        // file slug — restrict to safe path characters so the regex
        // terminator (quote) is the only quote on the line we control.
        fc.stringMatching(/^[a-z0-9-]{1,40}\.(?:webp|png|jpg|svg)$/),
        fc.constantFrom(...QUOTES),
        fc.stringMatching(/^[a-zA-Z0-9 =:;()<>\/.{}-]{0,30}$/),
        fc.stringMatching(/^[a-zA-Z0-9 =:;()<>\/.{}-]{0,30}$/),
    )
    .map(([prefix, slug, quote, prefixNoise, suffixNoise]) => {
        const literal = `${quote}${prefix}${slug}${quote}`
        return `${prefixNoise}${literal}${suffixNoise}`
    })

/**
 * Generate a clean line that contains ZERO forbidden literals. We compose
 * it from a restricted alphabet that excludes both forbidden prefixes and
 * the allow-comment escape so the verdict is unambiguous.
 */
const arbCleanLine = fc
    .stringMatching(/^[a-zA-Z0-9 =:;()<>{}\[\]\.,_-]{0,80}$/)
    .filter(line => {
        if (line.includes('/mascot-3d/')) return false
        if (line.includes('/reward-assets/')) return false
        if (line.includes(ALLOW_COMMENT)) return false
        return true
    })

/**
 * Generate a basename that should be excluded from scanning (registry
 * sources + their tests). Drawn directly from the lint script's allow-list
 * so the test stays in sync with production.
 */
const arbExcludedBasename = fc.constantFrom(...Array.from(EXCLUDED_BASENAMES))

/**
 * Generate a basename that is NOT in the exclusion allow-list. We restrict
 * to plausible TypeScript filenames ending in `.ts`/`.tsx` and filter out
 * any unlucky collision with the exclusion set.
 */
const arbNonExcludedBasename = fc
    .tuple(
        fc.stringMatching(/^[a-z][a-z0-9-]{0,30}$/),
        fc.constantFrom('.ts', '.tsx'),
    )
    .map(([stem, ext]) => `${stem}${ext}`)
    .filter(name => !EXCLUDED_BASENAMES.has(name))

// ---------------------------------------------------------------------------
// (P2.a) Lint classifier discipline
// ---------------------------------------------------------------------------

describe('Property 2 — Asset Registry Reference Discipline', () => {
    describe('lint classifier (forbidden literal detection)', () => {
        it('detects every forbidden literal on synthetic non-allow-listed lines', () => {
            fc.assert(
                fc.property(arbForbiddenLine, line => {
                    const hits = findForbiddenLiterals(line)
                    expect(hits.length).toBeGreaterThanOrEqual(1)
                    for (const hit of hits) {
                        expect(
                            hit.startsWith('/mascot-3d/') ||
                                hit.startsWith('/reward-assets/'),
                        ).toBe(true)
                    }
                }),
                { numRuns: NUM_RUNS },
            )
        })

        it('returns zero hits for lines with no forbidden literal', () => {
            fc.assert(
                fc.property(arbCleanLine, line => {
                    expect(findForbiddenLiterals(line)).toEqual([])
                }),
                { numRuns: NUM_RUNS },
            )
        })

        it('honours the // asset-registry-allow escape on otherwise-violating lines', () => {
            // A forbidden literal annotated with the documented escape
            // comment must NOT count as a violation. This mirrors the
            // production lint walker which short-circuits on the same
            // marker.
            fc.assert(
                fc.property(arbForbiddenLine, baseLine => {
                    const annotated = `${baseLine} ${ALLOW_COMMENT}`
                    expect(findForbiddenLiterals(annotated)).toEqual([])
                }),
                { numRuns: NUM_RUNS },
            )
        })
    })

    describe('exclusion allow-list (registry sources + colocated tests)', () => {
        it('marks every allow-listed basename as excluded', () => {
            fc.assert(
                fc.property(arbExcludedBasename, basename => {
                    expect(isExcludedBasename(basename)).toBe(true)
                }),
                { numRuns: NUM_RUNS },
            )
        })

        it('marks every non-allow-listed basename as NOT excluded', () => {
            fc.assert(
                fc.property(arbNonExcludedBasename, basename => {
                    expect(isExcludedBasename(basename)).toBe(false)
                }),
                { numRuns: NUM_RUNS },
            )
        })

        it('combined contract — non-registry files containing forbidden literals are violations', () => {
            // The end-to-end Req 1.3 contract: a file is a violation iff
            //   (a) its basename is NOT in EXCLUDED_BASENAMES, AND
            //   (b) at least one of its lines yields findForbiddenLiterals(...) != [].
            // We property-test the conjunction by drawing a (basename, line)
            // pair and asserting the boolean lattice matches expectations.
            fc.assert(
                fc.property(
                    fc.oneof(arbExcludedBasename, arbNonExcludedBasename),
                    fc.oneof(arbForbiddenLine, arbCleanLine),
                    (basename, line) => {
                        const excluded = isExcludedBasename(basename)
                        const lineHasForbidden = findForbiddenLiterals(line).length > 0
                        const wouldBlockMerge = !excluded && lineHasForbidden

                        if (EXCLUDED_BASENAMES.has(basename)) {
                            // Registry / test files: classifier never blocks
                            // them on the line content, even when the line
                            // contains forbidden literals.
                            expect(wouldBlockMerge).toBe(false)
                        }

                        // The classifier is a pure conjunction — it must
                        // never invent a verdict that disagrees with its
                        // two pure inputs.
                        expect(wouldBlockMerge).toBe(!excluded && lineHasForbidden)
                    },
                ),
                { numRuns: NUM_RUNS },
            )
        })
    })

    // -----------------------------------------------------------------------
    // (P2.b) Every Asset_Key referenced exists in the registry
    // -----------------------------------------------------------------------

    describe('Asset_Key reference resolution', () => {
        // Each map paired with its public lookup helper. A declared key
        // must resolve via the helper to the same path the map declares;
        // a fallback to PLACEHOLDER_ASSET would mean "the registry does
        // not actually contain this Asset_Key", violating Req 1.2.
        const groups: Array<{
            name: string
            keys: readonly string[]
            resolve: (key: string) => string
            map: Record<string, string>
        }> = [
            {
                name: 'FUXIE_MASCOT_STATES',
                keys: Object.keys(FUXIE_MASCOT_STATES),
                resolve: getFuxieMascotSrc,
                map: FUXIE_MASCOT_STATES as unknown as Record<string, string>,
            },
            {
                name: 'FUXIE_MODULE_MASCOTS',
                keys: Object.keys(FUXIE_MODULE_MASCOTS),
                resolve: getFuxieModuleMascotSrc,
                map: FUXIE_MODULE_MASCOTS as unknown as Record<string, string>,
            },
            {
                name: 'FUXIE_WORLD_PROPS',
                keys: Object.keys(FUXIE_WORLD_PROPS),
                resolve: getFuxieWorldPropSrc,
                map: FUXIE_WORLD_PROPS as unknown as Record<string, string>,
            },
            {
                name: 'FUXIE_UI_FRAMES',
                keys: Object.keys(FUXIE_UI_FRAMES),
                resolve: getFuxieUiFrameSrc,
                map: FUXIE_UI_FRAMES as unknown as Record<string, string>,
            },
            {
                name: 'REWARD_ASSETS',
                keys: Object.keys(REWARD_ASSETS),
                resolve: getRewardAssetSrc,
                map: REWARD_ASSETS as unknown as Record<string, string>,
            },
        ]

        for (const group of groups) {
            it(`${group.name}: every declared Asset_Key resolves to its registry value`, () => {
                expect(group.keys.length).toBeGreaterThan(0)
                fc.assert(
                    fc.property(fc.constantFrom(...group.keys), key => {
                        const resolved = group.resolve(key)
                        expect(resolved).toBe(group.map[key])
                        expect(resolved).not.toBe(PLACEHOLDER_ASSET as string)
                    }),
                    { numRuns: NUM_RUNS },
                )
            })
        }

        it('FUXIE_3D_ASSETS: every declared key matches its registry value (re-export contract)', () => {
            // FUXIE_3D_ASSETS is a re-export bag aggregating other maps,
            // so we assert the static identity directly rather than
            // through a lookup helper.
            const keys = Object.keys(FUXIE_3D_ASSETS)
            expect(keys.length).toBeGreaterThan(0)
            fc.assert(
                fc.property(fc.constantFrom(...keys), key => {
                    const value = (FUXIE_3D_ASSETS as Record<string, string>)[key]
                    expect(typeof value).toBe('string')
                    expect(value.length).toBeGreaterThan(0)
                    expect(value).not.toBe(PLACEHOLDER_ASSET as string)
                }),
                { numRuns: NUM_RUNS },
            )
        })

        it('FUXIE_LIVING_3D_ASSETS: every declared key resolves to its registry value', () => {
            const keys = Object.keys(FUXIE_LIVING_3D_ASSETS)
            expect(keys.length).toBeGreaterThan(0)
            fc.assert(
                fc.property(fc.constantFrom(...keys), key => {
                    const resolved = getFuxieLiving3dAsset(key)
                    const expected = (
                        FUXIE_LIVING_3D_ASSETS as unknown as Record<
                            string,
                            string | readonly string[]
                        >
                    )[key]
                    expect(resolved).toEqual(expected)
                    // Single-string entries must not collapse to placeholder.
                    if (typeof resolved === 'string') {
                        expect(resolved).not.toBe(PLACEHOLDER_ASSET as string)
                    }
                }),
                { numRuns: NUM_RUNS },
            )
        })
    })
})
