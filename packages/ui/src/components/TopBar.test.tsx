import { describe, it, expect } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import * as React from 'react'
import { TopBar } from './TopBar'

describe('TopBar Primitive Component', () => {
    it('renders avatar, streak, and gem count', () => {
        const html = renderToStaticMarkup(
            <TopBar username="Hans" streakCount={3} gemCount={120} />,
        )
        expect(html).toContain('Hans')
        expect(html).toContain('3')
        expect(html).toContain('120')
        expect(html).toContain('safe-area-inset-top')
        expect(html).toContain('src="/fig/ui-icons/icon-coin.png"')
        expect(html).toContain('src="/fig/ui-icons/icon-gem.png"')
        expect(html).toContain('src="/fig/ui-icons/icon-streak-flame.png"')
    })

    it('preserves caller non-padding styles while locking safe-area paddingTop', () => {
        const html = renderToStaticMarkup(
            <TopBar
                username="Hans"
                streakCount={1}
                gemCount={2}
                style={{ color: 'rgb(1, 2, 3)', zIndex: 7, paddingTop: '99px' }}
            />,
        )

        expect(html).toMatch(/color:\s*rgb\(1,\s*2,\s*3\)/)
        expect(html).toMatch(/z-index:\s*7/)
        expect(html).toContain('safe-area-inset-top')
        expect(html).not.toContain('99px')
        expect(html).toMatch(/padding-top:\s*env\(safe-area-inset-top/)
    })
})
