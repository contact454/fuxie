import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { JSDOM } from 'jsdom'
import { renderToStaticMarkup } from 'react-dom/server'

/**
 * Asset-probe lifecycle + hideDefaultPrimaryCta wiring for ListeningSkillShell.
 *
 * Validates: probe loadedmetadata/error/retry/unmount, player mount identity
 * stable across retry (no remount), probe a11y attrs, no probe playback.
 */

const playerMountIds: number[] = []
let nextMountId = 0

vi.mock('@/components/listening/LessonPlayerDynamic', () => {
    const React = require('react') as typeof import('react')
    return {
        LessonPlayerDynamic: (props: { lessonId?: string }) => {
            // Stable mount identity across re-renders of the same instance
            const idRef = React.useRef<number | null>(null)
            if (idRef.current === null) {
                idRef.current = ++nextMountId
                playerMountIds.push(idRef.current)
            }
            return (
                <div
                    data-role="lesson-player-dynamic"
                    data-mount-id={idRef.current}
                    data-lesson={props.lessonId ?? ''}
                >
                    player
                </div>
            )
        },
    }
})

vi.mock('@/components/gamification/skill-motivation-layer', () => ({
    SkillMotivationLayer: ({
        children,
    }: {
        children?: React.ReactNode
        [key: string]: unknown
    }) => <div data-role="skill-motivation-layer-stub">{children}</div>,
}))

vi.mock('next/link', () => ({
    default: ({
        children,
        href,
        ...rest
    }: {
        children: React.ReactNode
        href: string
        [key: string]: unknown
    }) => (
        <a href={href} {...rest}>
            {children}
        </a>
    ),
}))

import { ListeningSkillShell } from './listening-skill-shell'

const labels = {
    primaryCtaLabel: 'Tiếp tục', // locale-allow — test fixture
    retryCtaLabel: 'Thử lại', // locale-allow — test fixture
    fallbackMessage: 'Fallback message', // locale-allow — test fixture
}

const playerProps = {
    lessonId: 'L-A1-001',
    title: 'Lesson', // locale-allow — test fixture
    topic: 'Office', // locale-allow — test fixture
    cefrLevel: 'A1',
    teil: 1,
    teilName: 'Teil 1', // locale-allow — test fixture
    taskType: 'MC', // locale-allow — test fixture
    audioUrl: '/audio/listening/test.mp3',
    audioDuration: 60,
    backgroundScene: 'cafe',
    questions: [
        {
            id: 'q1',
            questionNumber: 1,
            questionType: 'multiple_choice',
            questionText: 'Wer ist Herr Land?', // locale-allow — German content
            questionTextNative: 'Ai là ông Land?', // locale-allow — test fixture
            options: ['A', 'B', 'C'],
            correctAnswer: 'a',
            sortOrder: 1,
        },
    ],
    transcript: null,
    maxPlays: 2,
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
    // Minimal Audio mock — capture load/play and event listeners
    class MockAudio extends window.HTMLElement {
        src = ''
        preload = ''
        listeners: Record<string, Set<EventListener>> = {}
        loadCalls = 0
        playCalls = 0

        override addEventListener(type: string, listener: EventListener) {
            if (!this.listeners[type]) this.listeners[type] = new Set()
            this.listeners[type]!.add(listener)
        }

        override removeEventListener(type: string, listener: EventListener) {
            this.listeners[type]?.delete(listener)
        }

        dispatch(type: string) {
            this.listeners[type]?.forEach(fn => fn(new window.Event(type)))
        }

        load() {
            this.loadCalls += 1
        }

        play() {
            this.playCalls += 1
            return Promise.resolve()
        }
    }

    // jsdom does not implement HTMLMediaElement.load — stub without calling native.
    const audioProto = window.HTMLAudioElement?.prototype ?? window.HTMLMediaElement?.prototype
    if (audioProto) {
        audioProto.load = function patchedLoad(this: HTMLAudioElement) {
            const next = ((this as unknown as { __loadCalls?: number }).__loadCalls ?? 0) + 1
            ;(this as unknown as { __loadCalls?: number }).__loadCalls = next
        }
        audioProto.play = function patchedPlay(this: HTMLAudioElement) {
            const next = ((this as unknown as { __playCalls?: number }).__playCalls ?? 0) + 1
            ;(this as unknown as { __playCalls?: number }).__playCalls = next
            return Promise.resolve()
        }
    }

    void MockAudio
    return dom
}

describe('ListeningSkillShell — static probe contract', () => {
    it('renders hidden probe with aria-hidden + tabIndex=-1 and stable player (no remount key)', () => {
        const html = renderToStaticMarkup(
            <ListeningSkillShell
                player={{ ...playerProps, isVisualQa: true }}
                labels={labels}
                primaryCtaHref="/listening"
            />,
        )
        expect(html).toContain('data-role="listening-asset-probe"')
        expect(html).toMatch(/aria-hidden="true"/)
        expect(html).toMatch(/tabindex="-1"/i)
        expect(html).toContain('data-role="lesson-player-dynamic"')
        // Outer default CTA hidden while ready (visual QA marks loaded)
        expect(html).not.toContain('data-cta-context="default"')
        expect(html).not.toContain('data-role="skill-player-bottom-cta"')
    })
})

describe('ListeningSkillShell — probe lifecycle (jsdom)', () => {
    let container: HTMLElement
    let root: Root | null
    let dom: JSDOM

    beforeEach(() => {
        dom = installDom()
        container = dom.window.document.createElement('div')
        dom.window.document.body.appendChild(container)
        root = createRoot(container)
        playerMountIds.length = 0
        nextMountId = 0
    })

    afterEach(() => {
        act(() => {
            root?.unmount()
        })
        root = null
        dom.window.close()
    })

    it('flips assetLoaded on loadedmetadata without playing the probe', async () => {
        await act(async () => {
            root!.render(
                <ListeningSkillShell player={playerProps} labels={labels} />,
            )
        })

        const probe = container.querySelector(
            '[data-role="listening-asset-probe"]',
        ) as HTMLAudioElement | null
        expect(probe).toBeTruthy()
        expect(probe?.getAttribute('aria-hidden')).toBe('true')
        expect(probe?.tabIndex).toBe(-1)

        await act(async () => {
            probe!.dispatchEvent(new dom.window.Event('loadedmetadata'))
        })

        const shell = container.querySelector('[data-role="skill-player-shell"]')
        expect(shell?.getAttribute('data-skill-player-phase')).toBe('ready')

        const playCalls =
            (probe as unknown as { __playCalls?: number }).__playCalls ?? 0
        expect(playCalls).toBe(0)
    })

    it('sets error phase on probe error', async () => {
        await act(async () => {
            root!.render(
                <ListeningSkillShell player={playerProps} labels={labels} />,
            )
        })

        const probe = container.querySelector(
            '[data-role="listening-asset-probe"]',
        ) as HTMLAudioElement

        await act(async () => {
            probe.dispatchEvent(new dom.window.Event('error'))
        })

        const shell = container.querySelector('[data-role="skill-player-shell"]')
        expect(shell?.getAttribute('data-skill-player-phase')).toBe('error')
        // Retry CTA present
        expect(container.textContent).toContain('Thử lại')
    })

    it('retry reloads probe without remounting LessonPlayerDynamic', async () => {
        await act(async () => {
            root!.render(
                <ListeningSkillShell player={playerProps} labels={labels} />,
            )
        })

        const playerEl = container.querySelector('[data-role="lesson-player-dynamic"]')
        const mountIdBefore = playerEl?.getAttribute('data-mount-id')
        expect(mountIdBefore).toBeTruthy()
        const mountsBefore = playerMountIds.length

        const probe = container.querySelector(
            '[data-role="listening-asset-probe"]',
        ) as HTMLAudioElement

        await act(async () => {
            probe.dispatchEvent(new dom.window.Event('error'))
        })

        const retryBtn = Array.from(container.querySelectorAll('button')).find(
            b => b.textContent?.includes('Thử lại'),
        )
        expect(retryBtn).toBeTruthy()

        const loadBefore =
            (probe as unknown as { __loadCalls?: number }).__loadCalls ?? 0

        await act(async () => {
            retryBtn!.click()
        })

        // Allow effect to run load()
        await act(async () => {
            await Promise.resolve()
        })

        const playerElAfter = container.querySelector(
            '[data-role="lesson-player-dynamic"]',
        )
        const mountIdAfter = playerElAfter?.getAttribute('data-mount-id')
        expect(mountIdAfter).toBe(mountIdBefore)
        // No additional mount from remount key
        expect(playerMountIds.length).toBe(mountsBefore)

        const loadAfter =
            (probe as unknown as { __loadCalls?: number }).__loadCalls ?? 0
        expect(loadAfter).toBeGreaterThan(loadBefore)
    })

    it('cleans up listeners on unmount (no throw after unmount event)', async () => {
        await act(async () => {
            root!.render(
                <ListeningSkillShell player={playerProps} labels={labels} />,
            )
        })

        const probe = container.querySelector(
            '[data-role="listening-asset-probe"]',
        ) as HTMLAudioElement

        await act(async () => {
            root!.unmount()
        })
        root = null

        // Dispatching after unmount must not update React state (no crash)
        expect(() => {
            probe.dispatchEvent(new dom.window.Event('loadedmetadata'))
            probe.dispatchEvent(new dom.window.Event('error'))
        }).not.toThrow()
    })
})
