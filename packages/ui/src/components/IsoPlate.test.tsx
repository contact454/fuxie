import { describe, it, expect } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import * as React from 'react'
import { IsoPlate } from './IsoPlate'

describe('IsoPlate Primitive Component', () => {
    it('renders with shadow-iso and images src/alt tags', () => {
        const html = renderToStaticMarkup(<IsoPlate src="/test.png" alt="Test Asset" />)
        expect(html).toContain('shadow-[var(--fuxie-shadow-iso)]')
        expect(html).toContain('src="/test.png"')
        expect(html).toContain('alt="Test Asset"')
    })
})
