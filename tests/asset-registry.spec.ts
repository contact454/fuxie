/**
 * Asset Registry — Property-Based Tests (task 1.4 of spec
 * `gamified-ui-asset-rollout`).
 *
 * Vai chinh: Frontend Engineer
 * Vai phoi hop: QA Automation Engineer
 *
 * Properties wired in this file:
 *
 *   - Property 1 (task 1.4) — Asset Registry Integrity
 *     For every (group, key) declared across the 7 typed maps + the
 *     legacy mascot alias map, the resolved value MUST point to an
 *     existing file under apps/web/public/.
 *     Validates: Requirements 1.1, 1.4, 1.5, 19.1.
 *
 *   - Property 3 (task 1.4) — Lookup Totality with Placeholder
 *     For any string s, getFuxieMascotSrc(s) returns a value that is
 *     either a known registry path OR PLACEHOLDER_ASSET, and any miss
 *     resolves to PLACEHOLDER_ASSET. The contract is extended to the
 *     other typed-map lookup helpers. Note: getShopItemAssetSrc and
 *     getCefrBadgeAssetSrc fall through to a known in-registry asset
 *     rather than the placeholder — totality still holds.
 *     Validates: Requirements 1.6, 19.1.
 *
 * Property 4 (Asset Audit Invariant) belongs to task 2.8. The task brief
 * places Property 4 in this same file but documents it for that task;
 * the describe.skip block at the bottom marks the placement.
 *
 * Test framework: Vitest + fast-check (numRuns: 100 per task brief).
 */

import { existsSync, statSync } from 'node:fs'
import path from 'node:path'
import fc from 'fast-check'
import { describe, expect, it } from 'vitest'

import {
    FUXIE_3D_ASSETS,
    FUXIE_GAMIFICATION_MASCOTS,
    FUXIE_LEGACY_MASCOT_ALIASES,
    FUXIE_LIVING_3D_ASSETS,
    FUXIE_MASCOT_STATES,
    FUXIE_MODULE_MASCOTS,
    FUXIE_UI_FRAMES,
    FUXIE_WORLD_PROPS,
    PLACEHOLDER_ASSET,
    getFuxieGameMascotSrc,
    getFuxieLiving3dAsset,
    getFuxieMascotSrc,
    getFuxieModuleMascotSrc,
    getFuxieUiFrameSrc,
    getFuxieWorldPropSrc,
} from '../apps/web/src/lib/mascot/fuxie-assets'
// FOUNDATION registry was extracted to `scripts/foundation-assets.ts`
// (Decision 2 of asset-registry-cleanup). The audit no longer flags the
// `/mascot-3d/foundation/v1/...` reference-sheet paths as forbidden
// production references because production maps live in
// `apps/web/src/lib/mascot/fuxie-assets.ts` while FOUNDATION ships from
// `scripts/`. The contract surface used by Property 1 (key set, path
// strings, fallback to PLACEHOLDER_ASSET) is identical to the previous
// co-located version, so this property file simply rewires its FOUNDATION
// imports to the new location instead of duplicating the literal here.
import {
    FUXIE_FOUNDATION_ASSETS,
    getFuxieFoundationAssetSrc,
} from '../scripts/foundation-assets'
import {
    REWARD_ASSETS,
    getCefrBadgeAssetSrc,
    getRewardAssetSrc,
    getShopItemAssetSrc,
} from '../apps/web/src/components/gamification/reward-assets'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const PUBLIC_ROOT = path.resolve(__dirname, '..', 'apps', 'web', 'public')
const NUM_RUNS = 100

function resolvePublicPath(value: string): string {
    const stripped = value.startsWith('/') ? value.slice(1) : value
    return path.join(PUBLIC_ROOT, stripped)
}

function publicFileExists(value: string): boolean {
    const absolute = resolvePublicPath(value)
    if (!existsSync(absolute)) return false
    try {
        return statSync(absolute).isFile()
    } catch {
        return false
    }
}

/**
 * Build the union of every concrete path string the registry can produce.
 * Used by Property 3 to assert "result ∈ valid_paths ∪ {PLACEHOLDER_ASSET}".
 */
function buildValidPathsUnion(): Set<string> {
    const union = new Set<string>()
    for (const v of Object.values(FUXIE_MASCOT_STATES)) union.add(v)
    for (const v of Object.values(FUXIE_FOUNDATION_ASSETS)) union.add(v)
    for (const v of Object.values(FUXIE_MODULE_MASCOTS)) union.add(v)
    for (const v of Object.values(FUXIE_GAMIFICATION_MASCOTS)) union.add(v)
    for (const v of Object.values(FUXIE_WORLD_PROPS)) union.add(v)
    for (const v of Object.values(FUXIE_UI_FRAMES)) union.add(v)
    for (const v of Object.values(FUXIE_3D_ASSETS)) union.add(v)
    for (const v of Object.values(REWARD_ASSETS)) union.add(v)
    union.add(FUXIE_LIVING_3D_ASSETS.model)
    union.add(FUXIE_LIVING_3D_ASSETS.poster)
    for (const v of FUXIE_LIVING_3D_ASSETS.frames) union.add(v)
    union.add(PLACEHOLDER_ASSET)
    return union
}

const VALID_PATHS = buildValidPathsUnion()

const KNOWN_MASCOT_KEYS: ReadonlyArray<string> = [
    ...Object.keys(FUXIE_MASCOT_STATES),
    ...Object.keys(FUXIE_LEGACY_MASCOT_ALIASES),
]

// ---------------------------------------------------------------------------
// Property 1 — Asset Registry Integrity
// ---------------------------------------------------------------------------

describe('Property 1: Asset Registry Integrity (task 1.4)', () => {
    type RegistryEntry = {
        group: string
        key: string
        getValue: () => string | readonly string[]
    }

    function buildEntries(): RegistryEntry[] {
        const entries: RegistryEntry[] = []
        const stringGroups: Array<[string, Readonly<Record<string, string>>]> = [
            ['FUXIE_MASCOT_STATES', FUXIE_MASCOT_STATES],
            ['FUXIE_FOUNDATION_ASSETS', FUXIE_FOUNDATION_ASSETS],
            ['FUXIE_MODULE_MASCOTS', FUXIE_MODULE_MASCOTS],
            ['FUXIE_GAMIFICATION_MASCOTS', FUXIE_GAMIFICATION_MASCOTS],
            ['FUXIE_WORLD_PROPS', FUXIE_WORLD_PROPS],
            ['FUXIE_UI_FRAMES', FUXIE_UI_FRAMES],
            ['FUXIE_3D_ASSETS', FUXIE_3D_ASSETS],
            ['REWARD_ASSETS', REWARD_ASSETS],
        ]
        for (const [group, map] of stringGroups) {
            for (const key of Object.keys(map)) {
                entries.push({ group, key, getValue: () => map[key] })
            }
        }
        entries.push({
            group: 'FUXIE_LIVING_3D_ASSETS',
            key: 'model',
            getValue: () => FUXIE_LIVING_3D_ASSETS.model,
        })
        entries.push({
            group: 'FUXIE_LIVING_3D_ASSETS',
            key: 'poster',
            getValue: () => FUXIE_LIVING_3D_ASSETS.poster,
        })
        entries.push({
            group: 'FUXIE_LIVING_3D_ASSETS',
            key: 'frames',
            getValue: () => FUXIE_LIVING_3D_ASSETS.frames,
        })
        // The placeholder asset itself MUST exist on disk (Req 1.6).
        entries.push({
            group: 'PLACEHOLDER_ASSET',
            key: 'PLACEHOLDER_ASSET',
            getValue: () => PLACEHOLDER_ASSET,
        })
        return entries
    }

    const ENTRIES = buildEntries()

    it('every (group, key) in the Asset Registry resolves to a file under apps/web/public/', () => {
        // Sanity: guards against accidental tree-shake / import regression.
        expect(ENTRIES.length).toBeGreaterThan(0)

        fc.assert(
            fc.property(fc.integer({ min: 0, max: ENTRIES.length - 1 }), (idx) => {
                const entry = ENTRIES[idx]
                const value = entry.getValue()
                if (Array.isArray(value)) {
                    for (const v of value) {
                        if (!publicFileExists(v)) {
                            throw new Error(
                                `${entry.group}.${entry.key}: missing public file ${v}`,
                            )
                        }
                    }
                } else {
                    const v = value as string
                    if (!publicFileExists(v)) {
                        throw new Error(
                            `${entry.group}.${entry.key}: missing public file ${v}`,
                        )
                    }
                }
                return true
            }),
            { numRuns: NUM_RUNS },
        )
    })

    it('every FUXIE_LEGACY_MASCOT_ALIAS target is a valid FUXIE_MASCOT_STATES key', () => {
        const stateKeys = new Set(Object.keys(FUXIE_MASCOT_STATES))
        const aliasEntries = Object.entries(FUXIE_LEGACY_MASCOT_ALIASES)

        fc.assert(
            fc.property(fc.integer({ min: 0, max: aliasEntries.length - 1 }), (idx) => {
                const [aliasKey, target] = aliasEntries[idx]
                if (!stateKeys.has(target)) {
                    throw new Error(
                        `FUXIE_LEGACY_MASCOT_ALIASES.${aliasKey} → "${target}" is not in FUXIE_MASCOT_STATES`,
                    )
                }
                return true
            }),
            { numRuns: NUM_RUNS },
        )
    })

    it('all registry values reference paths under web-absolute prefix "/"', () => {
        // Defensive structural check — complements `pnpm lint:asset-paths`.
        for (const entry of ENTRIES) {
            const value = entry.getValue()
            const values = Array.isArray(value) ? value : [value as string]
            for (const v of values) {
                expect(v.startsWith('/'), `${entry.group}.${entry.key}: ${v}`).toBe(true)
            }
        }
    })
})


// ---------------------------------------------------------------------------
// Property 3 — Lookup Totality with Placeholder
// ---------------------------------------------------------------------------

describe('Property 3: Lookup Totality with Placeholder (task 1.4)', () => {
    /**
     * For any s ∈ String:
     *   - getFuxieMascotSrc(s) returns a string,
     *   - the result is in valid_paths ∪ {PLACEHOLDER_ASSET},
     *   - if s is not a known mascot/alias key ⇒ result === PLACEHOLDER_ASSET.
     *
     * Validates: Requirements 1.6, 19.1.
     */

    /**
     * Generator biased toward known keys (so the "hit" branch is also
     * exercised) but otherwise emitting arbitrary strings — including the
     * tricky JS prototype names (`__proto__`, `toString`, `valueOf`) — so
     * the "miss" branch is fuzzed honestly.
     */
    const arbAnyString = fc.oneof(
        { weight: 3, arbitrary: fc.constantFrom(...KNOWN_MASCOT_KEYS) },
        { weight: 1, arbitrary: fc.string() },
        { weight: 1, arbitrary: fc.fullUnicodeString() },
        {
            weight: 1,
            arbitrary: fc.constantFrom(
                '',
                ' ',
                '\n',
                '\u0000',
                '__proto__',
                'toString',
                'valueOf',
                'hasOwnProperty',
                'constructor',
            ),
        },
    )

    it('getFuxieMascotSrc(s) ∈ valid_paths ∪ {PLACEHOLDER_ASSET} for any s ∈ String', () => {
        fc.assert(
            fc.property(arbAnyString, (s) => {
                const result = getFuxieMascotSrc(s)
                expect(typeof result).toBe('string')
                expect(VALID_PATHS.has(result)).toBe(true)
                return true
            }),
            { numRuns: NUM_RUNS },
        )
    })

    it('getFuxieMascotSrc(s) === PLACEHOLDER_ASSET when s is not a known key or alias', () => {
        const knownSet = new Set<string>(KNOWN_MASCOT_KEYS)

        fc.assert(
            fc.property(arbAnyString, (s) => {
                const result = getFuxieMascotSrc(s)
                if (knownSet.has(s)) {
                    expect(VALID_PATHS.has(result)).toBe(true)
                    expect(result).not.toBe(PLACEHOLDER_ASSET)
                } else {
                    expect(result).toBe(PLACEHOLDER_ASSET)
                }
                return true
            }),
            { numRuns: NUM_RUNS },
        )
    })

    it('all sibling typed-map lookups are total and miss ⇒ PLACEHOLDER_ASSET', () => {
        // (`getShopItemAssetSrc` / `getCefrBadgeAssetSrc` intentionally fall
        // through to a known in-registry asset rather than the placeholder
        // — covered by their own assertion below.)
        const helpers: Array<{
            name: string
            knownKeys: ReadonlyArray<string>
            run: (s: string) => string
        }> = [
            {
                name: 'getFuxieFoundationAssetSrc',
                knownKeys: Object.keys(FUXIE_FOUNDATION_ASSETS),
                run: (s) => getFuxieFoundationAssetSrc(s),
            },
            {
                name: 'getFuxieModuleMascotSrc',
                knownKeys: Object.keys(FUXIE_MODULE_MASCOTS),
                run: (s) => getFuxieModuleMascotSrc(s),
            },
            {
                name: 'getFuxieGameMascotSrc',
                knownKeys: Object.keys(FUXIE_GAMIFICATION_MASCOTS),
                run: (s) => getFuxieGameMascotSrc(s),
            },
            {
                name: 'getFuxieWorldPropSrc',
                knownKeys: Object.keys(FUXIE_WORLD_PROPS),
                run: (s) => getFuxieWorldPropSrc(s),
            },
            {
                name: 'getFuxieUiFrameSrc',
                knownKeys: Object.keys(FUXIE_UI_FRAMES),
                run: (s) => getFuxieUiFrameSrc(s),
            },
            {
                name: 'getRewardAssetSrc',
                knownKeys: Object.keys(REWARD_ASSETS),
                run: (s) => getRewardAssetSrc(s),
            },
        ]

        for (const helper of helpers) {
            const arb = fc.oneof(
                { weight: 3, arbitrary: fc.constantFrom(...helper.knownKeys) },
                { weight: 2, arbitrary: fc.string() },
                { weight: 1, arbitrary: fc.fullUnicodeString() },
                {
                    weight: 1,
                    arbitrary: fc.constantFrom(
                        '__proto__',
                        'toString',
                        'valueOf',
                        'hasOwnProperty',
                        'constructor',
                    ),
                },
            )
            const knownSet = new Set<string>(helper.knownKeys)
            fc.assert(
                fc.property(arb, (s) => {
                    const result = helper.run(s)
                    expect(typeof result, helper.name).toBe('string')
                    expect(
                        VALID_PATHS.has(result),
                        `${helper.name}(${JSON.stringify(s)}) → ${String(result)}`,
                    ).toBe(true)
                    if (!knownSet.has(s)) {
                        expect(
                            result,
                            `${helper.name} miss should be PLACEHOLDER_ASSET`,
                        ).toBe(PLACEHOLDER_ASSET)
                    }
                    return true
                }),
                { numRuns: NUM_RUNS },
            )
        }
    })

    it('getFuxieLiving3dAsset is total: known keys hit registry, misses ⇒ PLACEHOLDER_ASSET', () => {
        const known = ['model', 'poster', 'frames'] as const
        const arb = fc.oneof(
            { weight: 1, arbitrary: fc.constantFrom(...known) },
            { weight: 1, arbitrary: fc.string() },
            { weight: 1, arbitrary: fc.fullUnicodeString() },
        )
        fc.assert(
            fc.property(arb, (s) => {
                const result = getFuxieLiving3dAsset(s as string)
                if (s === 'frames') {
                    expect(Array.isArray(result)).toBe(true)
                    for (const v of result as readonly string[]) {
                        expect(VALID_PATHS.has(v)).toBe(true)
                    }
                } else if (s === 'model' || s === 'poster') {
                    expect(typeof result).toBe('string')
                    expect(VALID_PATHS.has(result as string)).toBe(true)
                    expect(result).not.toBe(PLACEHOLDER_ASSET)
                } else {
                    expect(result).toBe(PLACEHOLDER_ASSET)
                }
                return true
            }),
            { numRuns: NUM_RUNS },
        )
    })

    it('getShopItemAssetSrc + getCefrBadgeAssetSrc are total over arbitrary strings', () => {
        // These two helpers intentionally fall through to a *known* asset
        // (fucoinPouch / cefrBadgeNodeSet) rather than the placeholder. The
        // totality contract still holds: for any input the result is a
        // string in VALID_PATHS.
        fc.assert(
            fc.property(
                fc.string(),
                fc.option(fc.string(), { nil: undefined }),
                (id, cat) => {
                    const result = getShopItemAssetSrc(id, cat)
                    expect(typeof result).toBe('string')
                    expect(VALID_PATHS.has(result)).toBe(true)
                    return true
                },
            ),
            { numRuns: NUM_RUNS },
        )
        fc.assert(
            fc.property(fc.option(fc.string(), { nil: undefined }), (level) => {
                const result = getCefrBadgeAssetSrc(level)
                expect(typeof result).toBe('string')
                expect(VALID_PATHS.has(result)).toBe(true)
                return true
            }),
            { numRuns: NUM_RUNS },
        )
    })
})

// ---------------------------------------------------------------------------
// Property 4 — Asset Audit Invariant (PLACEHOLDER for task 2.8)
// ---------------------------------------------------------------------------

/**
 * Property 4 belongs to task 2.8 ("Asset Audit Invariant"). Per the task
 * brief, the property is authored in this same spec file ("extends 1.4").
 * The block below is intentionally `describe.skip` until task 2.8 lands
 * the actual invariant logic so the suite stays scoped to task 1.4.
 *
 * When task 2.8 is executed, replace the `describe.skip` with `describe`,
 * implement the four sub-invariants below, and run with `numRuns: 100`.
 *
 * Validates (when wired by task 2.8): Requirements 2.1, 2.2, 2.3, 2.4,
 * 2.5, 18.1.
 */
describe.skip('Property 4: Asset Audit Invariant (task 2.8 — placeholder)', () => {
    it('coverage of optimized folders ≥ 0.95', () => {
        // To be implemented by task 2.8.
    })
    it('every optimized file is referenced OR archived OR absent', () => {
        // To be implemented by task 2.8.
    })
    it('registry values never reference forbidden raw/concept/foundation/reference-parts paths', () => {
        // To be implemented by task 2.8.
    })
    it('optimized .webp is preferred over .png/.jpg when both variants exist', () => {
        // To be implemented by task 2.8.
    })
})
