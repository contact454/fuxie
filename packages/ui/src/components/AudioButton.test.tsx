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
        expect(idleHtml).toContain('min-h-[var(--fuxie-tap-min)]')

        const playingHtml = renderToStaticMarkup(
            <AudioButton state="playing" ariaLabel="Play audio" />,
        )
        expect(playingHtml).toContain('aria-pressed="true"')
        expect(playingHtml).toContain('audio-pulse')

        const recordingHtml = renderToStaticMarkup(
            <AudioButton state="recording" ariaLabel="Record audio" />,
        )
        expect(recordingHtml).toContain('aria-pressed="true"')
        expect(recordingHtml).toContain('border-red-500')
    })
})
