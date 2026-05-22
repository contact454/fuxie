import { describe, expect, it, vi } from 'vitest'
import { getAiEvalReadout } from './ai-eval-readout'

describe('getAiEvalReadout', () => {
    it('summarizes safe AI feedback evidence by flow and quality signals', async () => {
        const findManyMock = vi.fn().mockResolvedValue([
            event({
                userId: 'learner-1',
                eventName: 'ai_feedback_generated',
                actionType: 'writing_submission',
                level: 'A2',
                skill: 'SCHREIBEN',
                metadata: {
                    flow: 'writing',
                    score_percent: 80,
                    estimated_level: 'A2',
                    correction_count: 2,
                    criteria_count: 4,
                },
            }),
            event({
                userId: 'learner-2',
                eventName: 'ai_feedback_generated',
                actionType: 'speaking_submission',
                level: 'B1',
                skill: 'SPRECHEN',
                metadata: {
                    flow: 'speaking',
                    score_percent: 60,
                    issue_count: 3,
                },
            }),
            event({
                userId: 'learner-1',
                eventName: 'ai_feedback_generated',
                skill: 'CHAT',
                metadata: {
                    flow: 'chat',
                    model: 'gemini-2.5-flash',
                    correction_count: 1,
                    suggested_followup_count: 2,
                },
            }),
            event({
                userId: 'learner-3',
                eventName: 'ai_feedback_failed',
                level: 'A1',
                skill: 'SCHREIBEN',
                metadata: {
                    flow: 'writing',
                    error_type: 'service_status',
                },
            }),
        ])

        const readout = await getAiEvalReadout({
            from: new Date('2026-05-12T00:00:00.000Z'),
            to: new Date('2026-05-18T23:59:59.999Z'),
            db: dbMock(findManyMock),
        })

        expect(readout).toMatchObject({
            counts: {
                aiEvalUsers: 3,
                generatedEvents: 3,
                generatedUsers: 2,
                failedEvents: 1,
                failedUsers: 1,
            },
            rates: {
                failureRate: 25,
            },
            quality: {
                writing: {
                    generatedEvents: 1,
                    averageScorePercent: 80,
                    medianScorePercent: 80,
                },
                speaking: {
                    generatedEvents: 1,
                    averageScorePercent: 60,
                },
                chat: {
                    generatedEvents: 1,
                    averageCorrectionCount: 1,
                    averageSuggestedFollowupCount: 2,
                },
                averageCorrectionCount: 1.5,
                averageIssueCount: 3,
            },
            splits: {
                failuresByErrorType: [
                    { key: 'service_status', events: 1, users: 1 },
                ],
                byModel: [
                    { key: 'unknown', events: 2, users: 2 },
                    { key: 'gemini-2.5-flash', events: 1, users: 1 },
                ],
            },
        })
        expect(findManyMock).toHaveBeenCalledWith(expect.objectContaining({
            where: expect.objectContaining({
                role: 'LEARNER',
                eventName: {
                    in: ['ai_feedback_generated', 'ai_feedback_failed'],
                },
            }),
        }))
    })
})

function dbMock(findMany: ReturnType<typeof vi.fn>) {
    return {
        analyticsEvent: {
            findMany,
        },
    } as any
}

function event(overrides: Record<string, unknown>) {
    return {
        id: `${overrides.userId ?? 'learner-1'}-${overrides.eventName ?? 'event'}`,
        userId: 'learner-1',
        role: 'LEARNER',
        eventName: 'ai_feedback_generated',
        source: null,
        sessionId: null,
        route: null,
        actionId: null,
        actionType: null,
        level: null,
        skill: null,
        metadata: null,
        createdAt: new Date('2026-05-12T10:00:00.000Z'),
        ...overrides,
    }
}
