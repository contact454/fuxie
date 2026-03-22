import { cache } from 'react'
import { prisma } from '@fuxie/database'

export const getDashboardUserContext = cache(async (userId: string) => {
    return prisma.user.findUnique({
        where: { id: userId },
        include: {
            profile: true,
            streak: true,
            learningPath: true,
            settings: true,
        },
    })
})

export const getTodayActivitySummary = cache(async (userId: string) => {
    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    return prisma.dailyActivity.findFirst({
        where: {
            userId,
            date: { gte: todayStart },
        },
        orderBy: { date: 'desc' },
    })
})
