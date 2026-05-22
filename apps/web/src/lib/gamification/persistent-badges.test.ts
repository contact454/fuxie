import { describe, expect, it, vi } from 'vitest'

import { getPersistentBadgeMasteryPayload } from './persistent-badges'

describe('getPersistentBadgeMasteryPayload', () => {
    it('persists a newly eligible pilot badge and emits badge_unlocked once', async () => {
        const db = dbMock({
            events: [event({ skill: 'vocabulary', actionType: 'vocabulary_practice' })],
            achievements: [],
            createManyCount: 1,
        })

        const payload = await getPersistentBadgeMasteryPayload({
            userId: 'learner-1',
            skill: 'vocabulary',
            currentLevel: 'A1',
            sourceActionId: 'attempt-1',
            sourceActionType: 'vocabulary_practice',
            source: 'vocabulary.practice.submit',
            db,
        })

        expect(payload.badgeReceipt).toMatchObject({
            id: 'first-quest',
            receiptState: 'newly_unlocked',
            unlocked: true,
        })
        expect(payload.badgeReceiptState).toBe('newly_unlocked')
        expect(db.achievement.upsert).toHaveBeenCalledWith(expect.objectContaining({
            where: { slug: 'first-quest' },
            create: expect.objectContaining({ slug: 'first-quest', xpReward: 0 }),
        }))
        expect(db.userAchievement.createMany).toHaveBeenCalledWith({
            data: [{ userId: 'learner-1', achievementId: 'achievement-1' }],
            skipDuplicates: true,
        })
        expect(db.analyticsEvent.create).toHaveBeenCalledWith({
            data: expect.objectContaining({
                userId: 'learner-1',
                eventName: 'badge_unlocked',
                actionId: 'first-quest',
                actionType: 'vocabulary_practice',
                skill: 'vocabulary',
                metadata: expect.objectContaining({
                    badgeId: 'first-quest',
                    sourceActionId: 'attempt-1',
                    receiptState: 'newly_unlocked',
                }),
            }),
        })
    })

    it('prevents duplicate badge persistence without emitting a second unlock event', async () => {
        const db = dbMock({
            events: [event({ skill: 'grammar', actionType: 'lesson_session' })],
            achievements: [],
            createManyCount: 0,
        })

        const payload = await getPersistentBadgeMasteryPayload({
            userId: 'learner-1',
            skill: 'grammar',
            currentLevel: 'A1',
            sourceActionId: 'grammar-1',
            sourceActionType: 'lesson_session',
            db,
        })

        expect(payload.badgeReceipt).toMatchObject({
            id: 'first-quest',
            receiptState: 'already_earned',
        })
        expect(payload.badgeReceiptState).toBe('already_earned')
        expect(db.analyticsEvent.create).not.toHaveBeenCalled()
    })

    it('falls back to preview when no new persistent badge is eligible', async () => {
        const db = dbMock({
            events: [event({ skill: 'reading', actionType: 'reading_task' })],
            achievements: [{ achievement: { slug: 'first-quest' } }],
            createManyCount: 1,
        })

        const payload = await getPersistentBadgeMasteryPayload({
            userId: 'learner-1',
            skill: 'reading',
            currentLevel: 'A1',
            sourceActionId: 'reading-1',
            sourceActionType: 'reading_task',
            db,
        })

        expect(payload.badgeReceipt).toBeNull()
        expect(payload.badgeReceiptState).toBe('preview')
        expect(payload.nextBadgePreview?.receiptState).toBe('preview')
        expect(db.userAchievement.createMany).not.toHaveBeenCalled()
    })
})

function dbMock(input: {
    events: ReturnType<typeof event>[]
    achievements: Array<{ achievement: { slug: string } }>
    createManyCount: number
}) {
    return {
        analyticsEvent: {
            findMany: vi.fn().mockResolvedValue(input.events),
            create: vi.fn().mockResolvedValue({ id: 'event-1' }),
        },
        userAchievement: {
            findMany: vi.fn().mockResolvedValue(input.achievements),
            createMany: vi.fn().mockResolvedValue({ count: input.createManyCount }),
        },
        achievement: {
            upsert: vi.fn().mockResolvedValue({ id: 'achievement-1', slug: 'first-quest' }),
        },
    } as any
}

function event(overrides: Record<string, unknown> = {}) {
    return {
        userId: 'learner-1',
        eventName: 'meaningful_action_completed',
        actionId: 'source-1',
        actionType: 'lesson_session',
        level: 'A1',
        skill: 'reading',
        metadata: null,
        createdAt: new Date('2026-05-01T09:00:00.000Z'),
        ...overrides,
    }
}
