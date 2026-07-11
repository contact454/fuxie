import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { JSDOM } from 'jsdom'
import { useLevelSwitcher } from './use-level-switcher'

function installDom() {
    const dom = new JSDOM('<!doctype html><html><body></body></html>', {
        url: 'http://localhost/',
    })
    Object.defineProperty(globalThis, 'window', { value: dom.window, configurable: true })
    Object.defineProperty(globalThis, 'document', { value: dom.window.document, configurable: true })
    Object.defineProperty(globalThis, 'HTMLElement', { value: dom.window.HTMLElement, configurable: true })
    Object.defineProperty(globalThis, 'Node', { value: dom.window.Node, configurable: true })
    return dom
}

type HookApi = ReturnType<typeof useLevelSwitcher<{ value: string }>>

function Probe({
    onReady,
    transformData = (data: unknown) => data as { value: string },
    onSuccess,
}: {
    onReady: (api: HookApi) => void
    transformData?: (data: unknown) => { value: string }
    onSuccess?: (data: { value: string }, level: string) => void
}) {
    const api = useLevelSwitcher({
        initialLevel: 'A1',
        apiEndpoint: '/api/v1/listening?level={level}',
        transformData,
        onSuccess,
    })
    onReady(api)
    return (
        <div>
            <span data-level={api.currentLevel} />
            <span data-loading={String(api.isLevelLoading)} />
            <span data-failed={api.failedLevel ?? ''} />
            <span data-error={api.error ?? ''} />
        </div>
    )
}

describe('useLevelSwitcher', () => {
    let root: Root | null = null
    let container: HTMLElement
    let dom: JSDOM
    let latest: HookApi | null = null
    const fetchMock = vi.fn()

    beforeEach(() => {
        dom = installDom()
        container = document.createElement('div')
        document.body.appendChild(container)
        root = createRoot(container)
        latest = null
        fetchMock.mockReset()
        Object.defineProperty(globalThis, 'fetch', {
            value: fetchMock,
            configurable: true,
            writable: true,
        })
    })

    afterEach(() => {
        act(() => {
            root?.unmount()
        })
        root = null
        dom.window.close()
        vi.restoreAllMocks()
    })

    function renderHook(
        opts: {
            transformData?: (data: unknown) => { value: string }
            onSuccess?: (data: { value: string }, level: string) => void
        } = {},
    ) {
        act(() => {
            root!.render(
                <Probe
                    onReady={(api) => {
                        latest = api
                    }}
                    transformData={opts.transformData}
                    onSuccess={opts.onSuccess}
                />,
            )
        })
        return latest!
    }

    it('loads a level successfully and commits it', async () => {
        const onSuccess = vi.fn()
        fetchMock.mockResolvedValue({
            ok: true,
            json: async () => ({ success: true, data: { value: 'ok-A2' } }),
        })
        const api = renderHook({
            transformData: (raw) => (raw as { data: { value: string } }).data,
            onSuccess,
        })

        await act(async () => {
            await api.switchLevel('A2')
        })

        expect(fetchMock).toHaveBeenCalledWith(
            '/api/v1/listening?level=A2',
            expect.objectContaining({ signal: expect.any(AbortSignal) }),
        )
        expect(container.querySelector('[data-level]')?.getAttribute('data-level')).toBe('A2')
        expect(container.querySelector('[data-failed]')?.getAttribute('data-failed')).toBe('')
        expect(onSuccess).toHaveBeenCalledWith({ value: 'ok-A2' }, 'A2')
    })

    it('rolls back on HTTP failure and exposes failedLevel', async () => {
        fetchMock.mockResolvedValue({
            ok: false,
            status: 500,
            json: async () => ({ success: false }),
        })
        const onSuccess = vi.fn()
        const api = renderHook({ onSuccess })

        await act(async () => {
            await api.switchLevel('B1')
        })

        expect(container.querySelector('[data-level]')?.getAttribute('data-level')).toBe('A1')
        expect(container.querySelector('[data-failed]')?.getAttribute('data-failed')).toBe('B1')
        expect(container.querySelector('[data-error]')?.getAttribute('data-error')).toContain('B1')
        expect(onSuccess).not.toHaveBeenCalled()
    })

    it('rolls back when payload success is false', async () => {
        fetchMock.mockResolvedValue({
            ok: true,
            status: 200,
            json: async () => ({ success: false, error: 'nope' }),
        })
        const api = renderHook()

        await act(async () => {
            await api.switchLevel('C1')
        })

        expect(container.querySelector('[data-level]')?.getAttribute('data-level')).toBe('A1')
        expect(container.querySelector('[data-failed]')?.getAttribute('data-failed')).toBe('C1')
    })

    it('retry succeeds after a failure', async () => {
        const onSuccess = vi.fn()
        fetchMock
            .mockResolvedValueOnce({
                ok: false,
                status: 503,
                json: async () => ({ success: false }),
            })
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({ success: true, data: { value: 'retry-ok' } }),
            })

        const api = renderHook({
            transformData: (raw) => (raw as { data: { value: string } }).data,
            onSuccess,
        })

        await act(async () => {
            await api.switchLevel('A2')
        })
        expect(container.querySelector('[data-level]')?.getAttribute('data-level')).toBe('A1')

        await act(async () => {
            await latest!.switchLevel('A2')
        })

        expect(container.querySelector('[data-level]')?.getAttribute('data-level')).toBe('A2')
        expect(container.querySelector('[data-failed]')?.getAttribute('data-failed')).toBe('')
        expect(onSuccess).toHaveBeenCalledWith({ value: 'retry-ok' }, 'A2')
    })

    it('abort does not surface error or rollback committed level', async () => {
        const controllers: AbortSignal[] = []
        fetchMock.mockImplementation((_url: string, init?: { signal?: AbortSignal }) => {
            if (init?.signal) controllers.push(init.signal)
            if (controllers.length === 1) {
                return new Promise((_resolve, reject) => {
                    init?.signal?.addEventListener('abort', () => {
                        reject(new DOMException('Aborted', 'AbortError'))
                    })
                })
            }
            return Promise.resolve({
                ok: true,
                json: async () => ({ success: true, data: { value: 'B1' } }),
            })
        })

        const api = renderHook({
            transformData: (raw) => (raw as { data: { value: string } }).data,
        })

        let first: Promise<void> = Promise.resolve()
        act(() => {
            first = api.switchLevel('B2')
        })

        await act(async () => {
            await latest!.switchLevel('B1')
            await first.catch(() => undefined)
        })

        expect(container.querySelector('[data-error]')?.getAttribute('data-error')).toBe('')
        expect(container.querySelector('[data-failed]')?.getAttribute('data-failed')).toBe('')
        expect(container.querySelector('[data-level]')?.getAttribute('data-level')).toBe('B1')
    })

    it('ignores stale responses that resolve after a newer level is active', async () => {
        const onSuccess = vi.fn()
        let resolveA2: ((value: unknown) => void) | null = null
        let a2Signal: AbortSignal | undefined

        fetchMock.mockImplementation((url: string, init?: { signal?: AbortSignal }) => {
            if (String(url).includes('level=A2')) {
                a2Signal = init?.signal
                return new Promise((resolve, reject) => {
                    resolveA2 = resolve
                    init?.signal?.addEventListener('abort', () => {
                        reject(new DOMException('Aborted', 'AbortError'))
                    })
                })
            }
            return Promise.resolve({
                ok: true,
                json: async () => ({ success: true, data: { value: 'A3' } }),
            })
        })

        const api = renderHook({
            transformData: (raw) => (raw as { data: { value: string } }).data,
            onSuccess,
        })

        let first: Promise<void> = Promise.resolve()
        act(() => {
            first = api.switchLevel('A2')
        })

        await act(async () => {
            await latest!.switchLevel('A3')
            await first.catch(() => undefined)
        })

        // Even if a stale resolver fires, ignore it (request was aborted / superseded)
        await act(async () => {
            if (a2Signal?.aborted) {
                // aborted path already handled
                return
            }
            resolveA2?.({
                ok: true,
                json: async () => ({ success: true, data: { value: 'stale-A2' } }),
            })
            await Promise.resolve()
        })

        expect(container.querySelector('[data-level]')?.getAttribute('data-level')).toBe('A3')
        expect(onSuccess).toHaveBeenCalledTimes(1)
        expect(onSuccess).toHaveBeenCalledWith({ value: 'A3' }, 'A3')
        expect(onSuccess).not.toHaveBeenCalledWith({ value: 'stale-A2' }, 'A2')
    })

    it('unmount aborts pending request without onSuccess/error/unhandled rejection', async () => {
        const onSuccess = vi.fn()
        const unhandled: unknown[] = []
        const onUnhandled = (reason: unknown) => {
            unhandled.push(reason)
        }
        process.on('unhandledRejection', onUnhandled)

        let pendingSignal: AbortSignal | undefined
        fetchMock.mockImplementation((_url: string, init?: { signal?: AbortSignal }) => {
            pendingSignal = init?.signal
            return new Promise((_resolve, reject) => {
                init?.signal?.addEventListener('abort', () => {
                    reject(new DOMException('Aborted', 'AbortError'))
                })
            })
        })

        const api = renderHook({
            transformData: (raw) => (raw as { data: { value: string } }).data,
            onSuccess,
        })

        let pending: Promise<void> = Promise.resolve()
        act(() => {
            pending = api.switchLevel('C2')
        })
        expect(pendingSignal).toBeTruthy()

        await act(async () => {
            root!.unmount()
            root = null
            await pending.catch(() => undefined)
            await Promise.resolve()
        })

        expect(pendingSignal?.aborted).toBe(true)
        expect(onSuccess).not.toHaveBeenCalled()
        expect(unhandled).toHaveLength(0)

        process.off('unhandledRejection', onUnhandled)
    })

    it('clearError clears failedLevel and error', async () => {
        fetchMock.mockResolvedValue({
            ok: false,
            status: 500,
            json: async () => ({ success: false }),
        })
        const api = renderHook()
        await act(async () => {
            await api.switchLevel('B1')
        })
        expect(container.querySelector('[data-failed]')?.getAttribute('data-failed')).toBe('B1')

        act(() => {
            latest!.clearError()
        })
        expect(container.querySelector('[data-failed]')?.getAttribute('data-failed')).toBe('')
        expect(container.querySelector('[data-error]')?.getAttribute('data-error')).toBe('')
    })
})
