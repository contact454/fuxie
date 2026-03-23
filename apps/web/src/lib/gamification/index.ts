/**
 * Centralized gamification utilities
 * - XP tracking + daily activity upsert
 * - Streak management (auto-increment, freeze logic)
 * - Achievement checking + awarding
 */
import { prisma } from '@fuxie/database'

// ─── XP Rewards ──────────────────────────────────────
export const XP_TABLE = {
    SRS_CORRECT: 5,
    SRS_EASY: 8,
    VOCAB_LEARN: 3,
    VOCAB_PRACTICE: 5,
    GRAMMAR_COMPLETE: 10,
    GRAMMAR_PERFECT: 15,
    LISTENING_COMPLETE: 10,
    LISTENING_PERFECT: 20,
    WRITING_SUBMIT: 15,
    SPEAKING_SUBMIT: 10,
    CHAT_MESSAGE: 2,
    DAILY_GOAL_MET: 25,
    STREAK_BONUS_7: 50,
    STREAK_BONUS_30: 200,
    STREAK_BONUS_100: 500,
} as const

// ─── Award XP + Update Daily Activity ────────────────
export async function awardXp(userId: string, xp: number, activity: {
    lessonsCompleted?: number
    exercisesCompleted?: number
    srsReviewed?: number
    wordsLearned?: number
    minutesSpent?: number
}) {
    if (xp <= 0 && !Object.values(activity).some(v => v && v > 0)) return

    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)

    await prisma.$transaction([
        // Update daily activity
        prisma.dailyActivity.upsert({
            where: { userId_date: { userId, date: todayStart } },
            update: {
                xpEarned: { increment: xp },
                totalMinutes: { increment: activity.minutesSpent ?? 0 },
                lessonsCompleted: { increment: activity.lessonsCompleted ?? 0 },
                exercisesCompleted: { increment: activity.exercisesCompleted ?? 0 },
                srsReviewed: { increment: activity.srsReviewed ?? 0 },
                wordsLearned: { increment: activity.wordsLearned ?? 0 },
            },
            create: {
                userId,
                date: todayStart,
                xpEarned: xp,
                totalMinutes: activity.minutesSpent ?? 0,
                lessonsCompleted: activity.lessonsCompleted ?? 0,
                exercisesCompleted: activity.exercisesCompleted ?? 0,
                srsReviewed: activity.srsReviewed ?? 0,
                wordsLearned: activity.wordsLearned ?? 0,
            },
        }),
        // Update profile total XP
        prisma.userProfile.updateMany({
            where: { userId },
            data: { totalXp: { increment: xp } },
        }),
    ])
}

// ─── Update Streak ───────────────────────────────────
export async function updateStreak(userId: string): Promise<{ currentStreak: number; isNewDay: boolean }> {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    const streak = await prisma.userStreak.upsert({
        where: { userId },
        create: {
            userId,
            currentStreak: 1,
            longestStreak: 1,
            lastActivityDate: today,
        },
        update: {}, // We'll handle the logic below
    })

    // Already active today
    if (streak.lastActivityDate && streak.lastActivityDate.getTime() >= today.getTime()) {
        return { currentStreak: streak.currentStreak, isNewDay: false }
    }

    // Active yesterday → streak continues
    if (streak.lastActivityDate && streak.lastActivityDate.getTime() >= yesterday.getTime()) {
        const newStreak = streak.currentStreak + 1
        const newLongest = Math.max(newStreak, streak.longestStreak)
        await prisma.userStreak.update({
            where: { userId },
            data: {
                currentStreak: newStreak,
                longestStreak: newLongest,
                lastActivityDate: today,
            },
        })
        return { currentStreak: newStreak, isNewDay: true }
    }

    // Missed a day → check freeze
    if (streak.freezesAvailable > 0 && streak.lastActivityDate) {
        const daysSinceLastActivity = Math.floor((today.getTime() - streak.lastActivityDate.getTime()) / (1000 * 60 * 60 * 24))
        if (daysSinceLastActivity <= 2) {
            // Use a freeze to save the streak
            const newStreak = streak.currentStreak + 1
            await prisma.userStreak.update({
                where: { userId },
                data: {
                    currentStreak: newStreak,
                    longestStreak: Math.max(newStreak, streak.longestStreak),
                    lastActivityDate: today,
                    freezesAvailable: { decrement: 1 },
                    freezesUsed: { increment: 1 },
                },
            })
            return { currentStreak: newStreak, isNewDay: true }
        }
    }

    // Streak broken → reset
    await prisma.userStreak.update({
        where: { userId },
        data: {
            currentStreak: 1,
            lastActivityDate: today,
        },
    })
    return { currentStreak: 1, isNewDay: true }
}

// ─── Check & Award Achievements ──────────────────────
export async function checkAchievements(userId: string): Promise<Array<{ slug: string; title: string; xpReward: number }>> {
    // Get user stats
    const [profile, streak, dailyActivities, srsCards, grammarProgress] = await Promise.all([
        prisma.userProfile.findFirst({ where: { userId } }),
        prisma.userStreak.findFirst({ where: { userId } }),
        prisma.dailyActivity.count({ where: { userId } }),
        prisma.srsCard.count({ where: { userId } }),
        prisma.grammarProgress.count({ where: { userId, completed: true } }),
    ])

    if (!profile) return []

    // Get all achievements user hasn't earned yet
    const earnedIds = (await prisma.userAchievement.findMany({
        where: { userId },
        select: { achievementId: true },
    })).map(a => a.achievementId)

    const unearnedAchievements = await prisma.achievement.findMany({
        where: earnedIds.length > 0 ? { id: { notIn: earnedIds } } : {},
    })

    const newlyEarned: Array<{ slug: string; title: string; xpReward: number }> = []

    for (const achievement of unearnedAchievements) {
        let earned = false
        const val = achievement.conditionValue

        switch (achievement.conditionType) {
            case 'total_xp':
                earned = profile.totalXp >= val
                break
            case 'total_words':
                earned = profile.totalWordsLearned >= val
                break
            case 'total_lessons':
                earned = profile.totalLessonsCompleted >= val
                break
            case 'total_study_minutes':
                earned = profile.totalStudyMinutes >= val
                break
            case 'current_streak':
                earned = (streak?.currentStreak ?? 0) >= val
                break
            case 'longest_streak':
                earned = (streak?.longestStreak ?? 0) >= val
                break
            case 'total_srs_cards':
                earned = srsCards >= val
                break
            case 'total_grammar_completed':
                earned = grammarProgress >= val
                break
            case 'active_days':
                earned = dailyActivities >= val
                break
        }

        if (earned) {
            newlyEarned.push({
                slug: achievement.slug,
                title: achievement.title,
                xpReward: achievement.xpReward,
            })
        }
    }

    // Award new achievements + bonus XP
    if (newlyEarned.length > 0) {
        const achievementMap = new Map(unearnedAchievements.map(a => [a.slug, a]))
        const totalBonusXp = newlyEarned.reduce((s, a) => s + a.xpReward, 0)

        await prisma.$transaction([
            ...newlyEarned.map(a => {
                const ach = achievementMap.get(a.slug)!
                return prisma.userAchievement.create({
                    data: { userId, achievementId: ach.id },
                })
            }),
            ...(totalBonusXp > 0
                ? [prisma.userProfile.updateMany({
                    where: { userId },
                    data: { totalXp: { increment: totalBonusXp } },
                })]
                : []),
        ])
    }

    return newlyEarned
}

// ─── Full Gamification Hook (call after any activity) ─
export async function trackActivity(userId: string, xp: number, activity: {
    lessonsCompleted?: number
    exercisesCompleted?: number
    srsReviewed?: number
    wordsLearned?: number
    minutesSpent?: number
}) {
    const [streakResult] = await Promise.all([
        updateStreak(userId),
        awardXp(userId, xp, activity),
    ])

    // Streak milestones → bonus XP
    if (streakResult.isNewDay) {
        const bonuses: [number, number][] = [
            [100, XP_TABLE.STREAK_BONUS_100],
            [30, XP_TABLE.STREAK_BONUS_30],
            [7, XP_TABLE.STREAK_BONUS_7],
        ]
        for (const [days, bonus] of bonuses) {
            if (streakResult.currentStreak === days) {
                await awardXp(userId, bonus, {})
                break
            }
        }
    }

    // Check for new achievements (async, non-blocking)
    const newAchievements = await checkAchievements(userId)

    return {
        xpEarned: xp,
        streak: streakResult,
        newAchievements,
    }
}
