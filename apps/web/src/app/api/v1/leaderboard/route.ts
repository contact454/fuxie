import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@fuxie/database'
import { withAuth } from '@/lib/auth/middleware'
import { getDbUserByFirebaseUid } from '@/lib/auth/db-user'
import { handleApiError } from '@/lib/api/error-handler'

/**
 * GET /api/v1/leaderboard
 * Returns weekly and all-time leaderboards
 */
export async function GET(req: NextRequest) {
    try {
        const auth = await withAuth(req)
        const user = await getDbUserByFirebaseUid(auth.userId)

        const period = req.nextUrl.searchParams.get('period') ?? 'weekly'

        if (period === 'alltime') {
            return getAllTimeLeaderboard(user?.id)
        }

        return getWeeklyLeaderboard(user?.id)
    } catch (error) {
        return handleApiError(error)
    }
}

async function getWeeklyLeaderboard(currentUserId?: string) {
    // Get XP earned in the last 7 days
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    weekAgo.setHours(0, 0, 0, 0)

    const weeklyStats = await prisma.dailyActivity.groupBy({
        by: ['userId'],
        where: { date: { gte: weekAgo } },
        _sum: { xpEarned: true },
        orderBy: { _sum: { xpEarned: 'desc' } },
        take: 50,
    })

    const userIds = weeklyStats.map(s => s.userId)
    const profiles = await prisma.userProfile.findMany({
        where: { userId: { in: userIds } },
        select: {
            userId: true,
            displayName: true,
            avatarUrl: true,
            currentLevel: true,
            totalXp: true,
        },
    })
    const profileMap = new Map(profiles.map(p => [p.userId, p]))

    const streaks = await prisma.userStreak.findMany({
        where: { userId: { in: userIds } },
        select: { userId: true, currentStreak: true },
    })
    const streakMap = new Map(streaks.map(s => [s.userId, s.currentStreak]))

    const entries = weeklyStats.map((stat, idx) => {
        const profile = profileMap.get(stat.userId)
        return {
            rank: idx + 1,
            userId: stat.userId,
            displayName: profile?.displayName ?? 'Lerner',
            avatarUrl: profile?.avatarUrl ?? null,
            currentLevel: profile?.currentLevel ?? 'A1',
            weeklyXp: stat._sum.xpEarned ?? 0,
            totalXp: profile?.totalXp ?? 0,
            streak: streakMap.get(stat.userId) ?? 0,
            isCurrentUser: stat.userId === currentUserId,
        }
    })

    // Find current user's rank if not in top 50
    let currentUserEntry = null
    if (currentUserId && !entries.some(e => e.isCurrentUser)) {
        const userWeeklyXp = await prisma.dailyActivity.aggregate({
            where: { userId: currentUserId, date: { gte: weekAgo } },
            _sum: { xpEarned: true },
        })
        const userProfile = await prisma.userProfile.findFirst({
            where: { userId: currentUserId },
            select: { displayName: true, avatarUrl: true, currentLevel: true, totalXp: true },
        })
        const userStreak = await prisma.userStreak.findFirst({
            where: { userId: currentUserId },
            select: { currentStreak: true },
        })

        // Count how many users have more XP this week
        const betterCount = await prisma.dailyActivity.groupBy({
            by: ['userId'],
            where: { date: { gte: weekAgo } },
            _sum: { xpEarned: true },
            having: { xpEarned: { _sum: { gt: userWeeklyXp._sum.xpEarned ?? 0 } } },
        })

        currentUserEntry = {
            rank: betterCount.length + 1,
            userId: currentUserId,
            displayName: userProfile?.displayName ?? 'Du',
            avatarUrl: userProfile?.avatarUrl ?? null,
            currentLevel: userProfile?.currentLevel ?? 'A1',
            weeklyXp: userWeeklyXp._sum.xpEarned ?? 0,
            totalXp: userProfile?.totalXp ?? 0,
            streak: userStreak?.currentStreak ?? 0,
            isCurrentUser: true,
        }
    }

    return NextResponse.json({
        success: true,
        data: {
            period: 'weekly',
            entries,
            currentUser: currentUserEntry ?? entries.find(e => e.isCurrentUser) ?? null,
        },
    })
}

async function getAllTimeLeaderboard(currentUserId?: string) {
    const profiles = await prisma.userProfile.findMany({
        orderBy: { totalXp: 'desc' },
        take: 50,
        select: {
            userId: true,
            displayName: true,
            avatarUrl: true,
            currentLevel: true,
            totalXp: true,
        },
    })

    const userIds = profiles.map(p => p.userId)
    const streaks = await prisma.userStreak.findMany({
        where: { userId: { in: userIds } },
        select: { userId: true, currentStreak: true },
    })
    const streakMap = new Map(streaks.map(s => [s.userId, s.currentStreak]))

    const entries = profiles.map((profile, idx) => ({
        rank: idx + 1,
        userId: profile.userId,
        displayName: profile.displayName ?? 'Lerner',
        avatarUrl: profile.avatarUrl ?? null,
        currentLevel: profile.currentLevel ?? 'A1',
        weeklyXp: 0,
        totalXp: profile.totalXp ?? 0,
        streak: streakMap.get(profile.userId) ?? 0,
        isCurrentUser: profile.userId === currentUserId,
    }))

    return NextResponse.json({
        success: true,
        data: {
            period: 'alltime',
            entries,
            currentUser: entries.find(e => e.isCurrentUser) ?? null,
        },
    })
}
