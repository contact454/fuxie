import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { renderToStaticMarkup } from 'react-dom/server'
// packages/ui does not ship @types/jsdom; runtime comes from monorepo root.
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error -- jsdom has no local type package in @fuxie/ui
import { JSDOM } from 'jsdom'
import * as React from 'react'
import { PrimaryCta } from './PrimaryCta'

function installDom() {
    const dom = new JSDOM('<!doctype html><html><body></body></html>', {
        url: 'http://localhost/',
    })
    const { window } = dom
    Object.defineProperty(globalThis, 'window', { value: window, configurable: true })
    Object.defineProperty(globalThis, 'document', { value: window.document, configurable: true })
    Object.defineProperty(globalThis, 'HTMLElement', { value: window.HTMLElement, configurable: true })
    Object.defineProperty(globalThis, 'Node', { value: window.Node, configurable: true })
    return dom
}

describe('PrimaryCta Primitive Component', () => {
    it('renders primary variant with data-role="primary-cta"', () => {
        const html = renderToStaticMarkup(<PrimaryCta>Click me</PrimaryCta>)
        expect(html).toContain('data-role="primary-cta"')
        expect(html).not.toContain('data-cta-variant=')
        expect(html).toContain('bg-[var(--fuxie-action)]')
        expect(html).toContain('min-h-[var(--fuxie-tap-min)]')
    })

    it('renders secondary variant with only data-cta-variant="secondary"', () => {
        const html = renderToStaticMarkup(<PrimaryCta variant="secondary">Click me</PrimaryCta>)
        expect(html).toContain('data-cta-variant="secondary"')
        expect(html).not.toContain('data-role="primary-cta"')
        expect(html).toContain('border-[var(--fuxie-action)]')
    })

    it('disabled primary has neither primary-role nor secondary variant attribute', () => {
        const html = renderToStaticMarkup(<PrimaryCta disabled>Click me</PrimaryCta>)
        expect(html).not.toContain('data-role="primary-cta"')
        expect(html).not.toContain('data-cta-variant=')
        expect(html).toContain('disabled')
        expect(html).toContain('aria-disabled="true"')
    })

    it('disabled secondary retains only the secondary attribute', () => {
        const html = renderToStaticMarkup(
            <PrimaryCta variant="secondary" disabled>
                Click me
            </PrimaryCta>,
        )
        expect(html).toContain('data-cta-variant="secondary"')
        expect(html).not.toContain('data-role="primary-cta"')
        expect(html).toContain('disabled')
    })

    it('asChild preserves href, child class, and primary data-role', () => {
        const html = renderToStaticMarkup(
            <PrimaryCta asChild>
                <a href="/learn/next" className="child-link">
                    Continue
                </a>
            </PrimaryCta>,
        )
        expect(html).toContain('href="/learn/next"')
        expect(html).toContain('child-link')
        expect(html).toContain('data-role="primary-cta"')
        expect(html).not.toContain('data-cta-variant=')
        expect(html).toContain('Continue')
        expect(html.startsWith('<a ')).toBe(true)
    })

    it('enforces 56px height, ≥44px touch target, and tactile lip 4px', () => {
        const html = renderToStaticMarkup(<PrimaryCta>Go</PrimaryCta>)
        expect(html).toContain('h-[56px]')
        expect(html).toContain('min-h-[var(--fuxie-tap-min)]')
        expect(html).toContain('min-w-[var(--fuxie-tap-min)]')
        expect(html).toContain('border-b-[4px]')
        expect(html).toContain('border-b-[var(--fuxie-lip-action)]')
        expect(html).toContain('active:border-b-[2px]')
        expect(html).toContain('active:translate-y-[2px]')
    })

    it('exposes focus-visible outline and no transition-all', () => {
        const html = renderToStaticMarkup(<PrimaryCta>Go</PrimaryCta>)
        expect(html).toContain('focus-visible:outline')
        expect(html).toContain('focus-visible:outline-[var(--fuxie-blue-700)]')
        expect(html).not.toContain('transition-all')
        expect(html).toContain('transition-[transform,background-color,border-color,opacity,box-shadow]')
    })

    it('honors reduced-motion by disabling decorative transform transitions', () => {
        const html = renderToStaticMarkup(<PrimaryCta>Go</PrimaryCta>)
        expect(html).toContain('motion-reduce:transition-none')
        expect(html).toContain('motion-reduce:active:translate-y-0')
    })

    it('defaults type to button to avoid accidental form submit', () => {
        const html = renderToStaticMarkup(<PrimaryCta>Go</PrimaryCta>)
        expect(html).toContain('type="button"')
    })

    it('asChild disabled anchor markup blocks navigation and primary role', () => {
        const html = renderToStaticMarkup(
            <PrimaryCta asChild disabled>
                <a href="/x">X</a>
            </PrimaryCta>,
        )
        expect(html).toContain('aria-disabled="true"')
        expect(html).toContain('tabindex="-1"')
        expect(html).not.toContain('href=')
        expect(html).toContain('pointer-events-none')
        expect(html).toContain('cursor-not-allowed')
        expect(html).not.toContain('data-role="primary-cta"')
        // Never put boolean disabled on anchors
        expect(html).not.toMatch(/<a[^>]*\sdisabled(\s|>)/)
    })
})

describe('PrimaryCta asChild interaction', () => {
    let root: Root | null = null
    let container: HTMLElement
    let dom: JSDOM | null = null

    beforeEach(() => {
        dom = installDom()
        container = document.createElement('div')
        document.body.appendChild(container)
        root = createRoot(container)
    })

    afterEach(() => {
        act(() => {
            root?.unmount()
        })
        root = null
        dom?.window.close()
        dom = null
    })

    it('disabled asChild click does not fire handlers and is preventDefaulted', () => {
        const childClick = vi.fn()
        const wrapperClick = vi.fn()
        act(() => {
            root!.render(
                <PrimaryCta asChild disabled onClick={wrapperClick}>
                    <a href="/blocked" onClick={childClick}>
                        Blocked
                    </a>
                </PrimaryCta>,
            )
        })

        const anchor = container.querySelector('a') as HTMLAnchorElement
        expect(anchor).toBeTruthy()
        expect(anchor.getAttribute('href')).toBeNull()
        expect(anchor.getAttribute('aria-disabled')).toBe('true')
        expect(anchor.tabIndex).toBe(-1)

        const event = new dom!.window.MouseEvent('click', {
            bubbles: true,
            cancelable: true,
        })
        act(() => {
            anchor.dispatchEvent(event)
        })

        expect(event.defaultPrevented).toBe(true)
        expect(childClick).not.toHaveBeenCalled()
        expect(wrapperClick).not.toHaveBeenCalled()
    })

    it('enabled asChild keeps href, tab order, and runs click handlers', () => {
        const childClick = vi.fn()
        const wrapperClick = vi.fn()
        act(() => {
            root!.render(
                <PrimaryCta asChild onClick={wrapperClick}>
                    <a href="/learn/next" onClick={childClick} className="child-link">
                        Continue
                    </a>
                </PrimaryCta>,
            )
        })

        const anchor = container.querySelector('a') as HTMLAnchorElement
        expect(anchor.getAttribute('href')).toBe('/learn/next')
        expect(anchor.tabIndex).not.toBe(-1)
        expect(anchor.getAttribute('data-role')).toBe('primary-cta')
        expect(anchor.className).toContain('child-link')

        act(() => {
            anchor.click()
        })
        expect(childClick).toHaveBeenCalledTimes(1)
        expect(wrapperClick).toHaveBeenCalledTimes(1)
    })
})
