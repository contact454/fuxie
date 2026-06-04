/**
 * Structural unit tests for {@link RoleplayStage} (task 11.2).
 *
 * Vitest runs with `environment: 'node'` in this workspace, so a real
 * `getBoundingClientRect()` measurement is not available. We instead assert
 * the *static contract* that makes the design.md §I.4 layout invariant
 * trivially true:
 *
 *  1. The two slots — `[data-role="roleplay-mascot-slot"]` and
 *     `[data-role="roleplay-avatar-slot"]` — are direct children of a
 *     single flex row container with `items-center` (same y-axis) and
 *     `justify-between` (opposite x positions).
 *  2. The mascot wrapper carries `data-mascot-role="companion"` (resolved
 *     from `SURFACE_MASCOT_CONFIG['speaking-roleplay'].states.default`).
 *  3. The avatar wrapper carries `data-role="roleplay-avatar"` and is
 *     announced as a `role="img"` for assistive tech.
 *  4. Slots declare `data-axis="left"` and `data-axis="right"` so the
 *     opposite-x contract is machine-checkable without layout.
 *
 * Validates: Requirement 6.7
 */

import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'

import { RoleplayStage } from './roleplay-stage'

function render(props: Partial<Parameters<typeof RoleplayStage>[0]> = {}) {
    return renderToStaticMarkup(<RoleplayStage learnerName="An Nguyen" {...props} />)
}

describe('RoleplayStage — stage marker (Requirement 6.7)', () => {
    it('exposes the canonical `speaking-roleplay-stage` selector on the root', () => {
        const html = render()
        expect(html).toMatch(/data-role="speaking-roleplay-stage"/)
        expect(html).toMatch(/data-surface-id="speaking-roleplay"/)
    })
})

describe('RoleplayStage — same y-axis, opposite x (Requirement 6.7)', () => {
    it('renders exactly one mascot slot and one avatar slot', () => {
        const html = render()
        const mascotSlots = html.match(/data-role="roleplay-mascot-slot"/g) ?? []
        const avatarSlots = html.match(/data-role="roleplay-avatar-slot"/g) ?? []
        expect(mascotSlots).toHaveLength(1)
        expect(avatarSlots).toHaveLength(1)
    })

    it('mascot and avatar slots share the same flex row container', () => {
        const html = render()
        // The two slots are direct children of the stage root which carries
        // both `flex` and `items-center` (shared y-axis) plus
        // `justify-between` (opposite x). We assert these classes are
        // present on the same element that owns the stage marker.
        const stageOpen = html.match(
            /<section[^>]*data-role="speaking-roleplay-stage"[^>]*>/,
        )
        expect(stageOpen, 'expected the stage <section> opening tag').not.toBeNull()
        const open = stageOpen![0]!
        // Mobile contract: flex row with items-center + justify-between.
        expect(open).toMatch(/\bflex\b/)
        expect(open).toMatch(/\bitems-center\b/)
        expect(open).toMatch(/\bjustify-between\b/)
    })

    it('exposes opposite axis markers on the two slots', () => {
        const html = render()
        // The mascot slot lives on the left axis, the avatar slot on the
        // right. Combined with the shared flex row above, this gives us a
        // machine-checkable "opposite x positions" contract without
        // requiring a real layout pass.
        const mascotSlot = html.match(
            /<div[^>]*data-role="roleplay-mascot-slot"[^>]*>/,
        )
        const avatarSlot = html.match(
            /<div[^>]*data-role="roleplay-avatar-slot"[^>]*>/,
        )
        expect(mascotSlot).not.toBeNull()
        expect(avatarSlot).not.toBeNull()
        expect(mascotSlot![0]!).toMatch(/data-axis="left"/)
        expect(avatarSlot![0]!).toMatch(/data-axis="right"/)
    })

    it('keeps mascot before avatar in DOM order so the row collapses to a single horizontal axis', () => {
        const html = render()
        const mascotIdx = html.indexOf('data-role="roleplay-mascot-slot"')
        const avatarIdx = html.indexOf('data-role="roleplay-avatar-slot"')
        expect(mascotIdx).toBeGreaterThan(-1)
        expect(avatarIdx).toBeGreaterThan(-1)
        // Both slots must appear inside the stage root and in this order so
        // the flex row's main axis maps from left (mascot) to right
        // (avatar).
        expect(mascotIdx).toBeLessThan(avatarIdx)
    })
})

describe('RoleplayStage — companion mascot resolution (Requirement 6.7)', () => {
    it('renders a companion mascot via MascotRoleHost', () => {
        const html = render()
        // `MascotRoleHost` emits `data-mascot-role="<role>"` on the wrapper.
        // The speaking-roleplay default state must resolve to "companion".
        const matches = html.match(/data-mascot-role="companion"/g) ?? []
        expect(matches).toHaveLength(1)
        // And the surface attribute should round-trip the same id.
        expect(html).toContain('data-mascot-surface="speaking-roleplay"')
    })

    it('does not render any other mascot role', () => {
        const html = render()
        for (const role of ['coach', 'cheer', 'guard'] as const) {
            expect(html).not.toContain(`data-mascot-role="${role}"`)
        }
    })
})

describe('RoleplayStage — learner avatar placeholder', () => {
    it('renders a learner avatar with role="img" and a localized aria-label', () => {
        const html = render({ learnerName: 'An Nguyen' })
        expect(html).toMatch(/data-role="roleplay-avatar"/)
        // `role="img"` exposes the placeholder to assistive tech as a single
        // node (decorative initials instead of a real photo).
        expect(html).toMatch(
            /data-role="roleplay-avatar"[^>]*role="img"[^>]*aria-label="Học viên: An Nguyen"/, // locale-allow
        )
    })

    it('renders initials for a multi-word learner name', () => {
        const html = render({ learnerName: 'An Nguyen' })
        // Two-token name ⇒ first + last initial.
        expect(html).toContain('>AN<')
    })

    it('renders a single initial for a single-token name', () => {
        const html = render({ learnerName: 'An' })
        expect(html).toContain('>A<')
    })

    it('falls back to "?" when no learner name is supplied so the slot still occupies the right edge', () => {
        const html = render({ learnerName: null })
        expect(html).toContain('>?<')
        expect(html).toMatch(/data-role="roleplay-avatar-slot"/)
    })
})

describe('RoleplayStage — center children slot', () => {
    it('renders optional centered children without breaking the row contract', () => {
        const html = render({
            children: <span data-testid="scenario-chip">A1 cafe order</span>, // locale-allow
        })
        expect(html).toContain('data-testid="scenario-chip"')
        // The row container still carries the same flex/justify-between
        // classes — children should not displace the two slots.
        const stageOpen = html.match(
            /<section[^>]*data-role="speaking-roleplay-stage"[^>]*>/,
        )!
        expect(stageOpen[0]).toMatch(/\bjustify-between\b/)
    })
})

describe('RoleplayStage — reduced motion (Requirement 13.2)', () => {
    it('strips the speak motion class when reducedMotion is true', () => {
        const html = render({ reducedMotion: true })
        expect(html).not.toContain('fuxie-mascot-motion-speak')
    })

    it('emits the speak motion class by default', () => {
        const html = render()
        expect(html).toContain('fuxie-mascot-motion-speak')
    })
})
