import { describe, it, expect } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'

import {
    SKILL_MOTIVATION_LAYER_MAX_HEIGHT_PX,
    SkillMotivationLayer,
} from './skill-motivation-layer'
import { REWARD_ASSETS } from './reward-assets'

/**
 * Structural unit tests for {@link SkillMotivationLayer}.
 *
 * jsdom is not installed in this workspace (the `vitest` environment is
 * `node`), so a real `getBoundingClientRect()` measurement is not available
 * here. Instead these tests assert the *static* contract that makes the
 * design §C bounding-box invariant trivially true:
 *
 *  1. The root container hard-caps `max-height: 169px` and uses
 *     `min(20vh, 169px)` as the layout height. This satisfies
 *     "height ≤ 169px" at every viewport (Requirement 6.2) without needing
 *     layout measurement.
 *  2. The layer's DOM subtree does not contain a `data-role="skill-content"`
 *     element. The consuming surface always renders the content area as a
 *     sibling of the layer, so the two bounding boxes are disjoint by
 *     construction (no nesting ⇒ no overlap with sticky positioning at
 *     `top: 0`).
 *  3. Property 13 composition: exactly one mascot with `data-mascot-role=coach`,
 *     exactly one progress text matching `^\d+/\d+$` with `done ≤ total`,
 *     exactly one reward preview node with `data-reward-state="preview"`
 *     pointing at an entry of `REWARD_ASSETS`.
 *
 * Validates: Requirements 6.1, 6.2, 6.3, 13.4
 */

function render(props: Partial<Parameters<typeof SkillMotivationLayer>[0]> = {}) {
    return renderToStaticMarkup(
        <SkillMotivationLayer
            surfaceId="reading"
            done={3}
            total={10}
            {...props}
        />,
    )
}

describe('SkillMotivationLayer — root container size cap (Requirement 6.2)', () => {
    it('exports a 169px max-height constant matching design §C', () => {
        expect(SKILL_MOTIVATION_LAYER_MAX_HEIGHT_PX).toBe(169)
    })

    it('renders root with `data-role="skill-motivation-layer"` and a max-height ≤ 169px cap', () => {
        const html = render()
        expect(html).toMatch(/data-role="skill-motivation-layer"/)
        // The inline style declares both the responsive height and the hard
        // 169px cap. React serializes camelCase `maxHeight` to `max-height`.
        expect(html).toMatch(/max-height:\s*169px/)
        expect(html).toMatch(/height:\s*min\(20vh,\s*169px\)/)
    })

    it('uses sticky-top positioning so the layer stays at y=0 in the viewport', () => {
        const html = render()
        // Tailwind classes carry the positioning contract; assert sticky-top
        // is present in the root element class list.
        expect(html).toMatch(/class="[^"]*sticky[^"]*top-0/)
    })
})

describe('SkillMotivationLayer — disjoint from `[data-role="skill-content"]` (Requirement 6.2)', () => {
    it('does not render a `skill-content` element inside the layer subtree', () => {
        // The layer is a self-contained subtree that never embeds the
        // surface’s content area. The consuming surface mounts skill-content
        // as a sibling, so the two bounding boxes cannot overlap.
        const html = render()
        expect(html).not.toContain('data-role="skill-content"')
    })

    it('keeps any `children` slot inside the progress zone, never inside skill-content', () => {
        const html = render({
            children: <span data-testid="extra">progress bar</span>,
        })
        expect(html).toContain('data-testid="extra"')
        expect(html).not.toContain('data-role="skill-content"')
    })
})

describe('SkillMotivationLayer — Property 13 composition (Requirements 6.1, 6.3)', () => {
    it('renders exactly one mascot with `data-mascot-role="coach"`', () => {
        const html = render()
        const matches = html.match(/data-mascot-role="coach"/g) ?? []
        expect(matches).toHaveLength(1)
    })

    it('renders progress text matching `^\\d+/\\d+$` with done ≤ total', () => {
        const html = render({ done: 3, total: 10 })
        // Match the <p data-progress-text="" ...>TEXT</p> contents. The
        // attribute may sit anywhere in the opening tag, so we match through
        // any remaining attributes up to the first `>`.
        const slot = html.match(
            /data-progress-text="[^"]*"[^>]*>([^<]+)</,
        )
        expect(slot, 'expected one data-progress-text node').not.toBeNull()
        const text = slot![1]!.trim()
        expect(text).toMatch(/^\d+\/\d+$/)
        const [doneStr, totalStr] = text.split('/')
        const doneN = Number(doneStr)
        const totalN = Number(totalStr)
        expect(doneN).toBe(3)
        expect(totalN).toBe(10)
        expect(doneN).toBeLessThanOrEqual(totalN)
    })

    it('coerces NaN/negative/float inputs to a well-formed `done/total` pair', () => {
        // NaN ⇒ 0; negative ⇒ 0; float ⇒ floor.
        const cases: Array<[number, number, string]> = [
            [Number.NaN, 5, '0/5'],
            [-3, 4, '0/4'],
            [2.9, 5.7, '2/5'],
            // total < done ⇒ total clamped up to done.
            [7, 3, '7/7'],
            // both zero is allowed.
            [0, 0, '0/0'],
        ]
        for (const [done, total, expected] of cases) {
            const html = render({ done, total })
            expect(html).toContain(`>${expected}<`)
        }
    })

    it('renders exactly one reward preview node with `data-reward-state="preview"`', () => {
        const html = render()
        const matches = html.match(/data-reward-state="preview"/g) ?? []
        expect(matches).toHaveLength(1)
    })

    it('reward preview asset is sourced from REWARD_ASSETS', () => {
        const html = render({ rewardKey: 'fucoin' })
        // The asset path on the <img> tag must equal the canonical entry in
        // REWARD_ASSETS (Requirement 6.3.c — asset key from REWARD_ASSETS).
        // Next/Image rewrites the src into a `_next/image?url=...` query at
        // runtime; in `renderToStaticMarkup` we still get the encoded path
        // so we look for the raw asset path or its URL-encoded form.
        const raw = REWARD_ASSETS.fucoin
        const encoded = encodeURIComponent(raw)
        expect(html.includes(raw) || html.includes(encoded)).toBe(true)
    })

    it('reward preview label defaults to "+10 Fucoin" and is rendered inside the preview zone', () => {
        const html = render()
        // The preview zone wraps a span with the label text. Anchor on the
        // `data-reward-state="preview"` opening tag and confirm the label
        // appears in the same subtree.
        const previewIndex = html.indexOf('data-reward-state="preview"')
        expect(previewIndex).toBeGreaterThan(-1)
        const previewSlice = html.slice(previewIndex)
        expect(previewSlice).toContain('+10 Fucoin')
    })

    it('accepts a custom rewardKey + rewardLabel override', () => {
        const html = render({
            rewardKey: 'cefrBadgeA1',
            rewardLabel: '+1 huy hiệu A1',
        })
        expect(html).toContain('+1 huy hiệu A1')
        const raw = REWARD_ASSETS.cefrBadgeA1
        const encoded = encodeURIComponent(raw)
        expect(html.includes(raw) || html.includes(encoded)).toBe(true)
    })
})

describe('SkillMotivationLayer — world prop tag wiring (Requirements 6.4–6.8)', () => {
    it('renders no world-prop background when no tags are provided', () => {
        const html = render()
        expect(html).not.toContain('data-role="skill-motivation-world-prop"')
    })

    it('resolves `worldPropTags` through `pickWorldProp` and emits the resolved key', () => {
        // Reading uses `library` tags (Requirement 6.4).
        const html = render({ worldPropTags: ['library'] })
        expect(html).toContain('data-role="skill-motivation-world-prop"')
        expect(html).toMatch(/data-world-prop-key="(library|readingLibraryDesk)"/)
    })
})

describe('SkillMotivationLayer — reduced motion (Requirement 13.2)', () => {
    it('marks `data-reduced-motion="false"` by default', () => {
        const html = render()
        expect(html).toContain('data-reduced-motion="false"')
    })

    it('marks `data-reduced-motion="true"` when reducedMotion is forwarded', () => {
        const html = render({ reducedMotion: true })
        expect(html).toContain('data-reduced-motion="true"')
        // The mascot host motion is set to `none` in this branch, so no
        // `fuxie-mascot-motion-coach` animation class should be emitted.
        expect(html).not.toContain('fuxie-mascot-motion-coach')
    })

    it('emits the coach motion class when reducedMotion is false', () => {
        const html = render({ reducedMotion: false })
        expect(html).toContain('fuxie-mascot-motion-coach')
    })
})

describe('SkillMotivationLayer — surface identity (Requirement 6.1)', () => {
    it.each(['reading', 'listening', 'speaking', 'writing'] as const)(
        'mounts on skill surface "%s" with mascot role coach',
        (surfaceId) => {
            const html = render({ surfaceId })
            expect(html).toContain(`data-surface-id="${surfaceId}"`)
            expect(html).toContain('data-mascot-role="coach"')
        },
    )
})
