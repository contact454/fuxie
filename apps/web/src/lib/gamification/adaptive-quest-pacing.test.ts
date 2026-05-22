import { describe, expect, it } from 'vitest'

import {
    buildAdaptiveQuestPacing,
    sortQuestsByAdaptivePacing,
    type AdaptiveQuestCandidate,
} from './adaptive-quest-pacing'

const quests: AdaptiveQuestCandidate[] = [
    quest({ id: 'exam', type: 'exam', priority: 90, estimatedMinutes: 20 }),
    quest({ id: 'lesson-long', type: 'lesson', priority: 80, estimatedMinutes: 15 }),
    quest({ id: 'srs-due', type: 'srs', priority: 70, estimatedMinutes: 5 }),
    quest({ id: 'lesson-short', type: 'lesson', priority: 60, estimatedMinutes: 6 }),
]

describe('adaptive quest pacing', () => {
    it('classifies reward-only risk and prioritizes a learning quest before shop behavior', () => {
        const pacing = buildAdaptiveQuestPacing({
            quests,
            plan: plan(),
            context: context(),
            signals: {
                rewardRequests7d: 2,
                meaningfulActions7d: 0,
                meaningfulDays7d: 0,
            },
        })

        expect(pacing).toMatchObject({
            learnerPacingState: 'reward_only_risk',
            primaryQuestId: 'srs-due',
            interventionCode: 'adaptive_reward_only_risk',
        })
        expect(pacing.nextQuestReason).toContain('quest')
        expect(pacing.nextQuestReason).toContain('Fucoin')
    })

    it('classifies streak recovery and picks a short restart quest', () => {
        const pacing = buildAdaptiveQuestPacing({
            quests,
            plan: plan({ dueSrsCount: 0 }),
            context: context({ currentStreak: 0, totalXp: 320, srsDueCount: 0 }),
            signals: {
                meaningfulActions7d: 1,
                meaningfulDays7d: 1,
                rewardRequests7d: 0,
            },
        })

        expect(pacing).toMatchObject({
            learnerPacingState: 'streak_recovery',
            primaryQuestId: 'lesson-short',
            interventionCode: 'adaptive_streak_recovery',
        })
    })

    it('classifies low repeat study before generic learning nudge', () => {
        const pacing = buildAdaptiveQuestPacing({
            quests,
            plan: plan({ dueSrsCount: 0, recentMinutes7d: 10 }),
            context: context({ currentStreak: 2, totalXp: 600, srsDueCount: 0 }),
            signals: {
                meaningfulActions7d: 1,
                meaningfulDays7d: 1,
                rewardRequests7d: 0,
            },
        })

        expect(pacing).toMatchObject({
            learnerPacingState: 'low_repeat_study',
            primaryQuestId: 'lesson-short',
        })
    })

    it('keeps SRS first for a normal learning nudge', () => {
        const pacing = buildAdaptiveQuestPacing({
            quests,
            plan: plan(),
            context: context({ currentStreak: 5, totalXp: 900, srsDueCount: 12 }),
            signals: {
                meaningfulActions7d: 4,
                meaningfulDays7d: 3,
                rewardRequests7d: 0,
            },
        })

        expect(pacing).toMatchObject({
            learnerPacingState: 'needs_learning_nudge',
            primaryQuestId: 'srs-due',
        })
    })

    it('moves the adaptive primary quest to the front while preserving priority order after it', () => {
        const sorted = sortQuestsByAdaptivePacing(quests, { primaryQuestId: 'lesson-short' })

        expect(sorted.map((item) => item.id)).toEqual(['lesson-short', 'exam', 'lesson-long', 'srs-due'])
    })
})

function quest(overrides: Partial<AdaptiveQuestCandidate>): AdaptiveQuestCandidate {
    return {
        id: 'lesson',
        type: 'lesson',
        skill: 'WORTSCHATZ',
        href: '/vocabulary',
        priority: 50,
        estimatedMinutes: 10,
        status: 'available',
        ...overrides,
    }
}

function plan(overrides: Partial<ReturnType<typeof planShape>> = {}) {
    return {
        ...planShape(),
        ...overrides,
        signals: {
            ...planShape().signals,
            ...(overrides.signals ?? {}),
            recentMinutes7d: overrides.recentMinutes7d ?? planShape().signals.recentMinutes7d,
        },
    }
}

function planShape() {
    return {
        goalMinutes: 15,
        remainingMinutes: 10,
        dueSrsCount: 12,
        recentMinutes7d: 40,
        signals: {
            recentMinutes7d: 40,
        },
    }
}

function context(overrides: Partial<ReturnType<typeof contextShape>> = {}) {
    return {
        ...contextShape(),
        ...overrides,
    }
}

function contextShape() {
    return {
        currentStreak: 3,
        totalXp: 500,
        srsDueCount: 0,
    }
}
