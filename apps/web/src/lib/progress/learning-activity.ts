import { Prisma, prisma } from '@fuxie/database'

const ACTIVITY_XP = {
    EXAM_ATTEMPT: 10,
    EXAM_PASS: 25,
    READING_COMPLETE: 10,
    READING_PERFECT: 20,
    LISTENING_COMPLETE: 10,
    LISTENING_PERFECT: 20,
    WRITING_SUBMIT: 15,
    GRAMMAR_COMPLETE: 10,
    GRAMMAR_PERFECT: 15,
    SPEAKING_SUBMIT: 10,
    STREAK_BONUS_7: 50,
    STREAK_BONUS_30: 200,
    STREAK_BONUS_100: 500,
} as const

export type ProgressDbClient = Prisma.TransactionClient | typeof prisma

export interface LearningActivityInput {
    userId: string
    lessonId?: string | null
    exerciseId?: string | null
    score?: number | null
    maxScore?: number | null
    percentScore?: number | null
    xpEarned: number
    timeSpentSeconds?: number | null
    lessonsCompleted?: number
    exercisesCompleted?: number
    srsReviewed?: number
    wordsLearned?: number
    updateStreak?: boolean
}

export interface LearningActivityResult {
    xpEarned: number
    baseXpEarned: number
    streakBonusXp: number
    streak: {
        currentStreak: number
        isNewDay: boolean
        freezeUsed: boolean
        freezesAvailable: number
        freezesUsed: number
        freezeUsageId: string | null
    }
}

interface StreakUpdateResult {
    currentStreak: number
    isNewDay: boolean
    freezeUsed: boolean
    freezesAvailable: number
    freezesUsed: number
    freezeUsageId: string | null
}

export function calculateExamXp(passed: boolean) {
    return passed ? ACTIVITY_XP.EXAM_PASS : ACTIVITY_XP.EXAM_ATTEMPT
}

export function calculateReadingXp(percentScore: number) {
    return percentScore >= 100 ? ACTIVITY_XP.READING_PERFECT : ACTIVITY_XP.READING_COMPLETE
}

export function calculateListeningXp(percentScore: number) {
    return percentScore >= 100
        ? ACTIVITY_XP.LISTENING_PERFECT
        : ACTIVITY_XP.LISTENING_COMPLETE
}

export function calculateWritingXp() {
    return ACTIVITY_XP.WRITING_SUBMIT
}

export function calculateGrammarXp(percentScore: number) {
    return percentScore >= 100 ? ACTIVITY_XP.GRAMMAR_PERFECT : ACTIVITY_XP.GRAMMAR_COMPLETE
}

export function calculateSpeakingXp() {
    return ACTIVITY_XP.SPEAKING_SUBMIT
}

export async function recordLearningActivity(
    tx: ProgressDbClient,
    input: LearningActivityInput
): Promise<LearningActivityResult> {
    const streak =
        input.updateStreak === false
            ? { currentStreak: 0, isNewDay: false, freezeUsed: false, freezesAvailable: 0, freezesUsed: 0, freezeUsageId: null }
            : await updateUserStreak(tx, input)

    const streakBonusXp = streak.isNewDay ? getStreakBonusXp(streak.currentStreak) : 0
    const totalXp = input.xpEarned + streakBonusXp
    const totalMinutes = secondsToTrackedMinutes(input.timeSpentSeconds)
    const today = startOfToday()
    const lessonsCompleted = input.lessonsCompleted ?? 0
    const exercisesCompleted = input.exercisesCompleted ?? 0
    const srsReviewed = input.srsReviewed ?? 0
    const wordsLearned = input.wordsLearned ?? 0

    await Promise.all([
        tx.dailyActivity.upsert({
            where: {
                userId_date: {
                    userId: input.userId,
                    date: today,
                },
            },
            update: {
                xpEarned: { increment: totalXp },
                totalMinutes: { increment: totalMinutes },
                lessonsCompleted: { increment: lessonsCompleted },
                exercisesCompleted: { increment: exercisesCompleted },
                srsReviewed: { increment: srsReviewed },
                wordsLearned: { increment: wordsLearned },
            },
            create: {
                userId: input.userId,
                date: today,
                xpEarned: totalXp,
                totalMinutes,
                lessonsCompleted,
                exercisesCompleted,
                srsReviewed,
                wordsLearned,
            },
        }),
        tx.userProfile.updateMany({
            where: { userId: input.userId },
            data: buildProfileUpdate(totalXp, totalMinutes, lessonsCompleted, wordsLearned),
        }),
        shouldCreateProgressEntry(input)
            ? tx.userProgress.create({
                data: {
                    userId: input.userId,
                    lessonId: input.lessonId ?? null,
                    exerciseId: input.exerciseId ?? null,
                    score: input.score ?? null,
                    maxScore: input.maxScore ?? null,
                    percentScore: input.percentScore ?? null,
                    xpEarned: totalXp,
                    timeSpentSeconds: input.timeSpentSeconds ?? null,
                },
            })
            : Promise.resolve(null),
    ])

    return {
        xpEarned: totalXp,
        baseXpEarned: input.xpEarned,
        streakBonusXp,
        streak,
    }
}

function buildProfileUpdate(
    xpEarned: number,
    totalMinutes: number,
    lessonsCompleted: number,
    wordsLearned: number
): Prisma.UserProfileUpdateManyMutationInput {
    const data: Prisma.UserProfileUpdateManyMutationInput = {
        totalXp: { increment: xpEarned },
    }

    if (totalMinutes > 0) {
        data.totalStudyMinutes = { increment: totalMinutes }
    }

    if (lessonsCompleted > 0) {
        data.totalLessonsCompleted = { increment: lessonsCompleted }
    }

    if (wordsLearned > 0) {
        data.totalWordsLearned = { increment: wordsLearned }
    }

    return data
}

function secondsToTrackedMinutes(timeSpentSeconds?: number | null) {
    if (!timeSpentSeconds || timeSpentSeconds <= 0) {
        return 0
    }

    return Math.max(1, Math.ceil(timeSpentSeconds / 60))
}

function shouldCreateProgressEntry(input: LearningActivityInput) {
    return Boolean(
        input.lessonId ??
            input.exerciseId ??
            input.score ??
            input.maxScore ??
            input.percentScore ??
            input.timeSpentSeconds
    )
}

function startOfToday() {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return today
}

function startOfYesterday(today: Date) {
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    return yesterday
}

async function updateUserStreak(
    tx: ProgressDbClient,
    input: LearningActivityInput
): Promise<StreakUpdateResult> {
    const today = startOfToday()
    const yesterday = startOfYesterday(today)
    const userId = input.userId
    const streak = await tx.userStreak.findUnique({
        where: { userId },
    })

    if (!streak) {
        await tx.userStreak.create({
            data: {
                userId,
                currentStreak: 1,
                longestStreak: 1,
                lastActivityDate: today,
            },
        })

        return { currentStreak: 1, isNewDay: true, freezeUsed: false, freezesAvailable: 1, freezesUsed: 0, freezeUsageId: null }
    }

    if (streak.lastActivityDate && streak.lastActivityDate.getTime() >= today.getTime()) {
        return {
            currentStreak: streak.currentStreak,
            isNewDay: false,
            freezeUsed: false,
            freezesAvailable: streak.freezesAvailable,
            freezesUsed: streak.freezesUsed,
            freezeUsageId: null,
        }
    }

    if (streak.lastActivityDate && streak.lastActivityDate.getTime() >= yesterday.getTime()) {
        const currentStreak = streak.currentStreak + 1
        await tx.userStreak.update({
            where: { userId },
            data: {
                currentStreak,
                longestStreak: Math.max(currentStreak, streak.longestStreak),
                lastActivityDate: today,
            },
        })

        return {
            currentStreak,
            isNewDay: true,
            freezeUsed: false,
            freezesAvailable: streak.freezesAvailable,
            freezesUsed: streak.freezesUsed,
            freezeUsageId: null,
        }
    }

    if (streak.freezesAvailable > 0 && streak.lastActivityDate) {
        const daysSinceLastActivity = Math.floor(
            (today.getTime() - streak.lastActivityDate.getTime()) / (1000 * 60 * 60 * 24)
        )

        if (daysSinceLastActivity <= 2) {
            const currentStreak = streak.currentStreak + 1
            const freezesAvailable = Math.max(0, streak.freezesAvailable - 1)
            const freezesUsed = streak.freezesUsed + 1
            await tx.userStreak.update({
                where: { userId },
                data: {
                    currentStreak,
                    longestStreak: Math.max(currentStreak, streak.longestStreak),
                    lastActivityDate: today,
                    freezesAvailable: { decrement: 1 },
                    freezesUsed: { increment: 1 },
                },
            })
            const usage = await tx.streakFreezeUsage.create({
                data: {
                    userId,
                    usedAt: today,
                    protectedStreak: currentStreak,
                    freezesRemaining: freezesAvailable,
                    freezesUsedTotal: freezesUsed,
                    missedDays: Math.max(1, daysSinceLastActivity - 1),
                    ...buildStreakFreezeUsageSource(input, today),
                },
                select: { id: true },
            })

            return {
                currentStreak,
                isNewDay: true,
                freezeUsed: true,
                freezesAvailable,
                freezesUsed,
                freezeUsageId: usage.id,
            }
        }
    }

    await tx.userStreak.update({
        where: { userId },
        data: {
            currentStreak: 1,
            lastActivityDate: today,
        },
    })

    return {
        currentStreak: 1,
        isNewDay: true,
        freezeUsed: false,
        freezesAvailable: streak.freezesAvailable,
        freezesUsed: streak.freezesUsed,
        freezeUsageId: null,
    }
}

function buildStreakFreezeUsageSource(input: LearningActivityInput, today: Date): {
    sourceType: string
    sourceId: string
    metadata: Prisma.InputJsonValue
} {
    const sourceType = input.lessonId
        ? 'lesson'
        : input.exerciseId
            ? 'exercise'
            : 'learning_activity'
    const sourceId = input.lessonId
        ?? input.exerciseId
        ?? today.toISOString().slice(0, 10)

    return {
        sourceType,
        sourceId,
        metadata: {
            lessonId: input.lessonId ?? null,
            exerciseId: input.exerciseId ?? null,
            score: input.score ?? null,
            maxScore: input.maxScore ?? null,
            percentScore: input.percentScore ?? null,
            xpEarned: input.xpEarned,
            timeSpentSeconds: input.timeSpentSeconds ?? null,
        },
    }
}

function getStreakBonusXp(currentStreak: number) {
    switch (currentStreak) {
        case 100:
            return ACTIVITY_XP.STREAK_BONUS_100
        case 30:
            return ACTIVITY_XP.STREAK_BONUS_30
        case 7:
            return ACTIVITY_XP.STREAK_BONUS_7
        default:
            return 0
    }
}
