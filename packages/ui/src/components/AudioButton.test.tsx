import { describe, it, expect } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import * as React from 'react'
import { AudioButton } from './AudioButton'

describe('AudioButton Primitive Component', () => {
    it('renders different audio states and labels', () => {
        const idleHtml = renderToStaticMarkup(
            <AudioButton state="idle" ariaLabel="Play audio" />,
        )
        expect(idleHtml).toContain('aria-label="Play audio"')
        expect(idleHtml).toContain('aria-pressed="false"')
        expect(idleHtml).toContain('min-h-[48px]')

        const playingHtml = renderToStaticMarkup(
            <AudioButton state="playing" ariaLabel="Play audio" />,
        )
        expect(playingHtml).toContain('aria-pressed="true"')
        expect(playingHtml).toContain('audio-pulse')
        expect(playingHtml).toContain('data-audio-state="playing"')

        const recordingHtml = renderToStaticMarkup(
            <AudioButton state="recording" ariaLabel="Record audio" />,
        )
        expect(recordingHtml).toContain('aria-pressed="true"')
        expect(recordingHtml).toContain('border-red-500')
        expect(recordingHtml).toContain('data-audio-state="recording"')
    })

    it('enforces touch targets: sm≥44, md≥48, lg=64', () => {
        const sm = renderToStaticMarkup(
            <AudioButton state="idle" ariaLabel="a" size="sm" />,
        )
        expect(sm).toContain('min-w-[44px]')
        expect(sm).toContain('min-h-[44px]')
        expect(sm).toContain('w-11')
        expect(sm).toContain('h-11')

        const md = renderToStaticMarkup(
            <AudioButton state="idle" ariaLabel="a" size="md" />,
        )
        expect(md).toContain('min-w-[48px]')
        expect(md).toContain('min-h-[48px]')
        expect(md).toContain('w-12')
        expect(md).toContain('h-12')

        const lg = renderToStaticMarkup(
            <AudioButton state="idle" ariaLabel="a" size="lg" />,
        )
        expect(lg).toContain('min-w-[64px]')
        expect(lg).toContain('min-h-[64px]')
        expect(lg).toContain('w-16')
        expect(lg).toContain('h-16')
    })

    it('exposes tactile lip, pressed state, and no transition-all', () => {
        const html = renderToStaticMarkup(
            <AudioButton state="idle" ariaLabel="Play" />,
        )
        expect(html).toContain('border-b-[4px]')
        expect(html).toContain('active:border-b-[2px]')
        expect(html).toContain('active:translate-y-[2px]')
        expect(html).not.toContain('transition-all')
        expect(html).toContain('transition-[transform,background-color,border-color,box-shadow,opacity]')
    })

    it('exposes focus-visible outline and ring offset', () => {
        const html = renderToStaticMarkup(
            <AudioButton state="idle" ariaLabel="Play" />,
        )
        expect(html).toContain('focus-visible:outline')
        expect(html).toContain('focus-visible:outline-[var(--fuxie-blue-700)]')
        expect(html).toContain('focus-visible:ring-2')
        expect(html).toContain('focus-visible:ring-offset-2')
    })

    it('disables pulse animation under prefers-reduced-motion', () => {
        const html = renderToStaticMarkup(
            <AudioButton state="playing" ariaLabel="Play" />,
        )
        expect(html).toContain('@media (prefers-reduced-motion: reduce)')
        expect(html).toContain('animation: none !important')
        expect(html).toContain('transform: none !important')
        expect(html).toContain('motion-reduce:transition-none')
        expect(html).toContain('motion-reduce:active:translate-y-0')
    })

    it('disabled contract blocks interaction and keeps aria semantics', () => {
        const html = renderToStaticMarkup(
            <AudioButton state="idle" ariaLabel="Play" disabled />,
        )
        expect(html).toContain('disabled')
        expect(html).toContain('aria-disabled="true"')
        expect(html).toContain('disabled:pointer-events-none')
        expect(html).toContain('aria-label="Play"')
        expect(html).toContain('type="button"')
    })
})
