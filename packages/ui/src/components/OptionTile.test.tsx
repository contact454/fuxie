import { describe, it, expect } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import * as React from 'react'
import { OptionTile } from './OptionTile'

describe('OptionTile Primitive Component', () => {
    it('renders text and different status classes', () => {
        const idleHtml = renderToStaticMarkup(<OptionTile text="Option A" />)
        expect(idleHtml).toContain('Option A')
        expect(idleHtml).toContain('border-[#e5e5e5]')

        const correctHtml = renderToStaticMarkup(<OptionTile text="Option A" status="correct" />)
        expect(correctHtml).toContain('border-[#a5e27a]')

        const incorrectHtml = renderToStaticMarkup(
            <OptionTile text="Option A" status="incorrect" />,
        )
        expect(incorrectHtml).toContain('shadow-[0_4px_0_0_#ea2b2b]')
        expect(incorrectHtml).toContain('OptionTileShake')
    })

    it('keeps 56px height and ≥44px touch target', () => {
        const html = renderToStaticMarkup(<OptionTile text="A" />)
        expect(html).toContain('h-[56px]')
        expect(html).toContain('min-h-[var(--fuxie-tap-min)]')
    })

    it('idle/selected expose tactile lip 4px and pressed 2px shadow', () => {
        const idle = renderToStaticMarkup(<OptionTile text="A" status="idle" />)
        expect(idle).toContain('shadow-[0_4px_0_0_#ccc]')
        expect(idle).toContain('active:shadow-[0_2px_0_0_#ccc]')
        expect(idle).toContain('active:translate-y-[2px]')

        const selected = renderToStaticMarkup(<OptionTile text="A" status="selected" />)
        expect(selected).toContain('shadow-[0_4px_0_0_#1899d6]')
        expect(selected).toContain('active:shadow-[0_2px_0_0_#1899d6]')
        expect(selected).toContain('data-status="selected"')
    })

    it('exposes focus-visible indicator and no transition-all', () => {
        const html = renderToStaticMarkup(<OptionTile text="A" />)
        expect(html).toContain('focus-visible:outline')
        expect(html).toContain('focus-visible:outline-[var(--fuxie-blue-700)]')
        expect(html).not.toContain('transition-all')
        expect(html).toContain('transition-[transform,background-color,border-color,box-shadow,opacity]')
    })

    it('disables incorrect shake under prefers-reduced-motion', () => {
        const html = renderToStaticMarkup(<OptionTile text="A" status="incorrect" />)
        expect(html).toContain('@media (prefers-reduced-motion: reduce)')
        expect(html).toContain('animation: none !important')
        expect(html).toContain('transform: none !important')
        expect(html).toContain('motion-reduce:transition-none')
    })

    it('disabled options are not clickable and expose disabled contract', () => {
        const html = renderToStaticMarkup(<OptionTile text="A" disabled />)
        expect(html).toContain('disabled')
        expect(html).toContain('aria-disabled="true"')
        expect(html).toContain('disabled:pointer-events-none')
        expect(html).toContain('disabled:cursor-not-allowed')
    })
})
