import { describe, it, expect } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import * as React from 'react'
import { ProgressRing } from './ProgressRing'

describe('ProgressRing Primitive Component', () => {
    it('renders SVG with correct progress offset', () => {
        const html = renderToStaticMarkup(
            <ProgressRing value={50} size={40} strokeWidth={4} />,
        )
        expect(html).toContain('width="40"')
        expect(html).toContain('stroke="var(--fuxie-success)"')
        expect(html).toContain('progress-ring-circle')
        expect(html).toContain('stroke-dashoffset')
    })
})
