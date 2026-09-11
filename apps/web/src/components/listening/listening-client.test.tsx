import { describe, expect, it, vi, beforeEach } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { NextIntlClientProvider } from 'next-intl'
import * as React from 'react'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { JSDOM } from 'jsdom'

const switchLevelMock = vi.fn()
const clearErrorMock = vi.fn()
const levelSwitcherState = vi.hoisted(() => ({
    currentLevel: 'A1',
    isLevelLoading: false,
    failedLevel: null as string | null,
    error: null as string | null,
}))

vi.mock('next/navigation', () => ({
    useRouter: () => ({ prefetch: vi.fn() }),
}))

vi.mock('next/image', () => ({
    default: (props: Record<string, unknown>) => {
        const { alt, src, ...rest } = props
        // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
        return <img alt={String(alt ?? '')} src={String(src ?? '')} {...rest} />
    },
}))

vi.mock('@/hooks/use-level-switcher', () => ({
    useLevelSwitcher: () => ({
        currentLevel: levelSwitcherState.currentLevel,
        isLevelLoading: levelSwitcherState.isLevelLoading,
        switchLevel: switchLevelMock,
        failedLevel: levelSwitcherState.failedLevel,
        error: levelSwitcherState.error,
        clearError: clearErrorMock,
    }),
}))

vi.mock('@/components/performance/measured-link', () => ({
    MeasuredLink: ({
        children,
        href,
        onClick,
        ...rest
    }: {
        children: React.ReactNode
        href: string
        onClick?: (e: React.MouseEvent) => void
    }) => (
        <a href={href} onClick={onClick} {...rest}>
            {children}
        </a>
    ),
}))

vi.mock('@/components/gamification/quest-visuals', () => ({
    FUXIE_3D_ASSETS: { radioHost: '/x.png' },
    FuxieRoleMascot: () => <div data-role="mascot" />,
}))

vi.mock('@/components/ui/mascot', () => ({
    Mascot: () => <div data-role="mascot-loading" />,
}))

vi.mock('@fuxie/ui/components', () => ({
    FrostedPanel: ({ children, className }: { children: React.ReactNode; className?: string }) => (
        <div className={className}>{children}</div>
    ),
    PrimaryCta: ({
        children,
        asChild,
    }: {
        children: React.ReactNode
        asChild?: boolean
    }) =>
        asChild ? (
            <div data-role="primary-cta-aschild">{children}</div>
        ) : (
            <button type="button" data-role="primary-cta">
                {children}
            </button>
        ),
}))

import { ListeningClient } from './listening-client'
import { ListeningClientLoading } from './ListeningClientDynamic'

const messages = {
    Gamification: {
        practiceSkill: 'Practice {skill} {level}',
        continueLearningAction: 'Continue',
        percentCompleted: '{percent}% done',
        listeningEmpty: 'Empty',
        listeningEmptyDesc: 'Desc',
        backToCourse: 'Course',
        part: 'Part {part}',
        lessonsCompletedListening: '{total} lessons • {completed} done',
        startAction: 'Start',
        unlockNext: '{count} more',
        questionsCount: '{count} questions',
    },
    UI: {
        altListeningCoach: 'Coach',
    },
    Listening: {
        skillName: 'listening',
        hubProgress: '{completed} / {total} done',
        levelLoadError: 'Failed {level}',
        retryLevel: 'Retry {level}',
        levelLoading: 'Loading…',
    },
}

const sampleTeile = [
    {
        teil: 1,
        teilName: 'Teil 1',
        lessons: [
            {
                id: '1',
                lessonId: 'L-1',
                title: 'T1',
                topic: 'Done topic',
                taskType: 'mc',
                audioDuration: 30,
                questionCount: 3,
                completion: { bestScore: 2, totalQuestions: 3, attempts: 1 },
            },
            {
                id: '2',
                lessonId: 'L-2',
                title: 'T2',
                topic: 'Current topic',
                taskType: 'mc',
                audioDuration: 40,
                questionCount: 3,
                completion: null,
            },
            {
                id: '3',
                lessonId: 'L-3',
                title: 'T3',
                topic: 'Locked topic',
                taskType: 'mc',
                audioDuration: 50,
                questionCount: 3,
                completion: null,
            },
        ],
    },
]

function renderHub(
    overrides: Partial<React.ComponentProps<typeof ListeningClient>> = {},
) {
    return renderToStaticMarkup(
        <NextIntlClientProvider locale="en" messages={messages}>
            <ListeningClient
                teile={sampleTeile}
                totalLessons={3}
                totalCompleted={1}
                availableLevels={['A1', 'A2']}
                initialLevel="A1"
                {...overrides}
            />
        </NextIntlClientProvider>,
    )
}

describe('ListeningClient hub', () => {
    beforeEach(() => {
        switchLevelMock.mockReset()
        clearErrorMock.mockReset()
        levelSwitcherState.currentLevel = 'A1'
        levelSwitcherState.isLevelLoading = false
        levelSwitcherState.failedLevel = null
        levelSwitcherState.error = null
    })

    it('renders 0% progress without coercing to 1%', () => {
        const html = renderHub({
            teile: [
                {
                    teil: 1,
                    teilName: 'Teil 1',
                    lessons: [
                        {
                            id: '1',
                            lessonId: 'L-1',
                            title: 'T',
                            topic: 'Topic',
                            taskType: 'mc',
                            audioDuration: 30,
                            questionCount: 3,
                            completion: null,
                        },
                    ],
                },
            ],
            totalLessons: 1,
            totalCompleted: 0,
        })
        expect(html).toContain('data-progress="0"')
        expect(html).toContain('width:0%')
        expect(html).not.toContain('width:1%')
        expect(html).toContain('0% done')
    })

    it('shows completion score when API completion is present', () => {
        const html = renderHub()
        expect(html).toContain('2/3')
        expect(html).toContain('Done topic')
        expect(html).toContain('data-lesson-state="done"')
    })

    it('empty state uses PrimaryCta asChild + MeasuredLink', () => {
        const html = renderHub({ teile: [], totalLessons: 0, totalCompleted: 0 })
        expect(html).toContain('Empty')
        expect(html).toContain('data-role="primary-cta-aschild"')
        expect(html).toContain('data-role="listening-empty-cta"')
        expect(html).toContain('href="/course"')
        expect(html).toContain('Course')
    })

    it('level buttons expose type, aria-pressed, ≥44px and focus-visible', () => {
        const html = renderHub()
        expect(html).toContain('type="button"')
        expect(html).toContain('aria-pressed="true"')
        expect(html).toContain('min-h-[44px]')
        expect(html).toContain('min-w-[44px]')
        expect(html).toContain('focus-visible:outline')
        expect(html).toContain('focus-visible:outline-[var(--fuxie-blue-700)]')
    })

    it('accordion button/panel relationship is stable and labelled', () => {
        const html = renderHub()
        expect(html).toContain('id="listening-teil-1-trigger"')
        expect(html).toContain('aria-controls="listening-teil-1-panel"')
        expect(html).toContain('aria-expanded="true"')
        expect(html).toContain('id="listening-teil-1-panel"')
        expect(html).toContain('role="region"')
        expect(html).toContain('aria-labelledby="listening-teil-1-trigger"')
        expect(html).toContain('motion-reduce:animate-none')
    })

    it('marks current, open and locked lesson semantics', () => {
        const html = renderHub()
        expect(html).toContain('data-lesson-state="done"')
        expect(html).toContain('data-lesson-state="current"')
        expect(html).toContain('data-lesson-state="locked"')
        expect(html).toContain('href="/listening/L-2"')
        // Locked cards keep non-navigable href="#" (attribute order may vary)
        expect(html).toMatch(/href="#"[^>]*data-lesson-state="locked"|data-lesson-state="locked"[^>]*href="#"/)
    })

    it('locked lesson click does not navigate (preventDefault)', () => {
        const dom = new JSDOM('<!doctype html><html><body></body></html>', {
            url: 'http://localhost/',
        })
        Object.defineProperty(globalThis, 'window', { value: dom.window, configurable: true })
        Object.defineProperty(globalThis, 'document', {
            value: dom.window.document,
            configurable: true,
        })
        Object.defineProperty(globalThis, 'HTMLElement', {
            value: dom.window.HTMLElement,
            configurable: true,
        })
        Object.defineProperty(globalThis, 'Node', { value: dom.window.Node, configurable: true })

        const container = document.createElement('div')
        document.body.appendChild(container)
        const root: Root = createRoot(container)

        act(() => {
            root.render(
                <NextIntlClientProvider locale="en" messages={messages}>
                    <ListeningClient
                        teile={sampleTeile}
                        totalLessons={3}
                        totalCompleted={1}
                        availableLevels={['A1']}
                        initialLevel="A1"
                    />
                </NextIntlClientProvider>,
            )
        })

        const locked = container.querySelector(
            '[data-lesson-state="locked"]',
        ) as HTMLAnchorElement
        expect(locked).toBeTruthy()
        const event = new dom.window.MouseEvent('click', {
            bubbles: true,
            cancelable: true,
        })
        act(() => {
            locked.dispatchEvent(event)
        })
        expect(event.defaultPrevented).toBe(true)
        expect(locked.getAttribute('aria-disabled')).toBe('true')
        expect(locked.tabIndex).toBe(-1)

        act(() => {
            root.unmount()
        })
        dom.window.close()
    })

    it('error alert shows failed level and Retry calls switchLevel(failedLevel)', () => {
        levelSwitcherState.failedLevel = 'B1'
        levelSwitcherState.error = 'Failed to load level B1'
        levelSwitcherState.currentLevel = 'A1'

        const html = renderHub()
        expect(html).toContain('role="alert"')
        expect(html).toContain('Failed B1')
        expect(html).toContain('Retry B1')

        const dom = new JSDOM('<!doctype html><html><body></body></html>', {
            url: 'http://localhost/',
        })
        Object.defineProperty(globalThis, 'window', { value: dom.window, configurable: true })
        Object.defineProperty(globalThis, 'document', {
            value: dom.window.document,
            configurable: true,
        })
        Object.defineProperty(globalThis, 'HTMLElement', {
            value: dom.window.HTMLElement,
            configurable: true,
        })
        Object.defineProperty(globalThis, 'Node', { value: dom.window.Node, configurable: true })
        const container = document.createElement('div')
        document.body.appendChild(container)
        const root = createRoot(container)
        act(() => {
            root.render(
                <NextIntlClientProvider locale="en" messages={messages}>
                    <ListeningClient
                        teile={sampleTeile}
                        totalLessons={3}
                        totalCompleted={1}
                        availableLevels={['A1', 'B1']}
                        initialLevel="A1"
                    />
                </NextIntlClientProvider>,
            )
        })
        const retry = Array.from(container.querySelectorAll('button')).find((b) =>
            b.textContent?.includes('Retry B1'),
        ) as HTMLButtonElement
        expect(retry).toBeTruthy()
        act(() => {
            retry.click()
        })
        expect(switchLevelMock).toHaveBeenCalledWith('B1')
        act(() => {
            root.unmount()
        })
        dom.window.close()
    })

    it('rollback UI keeps prior level/data while error is shown', () => {
        levelSwitcherState.failedLevel = 'B2'
        levelSwitcherState.error = 'Failed B2'
        levelSwitcherState.currentLevel = 'A1'
        const html = renderHub()
        // Still on A1 data set after failed B2 switch
        expect(html).toContain('Practice listening A1')
        expect(html).toContain('Done topic')
        expect(html).toContain('Failed B2')
        expect(html).toContain('1 / 3 done')
    })

    it('avoids transition-all and includes reduced-motion markers', () => {
        const html = renderHub()
        expect(html).not.toContain('transition-all')
        expect(html).toContain('motion-reduce:transition-none')
        expect(html).toContain('motion-reduce:animate-none')
        expect(html).toContain('motion-reduce:hover:translate-x-0')
        expect(html).toContain('aria-hidden="true"')
        expect(html).toContain('focusable="false"')
    })
})

describe('ListeningClientLoading', () => {
    it('exposes aria-busy/live and motion-reduce on pulse skeletons', () => {
        const html = renderToStaticMarkup(<ListeningClientLoading />)
        expect(html).toContain('aria-busy="true"')
        expect(html).toContain('aria-live="polite"')
        expect(html).toContain('animate-pulse')
        expect(html).toContain('motion-reduce:animate-none')
        expect(html).toContain('data-role="listening-client-loading"')
    })
})
