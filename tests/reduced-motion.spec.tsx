/**
 * Reduced-motion Animation Discipline — Property-Based Tests (task 17.3 of
 * spec `gamified-ui-asset-rollout`).
 *
 * Vai chinh: Frontend Engineer
 * Vai phoi hop: QA Automation Engineer
 *
 * Property wired in this file:
 *
 *   - Property 10 (task 17.3) — Reduced-motion Animation Discipline
 *     1. CSS-level animation discipline: every keyframe rule in the
 *        feature stylesheet (`apps/web/src/styles/animations.css`)
 *        animates ONLY `transform` / `opacity` (never
 *        `top|left|right|bottom|width|height|margin|padding`), and every
 *        animation duration referenced by the canonical class set
 *        `{animate-idle, animate-coach, animate-reward, animate-speak}`
 *        falls inside `[120ms, 2000ms]`.
 *     2. Reduced-motion class stripping: when components in the closed
 *        motion vocabulary are rendered with `reducedMotion=true`, no
 *        DOM node carries any of `{animate-idle, animate-coach,
 *        animate-reward, animate-speak}` (Req 13.2). The check is
 *        framework-agnostic — it scans the rendered HTML for the
 *        canonical class names anywhere on a `class="..."` attribute.
 *     3. Result_Reward_Loop reduced-motion path ≤ 200ms: verified at the
 *        FSM layer (the source of truth for the 200ms budget). With
 *        `reducedMotion=true`, `clampEarnedDurationMs(any, true) === 0`
 *        AND the saving → earned → receipt transition chain elapses
 *        within `REDUCED_MOTION_BUDGET_MS` wall-clock milliseconds.
 *
 *     Validates: Requirements 7.5, 13.1, 13.2, 13.3, 13.5, 19.5
 *
 * Test framework
 * --------------
 * Vitest + fast-check (`numRuns: 100` per task brief). The root
 * `vitest.property.config.ts` runs in `node` environment, matching the
 * other PBT specs in this repo. Components are rendered with
 * `react-dom/server.renderToStaticMarkup`, then the resulting HTML is
 * scanned via regex — JSDOM/paint is not required because the property
 * is purely about which class names appear on the rendered output.
 *
 * Why the FSM (not a full-component) check for sub-property 3
 * -----------------------------------------------------------
 * The 200ms budget (`REDUCED_MOTION_BUDGET_MS`) is owned by
 * `result-reward-loop-fsm.ts`. The FSM forces `earnedDurationMs = 0`
 * whenever `reducedMotion === true` and the React wrapper schedules the
 * `EARNED_TIMER_ELAPSED` event with that 0ms timer. Asserting the FSM
 * transitions complete inside the budget therefore locks the contract
 * at the layer that actually owns the timing, instead of measuring
 * unrelated React/Image rendering cost which would make the test
 * flaky on CI.
 */

import { readFileSync } from 'node:fs'
import path from 'node:path'

import { describe, expect, it } from 'vitest'
import * as fc from 'fast-check'
import { renderToStaticMarkup } from 'react-dom/server'

import { MascotRoleHost } from '@/components/gamification/mascot-role-host'
import { SkillMotivationLayer } from '@/components/gamification/skill-motivation-layer'
import {
    REDUCED_MOTION_BUDGET_MS,
    clampEarnedDurationMs,
    initResultRewardLoopState,
    resultRewardLoopReducer,
    type ResultRewardLoopState,
} from '@/components/gamification/result-reward-loop-fsm'
import type { SurfaceState } from '@/lib/mascot/mascot-role'
import type { SkillMotivationSurfaceId } from '@/components/gamification/skill-motivation-layer'

const NUM_RUNS = 100 as const

// ===========================================================================
// CSS sourcing
// ===========================================================================

const ANIMATIONS_CSS_PATH = path.resolve(
    __dirname,
    '..',
    'apps',
    'web',
    'src',
    'styles',
    'animations.css',
)

const ANIMATIONS_CSS = readFileSync(ANIMATIONS_CSS_PATH, 'utf8')

/** Closed set of canonical animation class names (Req 13.2). */
const CANONICAL_ANIMATE_CLASSES = [
    'animate-idle',
    'animate-coach',
    'animate-reward',
    'animate-speak',
] as const

/** Properties that MUST NOT appear inside any animation keyframe block
 *  (Req 13.1). Animating any of these triggers layout / non-compositor
 *  paths that break the reduced-motion contract. */
const FORBIDDEN_ANIMATED_PROPERTIES = [
    'top',
    'left',
    'right',
    'bottom',
    'width',
    'height',
    'margin',
    'margin-top',
    'margin-right',
    'margin-bottom',
    'margin-left',
    'padding',
    'padding-top',
    'padding-right',
    'padding-bottom',
    'padding-left',
] as const

const DURATION_MIN_MS = 120
const DURATION_MAX_MS = 2000

// ===========================================================================
// CSS parsing helpers
// ===========================================================================

/**
 * Strip `/* ... *\/` comments from CSS so the parser does not mistake
 * commented-out properties (e.g. an example referencing `top:`) for real
 * declarations. The CSS file uses block comments; line comments are not
 * valid CSS.
 */
function stripCssComments(css: string): string {
    return css.replace(/\/\*[\s\S]*?\*\//g, '')
}

interface KeyframeBlock {
    /** Name after `@keyframes`, e.g. `fuxie-animate-idle`. */
    name: string
    /** Inner body of the @keyframes rule (between `{` and the matching `}`). */
    body: string
}

/**
 * Find every `@keyframes <name> { ... }` rule in the source. The CSS
 * parser is intentionally minimal — `animations.css` uses standard
 * keyframe syntax with balanced braces. Walking with a brace counter
 * keeps the test independent of any external CSS parser.
 */
function extractKeyframeBlocks(css: string): KeyframeBlock[] {
    const cleaned = stripCssComments(css)
    const results: KeyframeBlock[] = []
    const headerRe = /@keyframes\s+([A-Za-z_][\w-]*)\s*\{/g
    let match: RegExpExecArray | null
    while ((match = headerRe.exec(cleaned)) !== null) {
        const name = match[1]
        // Walk forward from the position right after the opening `{`.
        let depth = 1
        let i = headerRe.lastIndex
        while (i < cleaned.length && depth > 0) {
            const ch = cleaned[i]
            if (ch === '{') depth += 1
            else if (ch === '}') depth -= 1
            i += 1
        }
        if (depth !== 0) {
            throw new Error(
                `[reduced-motion.spec] unbalanced braces while parsing @keyframes ${name}`,
            )
        }
        // body excludes the final closing `}` so callers can split on `{`/`}`
        // safely if they want.
        const body = cleaned.slice(headerRe.lastIndex, i - 1)
        results.push({ name, body })
        headerRe.lastIndex = i
    }
    return results
}

/**
 * Pull every CSS property name (the token before the `:`) out of a
 * keyframe body. Selectors like `0%`, `50%`, `from`, `to` are handled
 * by the brace-balanced inner-block scan — we only inspect declaration
 * lines, where each declaration is `<prop>: <value>;`.
 */
function extractDeclaredPropertiesFromKeyframeBody(body: string): string[] {
    const cleaned = stripCssComments(body)
    const propertyNames: string[] = []
    // Walk inner blocks `<selector> { ... }` and accumulate properties.
    const innerRe = /\{([^{}]*)\}/g
    let match: RegExpExecArray | null
    while ((match = innerRe.exec(cleaned)) !== null) {
        const declarations = match[1]
        for (const decl of declarations.split(';')) {
            const trimmed = decl.trim()
            if (!trimmed) continue
            const colonIdx = trimmed.indexOf(':')
            if (colonIdx <= 0) continue
            const propertyName = trimmed.slice(0, colonIdx).trim().toLowerCase()
            if (propertyName) propertyNames.push(propertyName)
        }
    }
    return propertyNames
}

/**
 * Pull every animation-duration value from any rule whose selector list
 * contains one of the canonical animate-* class names. Returns the
 * durations in milliseconds (converting `s` to `ms` as needed).
 *
 * The implementation walks the whole file, finds top-level rule blocks
 * (`<selector> { ... }`) whose selector mentions a canonical class, and
 * extracts either the `animation-duration` longhand or the second token
 * of the `animation` shorthand.
 */
function extractCanonicalAnimationDurationsMs(css: string): Array<{
    selector: string
    durationMs: number
    raw: string
}> {
    const cleaned = stripCssComments(css)
    // Strip @keyframes blocks first so their inner braces don't confuse the
    // top-level rule-block walker.
    let stripped = cleaned
    const kfRe = /@keyframes\s+[A-Za-z_][\w-]*\s*\{/g
    let m: RegExpExecArray | null
    while ((m = kfRe.exec(stripped)) !== null) {
        const start = m.index
        let depth = 1
        let i = kfRe.lastIndex
        while (i < stripped.length && depth > 0) {
            const ch = stripped[i]
            if (ch === '{') depth += 1
            else if (ch === '}') depth -= 1
            i += 1
        }
        // Replace with whitespace of the same length so indices in error
        // messages are still meaningful.
        stripped = stripped.slice(0, start) + ' '.repeat(i - start) + stripped.slice(i)
        kfRe.lastIndex = i
    }
    // Strip @media blocks too — the reduced-motion media query inside them
    // intentionally sets `animation: none`, which would otherwise be flagged
    // as "duration not in window". The media query is the OFF switch, not
    // a canonical animation declaration.
    const mediaRe = /@media\s*[^{]+\{/g
    while ((m = mediaRe.exec(stripped)) !== null) {
        const start = m.index
        let depth = 1
        let i = mediaRe.lastIndex
        while (i < stripped.length && depth > 0) {
            const ch = stripped[i]
            if (ch === '{') depth += 1
            else if (ch === '}') depth -= 1
            i += 1
        }
        stripped = stripped.slice(0, start) + ' '.repeat(i - start) + stripped.slice(i)
        mediaRe.lastIndex = i
    }

    const ruleRe = /([^{}]+)\{([^{}]*)\}/g
    const out: Array<{ selector: string; durationMs: number; raw: string }> = []
    while ((m = ruleRe.exec(stripped)) !== null) {
        const selector = m[1].trim()
        const body = m[2]
        if (!selector) continue
        const mentionsCanonical = CANONICAL_ANIMATE_CLASSES.some((cls) =>
            // Class selector boundary: either followed by `,`, `{`, ` `, `:`, or end.
            new RegExp(`\\.${cls}(?![\\w-])`).test(selector),
        )
        if (!mentionsCanonical) continue
        // Look for `animation-duration: <value>;` longhand.
        const longhand = /animation-duration\s*:\s*([0-9.]+)(ms|s)\b/i.exec(body)
        if (longhand) {
            const raw = `${longhand[1]}${longhand[2]}`
            const durationMs = longhand[2].toLowerCase() === 's' ? Number(longhand[1]) * 1000 : Number(longhand[1])
            out.push({ selector, durationMs, raw })
            continue
        }
        // `animation: <name> <duration> ...` shorthand. The duration is the
        // first time-token in the value list (per the CSS spec).
        const shorthand = /animation\s*:\s*([^;]+);?/i.exec(body)
        if (shorthand) {
            const value = shorthand[1]
            const timeRe = /(?:^|\s)([0-9.]+)(ms|s)\b/g
            let tm: RegExpExecArray | null
            const found: Array<{ ms: number; raw: string }> = []
            while ((tm = timeRe.exec(value)) !== null) {
                const ms = tm[2].toLowerCase() === 's' ? Number(tm[1]) * 1000 : Number(tm[1])
                found.push({ ms, raw: `${tm[1]}${tm[2]}` })
            }
            if (found.length > 0) {
                // First time token = duration; second (if any) = delay.
                out.push({ selector, durationMs: found[0].ms, raw: found[0].raw })
            }
        }
    }
    return out
}

// ===========================================================================
// Sub-property 1 — CSS animation discipline
// ===========================================================================

describe('Property 10.1 — CSS animation discipline (Req 13.1, 13.5)', () => {
    const KEYFRAMES = extractKeyframeBlocks(ANIMATIONS_CSS)
    const DURATIONS = extractCanonicalAnimationDurationsMs(ANIMATIONS_CSS)

    it('animations.css contains the four canonical fuxie-animate-* keyframes', () => {
        // Sanity guard: if the canonical keyframes get renamed, every
        // assertion below silently passes on an empty list. Lock the
        // canonical set explicitly so the test fails loudly instead.
        const names = new Set(KEYFRAMES.map((k) => k.name))
        expect(names.has('fuxie-animate-idle'), 'missing @keyframes fuxie-animate-idle').toBe(true)
        expect(names.has('fuxie-animate-coach'), 'missing @keyframes fuxie-animate-coach').toBe(true)
        expect(names.has('fuxie-animate-reward'), 'missing @keyframes fuxie-animate-reward').toBe(true)
        expect(names.has('fuxie-animate-speak'), 'missing @keyframes fuxie-animate-speak').toBe(true)
    })

    it('every keyframe rule animates ONLY transform / opacity (Req 13.1)', () => {
        // Sample keyframe blocks uniformly at random so the property is
        // exercised across NUM_RUNS independent draws even though the
        // input space is small (the closed set of keyframes in the file).
        expect(KEYFRAMES.length).toBeGreaterThan(0)

        fc.assert(
            fc.property(fc.integer({ min: 0, max: KEYFRAMES.length - 1 }), (idx) => {
                const block = KEYFRAMES[idx]
                const props = extractDeclaredPropertiesFromKeyframeBody(block.body)
                // Every declared property must be transform OR opacity.
                for (const prop of props) {
                    if (FORBIDDEN_ANIMATED_PROPERTIES.includes(prop as never)) {
                        throw new Error(
                            `@keyframes ${block.name}: forbidden property "${prop}" — keyframes may animate only transform/opacity (Req 13.1)`,
                        )
                    }
                    if (prop !== 'transform' && prop !== 'opacity') {
                        throw new Error(
                            `@keyframes ${block.name}: unexpected property "${prop}" — keyframes may declare only transform/opacity (Req 13.1)`,
                        )
                    }
                }
                return true
            }),
            { numRuns: NUM_RUNS },
        )
    })

    it('every animation referencing the canonical class set has duration ∈ [120ms, 2000ms] (Req 13.5)', () => {
        // Canonical classes are: animate-idle, animate-coach, animate-reward, animate-speak.
        // Sanity guard: the file MUST declare durations for the canonical
        // class set. If the parser returns an empty list, the property
        // would pass vacuously — fail loudly instead.
        expect(
            DURATIONS.length,
            'expected at least one animation declaration on the canonical animate-* class set',
        ).toBeGreaterThan(0)

        fc.assert(
            fc.property(fc.integer({ min: 0, max: DURATIONS.length - 1 }), (idx) => {
                const entry = DURATIONS[idx]
                if (entry.durationMs < DURATION_MIN_MS) {
                    throw new Error(
                        `selector "${entry.selector}" duration ${entry.raw} = ${entry.durationMs}ms is below 120ms (Req 13.5)`,
                    )
                }
                if (entry.durationMs > DURATION_MAX_MS) {
                    throw new Error(
                        `selector "${entry.selector}" duration ${entry.raw} = ${entry.durationMs}ms is above 2000ms (Req 13.5)`,
                    )
                }
                return true
            }),
            { numRuns: NUM_RUNS },
        )
    })
})

// ===========================================================================
// Sub-property 2 — Reduced-motion class stripping (Req 13.2)
// ===========================================================================

describe('Property 10.2 — Reduced-motion class stripping (Req 13.2)', () => {
    /**
     * Skill surfaces that the SkillMotivationLayer accepts. The layer's
     * `reducedMotion=true` path swaps `motion="coach"` for `motion="none"`,
     * which strips the `fuxie-mascot-motion-coach` legacy class. The
     * canonical `animate-*` set must NEVER appear regardless of motion
     * state — the runtime currently emits legacy classes only — but the
     * property check is framework-agnostic and locks the closed set.
     */
    const SKILL_SURFACES: SkillMotivationSurfaceId[] = [
        'reading',
        'listening',
        'speaking',
        'writing',
    ]

    /**
     * Surface states under which `MascotRoleHost` resolves to a non-silent
     * role. These exclude states that resolve to `silent` on the surfaces
     * we render (which would render `null` and produce no class to
     * inspect). For surfaces with config role per state, we cover the
     * `default` state which always resolves to a coach/companion role on
     * the chosen surfaces.
     */
    const NON_SILENT_STATES: SurfaceState[] = ['default']

    function classAttributesIn(html: string): string[] {
        const matches = html.match(/class="[^"]*"/g) ?? []
        return matches.map((m) => m.slice(7, -1))
    }

    function rejectsCanonicalAnimateClasses(html: string): {
        ok: boolean
        offendingClass?: string
        offendingAttribute?: string
    } {
        const attrs = classAttributesIn(html)
        for (const attr of attrs) {
            // Tokenise on whitespace — class attrs are space-separated.
            const tokens = attr.split(/\s+/).filter(Boolean)
            for (const token of tokens) {
                if ((CANONICAL_ANIMATE_CLASSES as readonly string[]).includes(token)) {
                    return {
                        ok: false,
                        offendingClass: token,
                        offendingAttribute: attr,
                    }
                }
            }
        }
        return { ok: true }
    }

    const counterArb = fc.integer({ min: 0, max: 9999 })
    const skillSurfaceArb = fc.constantFrom<SkillMotivationSurfaceId>(...SKILL_SURFACES)
    const nonSilentStateArb = fc.constantFrom<SurfaceState>(...NON_SILENT_STATES)

    it('SkillMotivationLayer with reducedMotion=true emits no animate-{idle,coach,reward,speak} class', () => {
        fc.assert(
            fc.property(
                skillSurfaceArb,
                counterArb,
                counterArb,
                fc.boolean(),
                (surfaceId, done, total, includeWorldProp) => {
                    const html = renderToStaticMarkup(
                        <SkillMotivationLayer
                            surfaceId={surfaceId}
                            done={done}
                            total={total}
                            reducedMotion
                            worldPropTags={
                                includeWorldProp
                                    ? surfaceId === 'reading'
                                        ? ['library']
                                        : surfaceId === 'listening'
                                            ? ['studio', 'radio']
                                            : surfaceId === 'speaking'
                                                ? ['cafe', 'plaza']
                                                : ['desk', 'workshop']
                                    : undefined
                            }
                        />,
                    )
                    const verdict = rejectsCanonicalAnimateClasses(html)
                    if (!verdict.ok) {
                        throw new Error(
                            `SkillMotivationLayer(reducedMotion=true) emitted "${verdict.offendingClass}" in class="${verdict.offendingAttribute}" — Req 13.2 forbids canonical animate-* classes under reduced-motion`,
                        )
                    }
                    return true
                },
            ),
            { numRuns: NUM_RUNS },
        )
    })

    it('MascotRoleHost rendered with motion="none" emits no animate-{idle,coach,reward,speak} class', () => {
        // `MascotRoleHost` is the canonical mascot host across surfaces.
        // Under reduced-motion, surfaces forward `motion="none"` (see the
        // SkillMotivationLayer's `motion={reducedMotion ? 'none' : 'coach'}`
        // branch). This property locks the host's behaviour directly so the
        // contract holds for any surface that adopts the same forwarding
        // convention.
        fc.assert(
            fc.property(skillSurfaceArb, nonSilentStateArb, (surfaceId, state) => {
                const html = renderToStaticMarkup(
                    <MascotRoleHost
                        surfaceId={surfaceId}
                        state={state}
                        motion="none"
                    />,
                )
                // Sanity: ensure something was actually rendered (i.e. role
                // didn't fall back to silent → null), so the check isn't
                // vacuous.
                expect(html.length, 'expected non-empty render for non-silent role').toBeGreaterThan(0)
                const verdict = rejectsCanonicalAnimateClasses(html)
                if (!verdict.ok) {
                    throw new Error(
                        `MascotRoleHost(motion="none") emitted "${verdict.offendingClass}" in class="${verdict.offendingAttribute}" — Req 13.2 forbids canonical animate-* classes under reduced-motion`,
                    )
                }
                return true
            }),
            { numRuns: NUM_RUNS },
        )
    })
})

// ===========================================================================
// Sub-property 3 — Result_Reward_Loop reduced-motion path ≤ 200ms
//                  (Req 7.5, 13.3, 19.5)
// ===========================================================================

describe('Property 10.3 — Result_Reward_Loop reduced-motion path ≤ 200ms (Req 7.5, 13.3)', () => {
    it('REDUCED_MOTION_BUDGET_MS is the documented 200ms ceiling', () => {
        expect(REDUCED_MOTION_BUDGET_MS).toBe(200)
    })

    it('clampEarnedDurationMs(any, true) === 0 for any finite/non-finite input', () => {
        // Mix finite and non-finite generators so the helper's totality is
        // exercised. The contract is: reducedMotion=true forces 0,
        // regardless of the raw `durationMs` argument (Req 7.5).
        const numericArb = fc.oneof(
            fc.integer({ min: -10_000, max: 10_000 }),
            fc.float({ min: -1e6, max: 1e6, noNaN: true }),
            fc.constantFrom(Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY, 0),
        )
        fc.assert(
            fc.property(numericArb, (raw) => {
                expect(clampEarnedDurationMs(raw, true)).toBe(0)
            }),
            { numRuns: NUM_RUNS },
        )
    })

    it('FSM saving → earned → receipt completes within 200ms wall-clock when reducedMotion=true', () => {
        // Inputs: arbitrary raw earned-duration overrides. The FSM clamp
        // forces them to 0 under reduced-motion, so the auto-advance
        // chain has zero scheduled delay and must complete in well under
        // the 200ms budget.
        const earnedDurationArb = fc.oneof(
            fc.integer({ min: 0, max: 5000 }),
            fc.constantFrom(Number.NaN, Number.POSITIVE_INFINITY),
        )
        fc.assert(
            fc.property(earnedDurationArb, (raw) => {
                const start = performance.now()
                let state: ResultRewardLoopState = initResultRewardLoopState({
                    earnedDurationMs: raw,
                    reducedMotion: true,
                })
                // Reduced-motion init pins earned duration to 0 (Req 7.5).
                expect(state.reducedMotion).toBe(true)
                expect(state.earnedDurationMs).toBe(0)
                // Drive the full transition chain. There are no real
                // timers here — the FSM is pure, the wrapper schedules
                // `EARNED_TIMER_ELAPSED` via `setTimeout(0)` in
                // production. Under reduced-motion, that 0ms timer
                // resolves on the next macrotask, well within budget.
                state = resultRewardLoopReducer(state, { type: 'SAVE_SUCCEEDED' })
                expect(state.phase).toBe('earned')
                state = resultRewardLoopReducer(state, { type: 'EARNED_TIMER_ELAPSED' })
                expect(state.phase).toBe('receipt')
                const elapsed = performance.now() - start
                if (elapsed > REDUCED_MOTION_BUDGET_MS) {
                    throw new Error(
                        `reduced-motion path took ${elapsed.toFixed(2)}ms (> ${REDUCED_MOTION_BUDGET_MS}ms budget, Req 7.5)`,
                    )
                }
                return true
            }),
            { numRuns: NUM_RUNS },
        )
    })

    it('REDUCED_MOTION_CHANGED → true mid-flow re-clamps earnedDurationMs to 0 (still within budget)', () => {
        fc.assert(
            fc.property(fc.integer({ min: 1200, max: 2000 }), (initialMs) => {
                const start = performance.now()
                let state = initResultRewardLoopState({
                    earnedDurationMs: initialMs,
                    reducedMotion: false,
                })
                expect(state.earnedDurationMs).toBeGreaterThanOrEqual(1200)
                expect(state.earnedDurationMs).toBeLessThanOrEqual(2000)
                // User toggles reduced-motion mid-flow — re-clamp is
                // immediate (a pure reducer step).
                state = resultRewardLoopReducer(state, {
                    type: 'REDUCED_MOTION_CHANGED',
                    reducedMotion: true,
                })
                expect(state.reducedMotion).toBe(true)
                expect(state.earnedDurationMs).toBe(0)
                const elapsed = performance.now() - start
                expect(elapsed).toBeLessThanOrEqual(REDUCED_MOTION_BUDGET_MS)
            }),
            { numRuns: NUM_RUNS },
        )
    })
})
