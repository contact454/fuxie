import { prisma } from '@fuxie/database'

export type SkillKey = 'HOEREN' | 'LESEN' | 'SCHREIBEN' | 'SPRECHEN' | 'GRAMMATIK' | 'WORTSCHATZ'

export type TodayPlanActionType = 'srs' | 'assignment' | 'lesson' | 'exam'

export interface ActivitySignal {
    date: Date
    totalMinutes: number
    xpEarned?: number
}

export interface ContentCandidate {
    id: string
    skill: SkillKey
    title: string
    href: string
    estimatedMinutes: number
    label: string
}

export interface AssignmentCandidate {
    id: string
    title: string
    targetType: string
    targetId: string | null
    targetMeta?: unknown
    dueDate: Date | null
    classroomName?: string | null
}

export interface TodayPlanInput {
    profile: {
        currentLevel: string
        targetLevel?: string | null
        targetExam?: string | null
        targetExamDate?: Date | null
        studyGoalMinutes?: number | null
    }
    dueSrsCount: number
    todayMinutes: number
    recentActivities: ActivitySignal[]
    weakSkills: SkillKey[]
    skillScores: Partial<Record<SkillKey, number>>
    pendingAssignments: AssignmentCandidate[]
    candidates: Partial<Record<SkillKey, ContentCandidate>>
    now?: Date
}

export interface TodayPlanAction {
    id: string
    type: TodayPlanActionType
    title: string
    reason: string
    href: string
    skill: SkillKey | 'SRS' | 'EXAM'
    estimatedMinutes: number
    priority: number
    dueDate: string | null
    badge: string | null
}

export interface TodayPlan {
    generatedAt: string
    currentLevel: string
    targetLevel: string | null
    goalMinutes: number
    currentMinutes: number
    remainingMinutes: number
    focus: string
    weakSkills: SkillKey[]
    dueSrsCount: number
    actions: TodayPlanAction[]
    signals: {
        recentMinutes7d: number
        pendingAssignments: number
        examDaysLeft: number | null
    }
}

const DEFAULT_SKILL_ORDER: SkillKey[] = ['WORTSCHATZ', 'GRAMMATIK', 'HOEREN', 'LESEN', 'SCHREIBEN', 'SPRECHEN']

const SKILL_LABELS: Record<SkillKey, string> = {
    HOEREN: 'Nghe',
    LESEN: 'Đọc',
    SCHREIBEN: 'Viết',
    SPRECHEN: 'Nói',
    GRAMMATIK: 'Ngữ pháp',
    WORTSCHATZ: 'Từ vựng',
}

export async function getTodayPlan(userId: string, now = new Date()): Promise<TodayPlan> {
    const todayStart = startOfDay(now)
    const sevenDaysAgo = new Date(todayStart)
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6)

    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
            profile: true,
            learningPath: true,
            settings: true,
        },
    })

    if (!user) {
        throw new Error('User not found')
    }

    const currentLevel = String(user.profile?.currentLevel ?? user.learningPath?.currentCefrLevel ?? 'A1')

    const [
        dueSrsCount,
        recentActivities,
        todayActivity,
        skillAssessments,
        pendingAssignments,
        candidates,
    ] = await Promise.all([
        prisma.srsCard.count({ where: { userId, nextReviewAt: { lte: now } } }),
        prisma.dailyActivity.findMany({
            where: { userId, date: { gte: sevenDaysAgo } },
            orderBy: { date: 'asc' },
            select: { date: true, totalMinutes: true, xpEarned: true },
        }),
        prisma.dailyActivity.findFirst({
            where: { userId, date: { gte: todayStart } },
            orderBy: { date: 'desc' },
            select: { totalMinutes: true },
        }),
        prisma.skillAssessment.findMany({
            where: { userId },
            orderBy: { assessedAt: 'desc' },
            take: 18,
            select: { skill: true, score: true },
        }),
        prisma.assignmentSubmission.findMany({
            where: { studentId: userId, status: { in: ['pending', 'late'] } },
            include: {
                assignment: {
                    select: {
                        id: true,
                        title: true,
                        targetType: true,
                        targetId: true,
                        targetMeta: true,
                        dueDate: true,
                        classroom: { select: { name: true } },
                    },
                },
            },
            take: 12,
        }),
        getContentCandidates(userId, currentLevel),
    ])

    return buildTodayPlan({
        profile: {
            currentLevel,
            targetLevel: user.profile?.targetLevel ?? user.learningPath?.targetCefrLevel ?? null,
            targetExam: user.profile?.targetExam ?? user.learningPath?.targetExamType ?? null,
            targetExamDate: user.profile?.targetExamDate ?? user.learningPath?.targetDate ?? null,
            studyGoalMinutes: user.profile?.studyGoalMinutes ?? user.settings?.srsNewCardsPerDay ?? 15,
        },
        dueSrsCount,
        todayMinutes: todayActivity?.totalMinutes ?? 0,
        recentActivities,
        weakSkills: normalizeSkills(user.learningPath?.weakSkills ?? []),
        skillScores: latestSkillScores(skillAssessments),
        pendingAssignments: pendingAssignments
            .map((submission) => ({
                id: submission.assignment.id,
                title: submission.assignment.title,
                targetType: submission.assignment.targetType,
                targetId: submission.assignment.targetId,
                targetMeta: submission.assignment.targetMeta,
                dueDate: submission.assignment.dueDate,
                classroomName: submission.assignment.classroom.name,
            }))
            .sort(compareAssignments),
        candidates,
        now,
    })
}

export function buildTodayPlan(input: TodayPlanInput): TodayPlan {
    const now = input.now ?? new Date()
    const goalMinutes = input.profile.studyGoalMinutes ?? 15
    const remainingMinutes = Math.max(0, goalMinutes - input.todayMinutes)
    const recentMinutes7d = input.recentActivities.reduce((sum, activity) => sum + activity.totalMinutes, 0)
    const examDaysLeft = getDaysLeft(input.profile.targetExamDate ?? null, now)
    const weakSkills = getWeakSkillOrder(input)
    const actions: TodayPlanAction[] = []

    if (input.dueSrsCount > 0) {
        actions.push({
            id: 'srs-due',
            type: 'srs',
            title: 'Ôn SRS',
            reason: `${input.dueSrsCount} thẻ cần ôn`,
            href: '/review',
            skill: 'SRS',
            estimatedMinutes: Math.min(20, Math.max(5, Math.ceil(input.dueSrsCount / 4))),
            priority: 100 + Math.min(input.dueSrsCount, 40),
            dueDate: null,
            badge: `${input.dueSrsCount}`,
        })
    }

    for (const assignment of input.pendingAssignments.slice(0, 2)) {
        actions.push({
            id: `assignment-${assignment.id}`,
            type: 'assignment',
            title: assignment.title,
            reason: assignmentReason(assignment, now),
            href: hrefForAssignment(assignment),
            skill: skillForTargetType(assignment.targetType) ?? 'EXAM',
            estimatedMinutes: 15,
            priority: assignmentPriority(assignment, now),
            dueDate: assignment.dueDate?.toISOString() ?? null,
            badge: assignment.classroomName ?? 'Bài được giao',
        })
    }

    for (const skill of weakSkills) {
        const candidate = input.candidates[skill]
        if (!candidate) continue
        actions.push({
            id: `skill-${skill}-${candidate.id}`,
            type: 'lesson',
            title: candidate.title,
            reason: `${candidate.label}: củng cố trọng tâm hiện tại`,
            href: candidate.href,
            skill,
            estimatedMinutes: candidate.estimatedMinutes,
            priority: 70 - actions.filter((action) => action.type === 'lesson').length,
            dueDate: null,
            badge: SKILL_LABELS[skill],
        })
    }

    if (input.profile.targetExam) {
        actions.push({
            id: 'target-exam',
            type: 'exam',
            title: `Luyện ${input.profile.targetExam} ${input.profile.targetLevel ?? input.profile.currentLevel}`,
            reason: examDaysLeft !== null ? `${examDaysLeft} ngày đến kỳ thi` : 'Đã đặt mục tiêu thi',
            href: '/exam',
            skill: 'EXAM',
            estimatedMinutes: 20,
            priority: examDaysLeft !== null && examDaysLeft <= 30 ? 82 : 58,
            dueDate: input.profile.targetExamDate?.toISOString() ?? null,
            badge: input.profile.targetExam,
        })
    }

    for (const skill of DEFAULT_SKILL_ORDER) {
        const candidate = input.candidates[skill]
        if (!candidate) continue
        actions.push({
            id: `fallback-${skill}-${candidate.id}`,
            type: 'lesson',
            title: candidate.title,
            reason: `${candidate.label}: bước tiếp theo phù hợp`,
            href: candidate.href,
            skill,
            estimatedMinutes: candidate.estimatedMinutes,
            priority: 35 - DEFAULT_SKILL_ORDER.indexOf(skill),
            dueDate: null,
            badge: SKILL_LABELS[skill],
        })
    }

    const uniqueActions = dedupeActions(actions)
        .sort((a, b) => b.priority - a.priority)
        .slice(0, 5)

    return {
        generatedAt: now.toISOString(),
        currentLevel: input.profile.currentLevel,
        targetLevel: input.profile.targetLevel ?? null,
        goalMinutes,
        currentMinutes: input.todayMinutes,
        remainingMinutes,
        focus: getFocusLabel(uniqueActions, weakSkills, remainingMinutes),
        weakSkills,
        dueSrsCount: input.dueSrsCount,
        actions: uniqueActions,
        signals: {
            recentMinutes7d,
            pendingAssignments: input.pendingAssignments.length,
            examDaysLeft,
        },
    }
}

async function getContentCandidates(userId: string, level: string): Promise<Partial<Record<SkillKey, ContentCandidate>>> {
    const [
        vocabularyTheme,
        grammarLesson,
        listeningLesson,
        readingExercise,
        writingExercise,
        speakingLesson,
    ] = await Promise.all([
        prisma.vocabularyTheme.findFirst({
            where: { cefrLevel: level as any },
            orderBy: { sortOrder: 'asc' },
            select: { slug: true, name: true },
        }).catch(() => null),
        prisma.grammarLesson.findFirst({
            where: {
                level: level as any,
                status: 'PUBLISHED',
                progress: { none: { userId, completed: true } },
            },
            orderBy: { sortOrder: 'asc' },
            select: { id: true, titleDe: true, estimatedMin: true, topic: { select: { slug: true } } },
        }).catch(() => null),
        prisma.listeningLesson.findFirst({
            where: {
                cefrLevel: level as any,
                attempts: { none: { userId } },
            },
            orderBy: { sortOrder: 'asc' },
            select: { lessonId: true, title: true, topic: true, audioDuration: true },
        }).catch(() => null),
        prisma.readingExercise.findFirst({
            where: {
                cefrLevel: level as any,
                attempts: { none: { userId } },
            },
            orderBy: { sortOrder: 'asc' },
            select: { exerciseId: true, teilName: true, topic: true },
        }).catch(() => null),
        prisma.writingExercise.findFirst({
            where: {
                cefrLevel: level as any,
                status: 'PUBLISHED',
                attempts: { none: { userId } },
            },
            orderBy: { sortOrder: 'asc' },
            select: { exerciseId: true, topic: true, textType: true, timeMinutes: true },
        }).catch(() => null),
        prisma.speakingLesson.findFirst({
            where: {
                level: level as any,
                status: 'PUBLISHED',
                progress: { none: { userId, completed: true } },
            },
            orderBy: { sortOrder: 'asc' },
            select: { id: true, titleDe: true, estimatedMin: true },
        }).catch(() => null),
    ])

    return {
        ...(vocabularyTheme ? {
            WORTSCHATZ: {
                id: vocabularyTheme.slug,
                skill: 'WORTSCHATZ',
                title: vocabularyTheme.name,
                href: '/vocabulary',
                estimatedMinutes: 10,
                label: 'Từ vựng',
            },
        } : {}),
        ...(grammarLesson ? {
            GRAMMATIK: {
                id: grammarLesson.id,
                skill: 'GRAMMATIK',
                title: grammarLesson.titleDe,
                href: `/grammar/${grammarLesson.topic.slug}/${grammarLesson.id}`,
                estimatedMinutes: grammarLesson.estimatedMin,
                label: 'Ngữ pháp',
            },
        } : {}),
        ...(listeningLesson ? {
            HOEREN: {
                id: listeningLesson.lessonId,
                skill: 'HOEREN',
                title: listeningLesson.topic || listeningLesson.title,
                href: `/listening/${listeningLesson.lessonId}`,
                estimatedMinutes: Math.max(8, Math.ceil((listeningLesson.audioDuration ?? 300) / 60) + 5),
                label: 'Nghe',
            },
        } : {}),
        ...(readingExercise ? {
            LESEN: {
                id: readingExercise.exerciseId,
                skill: 'LESEN',
                title: readingExercise.topic || readingExercise.teilName,
                href: `/reading/${readingExercise.exerciseId}`,
                estimatedMinutes: 12,
                label: 'Đọc',
            },
        } : {}),
        ...(writingExercise ? {
            SCHREIBEN: {
                id: writingExercise.exerciseId,
                skill: 'SCHREIBEN',
                title: `${writingExercise.textType}: ${writingExercise.topic}`,
                href: `/writing/${writingExercise.exerciseId}`,
                estimatedMinutes: writingExercise.timeMinutes,
                label: 'Viết',
            },
        } : {}),
        ...(speakingLesson ? {
            SPRECHEN: {
                id: speakingLesson.id,
                skill: 'SPRECHEN',
                title: speakingLesson.titleDe,
                href: `/speaking/${speakingLesson.id}`,
                estimatedMinutes: speakingLesson.estimatedMin,
                label: 'Nói',
            },
        } : {}),
    }
}

function latestSkillScores(assessments: Array<{ skill: unknown; score: number }>) {
    const scores: Partial<Record<SkillKey, number>> = {}
    for (const assessment of assessments) {
        const skill = normalizeSkill(assessment.skill)
        if (!skill || scores[skill] !== undefined) continue
        scores[skill] = assessment.score
    }
    return scores
}

function getWeakSkillOrder(input: TodayPlanInput): SkillKey[] {
    const explicitWeakSkills = input.weakSkills
    const assessedWeakSkills = Object.entries(input.skillScores)
        .filter(([, score]) => typeof score === 'number' && score < 68)
        .sort((a, b) => (a[1] ?? 0) - (b[1] ?? 0))
        .map(([skill]) => skill as SkillKey)

    return uniqueSkills([
        ...explicitWeakSkills,
        ...assessedWeakSkills,
        ...DEFAULT_SKILL_ORDER,
    ])
}

function dedupeActions(actions: TodayPlanAction[]) {
    const seen = new Set<string>()
    const result: TodayPlanAction[] = []

    for (const action of actions) {
        const key = `${action.type}:${action.href}`
        if (seen.has(key)) continue
        seen.add(key)
        result.push(action)
    }

    return result
}

function normalizeSkills(values: unknown[]): SkillKey[] {
    return uniqueSkills(values.map(normalizeSkill).filter(Boolean) as SkillKey[])
}

function normalizeSkill(value: unknown): SkillKey | null {
    if (
        value === 'HOEREN' ||
        value === 'LESEN' ||
        value === 'SCHREIBEN' ||
        value === 'SPRECHEN' ||
        value === 'GRAMMATIK' ||
        value === 'WORTSCHATZ'
    ) {
        return value
    }

    return null
}

function uniqueSkills(skills: SkillKey[]) {
    return [...new Set(skills)]
}

function startOfDay(date: Date) {
    const value = new Date(date)
    value.setHours(0, 0, 0, 0)
    return value
}

function compareAssignments(a: AssignmentCandidate, b: AssignmentCandidate) {
    if (!a.dueDate && !b.dueDate) return 0
    if (!a.dueDate) return 1
    if (!b.dueDate) return -1
    return a.dueDate.getTime() - b.dueDate.getTime()
}

function assignmentPriority(assignment: AssignmentCandidate, now: Date) {
    if (!assignment.dueDate) return 76
    const daysLeft = getDaysLeft(assignment.dueDate, now)
    if (daysLeft === null) return 76
    if (daysLeft < 0) return 96
    if (daysLeft <= 1) return 92
    if (daysLeft <= 3) return 86
    return 78
}

function assignmentReason(assignment: AssignmentCandidate, now: Date) {
    if (!assignment.dueDate) return 'Bài được giao từ lớp học'
    const daysLeft = getDaysLeft(assignment.dueDate, now)
    if (daysLeft === null) return 'Bài được giao từ lớp học'
    if (daysLeft < 0) return 'Quá hạn'
    if (daysLeft === 0) return 'Hạn hôm nay'
    if (daysLeft === 1) return 'Hạn ngày mai'
    return `Còn ${daysLeft} ngày`
}

function hrefForAssignment(assignment: AssignmentCandidate) {
    const targetId = assignment.targetId
    const targetMeta = isObject(assignment.targetMeta) ? assignment.targetMeta : {}
    const topicSlug = typeof targetMeta.topicSlug === 'string' ? targetMeta.topicSlug : null

    switch (assignment.targetType) {
        case 'reading':
            return targetId ? `/reading/${targetId}` : '/reading'
        case 'listening':
            return targetId ? `/listening/${targetId}` : '/listening'
        case 'writing':
            return targetId ? `/writing/${targetId}` : '/writing'
        case 'speaking':
            return targetId ? `/speaking/${targetId}` : '/speaking'
        case 'grammar':
            return topicSlug && targetId ? `/grammar/${topicSlug}/${targetId}` : '/grammar'
        case 'vocabulary':
            return '/vocabulary'
        case 'exam':
            return targetId ? `/exam/${targetId}` : '/exam'
        default:
            return '/dashboard'
    }
}

function skillForTargetType(targetType: string): SkillKey | null {
    switch (targetType) {
        case 'reading':
            return 'LESEN'
        case 'listening':
            return 'HOEREN'
        case 'writing':
            return 'SCHREIBEN'
        case 'speaking':
            return 'SPRECHEN'
        case 'grammar':
            return 'GRAMMATIK'
        case 'vocabulary':
            return 'WORTSCHATZ'
        default:
            return null
    }
}

function getDaysLeft(date: Date | null, now: Date) {
    if (!date) return null
    const target = startOfDay(date)
    const current = startOfDay(now)
    return Math.ceil((target.getTime() - current.getTime()) / 86400000)
}

function getFocusLabel(actions: TodayPlanAction[], weakSkills: SkillKey[], remainingMinutes: number) {
    if (actions[0]?.type === 'srs') return 'Ôn trước'
    if (actions[0]?.type === 'assignment') return 'Bài được giao'
    if (weakSkills[0]) return SKILL_LABELS[weakSkills[0]]
    return remainingMinutes > 0 ? 'Mục tiêu ngày' : 'Giữ nhịp học'
}

function isObject(value: unknown): value is Record<string, unknown> {
    return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}
