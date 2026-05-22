/**
 * a11y.spec.tsx — Integration accessibility audit for every P0 surface.
 *
 * Vai chinh: Design System Designer
 * Vai phoi hop: Frontend Engineer (component glue),
 *               QA Automation Engineer (axe-core wiring)
 *
 * Spec source-of-truth:
 *   - Task 18.2 (gamified-ui-asset-rollout)
 *   - design.md §H (Accessibility), §I (P0 surface designs)
 *   - requirements.md Req 4.2, 15.1, 15.2, 15.4, 15.5
 *
 * What this test does
 * -------------------
 * The 18.2 design called for `jest-axe / Playwright axe` on each P0 surface.
 * The repository does NOT yet ship a Playwright runner (task 18.1 is in
 * parallel and will introduce it). To keep the a11y guarantee gated on every
 * PR without blocking on 18.1, this spec runs the canonical axe engine
 * (`axe-core` — the same engine `@axe-core/playwright` wraps) against the
 * server-rendered HTML of each P0 surface backbone component, evaluated
 * inside a JSDOM document.
 *
 * For every P0 surface we render the most representative backbone
 * component(s) into a JSDOM `Document`, run `axe.run` on the rendered
 * subtree, and assert that the result contains zero violations of severity
 * `serious` or `critical`.
 *
 * What this test additionally enforces
 * ------------------------------------
 *   - Focus order matches DOM order: the order of focusable elements
 *     reported by `:is(a, button, input, [tabindex]:not([tabindex="-1"]))`
 *     must match their DOM document order (Req 4.2 — the first
 *     `available` Course node is the first interactive element on the
 *     path; and the cross-surface invariant from §H that "DOM order match
 *     visual order"). Concretely we forbid any positive `tabindex` in the
 *     rendered tree, since a positive `tabindex` is the only way the
 *     browser would re-order tabs away from DOM order.
 *   - Focus outline ≥ 2px and contrast ≥ 3:1: the project's design-system
 *     `PrimaryCta` primitive is the single source of truth for Primary_CTA
 *     focus styling (`focus-visible:outline focus-visible:outline-2
 *     focus-visible:outline-offset-2 focus-visible:outline-[var(--fuxie-blue-700)]`).
 *     We assert the static contract on every Primary_CTA:
 *       - The outline class set is present (≥2px width is set by Tailwind's
 *         `outline-2`).
 *       - The outline color resolves to `--fuxie-blue-700` (#3078B4), which
 *         contrasts ≥ 3:1 against the document background `#F3FBFF`
 *         (Bright Sky 50) and against white. The contrast ratio is computed
 *         from the documented token values to keep this assertion
 *         deterministic — Playwright + a real browser is required to
 *         validate the *rendered* outline width, which is left to task
 *         18.1's webServer once it ships.
 *
 * Documented limitations (gaps relative to the original task brief)
 * -----------------------------------------------------------------
 *   1. Empty / error states for surfaces that require server fixtures
 *      (course path nodes, vocabulary lists, skill players, exam) are
 *      represented by their `StateShell` empty/error variant — the same
 *      shell every P0 surface composes per task 16.1/16.2. Surfaces whose
 *      empty/error state is structurally distinct from the shell (none
 *      currently — every P0 surface delegates to `StateShell` per
 *      `check:state-shell-coverage`) would warrant separate cases.
 *   2. Contrast on world-prop *image* backgrounds cannot be measured here
 *      because JSDOM does not paint pixels. The static `Scrim` component
 *      with `intensity="soft"` (rgba(255,255,255,0.8)) sits between the
 *      world prop and body text on the surfaces that use a world prop
 *      (Dashboard, Reading, Listening, Speaking, Writing) — see
 *      `apps/web/src/components/ui/scrim.tsx` and §H of the design.
 *      Pixel-level verification belongs to task 18.1's Playwright run.
 *   3. The `@axe-core/playwright` integration is not used directly because
 *      the workspace does not yet ship Playwright. Once 18.1 introduces a
 *      Playwright config + webServer, this file's surfaces can be re-run
 *      against the real browser-rendered DOM by importing
 *      `@axe-core/playwright` and pointing it at each P0 route.
 *
 * Validates: Requirements 4.2, 15.1, 15.2, 15.4, 15.5
 */

import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { JSDOM, VirtualConsole } from 'jsdom'
import axe from 'axe-core'
import type { ReactElement } from 'react'

import { DashboardBackboneHero } from '../../apps/web/src/components/dashboard/dashboard-backbone-hero'
import { ReviewBackboneHero } from '../../apps/web/src/components/review/review-backbone-hero'
import { ExamInProgressChrome } from '../../apps/web/src/components/exam/ExamInProgressChrome'
import { VocabularyPracticeHero } from '../../apps/web/src/components/vocabulary/vocabulary-practice-hero'
import { VocabularyMicrogamesHero } from '../../apps/web/src/components/vocabulary/vocabulary-microgames-hero'
import { RoleplayStage } from '../../apps/web/src/components/speaking/roleplay-stage'
import { SkillMotivationLayer } from '../../apps/web/src/components/gamification/skill-motivation-layer'
import {
    StateShell,
    type StateShellProps,
} from '../../apps/web/src/components/gamification/state-shell'

// -----------------------------------------------------------------------------
// JSDOM + axe glue
// -----------------------------------------------------------------------------

/**
 * Render a React element to static markup, parse it inside a fresh JSDOM
 * document, and return the document. We seed `<html>` with a Bright Sky
 * background so the body's effective background-color matches the design
 * tokens consumers ship in production (`var(--fuxie-blue-50)` ≈ `#F3FBFF`).
 *
 * Returning a fresh JSDOM per render keeps tests independent — axe writes
 * caches onto `document` between runs.
 */
function renderToJsdom(element: ReactElement): {
    dom: JSDOM
    document: Document
    root: HTMLElement
} {
    const html = renderToStaticMarkup(element)
    // axe-core's color-contrast rule asks the canvas API whether a glyph
    // is an icon ligature. JSDOM ships without a canvas backend (we keep
    // the install footprint small — `canvas` is a native module) and
    // emits a `not-implemented` virtual console warning per call. Those
    // warnings are noise here, so we route them through a quiet
    // VirtualConsole. axe-core falls back to "treat as text" when canvas
    // is unavailable, which keeps the contrast assertion conservative
    // (any borderline case is reported, not silently passed).
    const virtualConsole = new VirtualConsole()
    virtualConsole.on('jsdomError', (err: Error) => {
        if (err.message.includes('Not implemented: HTMLCanvasElement')) {
            return
        }
        // Surface anything else so genuine issues are not hidden.
        // eslint-disable-next-line no-console
        console.error(err)
    })

    const dom = new JSDOM(
        `<!doctype html><html lang="vi"><head><title>P0 surface a11y test</title></head><body style="background-color: #F3FBFF;"><div id="root">${html}</div></body></html>`,
        { runScripts: 'outside-only', virtualConsole },
    )
    const document = dom.window.document
    const root = document.getElementById('root') as HTMLElement
    return { dom, document, root }
}

interface AxeRunResult {
    violations: axe.Result[]
}

/**
 * Run axe-core inside the supplied JSDOM document and return the violations.
 *
 * We restrict the rule set to WCAG 2.1 AA (`wcag2a, wcag2aa, wcag21a,
 * wcag21aa`) tags so the assertion mirrors what
 * `@axe-core/playwright` enforces by default in 18.1 once it ships. We
 * also disable the `region` rule because backbone components are
 * intentionally rendered in isolation here (no `<main>`/`<nav>` wrapper),
 * which would generate a false positive that does not apply to the
 * production page composition.
 */
async function runAxe(dom: JSDOM): Promise<AxeRunResult> {
    // axe-core reads `window` / `document` globals before scanning. In a
    // pure Node + Vitest environment these are absent, so we install the
    // JSDOM window onto `globalThis` for the duration of the run. We
    // restore the previous values afterwards so independent tests can
    // each install their own JSDOM without leaking state across runs.
    const previousWindow = (globalThis as { window?: unknown }).window
    const previousDocument = (globalThis as { document?: unknown }).document
    ;(globalThis as { window?: unknown }).window = dom.window
    ;(globalThis as { document?: unknown }).document = dom.window.document
    try {
        // axe-core's `setupGlobals` deduces `window` and `document` from
        // `context.ownerDocument`. Document nodes have `ownerDocument === null`,
        // so passing the document itself does not satisfy the check.
        // We pass `documentElement` instead — its `ownerDocument` is the
        // JSDOM document, which carries a `defaultView` (the JSDOM window),
        // letting axe-core resolve both globals without leaking onto the
        // real Vitest worker scope.
        const result = await axe.run(dom.window.document.documentElement, {
            runOnly: {
                type: 'tag',
                values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'],
            },
            rules: {
                // Region rule is page-shell-scoped — backbone components are
                // tested in isolation so the wrapping <main> is intentionally
                // absent here. The production layout
                // (apps/web/src/app/(learn)/layout.tsx) provides the landmark.
                region: { enabled: false },
            },
            resultTypes: ['violations'],
        })
        return { violations: result.violations }
    } finally {
        if (previousWindow === undefined) {
            delete (globalThis as { window?: unknown }).window
        } else {
            ;(globalThis as { window?: unknown }).window = previousWindow
        }
        if (previousDocument === undefined) {
            delete (globalThis as { document?: unknown }).document
        } else {
            ;(globalThis as { document?: unknown }).document = previousDocument
        }
    }
}

/**
 * Filter violations to the severities the task acceptance gates on
 * ("zero serious/critical axe violations").
 */
function pickBlockingViolations(violations: axe.Result[]): axe.Result[] {
    return violations.filter(
        (v) => v.impact === 'serious' || v.impact === 'critical',
    )
}

/**
 * Pretty-print axe violations for the failure message.
 */
function formatViolations(violations: axe.Result[]): string {
    if (violations.length === 0) {
        return '(none)'
    }
    return violations
        .map((v) => {
            const targets = v.nodes
                .map((n) => n.target.join(' '))
                .slice(0, 3)
                .join('; ')
            return `${v.id} [${v.impact}]: ${v.help} — nodes: ${targets} — see ${v.helpUrl}`
        })
        .join('\n')
}

// -----------------------------------------------------------------------------
// Focus order helpers
// -----------------------------------------------------------------------------

/**
 * Selector capturing the focusable elements the design's accessibility
 * §H calls out: anchors, buttons, inputs, and explicit `[tabindex]`
 * (excluding the "skip me" `tabindex="-1"`).
 */
const FOCUSABLE_SELECTOR =
    'a[href], button, input, [tabindex]:not([tabindex="-1"])'

/**
 * Walk the document body in DOM document order and return every node that
 * matches `FOCUSABLE_SELECTOR`.
 */
function focusablesInDocumentOrder(document: Document): Element[] {
    return Array.from(document.body.querySelectorAll(FOCUSABLE_SELECTOR))
}

/**
 * Tab order, as the browser would compute it. Without any explicit
 * positive `tabindex` (the design never uses positive tabindex — design
 * §H says "DOM order match visual order"), the browser tabs through
 * focusable elements in DOM order. We assert that no element in the
 * rendered tree opts out of this rule by setting a positive `tabindex`,
 * which would re-order the sequence.
 */
function assertFocusOrderMatchesDom(document: Document, label: string) {
    const focusables = focusablesInDocumentOrder(document)
    for (const node of focusables) {
        const tabindex = node.getAttribute('tabindex')
        if (tabindex !== null && tabindex !== '0' && tabindex !== '-1') {
            const positive = Number(tabindex)
            if (Number.isFinite(positive) && positive > 0) {
                throw new Error(
                    `[${label}] focus order would not match DOM order — found tabindex="${tabindex}" on <${node.tagName.toLowerCase()}> (${node.outerHTML.slice(0, 120)}…). Positive tabindex re-orders the sequence.`,
                )
            }
        }
    }
}

// -----------------------------------------------------------------------------
// Primary_CTA focus outline contract
// -----------------------------------------------------------------------------

/**
 * Tailwind tokens emitted by `apps/web/src/components/ui/primary-cta.tsx`
 * for visible focus. Together they give us:
 *  - `focus-visible:outline` — turns the outline on
 *  - `focus-visible:outline-2` — width = 2px (Req 15.4 floor)
 *  - `focus-visible:outline-offset-2` — separation from the button edge
 *  - `focus-visible:outline-[var(--fuxie-blue-700)]` — outline color
 *    `#3078B4`, which contrasts ≥ 3:1 against the Bright Sky 50 page bg
 *    (`#F3FBFF`) AND against white card surfaces (Req 15.4).
 */
const REQUIRED_FOCUS_RING_TOKENS = [
    'focus-visible:outline',
    'focus-visible:outline-2',
    'focus-visible:outline-offset-2',
    'focus-visible:outline-[var(--fuxie-blue-700)]',
] as const

function assertPrimaryCtaFocusContract(document: Document, label: string) {
    const ctas = Array.from(
        document.body.querySelectorAll('[data-role="primary-cta"]'),
    )
    expect(ctas.length, `[${label}] expected at least one Primary_CTA`).toBeGreaterThan(0)
    for (const cta of ctas) {
        const cls = cta.getAttribute('class') ?? ''
        for (const token of REQUIRED_FOCUS_RING_TOKENS) {
            expect(
                cls,
                `[${label}] Primary_CTA missing focus token "${token}" (Req 15.4) — actual classes: ${cls}`,
            ).toContain(token)
        }
    }
}

/**
 * Compute the WCAG 2.1 contrast ratio between two sRGB colors. Used to
 * sanity-check the design token values themselves so the test is
 * self-contained — once the tokens are stable this assertion is trivial,
 * but it documents *why* the focus outline color is acceptable.
 */
function relativeLuminance(rgb: [number, number, number]): number {
    const [r, g, b] = rgb.map((channel) => {
        const c = channel / 255
        return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
    }) as [number, number, number]
    return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

function contrastRatio(
    a: [number, number, number],
    b: [number, number, number],
): number {
    const la = relativeLuminance(a)
    const lb = relativeLuminance(b)
    const [lighter, darker] = la >= lb ? [la, lb] : [lb, la]
    return (lighter + 0.05) / (darker + 0.05)
}

// -----------------------------------------------------------------------------
// Surface fixtures
// -----------------------------------------------------------------------------

const DEFAULT_DASHBOARD_PROPS = {
    state: 'default' as const,
    greeting: 'Chào An, hôm nay học A1.2.3',
    streakChipLabel: '7 ngày streak',
    streakCount: 7,
    xpLabel: '30/50 XP hôm nay',
    questEyebrow: 'Quest hôm nay',
    questTitle: 'Hoàn thành Reading 1',
    questMessage: 'Còn 2 hoạt động — bạn đang trên đà.',
    ctaLabel: 'Tiếp tục học',
    ctaHref: '/course',
}

const EMPTY_DASHBOARD_PROPS = {
    ...DEFAULT_DASHBOARD_PROPS,
    state: 'empty' as const,
    streakCount: 0,
    ctaLabel: 'Tạo lộ trình',
    ctaHref: '/onboarding',
}

const DEFAULT_REVIEW_PROPS = {
    state: 'default' as const,
    dueToday: 12,
    overdue: 3,
    dueLabel: 'Hôm nay đến hạn',
    overdueLabel: 'Quá hạn',
    ctaLabel: 'Ôn ngay',
    ctaHref: '#review-session',
    title: 'Sẵn sàng ôn 15 thẻ',
    message: 'Bạn còn 12 thẻ hôm nay và 3 thẻ quá hạn. Ôn ngay để giữ streak.',
}

const EMPTY_REVIEW_PROPS = {
    ...DEFAULT_REVIEW_PROPS,
    state: 'empty' as const,
    dueToday: 0,
    overdue: 0,
    ctaLabel: 'Học bài mới',
    ctaHref: '/course',
    title: 'Bạn đã ôn xong hôm nay',
    message: 'Quay lại sau 24 giờ để giữ trí nhớ tươi mới.',
}

const DEFAULT_VOCAB_PRACTICE_PROPS = {
    eyebrow: 'Luyện từ vựng • A1',
    title: 'Sẵn sàng luyện 12 thẻ',
    message: 'Bạn còn 12 thẻ hôm nay. Bắt đầu để giữ streak.',
    ctaLabel: 'Bắt đầu',
    ctaHref: '/vocabulary/practice/session',
}

const DEFAULT_VOCAB_MICROGAMES_PROPS = {
    eyebrow: 'Trò chơi từ vựng • A1',
    title: 'Săn Fucoin với 5 trò chơi',
    message: 'Mỗi trò chơi tặng phần thưởng nhỏ. Hoàn tất 5 trò để lên cấp.',
    ctaLabel: 'Bắt đầu',
    ctaHref: '/vocabulary/microgames/session',
}

const DEFAULT_EXAM_PROPS = {
    remainingSeconds: 23 * 60 + 45,
    done: 3,
    total: 25,
    onSubmit: () => {},
}

const SKILL_SURFACE_FIXTURES: ReadonlyArray<{
    label: string
    surfaceId: 'reading' | 'listening' | 'speaking' | 'writing'
    worldTags: ReadonlyArray<'library' | 'studio' | 'cafe' | 'desk'>
}> = [
    { label: 'reading', surfaceId: 'reading', worldTags: ['library'] },
    { label: 'listening', surfaceId: 'listening', worldTags: ['studio'] },
    { label: 'speaking', surfaceId: 'speaking', worldTags: ['cafe'] },
    { label: 'writing', surfaceId: 'writing', worldTags: ['desk'] },
]

// -----------------------------------------------------------------------------
// Test cases — one describe block per P0 surface (Req 20.1)
// -----------------------------------------------------------------------------

describe('a11y audit — Bright Sky design tokens (Req 15.4)', () => {
    /**
     * Anchor the focus-outline contrast assertion on a self-contained
     * WCAG ratio computation so the rest of the spec can lean on the
     * design tokens.
     */
    it('outline color #3078B4 contrasts ≥ 3:1 against #F3FBFF (Bright Sky 50)', () => {
        const ratio = contrastRatio([0x30, 0x78, 0xb4], [0xf3, 0xfb, 0xff])
        expect(ratio).toBeGreaterThanOrEqual(3)
    })

    it('outline color #3078B4 contrasts ≥ 3:1 against #FFFFFF (white card)', () => {
        const ratio = contrastRatio([0x30, 0x78, 0xb4], [0xff, 0xff, 0xff])
        expect(ratio).toBeGreaterThanOrEqual(3)
    })
})

interface SurfaceCase {
    label: string
    surfaceId: string
    state: 'default' | 'empty' | 'error'
    render: () => ReactElement
    /**
     * Some surfaces (e.g. SkillMotivationLayer, RoleplayStage) intentionally
     * do not host a Primary_CTA — the surface page does. When false, the
     * CTA focus contract assertion is skipped for this case.
     */
    expectsPrimaryCta?: boolean
}

const STATE_SHELL_BASE_PRIMARY = {
    label: 'Thử lại',
    onClick: () => {},
}

const STATE_SHELL_EMPTY_BASE: Pick<
    StateShellProps,
    'state' | 'message' | 'primaryCta'
> = {
    state: 'empty',
    message: 'Bạn chưa có hoạt động hôm nay. Bắt đầu một bài học để mở khóa nhé.',
    primaryCta: { label: 'Bắt đầu học', href: '/course' },
}

const STATE_SHELL_ERROR_BASE: Pick<
    StateShellProps,
    'state' | 'message' | 'primaryCta'
> = {
    state: 'error',
    message: 'Không tải được dữ liệu. Vui lòng thử lại.',
    primaryCta: STATE_SHELL_BASE_PRIMARY,
}

const SURFACE_CASES: ReadonlyArray<SurfaceCase> = [
    // --- Dashboard (Req 3, 11.1, 15.x) -------------------------------------
    {
        label: 'dashboard / default',
        surfaceId: 'dashboard',
        state: 'default',
        render: () => <DashboardBackboneHero {...DEFAULT_DASHBOARD_PROPS} />,
    },
    {
        label: 'dashboard / empty',
        surfaceId: 'dashboard',
        state: 'empty',
        render: () => <DashboardBackboneHero {...EMPTY_DASHBOARD_PROPS} />,
    },
    {
        label: 'dashboard / error',
        surfaceId: 'dashboard',
        state: 'error',
        render: () => (
            <StateShell surfaceId="dashboard" {...STATE_SHELL_ERROR_BASE} />
        ),
    },

    // --- Course (Req 4) ----------------------------------------------------
    // The Course page is composed from CourseNode + CourseModuleClusterHeader
    // primitives that are unit-tested separately (course-node.test.tsx,
    // course-module-cluster.test.tsx). For the integration a11y pass we
    // exercise the empty/error state shells the page composes, which carry
    // the focus-order + contrast contract the surface needs to satisfy.
    {
        label: 'course / empty',
        surfaceId: 'course',
        state: 'empty',
        render: () => (
            <StateShell
                surfaceId="course"
                {...STATE_SHELL_EMPTY_BASE}
                message="Bạn chưa có lộ trình. Tạo lộ trình để bắt đầu hành trình học."
                primaryCta={{ label: 'Tạo lộ trình', href: '/onboarding' }}
            />
        ),
    },
    {
        label: 'course / error',
        surfaceId: 'course',
        state: 'error',
        render: () => (
            <StateShell surfaceId="course" {...STATE_SHELL_ERROR_BASE} />
        ),
    },

    // --- Vocabulary (Req 5) ------------------------------------------------
    {
        label: 'vocabulary-practice / default',
        surfaceId: 'vocabulary-practice',
        state: 'default',
        render: () => (
            <VocabularyPracticeHero {...DEFAULT_VOCAB_PRACTICE_PROPS} />
        ),
    },
    {
        label: 'vocabulary-microgames / default',
        surfaceId: 'vocabulary-microgames',
        state: 'default',
        render: () => (
            <VocabularyMicrogamesHero {...DEFAULT_VOCAB_MICROGAMES_PROPS} />
        ),
    },
    {
        label: 'vocabulary / empty',
        surfaceId: 'vocabulary',
        state: 'empty',
        render: () => (
            <StateShell
                surfaceId="vocabulary"
                {...STATE_SHELL_EMPTY_BASE}
                message="Bạn chưa có từ nào trong sổ. Học từ đầu tiên để bắt đầu sưu tầm."
                primaryCta={{
                    label: 'Học từ đầu tiên',
                    href: '/vocabulary/practice',
                }}
            />
        ),
    },
    {
        label: 'vocabulary / error',
        surfaceId: 'vocabulary',
        state: 'error',
        render: () => (
            <StateShell surfaceId="vocabulary" {...STATE_SHELL_ERROR_BASE} />
        ),
    },

    // --- Skill players (Req 6) --------------------------------------------
    // The full skill player page composes SkillMotivationLayer + content
    // area + bottom Primary_CTA. We exercise the motivation layer (which
    // owns the mascot, progress, reward preview) plus the empty/error
    // shell — together they cover the static a11y surface for each player.
    ...SKILL_SURFACE_FIXTURES.flatMap<SurfaceCase>((skill) => [
        {
            label: `${skill.label} / default (motivation layer)`,
            surfaceId: skill.surfaceId,
            state: 'default',
            render: () => (
                <SkillMotivationLayer
                    surfaceId={skill.surfaceId}
                    done={3}
                    total={10}
                    rewardLabel="+10 Fucoin"
                    worldPropTags={[...skill.worldTags]}
                />
            ),
            // The motivation layer is a banner — the host page provides the
            // bottom Primary_CTA. We don't enforce the CTA focus contract
            // here; the surface-page case above does on every other surface.
            expectsPrimaryCta: false,
        },
        {
            label: `${skill.label} / error`,
            surfaceId: skill.surfaceId,
            state: 'error',
            render: () => (
                <StateShell
                    surfaceId={skill.surfaceId}
                    {...STATE_SHELL_ERROR_BASE}
                />
            ),
        },
    ]),

    // --- Speaking roleplay (Req 6.7) --------------------------------------
    {
        label: 'speaking-roleplay / default',
        surfaceId: 'speaking-roleplay',
        state: 'default',
        render: () => <RoleplayStage learnerName="An Nguyen" />,
        // RoleplayStage is a stage band — Primary_CTA lives below it on the
        // host page. Skip the CTA focus assertion here.
        expectsPrimaryCta: false,
    },

    // --- Review (Req 9) ----------------------------------------------------
    {
        label: 'review / default',
        surfaceId: 'review',
        state: 'default',
        render: () => <ReviewBackboneHero {...DEFAULT_REVIEW_PROPS} />,
    },
    {
        label: 'review / empty',
        surfaceId: 'review',
        state: 'empty',
        render: () => <ReviewBackboneHero {...EMPTY_REVIEW_PROPS} />,
    },
    {
        label: 'review / error',
        surfaceId: 'review',
        state: 'error',
        render: () => (
            <StateShell surfaceId="review" {...STATE_SHELL_ERROR_BASE} />
        ),
    },

    // --- Shop (Req 8) ------------------------------------------------------
    // ShopBackboneClient is a `'use client'` component whose default
    // render path requires server-fetched catalog data. The empty/error
    // shell is exercised via StateShell + dedicated unit tests in
    // shop-backbone-client.test.tsx — here we cover the error shell.
    {
        label: 'rewards-shop / error',
        surfaceId: 'rewards-shop',
        state: 'error',
        render: () => (
            <StateShell
                surfaceId="rewards-shop"
                {...STATE_SHELL_ERROR_BASE}
            />
        ),
    },

    // --- Exam (Req 10) -----------------------------------------------------
    {
        label: 'exam / default (in-progress)',
        surfaceId: 'exam',
        state: 'default',
        render: () => (
            <ExamInProgressChrome {...DEFAULT_EXAM_PROPS}>
                <p data-role="exam-content-stub">Q1</p>
            </ExamInProgressChrome>
        ),
    },
    {
        label: 'exam / error',
        surfaceId: 'exam',
        state: 'error',
        render: () => (
            <StateShell surfaceId="exam" {...STATE_SHELL_ERROR_BASE} />
        ),
    },
]

// One describe per surface keeps failure output readable: a violation in
// "review / error" lands under a clearly-named block instead of the
// `forEach` blob.
for (const surface of SURFACE_CASES) {
    describe(`a11y audit — ${surface.label}`, () => {
        it('reports zero serious/critical axe violations', async () => {
            const { dom } = renderToJsdom(surface.render())
            const { violations } = await runAxe(dom)
            const blocking = pickBlockingViolations(violations)
            expect(
                blocking,
                `[${surface.label}] axe violations:\n${formatViolations(blocking)}`,
            ).toEqual([])
        })

        it('focus order matches DOM order (no positive tabindex)', () => {
            const { document } = renderToJsdom(surface.render())
            assertFocusOrderMatchesDom(document, surface.label)
        })

        if (surface.expectsPrimaryCta !== false) {
            it('Primary_CTA carries the design-system focus outline contract (Req 15.4)', () => {
                const { document } = renderToJsdom(surface.render())
                assertPrimaryCtaFocusContract(document, surface.label)
            })
        }
    })
}
