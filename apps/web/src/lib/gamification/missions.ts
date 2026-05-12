import {
    MissionMetric,
    MissionPeriod,
    MissionStatus,
    Prisma,
    prisma,
} from '@fuxie/database'

import { awardFucoin, getLearningFucoinDailyProgress, getWalletSummary } from './fucoin'
import { getFuxieShopPreview } from './shop'
import { calculateFuxieXpLevel } from './xp-level'
import type {
    MissionBoardData,
    MissionBoardItem,
    MissionBoardPeriod,
    MissionBoardStatus,
} from './mission-types'

type MissionDefinitionShape = {
    id: string
    slug: string
    period: MissionPeriod
    title: string
    description: string
    metric: MissionMetric
    targetValue: number
    href: string | null
    xpReward: number
    fucoinReward: number
    sortOrder: number
}

type ActivityShape = {
    date: Date
    totalMinutes: number
    xpEarned: number
    lessonsCompleted: number
    exercisesCompleted: number
    srsReviewed: number
}

type ClaimShape = {
    missionId: string
    periodKey: string
}

export class MissionClaimError extends Error {
    constructor(
        message: string,
        public readonly status: number
    ) {
        super(message)
    }
}

const PERIOD_LABELS: Record<MissionBoardPeriod, string> = {
    daily: 'Ngày',
    monthly: 'Tháng',
    quarterly: 'Quý',
}


export async function getMissionBoard(userId: string, now = new Date()): Promise<MissionBoardData> {
    const windows = getMissionWindows(now)
    const periodKeys = Object.values(windows).map((window) => window.periodKey)

    const [
        profile,
        wallet,
        dailyFucoin,
        recentLedger,
        definitions,
        claims,
        activities,
        examAttempts,
    ] = await Promise.all([
        prisma.userProfile.findUnique({
            where: { userId },
            select: { totalXp: true },
        }),
        getWalletSummary(prisma, userId),
        getLearningFucoinDailyProgress(prisma, userId),
        prisma.fucoinLedger.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: 3,
            select: {
                id: true,
                amount: true,
                type: true,
                sourceType: true,
                reason: true,
                createdAt: true,
            },
        }),
        prisma.missionDefinition.findMany({
            where: {
                status: MissionStatus.ACTIVE,
                OR: [
                    { activeFrom: null },
                    { activeFrom: { lte: now } },
                ],
                AND: [
                    {
                        OR: [
                            { activeTo: null },
                            { activeTo: { gte: now } },
                        ],
                    },
                ],
            },
            orderBy: [
                { period: 'asc' },
                { sortOrder: 'asc' },
            ],
        }),
        prisma.userMissionClaim.findMany({
            where: {
                userId,
                periodKey: { in: periodKeys },
            },
            select: {
                missionId: true,
                periodKey: true,
            },
        }),
        prisma.dailyActivity.findMany({
            where: {
                userId,
                date: {
                    gte: windows.quarterly.start,
                    lt: windows.quarterly.end,
                },
            },
            select: {
                date: true,
                totalMinutes: true,
                xpEarned: true,
                lessonsCompleted: true,
                exercisesCompleted: true,
                srsReviewed: true,
            },
        }),
        prisma.examAttempt.count({
            where: {
                userId,
                completedAt: {
                    gte: windows.quarterly.start,
                    lt: windows.quarterly.end,
                },
            },
        }),
    ])

    return buildMissionBoard({
        definitions,
        claims,
        activities,
        examAttempts,
        totalXp: profile?.totalXp ?? 0,
        wallet,
        dailyFucoin,
        recentLedger: recentLedger.map((entry) => ({
            ...entry,
            createdAt: entry.createdAt.toISOString(),
        })),
        now,
    })
}

export function buildMissionBoard({
    definitions,
    claims,
    activities,
    examAttempts,
    totalXp,
    wallet,
    dailyFucoin = {
        earnedToday: 0,
        dailyCap: 60,
        remaining: 60,
        capReached: false,
    },
    recentLedger = [],
    now = new Date(),
}: {
    definitions: MissionDefinitionShape[]
    claims: ClaimShape[]
    activities: ActivityShape[]
    examAttempts: number
    totalXp: number
    wallet: MissionBoardData['wallet']
    dailyFucoin?: MissionBoardData['dailyFucoin']
    recentLedger?: MissionBoardData['recentLedger']
    now?: Date
}): MissionBoardData {
    const windows = getMissionWindows(now)
    const claimedKeys = new Set(claims.map((claim) => `${claim.missionId}:${claim.periodKey}`))

    const missions = definitions.map((definition): MissionBoardItem => {
        const period = toBoardPeriod(definition.period)
        const window = windows[period]
        const currentValue = calculateMissionValue(definition.metric, period, activities, examAttempts, windows)
        const progress = definition.targetValue > 0
            ? Math.min(100, Math.round((currentValue / definition.targetValue) * 100))
            : 0
        const isClaimed = claimedKeys.has(`${definition.id}:${window.periodKey}`)
        const status: MissionBoardStatus = isClaimed
            ? 'claimed'
            : progress >= 100
                ? 'claimable'
                : 'active'

        return {
            id: definition.id,
            slug: definition.slug,
            period,
            periodLabel: PERIOD_LABELS[period],
            periodKey: window.periodKey,
            title: definition.title,
            description: definition.description,
            href: definition.href,
            status,
            progress,
            currentValue,
            targetValue: definition.targetValue,
            xpReward: definition.xpReward,
            fucoinReward: definition.fucoinReward,
            sortOrder: definition.sortOrder,
        }
    })

    const periods = (['daily', 'monthly', 'quarterly'] as const).map((period) => {
        const periodMissions = missions.filter((mission) => mission.period === period)
        const progress = periodMissions.length > 0
            ? Math.round(periodMissions.reduce((sum, mission) => sum + mission.progress, 0) / periodMissions.length)
            : 0

        return {
            period,
            label: PERIOD_LABELS[period],
            periodKey: windows[period].periodKey,
            progress,
            claimableCount: periodMissions.filter((mission) => mission.status === 'claimable').length,
            missions: periodMissions,
        }
    })

    return {
        wallet,
        dailyFucoin,
        recentLedger,
        xpLevel: calculateFuxieXpLevel(totalXp),
        periods,
        missions,
        shopPreview: getFuxieShopPreview(wallet.balance),
    }
}

export async function claimMissionReward(userId: string, missionId: string, now = new Date()) {
    const board = await getMissionBoard(userId, now)
    const mission = board.missions.find((item) => item.id === missionId || item.slug === missionId)

    if (!mission) {
        throw new MissionClaimError('Mission not found', 404)
    }

    if (mission.status === 'claimed') {
        return {
            mission,
            missionBoard: board,
            claimed: false,
        }
    }

    if (mission.status !== 'claimable') {
        throw new MissionClaimError('Mission is not ready to claim', 409)
    }

    await prisma.$transaction(async (tx) => {
        await tx.userMissionClaim.create({
            data: {
                userId,
                missionId: mission.id,
                periodKey: mission.periodKey,
            },
        })

        if (mission.xpReward > 0) {
            await awardMissionXp(tx, userId, mission.xpReward, now)
        }

        if (mission.fucoinReward > 0) {
            await awardFucoin(tx, {
                userId,
                amount: mission.fucoinReward,
                sourceType: 'mission',
                sourceId: `${mission.slug}:${mission.periodKey}`,
                reason: mission.title,
                metadata: {
                    missionId: mission.id,
                    missionSlug: mission.slug,
                    period: mission.period,
                    periodKey: mission.periodKey,
                },
            })
        }
    })

    return {
        mission: {
            ...mission,
            status: 'claimed' as const,
        },
        missionBoard: await getMissionBoard(userId, now),
        claimed: true,
    }
}

function calculateMissionValue(
    metric: MissionMetric,
    period: MissionBoardPeriod,
    activities: ActivityShape[],
    examAttempts: number,
    windows: ReturnType<typeof getMissionWindows>
) {
    const periodActivities = activities.filter((activity) => isWithinWindow(activity.date, windows[period]))

    if (metric === MissionMetric.STUDY_MINUTES) {
        return periodActivities.reduce((sum, activity) => sum + activity.totalMinutes, 0)
    }
    if (metric === MissionMetric.XP_EARNED) {
        return periodActivities.reduce((sum, activity) => sum + activity.xpEarned, 0)
    }
    if (metric === MissionMetric.EXERCISES_COMPLETED) {
        return periodActivities.reduce((sum, activity) => sum + activity.exercisesCompleted, 0)
    }
    if (metric === MissionMetric.LESSONS_COMPLETED) {
        return periodActivities.reduce((sum, activity) => sum + activity.lessonsCompleted, 0)
    }
    if (metric === MissionMetric.SRS_REVIEWED) {
        return periodActivities.reduce((sum, activity) => sum + activity.srsReviewed, 0)
    }
    if (metric === MissionMetric.ACTIVE_DAYS) {
        return periodActivities.filter((activity) => (
            activity.totalMinutes > 0 ||
            activity.xpEarned > 0 ||
            activity.lessonsCompleted > 0 ||
            activity.exercisesCompleted > 0 ||
            activity.srsReviewed > 0
        )).length
    }
    if (metric === MissionMetric.EXAM_ATTEMPTS) {
        return period === 'quarterly' ? examAttempts : 0
    }

    return 0
}

async function awardMissionXp(
    tx: Prisma.TransactionClient,
    userId: string,
    xpReward: number,
    now: Date
) {
    const today = startOfDay(now)

    await Promise.all([
        tx.userProfile.updateMany({
            where: { userId },
            data: { totalXp: { increment: xpReward } },
        }),
        tx.dailyActivity.upsert({
            where: {
                userId_date: {
                    userId,
                    date: today,
                },
            },
            update: {
                xpEarned: { increment: xpReward },
            },
            create: {
                userId,
                date: today,
                xpEarned: xpReward,
                totalMinutes: 0,
                lessonsCompleted: 0,
                exercisesCompleted: 0,
                srsReviewed: 0,
                wordsLearned: 0,
            },
        }),
    ])
}

function toBoardPeriod(period: MissionPeriod): MissionBoardPeriod {
    if (period === MissionPeriod.MONTHLY) return 'monthly'
    if (period === MissionPeriod.QUARTERLY) return 'quarterly'
    return 'daily'
}

function getMissionWindows(now: Date) {
    const dayStart = startOfDay(now)
    const dayEnd = new Date(dayStart)
    dayEnd.setDate(dayEnd.getDate() + 1)

    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1)
    const quarterIndex = Math.floor(now.getMonth() / 3)
    const quarterStart = new Date(now.getFullYear(), quarterIndex * 3, 1)
    const quarterEnd = new Date(now.getFullYear(), quarterIndex * 3 + 3, 1)

    return {
        daily: {
            start: dayStart,
            end: dayEnd,
            periodKey: formatDateKey(dayStart),
        },
        monthly: {
            start: monthStart,
            end: monthEnd,
            periodKey: `${monthStart.getFullYear()}-${String(monthStart.getMonth() + 1).padStart(2, '0')}`,
        },
        quarterly: {
            start: quarterStart,
            end: quarterEnd,
            periodKey: `${quarterStart.getFullYear()}-Q${quarterIndex + 1}`,
        },
    }
}

function isWithinWindow(date: Date, window: { start: Date; end: Date }) {
    const time = date.getTime()
    return time >= window.start.getTime() && time < window.end.getTime()
}

function startOfDay(date: Date) {
    const day = new Date(date)
    day.setHours(0, 0, 0, 0)
    return day
}

function formatDateKey(date: Date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}
