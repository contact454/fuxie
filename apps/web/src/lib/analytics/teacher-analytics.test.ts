import { describe, expect, it } from 'vitest'
import {
    getInactiveDays,
    getRecentMinutes,
    getStudentRiskProfile,
    summarizeClassroomAnalytics,
} from './teacher-analytics'

describe('teacher analytics helpers', () => {
    const now = new Date('2026-04-23T10:00:00.000Z')

    it('calculates recent minutes in the requested window', () => {
        expect(
            getRecentMinutes(
                [
                    { date: new Date('2026-04-23T01:00:00.000Z'), totalMinutes: 15 },
                    { date: new Date('2026-04-21T01:00:00.000Z'), totalMinutes: 10 },
                    { date: new Date('2026-04-10T01:00:00.000Z'), totalMinutes: 99 },
                ],
                7,
                now
            )
        ).toBe(25)
    })

    it('flags a high-risk student with inactivity, low minutes, and pending work', () => {
        const risk = getStudentRiskProfile(
            {
                id: 'student-1',
                displayName: 'Mai',
                email: 'mai@example.com',
                currentStreak: 0,
                lastActive: new Date('2026-04-14T10:00:00.000Z'),
                dailyActivities: [
                    { date: new Date('2026-04-20T01:00:00.000Z'), totalMinutes: 10 },
                ],
                pendingAssignments: 3,
                skillScores: {
                    LESEN: 0.41,
                    HOEREN: 0.62,
                },
            },
            now
        )

        expect(risk.level).toBe('high')
        expect(risk.reasons).toContain('Inactive for at least 7 days')
        expect(risk.reasons).toContain('Low study time in the last 7 days')
        expect(risk.reasons).toContain('Multiple pending assignments')
        expect(risk.weakestSkills).toEqual(['LESEN', 'HOEREN'])
    })

    it('summarizes class-level risk and completion metrics', () => {
        const summary = summarizeClassroomAnalytics(
            [
                {
                    id: 'student-1',
                    displayName: 'Mai',
                    email: 'mai@example.com',
                    totalXp: 100,
                    totalStudyMinutes: 90,
                    currentStreak: 0,
                    lastActive: new Date('2026-04-14T10:00:00.000Z'),
                    dailyActivities: [{ date: new Date('2026-04-20T01:00:00.000Z'), totalMinutes: 10 }],
                    pendingAssignments: 2,
                },
                {
                    id: 'student-2',
                    displayName: 'An',
                    email: 'an@example.com',
                    totalXp: 300,
                    totalStudyMinutes: 180,
                    currentStreak: 4,
                    lastActive: new Date('2026-04-23T02:00:00.000Z'),
                    dailyActivities: [{ date: new Date('2026-04-23T01:00:00.000Z'), totalMinutes: 30 }],
                    pendingAssignments: 0,
                },
            ],
            [
                {
                    id: 'assignment-1',
                    title: 'Review',
                    dueDate: new Date('2026-04-22T01:00:00.000Z'),
                    submissionCount: 1,
                    totalStudents: 2,
                },
            ],
            now
        )

        expect(summary.studentCount).toBe(2)
        expect(summary.activeLast7Days).toBe(1)
        expect(summary.atRiskCount).toBe(1)
        expect(summary.highRiskCount).toBe(1)
        expect(summary.averageXp).toBe(200)
        expect(summary.averageStudyMinutes).toBe(135)
        expect(summary.averageCompletionRate).toBe(50)
        expect(summary.overdueAssignments).toBe(1)
        expect(summary.topRiskStudents[0]).toMatchObject({
            id: 'student-1',
            level: 'high',
        })
    })

    it('computes inactive days from the last activity date', () => {
        expect(getInactiveDays(new Date('2026-04-20T08:00:00.000Z'), now)).toBe(3)
        expect(getInactiveDays(null, now)).toBeNull()
    })
})
