import { beforeEach, describe, expect, it, vi } from 'vitest'

const {
    getServerUserMock,
    transactionMock,
    findProgressMock,
    createProgressMock,
    updateProgressMock,
    recordLearningActivityMock,
    invalidateLearnerProgressCachesMock,
    recordAnalyticsEventMock,
    getLearningQuestMasteryPayloadMock,
} = vi.hoisted(() => ({
    getServerUserMock: vi.fn(),
    transactionMock: vi.fn(),
    findProgressMock: vi.fn(),
    createProgressMock: vi.fn(),
    updateProgressMock: vi.fn(),
    recordLearningActivityMock: vi.fn(),
    invalidateLearnerProgressCachesMock: vi.fn(),
    recordAnalyticsEventMock: vi.fn(),
    getLearningQuestMasteryPayloadMock: vi.fn(),
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
    calculateSpeakingXp: vi.fn(() => 12),
    recordLearningActivity: recordLearningActivityMock,
}))

vi.mock('@/lib/progress/cache-invalidation', () => ({
    invalidateLearnerProgressCaches: invalidateLearnerProgressCachesMock,
}))

vi.mock('@/lib/analytics/events', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@/lib/analytics/events')>()
    return {
        ...actual,
        recordAnalyticsEvent: recordAnalyticsEventMock,
    }
})

vi.mock('@/lib/gamification/skill-mastery-data', () => ({
    getLearningQuestMasteryPayload: getLearningQuestMasteryPayloadMock,
}))

import { POST } from './route'

describe('POST /api/v1/speaking/progress', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        getServerUserMock.mockResolvedValue({ userId: 'user-1', role: 'LEARNER' })
        findProgressMock.mockResolvedValue(null)
        createProgressMock.mockResolvedValue({ id: 'speaking-progress-1' })
        updateProgressMock.mockResolvedValue({ id: 'speaking-progress-1' })
        recordLearningActivityMock.mockResolvedValue({
            xpEarned: 12,
            streak: {
                currentStreak: 3,
                isNewDay: true,
                freezeUsed: false,
                freezesAvailable: 0,
                freezesUsed: 0,
            },
        })
        recordAnalyticsEventMock.mockResolvedValue({ id: 'event-1' })
        getLearningQuestMasteryPayloadMock.mockResolvedValue({
            badgeReceiptState: 'newly_unlocked',
            badgeReceipt: {
                id: 'speaking-starter',
                title: 'Speaking Starter',
                description: 'Complete speaking quests.',
                category: 'skill',
                progress: 100,
                requirement: '1 speaking completion',
                unlocked: true,
                receiptState: 'newly_unlocked',
            },
        })
        invalidateLearnerProgressCachesMock.mockResolvedValue(undefined)
        transactionMock.mockImplementation(async (callback: (tx: any) => Promise<any>) =>
            callback({
                speakingProgress: {
                    findFirst: findProgressMock,
                    create: createProgressMock,
                    update: updateProgressMock,
                },
            }),
        )
    })

    it('returns speaking episode receipt and persistent badge payload for valid nachsprechen metadata', async () => {
        const response = await POST(request({
            lessonId: 'S-A1-001',
            score: 82,
            maxScore: 100,
            stars: 2,
            questEpisode: {
                episodeId: 'speaking-episode:A1:S-A1-001',
                skill: 'speaking',
                sourceId: 'S-A1-001',
                cefrLevel: 'A1',
                checkpointCount: 3,
                completedCheckpoints: 3,
                nextEpisodeHref: '/speaking/S-A1-002',
                exerciseType: 'nachsprechen',
                pronunciationFeedbackState: 'evaluated',
            },
        }))

        expect(response.status).toBe(200)
        await expect(response.json()).resolves.toMatchObject({
            ok: true,
            saved: true,
            xpEarned: 12,
            questEpisodeReceipt: {
                episodeId: 'speaking-episode:A1:S-A1-001',
                skill: 'speaking',
                lessonId: 'S-A1-001',
                scoreBand: 'clear',
                pronunciationFeedbackState: 'evaluated',
                completedCheckpoints: 3,
                checkpointCount: 3,
                nextEpisodeHref: '/speaking/S-A1-002',
            },
            badgeReceiptState: 'newly_unlocked',
            badgeReceipt: expect.objectContaining({ id: 'speaking-starter' }),
        })
        expect(recordLearningActivityMock).toHaveBeenCalledWith(
            expect.anything(),
            expect.objectContaining({
                userId: 'user-1',
                lessonId: 'S-A1-001',
                score: 82,
                percentScore: 82,
                xpEarned: 12,
                analytics: expect.objectContaining({
                    actionType: 'speaking_submission',
                    source: 'speaking.progress',
                    metadata: {
                        first_completion: true,
                        episode_id: 'speaking-episode:A1:S-A1-001',
                        checkpoint_count: 3,
                    },
                }),
            }),
        )
        expect(recordAnalyticsEventMock).toHaveBeenCalledWith(
            expect.anything(),
            expect.objectContaining({
                eventName: 'quest_episode_completed',
                source: 'speaking.quest_episode.completed',
                actionId: 'speaking-episode:A1:S-A1-001',
                skill: 'speaking',
                metadata: expect.objectContaining({
                    episodeId: 'speaking-episode:A1:S-A1-001',
                    skill: 'speaking',
                    lessonId: 'S-A1-001',
                    checkpointId: 'refine',
                    accuracyBand: 'clear',
                    feedbackState: 'evaluated',
                }),
            }),
        )
        expect(getLearningQuestMasteryPayloadMock).toHaveBeenCalledWith(expect.objectContaining({
            userId: 'user-1',
            skill: 'speaking',
            currentLevel: 'A1',
            sourceActionId: 'speaking-progress-1',
            sourceActionType: 'speaking_submission',
            source: 'speaking.progress',
            persistBadgeUnlock: true,
        }))
    })

    it('ignores mismatched quest episode metadata', async () => {
        const response = await POST(request({
            lessonId: 'S-A1-001',
            score: 75,
            maxScore: 100,
            stars: 2,
            questEpisode: {
                episodeId: 'speaking-episode:A1:OTHER',
                skill: 'speaking',
                sourceId: 'OTHER',
                cefrLevel: 'A1',
                checkpointCount: 3,
                exerciseType: 'nachsprechen',
            },
        }))

        expect(response.status).toBe(200)
        const body = await response.json()
        expect(body.questEpisodeReceipt).toBeUndefined()
        expect(recordAnalyticsEventMock).not.toHaveBeenCalledWith(
            expect.anything(),
            expect.objectContaining({ eventName: 'quest_episode_completed' }),
        )
        expect(getLearningQuestMasteryPayloadMock).toHaveBeenCalledWith({
            userId: 'user-1',
            skill: 'speaking',
            currentLevel: undefined,
        })
    })

    it('does not record learning activity, badge unlock, or completed episode for zero-score evaluation failure', async () => {
        const response = await POST(request({
            lessonId: 'S-A1-001',
            score: 0,
            maxScore: 100,
            stars: 0,
            questEpisode: {
                episodeId: 'speaking-episode:A1:S-A1-001',
                skill: 'speaking',
                sourceId: 'S-A1-001',
                cefrLevel: 'A1',
                checkpointCount: 3,
                exerciseType: 'nachsprechen',
                pronunciationFeedbackState: 'failed',
            },
        }))

        expect(response.status).toBe(200)
        const body = await response.json()
        expect(body.xpEarned).toBe(0)
        expect(body.questEpisodeReceipt).toBeUndefined()
        expect(recordLearningActivityMock).not.toHaveBeenCalled()
        expect(recordAnalyticsEventMock).not.toHaveBeenCalled()
        expect(getLearningQuestMasteryPayloadMock).toHaveBeenCalledWith({
            userId: 'user-1',
            skill: 'speaking',
            currentLevel: undefined,
        })
    })

    it('rejects unauthenticated requests', async () => {
        getServerUserMock.mockResolvedValueOnce(null)

        const response = await POST(request({
            lessonId: 'S-A1-001',
            score: 82,
            maxScore: 100,
            stars: 2,
        }))

        expect(response.status).toBe(401)
        expect(recordLearningActivityMock).not.toHaveBeenCalled()
    })
})

function request(body: unknown) {
    return {
        json: async () => body,
    } as any
}
