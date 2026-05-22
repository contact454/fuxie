import { afterEach, describe, expect, it, vi } from 'vitest'
import { MissionMetric, MissionPeriod, prisma } from '@fuxie/database'

import { buildMissionBoard, claimMissionReward } from './missions'

const wallet = {
    balance: 25,
    lifetimeEarned: 25,
    lifetimeSpent: 0,
}

describe('mission board builder', () => {
    afterEach(() => {
        vi.restoreAllMocks()
    })

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

    it('records mission claimed analytics only after a successful claim', async () => {
        const tx = {
            userMissionClaim: {
                create: vi.fn().mockResolvedValue({}),
            },
            userProfile: {
                updateMany: vi.fn().mockResolvedValue({ count: 1 }),
            },
            dailyActivity: {
                upsert: vi.fn().mockResolvedValue({}),
            },
            fucoinLedger: {
                create: vi.fn().mockResolvedValue({}),
            },
            userWallet: {
                upsert: vi.fn().mockResolvedValue({ balance: 35 }),
                findUnique: vi.fn(),
            },
            analyticsEvent: {
                create: vi.fn().mockResolvedValue({ id: 'event-1' }),
            },
        }

        mockMissionBoardDependencies({
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
            claims: [],
            tx,
        })

        const result = await claimMissionReward('user-1', 'daily-study-15', new Date('2026-04-29T08:00:00.000Z'))

        expect(result.claimed).toBe(true)
        expect(tx.analyticsEvent.create).toHaveBeenCalledWith({
            data: expect.objectContaining({
                userId: 'user-1',
                role: 'LEARNER',
                eventName: 'mission_claimed',
                source: 'missions.claim',
                actionId: 'mission-daily',
                metadata: {
                    mission_id: 'mission-daily',
                    mission_slug: 'daily-study-15',
                    period: 'daily',
                    period_key: '2026-04-29',
                    xp_awarded: 15,
                    fucoin_awarded: 10,
                },
            }),
        })
    })

    it('does not record mission claimed analytics for already claimed missions', async () => {
        const tx = {
            analyticsEvent: {
                create: vi.fn(),
            },
        }

        mockMissionBoardDependencies({
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
            claims: [{ missionId: 'mission-daily', periodKey: '2026-04-29' }],
            tx,
        })

        const result = await claimMissionReward('user-1', 'daily-study-15', new Date('2026-04-29T08:00:00.000Z'))

        expect(result.claimed).toBe(false)
        expect(tx.analyticsEvent.create).not.toHaveBeenCalled()
    })
})

function mockMissionBoardDependencies(input: {
    definitions: Parameters<typeof buildMissionBoard>[0]['definitions']
    claims: Parameters<typeof buildMissionBoard>[0]['claims']
    tx: unknown
}) {
    vi.spyOn(prisma.userProfile, 'findUnique').mockResolvedValue({ totalXp: 450 } as never)
    vi.spyOn(prisma.userWallet, 'findUnique').mockResolvedValue(wallet as never)
    vi.spyOn(prisma.fucoinLedger, 'aggregate').mockResolvedValue({ _sum: { amount: 0 } } as never)
    vi.spyOn(prisma.fucoinLedger, 'findMany').mockResolvedValue([] as never)
    vi.spyOn(prisma.missionDefinition, 'findMany').mockResolvedValue(input.definitions as never)
    vi.spyOn(prisma.userMissionClaim, 'findMany').mockResolvedValue(input.claims as never)
    vi.spyOn(prisma.dailyActivity, 'findMany').mockResolvedValue([
        {
            date: new Date('2026-04-29T00:00:00.000Z'),
            totalMinutes: 18,
            xpEarned: 45,
            lessonsCompleted: 1,
            exercisesCompleted: 3,
            srsReviewed: 4,
        },
    ] as never)
    vi.spyOn(prisma.examAttempt, 'count').mockResolvedValue(0 as never)
    vi.spyOn(prisma, '$transaction').mockImplementation(async (callback: any) => callback(input.tx))
}
