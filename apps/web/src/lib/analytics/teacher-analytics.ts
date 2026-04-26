export interface ActivityPoint {
    date: Date
    totalMinutes: number
    xpEarned?: number
    lessonsCompleted?: number
    exercisesCompleted?: number
}

export interface StudentAnalyticsInput {
    id: string
    displayName: string
    email: string
    currentLevel?: string | null
    totalXp?: number
    totalStudyMinutes?: number
    totalLessonsCompleted?: number
    currentStreak?: number
    lastActive?: Date | null
    dailyActivities?: ActivityPoint[]
    pendingAssignments?: number
    skillScores?: Record<string, number>
}

export interface AssignmentAnalyticsInput {
    id: string
    title: string
    dueDate?: Date | null
    submissionCount: number
    totalStudents: number
}

export interface StudentRiskProfile {
    level: 'low' | 'medium' | 'high'
    score: number
    reasons: string[]
    inactiveDays: number | null
    recentMinutes7d: number
    pendingAssignments: number
    weakestSkills: string[]
    strongestSkills: string[]
}

export interface ClassroomAnalyticsSummary {
    studentCount: number
    activeLast7Days: number
    atRiskCount: number
    highRiskCount: number
    averageXp: number
    averageStudyMinutes: number
    averageCompletionRate: number
    overdueAssignments: number
    topRiskStudents: Array<{
        id: string
        displayName: string
        level: StudentRiskProfile['level']
        reasons: string[]
        recentMinutes7d: number
        inactiveDays: number | null
    }>
}

export function getRecentMinutes(
    dailyActivities: ActivityPoint[] = [],
    days: number,
    now: Date = new Date()
) {
    const cutoff = startOfDay(now)
    cutoff.setDate(cutoff.getDate() - (days - 1))

    return dailyActivities.reduce((sum, entry) => {
        return entry.date >= cutoff ? sum + entry.totalMinutes : sum
    }, 0)
}

export function getInactiveDays(lastActive?: Date | null, now: Date = new Date()) {
    if (!lastActive) return null

    const start = startOfDay(now)
    const last = startOfDay(lastActive)
    return Math.max(0, Math.floor((start.getTime() - last.getTime()) / 86400000))
}

export function getStudentRiskProfile(
    student: StudentAnalyticsInput,
    now: Date = new Date()
): StudentRiskProfile {
    const reasons: string[] = []
    const recentMinutes7d = getRecentMinutes(student.dailyActivities, 7, now)
    const inactiveDays = getInactiveDays(student.lastActive, now)
    const pendingAssignments = student.pendingAssignments ?? 0
    const skillEntries = Object.entries(student.skillScores ?? {})
    const sortedSkills = [...skillEntries].sort((a, b) => a[1] - b[1])
    const weakestSkills = sortedSkills
        .filter(([, score]) => score < 0.65)
        .slice(0, 2)
        .map(([skill]) => skill)
    const strongestSkills = [...skillEntries]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 2)
        .map(([skill]) => skill)

    let score = 0

    if (inactiveDays === null || inactiveDays >= 7) {
        score += 3
        reasons.push('Inactive for at least 7 days')
    } else if (inactiveDays >= 3) {
        score += 2
        reasons.push('No recent activity for 3+ days')
    } else if (inactiveDays >= 1) {
        score += 1
    }

    if (recentMinutes7d < 20) {
        score += 2
        reasons.push('Low study time in the last 7 days')
    } else if (recentMinutes7d < 45) {
        score += 1
    }

    if ((student.currentStreak ?? 0) === 0 && (inactiveDays ?? 0) >= 2) {
        score += 1
        reasons.push('Streak is broken')
    }

    if (pendingAssignments >= 3) {
        score += 2
        reasons.push('Multiple pending assignments')
    } else if (pendingAssignments > 0) {
        score += 1
        reasons.push('Has pending assignments')
    }

    const weakestScore = sortedSkills[0]?.[1]
    if (typeof weakestScore === 'number') {
        if (weakestScore < 0.45) {
            score += 2
            reasons.push('One skill is critically weak')
        } else if (weakestScore < 0.6) {
            score += 1
            reasons.push('Weak skill trend detected')
        }
    }

    return {
        level: score >= 5 ? 'high' : score >= 3 ? 'medium' : 'low',
        score,
        reasons,
        inactiveDays,
        recentMinutes7d,
        pendingAssignments,
        weakestSkills,
        strongestSkills,
    }
}

export function summarizeClassroomAnalytics(
    students: StudentAnalyticsInput[],
    assignments: AssignmentAnalyticsInput[],
    now: Date = new Date()
): ClassroomAnalyticsSummary {
    const risks = students.map((student) => ({
        student,
        risk: getStudentRiskProfile(student, now),
    }))

    const averageXp =
        students.length > 0
            ? Math.round(
                students.reduce((sum, student) => sum + (student.totalXp ?? 0), 0) / students.length
            )
            : 0

    const averageStudyMinutes =
        students.length > 0
            ? Math.round(
                students.reduce((sum, student) => sum + (student.totalStudyMinutes ?? 0), 0) / students.length
            )
            : 0

    const completionRates = assignments
        .filter((assignment) => assignment.totalStudents > 0)
        .map((assignment) => assignment.submissionCount / assignment.totalStudents)

    const averageCompletionRate =
        completionRates.length > 0
            ? Math.round(
                (completionRates.reduce((sum, rate) => sum + rate, 0) / completionRates.length) * 100
            )
            : 0

    const overdueAssignments = assignments.filter((assignment) => {
        return Boolean(
            assignment.dueDate &&
                assignment.dueDate < now &&
                assignment.submissionCount < assignment.totalStudents
        )
    }).length

    return {
        studentCount: students.length,
        activeLast7Days: risks.filter(({ risk }) => (risk.inactiveDays ?? 999) <= 6).length,
        atRiskCount: risks.filter(({ risk }) => risk.level !== 'low').length,
        highRiskCount: risks.filter(({ risk }) => risk.level === 'high').length,
        averageXp,
        averageStudyMinutes,
        averageCompletionRate,
        overdueAssignments,
        topRiskStudents: risks
            .filter(({ risk }) => risk.level !== 'low')
            .sort((a, b) => b.risk.score - a.risk.score)
            .slice(0, 5)
            .map(({ student, risk }) => ({
                id: student.id,
                displayName: student.displayName,
                level: risk.level,
                reasons: risk.reasons,
                recentMinutes7d: risk.recentMinutes7d,
                inactiveDays: risk.inactiveDays,
            })),
    }
}

function startOfDay(date: Date) {
    const value = new Date(date)
    value.setHours(0, 0, 0, 0)
    return value
}
