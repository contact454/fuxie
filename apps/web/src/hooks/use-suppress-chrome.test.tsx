/**
 * Focused tests for useSuppressLearnerMainChrome ref-counting.
 * Runs under apps/web vitest (jsdom via node + JSDOM pattern).
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { JSDOM } from 'jsdom'
import {
    __getSuppressChromeConsumersForTests,
    __resetSuppressChromeConsumersForTests,
    useSuppressLearnerMainChrome,
} from './use-suppress-chrome'

function installDom() {
    const dom = new JSDOM('<!doctype html><html><body></body></html>', {
        url: 'http://localhost/',
    })
    const { window } = dom
    Object.assign(globalThis, {
        window,
        document: window.document,
        HTMLElement: window.HTMLElement,
        Node: window.Node,
    })
    return dom
}

function Consumer({ active }: { active: boolean }) {
    useSuppressLearnerMainChrome(active)
    return null
}

describe('useSuppressLearnerMainChrome', () => {
    let root: Root | null = null
    let container: HTMLElement
    let dom: JSDOM

    beforeEach(() => {
        dom = installDom()
        __resetSuppressChromeConsumersForTests()
        container = document.createElement('div')
        document.body.appendChild(container)
        root = createRoot(container)
    })

    afterEach(() => {
        act(() => {
            root?.unmount()
        })
        root = null
        __resetSuppressChromeConsumersForTests()
        dom.window.close()
    })

    it('sets dataset when a consumer is active and clears on release', () => {
        act(() => {
            root!.render(<Consumer active />)
        })
        expect(document.body.dataset.gameplayInProgress).toBe('true')
        expect(__getSuppressChromeConsumersForTests()).toBe(1)

        act(() => {
            root!.render(<Consumer active={false} />)
        })
        expect(document.body.dataset.gameplayInProgress).toBeUndefined()
        expect(__getSuppressChromeConsumersForTests()).toBe(0)
    })

    it('keeps dataset until the last of multiple active consumers releases', () => {
        function Dual({ a, b }: { a: boolean; b: boolean }) {
            useSuppressLearnerMainChrome(a)
            useSuppressLearnerMainChrome(b)
            return null
        }

        act(() => {
            root!.render(<Dual a b />)
        })
        expect(document.body.dataset.gameplayInProgress).toBe('true')
        expect(__getSuppressChromeConsumersForTests()).toBe(2)

        act(() => {
            root!.render(<Dual a b={false} />)
        })
        expect(document.body.dataset.gameplayInProgress).toBe('true')
        expect(__getSuppressChromeConsumersForTests()).toBe(1)

        act(() => {
            root!.render(<Dual a={false} b={false} />)
        })
        expect(document.body.dataset.gameplayInProgress).toBeUndefined()
        expect(__getSuppressChromeConsumersForTests()).toBe(0)
    })

    it('inactive consumers do not clear an active peer', () => {
        function Peer({ active, idle }: { active: boolean; idle: boolean }) {
            useSuppressLearnerMainChrome(active)
            useSuppressLearnerMainChrome(idle)
            return null
        }

        act(() => {
            root!.render(<Peer active idle={false} />)
        })
        expect(document.body.dataset.gameplayInProgress).toBe('true')

        act(() => {
            // idle stays false; remount-style re-render must not wipe active
            root!.render(<Peer active idle={false} />)
        })
        expect(document.body.dataset.gameplayInProgress).toBe('true')
        expect(__getSuppressChromeConsumersForTests()).toBe(1)
    })

    it('Strict Mode mount/cleanup leaves no stale dataset', () => {
        // Simulate Strict Mode: effect → cleanup → effect
        act(() => {
            root!.render(<Consumer active />)
        })
        expect(document.body.dataset.gameplayInProgress).toBe('true')

        act(() => {
            root!.unmount()
        })
        root = createRoot(container)

        expect(document.body.dataset.gameplayInProgress).toBeUndefined()
        expect(__getSuppressChromeConsumersForTests()).toBe(0)

        act(() => {
            root!.render(<Consumer active />)
        })
        expect(document.body.dataset.gameplayInProgress).toBe('true')
        expect(__getSuppressChromeConsumersForTests()).toBe(1)
    })

    it('SRS-style lifecycle keeps chrome suppressed until complete/back/unmount', () => {
        // Mirrors ReviewClient: viewMode==='srs' && !srsComplete
        function Session({ srs, complete }: { srs: boolean; complete: boolean }) {
            useSuppressLearnerMainChrome(srs && !complete)
            return null
        }

        // loading / empty / active all use srs=true, complete=false
        act(() => {
            root!.render(<Session srs complete={false} />)
        })
        expect(document.body.dataset.gameplayInProgress).toBe('true')

        // complete restores chrome
        act(() => {
            root!.render(<Session srs complete />)
        })
        expect(document.body.dataset.gameplayInProgress).toBeUndefined()

        // back into active session
        act(() => {
            root!.render(<Session srs complete={false} />)
        })
        expect(document.body.dataset.gameplayInProgress).toBe('true')

        // back-to-overview (leave srs)
        act(() => {
            root!.render(<Session srs={false} complete={false} />)
        })
        expect(document.body.dataset.gameplayInProgress).toBeUndefined()

        // active then unmount
        act(() => {
            root!.render(<Session srs complete={false} />)
        })
        expect(document.body.dataset.gameplayInProgress).toBe('true')
        act(() => {
            root!.unmount()
        })
        root = createRoot(container)
        expect(document.body.dataset.gameplayInProgress).toBeUndefined()
    })
})
