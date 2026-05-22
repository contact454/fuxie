/**
 * Course Path — Property-Based Tests (task 9.3 of spec
 * `gamified-ui-asset-rollout`).
 *
 * Vai chinh: Frontend Engineer
 * Vai phoi hop: QA Automation Engineer, Design System Designer
 *
 * Properties wired in this file:
 *
 *   - Property 11 (task 9.3) — Course Path Node State Discipline
 *     For an arbitrary path of 1..15 course nodes rendered through the
 *     production `<CoursePathNodes>` component (which composes
 *     `<CourseNode>` instances under `<ol data-role="course-path">`):
 *
 *       1. Every node carries exactly one `data-node-state` attribute,
 *          and its value is a member of
 *          {locked, available, in-progress, completed, mastered}.
 *       2. The number of `data-node-state` attributes in the rendered
 *          markup equals the number of input nodes.
 *       3. Among nodes whose `state === 'available'`, exactly one
 *          carries `data-role="primary-cta"` (the first one in path
 *          order). Every other `available` node carries
 *          `data-cta-variant="secondary"` and DOES NOT carry
 *          `data-role="primary-cta"`.
 *       4. If there are zero `available` nodes, the rendered markup
 *          contains zero `data-role="primary-cta"` attributes.
 *       5. Every node whose `state === 'in-progress'` carries a
 *          progress-value attribute (`data-progress-value`) whose value
 *          is an integer in [0, 100] (Req 4.5).
 *
 *     Validates: Requirements 4.1, 4.2, 4.3, 4.5, 4.6, 4.7, 4.9.
 *
 * Property 23 (Module Mascot Singleton) is intentionally NOT covered
 * here — it is already wired in `tests/mascot-role.spec.tsx` (task 5.4).
 *
 * Test framework: Vitest + fast-check (numRuns: 100 per task brief).
 * Renders React via `react-dom/server.renderToStaticMarkup` — the same
 * SSR pattern used by the rest of the PBT suites in this repository
 * (see `tests/mascot-role.spec.tsx`). The root vitest property config
 * sets `environment: 'node'` so jsdom is unavailable; static markup
 * is sufficient because every assertion is on stamped data attributes,
 * not on layout.
 */

import { describe, expect, it } from 'vitest'
import * as fc from 'fast-check'
import { renderToStaticMarkup } from 'react-dom/server'

import {
    CoursePathNodes,
    type CourseNodeInput,
} from '@/components/course/course-path-nodes'
import {
    COURSE_NODE_STATES,
    type CourseNodeState,
} from '@/components/course/course-node'

const NUM_RUNS = 100 as const

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const VALID_NODE_STATES: ReadonlySet<CourseNodeState> = new Set(
    COURSE_NODE_STATES,
)

/**
 * Count how many times `pattern` appears in `html`. Uses a global regex so
 * `String.prototype.match` returns every occurrence (or `null`, which we
 * normalize to 0).
 */
function countMatches(html: string, pattern: RegExp): number {
    return (html.match(pattern) ?? []).length
}

/**
 * Per-node attribute extractor. The production `<CourseNode>` renders a
 * single `<li data-role="course-node" data-node-id="…" data-node-state="…">`
 * for each input, so we slice the markup on each `data-node-id` and run
 * focused regexes on the slice. Slicing is necessary because the
 * `data-progress-value` attribute lives inside an inner `<svg>`, but the
 * `data-role="primary-cta"` attribute can live on a `<button>` or `<a>`
 * descendant, depending on the variant the chip resolves to.
 *
 * The slices are determined by `data-node-id="…"` markers which are
 * required to be unique per node (see `nodesArb` below).
 */
function sliceByNodeId(html: string, nodeId: string): string {
    const startMarker = `data-node-id="${nodeId}"`
    const startIdx = html.indexOf(startMarker)
    if (startIdx === -1) return ''
    // Find the next `data-node-id="…"` marker AFTER ours; that defines
    // the end of this node's subtree. If none exists this is the last
    // node, so slice to the end of `html`.
    const nextMarkerRe = /data-node-id="[^"]+"/g
    nextMarkerRe.lastIndex = startIdx + startMarker.length
    const next = nextMarkerRe.exec(html)
    const endIdx = next ? next.index : html.length
    return html.slice(startIdx, endIdx)
}

// ---------------------------------------------------------------------------
// Generators
// ---------------------------------------------------------------------------

const stateArb: fc.Arbitrary<CourseNodeState> = fc.constantFrom(
    ...(COURSE_NODE_STATES as readonly CourseNodeState[]),
)

/**
 * Per-state data so the `<CourseNode>` invariants are satisfied (e.g.
 * `cefrLevel` must be present for `completed`/`mastered` for the badge
 * to resolve, `progress` must be present for `in-progress`, and
 * `lockedReason` must be present for `locked`).
 *
 * The generator includes `progress` values OUTSIDE [0, 100] so the
 * assertion that the component clamps them (Req 4.5) is exercised by
 * the property — not just by the closed unit tests in
 * `course-node.test.tsx`.
 */
const nodeArb: fc.Arbitrary<CourseNodeInput> = fc
    .tuple(
        stateArb,
        // Generator for raw progress values: integers, floats, negatives,
        // out-of-range, and finite NaN-ish edge cases. The component is
        // expected to clamp these into [0, 100] via `clampProgress`.
        fc.oneof(
            fc.integer({ min: 0, max: 100 }),
            fc.integer({ min: -50, max: 200 }),
            fc.float({ min: -50, max: 200, noNaN: true }),
        ),
        // Stable per-node id seed — overridden with the array index in
        // `nodesArb` so the ids are unique even when fast-check picks
        // duplicate seeds.
        fc.integer({ min: 0, max: 1_000_000 }),
        // CEFR level for completed/mastered badges (only consumed for
        // those states; ignored otherwise but always provided so the
        // shape stays uniform).
        fc.constantFrom('A1', 'A2', 'B1', 'B2'),
        // Locked reason — must be ≤ 140 chars at the upstream contract,
        // but the component itself defensively truncates so any short
        // string works for the purposes of this property.
        fc.string({ minLength: 0, maxLength: 64 }),
    )
    .map(([state, rawProgress, idSeed, cefrLevel, lockedReason]) => {
        return {
            // Caller (nodesArb) replaces nodeId so it is unique per
            // position in the path; this seed is just a salt.
            nodeId: `node-${idSeed}`,
            nodeNumber: 1,
            title: `Node ${state} ${idSeed}`,
            state,
            href: '/course/some-lesson',
            progress: state === 'in-progress' ? rawProgress : undefined,
            cefrLevel,
            lockedReason: state === 'locked' ? lockedReason || 'prereq' : undefined,
        } satisfies CourseNodeInput
    })

const nodesArb: fc.Arbitrary<CourseNodeInput[]> = fc
    .array(nodeArb, { minLength: 1, maxLength: 15 })
    .map((nodes) =>
        // Force unique nodeId per position so `sliceByNodeId` is unambiguous.
        nodes.map((n, idx) => ({ ...n, nodeId: `node-${idx}` })),
    )

// ---------------------------------------------------------------------------
// Property 11 — Course Path Node State Discipline
// ---------------------------------------------------------------------------

describe('Property 11: Course Path Node State Discipline (Req 4.1–4.7, 4.9)', () => {
    it('every node carries exactly one data-node-state ∈ {locked, available, in-progress, completed, mastered}', () => {
        fc.assert(
            fc.property(nodesArb, (nodes) => {
                const html = renderToStaticMarkup(
                    <CoursePathNodes nodes={nodes} />,
                )

                // Total count of `data-node-state` attributes across
                // the path equals the number of input nodes.
                const totalStateAttrs = countMatches(
                    html,
                    /data-node-state="[a-z-]+"/g,
                )
                expect(totalStateAttrs).toBe(nodes.length)

                // Per-node check: each node's slice contains exactly
                // one `data-node-state` and its value is in the enum.
                for (const node of nodes) {
                    const slice = sliceByNodeId(html, node.nodeId)
                    expect(
                        slice.length,
                        `node "${node.nodeId}" must appear in markup`,
                    ).toBeGreaterThan(0)

                    const stateMatches = slice.match(
                        /data-node-state="([a-z-]+)"/g,
                    )
                    expect(
                        stateMatches?.length ?? 0,
                        `node "${node.nodeId}" must carry exactly one data-node-state`,
                    ).toBe(1)

                    const valueMatch = slice.match(
                        /data-node-state="([a-z-]+)"/,
                    )
                    expect(valueMatch).not.toBeNull()
                    const value = valueMatch![1] as CourseNodeState
                    expect(VALID_NODE_STATES.has(value)).toBe(true)
                    // The rendered state matches the input state.
                    expect(value).toBe(node.state)
                }
            }),
            { numRuns: NUM_RUNS },
        )
    })

    it('among `available` nodes, exactly the first carries data-role="primary-cta"; others carry data-cta-variant="secondary"', () => {
        fc.assert(
            fc.property(nodesArb, (nodes) => {
                const html = renderToStaticMarkup(
                    <CoursePathNodes nodes={nodes} />,
                )

                const availableNodes = nodes.filter(
                    (n) => n.state === 'available',
                )

                // Aggregate invariants on the whole path:
                //   - 0 available nodes ⇒ 0 primary CTA, 0 secondary CTA.
                //   - ≥ 1 available node ⇒ 1 primary CTA, (k-1) secondary CTAs.
                const totalPrimary = countMatches(
                    html,
                    /data-role="primary-cta"/g,
                )
                const totalSecondary = countMatches(
                    html,
                    /data-cta-variant="secondary"/g,
                )

                if (availableNodes.length === 0) {
                    expect(totalPrimary).toBe(0)
                    expect(totalSecondary).toBe(0)
                } else {
                    expect(totalPrimary).toBe(1)
                    expect(totalSecondary).toBe(availableNodes.length - 1)
                }

                // Per-node invariants:
                //   - The FIRST `available` node carries primary-cta.
                //   - Every OTHER `available` node carries secondary
                //     and DOES NOT carry primary-cta.
                //   - Non-available nodes never carry primary-cta.
                let firstAvailableSeen = false
                for (const node of nodes) {
                    const slice = sliceByNodeId(html, node.nodeId)
                    const hasPrimary = /data-role="primary-cta"/.test(slice)
                    const hasSecondary = /data-cta-variant="secondary"/.test(
                        slice,
                    )

                    if (node.state !== 'available') {
                        expect(
                            hasPrimary,
                            `non-available node "${node.nodeId}" (${node.state}) must NOT carry data-role="primary-cta"`,
                        ).toBe(false)
                        // Non-available nodes are not required to NOT
                        // carry secondary either way — but the production
                        // contract is that they don't, so lock it.
                        expect(
                            hasSecondary,
                            `non-available node "${node.nodeId}" (${node.state}) must NOT carry data-cta-variant="secondary"`,
                        ).toBe(false)
                        continue
                    }

                    // Available node.
                    if (!firstAvailableSeen) {
                        firstAvailableSeen = true
                        expect(
                            hasPrimary,
                            `first available node "${node.nodeId}" must carry data-role="primary-cta"`,
                        ).toBe(true)
                        expect(
                            hasSecondary,
                            `first available node "${node.nodeId}" must NOT carry data-cta-variant="secondary"`,
                        ).toBe(false)
                    } else {
                        expect(
                            hasPrimary,
                            `secondary available node "${node.nodeId}" must NOT carry data-role="primary-cta"`,
                        ).toBe(false)
                        expect(
                            hasSecondary,
                            `secondary available node "${node.nodeId}" must carry data-cta-variant="secondary"`,
                        ).toBe(true)
                    }
                }
            }),
            { numRuns: NUM_RUNS },
        )
    })

    it('every `in-progress` node carries data-progress-value ∈ [0, 100]', () => {
        fc.assert(
            fc.property(nodesArb, (nodes) => {
                const html = renderToStaticMarkup(
                    <CoursePathNodes nodes={nodes} />,
                )

                for (const node of nodes) {
                    if (node.state !== 'in-progress') continue

                    const slice = sliceByNodeId(html, node.nodeId)
                    const match = slice.match(
                        /data-progress-value="(-?\d+)"/,
                    )
                    expect(
                        match,
                        `in-progress node "${node.nodeId}" must carry a data-progress-value attribute`,
                    ).not.toBeNull()

                    const value = Number.parseInt(match![1]!, 10)
                    expect(Number.isInteger(value)).toBe(true)
                    expect(value).toBeGreaterThanOrEqual(0)
                    expect(value).toBeLessThanOrEqual(100)
                }
            }),
            { numRuns: NUM_RUNS },
        )
    })

    it('non-`in-progress` nodes never carry data-progress-value', () => {
        fc.assert(
            fc.property(nodesArb, (nodes) => {
                const html = renderToStaticMarkup(
                    <CoursePathNodes nodes={nodes} />,
                )

                // Total count of `data-progress-value` attributes equals
                // the number of `in-progress` nodes — no leakage from
                // other states (Req 4.5 boundary).
                const inProgressCount = nodes.filter(
                    (n) => n.state === 'in-progress',
                ).length
                const totalProgressAttrs = countMatches(
                    html,
                    /data-progress-value="-?\d+"/g,
                )
                expect(totalProgressAttrs).toBe(inProgressCount)
            }),
            { numRuns: NUM_RUNS },
        )
    })

    it('the path is rooted under <ol data-role="course-path"> for every input', () => {
        fc.assert(
            fc.property(nodesArb, (nodes) => {
                const html = renderToStaticMarkup(
                    <CoursePathNodes nodes={nodes} />,
                )
                expect(html).toMatch(/data-role="course-path"/)
            }),
            { numRuns: NUM_RUNS },
        )
    })
})
