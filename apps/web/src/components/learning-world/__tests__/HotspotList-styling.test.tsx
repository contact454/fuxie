// Feature: fuxie-learning-world-lab-v1 polish-1, hotspot chip styling
//
// Vai chinh: QA Automation Engineer
// Vai phoi hop: Frontend Engineer
//
// Codex visual-pass-2 finding #1: hotspot link color computed to
// `rgb(23, 59, 86)` on the dark lab panel — unreadable. The fix in V1
// polish-1 is inline chip styling on every `<a>` / `<button>`. This test
// verifies the rendered SSR markup carries the V1 chip styles, so any
// regression that drops them (e.g. a future refactor that strips inline
// styles in favour of a Tailwind class wired against missing tokens)
// fails fast.
//
// Renders the component via `react-dom/server.renderToStaticMarkup` —
// the workspace already depends on `react-dom`, no new test infra
// needed. We assert against the SSR HTML rather than mounting a DOM
// (Requirement 13.4 still applies: V0 / V1 do not adopt
// `@testing-library/react`).

import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'

import { HotspotList } from '../HotspotList'
import { IsoGrid, createWorldObject } from '@/lib/learning-world'
import type { WorldScene } from '@/lib/learning-world'

const GRID = new IsoGrid({
    tileWidth: 64,
    tileHeight: 32,
    cols: 16,
    rows: 16,
})

function buildSceneWithThree(): WorldScene {
    return {
        grid: { tileWidth: 64, tileHeight: 32, cols: 16, rows: 16 },
        terrain: [],
        objects: [
            createWorldObject(
                {
                    id: 'a',
                    gx: 0,
                    gy: 0,
                    footprint: { w: 1, d: 1 },
                    assetKey: 'k1',
                    ariaLabel: 'Anchor target',
                    href: '/destination/a',
                },
                GRID,
            ),
            createWorldObject(
                {
                    id: 'b',
                    gx: 2,
                    gy: 2,
                    footprint: { w: 1, d: 1 },
                    assetKey: 'k2',
                    ariaLabel: 'Button target',
                },
                GRID,
            ),
            createWorldObject(
                {
                    id: 'c',
                    gx: 4,
                    gy: 4,
                    footprint: { w: 1, d: 1 },
                    assetKey: 'k3',
                    ariaLabel: 'Inert (not rendered)',
                    // no href, no ariaLabel? -> need ariaLabel for
                    // interactive; for "not rendered" we drop both.
                },
                GRID,
            ),
        ],
        canvasAriaLabel: 'test scene',
    }
}

describe('HotspotList chip styling (V1 polish-1, Codex finding #1)', () => {
    it('renders an <a> chip with the V1 polish-1 inline styles for href items', () => {
        const html = renderToStaticMarkup(
            <HotspotList scene={buildSceneWithThree()} />,
        )

        // First chip is the <a href> for object "a".
        // Inline `style` attribute serialises camelCase JSX keys to
        // kebab-case CSS, so we look for the CSS-form values.
        const anchorMatch = html.match(/<a[^>]*data-fuxie-lab-hotspot[^>]*>/)
        expect(anchorMatch).not.toBeNull()
        const anchor = anchorMatch![0]

        // Color must be the high-contrast off-white #e5f0ff. Codex's
        // earlier verdict caught the link defaulting to a deep blue
        // (rgb(23, 59, 86)) — assert the new value is wired.
        expect(anchor).toMatch(/color:\s*#e5f0ff/i)
        // Background must be a translucent white tint (10% alpha).
        expect(anchor).toMatch(
            /background:\s*rgba\(255,\s*255,\s*255,\s*0\.10?\)/i,
        )
        // Decoration removed (chip should not look like a default link).
        expect(anchor).toMatch(/text-decoration:\s*none/i)
        // Border radius capped at 8px per the V1 task spec.
        expect(anchor).toMatch(/border-radius:\s*8px/i)
        // Single-line chips: white-space nowrap so labels never overflow
        // at 390 px mobile (parent <ul> handles flex-wrap).
        expect(anchor).toMatch(/white-space:\s*nowrap/i)
    })

    it('renders a <button> chip with the same styling for href-less items', () => {
        const html = renderToStaticMarkup(
            <HotspotList scene={buildSceneWithThree()} />,
        )

        const buttonMatch = html.match(
            /<button[^>]*data-fuxie-lab-hotspot[^>]*>/,
        )
        expect(buttonMatch).not.toBeNull()
        const button = buttonMatch![0]

        expect(button).toMatch(/color:\s*#e5f0ff/i)
        expect(button).toMatch(
            /background:\s*rgba\(255,\s*255,\s*255,\s*0\.10?\)/i,
        )
        expect(button).toMatch(/border-radius:\s*8px/i)
        // <button> must declare type="button" so it never submits a
        // form when nested in one.
        expect(button).toMatch(/type="button"/)
    })

    it('ships the scoped pseudo-class style sheet for hover/focus/active', () => {
        const html = renderToStaticMarkup(
            <HotspotList scene={buildSceneWithThree()} />,
        )

        // The style block is scoped via [data-fuxie-lab-hotspot]; the
        // selectors must include :hover, :focus-visible, and :active so
        // the chip has the documented affordances.
        expect(html).toContain('[data-fuxie-lab-hotspot]:hover')
        expect(html).toContain('[data-fuxie-lab-hotspot]:focus-visible')
        expect(html).toContain('[data-fuxie-lab-hotspot]:active')
        // Focus ring uses outline (2px) for AA visibility.
        expect(html).toMatch(/outline:\s*2px solid #3b82f6/i)
    })

    it('lays out chips as a flex-wrap row so they reflow at narrow widths', () => {
        const html = renderToStaticMarkup(
            <HotspotList scene={buildSceneWithThree()} />,
        )
        const ulMatch = html.match(
            /<ul[^>]*learning-world-hotspot-list__items[^>]*>/,
        )
        expect(ulMatch).not.toBeNull()
        expect(ulMatch![0]).toMatch(/display:\s*flex/i)
        expect(ulMatch![0]).toMatch(/flex-wrap:\s*wrap/i)
    })

    it('renders the canvasUnavailable status block when the prop is true', () => {
        const html = renderToStaticMarkup(
            <HotspotList
                scene={buildSceneWithThree()}
                canvasUnavailable={true}
            />,
        )
        expect(html).toContain(
            'Canvas unavailable; destinations remain reachable',
        )
        expect(html).toMatch(/role="status"/)
    })
})
