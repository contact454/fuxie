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
})
