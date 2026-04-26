import { describe, expect, it } from 'vitest'
import { buildTeacherInterventions, type InterventionStudentInput } from './teacher-interventions'

const now = new Date('2026-04-24T08:00:00.000Z')

function student(overrides: Partial<InterventionStudentInput>): InterventionStudentInput {
    return {
        id: 'student-1',
        displayName: 'Learner',
        email: 'learner@example.com',
        currentLevel: 'B1',
        totalXp: 120,
        totalStudyMinutes: 40,
        totalLessonsCompleted: 2,
        currentStreak: 0,
        lastActive: new Date('2026-04-23T08:00:00.000Z'),
        dailyActivities: [],
        pendingAssignments: 0,
        skillScores: {},
        ...overrides,
    }
}

describe('buildTeacherInterventions', () => {
    it('creates a recovery sprint for high-risk students', () => {
        const recommendations = buildTeacherInterventions([
            student({
                id: 'student-high',
                displayName: 'High Risk',
                lastActive: new Date('2026-04-12T08:00:00.000Z'),
                pendingAssignments: 3,
                skillScores: { LESEN: 0.4 },
            }),
        ], now)

        expect(recommendations[0]).toMatchObject({
            id: 'momentum-recovery',
            targetType: 'xp',
            targetStudentIds: ['student-high'],
        })
    })

    it('groups students by shared weak skill', () => {
        const recommendations = buildTeacherInterventions([
            student({ id: 's1', displayName: 'S1', skillScores: { GRAMMATIK: 0.5 } }),
            student({ id: 's2', displayName: 'S2', skillScores: { GRAMMATIK: 0.42 } }),
        ], now)

        const grammar = recommendations.find((recommendation) => recommendation.id === 'skill-grammatik')
        expect(grammar).toMatchObject({
            targetType: 'grammar',
            reason: '2 students weak in Grammar',
        })
        expect(grammar?.targetStudentIds).toEqual(['s1', 's2'])
    })

    it('creates reactivation work for inactive students', () => {
        const recommendations = buildTeacherInterventions([
            student({
                id: 'inactive',
                displayName: 'Inactive',
                lastActive: new Date('2026-04-20T08:00:00.000Z'),
            }),
        ], now)

        expect(recommendations.some((recommendation) => recommendation.id === 'reactivation-checkin')).toBe(true)
    })
})
