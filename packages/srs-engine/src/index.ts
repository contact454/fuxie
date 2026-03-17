import { SRS_DEFAULTS } from '@fuxie/shared/constants'
import type { SrsRating } from '@fuxie/shared/types'

export interface CardState {
    interval: number
    repetitions: number
    easeFactor: number
    state: number // 0=New, 1=Learning, 2=Review, 3=Relearning
    lapseCount: number
}

export interface ReviewResult {
    interval: number
    repetitions: number
    easeFactor: number
    state: number
    lapseCount: number
    nextReviewAt: Date
}

/**
 * SM-2 Spaced Repetition Algorithm
 *
 * Based on SuperMemo 2 algorithm by Piotr Wozniak.
 * Adapted for Fuxie with configurable parameters.
 */
export function calculateReview(card: CardState, rating: SrsRating): ReviewResult {
    const { MIN_EASE_FACTOR, EASE_BONUS_EASY, EASE_PENALTY_AGAIN, MAX_INTERVAL } = SRS_DEFAULTS

    let { interval, repetitions, easeFactor, state, lapseCount } = card

    // Map rating to quality (0-5 scale for SM-2 compatibility)
    const qualityMap: Record<SrsRating, number> = {
        AGAIN: 0,
        HARD: 2,
        GOOD: 3,
        EASY: 5,
    }
    const quality = qualityMap[rating]

    if (rating === 'AGAIN') {
        // Lapse — forgot the card
        repetitions = 0
        interval = 0
        easeFactor = Math.max(MIN_EASE_FACTOR, easeFactor - EASE_PENALTY_AGAIN)
        lapseCount += 1
        state = card.state === 0 ? 1 : 3 // New → Learning, Review → Relearning
    } else {
        // Successful recall
        if (repetitions === 0) {
            interval = 1 // 1 day
        } else if (repetitions === 1) {
            interval = 6 // 6 days
        } else {
            interval = Math.round(interval * easeFactor)
        }

        // Adjust ease factor
        easeFactor = Math.max(
            MIN_EASE_FACTOR,
            easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
        )

        // Easy bonus
        if (rating === 'EASY') {
            interval = Math.round(interval * (1 + EASE_BONUS_EASY))
            easeFactor += EASE_BONUS_EASY
        }

        // Hard penalty
        if (rating === 'HARD') {
            interval = Math.max(1, Math.round(interval * 0.8))
        }

        repetitions += 1
        state = 2 // Review
    }

    // Cap interval
    interval = Math.min(interval, MAX_INTERVAL)

    // Calculate next review date
    const nextReviewAt = new Date()
    nextReviewAt.setDate(nextReviewAt.getDate() + interval)

    return {
        interval,
        repetitions,
        easeFactor: Math.round(easeFactor * 100) / 100,
        state,
        lapseCount,
        nextReviewAt,
    }
}

/**
 * Get initial card state for a new SRS card
 */
export function createNewCard(): CardState {
    return {
        interval: 0,
        repetitions: 0,
        easeFactor: SRS_DEFAULTS.INITIAL_EASE_FACTOR,
        state: 0, // New
        lapseCount: 0,
    }
}

/**
 * Check if a card is due for review
 */
export function isDue(nextReviewAt: Date): boolean {
    return new Date() >= nextReviewAt
}

export { type SrsRating } from '@fuxie/shared/types'
