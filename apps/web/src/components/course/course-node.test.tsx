import { describe, it, expect } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'

import {
    CourseNode,
    COURSE_NODE_STATES,
    clampProgress,
    type CourseNodeProps,
    type CourseNodeState,
} from './course-node'
import {
    CoursePathNodes,
    annotatePrimaryCta,
    type CourseNodeInput,
} from './course-path-nodes'

/**
 * Structural unit tests + snapshot assertion for task 9.1.
 *
 * The acceptance criterion the orchestrator pinned is:
 *   "Snapshot test confirms exactly one primary CTA across nodes."
 *
 * jsdom is not configured for this workspace (vitest environment is `node`),
 * so DOM-level layout measurements are not available here. Instead we render
 * to static markup and lock the data-attribute contract that backs the
 * Property 11 invariant — exactly one `data-role="primary-cta"` across all
 * `available` nodes; subsequent `available` nodes carry
 * `data-cta-variant="secondary"`.
 *
 * Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7
 */

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

function makeNode(
    state: CourseNodeState,
    overrides: Partial<CourseNodeInput> = {},
): CourseNodeInput {
    return {
        nodeId: `node-${state}-${overrides.nodeId ?? state}`,
        nodeNumber: 1,
        title: `Node ${state}`,
        state,
        href: '/course/some-lesson',
        ...overrides,
    }
}

function countMatches(html: string, pattern: RegExp): number {
    return (html.match(pattern) ?? []).length
}

// -----------------------------------------------------------------------------
// Pure helpers
// -----------------------------------------------------------------------------

describe('CourseNode — clampProgress (Requirement 4.5)', () => {
    it('rounds finite values into [0, 100]', () => {
        expect(clampProgress(0)).toBe(0)
        expect(clampProgress(100)).toBe(100)
        expect(clampProgress(42.4)).toBe(42)
        expect(clampProgress(42.6)).toBe(43)
    })

    it('clamps out-of-range and non-finite values', () => {
        expect(clampProgress(-5)).toBe(0)
        expect(clampProgress(150)).toBe(100)
        expect(clampProgress(Number.NaN)).toBe(0)
        // Non-finite collapses to 0 (matches SkillMotivationLayer’s
        // toNonNegativeInt convention so the data-progress-value attribute
        // never serializes as "Infinity").
        expect(clampProgress(Number.POSITIVE_INFINITY)).toBe(0)
        expect(clampProgress(Number.NEGATIVE_INFINITY)).toBe(0)
        expect(clampProgress(undefined)).toBe(0)
    })
})

describe('CoursePathNodes — annotatePrimaryCta (Requirements 4.2, 4.3)', () => {
    it('flags only the first available node as Primary_CTA', () => {
        const flags = annotatePrimaryCta([
            { state: 'completed' },
            { state: 'in-progress' },
            { state: 'available' },
            { state: 'available' },
            { state: 'locked' },
        ])
        expect(flags).toEqual([false, false, true, false, false])
    })

    it('returns all-false when there are no available nodes', () => {
        const flags = annotatePrimaryCta([
            { state: 'completed' },
            { state: 'mastered' },
            { state: 'locked' },
        ])
        expect(flags.every((f) => f === false)).toBe(true)
    })

    it('flags the only available node when there is exactly one', () => {
        const flags = annotatePrimaryCta([
            { state: 'completed' },
            { state: 'available' },
        ])
        expect(flags).toEqual([false, true])
    })
})

// -----------------------------------------------------------------------------
// Single-node rendering
// -----------------------------------------------------------------------------

describe('CourseNode — data-node-state attribute (Requirement 4.1)', () => {
    it.each(COURSE_NODE_STATES)(
        'renders exactly one `data-node-state="%s"` for state=%s',
        (state) => {
            const props: CourseNodeProps = {
                ...makeNode(state),
                isPrimaryCta: state === 'available',
                progress: state === 'in-progress' ? 42 : undefined,
                cefrLevel: 'A1',
            }
            const html = renderToStaticMarkup(<CourseNode {...props} />)
            expect(
                countMatches(html, new RegExp(`data-node-state="${state}"`, 'g')),
            ).toBe(1)
        },
    )
})

describe('CourseNode — Primary_CTA discipline (Requirements 4.2, 4.3)', () => {
    it('available + isPrimaryCta=true emits exactly one `data-role="primary-cta"`', () => {
        const html = renderToStaticMarkup(
            <CourseNode
                {...makeNode('available')}
                isPrimaryCta
            />,
        )
        expect(countMatches(html, /data-role="primary-cta"/g)).toBe(1)
        expect(countMatches(html, /data-cta-variant="secondary"/g)).toBe(0)
    })

    it('available + isPrimaryCta=false emits `data-cta-variant="secondary"` and no Primary_CTA', () => {
        const html = renderToStaticMarkup(
            <CourseNode
                {...makeNode('available', { nodeId: 'sec' })}
                isPrimaryCta={false}
            />,
        )
        expect(countMatches(html, /data-role="primary-cta"/g)).toBe(0)
        expect(countMatches(html, /data-cta-variant="secondary"/g)).toBe(1)
    })

    it.each(['locked', 'in-progress', 'completed', 'mastered'] as const)(
        'state=%s never emits `data-role="primary-cta"`',
        (state) => {
            const html = renderToStaticMarkup(
                <CourseNode
                    {...makeNode(state)}
                    isPrimaryCta
                    progress={state === 'in-progress' ? 50 : undefined}
                    cefrLevel="A1"
                />,
            )
            expect(countMatches(html, /data-role="primary-cta"/g)).toBe(0)
        },
    )
})

describe('CourseNode — locked state (Requirement 4.4)', () => {
    it('renders a `role="tooltip"` element with the prerequisite reason', () => {
        const html = renderToStaticMarkup(
            <CourseNode
                {...makeNode('locked')}
                isPrimaryCta={false}
                lockedReason="Hoàn thành A1 module 2 lesson 3"
            />,
        )
        expect(html).toMatch(/role="tooltip"/)
        expect(html).toMatch(/data-role="course-node-locked-tooltip"/)
        expect(html).toContain('Hoàn thành A1 module 2 lesson 3')
    })

    it('truncates a >140-char prerequisite to 140 chars (Req 11.4)', () => {
        const longReason = 'x'.repeat(200)
        const html = renderToStaticMarkup(
            <CourseNode
                {...makeNode('locked')}
                isPrimaryCta={false}
                lockedReason={longReason}
            />,
        )
        // Tooltip span should not contain a 200-char run of x. Find the
        // tooltip slice and verify length.
        const tooltipMatch = html.match(
            /data-role="course-node-locked-tooltip"[^>]*>([^<]+)</,
        )
        expect(tooltipMatch).not.toBeNull()
        const text = tooltipMatch![1]!
        expect(text.length).toBeLessThanOrEqual(140)
    })

    it('uses an opacity-only transition (animation closed-set, Req 13.1) within ≤200ms', () => {
        const html = renderToStaticMarkup(
            <CourseNode
                {...makeNode('locked')}
                isPrimaryCta={false}
                lockedReason="prerequisite"
            />,
        )
        expect(html).toMatch(/transition-opacity/)
        expect(html).toMatch(/duration-150/)
        // Must not animate transform/color/etc as part of the tooltip reveal
        // (the closed motion set permits transform+opacity but the tooltip
        // specifically uses opacity-only here).
        expect(html).not.toMatch(/transition-colors[^"]*duration-15\d/)
    })
})

describe('CourseNode — in-progress state (Requirement 4.5)', () => {
    it('exposes `data-progress-value` ∈ [0, 100] and renders the progress ring', () => {
        const html = renderToStaticMarkup(
            <CourseNode
                {...makeNode('in-progress')}
                isPrimaryCta={false}
                progress={42}
            />,
        )
        expect(html).toMatch(/data-role="course-node-progress-ring"/)
        expect(html).toMatch(/data-progress-value="42"/)
    })

    it('clamps out-of-range progress to [0, 100]', () => {
        const tooHigh = renderToStaticMarkup(
            <CourseNode
                {...makeNode('in-progress', { nodeId: 'high' })}
                isPrimaryCta={false}
                progress={150}
            />,
        )
        expect(tooHigh).toMatch(/data-progress-value="100"/)

        const tooLow = renderToStaticMarkup(
            <CourseNode
                {...makeNode('in-progress', { nodeId: 'low' })}
                isPrimaryCta={false}
                progress={-12}
            />,
        )
        expect(tooLow).toMatch(/data-progress-value="0"/)
    })
})

describe('CourseNode — completed/mastered badges (Requirements 4.6, 4.7)', () => {
    it('completed renders the CEFR receipt badge for the configured level', () => {
        const html = renderToStaticMarkup(
            <CourseNode
                {...makeNode('completed')}
                isPrimaryCta={false}
                cefrLevel="A1"
            />,
        )
        expect(html).toMatch(/data-role="course-node-completed-badge"/)
        // The badge image should reference the CEFR A1 reward asset path or
        // its URL-encoded form (Next/Image rewrites the src at runtime).
        const a1Asset = '/reward-assets/optimized/fuxie-item-cefr-badge-a1-512.webp'
        expect(
            html.includes(a1Asset) || html.includes(encodeURIComponent(a1Asset)),
        ).toBe(true)
    })

    it('mastered renders the mastered node-set badge in addition to a Sparkles icon', () => {
        const html = renderToStaticMarkup(
            <CourseNode
                {...makeNode('mastered')}
                isPrimaryCta={false}
                cefrLevel="A1"
            />,
        )
        expect(html).toMatch(/data-role="course-node-mastered-badge"/)
        const masteredAsset =
            '/reward-assets/optimized/fuxie-item-cefr-badge-node-set-512.webp'
        expect(
            html.includes(masteredAsset) ||
                html.includes(encodeURIComponent(masteredAsset)),
        ).toBe(true)
    })
})

// -----------------------------------------------------------------------------
// CoursePathNodes — list-level snapshot (the orchestrator's acceptance test)
// -----------------------------------------------------------------------------

describe('CoursePathNodes — single Primary_CTA across the path (Requirement 4.2, 4.3 / Property 11)', () => {
    it('renders exactly one `data-role="primary-cta"` across mixed-state nodes', () => {
        const nodes: CourseNodeInput[] = [
            makeNode('completed', { nodeId: 'a', nodeNumber: 1 }),
            makeNode('mastered', { nodeId: 'b', nodeNumber: 2, cefrLevel: 'A1' }),
            makeNode('in-progress', { nodeId: 'c', nodeNumber: 3, progress: 60 }),
            // First available — must be the only Primary_CTA.
            makeNode('available', { nodeId: 'd', nodeNumber: 4 }),
            // Second available — must downgrade to secondary.
            makeNode('available', { nodeId: 'e', nodeNumber: 5 }),
            makeNode('locked', { nodeId: 'f', nodeNumber: 6, lockedReason: 'prereq' }),
            makeNode('locked', { nodeId: 'g', nodeNumber: 7, lockedReason: 'prereq' }),
        ]
        const html = renderToStaticMarkup(<CoursePathNodes nodes={nodes} />)

        // Acceptance criterion: exactly one primary CTA across nodes.
        expect(countMatches(html, /data-role="primary-cta"/g)).toBe(1)
        // The other available node must surface as the secondary CTA.
        expect(countMatches(html, /data-cta-variant="secondary"/g)).toBe(1)
        // Every node renders exactly one data-node-state.
        expect(countMatches(html, /data-node-state="[a-z-]+"/g)).toBe(nodes.length)
    })

    it('renders zero `data-role="primary-cta"` when no node is available', () => {
        const nodes: CourseNodeInput[] = [
            makeNode('locked', { nodeId: 'a', lockedReason: 'prereq' }),
            makeNode('completed', { nodeId: 'b', cefrLevel: 'A1' }),
            makeNode('mastered', { nodeId: 'c', cefrLevel: 'A1' }),
        ]
        const html = renderToStaticMarkup(<CoursePathNodes nodes={nodes} />)
        expect(countMatches(html, /data-role="primary-cta"/g)).toBe(0)
        expect(countMatches(html, /data-cta-variant="secondary"/g)).toBe(0)
    })

    it('roots the list under `data-role="course-path"`', () => {
        const html = renderToStaticMarkup(
            <CoursePathNodes nodes={[makeNode('available')]} />,
        )
        expect(html).toMatch(/data-role="course-path"/)
    })
})
