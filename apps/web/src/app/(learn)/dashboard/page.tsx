import { Suspense, cache, type ReactNode } from 'react'
import { redirect } from 'next/navigation'
import Image from 'next/image'
import { getTranslations } from 'next-intl/server'
import { prisma } from '@fuxie/database'
import { getServerUser } from '@/lib/auth/server-auth'
import { cacheWrap } from '@/lib/cache/redis'
import { getDashboardUserContext, getTodayActivitySummary } from '@/lib/dashboard/request-data'
import { getMissionBoard } from '@/lib/gamification/missions'
import { buildFirstSessionPathProgress } from '@/lib/gamification/lesson-gameplay-expansion'
import { buildSkillMasterySnapshot } from '@/lib/gamification/skill-mastery'
import { calculateFuxieXpLevel } from '@/lib/gamification/xp-level'
import { getTodayPlan } from '@/lib/personalization/today-plan'
import { DashboardClientDynamic } from '@/components/dashboard/DashboardClientDynamic'
import { DashboardBackboneHero } from '@/components/dashboard/dashboard-backbone-hero'
import { StateShell } from '@/components/gamification/state-shell'
import type { DashboardData } from '@/components/dashboard/dashboard-client'
import type { AdaptiveQuestPacingSignals } from '@/lib/gamification/adaptive-quest-pacing'
import { StatsSkeleton, ContentSkeleton } from '@/components/dashboard/dashboard-skeletons'
import { FUXIE_WORLD_PROPS, FUXIE_MASCOT_STATES } from '@/lib/mascot/fuxie-assets'
import {
    isSlice3VisualQaFixture,
    Slice3MissionsEmptyFixture,
} from '@/components/visual-fixtures/slice-3-motivation-fixtures'

function getTimeGreeting(): string {
    const hour = new Date().getHours()
    if (hour < 6) return 'Gute Nacht'
    if (hour < 12) return 'Guten Morgen'
    if (hour < 18) return 'Guten Tag'
    return 'Guten Abend'
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
    const { level, title } = calculateFuxieXpLevel(totalXp)

    let examDaysLeft: number | null = null
    if (profile?.targetExamDate) {
        const diff = profile.targetExamDate.getTime() - Date.now()
        examDaysLeft = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
    }

    return {
        greeting: getTimeGreeting(),
        // Backbone-relevant raw signal: does the learner have an active path
        // record? Per Req 3.6 the empty state is keyed off "no active learning
        // path" — we treat a missing learningPath OR zero completed lessons
        // as the first-time empty case to keep the hero useful for new users.
        hasLearningPath: Boolean(learningPath),
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
            freezesAvailable: streak?.freezesAvailable ?? 0,
            freezesUsed: streak?.freezesUsed ?? 0,
        },
    }
})

type HeaderData = Awaited<ReturnType<typeof getHeaderData>>

/** Stats — SRS counts + today's activity */
const getStatsData = cache(async (userId: string) => {
    return cacheWrap(`dash:stats:${userId}`, 30, async () => {
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
})

/** Content — weekly activity, skills, achievements, listening, grammar */
async function getContentData(userId: string) {
    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const sevenDaysAgo = new Date(todayStart)
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6)
    const masterySince = new Date(todayStart)
    masterySince.setDate(masterySince.getDate() - 89)

    const [weeklyActivities, skillAssessments, recentAchievements, masteryEvents, firstSessionEvents, listeningStats, grammarStats] = await Promise.all([
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
                        slug: true,
                        title: true,
                        titleDe: true,
                        iconUrl: true,
                        category: true,
                    },
                },
            },
        }),
        prisma.analyticsEvent.findMany({
            where: {
                userId,
                role: 'LEARNER',
                eventName: 'meaningful_action_completed',
                createdAt: { gte: masterySince },
            },
            select: {
                userId: true,
                eventName: true,
                actionId: true,
                actionType: true,
                level: true,
                skill: true,
                metadata: true,
                createdAt: true,
            },
            orderBy: { createdAt: 'asc' },
        }),
        prisma.analyticsEvent.findMany({
            where: {
                userId,
                role: 'LEARNER',
                OR: [
                    {
                        eventName: 'meaningful_action_completed',
                        actionType: 'vocabulary_practice',
                        createdAt: { gte: masterySince },
                    },
                    {
                        eventName: 'quest_episode_completed',
                        actionType: 'speaking_submission',
                        createdAt: { gte: masterySince },
                    },
                ],
            },
            select: {
                eventName: true,
                actionId: true,
                actionType: true,
                skill: true,
                metadata: true,
                createdAt: true,
            },
            orderBy: { createdAt: 'asc' },
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
    const dayLabels = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']
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
        HOEREN: 'Nghe', LESEN: 'Đọc', SCHREIBEN: 'Viết',
        SPRECHEN: 'Nói', GRAMMATIK: 'Ngữ pháp', WORTSCHATZ: 'Từ vựng',
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
        skillMastery: buildSkillMasterySnapshot({
            events: masteryEvents,
            earnedBadgeSlugs: recentAchievements.map((ua) => ua.achievement.slug),
        }),
        firstContactPath: buildFirstSessionPathProgress(firstSessionEvents),
    }
}

async function getStreakFreezeTimeline(userId: string) {
    const usages = await prisma.streakFreezeUsage.findMany({
        where: { userId },
        orderBy: { usedAt: 'desc' },
        take: 3,
        select: {
            id: true,
            usedAt: true,
            protectedStreak: true,
            freezesRemaining: true,
            missedDays: true,
            sourceType: true,
            sourceId: true,
        },
    })

    return usages.map((usage) => ({
        ...usage,
        usedAt: usage.usedAt.toISOString(),
    }))
}

async function getAdaptivePacingSignals(userId: string, now = new Date()): Promise<AdaptiveQuestPacingSignals> {
    const sevenDaysAgo = new Date(now)
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6)
    sevenDaysAgo.setHours(0, 0, 0, 0)

    const [events, shopRequests7d] = await Promise.all([
        prisma.analyticsEvent.findMany({
            where: {
                userId,
                role: 'LEARNER',
                eventName: {
                    in: [
                        'meaningful_action_completed',
                        'reward_redeem_requested',
                        'gamification_intervention_shown',
                        'gamification_intervention_clicked',
                    ],
                },
                createdAt: { gte: sevenDaysAgo, lte: now },
            },
            select: {
                eventName: true,
                createdAt: true,
            },
        }),
        prisma.shopRedeemRequest.count({
            where: {
                userId,
                requestedAt: { gte: sevenDaysAgo, lte: now },
            },
        }),
    ])
    const meaningfulActions = events.filter((event) => event.eventName === 'meaningful_action_completed')

    return {
        meaningfulActions7d: meaningfulActions.length,
        meaningfulDays7d: new Set(meaningfulActions.map((event) => event.createdAt.toISOString().slice(0, 10))).size,
        rewardRequests7d: Math.max(
            shopRequests7d,
            events.filter((event) => event.eventName === 'reward_redeem_requested').length,
        ),
        interventionShown7d: events.filter((event) => event.eventName === 'gamification_intervention_shown').length,
        interventionClicked7d: events.filter((event) => event.eventName === 'gamification_intervention_clicked').length,
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
        <DashboardClientDynamic
            section="stats"
            data={{ ...headerData, ...statsData } as Partial<DashboardData> as DashboardData}
        />
    )
}

async function DashboardContent({ userId }: { userId: string }) {
    const [headerData, statsData, contentData, todayPlan, missionBoard, adaptivePacing, streakFreezeTimeline] = await Promise.all([
        getHeaderData(userId),
        getStatsData(userId),
        cacheWrap(`dash:content:${userId}`, 60, () => getContentData(userId)),
        cacheWrap(`dash:today-plan:${userId}`, 30, () => getTodayPlan(userId)),
        cacheWrap(`dash:mission-board:${userId}`, 30, () => getMissionBoard(userId)),
        cacheWrap(`dash:adaptive-pacing:${userId}`, 30, () => getAdaptivePacingSignals(userId)),
        cacheWrap(`dash:freeze-timeline:${userId}`, 30, () => getStreakFreezeTimeline(userId)),
    ])

    return (
        <DashboardClientDynamic
            section="content"
            data={{ ...headerData, ...statsData, ...contentData, todayPlan, missionBoard, adaptivePacing, streakFreezeTimeline } as DashboardData}
        />
    )
}

// ===== BACKBONE HERO (Task 8.1) =====

/**
 * Resolve the backbone hero state from header data per Req 3.6.
 *
 * - `empty` when the learner has no `LearningPath` record OR has not yet
 *   completed any lessons (first-time experience). In this state the hero
 *   hides streak/XP/quest and exposes a single Primary_CTA "Tạo lộ trình".
 * - `default` otherwise — full first-viewport composition with greeting,
 *   streak chip (Req 16.1 amber exception when `currentStreak ≥ 1`), today's
 *   XP target, quest progress hero, and Primary_CTA "Tiếp tục học".
 *
 * The `error` branch is owned by `error.tsx` via `<StateShell>` so this
 * function never returns `'error'`.
 */
function resolveHeroState(header: HeaderData): 'default' | 'empty' {
    if (!header.hasLearningPath) {
        return 'empty'
    }
    if (header.profile.totalLessonsCompleted === 0) {
        return 'empty'
    }
    return 'default'
}

async function DashboardBackboneHeroSection({ userId }: { userId: string }) {
    const [header, stats] = await Promise.all([
        getHeaderData(userId),
        getStatsData(userId),
    ])
    const state = resolveHeroState(header)
    const t = await getTranslations('Dashboard')

    const name = header.profile.displayName
    const streakCount = header.streak.currentStreak

    if (state === 'empty') {
        return (
            <div className="px-4 sm:px-6 lg:px-8 pt-4">
                <DashboardBackboneHero
                    state="empty"
                    greeting={t('greetingEmpty', { name })}
                    streakChipLabel={t('streakChipEmpty')}
                    streakCount={0}
                    xpLabel=""
                    questEyebrow=""
                    questTitle=""
                    questMessage=""
                    ctaLabel={t('ctaCreatePath')}
                    ctaHref="/onboarding"
                    progressPercent={0}
                />
            </div>
        )
    }

    // default state — full backbone composition
    const xpEarned = stats.todayActivity.xpEarned
    // The hero label is intentionally goal-only ("X/Y XP hôm nay") so the
    // first viewport can be drawn synchronously with the header data
    // without waiting on the stats query. Daily XP goal defaults to 50 XP
    // (matches design.md §I.1 example), with a small bump per study-goal
    // minute so the target scales with the learner's chosen pace.
    const xpGoal = Math.max(50, header.profile.studyGoalMinutes * 3)
    const progressPercent = xpGoal > 0 ? Math.min(100, Math.round((xpEarned / xpGoal) * 100)) : 0

    return (
        <div className="px-4 sm:px-6 lg:px-8 pt-4">
            <DashboardBackboneHero
                state="default"
                greeting={t('greetingDefault', { name })}
                streakChipLabel={t('streakChipLabel', { count: streakCount })}
                streakCount={streakCount}
                xpLabel={t('xpTargetLabel', { earned: xpEarned, goal: xpGoal })}
                questEyebrow={t('questHeroEyebrow')}
                questTitle={t('questHeroTitleDefault')}
                questMessage={t('questHeroMessageDefault')}
                ctaLabel={t('ctaContinueLearning')}
                ctaHref="/course"
                progressPercent={progressPercent}
            />
        </div>
    )
}

/**
 * Empty-state rest-of-page replacement.
 *
 * When the hero is in `empty` state we suppress the rich content below
 * (Req 3.6 forbids streak/XP/quest progress hero in this state). We still
 * render a calm StateShell-style explanation for context — the hero
 * already carries the single Primary_CTA so the shell here is
 * informational only and omits its own CTA.
 */
async function DashboardEmptyDetail({ userId }: { userId: string }) {
    const header = await getHeaderData(userId)
    if (resolveHeroState(header) !== 'empty') {
        return null
    }
    const t = await getTranslations('Dashboard')
    return (
        <div className="px-4 sm:px-6 lg:px-8 pt-4 pb-8">
            <StateShell
                surfaceId="dashboard"
                state="empty"
                title={t('emptyTitle')}
                message={t('emptyMessage')}
                primaryCta={{
                    label: t('ctaCreatePath'),
                    href: '/onboarding',
                }}
            />
        </div>
    )
}

async function DashboardDefaultBody({ userId, forceEmpty }: { userId: string; forceEmpty?: boolean }) {
    const [header, stats, content, todayPlan, missionBoard, adaptivePacing, streakFreezeTimeline] = await Promise.all([
        getHeaderData(userId),
        getStatsData(userId),
        cacheWrap(`dash:content:${userId}`, 60, () => getContentData(userId)),
        cacheWrap(`dash:today-plan:${userId}`, 30, () => getTodayPlan(userId)),
        cacheWrap(`dash:mission-board:${userId}`, 30, () => getMissionBoard(userId)),
        cacheWrap(`dash:adaptive-pacing:${userId}`, 30, () => getAdaptivePacingSignals(userId)),
        cacheWrap(`dash:freeze-timeline:${userId}`, 30, () => getStreakFreezeTimeline(userId)),
    ])

    const combinedData = {
        ...header,
        ...stats,
        ...content,
        todayPlan,
        missionBoard,
        adaptivePacing,
        streakFreezeTimeline,
    } as unknown as DashboardData

    return (
        <DashboardClientDynamic
            data={combinedData}
            forceEmpty={forceEmpty}
        />
    )
}

// ===== VISUAL QA FIXTURE =====

const DASHBOARD_VISUAL_QA_DATA: DashboardData = {
    greeting: 'Guten Morgen',
    profile: {
        displayName: 'Lina Nguyen',
        currentLevel: 'A2',
        targetLevel: 'B1',
        targetExam: 'GOETHE',
        targetExamDate: null,
        examDaysLeft: null,
        totalXp: 3420,
        totalWordsLearned: 1280,
        totalLessonsCompleted: 24,
        totalStudyMinutes: 540,
        studyGoalMinutes: 20,
        fuxieLevel: 4,
        fuxieTitle: 'Fuxie Explorer',
    },
    streak: {
        currentStreak: 7,
        longestStreak: 12,
        lastActivityDate: null,
        freezesAvailable: 1,
        freezesUsed: 0,
    },
    srs: {
        dueCount: 0,
        totalCards: 96,
        reviewedToday: 0,
    },
    todayActivity: {
        totalMinutes: 0,
        xpEarned: 0,
        lessonsCompleted: 0,
        exercisesCompleted: 0,
        srsReviewed: 0,
        wordsLearned: 0,
    },
    weeklyActivity: [
        { day: 'Mo', date: '2026-05-18', xp: 120, minutes: 20 },
        { day: 'Di', date: '2026-05-19', xp: 90, minutes: 15 },
        { day: 'Mi', date: '2026-05-20', xp: 160, minutes: 25 },
        { day: 'Do', date: '2026-05-21', xp: 110, minutes: 18 },
        { day: 'Fr', date: '2026-05-22', xp: 0, minutes: 0 },
    ],
    skills: [
        { key: 'HOEREN', label: 'Hören', score: 74, level: 'A2' },
        { key: 'LESEN', label: 'Lesen', score: 81, level: 'A2' },
        { key: 'SPRECHEN', label: 'Sprechen', score: 68, level: 'A2' },
    ],
    achievements: [],
    listening: {
        totalLessons: 12,
        completedLessons: 5,
        totalAttempts: 7,
        bestScore: 82,
    },
    grammar: {
        totalTopics: 18,
        totalLessons: 54,
        completedLessons: 17,
        totalStars: 42,
        maxStars: 162,
    },
    todayPlan: null,
    missionBoard: null,
    streakFreezeTimeline: [],
}

function isDashboardVisualQaFixture(params: { fixture?: string } | undefined) {
    return process.env.NODE_ENV !== 'production' && params?.fixture === 'visual-qa'
}

function DashboardRouteShell({
    visualState,
    children,
}: {
    visualState: 'default' | 'empty'
    children: ReactNode
}) {
    return (
        <div
            className="w-full"
            data-route="dashboard"
            data-slice="slice-1"
            data-module="01-dashboard"
            data-visual-state={visualState}
        >
            {children}
        </div>
    )
}

// ===== PAGE =====

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ state?: string; fixture?: string; module?: string }> }) {
    const params = await searchParams
    const forceEmpty = params?.state === 'empty'

    if (params?.module === 'missions' && isSlice3VisualQaFixture(params, 'empty')) {
        return <Slice3MissionsEmptyFixture />
    }

    if (isDashboardVisualQaFixture(params)) {
        return (
            <DashboardRouteShell visualState={forceEmpty ? 'empty' : 'default'}>
                <DashboardClientDynamic
                    data={DASHBOARD_VISUAL_QA_DATA}
                    forceEmpty={forceEmpty}
                />
            </DashboardRouteShell>
        )
    }

    const serverUser = await getServerUser()

    if (!serverUser) {
        redirect('/login')
    }

    return (
        <DashboardRouteShell visualState={forceEmpty ? 'empty' : 'default'}>
            <DashboardDefaultBody userId={serverUser.userId} forceEmpty={forceEmpty} />
        </DashboardRouteShell>
    )
}
