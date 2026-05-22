import { beforeEach, describe, expect, it, vi } from 'vitest'

const {
    getServerUserMock,
    findExerciseMock,
    createAttemptMock,
    transactionMock,
    handleApiErrorMock,
    recordLearningActivityMock,
    invalidateLearnerProgressCachesMock,
    recordAnalyticsEventMock,
    getLearningQuestMasteryPayloadMock,
    gradeWritingMock,
    cookiesMock,
} = vi.hoisted(() => ({
    getServerUserMock: vi.fn(),
    findExerciseMock: vi.fn(),
    createAttemptMock: vi.fn(),
    transactionMock: vi.fn(),
    handleApiErrorMock: vi.fn((error: unknown) =>
        Response.json(
            {
                success: false,
                error: {
                    code: 'TEST_ERROR',
                    message: error instanceof Error ? error.message : String(error),
                },
            },
            { status: 500 },
        ),
    ),
    recordLearningActivityMock: vi.fn(),
    invalidateLearnerProgressCachesMock: vi.fn(),
    recordAnalyticsEventMock: vi.fn(),
    getLearningQuestMasteryPayloadMock: vi.fn(),
    gradeWritingMock: vi.fn(),
    cookiesMock: vi.fn(),
}))

vi.mock('@/lib/auth/server-auth', () => ({
    getServerUser: getServerUserMock,
}))

vi.mock('@/lib/api/error-handler', () => ({
    handleApiError: handleApiErrorMock,
}))

vi.mock('@fuxie/database', () => ({
    prisma: {
        writingExercise: {
            findUnique: findExerciseMock,
        },
        $transaction: transactionMock,
    },
}))

vi.mock('next/headers', () => ({
    cookies: cookiesMock,
}))

vi.mock('@/lib/progress/learning-activity', () => ({
    calculateWritingXp: vi.fn(() => 18),
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

vi.mock('../../grade/route', () => ({
    gradeWriting: gradeWritingMock,
}))

import { POST } from './route'

describe('POST /api/v1/writing/submit', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        getServerUserMock.mockResolvedValue({ userId: 'user-1', role: 'LEARNER' })
        findExerciseMock.mockResolvedValue({
            id: 'writing-db-id',
            exerciseId: 'W-A1-EMAIL-001',
            cefrLevel: 'A1',
            textType: 'E-Mail',
            register: 'informell',
            situation: 'Antworten Sie auf eine Einladung.',
            contentPoints: ['Dank', 'Termin', 'Frage'],
            minWords: 40,
            maxWords: 80,
            rubricJson: { criteria: [] },
        })
        createAttemptMock.mockResolvedValue({ id: 'attempt-writing-1', wordCount: 44 })
        recordLearningActivityMock.mockResolvedValue({
            xpEarned: 18,
            streak: {
                currentStreak: 2,
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
                id: 'writing-starter',
                title: 'Viet Starter',
                description: 'Hoàn thành writing quests.',
                category: 'skill',
                progress: 100,
                requirement: '2 writing completions',
                unlocked: true,
                receiptState: 'newly_unlocked',
            },
        })
        invalidateLearnerProgressCachesMock.mockResolvedValue(undefined)
        transactionMock.mockImplementation(async (callback: (tx: any) => Promise<any>) =>
            callback({
                writingAttempt: {
                    create: createAttemptMock,
                },
            }),
        )
        cookiesMock.mockReturnValue({
            get: vi.fn(() => ({ value: 'vi' })),
        })
        gradeWritingMock.mockResolvedValue(aiSuccessResponse())
    })

    it('returns a writing episode receipt and persistent badge payload after graded completion', async () => {
        const response = await POST({
            json: async () => ({
                exerciseId: 'W-A1-EMAIL-001',
                submittedText: 'Hallo Anna, danke fuer die Einladung. Ich komme gerne am Samstag.',
                wordCount: 44,
                timeSpentSeconds: 180,
                questEpisode: {
                    episodeId: 'writing-episode:A1:W-A1-EMAIL-001',
                    skill: 'writing',
                    sourceId: 'W-A1-EMAIL-001',
                    cefrLevel: 'A1',
                    checkpointCount: 3,
                    completedCheckpoints: 3,
                    nextEpisodeHref: '/writing',
                },
            }),
        } as any)

        expect(response.status).toBe(200)
        await expect(response.json()).resolves.toMatchObject({
            success: true,
            data: {
                attemptId: 'attempt-writing-1',
                xpEarned: 18,
                questEpisodeReceipt: {
                    episodeId: 'writing-episode:A1:W-A1-EMAIL-001',
                    skill: 'writing',
                    exerciseId: 'W-A1-EMAIL-001',
                    accuracyBand: 'clear',
                    scoreBand: 'clear',
                    feedbackSummaryState: 'generated',
                    completedCheckpoints: 3,
                    checkpointCount: 3,
                    recommendedAction: 'next_episode',
                },
                badgeReceiptState: 'newly_unlocked',
                badgeReceipt: expect.objectContaining({ id: 'writing-starter' }),
            },
        })

        expect(recordLearningActivityMock).toHaveBeenCalledWith(
            expect.anything(),
            expect.objectContaining({
                userId: 'user-1',
                exerciseId: 'W-A1-EMAIL-001',
                score: 7,
                maxScore: 10,
                percentScore: 70,
                xpEarned: 18,
                exercisesCompleted: 1,
                analytics: expect.objectContaining({
                    actionType: 'writing_submission',
                    source: 'writing.submit',
                    metadata: {
                        word_count: 44,
                        episode_id: 'writing-episode:A1:W-A1-EMAIL-001',
                        checkpoint_count: 3,
                    },
                }),
            }),
        )
        expect(getLearningQuestMasteryPayloadMock).toHaveBeenCalledWith(expect.objectContaining({
            userId: 'user-1',
            skill: 'writing',
            currentLevel: 'A1',
            sourceActionId: 'attempt-writing-1',
            sourceActionType: 'writing_submission',
            source: 'writing.submit',
            persistBadgeUnlock: true,
        }))
        expect(recordAnalyticsEventMock).toHaveBeenCalledWith(
            expect.anything(),
            expect.objectContaining({
                eventName: 'quest_episode_completed',
                source: 'writing.quest_episode.completed',
                actionId: 'writing-episode:A1:W-A1-EMAIL-001',
                skill: 'writing',
                metadata: expect.objectContaining({
                    episodeId: 'writing-episode:A1:W-A1-EMAIL-001',
                    skill: 'writing',
                    exerciseId: 'W-A1-EMAIL-001',
                    accuracyBand: 'clear',
                    feedbackState: 'generated',
                }),
            }),
        )
    })

    it('ignores mismatched writing episode metadata', async () => {
        const response = await POST({
            json: async () => ({
                exerciseId: 'W-A1-EMAIL-001',
                submittedText: 'Hallo Anna, danke fuer die Einladung. Ich komme gerne am Samstag.',
                questEpisode: {
                    episodeId: 'writing-episode:A1:OTHER',
                    skill: 'writing',
                    sourceId: 'OTHER',
                    cefrLevel: 'A1',
                    checkpointCount: 3,
                },
            }),
        } as any)

        expect(response.status).toBe(200)
        const body = await response.json()
        expect(body.data.questEpisodeReceipt).toBeUndefined()
        expect(recordAnalyticsEventMock).not.toHaveBeenCalledWith(
            expect.anything(),
            expect.objectContaining({ eventName: 'quest_episode_completed' }),
        )
    })

    it('does not award learning progress, badge, or completed episode when AI grading fails', async () => {
        gradeWritingMock.mockRejectedValueOnce(new Error('bad gateway'))

        const response = await POST({
            json: async () => ({
                exerciseId: 'W-A1-EMAIL-001',
                submittedText: 'Hallo Anna, danke fuer die Einladung.',
                questEpisode: {
                    episodeId: 'writing-episode:A1:W-A1-EMAIL-001',
                    skill: 'writing',
                    sourceId: 'W-A1-EMAIL-001',
                    cefrLevel: 'A1',
                    checkpointCount: 3,
                },
            }),
        } as any)

        expect(response.status).toBe(502)
        expect(recordLearningActivityMock).not.toHaveBeenCalled()
        expect(createAttemptMock).not.toHaveBeenCalled()
        expect(getLearningQuestMasteryPayloadMock).not.toHaveBeenCalled()
        expect(recordAnalyticsEventMock).toHaveBeenCalledWith(
            expect.anything(),
            expect.objectContaining({
                eventName: 'ai_feedback_failed',
                metadata: expect.objectContaining({
                    flow: 'writing',
                    error_type: 'service_status',
                    episode_id: 'writing-episode:A1:W-A1-EMAIL-001',
                }),
            }),
        )
        expect(recordAnalyticsEventMock).not.toHaveBeenCalledWith(
            expect.anything(),
            expect.objectContaining({ eventName: 'quest_episode_completed' }),
        )
    })
})

function aiSuccessResponse() {
    return {
        ok: true,
        json: vi.fn().mockResolvedValue({
            success: true,
            data: {
                totalScore: 7,
                maxScore: 10,
                percentScore: 70,
                estimatedLevel: 'A1',
                overallFeedback: 'Clear response. Revise word order in one sentence.',
                criteria: [
                    { id: 'Inhalt', name: 'Inhalt', score: 4, maxScore: 5 },
                    { id: 'Korrektheit', name: 'Korrektheit', score: 3, maxScore: 5 },
                ],
                corrections: [],
            },
        }),
    }
}
