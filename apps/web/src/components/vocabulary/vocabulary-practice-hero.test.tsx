import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'

import { StateShell } from '@/components/gamification/state-shell'

import { VocabularyPracticeHero } from './vocabulary-practice-hero'
import { VocabularyMicrogamesHero } from './vocabulary-microgames-hero'
import { REWARD_ASSETS } from '@/components/gamification/reward-assets'

/**
 * Co-located static-contract tests for task 10.2 — wiring of the
 * `/vocabulary/practice` and `/vocabulary/microgames` learner surfaces.
 *
 * Vitest in this workspace runs under `environment: 'node'`, so we use
 * `renderToStaticMarkup` to lock the surface contract without a DOM.
 *
 * Validates: Requirements 5.3, 5.4, 5.5, 11.3, 11.5
 */

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function countMatches(html: string, pattern: RegExp): number {
    const matches = html.match(pattern)
    return matches ? matches.length : 0
}

// ---------------------------------------------------------------------------
// Default-state hero (Req 5.3)
// ---------------------------------------------------------------------------

describe('VocabularyPracticeHero — default state (Requirement 5.3)', () => {
    function renderHero() {
        return renderToStaticMarkup(
            <VocabularyPracticeHero
                eyebrow="Luyện từ vựng • A1"
                title="Bắt đầu một ván luyện ngắn"
                message="Fuxie sẽ đi cùng em qua từng chủ đề."
                ctaLabel="Bắt đầu"
                ctaHref="/vocabulary/practice/mixed?theme=a1-person&level=A1"
            />,
        )
    }

    it('resolves the mascot role to `companion` for surfaceId="vocabulary-practice"', () => {
        const html = renderHero()
        expect(html).toMatch(/data-mascot-role="companion"/)
        expect(html).toMatch(/data-mascot-surface="vocabulary-practice"/)
        expect(html).not.toMatch(/data-mascot-role="(coach|cheer|guard|silent)"/)
    })

    it('renders exactly one Primary_CTA labeled "Bắt đầu"', () => {
        const html = renderHero()
        expect(countMatches(html, /data-role="primary-cta"/g)).toBe(1)
        expect(html).toContain('Bắt đầu')
    })

    it('roots the hero with `data-surface-id="vocabulary-practice"`', () => {
        const html = renderHero()
        expect(html).toMatch(
            /data-role="vocabulary-practice-hero"[^>]*data-surface-id="vocabulary-practice"/,
        )
    })
})

// ---------------------------------------------------------------------------
// Microgames hero — reward preview (Req 5.4)
// ---------------------------------------------------------------------------

describe('VocabularyMicrogamesHero — preview reward (Requirement 5.4)', () => {
    function renderHero(rewardLabel?: string) {
        return renderToStaticMarkup(
            <VocabularyMicrogamesHero
                eyebrow="Trò chơi từ vựng • A1"
                title="Một ván ngắn, một phần thưởng nhỏ"
                message="Hoàn thành ván để Fuxie ghi điểm."
                ctaLabel="Bắt đầu"
                ctaHref="/vocabulary/practice/speed?theme=a1-person&level=A1"
                {...(rewardLabel ? { rewardLabel } : {})}
            />,
        )
    }

    it('renders the reward chip with `data-reward-state="preview"`', () => {
        const html = renderHero()
        expect(html).toMatch(/data-reward-state="preview"/)
        expect(html).toMatch(/data-reward-context="true"/)
        expect(html).toMatch(/data-reward-key="fucoin"/)
    })

    it('renders the default "+10 Fucoin" label and the REWARD_ASSETS.fucoin asset', () => {
        const html = renderHero()
        expect(html).toContain('+10 Fucoin')
        // Next/Image wraps the src — the fucoin path appears (URL-encoded
        // form is also acceptable).
        const rawPath = REWARD_ASSETS.fucoin
        const encoded = encodeURIComponent(rawPath)
        const found = html.includes(rawPath) || html.includes(encoded)
        expect(found).toBe(true)
    })

    it('resolves mascot role to `companion` and emits exactly one Primary_CTA', () => {
        const html = renderHero()
        expect(html).toMatch(/data-mascot-role="companion"/)
        expect(countMatches(html, /data-role="primary-cta"/g)).toBe(1)
    })

    it('preserves the `+N Fucoin` label shape when the caller overrides it', () => {
        const html = renderHero('+25 Fucoin')
        expect(html).toContain('+25 Fucoin')
        expect(html).not.toContain('+10 Fucoin')
    })
})

// ---------------------------------------------------------------------------
// Empty state — 0 vocabulary cards (Req 5.5, 11.3, 11.5)
// ---------------------------------------------------------------------------

describe('Vocabulary empty state — 0 cards (Requirement 5.5)', () => {
    /**
     * The page short-circuits to `<StateShell surfaceId="vocabulary"
     * state="empty">` when the learner has zero SRS cards. The shell
     * resolves the mascot role to `guard` via `SURFACE_MASCOT_CONFIG`
     * and renders exactly one Primary_CTA with the localized label.
     *
     * This test renders the same composition the page renders so the
     * acceptance contract is locked end-to-end.
     */
    function renderEmptyState() {
        return renderToStaticMarkup(
            <StateShell
                surfaceId="vocabulary"
                state="empty"
                title="Bộ sưu tập của bạn còn trống"
                message="Hãy bắt đầu với bài học đầu tiên để mở khóa thẻ từ vựng đầu tiên cho Fuxie."
                primaryCta={{
                    label: 'Học từ đầu tiên',
                    href: '/course',
                }}
            />,
        )
    }

    it('resolves the mascot role to `guard` (Requirement 12.6)', () => {
        const html = renderEmptyState()
        expect(html).toMatch(/data-mascot-role="guard"/)
        expect(html).not.toMatch(/data-mascot-role="(coach|companion|cheer|silent)"/)
    })

    it('renders exactly one Primary_CTA labeled "Học từ đầu tiên"', () => {
        const html = renderEmptyState()
        expect(countMatches(html, /data-role="primary-cta"/g)).toBe(1)
        expect(html).toContain('Học từ đầu tiên')
    })

    it('roots the shell at `data-surface-state="empty"` for surfaceId="vocabulary"', () => {
        const html = renderEmptyState()
        expect(html).toMatch(
            /data-role="state-shell"[^>]*data-surface-id="vocabulary"[^>]*data-surface-state="empty"/,
        )
    })

    it('does NOT emit reward amber attributes (Requirement 11.7)', () => {
        const html = renderEmptyState()
        expect(html).not.toMatch(/data-reward-state=/)
        expect(html).not.toMatch(/data-reward-context=/)
    })
})
