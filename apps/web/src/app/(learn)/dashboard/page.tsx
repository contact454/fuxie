import { Suspense, cache } from 'react'
import { redirect } from 'next/navigation'
import { prisma } from '@fuxie/database'
import { getServerUser } from '@/lib/auth/server-auth'
import { cacheWrap } from '@/lib/cache/redis'
import { getDashboardUserContext, getTodayActivitySummary } from '@/lib/dashboard/request-data'
import { DashboardClient } from '@/components/dashboard/dashboard-client'
import { StatsSkeleton, ContentSkeleton } from '@/components/dashboard/dashboard-skeletons'

import type { DashboardData } from '@/components/dashboard/dashboard-client'

function getTimeGreeting(): string {
    const hour = new Date().getHours()
    if (hour < 6) return 'Gute Nacht'
    if (hour < 12) return 'Guten Morgen'
    if (hour < 18) return 'Guten Tag'
    return 'Guten Abend'
}

function calculateFuxieLevel(totalXp: number): { level: number; title: string } {
    if (totalXp >= 30000) return { level: Math.min(50, 41 + Math.floor((totalXp - 30000) / 5000)), title: 'Fuchs-Legende' }
    if (totalXp >= 15000) return { level: 31 + Math.floor((totalXp - 15000) / 1500), title: 'Meister Fuchs' }
    if (totalXp >= 6000) return { level: 21 + Math.floor((totalXp - 6000) / 900), title: 'Schlauer Fuchs' }
    if (totalXp >= 2000) return { level: 11 + Math.floor((totalXp - 2000) / 400), title: 'Junger Fuchs' }
    return { level: 1 + Math.floor(totalXp / 200), title: 'Fuchs-Baby' }
}

// ===== SPLIT FETCH FUNCTIONS =====

/** Fast — single user query with relations */
const getHeaderData = cache(async (userId: string) => {
    const user = await getDashboardUserContext(userId)

    const profile = user?.profile
    const streak = user?.streak
    const learningPath = user?.learningPath
    const settings = user?.settings

    const totalXp = profile?.totalXp ?? 0
    const { level, title } = calculateFuxieLevel(totalXp)

    let examDaysLeft: number | null = null
    if (profile?.targetExamDate) {
        const diff = profile.targetExamDate.getTime() - Date.now()
        examDaysLeft = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
    }

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
    }
})

/** Stats — SRS counts + today's activity */
const getStatsData = cache(async (userId: string) => {
    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    const [srsStats, todayActivity] = await Promise.all([
        Promise.all([
            prisma.srsCard.count({ where: { userId, nextReviewAt: { lte: now } } }),
            prisma.srsCard.count({ where: { userId } }),
            prisma.srsReviewLog.count({ where: { userId, reviewedAt: { gte: todayStart } } }),
        ]),
        getTodayActivitySummary(userId),
    ])

    const [dueCount, totalCards, reviewedToday] = srsStats

    return {
        srs: { dueCount, totalCards, reviewedToday },
        todayActivity: {
            totalMinutes: todayActivity?.totalMinutes ?? 0,
            xpEarned: todayActivity?.xpEarned ?? 0,
            lessonsCompleted: todayActivity?.lessonsCompleted ?? 0,
            exercisesCompleted: todayActivity?.exercisesCompleted ?? 0,
            srsReviewed: todayActivity?.srsReviewed ?? 0,
            wordsLearned: todayActivity?.wordsLearned ?? 0,
        },
    }
})

/** Content — weekly activity, skills, achievements, listening, grammar */
async function getContentData(userId: string) {
    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const sevenDaysAgo = new Date(todayStart)
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6)

    const [weeklyActivities, skillAssessments, recentAchievements, listeningStats, grammarStats] = await Promise.all([
        prisma.dailyActivity.findMany({
            where: { userId, date: { gte: sevenDaysAgo } },
            orderBy: { date: 'asc' },
        }),
        prisma.$queryRaw<Array<{ skill: string; cefrLevel: string; score: number; assessedAt: Date }>>`
            SELECT DISTINCT ON (skill) skill, "cefrLevel", score, "assessedAt"
            FROM skill_assessments
            WHERE "userId" = ${userId}
            ORDER BY skill, "assessedAt" DESC
        `.catch(() => []),
        prisma.userAchievement.findMany({
            where: { userId },
            orderBy: { earnedAt: 'desc' },
            take: 5,
            select: {
                earnedAt: true,
                achievement: {
                    select: {
                        id: true,
                        title: true,
                        titleDe: true,
                        iconUrl: true,
                        category: true,
                    },
                },
            },
        }),
        Promise.all([
            prisma.listeningLesson.count(),
            prisma.listeningAttempt.count({ where: { userId } }),
            prisma.listeningAttempt.findFirst({
                where: { userId },
                orderBy: { score: 'desc' },
                select: { score: true, totalQuestions: true },
            }),
            prisma.listeningAttempt.groupBy({ by: ['lessonId'], where: { userId } }).then(r => r.length),
        ]).catch(() => [0, 0, null, 0] as const),
        Promise.all([
            prisma.grammarTopic.count(),
            prisma.grammarLesson.count(),
            prisma.grammarProgress.count({ where: { userId, completed: true } }),
            prisma.grammarProgress.aggregate({
                where: { userId },
                _sum: { stars: true },
            }).then((result) => result._sum.stars ?? 0),
        ]).catch(() => [0, 0, 0, 0] as const),
    ])

    // Build weekly data
    const dayLabels = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa']
    const weeklyActivity: DashboardData['weeklyActivity'] = []
    for (let i = 0; i < 7; i++) {
        const date = new Date(sevenDaysAgo)
        date.setDate(date.getDate() + i)
        const dateStr = date.toISOString().slice(0, 10)
        const activity = weeklyActivities.find((a) => a.date.toISOString().slice(0, 10) === dateStr)
        weeklyActivity.push({
            day: dayLabels[date.getDay()] ?? '',
            date: dateStr,
            xp: activity?.xpEarned ?? 0,
            minutes: activity?.totalMinutes ?? 0,
        })
    }

    // Build skills
    const skillMap: Record<string, { score: number; level: string }> = {}
    for (const a of skillAssessments) {
        skillMap[a.skill] = { score: Math.round(a.score), level: a.cefrLevel }
    }
    const skillLabels: Record<string, string> = {
        HOEREN: 'Hören', LESEN: 'Lesen', SCHREIBEN: 'Schreiben',
        SPRECHEN: 'Sprechen', GRAMMATIK: 'Grammatik', WORTSCHATZ: 'Wortschatz',
    }
    const skills: DashboardData['skills'] = ['HOEREN', 'LESEN', 'SCHREIBEN', 'SPRECHEN', 'GRAMMATIK', 'WORTSCHATZ']
        .map((skill) => ({
            key: skill,
            label: skillLabels[skill] ?? skill,
            score: skillMap[skill]?.score ?? 0,
            level: skillMap[skill]?.level ?? '',
        }))

    const [totalListeningLessons, completedAttempts, bestAttempt, uniqueLessonsCompleted] = listeningStats as [number, number, { score: number; totalQuestions: number } | null, number]
    const [totalGrammarTopics, totalGrammarLessons, completedGrammarLessons, totalGrammarStars] = grammarStats as [number, number, number, number]

    return {
        weeklyActivity,
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
            maxStars: totalGrammarLessons * 3,
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

// ===== ASYNC SERVER COMPONENTS =====

async function DashboardStats({ userId }: { userId: string }) {
    const [headerData, statsData] = await Promise.all([
        getHeaderData(userId),
        getStatsData(userId),
    ])

    // Stats need header data for study goal calculation
    return (
        <DashboardClient
            section="stats"
            data={{ ...headerData, ...statsData } as Partial<DashboardData> as DashboardData}
        />
    )
}

async function DashboardContent({ userId }: { userId: string }) {
    const [headerData, statsData, contentData] = await Promise.all([
        getHeaderData(userId),
        getStatsData(userId),
        cacheWrap(`dash:content:${userId}`, 60, () => getContentData(userId)),
    ])

    return (
        <DashboardClient
            section="content"
            data={{ ...headerData, ...statsData, ...contentData } as DashboardData}
        />
    )
}

// ===== PAGE =====

export default async function DashboardPage() {
    const serverUser = await getServerUser()

    if (!serverUser) {
        redirect('/login')
    }

    const headerData = await getHeaderData(serverUser.userId)

    return (
        <>
            {/* Header renders immediately — fast single query */}
            <DashboardClient section="header" data={headerData as Partial<DashboardData> as DashboardData} />

            {/* Stats load independently with skeleton fallback */}
            <Suspense fallback={<StatsSkeleton />}>
                <DashboardStats userId={serverUser.userId} />
            </Suspense>

            {/* Content loads independently with skeleton fallback */}
            <Suspense fallback={<ContentSkeleton />}>
                <DashboardContent userId={serverUser.userId} />
            </Suspense>
        </>
    )
}
