import { describe, expect, it, vi } from 'vitest'
import { deriveAndRecordActivation } from './events'

describe('deriveAndRecordActivation', () => {
    it('creates one activation event when a learner completes a meaningful action within 24 hours', async () => {
        const onboardingAt = new Date('2026-05-12T08:00:00.000Z')
        const completionAt = new Date('2026-05-12T10:30:00.000Z')
        const createMock = vi.fn().mockResolvedValue({ id: 'activation-1' })
        const findFirstMock = vi.fn()
            .mockResolvedValueOnce(null)
            .mockResolvedValueOnce(event({ eventName: 'onboarding_completed', createdAt: onboardingAt }))
            .mockResolvedValueOnce(event({
                eventName: 'meaningful_action_completed',
                createdAt: completionAt,
                actionId: 'A1-T1-001',
                actionType: 'reading_task',
                level: 'A1',
                skill: 'LESEN',
                source: 'reading.submit',
            }))

        const result = await deriveAndRecordActivation({
            userId: 'learner-1',
            db: dbMock(findFirstMock, createMock),
        })

        expect(result).toMatchObject({ activated: true, reason: 'created' })
        expect(createMock).toHaveBeenCalledWith({
            data: expect.objectContaining({
                userId: 'learner-1',
                role: 'LEARNER',
                eventName: 'activation_completed',
                source: 'activation.derivation',
                actionId: 'A1-T1-001',
                actionType: 'reading_task',
                level: 'A1',
                skill: 'LESEN',
                metadata: {
                    activation_action_type: 'reading_task',
                    hours_to_activation: 2.5,
                    cohort_date: '2026-05-12',
                    activation_source: 'reading.submit',
                },
            }),
        })
    })

    it('does not create activation when completion is outside the 24-hour window', async () => {
        const onboardingAt = new Date('2026-05-12T08:00:00.000Z')
        const createMock = vi.fn()
        const findFirstMock = vi.fn()
            .mockResolvedValueOnce(null)
            .mockResolvedValueOnce(event({ eventName: 'onboarding_completed', createdAt: onboardingAt }))
            .mockResolvedValueOnce(null)

        const result = await deriveAndRecordActivation({
            userId: 'learner-1',
            db: dbMock(findFirstMock, createMock),
        })

        expect(result).toEqual({ activated: false, reason: 'missing_completion', event: null })
        expect(findFirstMock).toHaveBeenLastCalledWith(expect.objectContaining({
            where: expect.objectContaining({
                createdAt: {
                    gte: onboardingAt,
                    lte: new Date('2026-05-13T08:00:00.000Z'),
                },
            }),
        }))
        expect(createMock).not.toHaveBeenCalled()
    })

    it('does not create duplicate activation events', async () => {
        const createMock = vi.fn()
        const existing = event({ eventName: 'activation_completed' })
        const findFirstMock = vi.fn().mockResolvedValueOnce(existing)

        const result = await deriveAndRecordActivation({
            userId: 'learner-1',
            db: dbMock(findFirstMock, createMock),
        })

        expect(result).toEqual({ activated: false, reason: 'already_activated', event: existing })
        expect(createMock).not.toHaveBeenCalled()
    })

    it('requires learner onboarding and excludes non-learner roles from activation', async () => {
        const createMock = vi.fn()
        const findFirstMock = vi.fn()
            .mockResolvedValueOnce(null)
            .mockResolvedValueOnce(null)

        const result = await deriveAndRecordActivation({
            userId: 'teacher-1',
            db: dbMock(findFirstMock, createMock),
        })

        expect(result).toEqual({ activated: false, reason: 'missing_onboarding', event: null })
        expect(findFirstMock).toHaveBeenNthCalledWith(2, expect.objectContaining({
            where: expect.objectContaining({
                userId: 'teacher-1',
                role: 'LEARNER',
                eventName: 'onboarding_completed',
            }),
        }))
        expect(createMock).not.toHaveBeenCalled()
    })
})

function dbMock(findFirst: ReturnType<typeof vi.fn>, create: ReturnType<typeof vi.fn>) {
    return {
        analyticsEvent: {
            findFirst,
            create,
        },
    } as any
}

function event(overrides: Record<string, unknown>) {
    return {
        id: 'event-1',
        userId: 'learner-1',
        role: 'LEARNER',
        eventName: 'onboarding_completed',
        source: null,
        sessionId: null,
        route: null,
        actionId: null,
        actionType: null,
        level: null,
        skill: null,
        metadata: null,
        createdAt: new Date('2026-05-12T08:00:00.000Z'),
        ...overrides,
    }
}
