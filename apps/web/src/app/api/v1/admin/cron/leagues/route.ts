import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@fuxie/database'
import { handleApiError } from '@/lib/api/error-handler'

const LEAGUE_ORDER = ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'DIAMOND'] as const;

export async function POST(req: NextRequest) {
    try {
        // Simple protection for cron endpoints
        const authHeader = req.headers.get('authorization')
        if (authHeader !== `Bearer ${process.env.CRON_SECRET || 'dev_cron_secret'}`) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
        }

        const weekAgo = new Date()
        weekAgo.setDate(weekAgo.getDate() - 7)
        weekAgo.setHours(0, 0, 0, 0)

        // Process each league
        const results = []
        for (let i = 0; i < LEAGUE_ORDER.length; i++) {
            const league = LEAGUE_ORDER[i]
            const nextLeague = i < LEAGUE_ORDER.length - 1 ? LEAGUE_ORDER[i + 1] : league
            const prevLeague = i > 0 ? LEAGUE_ORDER[i - 1] : league

            // Get users in this league
            const profiles = await prisma.userProfile.findMany({
                where: { currentLeague: league },
                select: { userId: true }
            })
            const userIds = profiles.map(p => p.userId)

            if (userIds.length === 0) continue

            // Get weekly XP
            const stats = await prisma.dailyActivity.groupBy({
                by: ['userId'],
                where: { 
                    date: { gte: weekAgo },
                    userId: { in: userIds }
                },
                _sum: { xpEarned: true },
                orderBy: { _sum: { xpEarned: 'desc' } }
            })

            // Calculate promotion/demotion for users who earned XP
            // Top 5 promote, bottom 5 demote
            const top5 = stats.slice(0, 5).map(s => s.userId)
            // Only demote if more than 50 people? For simplicity, bottom 5 demote if at least 15 people in league.
            let bottom5: string[] = []
            if (stats.length >= 15) {
                bottom5 = stats.slice(-5).map(s => s.userId)
            }

            // Execute promotions
            if (top5.length > 0 && nextLeague !== league) {
                await prisma.userProfile.updateMany({
                    where: { userId: { in: top5 } },
                    data: { currentLeague: nextLeague }
                })
            }

            // Execute demotions
            if (bottom5.length > 0 && prevLeague !== league) {
                await prisma.userProfile.updateMany({
                    where: { userId: { in: bottom5 } },
                    data: { currentLeague: prevLeague }
                })
            }

            results.push({
                league,
                promoted: top5.length,
                demoted: bottom5.length
            })
        }

        return NextResponse.json({ success: true, data: results })
    } catch (error) {
        return handleApiError(error)
    }
}
