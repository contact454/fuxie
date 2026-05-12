import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
    calculateExamXp,
    calculateGrammarXp,
    calculateListeningXp,
    calculateReadingXp,
    calculateSpeakingXp,
    calculateWritingXp,
    recordLearningActivity,
} from './learning-activity'

const FROZEN_NOW = new Date('2026-04-23T08:30:00.000Z')

function startOfProcessLocalDay(date: Date) {
    const day = new Date(date)
    day.setHours(0, 0, 0, 0)
    return day
}

describe('learning activity helpers', () => {
    it('uses standardized XP values per skill flow', () => {
        expect(calculateExamXp(false)).toBe(10)
        expect(calculateExamXp(true)).toBe(25)
        expect(calculateReadingXp(50)).toBe(10)
        expect(calculateReadingXp(100)).toBe(20)
        expect(calculateListeningXp(80)).toBe(10)
        expect(calculateListeningXp(100)).toBe(20)
        expect(calculateGrammarXp(80)).toBe(10)
        expect(calculateGrammarXp(100)).toBe(15)
        expect(calculateWritingXp()).toBe(15)
        expect(calculateSpeakingXp()).toBe(10)
    })
})

describe('recordLearningActivity', () => {
    beforeEach(() => {
        vi.useFakeTimers()
        vi.setSystemTime(FROZEN_NOW)
    })

    afterEach(() => {
        vi.useRealTimers()
    })

    it('creates a fresh streak and updates aggregate counters', async () => {
        const tx = {
            userStreak: {
                findUnique: vi.fn().mockResolvedValue(null),
                create: vi.fn().mockResolvedValue({}),
                update: vi.fn(),
            },
            streakFreezeUsage: {
                create: vi.fn(),
                findMany: vi.fn(),
            },
            dailyActivity: {
                upsert: vi.fn().mockResolvedValue({}),
            },
            userProfile: {
                updateMany: vi.fn().mockResolvedValue({ count: 1 }),
            },
            userProgress: {
                create: vi.fn().mockResolvedValue({}),
            },
        }

        const result = await recordLearningActivity(tx as unknown as Parameters<typeof recordLearningActivity>[0], {
            userId: 'user-1',
            lessonId: 'grammar:a1:01',
            score: 8,
            maxScore: 10,
            percentScore: 80,
            xpEarned: 10,
            timeSpentSeconds: 75,
            lessonsCompleted: 1,
        })

        expect(result).toEqual({
            xpEarned: 10,
            baseXpEarned: 10,
            streakBonusXp: 0,
            streak: {
                currentStreak: 1,
                isNewDay: true,
                freezeUsed: false,
                freezesAvailable: 1,
                freezesUsed: 0,
                freezeUsageId: null,
            },
        })

        expect(tx.userStreak.create).toHaveBeenCalledWith({
            data: expect.objectContaining({
                userId: 'user-1',
                currentStreak: 1,
                longestStreak: 1,
            }),
        })
        expect(tx.dailyActivity.upsert).toHaveBeenCalledWith({
            where: {
                userId_date: {
                    userId: 'user-1',
                    date: startOfProcessLocalDay(FROZEN_NOW),
                },
            },
            update: {
                xpEarned: { increment: 10 },
                totalMinutes: { increment: 2 },
                lessonsCompleted: { increment: 1 },
                exercisesCompleted: { increment: 0 },
                srsReviewed: { increment: 0 },
                wordsLearned: { increment: 0 },
            },
            create: {
                userId: 'user-1',
                date: startOfProcessLocalDay(FROZEN_NOW),
                xpEarned: 10,
                totalMinutes: 2,
                lessonsCompleted: 1,
                exercisesCompleted: 0,
                srsReviewed: 0,
                wordsLearned: 0,
            },
        })
        expect(tx.userProfile.updateMany).toHaveBeenCalledWith({
            where: { userId: 'user-1' },
            data: {
                totalXp: { increment: 10 },
                totalStudyMinutes: { increment: 2 },
                totalLessonsCompleted: { increment: 1 },
            },
        })
        expect(tx.userProgress.create).toHaveBeenCalledWith({
            data: {
                userId: 'user-1',
                lessonId: 'grammar:a1:01',
                exerciseId: null,
                score: 8,
                maxScore: 10,
                percentScore: 80,
                xpEarned: 10,
                timeSpentSeconds: 75,
            },
        })
    })

    it('applies the day-7 streak bonus on a continued streak', async () => {
        const tx = {
            userStreak: {
                findUnique: vi.fn().mockResolvedValue({
                    userId: 'user-1',
                    currentStreak: 6,
                    longestStreak: 6,
                    lastActivityDate: new Date('2026-04-22T00:00:00.000Z'),
                    freezesAvailable: 1,
                    freezesUsed: 0,
                }),
                create: vi.fn(),
                update: vi.fn().mockResolvedValue({}),
            },
            streakFreezeUsage: {
                create: vi.fn(),
                findMany: vi.fn(),
            },
            dailyActivity: {
                upsert: vi.fn().mockResolvedValue({}),
            },
            userProfile: {
                updateMany: vi.fn().mockResolvedValue({ count: 1 }),
            },
            userProgress: {
                create: vi.fn().mockResolvedValue({}),
            },
        }

        const result = await recordLearningActivity(tx as unknown as Parameters<typeof recordLearningActivity>[0], {
            userId: 'user-1',
            exerciseId: 'exam:a1:1',
            score: 18,
            maxScore: 20,
            percentScore: 90,
            xpEarned: 25,
            exercisesCompleted: 1,
        })

        expect(result.xpEarned).toBe(75)
        expect(result.baseXpEarned).toBe(25)
        expect(result.streakBonusXp).toBe(50)
        expect(result.streak).toEqual({
            currentStreak: 7,
            isNewDay: true,
            freezeUsed: false,
            freezesAvailable: 1,
            freezesUsed: 0,
            freezeUsageId: null,
        })

        expect(tx.userStreak.update).toHaveBeenCalledWith({
            where: { userId: 'user-1' },
            data: {
                currentStreak: 7,
                longestStreak: 7,
                lastActivityDate: startOfProcessLocalDay(FROZEN_NOW),
            },
        })
        expect(tx.userProfile.updateMany).toHaveBeenCalledWith({
            where: { userId: 'user-1' },
            data: {
                totalXp: { increment: 75 },
            },
        })
    })

    it('uses a Streak Freeze when the learner missed one day and reports a receipt', async () => {
        const tx = {
            userStreak: {
                findUnique: vi.fn().mockResolvedValue({
                    userId: 'user-1',
                    currentStreak: 4,
                    longestStreak: 6,
                    lastActivityDate: new Date('2026-04-21T00:00:00.000Z'),
                    freezesAvailable: 2,
                    freezesUsed: 1,
                }),
                create: vi.fn(),
                update: vi.fn().mockResolvedValue({}),
            },
            streakFreezeUsage: {
                create: vi.fn().mockResolvedValue({ id: 'freeze-usage-1' }),
                findMany: vi.fn(),
            },
            dailyActivity: {
                upsert: vi.fn().mockResolvedValue({}),
            },
            userProfile: {
                updateMany: vi.fn().mockResolvedValue({ count: 1 }),
            },
            userProgress: {
                create: vi.fn().mockResolvedValue({}),
            },
        }

        const result = await recordLearningActivity(tx as unknown as Parameters<typeof recordLearningActivity>[0], {
            userId: 'user-1',
            exerciseId: 'listening:a1:01',
            score: 4,
            maxScore: 5,
            percentScore: 80,
            xpEarned: 10,
            exercisesCompleted: 1,
        })

        expect(result.streak).toEqual({
            currentStreak: 5,
            isNewDay: true,
            freezeUsed: true,
            freezesAvailable: 1,
            freezesUsed: 2,
            freezeUsageId: 'freeze-usage-1',
        })
        expect(tx.userStreak.update).toHaveBeenCalledWith({
            where: { userId: 'user-1' },
            data: {
                currentStreak: 5,
                longestStreak: 6,
                lastActivityDate: startOfProcessLocalDay(FROZEN_NOW),
                freezesAvailable: { decrement: 1 },
                freezesUsed: { increment: 1 },
            },
        })
        expect(tx.streakFreezeUsage.create).toHaveBeenCalledWith({
            data: expect.objectContaining({
                userId: 'user-1',
                usedAt: startOfProcessLocalDay(FROZEN_NOW),
                protectedStreak: 5,
                freezesRemaining: 1,
                freezesUsedTotal: 2,
                missedDays: 1,
                sourceType: 'exercise',
                sourceId: 'listening:a1:01',
            }),
            select: { id: true },
        })
    })
})
