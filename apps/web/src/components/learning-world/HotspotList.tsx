/**
 * Original Fuxie code (no Mykonos lift). Pure presentational React
 * component plus a framework-agnostic helper that builds the renderable
 * item list from a `WorldScene`. Carries no MIT/Mykonos header per
 * Requirement 6 (the trigger is 10+ contiguous adapted lines).
 *
 * Renders the semantic, keyboard-reachable equivalent of the canvas's
 * interactive hotspots (Requirements 4.1, 4.3, 4.4, 4.5, 4.6, 4.7).
 *
 * Server-renderable: the component is pure, uses no React hooks, and does
 * NOT declare `'use client'`. The outer `LearningWorldCanvas` shell is
 * server-rendered so screen readers and headless screenshot tools see the
 * `<HotspotList>` immediately, before hydration.
 *
 * V1 polish-1: inline-styled chips so contrast on the dark panel is
 * readable without depending on global stylesheets or Tailwind classes
 * that may not be wired into the lab route. Codex visual-pass-2 finding
 * #1 measured the prior link color as `rgb(23, 59, 86)` on a dark panel —
 * not WCAG-readable. Chip styles below are tuned for ~10:1 contrast on
 * the lab panel background (`rgba(255,255,255,0.04)` over the radial
 * frame at ~`#1a2535`).
 */

import type { CSSProperties, ReactElement } from 'react'

import { isInteractive } from '@/lib/learning-world'
import type { WorldObject, WorldScene } from '@/lib/learning-world'

/**
 * One renderable Hotspot_List item, derived from a single interactive
 * `WorldObject`. Plain data; no React types so the helper is reusable
 * outside the component (e.g. by the Property 18 test).
 */
export interface HotspotItem {
    /** Stable identifier mirrored from the source `WorldObject.id`. */
    readonly id: string
    /**
     * Accessible name applied to the rendered `<a>` or `<button>`. // locale-allow
     * Guaranteed non-empty: see `buildHotspotItems` for the fallback chain.
     */
    readonly accessibleName: string
    /**
     * Anchor target. `undefined` (preserved from the source object) means
     * the item renders as a `<button>` instead of an `<a>`. // locale-allow
     */
    readonly href: string | undefined
}

/**
 * Pure helper. Returns one `HotspotItem` per interactive `WorldObject` in
 * `scene.objects`, in declaration order (Requirement 4.6).
 *
 * Accessible-name fallback chain (Requirements 4.3, 4.4):
 *
 *   accessibleName = ariaLabel ?? id ?? assetKey
 *
 * Because `WorldObject.id` is required and constructed as a non-empty
 * string by `createWorldObject`, the resulting `accessibleName` is never
 * empty even when `ariaLabel` is absent. `assetKey` is retained as the
 * final fallback for defensive depth: `WorldObject` instances built
 * outside `createWorldObject` could in principle violate the `id`
 * invariant, and the Hotspot_List MUST still render a non-empty name.
 *
 * `href` is preserved exactly as it appears on the source object: present
 * (string) when the object exposes a navigation target, `undefined` when
 * it does not. This lets the renderer decide between `<a>` and `<button>` // locale-allow
 * without re-checking the source object.
 */
export function buildHotspotItems(
    scene: WorldScene,
): readonly HotspotItem[] {
    const items: HotspotItem[] = []
    for (const o of scene.objects) {
        if (!isInteractive(o)) continue
        items.push({
            id: o.id,
            accessibleName: resolveAccessibleName(o),
            href: o.href,
        })
    }
    return items
}

function resolveAccessibleName(o: WorldObject): string {
    // ariaLabel: defined and non-empty per `createWorldObject`'s 1..200
    // length contract; trust the type but still guard against empty
    // strings produced by callers that bypass the factory.
    if (typeof o.ariaLabel === 'string' && o.ariaLabel.length > 0) {
        return o.ariaLabel
    }
    if (typeof o.id === 'string' && o.id.length > 0) {
        return o.id
    }
    return o.assetKey
}

export interface HotspotListProps {
    readonly scene: WorldScene
    /**
     * When `true`, a non-blocking `role="status"` line is rendered above
     * the list announcing that the canvas is unavailable. The list itself
     * stays operational so destinations remain reachable (Requirement 4.7).
     */
    readonly canvasUnavailable?: boolean
}

// ---------------------------------------------------------------------------
// V1 polish-1 chip styles
//
// Inline styles so the lab route does not depend on global stylesheets
// or Tailwind classes. Colors picked for AA-readable contrast on the
// dark lab panel:
//
//   chip text  : rgb(229, 240, 255)  ≈ #e5f0ff   (light cyan-white)
//   chip bg    : rgba(255, 255, 255, 0.10)
//   chip border: rgba(255, 255, 255, 0.20)
//   focus ring : 2px outline #3b82f6 + 2px offset
//   hover bg   : rgba(255, 255, 255, 0.16)
//   active bg  : rgba(255, 255, 255, 0.22)
//
// Listing radius capped at 8px per the V1 task spec. Single-line chips
// with `white-space: nowrap` so labels never overflow at 390 px mobile —
// the parent panel handles `flex-wrap` so chips wrap cleanly.
// ---------------------------------------------------------------------------

const HOTSPOT_LIST_STYLE: CSSProperties = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
    listStyle: 'none',
    margin: 0,
    padding: 0,
}

const HOTSPOT_ITEM_STYLE: CSSProperties = {
    margin: 0,
    padding: 0,
}

const CHIP_BASE_STYLE: CSSProperties = {
    // Reset the underlying <a>/<button> defaults so the chip renders
    // identically across both element types.
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    minHeight: 32,
    padding: '6px 12px',
    border: '1px solid rgba(255, 255, 255, 0.20)',
    borderRadius: 8,
    background: 'rgba(255, 255, 255, 0.10)',
    color: '#e5f0ff',
    font: 'inherit',
    fontSize: 13,
    fontWeight: 500,
    lineHeight: '20px',
    textDecoration: 'none',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    // `:hover`/`:focus-visible`/`:active` cannot be expressed in inline
    // styles, so we ship a tiny scoped <style> block alongside the list
    // (see `LAB_HOTSPOT_STYLE_SHEET` below).
}

const STATUS_STYLE: CSSProperties = {
    margin: '0 0 8px',
    padding: '6px 10px',
    borderRadius: 6,
    background: 'rgba(255, 255, 255, 0.06)',
    color: 'rgba(255, 255, 255, 0.86)',
    fontSize: 12,
    lineHeight: '18px',
}

/**
 * Scoped <style> block for hotspot chip pseudo-class states. Inlining a
 * <style> tag is the simplest way to ship hover/focus/active styling
 * from a server-renderable component without coupling the lab to global
 * CSS or Tailwind. The selectors are intentionally narrow (data-attribute
 * scoped) so they cannot leak to other surfaces.
 */
const LAB_HOTSPOT_STYLE_SHEET = `
[data-fuxie-lab-hotspot]:hover {
    background: rgba(255, 255, 255, 0.16) !important;
    border-color: rgba(255, 255, 255, 0.32) !important;
    color: #ffffff !important;
}
[data-fuxie-lab-hotspot]:focus-visible {
    outline: 2px solid #3b82f6;
    outline-offset: 2px;
    background: rgba(59, 130, 246, 0.18) !important;
    border-color: rgba(59, 130, 246, 0.6) !important;
    color: #ffffff !important;
}
[data-fuxie-lab-hotspot]:active {
    background: rgba(255, 255, 255, 0.22) !important;
    transform: translateY(1px);
}
`

/**
 * Semantic DOM equivalent of the canvas hotspots. One focusable,
 * keyboard-activatable item per interactive `WorldObject` (Requirement
 * 4.1). Native `<a>` and `<button>` elements both activate on Enter and // locale-allow
 * Space without any custom key handling (Requirement 4.5).
 */
export function HotspotList(props: HotspotListProps): ReactElement {
    const { scene, canvasUnavailable = false } = props
    const items = buildHotspotItems(scene)

    return (
        <div className="learning-world-hotspot-list">
            {/*
              Scoped style block for hover/focus/active states. Selectors
              are gated by `[data-fuxie-lab-hotspot]` so they cannot leak.
              `dangerouslySetInnerHTML` is used because a literal
              `<style>{children}</style>` would inject the children as a
              text node which React 19 then escapes — the inline approach
              is what Next.js documents for scoped CSS without a CSS-in-JS
              runtime.
            */}
            <style
                // eslint-disable-next-line react/no-danger
                dangerouslySetInnerHTML={{ __html: LAB_HOTSPOT_STYLE_SHEET }}
            />
            {canvasUnavailable ? (
                <div
                    role="status"
                    className="learning-world-hotspot-list__status"
                    style={STATUS_STYLE}
                >
                    Canvas unavailable; destinations remain reachable
                </div>
            ) : null}
            <ul
                className="learning-world-hotspot-list__items"
                style={HOTSPOT_LIST_STYLE}
            >
                {items.map((item) => (
                    <li
                        key={item.id}
                        className="learning-world-hotspot-list__item"
                        style={HOTSPOT_ITEM_STYLE}
                    >
                        {item.href !== undefined ? (
                            <a
                                href={item.href}
                                data-fuxie-lab-hotspot=""
                                style={CHIP_BASE_STYLE}
                            >
                                {item.accessibleName}
                            </a>
                        ) : (
                            <button
                                type="button"
                                data-fuxie-lab-hotspot=""
                                style={CHIP_BASE_STYLE}
                            >
                                {item.accessibleName}
                            </button>
                        )}
                    </li>
                ))}
            </ul>
        </div>
    )
}
