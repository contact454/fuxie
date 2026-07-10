import { describe, it, expect } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import * as React from 'react'
import { WorldNode } from './WorldNode'

describe('WorldNode Primitive Component', () => {
    it('renders different states with correct data attributes', () => {
        const lockedHtml = renderToStaticMarkup(
            <WorldNode state="locked" title="Lesson 1" nodeNumber={1} />,
        )
        expect(lockedHtml).toContain('data-node-state="locked"')
        expect(lockedHtml).toContain('disabled')
        expect(lockedHtml).not.toContain('var(--fuxie-reward)')

        const openHtml = renderToStaticMarkup(
            <WorldNode state="open" title="Lesson 1" nodeNumber={1} />,
        )
        expect(openHtml).toContain('data-node-state="open"')
        expect(openHtml.includes('disabled=""') || openHtml.includes(' disabled ')).toBe(false)

        const masteredHtml = renderToStaticMarkup(
            <WorldNode state="mastered" title="Lesson 1" nodeNumber={1} />,
        )
        expect(masteredHtml).toContain('data-node-state="mastered"')
        expect(masteredHtml).toContain('data-reward-context="true"')
        expect(masteredHtml).toContain('fill="var(--fuxie-reward)"')
    })

    it('sets data-role="primary-cta" only when state=open and isPrimaryCta=true', () => {
        const primaryHtml = renderToStaticMarkup(
            <WorldNode state="open" title="Lesson 1" nodeNumber={1} isPrimaryCta />,
        )
        expect(primaryHtml).toContain('data-role="primary-cta"')

        const nonPrimaryHtml = renderToStaticMarkup(
            <WorldNode state="open" title="Lesson 1" nodeNumber={1} isPrimaryCta={false} />,
        )
        expect(nonPrimaryHtml).not.toContain('data-role="primary-cta"')

        const lockedPrimaryHtml = renderToStaticMarkup(
            <WorldNode state="locked" title="Lesson 1" nodeNumber={1} isPrimaryCta />,
        )
        expect(lockedPrimaryHtml).not.toContain('data-role="primary-cta"')
    })

    it('strips primary data-role when open + isPrimaryCta + disabled', () => {
        const html = renderToStaticMarkup(
            <WorldNode state="open" title="Lesson 1" nodeNumber={1} isPrimaryCta disabled />,
        )
        expect(html).toContain('data-node-state="open"')
        expect(html).toContain('disabled')
        expect(html).not.toContain('data-role="primary-cta"')
    })
})
