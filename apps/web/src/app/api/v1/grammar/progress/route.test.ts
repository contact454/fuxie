import { beforeEach, describe, expect, it, vi } from 'vitest'

const {
    getServerUserMock,
    transactionMock,
    findProgressMock,
    createProgressMock,
    updateProgressMock,
    recordLearningActivityMock,
    awardLearningFucoinMock,
    invalidateLearnerProgressCachesMock,
    getTodayPlanMock,
} = vi.hoisted(() => ({
    getServerUserMock: vi.fn(),
    transactionMock: vi.fn(),
    findProgressMock: vi.fn(),
    createProgressMock: vi.fn(),
    updateProgressMock: vi.fn(),
    recordLearningActivityMock: vi.fn(),
    awardLearningFucoinMock: vi.fn(),
    invalidateLearnerProgressCachesMock: vi.fn(),
    getTodayPlanMock: vi.fn(),
}))

vi.mock('@/lib/auth/server-auth', () => ({
    getServerUser: getServerUserMock,
}))

vi.mock('@fuxie/database', () => ({
    prisma: {
        $transaction: transactionMock,
    },
}))

vi.mock('@/lib/progress/learning-activity', () => ({
    calculateGrammarXp: vi.fn((percentage: number) => (percentage >= 100 ? 15 : 10)),
    recordLearningActivity: recordLearningActivityMock,
}))

vi.mock('@/lib/progress/cache-invalidation', () => ({
    invalidateLearnerProgressCaches: invalidateLearnerProgressCachesMock,
}))

vi.mock('@/lib/gamification/fucoin', () => ({
    awardLearningFucoin: awardLearningFucoinMock,
}))

vi.mock('@/lib/personalization/today-plan', () => ({
    getTodayPlan: getTodayPlanMock,
}))

import { POST } from './route'

describe('POST /api/v1/grammar/progress', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        getServerUserMock.mockResolvedValue({ userId: 'user-1', role: 'LEARNER' })
        findProgressMock.mockResolvedValue(null)
        createProgressMock.mockResolvedValue({ id: 'grammar-progress-1' })
        updateProgressMock.mockResolvedValue({ id: 'grammar-progress-1' })
        recordLearningActivityMock.mockResolvedValue({
            xpEarned: 15,
            baseXpEarned: 15,
            streakBonusXp: 0,
            streak: {
                currentStreak: 3,
                isNewDay: true,
                freezeUsed: false,
                freezesAvailable: 1,
                freezesUsed: 0,
                freezeUsageId: null,
            },
        })
        awardLearningFucoinMock.mockResolvedValue({
            fucoinEarned: 7,
            walletBalance: 28,
            duplicate: false,
            intendedAmount: 7,
            dailyCap: 60,
            dailyEarnedBefore: 10,
            dailyRemainingAfter: 43,
            capReached: false,
        })
        invalidateLearnerProgressCachesMock.mockResolvedValue(undefined)
        getTodayPlanMock.mockResolvedValue({
            weakSkills: ['GRAMMATIK'],
            actions: [{ href: '/grammar', skill: 'GRAMMATIK', type: 'lesson' }],
        })
        transactionMock.mockImplementation(async (callback: (tx: any) => Promise<any>) =>
            callback({
                grammarProgress: {
                    findFirst: findProgressMock,
                    create: createProgressMock,
                    update: updateProgressMock,
                },
            })
        )
    })

    it('records grammar completion with a quest reward payload', async () => {
        const response = await POST({
            json: async () => ({
                lessonId: 'a1-word-order-1',
                score: 4,
                maxScore: 4,
                stars: 3,
            }),
        } as any)

        expect(response.status).toBe(200)
        await expect(response.json()).resolves.toMatchObject({
            ok: true,
            saved: true,
            xpEarned: 15,
            fucoinEarned: 7,
            walletBalance: 28,
            fucoinDailyEarned: 17,
            nextQuestHref: '/grammar',
            rewardPreview: [
                expect.objectContaining({ type: 'xp', label: '+15 XP' }),
                expect.objectContaining({ type: 'fucoin', label: '+7 Fucoin' }),
                expect.objectContaining({ type: 'streak' }),
            ],
            streakReceipt: {
                freezeUsed: false,
                currentStreak: 3,
                freezesAvailable: 1,
                freezesUsed: 0,
            },
        })

        expect(recordLearningActivityMock).toHaveBeenCalledWith(
            expect.anything(),
            expect.objectContaining({
                userId: 'user-1',
                lessonId: 'a1-word-order-1',
                percentScore: 100,
                xpEarned: 15,
                lessonsCompleted: 1,
                analytics: expect.objectContaining({
                    actionType: 'lesson_session',
                    skill: 'GRAMMATIK',
                    source: 'grammar.progress',
                }),
            })
        )
        expect(awardLearningFucoinMock).toHaveBeenCalledWith(
            expect.anything(),
            expect.objectContaining({
                userId: 'user-1',
                kind: 'lesson',
                sourceType: 'learning:grammar',
                sourceId: 'a1-word-order-1',
                accuracy: 100,
            })
        )
        expect(invalidateLearnerProgressCachesMock).toHaveBeenCalledWith('user-1')
    })

    it('returns a grammar quest episode receipt with learning-aware routing metadata', async () => {
        getTodayPlanMock.mockResolvedValueOnce({
            weakSkills: ['HOEREN'],
            actions: [{ href: '/listening/L-A1-001', skill: 'HOEREN', type: 'lesson' }],
        })

        const response = await POST({
            json: async () => ({
                lessonId: 'a1-word-order-1',
                score: 3,
                maxScore: 4,
                stars: 2,
                questEpisode: {
                    episodeId: 'grammar-episode:A1:a1-word-order-1',
                    skill: 'grammar',
                    sourceId: 'a1-word-order-1',
                    cefrLevel: 'A1',
                    checkpointCount: 3,
                    nextEpisodeHref: '/grammar',
                    currentEpisodeHref: '/grammar/a1-word-order/a1-word-order-1',
                },
            }),
        } as any)

        expect(response.status).toBe(200)
        await expect(response.json()).resolves.toMatchObject({
            questEpisodeReceipt: {
                episodeId: 'grammar-episode:A1:a1-word-order-1',
                skill: 'grammar',
                lessonId: 'a1-word-order-1',
                accuracyBand: 'clear',
                completedCheckpoints: 3,
                checkpointCount: 3,
                recommendedAction: 'next_episode',
                nextEpisodeHref: '/listening',
            },
            episodeRouting: {
                reason: 'weak_skill_priority',
                routedSkill: 'listening',
            },
        })

        expect(recordLearningActivityMock).toHaveBeenCalledWith(
            expect.anything(),
            expect.objectContaining({
                analytics: expect.objectContaining({
                    metadata: expect.objectContaining({
                        episode_id: 'grammar-episode:A1:a1-word-order-1',
                        checkpoint_count: 3,
                    }),
                }),
            })
        )
        expect(awardLearningFucoinMock).toHaveBeenCalledWith(
            expect.anything(),
            expect.objectContaining({
                metadata: expect.objectContaining({
                    episodeId: 'grammar-episode:A1:a1-word-order-1',
                    checkpointCount: 3,
                }),
            })
        )
    })

    it('returns 401 for anonymous learners', async () => {
        getServerUserMock.mockResolvedValueOnce(null)

        const response = await POST({ json: async () => ({}) } as any)

        expect(response.status).toBe(401)
        await expect(response.json()).resolves.toEqual({ error: 'unauthorized' })
    })
})
