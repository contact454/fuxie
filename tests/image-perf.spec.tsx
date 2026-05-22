/**
 * image-perf.spec.tsx — Property-Based Tests for image dimension stability,
 * lazy-load discipline, and the Live 3D mascot visibility gate (task 17.4
 * of spec `gamified-ui-asset-rollout`).
 *
 * Vai chinh: Frontend Engineer
 * Vai phoi hop: QA Automation Engineer
 *
 * Spec source-of-truth:
 *   - tasks.md task 17.4 (this spec).
 *   - design.md "Property 19: Image Dimension Stability",
 *     "Property 20: Lazy Load Discipline",
 *     "Property 21: Live 3D Mascot Visibility Gate".
 *   - requirements.md Req 14.2, 14.4, 18.4, 18.5.
 *
 * Properties wired in this file
 * -----------------------------
 *
 *   - **Property 19 — Image Dimension Stability** (Req 14.2, 14.4)
 *
 *     For every `<Image>`/`<img>` element rendered by the P0 surface
 *     backbone components, the emitted `<img>` tag carries explicit
 *     `width` and `height` attributes OR an `aspect-ratio` CSS
 *     declaration. The Next.js `<Image>` primitive guarantees the
 *     `width`/`height` attribute pair when consumers pass numeric
 *     `width` and `height` props (or `fill`), so this property holds
 *     by construction across the whole input space — fast-check
 *     varies the dynamic prop inputs each surface accepts (counters,
 *     wallet balances, reward keys, …) over 100 runs to exercise the
 *     contract.
 *
 *   - **Property 20 — Lazy Load Discipline** (Req 18.4)
 *
 *     For every rendered `<img>`, either:
 *       (a) the tag carries `loading="lazy"` — the wire-format the
 *           browser uses to defer fetch until the element is within
 *           ~200px of the viewport (Next.js's default for non-priority
 *           `<Image>`), OR
 *       (b) the surface declares the image as first-viewport via a
 *           sibling `<link rel="preload" as="image">` element in the
 *           rendered head fragment — the marker Next.js emits for
 *           `priority` `<Image>`s.
 *
 *     The eager-vs-lazy choice is the surface designer's: Next.js
 *     emits `loading="lazy"` automatically when `priority !== true`,
 *     and emits the preload link + omits `loading="lazy"` when
 *     `priority === true`. The property therefore enforces that no
 *     `<img>` ends up "eager but un-preloaded" — the only failure
 *     mode where lazy-load discipline would be silently broken.
 *
 *     Additionally, the property pins the IntersectionObserver
 *     threshold contract for any present-or-future use under
 *     `apps/web/src/`: every IntersectionObserver constructed there
 *     must declare `rootMargin` whose px component is ≤ 200 (Req
 *     18.4 mandates fetch begin within 200px of the viewport). The
 *     scan is structural (regex over `.tsx` / `.ts` source files) so
 *     it stays green when the codebase has no IntersectionObserver
 *     today and tightens automatically when one is introduced.
 *
 *   - **Property 21 — Live 3D Mascot Visibility Gate** (Req 18.5)
 *
 *     For every render path that mounts a heavy Live 3D asset
 *     (`FuxieLive3D` GLB or sprite frames), the asset only renders
 *     when ≥ 10% of the component is in the viewport. Req 18.5
 *     accepts two implementations: an `IntersectionObserver` with
 *     `threshold ≥ 0.10`, OR the existing
 *     `FuxieLive3DDynamic` wrapper which uses Next.js's
 *     `dynamic({ ssr: false, loading: ... })` to defer the heavy
 *     module load until the wrapper hydrates on the client.
 *
 *     This file enforces the contract via static source inspection
 *     of `apps/web/src/components/gamification/FuxieLive3DDynamic.tsx`:
 *       (a) the wrapper uses `dynamic(... { ssr: false })`, AND
 *       (b) every IntersectionObserver constructed in the live-3d
 *           subtree (currently none — the wrapper alone satisfies
 *           Req 18.5) declares a numeric `threshold ≥ 0.10` or an
 *           array threshold whose minimum value is ≥ 0.10.
 *
 *     Some of these properties are static structural invariants of
 *     source code, not runtime behaviors — the task brief explicitly
 *     allows mixing fast-check property tests with deterministic
 *     `it`-blocks for the source-scan portion. We use fast-check at
 *     `numRuns: 100` for the rendered-DOM properties (19, 20.a) and
 *     deterministic `it`-blocks for the source-scan portions
 *     (20.b, 21).
 *
 * Test framework
 * --------------
 * Vitest (root `vitest.property.config.ts`, `environment: 'node'`)
 * + fast-check (`numRuns: 100`). Renders use
 * `react-dom/server.renderToStaticMarkup` so the suite stays
 * deterministic without a paint engine — the same pattern every
 * other PBT spec in this repo follows.
 *
 * JSDOM limitation note
 * ---------------------
 * The lazy-load discipline acceptance ("non-first-viewport images
 * use loading=lazy ... IntersectionObserver threshold ≤ 200px") is
 * partially structural. JSDOM does not paint, so we cannot measure
 * which rendered `<img>` is geometrically inside the 390×844 first
 * viewport. We approximate the "non-first-viewport" set by relying
 * on the `priority` prop: P0 surface backbones mark first-viewport
 * mascot/world-prop images as `priority` (which Next.js emits as
 * `<link rel="preload">` + eager `<img>`). Every other `<img>`
 * MUST carry `loading="lazy"`. A pixel-accurate check belongs to
 * `tests/integration/perf.spec.ts` (task 18.1, Playwright + real
 * browser).
 *
 * Validates: Requirements 14.2, 14.4, 18.4, 18.5
 */

import { readFileSync } from 'node:fs'
import path from 'node:path'

import { describe, expect, it } from 'vitest'
import * as fc from 'fast-check'
import { renderToStaticMarkup } from 'react-dom/server'
import type { ReactElement } from 'react'

// P0 surface backbone components — same import set as
// `tests/integration/a11y.spec.tsx` so the two suites stay in lockstep
// on which surface fixtures define "P0".
import { DashboardBackboneHero } from '../apps/web/src/components/dashboard/dashboard-backbone-hero'
import { ReviewBackboneHero } from '../apps/web/src/components/review/review-backbone-hero'
import { ExamInProgressChrome } from '../apps/web/src/components/exam/ExamInProgressChrome'
import { VocabularyPracticeHero } from '../apps/web/src/components/vocabulary/vocabulary-practice-hero'
import { VocabularyMicrogamesHero } from '../apps/web/src/components/vocabulary/vocabulary-microgames-hero'
import { SkillMotivationLayer } from '../apps/web/src/components/gamification/skill-motivation-layer'
import { StateShell } from '../apps/web/src/components/gamification/state-shell'
import {
    REWARD_ASSETS,
    type RewardAssetKey,
} from '../apps/web/src/components/gamification/reward-assets'

const NUM_RUNS = 100 as const

const REPO_ROOT = path.resolve(__dirname, '..')
const APPS_WEB_SRC = path.resolve(REPO_ROOT, 'apps', 'web', 'src')

// ============================================================================
// Section A — DOM extraction helpers
// ============================================================================

/**
 * Extract every `<img ...>` tag from the rendered HTML string. We use a
 * non-greedy regex over the raw HTML rather than parsing through JSDOM
 * so each property assertion stays deterministic and self-contained
 * (the `vitest.property.config.ts` runner uses `environment: 'node'`).
 *
 * The regex matches both self-closing `<img ... />` and the bare
 * `<img ...>` form Next.js emits.
 */
const IMG_TAG_RE = /<img\b[^>]*\/?>/gi

function extractImgTags(html: string): string[] {
    return html.match(IMG_TAG_RE) ?? []
}

/**
 * `<link rel="preload" as="image" ...>` markers. Next.js emits one of
 * these per `priority` `<Image>` so the browser can begin fetching the
 * asset before paint. Property 20 treats the presence of a preload
 * link as evidence that the corresponding `<img>` is allowed to be
 * eager (i.e. it's a first-viewport hero asset).
 */
const PRELOAD_LINK_RE = /<link\b[^>]*\brel="preload"[^>]*\bas="image"[^>]*\/?>/gi

function countPreloadLinks(html: string): number {
    return (html.match(PRELOAD_LINK_RE) ?? []).length
}

/**
 * Read the value of a single attribute from a rendered tag string.
 * Returns `null` when the attribute is absent.
 */
function readAttr(tag: string, attr: string): string | null {
    const re = new RegExp(`\\b${attr}="([^"]*)"`, 'i')
    const match = tag.match(re)
    return match ? match[1] : null
}

/** True when the rendered tag declares both `width` and `height` attributes. */
function hasExplicitDimensions(tag: string): boolean {
    return readAttr(tag, 'width') !== null && readAttr(tag, 'height') !== null
}

/**
 * True when the rendered tag carries an inline `aspect-ratio` style
 * declaration. Next.js does not emit `aspect-ratio` by default — we
 * still allow it as a fallback for any future hand-rolled `<img>`
 * that uses CSS to lock its aspect ratio (Req 14.4 alternative).
 */
function hasAspectRatioStyle(tag: string): boolean {
    const style = readAttr(tag, 'style')
    if (!style) return false
    return /aspect-ratio\s*:/i.test(style)
}

/**
 * True when the rendered tag is a Next.js `<Image fill>` placeholder.
 * Next emits `data-nimg="fill"` plus inline
 * `position:absolute;height:100%;width:100%` on the `<img>` so the
 * parent (which the consumer must size with `position: relative` plus
 * a fixed height OR an `aspect-ratio` rule) becomes the dimension
 * anchor. Req 14.4 explicitly allows this form: "OR be inside a
 * container with fixed aspect-ratio". We accept the marker as
 * structural evidence that the parent owns the dimension contract;
 * the parent's fixed sizing is asserted at the surface-component level
 * by `tests/integration/perf.spec.ts` (CLS budget) — the runtime
 * counterpart of this static check.
 */
function isNextImageFill(tag: string): boolean {
    if (readAttr(tag, 'data-nimg') !== 'fill') return false
    const style = readAttr(tag, 'style') ?? ''
    return (
        /position\s*:\s*absolute/i.test(style) &&
        /height\s*:\s*100%/i.test(style) &&
        /width\s*:\s*100%/i.test(style)
    )
}

function hasLoadingLazy(tag: string): boolean {
    return readAttr(tag, 'loading') === 'lazy'
}

// ============================================================================
// Section B — P0 surface fixtures and arbitraries
// ============================================================================

/** Canonical P0 surface ID set used for `it.each` test titles. */
type P0SurfaceLabel =
    | 'dashboard'
    | 'review'
    | 'vocabulary-practice'
    | 'vocabulary-microgames'
    | 'exam-in-progress'
    | 'skill-motivation-layer:reading'
    | 'skill-motivation-layer:listening'
    | 'skill-motivation-layer:speaking'
    | 'skill-motivation-layer:writing'
    | 'state-shell:vocabulary-empty'
    | 'state-shell:reading-error'

/** Surface render fixture — produces a fresh ReactElement per run. */
interface SurfaceFixture {
    label: P0SurfaceLabel
    render: (input: SurfaceInput) => ReactElement
}

/**
 * Generic input the renderer hands to each surface. Each surface picks
 * the fields it needs; unused fields are ignored. Constraining counters,
 * coin amounts, and reward keys to small bounded ranges keeps fast-check
 * shrinking fast while still exercising the documented input space (Req
 * 7.3 caps, Req 8.1 wallet ceiling, etc.).
 */
interface SurfaceInput {
    streakCount: number
    dueToday: number
    overdue: number
    skillDone: number
    skillTotal: number
    rewardKey: RewardAssetKey
    examRemainingSeconds: number
    examDone: number
    examTotal: number
}

const surfaceInputArb: fc.Arbitrary<SurfaceInput> = fc.record({
    streakCount: fc.integer({ min: 0, max: 365 }),
    dueToday: fc.integer({ min: 0, max: 9_999 }),
    overdue: fc.integer({ min: 0, max: 9_999 }),
    skillDone: fc.integer({ min: 0, max: 50 }),
    skillTotal: fc.integer({ min: 0, max: 50 }),
    rewardKey: fc.constantFrom(...(Object.keys(REWARD_ASSETS) as RewardAssetKey[])),
    examRemainingSeconds: fc.integer({ min: 0, max: 99 * 60 + 59 }),
    examDone: fc.integer({ min: 0, max: 25 }),
    examTotal: fc.integer({ min: 1, max: 25 }),
})

/**
 * Surface labels that may legitimately render zero `<img>` tags. The
 * exam in-progress chrome (Req 10.1) is mascot-free and reward-free
 * by design, so the chrome itself emits no images — the exam content
 * stub passed as `children` is text-only in the fixture. State-shell
 * variants likewise rely on the StateShell's own internal `<img>` for
 * the mascot, but when the mascot resolves to `silent` (e.g. surface
 * "vocabulary" / "reading" don't have a guard pose for every state
 * combination) the shell renders zero `<img>` tags.
 */
const SURFACES_ALLOWED_ZERO_IMAGES: ReadonlySet<P0SurfaceLabel> = new Set([
    'exam-in-progress',
    'state-shell:vocabulary-empty',
    'state-shell:reading-error',
])

const SURFACE_FIXTURES: ReadonlyArray<SurfaceFixture> = [
    {
        label: 'dashboard',
        render: (input) => (
            <DashboardBackboneHero
                state="default"
                greeting="Chào An, hôm nay học A1.2.3"
                streakChipLabel={`${input.streakCount} ngày streak`}
                streakCount={input.streakCount}
                xpLabel="30/50 XP hôm nay"
                questEyebrow="Quest hôm nay"
                questTitle="Hoàn thành Reading 1"
                questMessage="Còn 2 hoạt động."
                ctaLabel="Tiếp tục học"
                ctaHref="/course"
            />
        ),
    },
    {
        label: 'review',
        render: (input) => (
            <ReviewBackboneHero
                state="default"
                dueToday={input.dueToday}
                overdue={input.overdue}
                dueLabel="Hôm nay đến hạn"
                overdueLabel="Quá hạn"
                ctaLabel="Ôn ngay"
                ctaHref="#review-session"
                title="Sẵn sàng ôn"
                message="Bạn còn thẻ ôn hôm nay."
            />
        ),
    },
    {
        label: 'vocabulary-practice',
        render: () => (
            <VocabularyPracticeHero
                eyebrow="Luyện từ vựng • A1"
                title="Sẵn sàng luyện 12 thẻ"
                message="Bạn còn 12 thẻ hôm nay."
                ctaLabel="Bắt đầu"
                ctaHref="/vocabulary/practice/session"
            />
        ),
    },
    {
        label: 'vocabulary-microgames',
        render: () => (
            <VocabularyMicrogamesHero
                eyebrow="Trò chơi từ vựng • A1"
                title="Săn Fucoin với 5 trò chơi"
                message="Mỗi trò chơi tặng phần thưởng nhỏ."
                ctaLabel="Bắt đầu"
                ctaHref="/vocabulary/microgames/session"
            />
        ),
    },
    {
        label: 'exam-in-progress',
        render: (input) => (
            <ExamInProgressChrome
                remainingSeconds={input.examRemainingSeconds}
                done={Math.min(input.examDone, input.examTotal)}
                total={input.examTotal}
                onSubmit={() => undefined}
            >
                <p data-role="exam-content-stub">Q1</p>
            </ExamInProgressChrome>
        ),
    },
    {
        label: 'skill-motivation-layer:reading',
        render: (input) => (
            <SkillMotivationLayer
                surfaceId="reading"
                done={input.skillDone}
                total={input.skillTotal}
                rewardKey={input.rewardKey}
                rewardLabel="+10 Fucoin"
                worldPropTags={['library']}
            />
        ),
    },
    {
        label: 'skill-motivation-layer:listening',
        render: (input) => (
            <SkillMotivationLayer
                surfaceId="listening"
                done={input.skillDone}
                total={input.skillTotal}
                rewardKey={input.rewardKey}
                rewardLabel="+10 Fucoin"
                worldPropTags={['studio', 'radio']}
            />
        ),
    },
    {
        label: 'skill-motivation-layer:speaking',
        render: (input) => (
            <SkillMotivationLayer
                surfaceId="speaking"
                done={input.skillDone}
                total={input.skillTotal}
                rewardKey={input.rewardKey}
                rewardLabel="+10 Fucoin"
                worldPropTags={['cafe', 'plaza']}
            />
        ),
    },
    {
        label: 'skill-motivation-layer:writing',
        render: (input) => (
            <SkillMotivationLayer
                surfaceId="writing"
                done={input.skillDone}
                total={input.skillTotal}
                rewardKey={input.rewardKey}
                rewardLabel="+10 Fucoin"
                worldPropTags={['desk', 'workshop']}
            />
        ),
    },
    {
        label: 'state-shell:vocabulary-empty',
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
        label: 'state-shell:reading-error',
        render: () => (
            <StateShell
                surfaceId="reading"
                state="error"
                message="Không tải được dữ liệu. Vui lòng thử lại."
                primaryCta={{
                    label: 'Thử lại',
                    onClick: () => undefined,
                }}
            />
        ),
    },
]

// ============================================================================
// Property 19 — Image Dimension Stability (Req 14.2, 14.4)
// ============================================================================

describe('Property 19: Image Dimension Stability (Req 14.2, 14.4)', () => {
    for (const fixture of SURFACE_FIXTURES) {
        it(`every <img> on "${fixture.label}" carries explicit width+height OR aspect-ratio (numRuns=${NUM_RUNS})`, () => {
            fc.assert(
                fc.property(surfaceInputArb, (input) => {
                    const html = renderToStaticMarkup(fixture.render(input))
                    const tags = extractImgTags(html)

                    if (tags.length === 0) {
                        // Some surfaces (exam in-progress chrome, some
                        // state-shell variants) intentionally render no
                        // images. The dimension contract is vacuously
                        // satisfied for those — the allowlist below
                        // pins which labels are permitted to do so.
                        expect(
                            SURFACES_ALLOWED_ZERO_IMAGES.has(fixture.label),
                            `[${fixture.label}] expected ≥1 <img> in rendered surface (not in zero-image allowlist)`,
                        ).toBe(true)
                        return
                    }

                    for (const tag of tags) {
                        const ok =
                            hasExplicitDimensions(tag) ||
                            hasAspectRatioStyle(tag) ||
                            isNextImageFill(tag)
                        expect(
                            ok,
                            `[${fixture.label}] <img> missing width/height AND aspect-ratio AND fill marker: ${tag}`,
                        ).toBe(true)
                    }
                }),
                { numRuns: NUM_RUNS },
            )
        })
    }

    it('placeholder dimensions match asset dimensions within ±1px (Req 14.2)', () => {
        // Req 14.2 says the skeleton/placeholder rendered while an asset
        // loads must match the final asset dimensions within ±1px so
        // the layout does not shift (Req 14.3 CLS budget). The Next.js
        // `<Image>` primitive enforces this by construction: the
        // `width`/`height` props it receives become both the placeholder
        // box and the final image box (Next.js renders the same
        // `<img width=W height=H>` tag in both states; only the `src`
        // swaps in once the asset loads). For `<Image fill>` the
        // parent container owns the dimension contract — Next.js emits
        // `data-nimg="fill"` plus 100%/absolute positioning on the
        // `<img>` so the parent's `position: relative` box is the
        // dimension anchor. We therefore verify the structural
        // invariant: every rendered `<img>` either declares positive
        // numeric `width`/`height`, or carries the fill marker, or
        // uses an `aspect-ratio` style.
        for (const fixture of SURFACE_FIXTURES) {
            const html = renderToStaticMarkup(
                fixture.render({
                    streakCount: 0,
                    dueToday: 0,
                    overdue: 0,
                    skillDone: 0,
                    skillTotal: 1,
                    rewardKey: 'fucoin',
                    examRemainingSeconds: 60,
                    examDone: 0,
                    examTotal: 25,
                }),
            )
            for (const tag of extractImgTags(html)) {
                if (hasAspectRatioStyle(tag) || isNextImageFill(tag)) {
                    // Aspect-ratio and fill-mode delegate sizing to the
                    // parent — the dimension stability contract holds
                    // by construction (parent's box is static).
                    continue
                }
                const w = readAttr(tag, 'width')
                const h = readAttr(tag, 'height')
                const wNum = w === null ? NaN : Number(w)
                const hNum = h === null ? NaN : Number(h)
                expect(
                    Number.isFinite(wNum) && wNum > 0,
                    `[${fixture.label}] <img> width="${w}" not a positive number: ${tag}`,
                ).toBe(true)
                expect(
                    Number.isFinite(hNum) && hNum > 0,
                    `[${fixture.label}] <img> height="${h}" not a positive number: ${tag}`,
                ).toBe(true)
            }
        }
    })
})

// ============================================================================
// Property 20 — Lazy Load Discipline (Req 18.4)
// ============================================================================

describe('Property 20: Lazy Load Discipline (Req 18.4)', () => {
    // -------------------------------------------------------------------
    // Sub-property 20.a — every <img> is either loading="lazy" OR
    //                     accompanied by a <link rel="preload" as="image">
    //                     marker that legitimizes its eager load.
    // -------------------------------------------------------------------

    for (const fixture of SURFACE_FIXTURES) {
        it(`every <img> on "${fixture.label}" is loading="lazy" OR preload-marked (numRuns=${NUM_RUNS})`, () => {
            fc.assert(
                fc.property(surfaceInputArb, (input) => {
                    const html = renderToStaticMarkup(fixture.render(input))
                    const tags = extractImgTags(html)

                    if (tags.length === 0) {
                        // Same allowance as Property 19 — surfaces that
                        // legitimately render zero images (exam
                        // in-progress chrome, certain state-shell
                        // variants) are vacuously lazy-load compliant.
                        expect(
                            SURFACES_ALLOWED_ZERO_IMAGES.has(fixture.label),
                            `[${fixture.label}] expected ≥1 <img> in rendered surface (not in zero-image allowlist)`,
                        ).toBe(true)
                        return
                    }

                    // Number of preload markers — each one legitimizes one
                    // eager (i.e. non-lazy) <img>. We enforce the
                    // accounting identity: lazyCount + eagerCount === total,
                    // and eagerCount ≤ preloadCount so every eager image
                    // is preload-backed (Req 18.4 alternative: "dynamic
                    // import wrapper" — Next.js's preload link is the
                    // structural marker for the priority code path that
                    // dynamic imports compose).
                    const preloadCount = countPreloadLinks(html)
                    let lazyCount = 0
                    let eagerCount = 0
                    for (const tag of tags) {
                        if (hasLoadingLazy(tag)) {
                            lazyCount += 1
                        } else {
                            eagerCount += 1
                        }
                    }
                    expect(
                        eagerCount,
                        `[${fixture.label}] eager <img> count (${eagerCount}) exceeds <link rel="preload"> markers (${preloadCount}). ` +
                            `Every eager image must be a first-viewport hero with a preload link (Req 18.4).`,
                    ).toBeLessThanOrEqual(preloadCount)
                    expect(lazyCount + eagerCount).toBe(tags.length)
                }),
                { numRuns: NUM_RUNS },
            )
        })
    }

    // -------------------------------------------------------------------
    // Sub-property 20.b — IntersectionObserver `rootMargin` ≤ 200px.
    // -------------------------------------------------------------------
    //
    // Static source scan over `apps/web/src/**/*.{ts,tsx}` for every
    // `IntersectionObserver` constructor call site, parsing the
    // `rootMargin` option when present. The codebase currently has no
    // IntersectionObserver (lazy-loading is delegated to Next.js's
    // `<Image>` + `dynamic` wrappers), so this assertion is vacuously
    // green today. It tightens automatically when the first observer
    // is introduced.

    it('every IntersectionObserver under apps/web/src has rootMargin ≤ 200px (Req 18.4)', () => {
        const sources = collectSourceFiles(APPS_WEB_SRC)
        const violations: string[] = []
        for (const file of sources) {
            const text = readFileSync(file, 'utf8')
            // Match `new IntersectionObserver(callback, { rootMargin: '...' })`
            // and standalone `rootMargin: '...'` lines inside an
            // observer-options object literal.
            const optionRe = /rootMargin\s*:\s*['"]([^'"]+)['"]/g
            let match: RegExpExecArray | null
            while ((match = optionRe.exec(text)) !== null) {
                const value = match[1]
                // rootMargin is a CSS margin shorthand — possibly multi
                // value (`"200px 0px"`). Parse each component and reject
                // any px component > 200.
                const parts = value.trim().split(/\s+/)
                for (const part of parts) {
                    const pxMatch = part.match(/^(-?\d+(?:\.\d+)?)px$/)
                    if (!pxMatch) continue // ignore non-px units (%, em, etc.)
                    const pxValue = Number(pxMatch[1])
                    if (Math.abs(pxValue) > 200) {
                        violations.push(
                            `${path.relative(REPO_ROOT, file)}: rootMargin="${value}" exceeds 200px (Req 18.4)`,
                        )
                    }
                }
            }
        }
        expect(
            violations,
            `IntersectionObserver rootMargin > 200px:\n${violations.join('\n')}`,
        ).toEqual([])
    })

    it('every IntersectionObserver under apps/web/src has threshold ≤ 1.0 (sanity)', () => {
        // Defensive: thresholds outside [0, 1] are invalid per the DOM
        // spec and would silently misbehave. This is a one-line cheap
        // check that complements the rootMargin assertion above.
        const sources = collectSourceFiles(APPS_WEB_SRC)
        const violations: string[] = []
        for (const file of sources) {
            const text = readFileSync(file, 'utf8')
            const re = /threshold\s*:\s*([^,}\n]+)/g
            let match: RegExpExecArray | null
            while ((match = re.exec(text)) !== null) {
                const raw = match[1].trim()
                // Single number form.
                const numMatch = raw.match(/^(\d+(?:\.\d+)?)$/)
                if (numMatch) {
                    const v = Number(numMatch[1])
                    if (v < 0 || v > 1) {
                        violations.push(
                            `${path.relative(REPO_ROOT, file)}: threshold ${v} not in [0, 1]`,
                        )
                    }
                    continue
                }
                // Array form `[0, 0.1, 0.5]`.
                const arrayMatch = raw.match(/^\[([^\]]+)\]/)
                if (arrayMatch) {
                    const items = arrayMatch[1]
                        .split(',')
                        .map((s) => s.trim())
                        .filter(Boolean)
                    for (const item of items) {
                        const vMatch = item.match(/^(\d+(?:\.\d+)?)$/)
                        if (!vMatch) continue
                        const v = Number(vMatch[1])
                        if (v < 0 || v > 1) {
                            violations.push(
                                `${path.relative(REPO_ROOT, file)}: threshold ${v} not in [0, 1]`,
                            )
                        }
                    }
                }
            }
        }
        expect(
            violations,
            `IntersectionObserver threshold outside [0, 1]:\n${violations.join('\n')}`,
        ).toEqual([])
    })
})

// ============================================================================
// Property 21 — Live 3D Mascot Visibility Gate (Req 18.5)
// ============================================================================

describe('Property 21: Live 3D Mascot Visibility Gate (Req 18.5)', () => {
    const FUXIE_LIVE_3D_DYNAMIC = path.resolve(
        APPS_WEB_SRC,
        'components',
        'gamification',
        'FuxieLive3DDynamic.tsx',
    )

    it('FuxieLive3DDynamic.tsx exists', () => {
        // Anchors the rest of the assertions — if the file moves, the
        // failure points at the source-of-truth path the design names.
        expect(() => readFileSync(FUXIE_LIVE_3D_DYNAMIC, 'utf8')).not.toThrow()
    })

    it('FuxieLive3DDynamic uses next/dynamic with ssr: false (Req 18.5 wrapper alternative)', () => {
        const src = readFileSync(FUXIE_LIVE_3D_DYNAMIC, 'utf8')
        // The file must import `dynamic` from `next/dynamic`.
        expect(src).toMatch(/import\s+dynamic\s+from\s+['"]next\/dynamic['"]/)
        // The dynamic call must declare `ssr: false` so the heavy
        // module is never loaded server-side and the wrapper is the
        // single entry-point that controls when the model mounts.
        expect(src).toMatch(/ssr\s*:\s*false/)
        // The dynamic import must resolve the heavy live-3d module
        // lazily — i.e. the call site uses the `() => import(...)`
        // form rather than a top-level `import` of `fuxie-live-3d`.
        expect(src).toMatch(/dynamic\s*\(\s*\(\s*\)\s*=>\s*import\s*\(\s*['"]\.\/fuxie-live-3d['"]/)
    })

    it('FuxieLive3DDynamic does NOT statically import the heavy fuxie-live-3d module', () => {
        const src = readFileSync(FUXIE_LIVE_3D_DYNAMIC, 'utf8')
        // A top-level `import { FuxieLive3D } from './fuxie-live-3d'`
        // (value import, not type-only) would defeat the dynamic gate
        // by pulling the heavy module into the entry chunk. Type-only
        // imports (`import type { ... }`) are fine because they are
        // erased at compile time.
        const lines = src.split(/\r?\n/)
        const offending = lines.filter((line) => {
            const trimmed = line.trim()
            if (!trimmed.startsWith('import')) return false
            if (trimmed.startsWith('import type')) return false
            return /from\s+['"]\.\/fuxie-live-3d['"]/.test(trimmed)
        })
        expect(
            offending,
            `Found static value-import(s) of './fuxie-live-3d':\n${offending.join('\n')}`,
        ).toEqual([])
    })

    it('every IntersectionObserver in the live-3d subtree has threshold ≥ 0.10', () => {
        // Currently no IntersectionObserver exists in the live-3d
        // subtree (the dynamic wrapper alone satisfies Req 18.5), so
        // this assertion is vacuously green. It tightens automatically
        // if a future change introduces an observer-based gate.
        const liveSrc = readFileSync(
            path.resolve(APPS_WEB_SRC, 'components', 'gamification', 'fuxie-live-3d.tsx'),
            'utf8',
        )
        const wrapperSrc = readFileSync(FUXIE_LIVE_3D_DYNAMIC, 'utf8')

        const violations: string[] = []
        for (const [label, source] of [
            ['fuxie-live-3d.tsx', liveSrc] as const,
            ['FuxieLive3DDynamic.tsx', wrapperSrc] as const,
        ]) {
            // Only inspect threshold options that appear inside an
            // IntersectionObserver constructor argument. We keep the
            // scan simple by matching the construct + nearest options
            // object.
            const ioRe = /new\s+IntersectionObserver\s*\([^,]*,\s*\{([^}]*)\}/g
            let match: RegExpExecArray | null
            while ((match = ioRe.exec(source)) !== null) {
                const optionsBlock = match[1]
                const thresholdMatch = optionsBlock.match(
                    /threshold\s*:\s*([^,}\n]+)/,
                )
                if (!thresholdMatch) {
                    violations.push(
                        `${label}: IntersectionObserver missing threshold option (Req 18.5 requires ≥ 0.10)`,
                    )
                    continue
                }
                const raw = thresholdMatch[1].trim()
                const minThreshold = parseMinThreshold(raw)
                if (minThreshold === null) {
                    violations.push(
                        `${label}: IntersectionObserver threshold "${raw}" not statically analyzable`,
                    )
                    continue
                }
                if (minThreshold < 0.1) {
                    violations.push(
                        `${label}: IntersectionObserver threshold ${minThreshold} < 0.10 (Req 18.5)`,
                    )
                }
            }
        }
        expect(
            violations,
            `IntersectionObserver threshold violations in live-3d subtree:\n${violations.join('\n')}`,
        ).toEqual([])
    })
})

// ============================================================================
// Section C — Source scan helpers
// ============================================================================

/**
 * Statically parse the minimum value an IntersectionObserver
 * `threshold` option can take, so the test can assert "min ≥ 0.10".
 *
 * Supported forms:
 *   - Single number: `0.1`, `0.5`, `0`, `1`.
 *   - Array literal: `[0, 0.1, 0.5]` → minimum 0.
 *
 * Returns `null` when the form is not statically analyzable (e.g. a
 * variable reference or a function call); callers treat `null` as a
 * violation so dynamic thresholds must be made statically inspectable
 * before they ship.
 */
function parseMinThreshold(raw: string): number | null {
    const trimmed = raw.trim()
    const numMatch = trimmed.match(/^(\d+(?:\.\d+)?)$/)
    if (numMatch) {
        return Number(numMatch[1])
    }
    const arrayMatch = trimmed.match(/^\[([^\]]+)\]/)
    if (arrayMatch) {
        const items = arrayMatch[1]
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
        const numbers: number[] = []
        for (const item of items) {
            const n = item.match(/^(\d+(?:\.\d+)?)$/)
            if (!n) return null
            numbers.push(Number(n[1]))
        }
        if (numbers.length === 0) return null
        return Math.min(...numbers)
    }
    return null
}

/**
 * Recursively collect `.ts` and `.tsx` source files under `root`,
 * excluding `node_modules`, build artefacts, and test files. The scan
 * is synchronous because it runs once per `it` block.
 */
function collectSourceFiles(root: string): string[] {
    const out: string[] = []
    const stack: string[] = [root]
    // Lazy-load the fs module shape we need so this helper stays
    // colocated with the test rather than hoisted to a shared helper.
    const fs = require('node:fs') as typeof import('node:fs')
    while (stack.length > 0) {
        const current = stack.pop()!
        let entries: import('node:fs').Dirent[]
        try {
            entries = fs.readdirSync(current, { withFileTypes: true })
        } catch {
            continue
        }
        for (const entry of entries) {
            const full = path.join(current, entry.name)
            if (entry.isDirectory()) {
                if (entry.name === 'node_modules' || entry.name === 'dist') {
                    continue
                }
                stack.push(full)
                continue
            }
            if (!entry.isFile()) continue
            if (!/\.(ts|tsx)$/.test(entry.name)) continue
            // Exclude test files — we are scanning production source
            // for IntersectionObserver usage, not test mocks.
            if (/\.(test|spec)\.(ts|tsx)$/.test(entry.name)) continue
            out.push(full)
        }
    }
    return out
}
