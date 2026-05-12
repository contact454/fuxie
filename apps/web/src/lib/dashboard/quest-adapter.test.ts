import { describe, expect, it } from 'vitest'
import { buildDashboardMissionHub, type DashboardQuestContext } from './quest-adapter'
import type { TodayPlan, TodayPlanAction } from '@/lib/personalization/today-plan'

const baseContext: DashboardQuestContext = {
    currentStreak: 0,
    srsDueCount: 0,
    srsReviewedToday: 0,
    totalXp: 0,
    totalAchievements: 0,
}

const lessonAction: TodayPlanAction = {
    id: 'skill-WORTSCHATZ-a1-person',
    type: 'lesson',
    title: 'Person',
    reason: 'Từ vựng: củng cố trọng tâm hiện tại',
    href: '/vocabulary?level=A1&theme=a1-person',
    skill: 'WORTSCHATZ',
    estimatedMinutes: 10,
    priority: 70,
    dueDate: null,
    badge: 'Từ vựng',
}

function action(overrides: Partial<TodayPlanAction>): TodayPlanAction {
    return {
        ...lessonAction,
        ...overrides,
    }
}

function plan(overrides: Partial<TodayPlan> = {}): TodayPlan {
    return {
        generatedAt: '2026-04-29T00:00:00.000Z',
        currentLevel: 'A1',
        targetLevel: 'B1',
        goalMinutes: 15,
        currentMinutes: 0,
        remainingMinutes: 15,
        focus: 'Start learning',
        weakSkills: ['WORTSCHATZ'],
        dueSrsCount: 0,
        actions: [
            lessonAction,
            action({
                id: 'skill-HOEREN-a1-listening',
                title: 'Sich vorstellen und begrüßen',
                reason: 'Nghe: củng cố trọng tâm hiện tại',
                href: '/listening/L-A1-GOETHE-001-T1',
                skill: 'HOEREN',
                priority: 60,
                badge: 'Nghe',
            }),
        ],
        signals: {
            recentMinutes7d: 0,
            pendingAssignments: 0,
            examDaysLeft: null,
        },
        ...overrides,
    }
}

describe('buildDashboardMissionHub', () => {
    it('adds a motivating fresh-start quest for zero-data learners', () => {
        const mission = buildDashboardMissionHub(plan(), baseContext)

        expect(mission.isFreshStart).toBe(true)
        expect(mission.primaryQuest).toMatchObject({
            id: 'fresh-start-vocabulary',
            type: 'fresh-start',
            status: 'active',
            href: '/vocabulary',
        })
        expect(mission.primaryQuest.rewardPreview.map((reward) => reward.type)).toEqual(['xp', 'streak', 'unlock'])
        expect(mission.quests).toHaveLength(3)
        expect(mission.primaryCta).toMatchObject({
            label: 'Bắt đầu từ vựng',
            href: '/vocabulary',
            source: 'fresh-start-vocabulary',
        })
        expect(mission.secondaryQuests.some((quest) => quest.id === mission.primaryQuest.id)).toBe(false)
    })

    it('keeps SRS review as the primary quest when cards are due', () => {
        const mission = buildDashboardMissionHub(
            plan({
                dueSrsCount: 12,
                actions: [
                    action({
                        id: 'srs-due',
                        type: 'srs',
                        title: 'Ôn SRS',
                        reason: '12 thẻ cần ôn',
                        href: '/review',
                        skill: 'SRS',
                        estimatedMinutes: 5,
                        priority: 112,
                        badge: '12',
                    }),
                    lessonAction,
                ],
            }),
            {
                ...baseContext,
                srsDueCount: 12,
            },
        )

        expect(mission.isFreshStart).toBe(false)
        expect(mission.primaryQuest).toMatchObject({
            id: 'srs-due',
            type: 'srs',
            href: '/review',
            status: 'active',
            progress: 0,
        })
        expect(mission.primaryCta).toMatchObject({
            label: 'Ôn SRS ngay',
            href: '/review',
            source: 'srs-due',
        })
    })

    it('does not hide a pending assignment behind the fresh-start quest', () => {
        const mission = buildDashboardMissionHub(
            plan({
                actions: [
                    action({
                        id: 'assignment-reading-1',
                        type: 'assignment',
                        title: 'Lesen Aufgabe',
                        reason: 'Bài được giao đến hạn hôm nay',
                        href: '/reading/A1-T1-001',
                        skill: 'LESEN',
                        estimatedMinutes: 15,
                        priority: 120,
                        badge: 'Lớp A1',
                    }),
                    lessonAction,
                ],
                signals: {
                    recentMinutes7d: 0,
                    pendingAssignments: 1,
                    examDaysLeft: null,
                },
            }),
            baseContext,
        )

        expect(mission.isFreshStart).toBe(false)
        expect(mission.primaryQuest).toMatchObject({
            id: 'assignment-reading-1',
            type: 'assignment',
            href: '/reading/A1-T1-001',
        })
    })

    it('uses the weak-skill lesson as primary when there is no higher-priority review or assignment', () => {
        const mission = buildDashboardMissionHub(
            plan({
                currentMinutes: 6,
                remainingMinutes: 9,
            }),
            {
                ...baseContext,
                totalXp: 90,
            },
        )

        expect(mission.isFreshStart).toBe(false)
        expect(mission.primaryQuest).toMatchObject({
            id: 'skill-WORTSCHATZ-a1-person',
            type: 'lesson',
            status: 'active',
            progress: 40,
        })
        expect(mission.primaryCta).toMatchObject({
            label: 'Học từ vựng',
            href: '/vocabulary?level=A1&theme=a1-person',
            source: 'skill-WORTSCHATZ-a1-person',
        })
    })

    it('keeps exam readiness visible for target exam quests', () => {
        const mission = buildDashboardMissionHub(
            plan({
                actions: [
                    action({
                        id: 'target-exam',
                        type: 'exam',
                        title: 'Luyện GOETHE B1',
                        reason: '21 ngày đến kỳ thi',
                        href: '/exam',
                        skill: 'EXAM',
                        estimatedMinutes: 20,
                        priority: 90,
                        badge: 'GOETHE',
                    }),
                    lessonAction,
                ],
                signals: {
                    recentMinutes7d: 40,
                    pendingAssignments: 0,
                    examDaysLeft: 21,
                },
            }),
            {
                ...baseContext,
                currentStreak: 3,
                totalXp: 480,
                totalAchievements: 2,
            },
        )

        expect(mission.primaryQuest).toMatchObject({
            id: 'target-exam',
            type: 'exam',
            href: '/exam',
        })
        expect(mission.primaryCta).toMatchObject({
            label: 'Luyện thi ngay',
            href: '/exam',
            source: 'target-exam',
        })
        expect(mission.primaryQuest.rewardPreview.some((reward) => reward.type === 'exam')).toBe(true)
    })

    it('marks the primary quest completed once the daily minute goal is reached', () => {
        const mission = buildDashboardMissionHub(
            plan({
                currentMinutes: 15,
                remainingMinutes: 0,
            }),
            {
                ...baseContext,
                currentStreak: 5,
                totalXp: 700,
                totalAchievements: 4,
            },
        )

        expect(mission.goalProgress).toBe(100)
        expect(mission.primaryQuest).toMatchObject({
            status: 'completed',
            progress: 100,
        })
        expect(mission.primaryCta).toMatchObject({
            label: 'Học tiếp: Luyện nghe',
            href: '/listening/L-A1-GOETHE-001-T1',
            source: 'skill-HOEREN-a1-listening',
        })
        expect(mission.coachMessage).toContain('Mục tiêu ngày')
    })

    it('falls back to vocabulary when the daily goal is complete and no secondary quest exists', () => {
        const mission = buildDashboardMissionHub(
            plan({
                currentMinutes: 15,
                remainingMinutes: 0,
                actions: [lessonAction],
            }),
            {
                ...baseContext,
                currentStreak: 5,
                totalXp: 700,
                totalAchievements: 4,
            },
        )

        expect(mission.secondaryQuests).toHaveLength(0)
        expect(mission.primaryCta).toMatchObject({
            label: 'Mở thêm từ vựng',
            href: '/vocabulary',
            source: 'completed-fallback-vocabulary',
        })
    })
})
