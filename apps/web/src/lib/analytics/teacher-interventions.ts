import { prisma } from '@fuxie/database'
import {
    getStudentRiskProfile,
    type ActivityPoint,
    type StudentAnalyticsInput,
} from './teacher-analytics'

type InterventionSkill = 'HOEREN' | 'LESEN' | 'SCHREIBEN' | 'SPRECHEN' | 'GRAMMATIK' | 'WORTSCHATZ'

export interface InterventionStudentInput extends StudentAnalyticsInput {
    classroomId?: string
}

export interface TeacherInterventionRecommendation {
    id: string
    title: string
    description: string
    targetType: string
    targetId: string | null
    targetMeta: Record<string, unknown>
    targetStudentIds: string[]
    targetStudentNames: string[]
    priority: number
    reason: string
    dueDays: number
    estimatedMinutes: number
}

export interface ClassroomInterventionResult {
    classroom: {
        id: string
        name: string
        cefrLevel: string
    }
    recommendations: TeacherInterventionRecommendation[]
}

const SKILL_TO_TARGET_TYPE: Record<InterventionSkill, string> = {
    HOEREN: 'listening',
    LESEN: 'reading',
    SCHREIBEN: 'writing',
    SPRECHEN: 'speaking',
    GRAMMATIK: 'grammar',
    WORTSCHATZ: 'vocabulary',
}

const SKILL_LABELS: Record<InterventionSkill, string> = {
    HOEREN: 'Listening',
    LESEN: 'Reading',
    SCHREIBEN: 'Writing',
    SPRECHEN: 'Speaking',
    GRAMMATIK: 'Grammar',
    WORTSCHATZ: 'Vocabulary',
}

export async function getClassroomInterventionRecommendations(
    classroomId: string,
    teacherId: string,
    now = new Date(),
): Promise<ClassroomInterventionResult | null> {
    const classroom = await prisma.classroom.findFirst({
        where: { id: classroomId, teacherId, isArchived: false },
        include: {
            enrollments: {
                where: { removedAt: null },
                include: {
                    student: {
                        include: {
                            profile: true,
                            streak: true,
                            dailyActivities: {
                                orderBy: { date: 'desc' },
                                take: 14,
                                select: {
                                    date: true,
                                    totalMinutes: true,
                                    xpEarned: true,
                                    lessonsCompleted: true,
                                    exercisesCompleted: true,
                                },
                            },
                            assessments: {
                                orderBy: { assessedAt: 'desc' },
                                take: 12,
                                select: { skill: true, score: true },
                            },
                            studentSubmissions: {
                                where: {
                                    status: { in: ['pending', 'late'] },
                                    assignment: { classroomId },
                                },
                                select: { id: true },
                            },
                        },
                    },
                },
            },
        },
    })

    if (!classroom) {
        return null
    }

    const students = classroom.enrollments.map((enrollment) => {
        const student = enrollment.student
        return {
            id: student.id,
            displayName: student.profile?.displayName || student.email,
            email: student.email,
            currentLevel: student.profile?.currentLevel || classroom.cefrLevel,
            totalXp: student.profile?.totalXp || 0,
            totalStudyMinutes: student.profile?.totalStudyMinutes || 0,
            totalLessonsCompleted: student.profile?.totalLessonsCompleted || 0,
            currentStreak: student.streak?.currentStreak || 0,
            lastActive: student.streak?.lastActivityDate || null,
            dailyActivities: student.dailyActivities,
            pendingAssignments: student.studentSubmissions.length,
            skillScores: latestSkillScores(student.assessments),
        }
    })

    return {
        classroom: {
            id: classroom.id,
            name: classroom.name,
            cefrLevel: classroom.cefrLevel,
        },
        recommendations: buildTeacherInterventions(students, now),
    }
}

export function buildTeacherInterventions(
    students: InterventionStudentInput[],
    now = new Date(),
): TeacherInterventionRecommendation[] {
    if (students.length === 0) {
        return []
    }

    const analyzed = students.map((student) => ({
        student,
        risk: getStudentRiskProfile(student, now),
    }))

    const recommendations: TeacherInterventionRecommendation[] = []
    const highRisk = analyzed.filter(({ risk }) => risk.level === 'high')
    const inactive = analyzed.filter(({ risk }) => (risk.inactiveDays ?? 999) >= 3)
    const overloaded = analyzed.filter(({ risk }) => risk.pendingAssignments >= 3)

    if (highRisk.length > 0) {
        recommendations.push(makeRecommendation({
            id: 'momentum-recovery',
            title: 'Recovery sprint: 40 XP',
            description: 'Short XP assignment for students with high risk signals.',
            targetType: 'xp',
            targetStudentIds: highRisk.map(({ student }) => student.id),
            targetStudentNames: highRisk.map(({ student }) => student.displayName),
            reason: `${highRisk.length} high-risk student${highRisk.length === 1 ? '' : 's'}`,
            priority: 95,
            dueDays: 3,
            estimatedMinutes: 20,
            meta: { xpGoal: 40, interventionType: 'momentum_recovery' },
        }))
    }

    if (inactive.length > 0) {
        recommendations.push(makeRecommendation({
            id: 'reactivation-checkin',
            title: 'Reactivation check-in',
            description: 'Assign a small vocabulary review to restart activity.',
            targetType: 'vocabulary',
            targetStudentIds: inactive.map(({ student }) => student.id),
            targetStudentNames: inactive.map(({ student }) => student.displayName),
            reason: `${inactive.length} student${inactive.length === 1 ? '' : 's'} inactive for 3+ days`,
            priority: 88,
            dueDays: 2,
            estimatedMinutes: 10,
            meta: { interventionType: 'reactivation', reviewMode: 'short' },
        }))
    }

    for (const group of topWeakSkillGroups(analyzed).slice(0, 3)) {
        recommendations.push(makeRecommendation({
            id: `skill-${group.skill.toLowerCase()}`,
            title: `${SKILL_LABELS[group.skill]} reinforcement`,
            description: `Targeted practice for a shared weak skill trend.`,
            targetType: SKILL_TO_TARGET_TYPE[group.skill],
            targetStudentIds: group.students.map(({ student }) => student.id),
            targetStudentNames: group.students.map(({ student }) => student.displayName),
            reason: `${group.students.length} student${group.students.length === 1 ? '' : 's'} weak in ${SKILL_LABELS[group.skill]}`,
            priority: 78 + group.students.length,
            dueDays: 5,
            estimatedMinutes: 15,
            meta: {
                interventionType: 'weak_skill',
                skill: group.skill,
                skillLabel: SKILL_LABELS[group.skill],
            },
        }))
    }

    if (overloaded.length > 0) {
        recommendations.push(makeRecommendation({
            id: 'assignment-catchup',
            title: 'Assignment catch-up block',
            description: 'Focus students with multiple pending assignments on catch-up work.',
            targetType: 'lesson',
            targetStudentIds: overloaded.map(({ student }) => student.id),
            targetStudentNames: overloaded.map(({ student }) => student.displayName),
            reason: `${overloaded.length} student${overloaded.length === 1 ? '' : 's'} have 3+ pending assignments`,
            priority: 76,
            dueDays: 4,
            estimatedMinutes: 20,
            meta: { interventionType: 'assignment_catchup' },
        }))
    }

    return dedupeRecommendations(recommendations)
        .sort((a, b) => b.priority - a.priority)
        .slice(0, 6)
}

function makeRecommendation(input: {
    id: string
    title: string
    description: string
    targetType: string
    targetStudentIds: string[]
    targetStudentNames: string[]
    reason: string
    priority: number
    dueDays: number
    estimatedMinutes: number
    meta: Record<string, unknown>
}): TeacherInterventionRecommendation {
    return {
        id: input.id,
        title: input.title,
        description: input.description,
        targetType: input.targetType,
        targetId: null,
        targetStudentIds: unique(input.targetStudentIds),
        targetStudentNames: input.targetStudentNames,
        reason: input.reason,
        priority: input.priority,
        dueDays: input.dueDays,
        estimatedMinutes: input.estimatedMinutes,
        targetMeta: {
            source: 'teacher_intervention',
            recommendationId: input.id,
            estimatedMinutes: input.estimatedMinutes,
            ...input.meta,
        },
    }
}

function topWeakSkillGroups(
    analyzed: Array<{ student: InterventionStudentInput; risk: ReturnType<typeof getStudentRiskProfile> }>,
) {
    const groups = new Map<InterventionSkill, Array<{ student: InterventionStudentInput }>>()

    for (const item of analyzed) {
        const weakSkills = [
            ...item.risk.weakestSkills,
            ...Object.entries(item.student.skillScores ?? {})
                .filter(([, score]) => score < 0.65)
                .map(([skill]) => skill),
        ]

        for (const skill of weakSkills) {
            if (!isInterventionSkill(skill)) continue
            const entries = groups.get(skill) ?? []
            if (!entries.some((entry) => entry.student.id === item.student.id)) {
                entries.push({ student: item.student })
            }
            groups.set(skill, entries)
        }
    }

    return [...groups.entries()]
        .map(([skill, students]) => ({ skill, students }))
        .filter((group) => group.students.length > 0)
        .sort((a, b) => b.students.length - a.students.length)
}

function dedupeRecommendations(recommendations: TeacherInterventionRecommendation[]) {
    const seen = new Set<string>()
    const result: TeacherInterventionRecommendation[] = []

    for (const recommendation of recommendations) {
        const key = `${recommendation.id}:${recommendation.targetStudentIds.join(',')}`
        if (seen.has(key)) continue
        seen.add(key)
        result.push(recommendation)
    }

    return result
}

function latestSkillScores(assessments: Array<{ skill: unknown; score: number }>) {
    const scores: Record<string, number> = {}
    for (const assessment of assessments) {
        const skill = String(assessment.skill)
        if (scores[skill] === undefined) {
            scores[skill] = normalizeAssessmentScore(assessment.score)
        }
    }
    return scores
}

function normalizeAssessmentScore(score: number) {
    return score > 1 ? score / 100 : score
}

function isInterventionSkill(value: string): value is InterventionSkill {
    return value === 'HOEREN' ||
        value === 'LESEN' ||
        value === 'SCHREIBEN' ||
        value === 'SPRECHEN' ||
        value === 'GRAMMATIK' ||
        value === 'WORTSCHATZ'
}

function unique(values: string[]) {
    return [...new Set(values)]
}

export type { ActivityPoint }
