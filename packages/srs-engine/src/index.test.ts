import { describe, expect, it, vi } from 'vitest'
import { calculateReview, createNewCard, isDue } from './index'

describe('srs-engine', () => {
    it('creates a new card with the configured defaults', () => {
        expect(createNewCard()).toEqual({
            interval: 0,
            repetitions: 0,
            easeFactor: 2.5,
            state: 0,
            lapseCount: 0,
        })
    })

    it('moves a forgotten new card into learning and decreases ease factor', () => {
        const result = calculateReview(
            {
                interval: 0,
                repetitions: 0,
                easeFactor: 2.5,
                state: 0,
                lapseCount: 0,
            },
            'AGAIN'
        )

        expect(result).toMatchObject({
            interval: 0,
            repetitions: 0,
            easeFactor: 2.3,
            state: 1,
            lapseCount: 1,
        })
    })

    it('graduates a successful first review into review state for one day', () => {
        const result = calculateReview(
            {
                interval: 0,
                repetitions: 0,
                easeFactor: 2.5,
                state: 0,
                lapseCount: 0,
            },
            'GOOD'
        )

        expect(result).toMatchObject({
            interval: 1,
            repetitions: 1,
            easeFactor: 2.36,
            state: 2,
            lapseCount: 0,
        })
    })

    it('applies the easy bonus on mature cards', () => {
        const result = calculateReview(
            {
                interval: 6,
                repetitions: 2,
                easeFactor: 2.5,
                state: 2,
                lapseCount: 0,
            },
            'EASY'
        )

        expect(result).toMatchObject({
            interval: 17,
            repetitions: 3,
            easeFactor: 2.75,
            state: 2,
            lapseCount: 0,
        })
    })

    it('detects due cards based on the current time', () => {
        vi.useFakeTimers()
        vi.setSystemTime(new Date('2026-04-23T10:00:00.000Z'))

        expect(isDue(new Date('2026-04-23T09:59:59.000Z'))).toBe(true)
        expect(isDue(new Date('2026-04-23T10:00:00.000Z'))).toBe(true)
        expect(isDue(new Date('2026-04-23T10:00:01.000Z'))).toBe(false)

        vi.useRealTimers()
    })
})
