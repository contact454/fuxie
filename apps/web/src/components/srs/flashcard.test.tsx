import type { ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { renderToStaticMarkup } from 'react-dom/server'
import { JSDOM } from 'jsdom'
import { NextIntlClientProvider } from 'next-intl'

import { Flashcard } from './flashcard'

// next/image needs a light stub under node/jsdom
vi.mock('next/image', () => ({
    default: (props: Record<string, unknown>) => {
        const { alt, src, ...rest } = props
        // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
        return <img alt={String(alt ?? '')} src={String(src ?? '')} {...rest} />
    },
}))

const messages = {
    SRS: {
        listenLabel: 'Nghe', // locale-allow — test fixture
        tapToFlip: 'Chạm để lật thẻ', // locale-allow — test fixture
        flipCard: 'Lật thẻ', // locale-allow — test fixture
        conjugation: 'Konjugation', // locale-allow — test fixture
        examples: 'Ví dụ', // locale-allow — test fixture
    },
}

const vocab = {
    word: 'Apfel',
    article: 'MASKULIN',
    plural: 'Äpfel',
    wordType: 'NOMEN',
    translations: { vi: 'quả táo', de: 'Apfel' },
    exampleSentence1: null,
    exampleTranslation1: null,
    exampleSentence2: null,
    exampleTranslation2: null,
    notes: null,
    conjugation: null,
    audioUrl: null,
    imageUrl: null,
}

function wrap(node: ReactNode) {
    return (
        <NextIntlClientProvider locale="vi" messages={messages}>
            {node}
        </NextIntlClientProvider>
    )
}

function installDom() {
    const dom = new JSDOM('<!doctype html><html><body></body></html>', {
        url: 'http://localhost/',
    })
    const { window } = dom
    Object.defineProperty(globalThis, 'window', { value: window, configurable: true })
    Object.defineProperty(globalThis, 'document', { value: window.document, configurable: true })
    Object.defineProperty(globalThis, 'HTMLElement', { value: window.HTMLElement, configurable: true })
    Object.defineProperty(globalThis, 'Node', { value: window.Node, configurable: true })
    return dom
}

function faceMarkupFlags(html: string, face: 'front' | 'back') {
    // Extract the opening tag for data-face="<face>" ... >
    const re = new RegExp(`data-face="${face}"([\\s\\S]*?)>`, 'i')
    const m = html.match(re)
    const attrs = m?.[1] ?? ''
    return {
        attrs,
        hasInert: /\binert\b/.test(attrs),
        hasAriaHidden: /aria-hidden="true"/.test(attrs) || /\baria-hidden\b/.test(attrs),
        active: /data-face-active="true"/.test(attrs),
    }
}

describe('Flashcard accessibility', () => {
    it('exposes a semantic flip button with focus-visible styles and ≥44px target', () => {
        const html = renderToStaticMarkup(
            wrap(<Flashcard vocabulary={vocab} isFlipped={false} onFlip={() => {}} />),
        )
        expect(html).toMatch(/data-role="flashcard-flip"/)
        expect(html).toMatch(/type="button"/)
        expect(html).toMatch(/min-h-\[44px\]/)
        expect(html).toMatch(/min-w-\[44px\]/)
        expect(html).toMatch(/focus-visible:outline/)
        expect(html).toContain(`aria-label="${messages.SRS.flipCard}"`)
        // Audio is a sibling interactive region, not nesting the flip button
        expect(html).toMatch(/data-role="flashcard-audio"/)
    })

    it('keeps reduced-motion transition utilities on the 3D stage', () => {
        const html = renderToStaticMarkup(
            wrap(<Flashcard vocabulary={vocab} isFlipped={false} onFlip={() => {}} />),
        )
        expect(html).toMatch(/motion-reduce:transition-none/)
        expect(html).toMatch(/data-flipped="false"/)
    })

    it('front active: front not inert; back inert + aria-hidden', () => {
        const html = renderToStaticMarkup(
            wrap(<Flashcard vocabulary={vocab} isFlipped={false} onFlip={() => {}} />),
        )
        const front = faceMarkupFlags(html, 'front')
        const back = faceMarkupFlags(html, 'back')
        expect(front.active).toBe(true)
        expect(front.hasInert).toBe(false)
        expect(front.hasAriaHidden).toBe(false)
        expect(back.active).toBe(false)
        expect(back.hasInert).toBe(true)
        expect(back.hasAriaHidden).toBe(true)
    })

    it('back active: back not inert; front inert + aria-hidden', () => {
        const html = renderToStaticMarkup(
            wrap(<Flashcard vocabulary={vocab} isFlipped={true} onFlip={() => {}} />),
        )
        const front = faceMarkupFlags(html, 'front')
        const back = faceMarkupFlags(html, 'back')
        expect(back.active).toBe(true)
        expect(back.hasInert).toBe(false)
        expect(back.hasAriaHidden).toBe(false)
        expect(front.active).toBe(false)
        expect(front.hasInert).toBe(true)
        expect(front.hasAriaHidden).toBe(true)
    })
})

describe('Flashcard flip interactions', () => {
    let root: Root | null = null
    let container: HTMLElement
    let dom: JSDOM | null = null

    beforeEach(() => {
        dom = installDom()
        container = document.createElement('div')
        document.body.appendChild(container)
        root = createRoot(container)
    })

    afterEach(() => {
        act(() => {
            root?.unmount()
        })
        root = null
        dom?.window.close()
        dom = null
    })

    it('flips exactly once when the active face flip button is clicked', () => {
        const onFlip = vi.fn()
        act(() => {
            root!.render(wrap(<Flashcard vocabulary={vocab} isFlipped={false} onFlip={onFlip} />))
        })
        const activeFace = container.querySelector('[data-face="front"][data-face-active="true"]')
        const btn = activeFace?.querySelector('[data-role="flashcard-flip"]') as HTMLButtonElement
        expect(btn).toBeTruthy()
        act(() => {
            btn.click()
        })
        expect(onFlip).toHaveBeenCalledTimes(1)
    })

    it('does not flip when activating the audio control zone on the active face', () => {
        const onFlip = vi.fn()
        act(() => {
            root!.render(wrap(<Flashcard vocabulary={vocab} isFlipped={false} onFlip={onFlip} />))
        })
        const activeFace = container.querySelector('[data-face="front"][data-face-active="true"]')
        const audioZone = activeFace?.querySelector('[data-role="flashcard-audio"]') as HTMLElement
        expect(audioZone).toBeTruthy()
        act(() => {
            audioZone.dispatchEvent(
                new dom!.window.MouseEvent('click', { bubbles: true, cancelable: true }),
            )
        })
        expect(onFlip).not.toHaveBeenCalled()
    })

    it('only active-face flip controls sit outside inert subtrees (tab-order contract)', () => {
        const onFlip = vi.fn()
        act(() => {
            root!.render(wrap(<Flashcard vocabulary={vocab} isFlipped={false} onFlip={onFlip} />))
        })
        const front = container.querySelector('[data-face="front"]') as HTMLElement
        const back = container.querySelector('[data-face="back"]') as HTMLElement
        expect(front.getAttribute('data-face-active')).toBe('true')
        expect(back.getAttribute('data-face-active')).toBe('false')
        expect(front.hasAttribute('inert')).toBe(false)
        expect(back.hasAttribute('inert')).toBe(true)
        expect(back.getAttribute('aria-hidden')).toBe('true')
        expect(front.getAttribute('aria-hidden')).toBeNull()

        const flips = Array.from(
            container.querySelectorAll<HTMLButtonElement>('[data-role="flashcard-flip"]'),
        )
        expect(flips).toHaveLength(2)
        const inActiveFace = flips.filter((btn) => btn.closest('[data-face-active="true"]'))
        const inInactiveFace = flips.filter((btn) => btn.closest('[data-face-active="false"]'))
        expect(inActiveFace).toHaveLength(1)
        expect(inInactiveFace).toHaveLength(1)
        // Only the active face's control is outside an inert subtree — browsers
        // exclude inert descendants from sequential focus navigation.
        expect(inActiveFace[0]!.closest('[inert]')).toBeNull()
        expect(inInactiveFace[0]!.closest('[inert]')).toBe(back)
    })
})
