import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'

import {
    ExamInProgressChrome,
    formatExamCounter,
    formatExamTimer,
} from './ExamInProgressChrome'

/**
 * Co-located static-contract tests for {@link ExamInProgressChrome}.
 *
 * Vai chinh: Frontend Engineer
 * Vai phoi hop: Design System Designer (palette enforcement)
 *
 * Spec source-of-truth:
 *   - Task 15.1 (gamified-ui-asset-rollout)
 *   - design.md §I.8
 *   - requirements.md Req 10.1, 10.2, 10.4
 *
 * jsdom is not installed in this workspace (the `vitest` environment is
 * `node`), so the body-data-attribute side-effect from `useEffect` is not
 * exercised here. Instead these tests assert the *static* contract that
 * makes the design §I.8 invariants checkable in unit tests:
 *
 *   - Req 10.2: fixed-top timer (`mm:ss`) and counter (`done/total`)
 *   - Req 10.2: fixed-bottom Primary_CTA "Nộp bài"
 *   - Req 10.4 / Property 9: zero amber pixels — the source markup
 *     contains no `--fuxie-reward`, `--fuxie-energy`, or `--fuxie-success`
 *     tokens, no Tailwind `amber-*`/`red-*` classes, and no inline
 *     `#FFB703` literal.
 *   - Req 10.1: no mascot, no streak chip, no XP/coin badge in the chrome.
 */

function render(
    overrides: Partial<Parameters<typeof ExamInProgressChrome>[0]> = {},
): string {
    return renderToStaticMarkup(
        <ExamInProgressChrome
            remainingSeconds={overrides.remainingSeconds ?? 23 * 60 + 45}
            done={overrides.done ?? 3}
            total={overrides.total ?? 25}
            onSubmit={overrides.onSubmit ?? (() => {})}
            submitDisabled={overrides.submitDisabled}
            submitLabel={overrides.submitLabel}
        >
            {overrides.children ?? <p data-role="exam-content-stub">Q1</p>}
        </ExamInProgressChrome>,
    )
}

function countMatches(html: string, re: RegExp): number {
    return html.match(re)?.length ?? 0
}

describe('formatExamTimer (Requirement 10.2)', () => {
    it('formats ≤59 seconds as 00:ss', () => {
        expect(formatExamTimer(0)).toBe('00:00')
        expect(formatExamTimer(7)).toBe('00:07')
        expect(formatExamTimer(59)).toBe('00:59')
    })

    it('formats minute boundaries as mm:ss', () => {
        expect(formatExamTimer(60)).toBe('01:00')
        expect(formatExamTimer(23 * 60 + 45)).toBe('23:45')
    })

    it('saturates at 99 minutes so output always matches /^\\d{2}:\\d{2}$/', () => {
        expect(formatExamTimer(99 * 60)).toBe('99:00')
        // 100 minutes still renders as 99:00 — guarantees the regex.
        expect(formatExamTimer(100 * 60)).toBe('99:00')
        expect(formatExamTimer(formatExamTimerHours(10))).toMatch(
            /^\d{2}:\d{2}$/,
        )
    })

    it('clamps invalid inputs to 00:00', () => {
        expect(formatExamTimer(-5)).toBe('00:00')
        expect(formatExamTimer(Number.NaN)).toBe('00:00')
        expect(formatExamTimer(Number.POSITIVE_INFINITY)).toBe('00:00')
    })
})

function formatExamTimerHours(hours: number): number {
    return hours * 3600
}

describe('formatExamCounter (Requirement 10.2)', () => {
    it('formats {done}/{total} for valid inputs', () => {
        expect(formatExamCounter(0, 25)).toBe('0/25')
        expect(formatExamCounter(3, 25)).toBe('3/25')
        expect(formatExamCounter(25, 25)).toBe('25/25')
    })

    it('clamps done to ≤ total so done ≤ total invariant always holds', () => {
        expect(formatExamCounter(50, 25)).toBe('25/25')
    })

    it('clamps negative or non-finite inputs to 0', () => {
        expect(formatExamCounter(-3, 25)).toBe('0/25')
        expect(formatExamCounter(Number.NaN, 25)).toBe('0/25')
        expect(formatExamCounter(3, -1)).toBe('0/0')
    })
})

describe('ExamInProgressChrome — root surface attributes (Requirement 10.1)', () => {
    it('roots the section under data-surface-id="exam" + data-exam-state="in-progress"', () => {
        const html = render()
        expect(html).toMatch(/data-surface-id="exam"/)
        expect(html).toMatch(/data-exam-state="in-progress"/)
    })

    it('renders no mascot — chrome contains no [data-mascot-role] attribute', () => {
        // Req 10.1: "no mascot animation". The chrome itself never mounts
        // MascotRoleHost; the host page is also expected not to inject one
        // during in-progress (validated by Property 5 elsewhere).
        const html = render()
        expect(countMatches(html, /data-mascot-role=/g)).toBe(0)
    })

    it('renders no reward state / streak / XP badge wrappers', () => {
        // Req 10.1: "no streak, no XP/coin badge, no reward animation".
        const html = render()
        expect(countMatches(html, /data-reward-state=/g)).toBe(0)
        expect(countMatches(html, /data-reward-context=/g)).toBe(0)
        expect(countMatches(html, /data-streak-count=/g)).toBe(0)
    })
})

describe('ExamInProgressChrome — fixed top bar (Requirement 10.2)', () => {
    it('renders a single timer matching /^\\d{2}:\\d{2}$/', () => {
        const html = render({ remainingSeconds: 23 * 60 + 45 })
        expect(countMatches(html, /data-role="exam-timer"/g)).toBe(1)
        // The timer text appears verbatim in the static markup.
        expect(html).toContain('>23:45<')
    })

    it('renders a single counter matching /^\\d+\\/\\d+$/ with done ≤ total', () => {
        const html = render({ done: 3, total: 25 })
        expect(countMatches(html, /data-role="exam-counter"/g)).toBe(1)
        expect(html).toContain('>3/25<')
    })

    it('clamps done > total in the rendered counter so done ≤ total always holds', () => {
        const html = render({ done: 99, total: 25 })
        expect(html).toContain('>25/25<')
    })
})

describe('ExamInProgressChrome — fixed bottom Primary_CTA (Requirement 10.2)', () => {
    it('renders exactly one data-role="primary-cta" with default label "Nộp bài"', () => {
        const html = render()
        expect(countMatches(html, /data-role="primary-cta"/g)).toBe(1)
        expect(html).toContain('>Nộp bài<')
    })

    it('strips data-role="primary-cta" when submitDisabled (Property 8 invariant)', () => {
        // PrimaryCta drops `data-role` while disabled so a confirm modal or
        // submit-in-flight overlay can carry the single Primary_CTA.
        const html = render({ submitDisabled: true })
        expect(countMatches(html, /data-role="primary-cta"/g)).toBe(0)
        // Fallback: the button is still rendered (with disabled attribute).
        expect(html).toContain('>Nộp bài<')
        expect(html).toMatch(/disabled(=""|>)/)
    })

    it('honours submitLabel override', () => {
        const html = render({ submitLabel: 'Đã xong' })
        expect(html).toContain('>Đã xong<')
    })
})

describe('ExamInProgressChrome — palette discipline (Requirement 10.4 / Property 9)', () => {
    it('does not reference --fuxie-reward / --fuxie-energy / --fuxie-success in the chrome markup', () => {
        const html = render()
        expect(html).not.toContain('--fuxie-reward')
        expect(html).not.toContain('--fuxie-energy')
        expect(html).not.toContain('--fuxie-success')
    })

    it('does not contain the literal reward amber #FFB703 (case-insensitive)', () => {
        const html = render()
        expect(html.toLowerCase()).not.toContain('#ffb703')
        // Also reject the rgb form.
        expect(html.replace(/\s+/g, '')).not.toMatch(/rgb\(255,?\s*183,?\s*3\)/)
    })

    it('does not use Tailwind amber/red/orange/green/yellow utility classes', () => {
        // Req 10.4 — neutral + deep blue only. These Tailwind palettes ship
        // colors close to or inside the reward/energy/success ranges and
        // are explicitly excluded from the in-progress chrome.
        const html = render()
        expect(html).not.toMatch(/\b(?:bg|text|border|ring)-amber-/)
        expect(html).not.toMatch(/\b(?:bg|text|border|ring)-red-/)
        expect(html).not.toMatch(/\b(?:bg|text|border|ring)-orange-/)
        expect(html).not.toMatch(/\b(?:bg|text|border|ring)-yellow-/)
        expect(html).not.toMatch(/\b(?:bg|text|border|ring)-green-/)
    })
})

describe('ExamInProgressChrome — host content slot', () => {
    it('renders host children inside the data-role="exam-content" region', () => {
        const html = render({
            children: <p data-role="exam-content-stub">Question text</p>,
        })
        expect(html).toContain('data-role="exam-content"')
        expect(html).toContain('data-role="exam-content-stub"')
        expect(html).toContain('Question text')
    })
})
