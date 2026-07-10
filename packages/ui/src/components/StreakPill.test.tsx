import { describe, it, expect } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import * as React from 'react'
import { StreakPill } from './StreakPill'

describe('StreakPill Primitive Component', () => {
    it('renders streak count with reward context', () => {
        const html = renderToStaticMarkup(<StreakPill count={5} />)
        expect(html).toContain('data-reward-context="true"')
        expect(html).toContain('5')
        expect(html).toContain('var(--fuxie-reward)')
    })
})
