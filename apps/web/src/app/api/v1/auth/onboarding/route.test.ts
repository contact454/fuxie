import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const {
    withDbAuthMock,
    userProfileUpdateMock,
    learningPathUpdateManyMock,
    recordAnalyticsEventMock,
} = vi.hoisted(() => ({
    withDbAuthMock: vi.fn(),
    userProfileUpdateMock: vi.fn(),
    learningPathUpdateManyMock: vi.fn(),
    recordAnalyticsEventMock: vi.fn(),
}))

vi.mock('@/lib/auth/middleware', () => ({
    withDbAuth: withDbAuthMock,
    AuthError: class AuthError extends Error {},
    NotFoundError: class NotFoundError extends Error {},
}))

vi.mock('@fuxie/database', () => ({
    prisma: {
        userProfile: {
            update: userProfileUpdateMock,
        },
        learningPath: {
            updateMany: learningPathUpdateManyMock,
        },
    },
}))

vi.mock('@/lib/analytics/events', () => ({
    recordAnalyticsEvent: recordAnalyticsEventMock,
}))

import { PATCH } from './route'

describe('PATCH /api/v1/auth/onboarding', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        withDbAuthMock.mockResolvedValue({
            userId: 'db-learner-1',
            role: 'LEARNER',
        })
        userProfileUpdateMock.mockResolvedValue({})
        learningPathUpdateManyMock.mockResolvedValue({ count: 1 })
        recordAnalyticsEventMock.mockResolvedValue({ id: 'analytics-1' })
    })

    it('saves onboarding profile data including daily study minutes', async () => {
        const response = await PATCH(onboardingRequest({
            estimatedLevel: 'A1',
            targetLevel: 'B1',
            targetExam: 'GOETHE',
            targetExamDate: '2026-06-01T00:00:00.000Z',
            studyGoalMinutes: 20,
        }))

        expect(response.status).toBe(200)
        await expect(response.json()).resolves.toEqual({ success: true })
        expect(userProfileUpdateMock).toHaveBeenCalledWith({
            where: { userId: 'db-learner-1' },
            data: {
                currentLevel: 'A1',
                targetLevel: 'B1',
                targetExam: 'GOETHE',
                targetExamDate: new Date('2026-06-01T00:00:00.000Z'),
                studyGoalMinutes: 20,
                onboardingCompleted: true,
            },
        })
        expect(learningPathUpdateManyMock).toHaveBeenCalledWith({
            where: { userId: 'db-learner-1' },
            data: {
                currentCefrLevel: 'A1',
                targetCefrLevel: 'B1',
                targetExamType: 'GOETHE',
            },
        })
        expect(recordAnalyticsEventMock).toHaveBeenCalledWith(
            expect.anything(),
            {
                userId: 'db-learner-1',
                role: 'LEARNER',
                eventName: 'onboarding_completed',
                source: 'onboarding.wizard',
                level: 'A1',
                metadata: {
                    estimated_level: 'A1',
                    target_level: 'B1',
                    target_exam: 'GOETHE',
                    daily_study_minutes: 20,
                },
            }
        )
    })

    it('rejects unsupported daily study minutes before writing profile data', async () => {
        const response = await PATCH(onboardingRequest({
            estimatedLevel: 'A1',
            targetLevel: 'B1',
            targetExam: null,
            targetExamDate: null,
            studyGoalMinutes: 15,
        }))

        expect(response.status).toBe(400)
        expect(userProfileUpdateMock).not.toHaveBeenCalled()
        expect(learningPathUpdateManyMock).not.toHaveBeenCalled()
        expect(recordAnalyticsEventMock).not.toHaveBeenCalled()
    })
})

function onboardingRequest(body: unknown) {
    return new NextRequest('http://localhost/api/v1/auth/onboarding', {
        method: 'PATCH',
        body: JSON.stringify(body),
        headers: { 'content-type': 'application/json' },
    })
}
