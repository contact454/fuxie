import { NextResponse } from 'next/server'
import { prisma } from '@fuxie/database'

import { getServerUser } from '@/lib/auth/server-auth'
import { getLearningFucoinDailyProgress, getWalletSummary } from '@/lib/gamification/fucoin'
import { calculateFuxieXpLevel } from '@/lib/gamification/xp-level'

export async function GET() {
    try {
        const serverUser = await getServerUser()
        if (!serverUser) {
            return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 })
        }

        const [wallet, dailyFucoin, profile, recentLedger] = await Promise.all([
            getWalletSummary(prisma, serverUser.userId),
            getLearningFucoinDailyProgress(prisma, serverUser.userId),
            prisma.userProfile.findUnique({
                where: { userId: serverUser.userId },
                select: { totalXp: true },
            }),
            prisma.fucoinLedger.findMany({
                where: { userId: serverUser.userId },
                orderBy: { createdAt: 'desc' },
                take: 5,
                select: {
                    id: true,
                    amount: true,
                    type: true,
                    sourceType: true,
                    reason: true,
                    createdAt: true,
                },
            }),
        ])

        return NextResponse.json({
            success: true,
            data: {
                wallet,
                dailyFucoin,
                xpLevel: calculateFuxieXpLevel(profile?.totalXp ?? 0),
                recentLedger: recentLedger.map((entry) => ({
                    ...entry,
                    createdAt: entry.createdAt.toISOString(),
                })),
            },
        })
    } catch (error) {
        console.error('[Wallet API] Error:', error)
        return NextResponse.json({ success: false, error: 'Failed to load wallet' }, { status: 500 })
    }
}
