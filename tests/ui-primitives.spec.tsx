/**
 * ui-primitives.spec.tsx — Unit tests for the design-system primitives.
 *
 * Vai chinh: Frontend Engineer
 * Vai phoi hop: Design System Designer (token contract)
 *
 * Spec source-of-truth:
 *   - Task 4.6 (gamified-ui-asset-rollout)
 *   - design.md §F (Bright Sky tokens), §G (reduced motion), §H (a11y)
 *   - requirements.md Req 13.2, 14.1, 15.2, 15.4
 *
 * What this file covers
 * ---------------------
 *   - `Scrim` (Req 15.1, 15.3, 15.6)
 *       - Renders `data-scrim-intensity` matching the prop.
 *       - Defaults to `intensity="soft"` when the prop is omitted.
 *       - Both intensities apply the documented rgba background.
 *
 *   - `useReducedMotion` (Req 13.2, 13.6)
 *       - Returns `false` initially (SSR-safe default).
 *       - Flips to `true` when `matchMedia('(prefers-reduced-motion: reduce)')`
 *         reports `matches=true` on mount.
 *       - Subscribes to media query change events and updates within one
 *         render (Property 10 / design §G).
 *
 *   - `PrimaryCta` (Req 14.1, 15.2, 15.4)
 *       - `variant="primary"` exposes `data-role="primary-cta"` and
 *         enforces tap target ≥ 44×44 via `min-h-[44px] min-w-[44px]`.
 *       - `variant="review"` enforces ≥ 48×48 via `min-h-[48px] min-w-[48px]`
 *         (Req 9.1 / 14.1 review-specific).
 *       - `variant="secondary"` STRIPS `data-role="primary-cta"` and
 *         declares `data-cta-variant="secondary"`.
 *       - `disabled` strips `data-role="primary-cta"` (single-Primary_CTA
 *         invariant — Property 8 / Req 11.5).
 *       - Focus outline tokens are present (Req 15.4 floor: ≥2px outline,
 *         Bright Sky blue 700 = #3078B4 → contrast ≥ 3:1 on light bg).
 *
 * Test environment
 * ----------------
 * The root `vitest.property.config.ts` runs in `node` environment, so we
 * follow the same JSDOM-inside-node pattern established by
 * `tests/integration/a11y.spec.tsx` for any DOM-shaped assertion. Static
 * contracts (data-attributes, class tokens) use `renderToStaticMarkup`
 * to keep tests deterministic without needing a paint engine. The
 * `useReducedMotion` test mounts via `react-dom/client.createRoot` inside
 * a JSDOM `Window` and uses React 19's `act` to flush effects.
 *
 * Note on tap-target sizing: JSDOM does not paint, so
 * `getBoundingClientRect()` returns zeroed rects on rendered nodes. We
 * therefore assert the size *contract* via the Tailwind tokens
 * (`min-h-[44px]` / `min-w-[44px]` / `min-h-[48px]` / `min-w-[48px]`)
 * which the production source enforces, and additionally call
 * `getBoundingClientRect()` to confirm the API surface is exercised
 * (matching the task brief). Pixel-level verification of the painted
 * tap target lives in the Playwright run (task 18.1).
 *
 * Validates: Requirements 13.2, 14.1, 15.2, 15.4
 */

import type { ReactElement } from 'react'
import { afterEach, describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { JSDOM, VirtualConsole } from 'jsdom'

import { Scrim } from '../apps/web/src/components/ui/scrim'
import { PrimaryCta } from '../apps/web/src/components/ui/primary-cta'
import { useReducedMotion } from '../apps/web/src/hooks/use-reduced-motion'

// =============================================================================
// Scrim — Req 15.1, 15.3, 15.6
// =============================================================================

describe('Scrim — data-scrim-intensity attribute (Requirement 15.1, 15.3)', () => {
    it('defaults to intensity="soft" when no prop is provided', () => {
        const html = renderToStaticMarkup(<Scrim>content</Scrim>)
        expect(html).toMatch(/data-scrim-intensity="soft"/)
        expect(html).not.toMatch(/data-scrim-intensity="strong"/)
    })

    it('renders data-scrim-intensity="soft" when intensity="soft"', () => {
        const html = renderToStaticMarkup(<Scrim intensity="soft">content</Scrim>)
        expect(html).toMatch(/data-scrim-intensity="soft"/)
    })

    it('renders data-scrim-intensity="strong" when intensity="strong"', () => {
        const html = renderToStaticMarkup(<Scrim intensity="strong">content</Scrim>)
        expect(html).toMatch(/data-scrim-intensity="strong"/)
        expect(html).not.toMatch(/data-scrim-intensity="soft"/)
    })

    it('applies the soft scrim background rgba(255, 255, 255, 0.8)', () => {
        const html = renderToStaticMarkup(<Scrim intensity="soft">content</Scrim>)
        // Inline style is rendered as a kebab-cased CSS declaration string.
        expect(html).toMatch(/background-color:\s*rgba\(255,\s*255,\s*255,\s*0\.8\)/)
    })

    it('applies the strong scrim background rgba(23, 59, 86, 0.85)', () => {
        const html = renderToStaticMarkup(<Scrim intensity="strong">content</Scrim>)
        expect(html).toMatch(/background-color:\s*rgba\(23,\s*59,\s*86,\s*0\.85\)/)
    })

    it('renders children inside the scrim wrapper', () => {
        const html = renderToStaticMarkup(
            <Scrim>
                <p data-testid="scrim-child">passage</p>
            </Scrim>,
        )
        expect(html).toContain('data-testid="scrim-child"')
        expect(html).toContain('passage')
    })

    it('marks the overlay layer aria-hidden so it does not pollute the AT tree', () => {
        const html = renderToStaticMarkup(<Scrim>content</Scrim>)
        expect(html).toMatch(/aria-hidden="true"/)
    })
})

// =============================================================================
// useReducedMotion — Req 13.2, 13.6
// =============================================================================

/**
 * Build a fresh JSDOM, install its window/document onto `globalThis`, and
 * return helpers to drive matchMedia.
 *
 * The JSDOM build shipped in this workspace does not implement
 * `window.matchMedia`, so we install a controllable shim. The shim
 * returns a `MediaQueryList`-like object with `matches`, an
 * `addEventListener('change', listener)` registry, and a `dispatch`
 * helper that simulates the browser firing `change` when the user
 * toggles their OS reduced-motion preference.
 */
function setupReducedMotionEnvironment(initialMatches: boolean) {
    const virtualConsole = new VirtualConsole()
    // Quiet the JSDOM "not implemented" warnings — none are relevant here,
    // but if a genuine error fires we still want it surfaced.
    virtualConsole.on('jsdomError', (err: Error) => {
        // eslint-disable-next-line no-console
        console.error(err)
    })

    const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', {
        runScripts: 'outside-only',
        virtualConsole,
        pretendToBeVisual: true,
    })

    type Listener = (event: { matches: boolean }) => void

    const state = {
        matches: initialMatches,
        listeners: new Set<Listener>(),
    }

    const matchMediaImpl = (query: string) => {
        // The hook only ever queries `(prefers-reduced-motion: reduce)`. We
        // assert the query string defensively so an accidental change to
        // the hook is caught here.
        if (!query.includes('prefers-reduced-motion')) {
            throw new Error(`unexpected matchMedia query in test: ${query}`)
        }
        return {
            media: query,
            get matches() {
                return state.matches
            },
            onchange: null as Listener | null,
            addEventListener: (type: string, listener: Listener) => {
                if (type === 'change') state.listeners.add(listener)
            },
            removeEventListener: (type: string, listener: Listener) => {
                if (type === 'change') state.listeners.delete(listener)
            },
            // Older Safari fallback — not used by the hook today, but
            // included for shape parity so a future refactor doesn't
            // silently break the test.
            addListener: (listener: Listener) => state.listeners.add(listener),
            removeListener: (listener: Listener) => state.listeners.delete(listener),
            dispatchEvent: () => true,
        }
    }

    Object.defineProperty(dom.window, 'matchMedia', {
        configurable: true,
        writable: true,
        value: matchMediaImpl,
    })

    // Install the JSDOM window onto Node globals so React's client renderer
    // can reach `window` / `document` / `HTMLElement` when committing.
    //
    // Some globals (`navigator`, `window` itself in Node 22+) are
    // read-only accessor properties on `globalThis`. Plain assignment
    // throws "Cannot set property X of #<Object> which has only a
    // getter", so we use `Object.defineProperty` with `configurable:
    // true` to install our shim and restore the previous descriptor on
    // teardown.
    const previousDescriptors: Record<string, PropertyDescriptor | undefined> = {}
    const keys = [
        'window',
        'document',
        'navigator',
        'HTMLElement',
        'Element',
        'Node',
        'getComputedStyle',
        'requestAnimationFrame',
        'cancelAnimationFrame',
    ] as const
    for (const key of keys) {
        previousDescriptors[key] = Object.getOwnPropertyDescriptor(globalThis, key)
        const value = (dom.window as unknown as Record<string, unknown>)[key]
        Object.defineProperty(globalThis, key, {
            configurable: true,
            writable: true,
            value,
        })
    }
    // IS_REACT_ACT_ENVIRONMENT lets React know we are in a test
    // environment so `act()` warnings are surfaced and `useEffect`
    // flushes synchronously inside `act` boundaries.
    ;(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true

    return {
        dom,
        setMatches(value: boolean) {
            state.matches = value
            for (const listener of state.listeners) {
                listener({ matches: value })
            }
        },
        getListenerCount() {
            return state.listeners.size
        },
        teardown() {
            for (const key of keys) {
                const previous = previousDescriptors[key]
                if (previous === undefined) {
                    delete (globalThis as Record<string, unknown>)[key]
                } else {
                    Object.defineProperty(globalThis, key, previous)
                }
            }
            delete (globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT
            dom.window.close()
        },
    }
}

describe('useReducedMotion — Requirement 13.2, 13.6', () => {
    let env: ReturnType<typeof setupReducedMotionEnvironment> | null = null

    afterEach(() => {
        env?.teardown()
        env = null
    })

    it('returns false on first render (SSR-safe initial value)', async () => {
        env = setupReducedMotionEnvironment(false)
        const { dom } = env

        // Lazy-import inside the test so React picks up the JSDOM globals
        // installed by setupReducedMotionEnvironment().
        const { createRoot } = await import('react-dom/client')
        const React = await import('react')
        const { act } = React

        let captured: boolean | undefined
        function Probe() {
            captured = useReducedMotion()
            return null
        }

        const root = createRoot(dom.window.document.getElementById('root') as HTMLElement)
        await act(async () => {
            root.render(<Probe />)
        })

        // Initial useState seed is `false`. The mount-time `update()` call
        // inside the effect synchronises the value with matchMedia.matches,
        // which we set to `false` here.
        expect(captured).toBe(false)

        await act(async () => {
            root.unmount()
        })
    })

    it('returns true when prefers-reduced-motion: reduce matches on mount', async () => {
        env = setupReducedMotionEnvironment(true)
        const { dom } = env

        const { createRoot } = await import('react-dom/client')
        const React = await import('react')
        const { act } = React

        let captured: boolean | undefined
        function Probe() {
            captured = useReducedMotion()
            return null
        }

        const root = createRoot(dom.window.document.getElementById('root') as HTMLElement)
        await act(async () => {
            root.render(<Probe />)
        })

        // useEffect runs once on mount and calls `setReduced(mql.matches)`,
        // flipping the initial `false` to `true` within the same
        // act-bounded render.
        expect(captured).toBe(true)

        await act(async () => {
            root.unmount()
        })
    })

    it('updates within one render when matchMedia change event fires', async () => {
        env = setupReducedMotionEnvironment(false)
        const { dom, setMatches, getListenerCount } = env

        const { createRoot } = await import('react-dom/client')
        const React = await import('react')
        const { act } = React

        const captures: boolean[] = []
        function Probe() {
            captures.push(useReducedMotion())
            return null
        }

        const root = createRoot(dom.window.document.getElementById('root') as HTMLElement)
        await act(async () => {
            root.render(<Probe />)
        })

        // After mount the hook should have subscribed exactly one listener.
        expect(getListenerCount()).toBe(1)
        expect(captures.at(-1)).toBe(false)

        // Simulate the OS toggling reduced-motion ON.
        await act(async () => {
            setMatches(true)
        })
        expect(captures.at(-1)).toBe(true)

        // And back OFF.
        await act(async () => {
            setMatches(false)
        })
        expect(captures.at(-1)).toBe(false)

        // Unmount must remove the listener (no leaks across surfaces).
        await act(async () => {
            root.unmount()
        })
        expect(getListenerCount()).toBe(0)
    })
})

// =============================================================================
// PrimaryCta — Req 14.1, 15.2, 15.4
// =============================================================================

/**
 * Render a PrimaryCta into a JSDOM document and return the rendered button
 * element (or whatever element carries the resolved data-* attrs).
 *
 * We use this for `getBoundingClientRect()` calls that the task brief
 * explicitly mentions. JSDOM does not paint, so the rect will be zero-sized
 * — we therefore additionally assert the tap-target *contract* via the
 * Tailwind `min-h`/`min-w` tokens emitted by the production source.
 */
function renderPrimaryCtaToJsdom(element: ReactElement) {
    const html = renderToStaticMarkup(element)
    const dom = new JSDOM(
        `<!doctype html><html><body><div id="root">${html}</div></body></html>`,
    )
    const root = dom.window.document.getElementById('root') as HTMLElement
    return { dom, root }
}

describe('PrimaryCta — variant="primary" (Requirement 14.1, 15.2)', () => {
    it('exposes data-role="primary-cta" so single-CTA invariants can find it', () => {
        const html = renderToStaticMarkup(<PrimaryCta>Tiếp tục học</PrimaryCta>)
        expect(html).toMatch(/data-role="primary-cta"/)
        expect(html).not.toMatch(/data-cta-variant=/)
    })

    it('enforces tap target ≥ 44×44 via min-h-[44px] min-w-[44px] tokens', () => {
        const html = renderToStaticMarkup(<PrimaryCta>Tiếp tục học</PrimaryCta>)
        expect(html).toContain('min-h-[44px]')
        expect(html).toContain('min-w-[44px]')
    })

    it('uses the Bright Sky action token as the background fill', () => {
        const html = renderToStaticMarkup(<PrimaryCta>Tiếp tục học</PrimaryCta>)
        expect(html).toContain('bg-[var(--fuxie-action)]')
    })

    it('exposes a getBoundingClientRect() API on the rendered button', () => {
        const { root } = renderPrimaryCtaToJsdom(<PrimaryCta>Tiếp tục học</PrimaryCta>)
        const button = root.querySelector('[data-role="primary-cta"]') as HTMLElement
        expect(button).not.toBeNull()
        const rect = button.getBoundingClientRect()
        // JSDOM returns a DOMRect — its width/height are 0 because there is
        // no paint, but the contract is honoured (the call does not throw
        // and returns the canonical fields). The 44×44 floor itself is
        // locked by the min-h/min-w token assertion above.
        expect(typeof rect.width).toBe('number')
        expect(typeof rect.height).toBe('number')
        expect(typeof rect.top).toBe('number')
        expect(typeof rect.left).toBe('number')
    })
})

describe('PrimaryCta — variant="review" (Requirement 9.1, 14.1)', () => {
    it('enforces tap target ≥ 48×48 via min-h-[48px] min-w-[48px] tokens', () => {
        const html = renderToStaticMarkup(
            <PrimaryCta variant="review">Ôn ngay</PrimaryCta>,
        )
        expect(html).toContain('min-h-[48px]')
        expect(html).toContain('min-w-[48px]')
        // The 44px floor must NOT leak in via the primary variant classes.
        expect(html).not.toContain('min-h-[44px]')
    })

    it('still exposes data-role="primary-cta" so it counts as the surface CTA', () => {
        const html = renderToStaticMarkup(
            <PrimaryCta variant="review">Ôn ngay</PrimaryCta>,
        )
        expect(html).toMatch(/data-role="primary-cta"/)
    })
})

describe('PrimaryCta — variant="secondary" (Property 8 / Req 11.5)', () => {
    it('STRIPS data-role="primary-cta" so secondary CTAs do not break the single-Primary_CTA invariant', () => {
        const html = renderToStaticMarkup(
            <PrimaryCta variant="secondary">Về Dashboard</PrimaryCta>,
        )
        expect(html).not.toMatch(/data-role="primary-cta"/)
    })

    it('declares data-cta-variant="secondary" so consumers can locate the secondary action', () => {
        const html = renderToStaticMarkup(
            <PrimaryCta variant="secondary">Về Dashboard</PrimaryCta>,
        )
        expect(html).toMatch(/data-cta-variant="secondary"/)
    })

    it('uses the Bright Sky outline treatment instead of a filled background', () => {
        const html = renderToStaticMarkup(
            <PrimaryCta variant="secondary">Về Dashboard</PrimaryCta>,
        )
        expect(html).toContain('border-[var(--fuxie-action)]')
        expect(html).toContain('bg-white')
    })
})

describe('PrimaryCta — disabled state (Requirement 11.5, Property 8)', () => {
    it('strips data-role="primary-cta" when disabled (cannot be the surface CTA)', () => {
        const html = renderToStaticMarkup(
            <PrimaryCta disabled>Thử lại</PrimaryCta>,
        )
        expect(html).not.toMatch(/data-role="primary-cta"/)
    })

    it('sets aria-disabled="true" so AT users hear the disabled state', () => {
        const html = renderToStaticMarkup(
            <PrimaryCta disabled>Thử lại</PrimaryCta>,
        )
        expect(html).toMatch(/aria-disabled="true"/)
    })

    it('keeps min-h/min-w tokens so disabled buttons still meet the tap-target floor', () => {
        const html = renderToStaticMarkup(
            <PrimaryCta disabled>Thử lại</PrimaryCta>,
        )
        expect(html).toContain('min-h-[44px]')
        expect(html).toContain('min-w-[44px]')
    })
})

describe('PrimaryCta — focus outline contract (Requirement 15.4)', () => {
    /**
     * Req 15.4 mandates a visible focus outline ≥ 2px wide with ≥ 3:1
     * contrast against the surface background. The PrimaryCta primitive
     * encodes this via four Tailwind tokens — together they ship a 2px
     * solid Bright Sky 700 (#3078B4) outline with a 2px offset, which
     * contrasts ≥ 3:1 against `--fuxie-blue-50` (#F3FBFF) and against
     * white card surfaces (a11y.spec.tsx encodes the contrast math).
     */
    const REQUIRED_TOKENS = [
        'focus-visible:outline',
        'focus-visible:outline-2',
        'focus-visible:outline-offset-2',
        'focus-visible:outline-[var(--fuxie-blue-700)]',
    ] as const

    it.each(REQUIRED_TOKENS)('emits the "%s" token on variant="primary"', (token) => {
        const html = renderToStaticMarkup(<PrimaryCta>Tiếp tục</PrimaryCta>)
        expect(html).toContain(token)
    })

    it.each(REQUIRED_TOKENS)('emits the "%s" token on variant="review"', (token) => {
        const html = renderToStaticMarkup(
            <PrimaryCta variant="review">Ôn ngay</PrimaryCta>,
        )
        expect(html).toContain(token)
    })

    it.each(REQUIRED_TOKENS)('emits the "%s" token on variant="secondary"', (token) => {
        const html = renderToStaticMarkup(
            <PrimaryCta variant="secondary">Về Dashboard</PrimaryCta>,
        )
        expect(html).toContain(token)
    })
})
