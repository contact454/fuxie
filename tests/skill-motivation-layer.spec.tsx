/**
 * Property tests for the Skill_Motivation_Layer composition contract and
 * the per-skill World_Prop tag matcher.
 *
 * Spec source-of-truth:
 *   - `.kiro/specs/gamified-ui-asset-rollout/tasks.md` task 6.3
 *   - `.kiro/specs/gamified-ui-asset-rollout/design.md` §C
 *     (Skill_Motivation_Layer) and §A.1 (World prop tags)
 *   - `.kiro/specs/gamified-ui-asset-rollout/requirements.md` Req 6.1–6.8
 *
 * Vai chinh: Frontend Engineer
 * Vai phoi hop: QA Automation Engineer
 *
 * **Property 13 — Skill_Motivation_Layer Composition.** For any skill
 *   surface ∈ {reading, listening, speaking, writing} and any
 *   non-negative `done`/`total` integer pair, the rendered layer:
 *     - declares its bounds via the documented `min(20vh, 169px)` /
 *       `max-height: 169px` inline-style tokens (Req 6.2). JSDOM does
 *       not paint, so the contract is verified on the style string the
 *       component emits, which is also exported as
 *       `SKILL_MOTIVATION_LAYER_MAX_HEIGHT_PX`.
 *     - hosts exactly one mascot in role `coach` (Req 6.3.a) — every
 *       skill surface defaults to `coach` per `SURFACE_MASCOT_CONFIG`,
 *       so `MascotRoleHost` always emits `data-mascot-role="coach"`.
 *     - exposes exactly one `data-zone="progress"` whose text matches
 *       `^\d+/\d+$` and whose parsed `done ≤ total` (Req 6.3.b). The
 *       component clamps inconsistent inputs upward, so this property
 *       holds even when `done > total` is supplied (the rendered
 *       progress reflects the clamped pair).
 *     - exposes exactly one `data-zone="reward-preview"` carrying a
 *       `data-reward-key` that exists in `REWARD_ASSETS` (Req 6.3.c).
 *
 * **Property 14 — Skill World Prop Tag Match.** For each skill surface,
 *   any non-empty subset of its documented tag set resolves through
 *   `pickWorldProp(tags)` to a `FuxieWorldProp` whose
 *   `FUXIE_WORLD_PROP_TAGS[key]` intersects the supplied tags
 *   (Req 6.4–6.8).
 *
 * Test framework: Vitest + fast-check (numRuns: 100 per task brief).
 * Rendering: `react-dom/server.renderToStaticMarkup` — same convention
 * as the other PBT specs in this repo so the suite stays deterministic
 * inside Vitest's `environment: 'node'`.
 *
 * Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8
 */

import { describe, expect, it } from 'vitest'
import * as fc from 'fast-check'
import { renderToStaticMarkup } from 'react-dom/server'

import {
    SkillMotivationLayer,
    SKILL_MOTIVATION_LAYER_MAX_HEIGHT_PX,
    type SkillMotivationSurfaceId,
} from '@/components/gamification/skill-motivation-layer'
import { REWARD_ASSETS, type RewardAssetKey } from '@/components/gamification/reward-assets'
import {
    FUXIE_WORLD_PROP_TAGS,
    pickWorldProp,
    type WorldTag,
} from '@/lib/mascot/fuxie-world-tags'

const NUM_RUNS = 100 as const

// -----------------------------------------------------------------------------
// Skill surface ↔ documented world tag mapping
// -----------------------------------------------------------------------------

/**
 * Per-surface documented tag sets, mirroring the shell components and the
 * task brief (reading: ['library'], listening: ['studio', 'radio'],
 * speaking: ['cafe', 'plaza'], writing: ['desk', 'workshop']).
 *
 * Keeping the table in the test (rather than importing from the shells)
 * pins the tag contract independently — if a shell drifts, this file
 * still encodes what Property 14 must hold for.
 */
const SKILL_SURFACE_TAGS: ReadonlyArray<{
    surfaceId: SkillMotivationSurfaceId
    tags: ReadonlyArray<WorldTag>
}> = [
    { surfaceId: 'reading', tags: ['library'] },
    { surfaceId: 'listening', tags: ['studio', 'radio'] },
    { surfaceId: 'speaking', tags: ['cafe', 'plaza'] },
    { surfaceId: 'writing', tags: ['desk', 'workshop'] },
]

// -----------------------------------------------------------------------------
// Generators
// -----------------------------------------------------------------------------

/**
 * Bounded non-negative integers for `done`/`total`. The cap of 9999 keeps
 * the rendered text length sane and matches realistic skill-player
 * progress counters.
 */
const counterArb = fc.integer({ min: 0, max: 9999 })

const skillSurfaceArb: fc.Arbitrary<SkillMotivationSurfaceId> = fc.constantFrom(
    'reading',
    'listening',
    'speaking',
    'writing',
)

const REWARD_ASSET_KEYS = Object.keys(REWARD_ASSETS) as RewardAssetKey[]

const rewardKeyArb: fc.Arbitrary<RewardAssetKey> = fc.constantFrom(
    ...REWARD_ASSET_KEYS,
)

/**
 * For Property 14: given a surface, generate a non-empty subset of its
 * documented tags (mixed with optional duplicates so the matcher's
 * de-duping is exercised too).
 */
function nonEmptyTagSubsetArb(
    documented: ReadonlyArray<WorldTag>,
): fc.Arbitrary<WorldTag[]> {
    return fc
        .subarray(documented as WorldTag[], { minLength: 1 })
        .chain((subset) =>
            // Optionally duplicate one tag to verify pickWorldProp tolerates
            // repeats (the implementation builds a Set internally).
            fc.boolean().map((dup) => (dup ? [...subset, subset[0]!] : subset)),
        )
}

// -----------------------------------------------------------------------------
// HTML helpers — robust regex match counters
// -----------------------------------------------------------------------------

function countMatches(html: string, pattern: RegExp): number {
    const flags = pattern.flags.includes('g') ? pattern.flags : `${pattern.flags}g`
    return (html.match(new RegExp(pattern.source, flags)) ?? []).length
}

/**
 * Extract the inner text of the unique `<p data-progress-text="">` node.
 *
 * The progress text node is rendered as a `<p>` with `data-progress-text=""`
 * and no other child elements. Extract the first such node's text content.
 */
function extractProgressText(html: string): string {
    const match = html.match(
        /data-progress-text="[^"]*"[^>]*>([\s\S]*?)<\/p>/,
    )
    if (!match) {
        throw new Error('Progress text node not found in rendered HTML')
    }
    return match[1].trim()
}

/**
 * Extract the value of `data-reward-key="..."` on the unique reward-preview
 * zone element.
 */
function extractRewardKey(html: string): string {
    const match = html.match(
        /data-zone="reward-preview"[^>]*data-reward-key="([^"]+)"/,
    )
    if (!match) {
        throw new Error('Reward preview zone with data-reward-key not found')
    }
    return match[1]
}

// -----------------------------------------------------------------------------
// Property 13 — Skill_Motivation_Layer Composition (Req 6.1–6.3)
// -----------------------------------------------------------------------------

describe('Property 13: Skill_Motivation_Layer Composition (Req 6.1, 6.2, 6.3)', () => {
    it('renders bounds tokens ≤ 169px on the root container (Req 6.2)', () => {
        // Sanity: the component exports the documented cap so test and
        // implementation can never drift.
        expect(SKILL_MOTIVATION_LAYER_MAX_HEIGHT_PX).toBe(169)

        fc.assert(
            fc.property(skillSurfaceArb, counterArb, counterArb, (surfaceId, done, total) => {
                const html = renderToStaticMarkup(
                    <SkillMotivationLayer
                        surfaceId={surfaceId}
                        done={done}
                        total={total}
                    />,
                )

                // Root carries the documented role attribute exactly once.
                expect(countMatches(html, /data-role="skill-motivation-layer"/)).toBe(1)

                // Inline style declares both the responsive height and the
                // hard 169px cap. JSDOM does not paint, so we verify the
                // contract on the style string itself.
                expect(html).toMatch(/style="[^"]*height:\s*min\(20vh,\s*169px\)/)
                expect(html).toMatch(/style="[^"]*max-height:\s*169px/)
            }),
            { numRuns: NUM_RUNS },
        )
    })

    it('renders exactly one mascot in role coach (Req 6.3.a)', () => {
        fc.assert(
            fc.property(skillSurfaceArb, counterArb, counterArb, (surfaceId, done, total) => {
                const html = renderToStaticMarkup(
                    <SkillMotivationLayer
                        surfaceId={surfaceId}
                        done={done}
                        total={total}
                    />,
                )

                expect(countMatches(html, /data-mascot-role="coach"/)).toBe(1)
                // No other mascot role may leak into the layer's subtree.
                expect(countMatches(html, /data-mascot-role="companion"/)).toBe(0)
                expect(countMatches(html, /data-mascot-role="cheer"/)).toBe(0)
                expect(countMatches(html, /data-mascot-role="guard"/)).toBe(0)
                expect(countMatches(html, /data-mascot-role="silent"/)).toBe(0)
            }),
            { numRuns: NUM_RUNS },
        )
    })

    it('renders exactly one progress zone with text matching ^\\d+/\\d+$ and done ≤ total (Req 6.3.b)', () => {
        fc.assert(
            fc.property(skillSurfaceArb, counterArb, counterArb, (surfaceId, done, total) => {
                const html = renderToStaticMarkup(
                    <SkillMotivationLayer
                        surfaceId={surfaceId}
                        done={done}
                        total={total}
                    />,
                )

                // Exactly one progress zone.
                expect(countMatches(html, /data-zone="progress"/)).toBe(1)

                const text = extractProgressText(html)
                expect(text).toMatch(/^\d+\/\d+$/)

                const [doneStr, totalStr] = text.split('/')
                const renderedDone = Number.parseInt(doneStr, 10)
                const renderedTotal = Number.parseInt(totalStr, 10)

                expect(Number.isFinite(renderedDone)).toBe(true)
                expect(Number.isFinite(renderedTotal)).toBe(true)
                expect(renderedDone).toBeGreaterThanOrEqual(0)
                expect(renderedTotal).toBeGreaterThanOrEqual(0)
                // Req 6.3.b: done ≤ total. The component clamps total up
                // to done when the caller passes done > total, so the
                // rendered pair always satisfies the invariant.
                expect(renderedDone).toBeLessThanOrEqual(renderedTotal)
            }),
            { numRuns: NUM_RUNS },
        )
    })

    it('renders exactly one reward preview from REWARD_ASSETS (Req 6.3.c)', () => {
        fc.assert(
            fc.property(
                skillSurfaceArb,
                counterArb,
                counterArb,
                rewardKeyArb,
                (surfaceId, done, total, rewardKey) => {
                    const html = renderToStaticMarkup(
                        <SkillMotivationLayer
                            surfaceId={surfaceId}
                            done={done}
                            total={total}
                            rewardKey={rewardKey}
                        />,
                    )

                    // Exactly one reward-preview zone.
                    expect(countMatches(html, /data-zone="reward-preview"/)).toBe(1)
                    // Exactly one preview-state attribute scoped to that zone.
                    expect(countMatches(html, /data-reward-state="preview"/)).toBe(1)

                    // The data-reward-key must reference REWARD_ASSETS.
                    // Note: next/image rewrites the asset path into a
                    // `/_next/image?url=...` (URL-encoded) optimizer URL,
                    // so the raw `REWARD_ASSETS[key]` path is intentionally
                    // not present verbatim in the rendered HTML. The
                    // contract Property 13 enforces is the data-reward-key
                    // membership, which the registry lookup pins exactly.
                    const renderedKey = extractRewardKey(html)
                    expect(renderedKey).toBe(rewardKey)
                    expect(REWARD_ASSETS).toHaveProperty(renderedKey)
                    expect(REWARD_ASSETS[renderedKey as RewardAssetKey]).toMatch(
                        /^\/reward-assets\//,
                    )
                },
            ),
            { numRuns: NUM_RUNS },
        )
    })

    it('default rewardKey ("fucoin") still produces exactly one valid reward preview', () => {
        fc.assert(
            fc.property(skillSurfaceArb, counterArb, counterArb, (surfaceId, done, total) => {
                const html = renderToStaticMarkup(
                    <SkillMotivationLayer
                        surfaceId={surfaceId}
                        done={done}
                        total={total}
                    />,
                )
                expect(countMatches(html, /data-zone="reward-preview"/)).toBe(1)
                const renderedKey = extractRewardKey(html)
                expect(REWARD_ASSETS).toHaveProperty(renderedKey)
                expect(renderedKey).toBe('fucoin')
            }),
            { numRuns: NUM_RUNS },
        )
    })
})

// -----------------------------------------------------------------------------
// Property 14 — Skill World Prop Tag Match (Req 6.4–6.8)
// -----------------------------------------------------------------------------

describe('Property 14: Skill World Prop Tag Match (Req 6.4–6.8)', () => {
    /**
     * Build a per-surface `it` that fuzzes non-empty subsets of the
     * surface's documented tag set and asserts intersection with the
     * resolved prop's tag set.
     */
    for (const { surfaceId, tags } of SKILL_SURFACE_TAGS) {
        it(`pickWorldProp resolves ${surfaceId} tags to a prop whose tag set intersects the input`, () => {
            fc.assert(
                fc.property(nonEmptyTagSubsetArb(tags), (subset) => {
                    const propKey = pickWorldProp(subset)

                    // The resolved key must be a valid FuxieWorldProp —
                    // i.e. a key of FUXIE_WORLD_PROP_TAGS.
                    expect(FUXIE_WORLD_PROP_TAGS).toHaveProperty(propKey)

                    const propTags = FUXIE_WORLD_PROP_TAGS[propKey]
                    const propTagSet = new Set<WorldTag>(propTags)
                    const intersects = subset.some((t) => propTagSet.has(t))

                    expect(
                        intersects,
                        `pickWorldProp(${JSON.stringify(subset)}) -> "${propKey}" with tags ${JSON.stringify(propTags)} does not intersect input`,
                    ).toBe(true)
                }),
                { numRuns: NUM_RUNS },
            )
        })
    }

    it('full documented tag set per surface always resolves to an intersecting prop', () => {
        for (const { surfaceId, tags } of SKILL_SURFACE_TAGS) {
            const propKey = pickWorldProp([...tags])
            const propTags = FUXIE_WORLD_PROP_TAGS[propKey]
            const intersects = tags.some((t) => propTags.includes(t))
            expect(
                intersects,
                `surface "${surfaceId}" with tags ${JSON.stringify(tags)} resolved to "${propKey}" without intersection`,
            ).toBe(true)
        }
    })
})
