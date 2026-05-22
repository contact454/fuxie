import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'

import {
    FUXIE_WORLD_PROPS,
    PLACEHOLDER_ASSET,
} from '@/lib/mascot/fuxie-assets'

import {
    DashboardBackboneHero,
    type DashboardHeroProps,
} from './dashboard-backbone-hero'

/**
 * Coverage for task 8.2 — `villageSquare` background + scrim fallback on the
 * dashboard hero (Requirements 3.4, 3.5, 15.3).
 *
 * Key invariants under test:
 *   - The hero resolves the Village Square world prop via
 *     `pickWorldProp(['village','plaza'])` and renders it as a decorative
 *     background image (Req 3.4).
 *   - A soft `Scrim` overlay always wraps the content stack so contrast
 *     against the world prop stays AA (Req 3.4, 15.3).
 *   - Removing `villageSquare` from the registry collapses the hero to its
 *     solid `--fuxie-blue-50` background, the world-prop image is not
 *     rendered, and the section still renders (acceptance criterion of
 *     8.2 — "removing villageSquare still yields contrast-passing render").
 */

const BASE_PROPS: DashboardHeroProps = {
    state: 'default',
    greeting: 'Chào An, hôm nay học A1.2.3',
    streakChipLabel: '7 ngày streak',
    streakCount: 7,
    xpLabel: '30/50 XP hôm nay',
    questEyebrow: 'Quest hôm nay',
    questTitle: 'Hoàn thành lesson 3',
    questMessage: 'Còn 2 bước nữa.',
    ctaLabel: 'Tiếp tục học',
    ctaHref: '/course',
}

function render(overrides: Partial<DashboardHeroProps> = {}) {
    return renderToStaticMarkup(
        <DashboardBackboneHero {...BASE_PROPS} {...overrides} />,
    )
}

describe('DashboardBackboneHero — world prop background (Req 3.4)', () => {
    it('renders a `villageSquare` world prop with `aria-hidden` and the soft scrim wrapper', () => {
        const html = render()

        // Background identity element exists and is keyed to villageSquare.
        expect(html).toMatch(/data-role="dashboard-world-prop"/)
        expect(html).toMatch(/data-world-prop-key="villageSquare"/)
        // No `data-world-prop-fallback` attribute when the registry has the key.
        expect(html).not.toMatch(/data-world-prop-fallback="solid"/)

        // The decorative image carries an empty alt + aria-hidden so it is
        // skipped by assistive tech. Next/Image emits attributes in an
        // implementation-defined order, so we extract the world-prop
        // `<img>` tag and assert each attribute independently rather than
        // relying on positional regex.
        const tag = html.match(/<img\b[^>]*data-role="dashboard-world-prop"[^>]*>/)?.[0]
        expect(tag, 'expected the world-prop <img> to be rendered').toBeDefined()
        expect(tag).toMatch(/\balt=""/)
        expect(tag).toMatch(/\baria-hidden="true"/)

        // Scrim wraps the content stack so contrast over the world prop
        // stays ≥ 4.5:1 for body text (Req 3.4 / 15.3). Soft intensity is
        // the right choice for the dark-blue typography on the dashboard.
        expect(html).toMatch(/data-scrim-intensity="soft"/)
    })

    it('embeds the optimized villageSquare path through the Asset Registry', () => {
        const html = render()
        // Next/Image rewrites the src into `_next/image?url=...` at runtime;
        // in `renderToStaticMarkup` we still receive the encoded path, so
        // we look for the raw path or its URL-encoded form (mirrors the
        // pattern used in `skill-motivation-layer.test.tsx`).
        const raw = FUXIE_WORLD_PROPS.villageSquare
        const encoded = encodeURIComponent(raw)
        expect(html.includes(raw) || html.includes(encoded)).toBe(true)
    })
})

describe('DashboardBackboneHero — registry-miss fallback (Req 3.5, acceptance 8.2)', () => {
    let originalVillageSquare: string | undefined
    let warnSpy: ReturnType<typeof vi.spyOn>

    beforeEach(() => {
        originalVillageSquare = FUXIE_WORLD_PROPS.villageSquare
        // Simulate "villageSquare removed from registry": delete the entry
        // so `getFuxieWorldPropSrc` falls through to PLACEHOLDER_ASSET.
        // The lookup helper is the integration boundary the task targets.
        delete (FUXIE_WORLD_PROPS as Record<string, string>).villageSquare
        // The lookup logs a dev warning on miss; silence it so the test
        // output stays clean.
        warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    })

    afterEach(() => {
        if (originalVillageSquare !== undefined) {
            (FUXIE_WORLD_PROPS as Record<string, string>).villageSquare =
                originalVillageSquare
        }
        warnSpy.mockRestore()
    })

    it('skips the world-prop image and falls back to the solid `--fuxie-blue-50` surface', () => {
        const html = render()

        // World-prop background image is absent.
        expect(html).not.toMatch(/data-role="dashboard-world-prop"/)
        // Fallback marker is set so audits can distinguish the branch.
        expect(html).toMatch(/data-world-prop-fallback="solid"/)
        // The solid Bright Sky surface still anchors the section so
        // contrast against deep-blue text stays AA.
        expect(html).toMatch(/bg-\[var\(--fuxie-blue-50\)\]/)
        // PLACEHOLDER_ASSET must never leak into the dashboard background.
        expect(html).not.toContain(PLACEHOLDER_ASSET)
    })

    it('keeps the contrast-passing render: greeting, streak, XP, quest hero, and CTA all render', () => {
        const html = render()

        // Backbone composition still intact (Req 3.1, 3.2, 3.3) — proves
        // "removing villageSquare still yields a contrast-passing render".
        expect(html).toMatch(/data-role="dashboard-greeting"/)
        expect(html).toMatch(/data-role="dashboard-streak-chip"/)
        expect(html).toMatch(/data-role="dashboard-xp-target"/)
        expect(html).toMatch(/data-role="dashboard-quest-hero"/)
        expect(html).toMatch(/data-role="primary-cta"/)
        // The soft scrim still wraps the content so the contract holds
        // even when the world prop is absent (defense in depth).
        expect(html).toMatch(/data-scrim-intensity="soft"/)
    })
})

describe('DashboardBackboneHero — empty state preserves background contract (Req 3.6, 3.5)', () => {
    it('still renders the world-prop background and scrim, hiding only streak/XP/quest', () => {
        const html = render({
            state: 'empty',
            streakCount: 0,
            xpLabel: '',
            questEyebrow: '',
            questTitle: '',
            questMessage: '',
            ctaLabel: 'Tạo lộ trình',
            ctaHref: '/onboarding',
        })

        // Background identity stays consistent across states so the
        // empty learner sees the same Village Square framing.
        expect(html).toMatch(/data-role="dashboard-world-prop"/)
        expect(html).toMatch(/data-scrim-intensity="soft"/)
        // Req 3.6 — empty state hides streak/XP/quest.
        expect(html).not.toMatch(/data-role="dashboard-streak-chip"/)
        expect(html).not.toMatch(/data-role="dashboard-xp-target"/)
        expect(html).not.toMatch(/data-role="dashboard-quest-hero"/)
        // Single Primary_CTA still present (Req 11.3).
        expect(html).toMatch(/data-role="primary-cta"/)
    })
})
