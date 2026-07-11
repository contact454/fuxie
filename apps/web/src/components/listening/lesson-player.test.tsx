import type { ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { renderToStaticMarkup } from 'react-dom/server'
import { JSDOM } from 'jsdom'
import { NextIntlClientProvider } from 'next-intl'

/** Invoke React onKeyDown from the fiber props bag (no react-dom/test-utils in React 19). */
function invokeReactKeyDown(el: Element, key: string, shiftKey = false) {
    const propKey = Object.keys(el).find(k => k.startsWith('__reactProps$'))
    const props = propKey
        ? (el as unknown as Record<string, { onKeyDown?: (e: unknown) => void }>)[propKey]
        : undefined
    const event = {
        key,
        shiftKey,
        preventDefault() {
            /* no-op */
        },
        currentTarget: el,
        target: el,
    }
    if (!props?.onKeyDown) {
        throw new Error('onKeyDown not found on element React props')
    }
    props.onKeyDown(event)
}

/**
 * Listening LessonPlayer — immersive chrome, audio a11y, question flow.
 */

vi.mock('next/navigation', () => ({
    useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
}))

vi.mock('next/image', () => ({
    default: (props: Record<string, unknown>) => {
        const { alt, src, ...rest } = props
        // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
        return <img alt={String(alt ?? '')} src={String(src ?? '')} {...rest} />
    },
}))

vi.mock('@/components/gamification/fuxie-live-3d', () => ({
    FuxieLive3D: () => <div data-role="fuxie-live-3d-stub" />,
}))

vi.mock('@/components/gamification/completion-flow', () => ({
    CompletionFlow: (props: { title?: string; primaryAction?: { label: string } }) => (
        <div data-role="completion-flow-stub">
            <span>{props.title}</span>
            {props.primaryAction ? (
                <button type="button" data-role="completion-primary">
                    {props.primaryAction.label}
                </button>
            ) : null}
        </div>
    ),
}))

vi.mock('@/lib/analytics/client-events', () => ({
    trackClientAnalyticsEvent: vi.fn(),
}))

vi.mock('@/hooks/use-suppress-chrome', () => ({
    useSuppressLearnerMainChrome: vi.fn(),
}))

vi.mock('@/hooks/use-reduced-motion', () => ({
    useReducedMotion: () => false,
}))

import { LessonPlayer } from './lesson-player'
import { LessonPlayerLoading } from './LessonPlayerDynamic'
import { useSuppressLearnerMainChrome } from '@/hooks/use-suppress-chrome'

const listeningMessages = {
    Listening: {
        listeningEpisode: 'Bài luyện nghe', // locale-allow — test fixture
        altListeningCoach: 'Fuxie', // locale-allow — brand
        speedDuration: 'Tốc độ {speed}x · {time}', // locale-allow — test fixture
        instructions: 'Hướng dẫn', // locale-allow — test fixture
        instructionDetail: 'Nghe tối đa {maxPlays} lần, {questionCount} câu.', // locale-allow — test fixture
        checkpointCoachTitle: 'Nghe theo chặng', // locale-allow — test fixture
        audioLoadError: 'Lỗi tải audio', // locale-allow — test fixture
        audioErrorShort: 'Lỗi audio', // locale-allow — test fixture
        tryAgain: 'Thử lại', // locale-allow — test fixture
        time: 'Thời gian', // locale-allow — test fixture
        plays: 'Lượt nghe', // locale-allow — test fixture
        result: 'Kết quả', // locale-allow — test fixture
        summary: 'Tổng hợp', // locale-allow — test fixture
        res90Title: 'Xuất sắc', // locale-allow — test fixture
        res90CoachTitle: 'Coach 90', // locale-allow — test fixture
        res90CoachMsg: 'Msg 90', // locale-allow — test fixture
        res70Title: 'Rất tốt', // locale-allow — test fixture
        res70CoachTitle: 'Coach 70', // locale-allow — test fixture
        res70CoachMsg: 'Msg 70', // locale-allow — test fixture
        res50Title: 'Khởi đầu', // locale-allow — test fixture
        res50CoachTitle: 'Coach 50', // locale-allow — test fixture
        res50CoachMsg: 'Msg 50', // locale-allow — test fixture
        res0Title: 'Nghe lại', // locale-allow — test fixture
        res0CoachTitle: 'Coach 0', // locale-allow — test fixture
        res0CoachMsg: 'Msg 0', // locale-allow — test fixture
        backToList: 'Về danh sách', // locale-allow — test fixture
        questBriefing: 'Tóm tắt', // locale-allow — test fixture
        part: 'Phần {num} – {name}', // locale-allow — test fixture
        startListening: 'Bắt đầu nghe', // locale-allow — test fixture
        questionProgress: 'Câu {current}/{total}', // locale-allow — test fixture
        listenAgain: 'Nghe lại {count}/{max}', // locale-allow — test fixture
        excellent: 'Xuất sắc!', // locale-allow — test fixture
        veryGood: 'Rất tốt!', // locale-allow — test fixture
        goodEffort: 'Khá tốt', // locale-allow — test fixture
        needReplay: 'Cần nghe lại', // locale-allow — test fixture
        hideTranscript: 'Ẩn bản chép lời', // locale-allow — test fixture
        showTranscript: 'Xem bản chép lời', // locale-allow — test fixture
        yourChoice: 'Bạn chọn:', // locale-allow — test fixture
        correctAnswer: 'Đúng:', // locale-allow — test fixture
        replay: 'Nghe lại', // locale-allow — test fixture
        motivationListening: 'Nghe chính', // locale-allow — test fixture
        motivationReplay: 'Nghe lại', // locale-allow — test fixture
        motivationMessage: 'Tập trung', // locale-allow — test fixture
        nextEpisode: 'Bài tiếp', // locale-allow — test fixture
        unlockLabelNext: 'Đi tiếp', // locale-allow — test fixture
        unlockDetailGo: 'Đi', // locale-allow — test fixture
        unlockLabelGood: 'Tốt', // locale-allow — test fixture
        unlockLabelFocus: 'Focus', // locale-allow — test fixture
        unlockDetailWrong: 'Sai', // locale-allow — test fixture
        unlockLabelReplay: 'Lại', // locale-allow — test fixture
        unlockDetailMain: 'Main', // locale-allow — test fixture
        timeDetail: 'Xong', // locale-allow — test fixture
        playsDetail: 'Max {max}', // locale-allow — test fixture
        resultDetail: '{score}/{total}', // locale-allow — test fixture
        resultSummaryText: 'Đúng {score}/{total}. {msg}', // locale-allow — test fixture
        correctAnswerDetail: 'Đúng', // locale-allow — test fixture
        backToDashboard: 'Dashboard', // locale-allow — test fixture
        diTiep: 'Tiếp', // locale-allow — test fixture
        ngheLai: 'Nghe lại', // locale-allow — test fixture
        errorSubmit: 'Lỗi nộp', // locale-allow — test fixture
        errorConnection: 'Lỗi mạng', // locale-allow — test fixture
        playCountLimit: 'Hết lượt ({count})', // locale-allow — test fixture
        completedCheckpoints: 'Đạt mốc!', // locale-allow — test fixture
        rewardNote: 'Nhận thưởng.', // locale-allow — test fixture
        coachNoFucoinMessage: 'Luyện tiếp', // locale-allow — test fixture
        phaseLabel: 'Câu {current}/{total}', // locale-allow — test fixture
        progressLabel: 'Tiến độ', // locale-allow — test fixture
        closeSession: 'Đóng bài nghe', // locale-allow — test fixture
        playAudio: 'Phát âm thanh', // locale-allow — test fixture
        pauseAudio: 'Tạm dừng âm thanh', // locale-allow — test fixture
        episodeV1: 'Bài nghe v1', // locale-allow — test fixture
        sceneCafe: 'Quán cà phê', // locale-allow — test fixture
        sceneStation: 'Nhà ga', // locale-allow — test fixture
        sceneStore: 'Cửa hàng', // locale-allow — test fixture
        sceneClinic: 'Phòng khám', // locale-allow — test fixture
        sceneHome: 'Ở nhà', // locale-allow — test fixture
        speedControlAria: 'Tốc độ {speed}x', // locale-allow — test fixture
        seekSliderAria: 'Tiến độ đoạn nghe', // locale-allow — test fixture
        replayAria: 'Nghe lại đoạn ghi âm', // locale-allow — test fixture
        metricSpeed: 'Tốc độ', // locale-allow — test fixture
        metricAudio: 'Đoạn nghe', // locale-allow — test fixture
        rewardCompleteDetail: 'Hoàn thành', // locale-allow — test fixture
        rewardGoodEar: 'Tai tinh', // locale-allow — test fixture
        rewardGoodEarDetail: 'Ý chính', // locale-allow — test fixture
        rewardDailyRhythm: 'Nhịp', // locale-allow — test fixture
        rewardDailyRhythmDetail: 'Giữ nhịp', // locale-allow — test fixture
        episodeReceipt: 'Kết quả tập nghe', // locale-allow — test fixture
        fucoinEarnedLabel: '+{amount} Fucoin', // locale-allow — test fixture
        fucoinAlreadyReceived: 'Đã nhận', // locale-allow — test fixture
        fucoinDailyCapReached: 'Đủ cap', // locale-allow — test fixture
        fucoinZeroLabel: '+0 Fucoin', // locale-allow — test fixture
        fucoinWalletBalance: '{balance} ví', // locale-allow — test fixture
        fucoinAddedToWallet: 'Cộng ví', // locale-allow — test fixture
        fucoinAlreadyRewarded: 'Đã thưởng', // locale-allow — test fixture
        fucoinDailyCapDetail: '{cap}/{cap}', // locale-allow — test fixture
        fucoinDailyProgress: '{earned}/{cap}', // locale-allow — test fixture
        fucoinNoNewReward: 'Không thưởng', // locale-allow — test fixture
        rewardXpListeningDetail: 'XP từ bài nghe', // locale-allow — test fixture
        rewardStreakFreeze: 'Chuỗi đã được bảo vệ', // locale-allow — test fixture
        rewardStreakRhythm: 'Rhythm', // locale-allow — test fixture
        rewardStreakFreezeDetail: '{days} ngày', // locale-allow — test fixture
        rewardStreakKeep: 'Giữ', // locale-allow — test fixture
    },
    Vocabulary: {
        checkBtn: 'Kiểm tra', // locale-allow — test fixture
        continueBtn: 'Tiếp tục', // locale-allow — test fixture
        feedbackCorrect: 'Đúng rồi!', // locale-allow — test fixture
        feedbackIncorrect: 'Chưa đúng', // locale-allow — test fixture
        correctAnswerLabel: 'Đáp án đúng:', // locale-allow — test fixture
    },
}

const baseProps = {
    lessonId: 'L-A1-001',
    title: 'Lesson 1', // locale-allow — test
    topic: 'Office', // locale-allow — test
    cefrLevel: 'A1',
    teil: 1,
    teilName: 'Teil 1', // locale-allow — test
    taskType: 'MC', // locale-allow — test
    audioUrl: '/audio/listening/test.mp3',
    audioDuration: 60,
    backgroundScene: 'cafe',
    questions: [
        {
            id: 'q1',
            questionNumber: 1,
            questionType: 'multiple_choice',
            questionText: 'Wer ist Herr Land?', // locale-allow — German
            questionTextNative: 'Ai là ông Land?', // locale-allow — test
            options: [
                'Der neue Kollege aus Berlin', // locale-allow — German
                'Der Chef der Marketingabteilung', // locale-allow — German
                'Ein Kunde aus Hamburg', // locale-allow — German
            ],
            correctAnswer: 'a',
            sortOrder: 1,
        },
    ],
    transcript: {
        lines: [{ speaker: 'A', text: 'Hallo' }], // locale-allow — German
    },
    maxPlays: 2,
    isVisualQa: true,
}

function wrap(node: ReactNode) {
    return (
        <NextIntlClientProvider locale="vi" messages={listeningMessages}>
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
    Object.defineProperty(globalThis, 'navigator', { value: window.navigator, configurable: true })
    Object.defineProperty(globalThis, 'KeyboardEvent', {
        value: window.KeyboardEvent,
        configurable: true,
    })
    Object.defineProperty(globalThis, 'Event', {
        value: window.Event,
        configurable: true,
    })

    // Seek/play stubs for HTMLMediaElement
    const mediaProto = window.HTMLMediaElement?.prototype
    if (mediaProto) {
        Object.defineProperty(mediaProto, 'play', {
            configurable: true,
            value: function play(this: HTMLMediaElement) {
                this.dispatchEvent(new window.Event('play'))
                return Promise.resolve()
            },
        })
        Object.defineProperty(mediaProto, 'pause', {
            configurable: true,
            value: function pause(this: HTMLMediaElement) {
                this.dispatchEvent(new window.Event('pause'))
            },
        })
        Object.defineProperty(mediaProto, 'load', {
            configurable: true,
            value: function load() {
                /* no-op stub */
            },
        })
    }

    return dom
}

describe('LessonPlayerLoading — dynamic chunk a11y', () => {
    it('exposes busy status, live region, decorative spinner, and reduced-motion class', () => {
        const html = renderToStaticMarkup(<LessonPlayerLoading />)
        expect(html).toContain('data-role="lesson-player-loading"')
        expect(html).toMatch(/role="status"/)
        expect(html).toMatch(/aria-busy="true"/)
        expect(html).toMatch(/aria-live="polite"/)
        expect(html).toContain('data-role="lesson-player-loading-spinner"')
        expect(html).toMatch(/aria-hidden="true"/)
        expect(html).toMatch(/animate-spin/)
        expect(html).toMatch(/motion-reduce:animate-none/)
    })
})

describe('LessonPlayer — intro phase', () => {
    it('uses PrimaryCta for Start and localizes Episode + scene chrome', () => {
        const html = renderToStaticMarkup(
            wrap(<LessonPlayer {...baseProps} />),
        )
        expect(html).toContain('data-listening-phase="intro"')
        expect(html).toContain(listeningMessages.Listening.startListening)
        expect(html).toContain(listeningMessages.Listening.episodeV1)
        expect(html).toContain(listeningMessages.Listening.sceneCafe)
        expect(html).toContain(listeningMessages.Listening.backToList)
        // Back control touch target classes
        expect(html).toMatch(/min-h-\[44px\]/)
        // No transition-all in intro
        expect(html).not.toContain('transition-all')
    })
})

describe('LessonPlayer — listening immersive a11y', () => {
    let container: HTMLElement
    let root: Root | null
    let dom: JSDOM

    beforeEach(() => {
        dom = installDom()
        container = dom.window.document.createElement('div')
        dom.window.document.body.appendChild(container)
        root = createRoot(container)
        vi.mocked(useSuppressLearnerMainChrome).mockClear()
    })

    afterEach(() => {
        act(() => {
            root?.unmount()
        })
        root = null
        dom.window.close()
    })

    it('renders immersive overlay, close a11y, range seek, and suppresses chrome', async () => {
        await act(async () => {
            root!.render(
                wrap(
                    <LessonPlayer
                        {...baseProps}
                        mockState="selected"
                        isVisualQa
                    />,
                ),
            )
        })

        expect(useSuppressLearnerMainChrome).toHaveBeenCalledWith(true)

        const overlay = container.querySelector('[data-listening-phase="listening"]')
        expect(overlay).toBeTruthy()
        expect(overlay?.className).toMatch(/fixed/)
        expect(overlay?.className).toMatch(/inset-0/)
        expect(overlay?.className).toMatch(/z-50/)
        expect(overlay?.className).toMatch(/fuxie-gameplay-bg/)

        // Derive close label from fixture messages (locale guard — no hardcoded scan hit)
        const closeLabel = listeningMessages.Listening.closeSession
        const closeBtn = container.querySelector(
            `button[aria-label="${closeLabel}"]`,
        )
        expect(closeBtn).toBeTruthy()
        expect(closeBtn?.getAttribute('type')).toBe('button')
        expect(closeBtn?.className).toMatch(/min-h-\[44px\]/)
        expect(closeBtn?.className).toMatch(/focus-visible:outline/)

        const seek = container.querySelector('#listening-audio-seek') as HTMLInputElement | null
        expect(seek).toBeTruthy()
        expect(seek?.type).toBe('range')
        expect(seek?.getAttribute('aria-label')).toBe(
            listeningMessages.Listening.seekSliderAria,
        )
        expect(seek?.hasAttribute('min')).toBe(true)
        expect(seek?.hasAttribute('max')).toBe(true)

        // Native range seek — not a clickable progress div
        expect(container.querySelector('div.h-2.bg-gray-100.rounded-full.cursor-pointer')).toBeNull()

        const audioBtn = container.querySelector('[data-audio-state]')
        expect(audioBtn).toBeTruthy()
        expect(audioBtn?.getAttribute('aria-label')).toBe(
            listeningMessages.Listening.playAudio,
        )
        expect(audioBtn?.className).toMatch(/w-16|min-w-\[64px\]/)

        // Close control itself must not use transition-all
        expect(closeBtn?.className).not.toContain('transition-all')
    })

    it('shows OptionTiles + Check CTA when answer selected', async () => {
        await act(async () => {
            root!.render(
                wrap(
                    <LessonPlayer
                        {...baseProps}
                        mockState="selected"
                        isVisualQa
                    />,
                ),
            )
        })

        expect(container.textContent).toContain('Wer ist Herr Land?')
        expect(container.textContent).toContain(listeningMessages.Vocabulary.checkBtn)
        // Options present
        expect(container.textContent).toContain('Der neue Kollege aus Berlin')
    })

    it('shows BottomFeedback + mascot on wrong check with correct answer', async () => {
        await act(async () => {
            root!.render(
                wrap(
                    <LessonPlayer
                        {...baseProps}
                        mockState="wrong"
                        isVisualQa
                    />,
                ),
            )
        })

        expect(container.querySelector('[data-role="listening-mascot-reaction"]')).toBeTruthy()
        // Wrong path should surface correct answer text via BottomFeedback
        expect(container.textContent).toMatch(/Der neue Kollege|Đáp án|correct|Chưa đúng|Tiếp tục/i)
    })

    it('shows correct-answer feedback + celebrate mascot on correct check', async () => {
        await act(async () => {
            root!.render(
                wrap(
                    <LessonPlayer
                        {...baseProps}
                        mockState="correct"
                        isVisualQa
                    />,
                ),
            )
        })

        const mascot = container.querySelector('[data-role="listening-mascot-reaction"]')
        expect(mascot).toBeTruthy()
        expect(container.textContent).toMatch(/Đúng rồi|Tiếp tục/i)
        // Correct path does not force the wrong-option answer strip as primary copy
        expect(container.textContent).not.toMatch(/Chưa đúng/)
    })

    it('exposes play/pause accessible state on AudioButton', async () => {
        await act(async () => {
            root!.render(
                wrap(
                    <LessonPlayer
                        {...baseProps}
                        mockState="selected"
                        isVisualQa
                    />,
                ),
            )
        })

        const audioBtn = container.querySelector('[data-audio-state]') as HTMLButtonElement
        expect(audioBtn).toBeTruthy()
        expect(audioBtn.getAttribute('data-audio-state')).toBe('idle')
        expect(audioBtn.getAttribute('aria-label')).toBe(
            listeningMessages.Listening.playAudio,
        )
        expect(audioBtn.getAttribute('aria-pressed')).toBe('false')

        await act(async () => {
            audioBtn.click()
        })

        // play() dispatches 'play' → isPlaying true
        expect(audioBtn.getAttribute('data-audio-state')).toBe('playing')
        expect(audioBtn.getAttribute('aria-label')).toBe(
            listeningMessages.Listening.pauseAudio,
        )
        expect(audioBtn.getAttribute('aria-pressed')).toBe('true')
    })

    it('sizes replay/speed controls ≥44px and disables replay at max plays', async () => {
        await act(async () => {
            root!.render(
                wrap(
                    <LessonPlayer
                        {...baseProps}
                        maxPlays={0}
                        mockState="selected"
                        isVisualQa
                    />,
                ),
            )
        })

        const speedBtn = container.querySelector(
            `button[aria-label="${listeningMessages.Listening.speedControlAria.replace('{speed}', '0.75')}"]`,
        ) as HTMLButtonElement | null
        // speed label uses current playbackSpeed (A1 default 0.75)
        expect(speedBtn).toBeTruthy()
        expect(speedBtn?.className).toMatch(/min-h-\[44px\]/)
        expect(speedBtn?.className).toMatch(/min-w-\[44px\]/)
        expect(speedBtn?.className).toMatch(/focus-visible:outline/)

        const replayBtn = container.querySelector(
            `button[aria-label="${listeningMessages.Listening.replayAria}"]`,
        ) as HTMLButtonElement | null
        expect(replayBtn).toBeTruthy()
        expect(replayBtn?.className).toMatch(/min-h-\[44px\]/)
        expect(replayBtn?.disabled || replayBtn?.getAttribute('aria-disabled') === 'true').toBe(true)

        const mainAudio = container.querySelector('[data-audio-state]') as HTMLButtonElement
        // Max plays exhausted and not currently playing → main control disabled
        expect(mainAudio.disabled || mainAudio.getAttribute('aria-disabled') === 'true').toBe(true)
    })

    it('supports Arrow/Home/End keyboard seeking on the range slider', async () => {
        await act(async () => {
            root!.render(
                wrap(
                    <LessonPlayer
                        {...baseProps}
                        audioDuration={60}
                        mockState="selected"
                        isVisualQa
                    />,
                ),
            )
        })

        const seek = container.querySelector('#listening-audio-seek') as HTMLInputElement
        expect(seek).toBeTruthy()
        expect(Number(seek.max)).toBe(60)
        expect(Number(seek.min)).toBe(0)

        // jsdom media currentTime needs an explicit writable stub
        const audio = container.querySelector('audio') as HTMLAudioElement
        let mediaTime = 0
        Object.defineProperty(audio, 'currentTime', {
            configurable: true,
            get: () => mediaTime,
            set: (v: number) => {
                mediaTime = Number(v)
            },
        })

        await act(async () => {
            invokeReactKeyDown(seek, 'ArrowRight')
        })
        expect(mediaTime).toBeGreaterThanOrEqual(1)
        expect(Number(seek.value)).toBeGreaterThanOrEqual(1)

        await act(async () => {
            invokeReactKeyDown(seek, 'Home')
        })
        expect(mediaTime).toBe(0)
        expect(Number(seek.value)).toBe(0)

        await act(async () => {
            invokeReactKeyDown(seek, 'End')
        })
        expect(mediaTime).toBe(60)
        expect(Number(seek.value)).toBe(60)

        await act(async () => {
            invokeReactKeyDown(seek, 'ArrowLeft')
        })
        expect(mediaTime).toBeLessThan(60)
        expect(Number(seek.value)).toBeLessThan(60)
    })

    it('results phase is compact without duplicate bottom list/replay CTAs', async () => {
        await act(async () => {
            root!.render(
                wrap(
                    <LessonPlayer
                        {...baseProps}
                        mockState="results"
                        isVisualQa
                    />,
                ),
            )
        })

        const results = container.querySelector('[data-listening-phase="results"]')
        expect(results).toBeTruthy()
        expect(container.querySelector('[data-role="completion-flow-stub"]')).toBeTruthy()
        // CompletionFlow owns primary CTA; no duplicate back/replay action row
        expect(container.querySelector('[data-role="completion-primary"]')).toBeTruthy()
        const bareBack = Array.from(container.querySelectorAll('button')).filter(
            b => b.textContent?.trim() === listeningMessages.Listening.backToList,
        )
        expect(bareBack.length).toBe(0)
        expect(container.textContent).toContain(listeningMessages.Listening.episodeReceipt)
    })

    it('wires transcript trigger/panel aria relationships for open and closed states', async () => {
        await act(async () => {
            root!.render(
                wrap(
                    <LessonPlayer
                        {...baseProps}
                        mockState="results"
                        isVisualQa
                    />,
                ),
            )
        })

        const trigger = container.querySelector(
            '#listening-transcript-trigger',
        ) as HTMLButtonElement | null
        expect(trigger).toBeTruthy()
        expect(trigger?.getAttribute('aria-controls')).toBe('listening-transcript-panel')
        expect(trigger?.getAttribute('aria-expanded')).toBe('false')
        expect(container.querySelector('#listening-transcript-panel')).toBeNull()

        await act(async () => {
            trigger!.click()
        })

        expect(trigger?.getAttribute('aria-expanded')).toBe('true')
        const panel = container.querySelector('#listening-transcript-panel')
        expect(panel).toBeTruthy()
        expect(panel?.getAttribute('role')).toBe('region')
        expect(panel?.getAttribute('aria-labelledby')).toBe('listening-transcript-trigger')
        expect(panel?.getAttribute('data-role')).toBe('listening-transcript-panel')
        expect(container.textContent).toContain('Hallo')

        await act(async () => {
            trigger!.click()
        })
        expect(trigger?.getAttribute('aria-expanded')).toBe('false')
        expect(container.querySelector('#listening-transcript-panel')).toBeNull()
    })
})

describe('LessonPlayer — source hygiene', () => {
    it('lesson-player source has no transition-all class tokens', async () => {
        // Guardrail: WO forbids transition-all in allowlisted player source.
        const fs = await import('node:fs')
        const path = await import('node:path')
        const src = fs.readFileSync(
            path.join(__dirname, 'lesson-player.tsx'),
            'utf8',
        )
        expect(src).not.toMatch(/transition-all/)
    })
})
