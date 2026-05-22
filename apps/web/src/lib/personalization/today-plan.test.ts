import { describe, expect, it } from 'vitest'
import { buildTodayPlan, type TodayPlanInput } from './today-plan'

const baseInput: TodayPlanInput = {
    profile: {
        currentLevel: 'B1',
        targetLevel: 'B2',
        targetExam: null,
        targetExamDate: null,
        studyGoalMinutes: 30,
    },
    dueSrsCount: 0,
    todayMinutes: 0,
    recentActivities: [],
    weakSkills: [],
    skillScores: {},
    pendingAssignments: [],
    candidates: {
        WORTSCHATZ: {
            id: 'vocab-b1',
            skill: 'WORTSCHATZ',
            title: 'B1 Wortschatz',
            href: '/vocabulary',
            estimatedMinutes: 10,
            label: 'Wortschatz',
        },
        GRAMMATIK: {
            id: 'grammar-b1',
            skill: 'GRAMMATIK',
            title: 'Nebensaetze',
            href: '/grammar/b1-nebensaetze/b1-nebensaetze-01-E',
            estimatedMinutes: 8,
            label: 'Grammatik',
        },
    },
    now: new Date('2026-04-24T08:00:00.000Z'),
}

describe('buildTodayPlan', () => {
    it('prioritizes due SRS before skill recommendations', () => {
        const plan = buildTodayPlan({
            ...baseInput,
            dueSrsCount: 24,
            weakSkills: ['GRAMMATIK'],
        })

        expect(plan.actions[0]).toMatchObject({
            type: 'srs',
            href: '/review',
            badge: '24',
        })
        expect(plan.focus).toBe('Đánh Thức Ký Ức')
    })

    it('prioritizes urgent assignments over normal lessons', () => {
        const plan = buildTodayPlan({
            ...baseInput,
            pendingAssignments: [{
                id: 'assignment-1',
                title: 'Lesen Aufgabe',
                targetType: 'reading',
                targetId: 'B1-T1-001',
                dueDate: new Date('2026-04-24T10:00:00.000Z'),
                classroomName: 'B1 Abend',
            }],
        })

        expect(plan.actions[0]).toMatchObject({
            type: 'assignment',
            href: '/reading/B1-T1-001',
            reason: 'Nhiệm vụ ưu tiên: Hoàn thành hôm nay!',
        })
        expect(plan.signals.pendingAssignments).toBe(1)
    })

    it('uses assessed weak skills when learning path has none', () => {
        const plan = buildTodayPlan({
            ...baseInput,
            skillScores: {
                SCHREIBEN: 52,
                GRAMMATIK: 84,
            },
            candidates: {
                ...baseInput.candidates,
                SCHREIBEN: {
                    id: 'writing-b1',
                    skill: 'SCHREIBEN',
                    title: 'Forumsbeitrag',
                    href: '/writing/W-B1-T1-001',
                    estimatedMinutes: 20,
                    label: 'Schreiben',
                },
            },
        })

        expect(plan.weakSkills[0]).toBe('SCHREIBEN')
        expect(plan.actions.some((action) => action.href === '/writing/W-B1-T1-001')).toBe(true)
        expect(plan.weaknessProfile.weakSkills[0]).toBe('SCHREIBEN')
    })

    it('attaches learning outcomes and remediation loops to weak-skill lessons', () => {
        const plan = buildTodayPlan({
            ...baseInput,
            weakSkills: ['GRAMMATIK'],
        })

        const grammarAction = plan.actions.find((action) => action.skill === 'GRAMMATIK')
        expect(grammarAction?.learningOutcomeId).toBeTruthy()
        expect(grammarAction?.canDoVi).toBeTruthy()
        expect(plan.remediation.length).toBeGreaterThan(0)
        expect(plan.remediation[0]!.outcomes.length).toBeGreaterThan(0)
    })

    it('uses the learner daily study goal for dashboard progress', () => {
        const plan = buildTodayPlan({
            ...baseInput,
            profile: {
                ...baseInput.profile,
                studyGoalMinutes: 10,
            },
            todayMinutes: 4,
        })

        expect(plan.goalMinutes).toBe(10)
        expect(plan.remainingMinutes).toBe(6)
    })
})
