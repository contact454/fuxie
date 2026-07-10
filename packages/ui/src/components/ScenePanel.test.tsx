import { describe, it, expect } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import * as React from 'react'
import { ScenePanel } from './ScenePanel'

describe('ScenePanel Primitive Component', () => {
    it('renders with fuxie-blue-100 background and card shadow', () => {
        const html = renderToStaticMarkup(<ScenePanel>Intro text</ScenePanel>)
        expect(html).toContain('bg-[var(--fuxie-blue-100)]')
        expect(html).toContain('shadow-[var(--fuxie-shadow-card)]')
        expect(html).toContain('Intro text')
    })
})
