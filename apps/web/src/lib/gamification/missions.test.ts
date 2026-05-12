import { describe, expect, it } from 'vitest'
import { MissionMetric, MissionPeriod } from '@fuxie/database'

import { buildMissionBoard } from './missions'

const wallet = {
    balance: 25,
    lifetimeEarned: 25,
    lifetimeSpent: 0,
}

describe('mission board builder', () => {
    it('builds daily, monthly, and quarterly progress with claimable states', () => {
        const board = buildMissionBoard({
            now: new Date('2026-04-29T08:00:00.000Z'),
            wallet,
            totalXp: 450,
            examAttempts: 1,
            claims: [],
            activities: [
                {
                    date: new Date('2026-04-29T00:00:00.000Z'),
                    totalMinutes: 18,
                    xpEarned: 45,
                    lessonsCompleted: 1,
                    exercisesCompleted: 3,
                    srsReviewed: 4,
                },
                {
                    date: new Date('2026-04-15T00:00:00.000Z'),
                    totalMinutes: 20,
                    xpEarned: 30,
                    lessonsCompleted: 0,
                    exercisesCompleted: 1,
                    srsReviewed: 0,
                },
            ],
            definitions: [
                {
                    id: 'mission-daily',
                    slug: 'daily-study-15',
                    period: MissionPeriod.DAILY,
                    title: '15 minutes',
                    description: 'Study today',
                    metric: MissionMetric.STUDY_MINUTES,
                    targetValue: 15,
                    href: '/dashboard',
                    xpReward: 15,
                    fucoinReward: 10,
                    sortOrder: 1,
                },
                {
                    id: 'mission-monthly',
                    slug: 'monthly-active-2',
                    period: MissionPeriod.MONTHLY,
                    title: '2 active days',
                    description: 'Study in the month',
                    metric: MissionMetric.ACTIVE_DAYS,
                    targetValue: 2,
                    href: '/dashboard',
                    xpReward: 50,
                    fucoinReward: 30,
                    sortOrder: 1,
                },
                {
                    id: 'mission-quarterly',
                    slug: 'quarterly-exam-2',
                    period: MissionPeriod.QUARTERLY,
                    title: '2 exams',
                    description: 'Attempt exams',
                    metric: MissionMetric.EXAM_ATTEMPTS,
                    targetValue: 2,
                    href: '/exam',
                    xpReward: 100,
                    fucoinReward: 80,
                    sortOrder: 1,
                },
            ],
        })

        expect(board.wallet).toEqual(wallet)
        expect(board.xpLevel.level).toBe(3)
        expect(board.missions.find((mission) => mission.slug === 'daily-study-15')).toMatchObject({
            period: 'daily',
            periodKey: '2026-04-29',
            progress: 100,
            currentValue: 18,
            status: 'claimable',
        })
        expect(board.missions.find((mission) => mission.slug === 'monthly-active-2')).toMatchObject({
            period: 'monthly',
            periodKey: '2026-04',
            progress: 100,
            currentValue: 2,
            status: 'claimable',
        })
        expect(board.missions.find((mission) => mission.slug === 'quarterly-exam-2')).toMatchObject({
            period: 'quarterly',
            periodKey: '2026-Q2',
            progress: 50,
            currentValue: 1,
            status: 'active',
        })
    })

    it('marks already claimed period missions without changing progress', () => {
        const board = buildMissionBoard({
            now: new Date('2026-04-29T08:00:00.000Z'),
            wallet,
            totalXp: 0,
            examAttempts: 0,
            activities: [
                {
                    date: new Date('2026-04-29T00:00:00.000Z'),
                    totalMinutes: 30,
                    xpEarned: 10,
                    lessonsCompleted: 0,
                    exercisesCompleted: 0,
                    srsReviewed: 0,
                },
            ],
            claims: [{ missionId: 'mission-daily', periodKey: '2026-04-29' }],
            definitions: [
                {
                    id: 'mission-daily',
                    slug: 'daily-study-15',
                    period: MissionPeriod.DAILY,
                    title: '15 minutes',
                    description: 'Study today',
                    metric: MissionMetric.STUDY_MINUTES,
                    targetValue: 15,
                    href: '/dashboard',
                    xpReward: 15,
                    fucoinReward: 10,
                    sortOrder: 1,
                },
            ],
        })

        expect(board.missions[0]).toMatchObject({
            progress: 100,
            status: 'claimed',
        })
        expect(board.periods[0]?.claimableCount).toBe(0)
    })
})
