import { describe, it, expect } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import * as React from 'react'
import { PrimaryCta } from './PrimaryCta'

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
})
