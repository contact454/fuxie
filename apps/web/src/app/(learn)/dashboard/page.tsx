import { redirect } from 'next/navigation'
import { prisma } from '@fuxie/database'
import { getServerUser } from '@/lib/auth/server-auth'
import { DashboardClient } from '@/components/dashboard/dashboard-client'

import type { DashboardData } from '@/components/dashboard/dashboard-client'

// Force dynamic — dashboard needs real-time data
export const dynamic = 'force-dynamic'

function getTimeGreeting(): string {
    const hour = new Date().getHours()
    if (hour < 6) return 'Gute Nacht'
    if (hour < 12) return 'Guten Morgen'
    if (hour < 18) return 'Guten Tag'
    return 'Guten Abend'
}

async function getDashboardData(userId: string): Promise<DashboardData> {
    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const sevenDaysAgo = new Date(todayStart)
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6)

    // Parallel queries for performance
    const [
        userWithRelations,
        srsStats,
        weeklyActivities,
        skillAssessments,
        recentAchievements,
        listeningStats,
        grammarStats,
    ] = await Promise.all([
        // 1. User + profile + streak + learning path + settings
        prisma.user.findUnique({
            where: { id: userId },
            include: {
                profile: true,
                streak: true,
                learningPath: true,
                settings: true,
            },
        }),
        // 2. SRS card stats
        Promise.all([
            prisma.srsCard.count({
                where: { userId, nextReviewAt: { lte: now } },
            }),
            prisma.srsCard.count({
                where: { userId },
            }),
            // SRS reviewed today
            prisma.srsReviewLog.count({
                where: {
                    userId,
                    reviewedAt: { gte: todayStart },
                },
            }),
        ]),
        // 3. Weekly daily activities (last 7 days)
        prisma.dailyActivity.findMany({
            where: {
                userId,
                date: { gte: sevenDaysAgo },
            },
            orderBy: { date: 'asc' },
        }),
        // 4. Latest skill assessments
        prisma.$queryRaw<Array<{
            skill: string
            cefrLevel: string
            score: number
            assessedAt: Date
        }>>`
            SELECT DISTINCT ON (skill) skill, "cefrLevel", score, "assessedAt"
            FROM skill_assessments
            WHERE "userId" = ${userId}
            ORDER BY skill, "assessedAt" DESC
        `.catch(() => []),
        // 5. Recent achievements
        prisma.userAchievement.findMany({
            where: { userId },
            include: { achievement: true },
            orderBy: { earnedAt: 'desc' },
            take: 5,
        }),
        // 6. Listening stats
        Promise.all([
            prisma.listeningLesson.count(),
            prisma.listeningAttempt.count({
                where: { userId },
            }),
            prisma.listeningAttempt.findFirst({
                where: { userId },
                orderBy: { score: 'desc' },
                select: { score: true, totalQuestions: true },
            }),
            prisma.listeningAttempt.groupBy({
                by: ['lessonId'],
                where: { userId },
            }).then(r => r.length),
        ]).catch(() => [0, 0, null, 0] as const),
        // 7. Grammar stats
        Promise.all([
            (prisma as any).grammarTopic.count(),
            (prisma as any).grammarLesson.count(),
            (prisma as any).grammarProgress.count({
                where: { userId, completed: true },
            }),
            (prisma as any).grammarProgress.findMany({
                where: { userId },
                select: { stars: true },
            }).then((rows: any[]) => rows.reduce((s: number, r: any) => s + (r.stars ?? 0), 0)),
        ]).catch(() => [0, 0, 0, 0] as const),
    ])

    const profile = userWithRelations?.profile
    const streak = userWithRelations?.streak
    const learningPath = userWithRelations?.learningPath
    const settings = userWithRelations?.settings
    const [dueCount, totalCards, reviewedToday] = srsStats
    const [totalGrammarTopics, totalGrammarLessons, completedGrammarLessons, totalGrammarStars] = grammarStats as [number, number, number, number]

    // Find today's activity
    const todayActivity = weeklyActivities.find(
        (a) => a.date.toISOString().slice(0, 10) === todayStart.toISOString().slice(0, 10)
    )

    // Build 7-day array (fill missing days with 0)
    const weeklyData: DashboardData['weeklyActivity'] = []
    const dayLabels = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa']
    for (let i = 0; i < 7; i++) {
        const date = new Date(sevenDaysAgo)
        date.setDate(date.getDate() + i)
        const dateStr = date.toISOString().slice(0, 10)
        const activity = weeklyActivities.find(
            (a) => a.date.toISOString().slice(0, 10) === dateStr
        )
        weeklyData.push({
            day: dayLabels[date.getDay()] ?? '',
            date: dateStr,
            xp: activity?.xpEarned ?? 0,
            minutes: activity?.totalMinutes ?? 0,
        })
    }

    // Build skill data
    const skillMap: Record<string, { score: number; level: string }> = {}
    for (const assessment of skillAssessments) {
        skillMap[assessment.skill] = {
            score: Math.round(assessment.score),
            level: assessment.cefrLevel,
        }
    }
    const defaultSkills = ['HOEREN', 'LESEN', 'SCHREIBEN', 'SPRECHEN', 'GRAMMATIK', 'WORTSCHATZ']
    const skillLabels: Record<string, string> = {
        HOEREN: 'Hören',
        LESEN: 'Lesen',
        SCHREIBEN: 'Schreiben',
        SPRECHEN: 'Sprechen',
        GRAMMATIK: 'Grammatik',
        WORTSCHATZ: 'Wortschatz',
    }
    const skills: DashboardData['skills'] = defaultSkills.map((skill) => ({
        key: skill,
        label: skillLabels[skill] ?? skill,
        score: skillMap[skill]?.score ?? 0,
        level: skillMap[skill]?.level ?? '',
    }))

    // Calculate exam countdown
    let examDaysLeft: number | null = null
    if (profile?.targetExamDate) {
        const diff = profile.targetExamDate.getTime() - now.getTime()
        examDaysLeft = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
    }

    // Calculate Fuxie level from XP
    const totalXp = profile?.totalXp ?? 0
    const { level, title } = calculateFuxieLevel(totalXp)

    const [totalListeningLessons, completedAttempts, bestAttempt, uniqueLessonsCompleted] = listeningStats as [number, number, { score: number; totalQuestions: number } | null, number]
    const grammarMaxStars = totalGrammarLessons * 3

    return {
        greeting: getTimeGreeting(),
        profile: {
            displayName: profile?.displayName ?? 'Learner',
            currentLevel: profile?.currentLevel ?? 'A1',
            targetLevel: profile?.targetLevel ?? learningPath?.targetCefrLevel ?? 'B1',
            targetExam: profile?.targetExam ?? learningPath?.targetExamType ?? 'GOETHE',
            targetExamDate: profile?.targetExamDate?.toISOString() ?? null,
            examDaysLeft,
            totalXp,
            totalWordsLearned: profile?.totalWordsLearned ?? 0,
            totalLessonsCompleted: profile?.totalLessonsCompleted ?? 0,
            totalStudyMinutes: profile?.totalStudyMinutes ?? 0,
            studyGoalMinutes: profile?.studyGoalMinutes ?? settings?.srsNewCardsPerDay ?? 15,
            fuxieLevel: level,
            fuxieTitle: title,
        },
        streak: {
            currentStreak: streak?.currentStreak ?? 0,
            longestStreak: streak?.longestStreak ?? 0,
            lastActivityDate: streak?.lastActivityDate?.toISOString() ?? null,
        },
        srs: {
            dueCount,
            totalCards,
            reviewedToday,
        },
        todayActivity: {
            totalMinutes: todayActivity?.totalMinutes ?? 0,
            xpEarned: todayActivity?.xpEarned ?? 0,
            lessonsCompleted: todayActivity?.lessonsCompleted ?? 0,
            exercisesCompleted: todayActivity?.exercisesCompleted ?? 0,
            srsReviewed: todayActivity?.srsReviewed ?? 0,
            wordsLearned: todayActivity?.wordsLearned ?? 0,
        },
        weeklyActivity: weeklyData,
        skills,
        listening: {
            totalLessons: totalListeningLessons,
            completedLessons: uniqueLessonsCompleted,
            totalAttempts: completedAttempts,
            bestScore: bestAttempt ? Math.round((bestAttempt.score / bestAttempt.totalQuestions) * 100) : null,
        },
        grammar: {
            totalTopics: totalGrammarTopics,
            totalLessons: totalGrammarLessons,
            completedLessons: completedGrammarLessons,
            totalStars: totalGrammarStars,
            maxStars: grammarMaxStars,
        },
        achievements: recentAchievements.map((ua) => ({
            id: ua.achievement.id,
            title: ua.achievement.title,
            titleDe: ua.achievement.titleDe,
            iconUrl: ua.achievement.iconUrl,
            category: ua.achievement.category,
            earnedAt: ua.earnedAt.toISOString(),
        })),
    }
}

function calculateFuxieLevel(totalXp: number): { level: number; title: string } {
    if (totalXp >= 30000) return { level: Math.min(50, 41 + Math.floor((totalXp - 30000) / 5000)), title: 'Fuchs-Legende' }
    if (totalXp >= 15000) return { level: 31 + Math.floor((totalXp - 15000) / 1500), title: 'Meister Fuchs' }
    if (totalXp >= 6000) return { level: 21 + Math.floor((totalXp - 6000) / 900), title: 'Schlauer Fuchs' }
    if (totalXp >= 2000) return { level: 11 + Math.floor((totalXp - 2000) / 400), title: 'Junger Fuchs' }
    return { level: 1 + Math.floor(totalXp / 200), title: 'Fuchs-Baby' }
}

export default async function DashboardPage() {
    const serverUser = await getServerUser()

    if (!serverUser) {
        redirect('/login')
    }

    const data = await getDashboardData(serverUser.userId)
    return <DashboardClient data={data} />
}
