import { describe, it, expect } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import * as React from 'react'
import { BottomNav } from './BottomNav'

describe('BottomNav Primitive Component', () => {
    it('renders tabs and highlights the active one', () => {
        const html = renderToStaticMarkup(
            <BottomNav activeTab="world" onChange={() => {}} />,
        )
        expect(html).toContain('Thế giới')
        expect(html).toContain('Ôn tập')
        expect(html).toContain('Hồ sơ')
        expect(html).toContain('safe-area-inset-bottom')
        expect(html).toContain('min-h-[var(--fuxie-tap-min)]')
        expect(html).toContain('scale-105')
    })
})
