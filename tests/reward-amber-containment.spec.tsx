/**
 * Reward Amber Containment + Bright Sky CTA Discipline — Property-Based
 * Tests (task 17.2 of spec `gamified-ui-asset-rollout`).
 *
 * Vai chinh: QA Automation Engineer
 * Vai phoi hop: Frontend Engineer (component glue), Design System
 *               Designer (palette tokens)
 *
 * Spec source-of-truth:
 *   - `.kiro/specs/gamified-ui-asset-rollout/tasks.md` task 17.2
 *   - `.kiro/specs/gamified-ui-asset-rollout/design.md` §E (Reward_State
 *     handling), §F (Bright Sky palette enforcement)
 *   - `.kiro/specs/gamified-ui-asset-rollout/requirements.md` Req 6.9,
 *     10.1, 10.4, 11.7, 16.1–16.5, 19.4
 *   - `docs/design/design-tokens.md` (reward-amber containment rule,
 *     Primary_CTA palette discipline, energy-orange budget)
 *
 * Properties wired in this file:
 *
 * **Property 9 — Reward Amber Containment.**
 *   Every node in the rendered DOM whose class- or style-emitted color
 *   references reward amber `rgb(255, 183, 3)` (within ±5% per channel)
 *   MUST have an ancestor that carries either `data-reward-context="true"`
 *   OR `data-reward-state` ∈ `{preview, earned, receipt}`. Subtrees
 *   marked `data-reward-state="locked"` / `"pending"` do NOT permit
 *   reward amber, and `locked|empty|error` shells must be amber-free
 *   (Req 11.7, Req 16.5). The exam `in-progress` chrome must contain
 *   zero amber pixels (Req 10.1, Req 10.4).
 *
 * **Property 22 — Bright Sky CTA Discipline.**
 *   Every `data-role="primary-cta"` element MUST carry a Bright Sky blue
 *   class/token (one of `--fuxie-action`, `--fuxie-action-hover`,
 *   `--fuxie-blue-{500..700}`) on its background or border. It MUST
 *   NOT carry an energy-orange (`var(--fuxie-energy)`, `#FF8A3D`,
 *   `text-fuxie-energy`, `bg-fuxie-energy`, `bg-orange-*`,
 *   `border-orange-*`) token directly. The "energy orange ≤ 5% of
 *   surface area" rule (Req 16.3) is not measurable in JSDOM (no paint),
 *   so this property checks the strictly stronger boolean — the energy
 *   token never appears on a Primary_CTA element — which is what the
 *   Property 22 task brief defers to here.
 *
 * Validates: Requirements 6.9, 10.1, 10.4, 11.7, 16.1, 16.2, 16.3,
 *            16.4, 16.5, 19.4
 *
 * Why this file lives at the repo-root `tests/` folder: same convention
 * as the rest of the PBT specs (`tests/mascot-role.spec.tsx`,
 * `tests/skill-motivation-layer.spec.tsx`, etc.) so it runs via
 * `pnpm test:property` (root `vitest.property.config.ts`,
 * `environment: 'node'`). React rendering uses
 * `react-dom/server.renderToStaticMarkup`, then JSDOM parses the
 * resulting markup so we can do ancestor walks with the production
 * `Element.closest` API.
 */

import { describe, expect, it } from 'vitest'
import * as fc from 'fast-check'
import { renderToStaticMarkup } from 'react-dom/server'
import { JSDOM, VirtualConsole } from 'jsdom'
import type { ReactElement } from 'react'

import { DashboardBackboneHero } from '@/components/dashboard/dashboard-backbone-hero'
import { ReviewBackboneHero } from '@/components/review/review-backbone-hero'
import { ExamInProgressChrome } from '@/components/exam/ExamInProgressChrome'
import { VocabularyPracticeHero } from '@/components/vocabulary/vocabulary-practice-hero'
import { VocabularyMicrogamesHero } from '@/components/vocabulary/vocabulary-microgames-hero'
import { SkillMotivationLayer } from '@/components/gamification/skill-motivation-layer'
import {
    StateShell,
    type StateShellProps,
} from '@/components/gamification/state-shell'
import {
    REWARD_ASSETS,
    type RewardAssetKey,
} from '@/components/gamification/reward-assets'

const NUM_RUNS = 100 as const

// =============================================================================
// SECTION 1 — Reward-amber matcher
// =============================================================================

/**
 * Bright Sky reward-amber base color (Req 16 — `--fuxie-reward`).
 *
 * The Property 9 contract is: any node carrying a color in the
 * `rgb(255, 183, 3) ± 5%` band MUST be inside a reward-context
 * subtree. The ±5% is per channel as documented in design §F.
 */
const REWARD_AMBER_RGB = { r: 255, g: 183, b: 3 } as const

/**
 * The 5% tolerance is computed against the channel range (0..255), so
 * `255 * 0.05 = 12.75 ≈ 13`. We use `13` so the band is inclusive of
 * the values designers picked when they "rounded up" inside the
 * tolerance (e.g. `#FFB703` → `#FFC107` Material amber, which is
 * within the band).
 */
const CHANNEL_TOLERANCE = 13

function withinTolerance(channel: number, target: number): boolean {
    return Math.abs(channel - target) <= CHANNEL_TOLERANCE
}

/**
 * Test if a 6-digit hex literal (`#RRGGBB` or `#RGB`) falls inside the
 * reward-amber band. Returns `false` for malformed input so the matcher
 * stays safe on noisy class strings.
 */
function isAmberHex(hex: string): boolean {
    const cleaned = hex.replace(/^#/, '')
    let r: number
    let g: number
    let b: number
    if (cleaned.length === 6) {
        r = Number.parseInt(cleaned.slice(0, 2), 16)
        g = Number.parseInt(cleaned.slice(2, 4), 16)
        b = Number.parseInt(cleaned.slice(4, 6), 16)
    } else if (cleaned.length === 3) {
        r = Number.parseInt(cleaned[0]! + cleaned[0]!, 16)
        g = Number.parseInt(cleaned[1]! + cleaned[1]!, 16)
        b = Number.parseInt(cleaned[2]! + cleaned[2]!, 16)
    } else {
        return false
    }
    if (!Number.isFinite(r) || !Number.isFinite(g) || !Number.isFinite(b)) {
        return false
    }
    return (
        withinTolerance(r, REWARD_AMBER_RGB.r) &&
        withinTolerance(g, REWARD_AMBER_RGB.g) &&
        withinTolerance(b, REWARD_AMBER_RGB.b)
    )
}

/**
 * Test if an `rgb(...)` / `rgba(...)` literal falls inside the
 * reward-amber band.
 */
function isAmberRgbLiteral(literal: string): boolean {
    const m = literal.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i)
    if (!m) return false
    const r = Number.parseInt(m[1]!, 10)
    const g = Number.parseInt(m[2]!, 10)
    const b = Number.parseInt(m[3]!, 10)
    return (
        withinTolerance(r, REWARD_AMBER_RGB.r) &&
        withinTolerance(g, REWARD_AMBER_RGB.g) &&
        withinTolerance(b, REWARD_AMBER_RGB.b)
    )
}

/**
 * Tailwind / class tokens that resolve to `var(--fuxie-reward)` or to
 * an amber hex value that lands inside the ±5% band. These are emitted
 * verbatim by production components (e.g.
 * `apps/web/src/components/gamification/shop-backbone-client.tsx`,
 * `apps/web/src/components/vocabulary/vocabulary-microgames-hero.tsx`,
 * `apps/web/src/components/review/review-backbone-hero.tsx`).
 *
 * The list is intentionally narrow — only tokens whose value is the
 * reward-amber color count as a violation. Tokens like
 * `text-[#FFD166]` or `ring-[#FFD166]` are NOT in the band (they are
 * the secondary "soft amber" used for streak chrome, well outside the
 * 13-channel tolerance).
 */
const REWARD_AMBER_CLASS_PATTERNS: ReadonlyArray<RegExp> = [
    // CSS-variable references
    /var\(--fuxie-reward\b/i,
    // Tailwind utility families wired to the reward token
    /\btext-fuxie-reward\b/i,
    /\bbg-fuxie-reward\b/i,
    /\bring-fuxie-reward\b/i,
    /\bborder-fuxie-reward\b/i,
    /\bfill-fuxie-reward\b/i,
    /\bstroke-fuxie-reward\b/i,
    // Tailwind arbitrary-value wrappers around the token, e.g.
    // `bg-[var(--fuxie-reward)]/15`, `text-[var(--fuxie-reward,#FFB703)]`,
    // `ring-[var(--fuxie-reward)]/35` — covered by the var(...) regex above.
]

/**
 * Pull the inline-style `color`, `background-color`, `border-color`,
 * `outline-color`, `fill`, and `stroke` tokens from a `style="..."`
 * string and check each against the amber band.
 *
 * Inline `style` is the only place where a hex literal can land on a
 * node directly; Tailwind classes are scanned via the class-pattern
 * list above.
 */
const STYLE_COLOR_PROPS: ReadonlyArray<string> = [
    'color',
    'background-color',
    'background',
    'border-color',
    'border-top-color',
    'border-right-color',
    'border-bottom-color',
    'border-left-color',
    'outline-color',
    'fill',
    'stroke',
]

function nodeCarriesAmber(el: Element): boolean {
    // 1) Class-token scan.
    const cls = el.getAttribute('class') ?? ''
    if (cls.length > 0) {
        for (const re of REWARD_AMBER_CLASS_PATTERNS) {
            if (re.test(cls)) return true
        }
        // Tailwind arbitrary-value patterns with bare hex/rgb in the
        // class name, e.g. `bg-[#FFB703]`, `text-[rgb(255,183,3)]`,
        // `ring-[#FFB703]/40`. The bracket payload may contain a
        // comma (in rgb(...)) so we capture greedily then validate.
        const bracketed = cls.matchAll(/\[([^\]]+)\]/g)
        for (const match of bracketed) {
            const payload = match[1] ?? ''
            // Hex: `#FFB703`, `#FFB703FF` etc.
            const hexMatches = payload.match(/#([0-9a-fA-F]{6,8}|[0-9a-fA-F]{3})/g)
            if (hexMatches) {
                for (const hex of hexMatches) {
                    if (isAmberHex(hex.slice(0, 7))) return true
                }
            }
            // rgb(...)/rgba(...) literal.
            if (/rgba?\(/i.test(payload) && isAmberRgbLiteral(payload)) {
                return true
            }
        }
    }

    // 2) Inline-style scan.
    const style = el.getAttribute('style') ?? ''
    if (style.length === 0) return false

    // Parse `prop: value;` pairs defensively. We do not use JSDOM's
    // `el.style[prop]` because it normalizes some shorthand expansions
    // and can drop the original literal we want to inspect.
    const declarations = style
        .split(';')
        .map((s) => s.trim())
        .filter((s) => s.length > 0)

    for (const decl of declarations) {
        const colonIdx = decl.indexOf(':')
        if (colonIdx <= 0) continue
        const prop = decl.slice(0, colonIdx).trim().toLowerCase()
        const value = decl.slice(colonIdx + 1).trim()
        if (!STYLE_COLOR_PROPS.includes(prop)) continue
        // CSS-variable reference.
        if (/var\(\s*--fuxie-reward\b/i.test(value)) return true
        // Hex literal(s).
        const hexMatches = value.match(/#([0-9a-fA-F]{6,8}|[0-9a-fA-F]{3})/g)
        if (hexMatches) {
            for (const hex of hexMatches) {
                if (isAmberHex(hex.slice(0, 7))) return true
            }
        }
        // rgb()/rgba() literal.
        if (isAmberRgbLiteral(value)) return true
    }

    return false
}

// =============================================================================
// SECTION 2 — Reward-context allow-list & ancestor walk
// =============================================================================

/**
 * Reward-state values that legitimize an amber descendant (design §E,
 * Req 16.1). `locked` and `pending` are intentionally excluded.
 */
const ALLOWED_REWARD_STATES: ReadonlySet<string> = new Set([
    'preview',
    'earned',
    'receipt',
])

/**
 * Walk from `el` to `document.body`, returning the closest ancestor
 * (inclusive of `el` itself) whose attributes legitimize a reward-amber
 * descendant. Returns `null` when no such ancestor exists.
 */
function findRewardContextAncestor(el: Element): Element | null {
    let current: Element | null = el
    while (current && current.nodeType === 1 /* ELEMENT_NODE */) {
        if (current.getAttribute('data-reward-context') === 'true') {
            return current
        }
        const rewardState = current.getAttribute('data-reward-state')
        if (rewardState && ALLOWED_REWARD_STATES.has(rewardState)) {
            return current
        }
        current = current.parentElement
    }
    return null
}

/**
 * Locate every node whose color tokens fall inside the amber band, then
 * return the subset that does NOT have a legitimizing ancestor. This is
 * the failure set for Property 9.
 */
function collectAmberContainmentViolations(root: Element): Element[] {
    const violations: Element[] = []
    // `getElementsByTagName('*')` is faster than a recursive walk and
    // returns elements in document order, which keeps failure messages
    // deterministic.
    const all = root.getElementsByTagName('*')
    for (let i = 0; i < all.length; i++) {
        const el = all.item(i)
        if (!el) continue
        if (!nodeCarriesAmber(el)) continue
        const ancestor = findRewardContextAncestor(el)
        if (!ancestor) {
            violations.push(el)
        }
    }
    return violations
}

// =============================================================================
// SECTION 3 — Bright Sky CTA matcher (Property 22)
// =============================================================================

/**
 * Class-token signals that mark a Primary_CTA fill/border as Bright Sky
 * compliant. The list mirrors `apps/web/src/components/ui/primary-cta.tsx`
 * (the only sanctioned Primary_CTA primitive per Req 16.4 / Req 19.3) and
 * `docs/design/design-tokens.md` table.
 */
const BRIGHT_SKY_CTA_PATTERNS: ReadonlyArray<RegExp> = [
    /\bbg-\[var\(--fuxie-action\)\]/,
    /\bbg-\[var\(--fuxie-action-hover\)\]/,
    /\bbg-\[var\(--fuxie-blue-(?:500|600|700|400)\)\]/,
    /\bbg-fuxie-action\b/,
    /\bbg-fuxie-blue-(?:400|500|600|700)\b/,
    /\bbg-sky-(?:400|500|600|700)\b/,
    /\bborder-\[var\(--fuxie-action\)\]/,
    /\bborder-fuxie-action\b/,
    /\bborder-fuxie-blue-(?:400|500|600|700)\b/,
]

/**
 * Class-token signals that are forbidden on a Primary_CTA element
 * directly (Req 16.3 — energy-orange must never fill a Primary_CTA).
 * The "≤ 5% surface area" budget is not measurable in JSDOM, so this
 * matcher checks the strictly stronger boolean: energy-orange tokens
 * never land on the CTA itself.
 */
const ENERGY_ORANGE_PATTERNS: ReadonlyArray<RegExp> = [
    /var\(--fuxie-energy\b/i,
    /\btext-fuxie-energy\b/i,
    /\bbg-fuxie-energy\b/i,
    /\bring-fuxie-energy\b/i,
    /\bborder-fuxie-energy\b/i,
    // Tailwind raw orange palette is also off-limits as a CTA fill.
    /\bbg-orange-\d{2,3}\b/i,
    /\bborder-orange-\d{2,3}\b/i,
    // Arbitrary-value wrappers around the energy token.
    /bg-\[var\(--fuxie-energy/i,
    /border-\[var\(--fuxie-energy/i,
    // Hex literal wrappers (`bg-[#FF8A3D]`).
    /bg-\[#FF8A3D/i,
    /border-\[#FF8A3D/i,
]

interface CtaPaletteFinding {
    cta: Element
    /** Brief reason for the failure (so fast-check shrinking is readable). */
    reason: string
}

function checkPrimaryCtaPalette(root: Element): CtaPaletteFinding[] {
    const findings: CtaPaletteFinding[] = []
    const ctas = root.querySelectorAll('[data-role="primary-cta"]')
    for (const cta of Array.from(ctas)) {
        const cls = cta.getAttribute('class') ?? ''

        // 1) Must carry at least one Bright Sky token on bg/border.
        const hasBrightSky = BRIGHT_SKY_CTA_PATTERNS.some((re) => re.test(cls))
        if (!hasBrightSky) {
            findings.push({
                cta,
                reason: `Primary_CTA missing Bright Sky bg/border token. classes="${cls}"`,
            })
        }

        // 2) Must NOT carry energy-orange tokens.
        for (const re of ENERGY_ORANGE_PATTERNS) {
            if (re.test(cls)) {
                findings.push({
                    cta,
                    reason: `Primary_CTA carries forbidden energy-orange token (matched ${re}). classes="${cls}"`,
                })
                break
            }
        }

        // 3) Must NOT carry reward-amber tokens (Req 16.4: CTA fill
        //    is Bright Sky, never reward amber).
        const inlineStyle = cta.getAttribute('style') ?? ''
        const ctaCarriesAmber =
            REWARD_AMBER_CLASS_PATTERNS.some((re) => re.test(cls)) ||
            /var\(\s*--fuxie-reward\b/i.test(inlineStyle)
        if (ctaCarriesAmber) {
            findings.push({
                cta,
                reason: `Primary_CTA carries forbidden reward-amber token. classes="${cls}" style="${inlineStyle}"`,
            })
        }
    }
    return findings
}

// =============================================================================
// SECTION 4 — JSDOM glue
// =============================================================================

/**
 * Render a React element to static markup, parse it inside a fresh
 * JSDOM document, and return the document body. Each call returns a
 * fresh DOM — there is no cross-test state.
 */
function renderToBody(element: ReactElement): { dom: JSDOM; body: HTMLElement } {
    const html = renderToStaticMarkup(element)
    const virtualConsole = new VirtualConsole()
    // Suppress the JSDOM canvas / not-implemented warnings — they are
    // unrelated to the static-markup analysis we do here.
    virtualConsole.on('jsdomError', () => undefined)
    const dom = new JSDOM(
        `<!doctype html><html><head><title>p9</title></head><body><div id="root">${html}</div></body></html>`,
        { virtualConsole },
    )
    const body = dom.window.document.body
    return { dom, body }
}

/** Pretty-print an element snippet for failure messages. */
function describeElement(el: Element): string {
    const tag = el.tagName.toLowerCase()
    const id = el.id ? ` id="${el.id}"` : ''
    const cls = el.getAttribute('class')
    const clsStr = cls ? ` class="${cls.slice(0, 80)}${cls.length > 80 ? '…' : ''}"` : ''
    const role = el.getAttribute('data-role')
    const roleStr = role ? ` data-role="${role}"` : ''
    return `<${tag}${id}${roleStr}${clsStr}>`
}

function formatViolations(
    label: string,
    violations: ReadonlyArray<Element>,
): string {
    if (violations.length === 0) return `[${label}] no violations`
    const lines = violations
        .slice(0, 6)
        .map(
            (v) =>
                `  - ${describeElement(v)} (no ancestor with data-reward-context="true" or data-reward-state ∈ {preview, earned, receipt})`,
        )
    if (violations.length > 6) {
        lines.push(`  …and ${violations.length - 6} more`)
    }
    return `[${label}] ${violations.length} amber-containment violation(s):\n${lines.join('\n')}`
}

function formatCtaFindings(
    label: string,
    findings: ReadonlyArray<CtaPaletteFinding>,
): string {
    if (findings.length === 0) return `[${label}] no Primary_CTA palette violations`
    const lines = findings
        .slice(0, 6)
        .map((f) => `  - ${describeElement(f.cta)} → ${f.reason}`)
    if (findings.length > 6) {
        lines.push(`  …and ${findings.length - 6} more`)
    }
    return `[${label}] ${findings.length} Primary_CTA palette violation(s):\n${lines.join(
        '\n',
    )}`
}

// =============================================================================
// SECTION 5 — Surface fixtures
// =============================================================================

/**
 * Each fixture renders a representative subtree of a P0 surface in a
 * given state. The set mirrors `tests/integration/a11y.spec.tsx` so the
 * two suites stay aligned: a11y enforces axe + focus contracts, this
 * spec enforces reward-amber containment and Bright Sky CTA discipline.
 *
 * `state` is the `Reward_Surface_State` we want to assert: the default
 * state for surfaces that allow reward amber inside an opt-in subtree,
 * `locked|empty|error` for shells that must be amber-free (Req 11.7,
 * Req 16.5), and `in-progress` for the exam chrome (Req 10.1, Req 10.4).
 */
type SurfaceCaseState =
    | 'default'
    | 'empty'
    | 'error'
    | 'locked'
    | 'in-progress'

interface SurfaceCase {
    label: string
    surfaceId: string
    state: SurfaceCaseState
    /**
     * Parameters drawn by the fast-check generator are forwarded to the
     * fixture so the property explores variability — different reward
     * keys, different counter values, different streak counts. The
     * fixture is responsible for clamping into the surface's prop
     * contract.
     */
    render: (params: SurfaceParams) => ReactElement
    /**
     * `true` when the case must contain at least one Primary_CTA so the
     * Property 22 check has something to assert. `false` for tightly-
     * scoped subtrees that delegate the CTA to the host page (e.g. the
     * Skill_Motivation_Layer banner).
     */
    expectsPrimaryCta: boolean
    /**
     * `true` when the surface state forbids ANY reward-amber subtree
     * (Req 11.7 / Req 16.5 / Req 10.4). The Property 9 check still
     * runs — but we additionally assert the markup contains zero
     * `data-reward-state="preview|earned|receipt"` attributes, which
     * makes the failure message clearer for shell-coverage drift.
     */
    forbidsRewardSubtree: boolean
}

interface SurfaceParams {
    /** Reward key driving any preview chip (drawn from REWARD_ASSETS). */
    rewardKey: RewardAssetKey
    /** Skill-player progress numerator (0..9999). */
    done: number
    /** Skill-player progress denominator (0..9999). */
    total: number
    /** Streak count for the Dashboard chip (0..365). */
    streakCount: number
    /** Review counter values (0..9999). */
    dueToday: number
    overdue: number
}

const REWARD_ASSET_KEYS = Object.keys(REWARD_ASSETS) as RewardAssetKey[]

const STATE_SHELL_EMPTY: Pick<
    StateShellProps,
    'state' | 'message' | 'primaryCta'
> = {
    state: 'empty',
    message:
        'Bạn chưa có hoạt động hôm nay. Bắt đầu một bài học để mở khóa nhé.',
    primaryCta: { label: 'Bắt đầu học', href: '/course' },
}
const STATE_SHELL_ERROR: Pick<
    StateShellProps,
    'state' | 'message' | 'primaryCta'
> = {
    state: 'error',
    message: 'Không tải được dữ liệu. Vui lòng thử lại.',
    primaryCta: { label: 'Thử lại', onClick: () => undefined },
}
const STATE_SHELL_LOCKED: Pick<
    StateShellProps,
    'state' | 'message' | 'primaryCta'
> = {
    state: 'locked',
    message: 'Hoàn thành A1 module 2 lesson 3 để mở khoá phần này.',
    primaryCta: { label: 'Mở khoá', href: '/course' },
}

const SURFACE_CASES: ReadonlyArray<SurfaceCase> = [
    // ----- Dashboard (Req 3 + Req 16.1 streak amber exception) ---------------
    {
        label: 'dashboard / default',
        surfaceId: 'dashboard',
        state: 'default',
        forbidsRewardSubtree: false,
        expectsPrimaryCta: true,
        render: ({ streakCount }) => (
            <DashboardBackboneHero
                state="default"
                greeting="Chào An, hôm nay học A1.2.3"
                streakChipLabel={`${streakCount} ngày streak`}
                streakCount={streakCount}
                xpLabel="30/50 XP hôm nay"
                questEyebrow="Quest hôm nay"
                questTitle="Hoàn thành Reading 1"
                questMessage="Còn 2 hoạt động — bạn đang trên đà."
                ctaLabel="Tiếp tục học"
                ctaHref="/course"
            />
        ),
    },
    {
        label: 'dashboard / empty',
        surfaceId: 'dashboard',
        state: 'empty',
        // Req 3.6 — empty hides streak/XP/quest. Req 11.7 — empty
        // shells must be amber-free, regardless of the underlying
        // hero variant.
        forbidsRewardSubtree: true,
        expectsPrimaryCta: true,
        render: () => (
            <DashboardBackboneHero
                state="empty"
                greeting="Chào An"
                streakChipLabel=""
                streakCount={0}
                xpLabel=""
                questEyebrow=""
                questTitle=""
                questMessage=""
                ctaLabel="Tạo lộ trình"
                ctaHref="/onboarding"
            />
        ),
    },
    {
        label: 'dashboard / error',
        surfaceId: 'dashboard',
        state: 'error',
        forbidsRewardSubtree: true,
        expectsPrimaryCta: true,
        render: () => (
            <StateShell surfaceId="dashboard" {...STATE_SHELL_ERROR} />
        ),
    },

    // ----- Course shells (Req 4 + Req 11.7) ----------------------------------
    {
        label: 'course / locked',
        surfaceId: 'course',
        state: 'locked',
        forbidsRewardSubtree: true,
        expectsPrimaryCta: true,
        render: () => <StateShell surfaceId="course" {...STATE_SHELL_LOCKED} />,
    },
    {
        label: 'course / empty',
        surfaceId: 'course',
        state: 'empty',
        forbidsRewardSubtree: true,
        expectsPrimaryCta: true,
        render: () => <StateShell surfaceId="course" {...STATE_SHELL_EMPTY} />,
    },
    {
        label: 'course / error',
        surfaceId: 'course',
        state: 'error',
        forbidsRewardSubtree: true,
        expectsPrimaryCta: true,
        render: () => <StateShell surfaceId="course" {...STATE_SHELL_ERROR} />,
    },

    // ----- Vocabulary (Req 5) -----------------------------------------------
    {
        label: 'vocabulary-practice / default',
        surfaceId: 'vocabulary-practice',
        state: 'default',
        forbidsRewardSubtree: false,
        expectsPrimaryCta: true,
        render: () => (
            <VocabularyPracticeHero
                eyebrow="Luyện từ vựng • A1"
                title="Sẵn sàng luyện 12 thẻ"
                message="Bạn còn 12 thẻ hôm nay. Bắt đầu để giữ streak."
                ctaLabel="Bắt đầu"
                ctaHref="/vocabulary/practice/session"
            />
        ),
    },
    {
        label: 'vocabulary-microgames / default',
        surfaceId: 'vocabulary-microgames',
        state: 'default',
        forbidsRewardSubtree: false,
        expectsPrimaryCta: true,
        render: () => (
            <VocabularyMicrogamesHero
                eyebrow="Trò chơi từ vựng • A1"
                title="Săn Fucoin với 5 trò chơi"
                message="Mỗi trò chơi tặng phần thưởng nhỏ. Hoàn tất 5 trò để lên cấp."
                ctaLabel="Bắt đầu"
                ctaHref="/vocabulary/microgames/session"
            />
        ),
    },
    {
        label: 'vocabulary / empty',
        surfaceId: 'vocabulary',
        state: 'empty',
        forbidsRewardSubtree: true,
        expectsPrimaryCta: true,
        render: () => (
            <StateShell
                surfaceId="vocabulary"
                state="empty"
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
        forbidsRewardSubtree: true,
        expectsPrimaryCta: true,
        render: () => (
            <StateShell surfaceId="vocabulary" {...STATE_SHELL_ERROR} />
        ),
    },

    // ----- Skill players (Req 6.9) ------------------------------------------
    {
        label: 'reading / default (skill-motivation-layer)',
        surfaceId: 'reading',
        state: 'default',
        forbidsRewardSubtree: false,
        expectsPrimaryCta: false, // banner only — host page owns the CTA
        render: ({ done, total, rewardKey }) => (
            <SkillMotivationLayer
                surfaceId="reading"
                done={done}
                total={total}
                rewardKey={rewardKey}
                rewardLabel="+10 Fucoin"
                worldPropTags={['library']}
            />
        ),
    },
    {
        label: 'listening / default (skill-motivation-layer)',
        surfaceId: 'listening',
        state: 'default',
        forbidsRewardSubtree: false,
        expectsPrimaryCta: false,
        render: ({ done, total, rewardKey }) => (
            <SkillMotivationLayer
                surfaceId="listening"
                done={done}
                total={total}
                rewardKey={rewardKey}
                rewardLabel="+10 Fucoin"
                worldPropTags={['studio', 'radio']}
            />
        ),
    },
    {
        label: 'speaking / default (skill-motivation-layer)',
        surfaceId: 'speaking',
        state: 'default',
        forbidsRewardSubtree: false,
        expectsPrimaryCta: false,
        render: ({ done, total, rewardKey }) => (
            <SkillMotivationLayer
                surfaceId="speaking"
                done={done}
                total={total}
                rewardKey={rewardKey}
                rewardLabel="+10 Fucoin"
                worldPropTags={['cafe', 'plaza']}
            />
        ),
    },
    {
        label: 'writing / default (skill-motivation-layer)',
        surfaceId: 'writing',
        state: 'default',
        forbidsRewardSubtree: false,
        expectsPrimaryCta: false,
        render: ({ done, total, rewardKey }) => (
            <SkillMotivationLayer
                surfaceId="writing"
                done={done}
                total={total}
                rewardKey={rewardKey}
                rewardLabel="+10 Fucoin"
                worldPropTags={['desk', 'workshop']}
            />
        ),
    },
    {
        label: 'reading / error',
        surfaceId: 'reading',
        state: 'error',
        forbidsRewardSubtree: true,
        expectsPrimaryCta: true,
        render: () => (
            <StateShell surfaceId="reading" {...STATE_SHELL_ERROR} />
        ),
    },

    // ----- Review (Req 9 + reward preview "chưa nhận" allowed) --------------
    {
        label: 'review / default',
        surfaceId: 'review',
        state: 'default',
        forbidsRewardSubtree: false,
        expectsPrimaryCta: true,
        render: ({ dueToday, overdue }) => (
            <ReviewBackboneHero
                state="default"
                dueToday={dueToday}
                overdue={overdue}
                dueLabel="Hôm nay đến hạn"
                overdueLabel="Quá hạn"
                ctaLabel="Ôn ngay"
                ctaHref="#review-session"
                title="Sẵn sàng ôn"
                message="Ôn ngay để giữ streak."
            />
        ),
    },
    {
        label: 'review / empty',
        surfaceId: 'review',
        state: 'empty',
        forbidsRewardSubtree: true,
        expectsPrimaryCta: true,
        render: () => (
            <ReviewBackboneHero
                state="empty"
                dueToday={0}
                overdue={0}
                dueLabel="Hôm nay đến hạn"
                overdueLabel="Quá hạn"
                ctaLabel="Học bài mới"
                ctaHref="/course"
                title="Bạn đã ôn xong hôm nay"
                message="Quay lại sau 24 giờ để giữ trí nhớ tươi mới."
            />
        ),
    },
    {
        label: 'review / error',
        surfaceId: 'review',
        state: 'error',
        forbidsRewardSubtree: true,
        expectsPrimaryCta: true,
        render: () => <StateShell surfaceId="review" {...STATE_SHELL_ERROR} />,
    },

    // ----- Shop / Inventory error shell (Req 8.10 + Req 11.7) ---------------
    {
        label: 'rewards-shop / error',
        surfaceId: 'rewards-shop',
        state: 'error',
        forbidsRewardSubtree: true,
        expectsPrimaryCta: true,
        render: () => (
            <StateShell surfaceId="rewards-shop" {...STATE_SHELL_ERROR} />
        ),
    },

    // ----- Exam (Req 10.1 + 10.4 — formal credibility, zero amber) ----------
    {
        label: 'exam / in-progress',
        surfaceId: 'exam',
        state: 'in-progress',
        // Req 10.1 — exam chrome must be amber-free with no reward
        // animation, no streak, no XP/coin badge.
        forbidsRewardSubtree: true,
        expectsPrimaryCta: true,
        render: ({ done, total }) => {
            // Clamp into ExamInProgressChrome's own contract so the
            // counter renders deterministically.
            const safeTotal = Math.max(1, Math.min(99, total))
            const safeDone = Math.max(0, Math.min(safeTotal, done))
            return (
                <ExamInProgressChrome
                    remainingSeconds={23 * 60 + 45}
                    done={safeDone}
                    total={safeTotal}
                    onSubmit={() => undefined}
                >
                    <p data-role="exam-content-stub">Q1</p>
                </ExamInProgressChrome>
            )
        },
    },
    {
        label: 'exam / error',
        surfaceId: 'exam',
        state: 'error',
        forbidsRewardSubtree: true,
        expectsPrimaryCta: true,
        render: () => <StateShell surfaceId="exam" {...STATE_SHELL_ERROR} />,
    },
]

// =============================================================================
// SECTION 6 — Generators
// =============================================================================

const rewardKeyArb: fc.Arbitrary<RewardAssetKey> = fc.constantFrom(
    ...REWARD_ASSET_KEYS,
)

const counterArb = fc.integer({ min: 0, max: 9999 })

const surfaceParamsArb: fc.Arbitrary<SurfaceParams> = fc
    .tuple(
        rewardKeyArb,
        counterArb, // done
        counterArb, // total
        fc.integer({ min: 0, max: 365 }), // streakCount
        fc.integer({ min: 0, max: 9999 }), // dueToday
        fc.integer({ min: 0, max: 9999 }), // overdue
    )
    .map(([rewardKey, done, total, streakCount, dueToday, overdue]) => ({
        rewardKey,
        done,
        total,
        streakCount,
        dueToday,
        overdue,
    }))

// =============================================================================
// SECTION 7 — Sanity tests for the matchers themselves
// =============================================================================

describe('reward-amber matcher (sanity)', () => {
    it('classifies #FFB703 and rgb(255,183,3) as inside the band', () => {
        expect(isAmberHex('#FFB703')).toBe(true)
        expect(isAmberHex('#ffb703')).toBe(true)
        expect(isAmberRgbLiteral('rgb(255, 183, 3)')).toBe(true)
        expect(isAmberRgbLiteral('rgba(255,183,3,0.5)')).toBe(true)
    })

    it('respects the ±5%/13-channel tolerance band', () => {
        // Inside band: each channel within ±13.
        expect(isAmberHex('#FFC107')).toBe(true) // Material amber
        expect(isAmberHex('#F2B600')).toBe(true)
        // Outside band: green channel too far from 183.
        expect(isAmberHex('#FFD166')).toBe(false) // streak chrome amber
        expect(isAmberHex('#FF8A3D')).toBe(false) // energy orange
        expect(isAmberHex('#54A8E4')).toBe(false) // Bright Sky action
        expect(isAmberHex('#54a8e4')).toBe(false)
    })

    it('detects var(--fuxie-reward) on classes and inline styles', () => {
        const dom = new JSDOM(
            `<!doctype html><html><body>
                <span class="bg-[var(--fuxie-reward)]/15">x</span>
                <span style="color: var(--fuxie-reward)">y</span>
                <span class="text-fuxie-reward">z</span>
                <span class="bg-[#FFB703]">w</span>
                <span class="text-[#54A8E4]">blue</span>
            </body></html>`,
        )
        const spans = Array.from(dom.window.document.body.querySelectorAll('span'))
        expect(nodeCarriesAmber(spans[0]!)).toBe(true)
        expect(nodeCarriesAmber(spans[1]!)).toBe(true)
        expect(nodeCarriesAmber(spans[2]!)).toBe(true)
        expect(nodeCarriesAmber(spans[3]!)).toBe(true)
        expect(nodeCarriesAmber(spans[4]!)).toBe(false)
    })

    it('findRewardContextAncestor walks up to the legitimizing ancestor', () => {
        const dom = new JSDOM(
            `<!doctype html><html><body>
                <div data-reward-context="true">
                    <span id="amber-1" class="text-fuxie-reward">a</span>
                </div>
                <section data-reward-state="preview">
                    <span id="amber-2" class="text-fuxie-reward">b</span>
                </section>
                <section data-reward-state="locked">
                    <span id="amber-3" class="text-fuxie-reward">c</span>
                </section>
                <span id="amber-4" class="text-fuxie-reward">d</span>
            </body></html>`,
        )
        const doc = dom.window.document
        expect(
            findRewardContextAncestor(doc.getElementById('amber-1')!),
        ).not.toBeNull()
        expect(
            findRewardContextAncestor(doc.getElementById('amber-2')!),
        ).not.toBeNull()
        // `locked` is NOT a legitimizing reward state (Req 16.1).
        expect(
            findRewardContextAncestor(doc.getElementById('amber-3')!),
        ).toBeNull()
        // No reward subtree ⇒ violation.
        expect(
            findRewardContextAncestor(doc.getElementById('amber-4')!),
        ).toBeNull()
    })
})

// =============================================================================
// SECTION 8 — Property 9 — Reward Amber Containment
// =============================================================================

describe('Property 9: Reward Amber Containment (Req 6.9, 10.1, 10.4, 11.7, 16.1, 16.2, 16.5, 19.4)', () => {
    for (const surface of SURFACE_CASES) {
        it(`${surface.label} — every amber node has a legitimizing ancestor`, () => {
            fc.assert(
                fc.property(surfaceParamsArb, (params) => {
                    const { body } = renderToBody(surface.render(params))
                    const violations = collectAmberContainmentViolations(body)

                    expect(
                        violations,
                        formatViolations(surface.label, violations),
                    ).toEqual([])

                    if (surface.forbidsRewardSubtree) {
                        // Req 11.7 / 16.5 / 10.4 — the markup must not
                        // expose a reward-state subtree at all in these
                        // shells. Catching this separately gives a
                        // crisper error than the amber containment one.
                        const previewLikeNodes = body.querySelectorAll(
                            '[data-reward-state="preview"], [data-reward-state="earned"], [data-reward-state="receipt"], [data-reward-context="true"]',
                        )
                        expect(
                            previewLikeNodes.length,
                            `[${surface.label}] forbids reward-state/reward-context subtrees but found ${previewLikeNodes.length} on Req 11.7 / 16.5`,
                        ).toBe(0)
                    }
                }),
                { numRuns: NUM_RUNS },
            )
        })
    }
})

// =============================================================================
// SECTION 9 — Property 22 — Bright Sky CTA Discipline
// =============================================================================

describe('Property 22: Bright Sky CTA Discipline (Req 16.3, 16.4, 19.4)', () => {
    for (const surface of SURFACE_CASES) {
        if (!surface.expectsPrimaryCta) {
            // The Skill_Motivation_Layer banners delegate the CTA to
            // their host pages — covered by other surface fixtures.
            continue
        }

        it(`${surface.label} — every Primary_CTA carries Bright Sky bg/border and never carries energy/reward tokens`, () => {
            fc.assert(
                fc.property(surfaceParamsArb, (params) => {
                    const { body } = renderToBody(surface.render(params))

                    const ctas = body.querySelectorAll(
                        '[data-role="primary-cta"]',
                    )
                    // Sanity: the case declared it expects at least one
                    // Primary_CTA — fail fast if the fixture drifted.
                    expect(
                        ctas.length,
                        `[${surface.label}] expected at least one data-role="primary-cta"`,
                    ).toBeGreaterThan(0)

                    const findings = checkPrimaryCtaPalette(body)
                    expect(
                        findings,
                        formatCtaFindings(surface.label, findings),
                    ).toEqual([])
                }),
                { numRuns: NUM_RUNS },
            )
        })
    }
})

// =============================================================================
// SECTION 10 — Cross-cutting: zero-amber on the exam in-progress chrome
// =============================================================================

/**
 * Standalone assertion the spec singles out (Req 10.1, Req 10.4 — exam
 * `in-progress` palette is neutral + deep blue, never reward amber). The
 * surface case above already enforces this through the generic Property
 * 9 walk; this test makes the expectation visible at the failure-line
 * level so a single regression is named clearly.
 */
describe('Property 9 (corollary): exam `in-progress` chrome contains zero amber pixels (Req 10.1, 10.4)', () => {
    it('renders no node carrying reward-amber class or style tokens', () => {
        fc.assert(
            fc.property(
                fc.integer({ min: 0, max: 99 }),
                fc.integer({ min: 1, max: 99 }),
                (rawDone, rawTotal) => {
                    const total = rawTotal
                    const done = Math.min(rawDone, total)
                    const { body } = renderToBody(
                        <ExamInProgressChrome
                            remainingSeconds={23 * 60 + 45}
                            done={done}
                            total={total}
                            onSubmit={() => undefined}
                        >
                            <p data-role="exam-content-stub">Q1</p>
                        </ExamInProgressChrome>,
                    )

                    const all = body.getElementsByTagName('*')
                    let amberCount = 0
                    for (let i = 0; i < all.length; i++) {
                        const el = all.item(i)
                        if (!el) continue
                        if (nodeCarriesAmber(el)) amberCount++
                    }
                    expect(
                        amberCount,
                        `exam in-progress chrome must have zero amber nodes (Req 10.1 / 10.4), got ${amberCount}`,
                    ).toBe(0)
                },
            ),
            { numRuns: NUM_RUNS },
        )
    })
})
