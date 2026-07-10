import { describe, it, expect } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import * as React from 'react'
import { RewardBurst } from './RewardBurst'

describe('RewardBurst Primitive Component', () => {
    it('renders with data-reward-state="earned" and amber particles', () => {
        const html = renderToStaticMarkup(
            <RewardBurst active>
                <span>Chest</span>
            </RewardBurst>,
        )
        expect(html).toContain('data-reward-state="earned"')
        expect(html).toContain('Chest')
        expect(html).toContain('var(--fuxie-reward)')
        expect(html).toContain('reward-particle')
        expect(html).toContain('@media (prefers-reduced-motion: reduce)')
    })
})
