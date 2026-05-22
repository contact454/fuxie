import { describe, expect, it } from 'vitest'

import {
    buildMasteryAdminReadout,
    buildSkillMasterySnapshot,
    normalizeMasterySkill,
} from './skill-mastery'

describe('buildSkillMasterySnapshot', () => {
    it('aggregates meaningful completions by skill and CEFR level', () => {
        const snapshot = buildSkillMasterySnapshot({
            currentLevel: 'A1',
            events: [
                event({ skill: 'reading', level: 'A1', metadata: { accuracy: 80 } }),
                event({ actionId: 'r2', skill: 'LESEN', level: 'A1', metadata: { accuracy: 90 } }),
                event({ actionId: 'g1', skill: 'GRAMMATIK', level: 'A2', metadata: { score: 70 } }),
            ],
        })

        expect(snapshot.summary).toMatchObject({
            totalMeaningfulCompletions: 3,
            activeDays: 1,
            strongestSkill: 'reading',
            skillsTouched: 2,
        })
        expect(snapshot.skills[0]).toMatchObject({
            skill: 'reading',
            cefrLevel: 'A1',
            completions: 2,
            qualityScore: 85,
            progress: 20,
        })
    })

    it('selects badge receipt and prevents duplicate badge receipts from earned slugs', () => {
        const firstSnapshot = buildSkillMasterySnapshot({
            events: [
                event({ skill: 'vocabulary', actionType: 'vocabulary_practice' }),
                event({ actionId: 'v2', skill: 'WORTSCHATZ', actionType: 'vocabulary_practice' }),
            ],
        })
        const duplicateSnapshot = buildSkillMasterySnapshot({
            earnedBadgeSlugs: ['first-quest', 'vocabulary-starter'],
            events: [
                event({ skill: 'vocabulary', actionType: 'vocabulary_practice' }),
                event({ actionId: 'v2', skill: 'WORTSCHATZ', actionType: 'vocabulary_practice' }),
            ],
        })

        expect(firstSnapshot.badgeReceipt?.id).toBe('first-quest')
        expect(firstSnapshot.nextBadgePreview?.unlocked).toBe(false)
        expect(duplicateSnapshot.badgeReceipt).toBeNull()
        expect(duplicateSnapshot.nextBadgePreview?.id).not.toBe('vocabulary-starter')
    })

    it('prioritizes the nearest next badge preview', () => {
        const snapshot = buildSkillMasterySnapshot({
            events: [
                event({ skill: 'reading', createdAt: new Date('2026-05-01T09:00:00.000Z') }),
                event({ actionId: 'g1', skill: 'grammar', createdAt: new Date('2026-05-02T09:00:00.000Z') }),
            ],
            earnedBadgeSlugs: ['first-quest'],
        })

        expect(snapshot.nextBadgePreview).toMatchObject({
            id: 'three-day-return',
            progress: 67,
        })
    })
})

describe('buildMasteryAdminReadout', () => {
    it('summarizes mastery events and badge unlock tracking', () => {
        const readout = buildMasteryAdminReadout([
            event({ userId: 'learner-1', skill: 'reading', level: 'A1' }),
            event({ userId: 'learner-2', skill: 'reading', level: 'A2' }),
            event({ userId: 'learner-2', skill: 'grammar', level: 'A2' }),
            event({
                userId: 'learner-1',
                eventName: 'badge_unlocked',
                actionId: 'badge-1',
                skill: 'reading',
                level: 'A1',
                metadata: { badgeId: 'first-quest', receiptState: 'newly_unlocked' },
            }),
            event({
                userId: 'learner-1',
                eventName: 'badge_unlocked',
                actionId: 'badge-duplicate',
                metadata: { badgeId: 'first-quest', duplicatePrevented: true },
            }),
            event({ userId: 'learner-1', eventName: 'mastery_progress_viewed' }),
            event({ userId: 'learner-1', eventName: 'badge_receipt_clicked' }),
        ])

        expect(readout).toMatchObject({
            badgeUnlocks: 2,
            persistentBadgeUnlocks: 1,
            duplicatePrevented: 1,
            viewed: 1,
            receiptClicks: 1,
            progressBySkill: [
                { key: 'reading', events: 2, users: 2 },
                { key: 'grammar', events: 1, users: 1 },
            ],
            progressByLevel: [
                { key: 'A2', events: 2, users: 1 },
                { key: 'A1', events: 1, users: 1 },
            ],
            badgeUnlocksByBadge: [{ key: 'first-quest', events: 2, users: 1 }],
            badgeUnlocksBySkill: [{ key: 'reading', events: 2, users: 1 }],
            badgeUnlocksByLevel: [{ key: 'A1', events: 2, users: 1 }],
        })
    })
})

describe('normalizeMasterySkill', () => {
    it('normalizes localized skill and action names', () => {
        expect(normalizeMasterySkill('WORTSCHATZ', null)).toBe('vocabulary')
        expect(normalizeMasterySkill(null, 'listening_task')).toBe('listening')
        expect(normalizeMasterySkill('GRAMMATIK', null)).toBe('grammar')
        expect(normalizeMasterySkill('unknown', null)).toBeNull()
    })
})

function event(overrides: Partial<Parameters<typeof buildSkillMasterySnapshot>[0]['events'][number]> = {}) {
    return {
        userId: 'learner-1',
        eventName: 'meaningful_action_completed',
        actionId: 'lesson-1',
        actionType: 'lesson_session',
        level: 'A1',
        skill: 'reading',
        metadata: null,
        createdAt: new Date('2026-05-01T09:00:00.000Z'),
        ...overrides,
    }
}
