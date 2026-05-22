import { describe, it, expect } from 'vitest'

import { isWorldCanvasContext } from '../world-canvas-context'

/**
 * Validates: Requirements 3.5, 3.7
 *
 * `WorldCanvasContext` is the structural seam between the framework-agnostic
 * Learning_World_Core and the React/DOM host. Its method set is fixed at
 * exactly eight methods; adding or removing one is a public-API change. This
 * suite pins that contract by asserting that `isWorldCanvasContext`:
 *
 *   - returns `true` for an object that exposes all eight methods as
 *     functions (Requirement 3.5);
 *   - returns `false` for any object missing exactly one of those methods
 *     (Requirement 3.7 — invalid contexts are rejected before the core
 *     touches them);
 *   - returns `false` for `null`, `undefined`, and non-object primitives
 *     (Requirement 3.7).
 */

const WORLD_CANVAS_METHODS = [
    'clearRect',
    'fillRect',
    'drawImage',
    'save',
    'restore',
    'translate',
    'scale',
    'setTransform',
] as const

type WorldCanvasMethod = (typeof WORLD_CANVAS_METHODS)[number]

function buildFullMock(): Record<WorldCanvasMethod, () => void> {
    return {
        clearRect: () => {},
        fillRect: () => {},
        drawImage: () => {},
        save: () => {},
        restore: () => {},
        translate: () => {},
        scale: () => {},
        setTransform: () => {},
    }
}

describe('isWorldCanvasContext', () => {
    it('returns true for a fully-populated 8-method mock', () => {
        const fullMock = buildFullMock()

        expect(isWorldCanvasContext(fullMock)).toBe(true)
    })

    describe('returns false when exactly one method is missing or non-function', () => {
        for (const missing of WORLD_CANVAS_METHODS) {
            it(`rejects mock with "${missing}" deleted`, () => {
                const variant = buildFullMock() as Partial<
                    Record<WorldCanvasMethod, () => void>
                >
                delete variant[missing]

                expect(isWorldCanvasContext(variant)).toBe(false)
            })

            it(`rejects mock with "${missing}" set to null`, () => {
                const variant: Record<string, unknown> = buildFullMock()
                variant[missing] = null

                expect(isWorldCanvasContext(variant)).toBe(false)
            })

            it(`rejects mock with "${missing}" set to undefined`, () => {
                const variant: Record<string, unknown> = buildFullMock()
                variant[missing] = undefined

                expect(isWorldCanvasContext(variant)).toBe(false)
            })

            it(`rejects mock with "${missing}" set to a string`, () => {
                const variant: Record<string, unknown> = buildFullMock()
                variant[missing] = 'not-a-function'

                expect(isWorldCanvasContext(variant)).toBe(false)
            })
        }
    })

    describe('returns false for null / undefined / non-object inputs', () => {
        it('rejects null', () => {
            expect(isWorldCanvasContext(null)).toBe(false)
        })

        it('rejects undefined', () => {
            expect(isWorldCanvasContext(undefined)).toBe(false)
        })

        it('rejects a number primitive', () => {
            expect(isWorldCanvasContext(42)).toBe(false)
        })

        it('rejects a string primitive', () => {
            expect(isWorldCanvasContext('ctx')).toBe(false)
        })

        it('rejects a boolean primitive', () => {
            expect(isWorldCanvasContext(true)).toBe(false)
        })

        it('rejects an empty object', () => {
            expect(isWorldCanvasContext({})).toBe(false)
        })
    })
})
