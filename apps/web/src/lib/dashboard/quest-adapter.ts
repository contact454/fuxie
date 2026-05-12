import type { RewardPreviewItem } from '@/components/gamification/quest-visuals'
import type { TodayPlan, TodayPlanAction } from '@/lib/personalization/today-plan'

export type QuestStatus = 'active' | 'available' | 'completed' | 'locked'
export type QuestReward = RewardPreviewItem

export interface DashboardQuest {
    id: string
    type: TodayPlanAction['type'] | 'fresh-start'
    title: string
    reason: string
    href: string
    status: QuestStatus
    progress: number
    rewardPreview: QuestReward[]
    priority: number
    estimatedMinutes: number
    badge: string | null
}

export interface DashboardQuestContext {
    currentStreak: number
    srsDueCount: number
    srsReviewedToday: number
    totalXp: number
    totalAchievements: number
}

export interface DashboardMissionHub {
    quests: DashboardQuest[]
    primaryQuest: DashboardQuest
    secondaryQuests: DashboardQuest[]
    goalProgress: number
    isFreshStart: boolean
    coachTitle: string
    coachMessage: string
}

export function buildDashboardMissionHub(plan: TodayPlan, context: DashboardQuestContext): DashboardMissionHub {
    const goalProgress = getGoalProgress(plan)
    const actions = plan.actions.slice(0, 3)
    const isFreshStart = isFreshStartCandidate(plan, context)

    const actionQuests = actions.map((action, index) => toDashboardQuest(action, plan, context, index))
    const quests = isFreshStart
        ? [buildFreshStartQuest(plan), ...actionQuests].slice(0, 3)
        : actionQuests.length > 0
            ? actionQuests
            : [buildFreshStartQuest(plan)]

    const primaryQuest = quests[0]!
    const secondaryQuests = quests.slice(1)

    return {
        quests,
        primaryQuest,
        secondaryQuests,
        goalProgress,
        isFreshStart,
        coachTitle: isFreshStart ? 'Ngày 1: mở khóa bước đầu' : 'Tập trung vào một quest',
        coachMessage: getCoachMessage(plan, primaryQuest, isFreshStart),
    }
}

function toDashboardQuest(
    action: TodayPlanAction,
    plan: TodayPlan,
    context: DashboardQuestContext,
    index: number,
): DashboardQuest {
    const status: QuestStatus = plan.remainingMinutes <= 0 && index === 0 ? 'completed' : index === 0 ? 'active' : 'available'
    const progress = getActionProgress(action, plan, context, status)

    return {
        id: action.id,
        type: action.type,
        title: action.title,
        reason: action.reason,
        href: action.href,
        status,
        progress,
        rewardPreview: buildRewards(action, plan, context, status),
        priority: action.priority,
        estimatedMinutes: action.estimatedMinutes,
        badge: action.badge,
    }
}

function buildFreshStartQuest(plan: TodayPlan): DashboardQuest {
    return {
        id: 'fresh-start-vocabulary',
        type: 'fresh-start',
        title: 'Mở khóa quest đầu tiên',
        reason: 'Bắt đầu bằng một chủ đề từ vựng ngắn để Fuxie có đủ tín hiệu tạo lộ trình hằng ngày cho bạn',
        href: '/vocabulary',
        status: 'active',
        progress: getGoalProgress(plan),
        rewardPreview: [
            { type: 'xp', label: '+15 XP', detail: 'Thưởng khởi động' },
            { type: 'streak', label: 'Ngày 1', detail: 'Tạo nhịp học đầu tiên' },
            { type: 'unlock', label: 'Mở gợi ý tiếp', detail: plan.currentLevel },
        ],
        priority: 999,
        estimatedMinutes: Math.max(5, plan.remainingMinutes || 5),
        badge: 'Fresh start',
    }
}

function isFreshStartCandidate(plan: TodayPlan, context: DashboardQuestContext) {
    return context.totalXp === 0
        && context.currentStreak === 0
        && context.totalAchievements === 0
        && context.srsDueCount === 0
        && context.srsReviewedToday === 0
        && plan.currentMinutes === 0
        && plan.dueSrsCount === 0
        && plan.signals.pendingAssignments === 0
}

function buildRewards(
    action: TodayPlanAction,
    plan: TodayPlan,
    context: DashboardQuestContext,
    status: QuestStatus,
): QuestReward[] {
    const estimatedXp = Math.max(15, action.estimatedMinutes * 3)

    return [
        {
            type: 'xp',
            label: status === 'completed' ? `+${Math.max(context.totalXp, estimatedXp)} XP total` : `+${estimatedXp} XP`,
            detail: status === 'completed' ? 'Đã ghi nhận tiến độ' : 'Thưởng dự kiến',
        },
        {
            type: plan.remainingMinutes > 0 ? 'streak' : 'badge',
            label: plan.remainingMinutes > 0 ? 'Streak safe' : 'Goal clear',
            detail: plan.remainingMinutes > 0 ? `${Math.max(plan.remainingMinutes, action.estimatedMinutes)} min mission` : 'Có thể học thêm',
        },
        {
            type: action.type === 'exam' ? 'exam' : 'unlock',
            label: action.type === 'exam' ? 'Exam ready' : 'Mở bước tiếp',
            detail: `${plan.currentLevel}${plan.targetLevel ? ` -> ${plan.targetLevel}` : ''}`,
        },
    ]
}

function getActionProgress(
    action: TodayPlanAction,
    plan: TodayPlan,
    context: DashboardQuestContext,
    status: QuestStatus,
) {
    if (status === 'completed') return 100
    if (action.type === 'srs') {
        const total = context.srsDueCount + context.srsReviewedToday
        return total > 0 ? Math.round((context.srsReviewedToday / total) * 100) : 100
    }
    return getGoalProgress(plan)
}

function getGoalProgress(plan: TodayPlan) {
    return plan.goalMinutes > 0
        ? Math.min(100, Math.round((plan.currentMinutes / plan.goalMinutes) * 100))
        : 0
}

function getCoachMessage(plan: TodayPlan, quest: DashboardQuest, isFreshStart: boolean) {
    if (isFreshStart) {
        return 'Làm một quest ngắn trước. Sau bài đầu tiên, Fuxie sẽ có đủ dữ liệu để gợi ý nhiệm vụ tiếp theo chính xác hơn.'
    }

    if (quest.status === 'completed') {
        return 'Mục tiêu ngày đã xong. Nếu còn năng lượng, chọn quest phụ để tăng XP và đẩy nhanh tiến độ CEFR.'
    }

    if (plan.remainingMinutes > 0) {
        return `Còn ${plan.remainingMinutes} phút để chạm mục tiêu ngày. Làm quest này trước để giữ nhịp học.`
    }

    return 'Fuxie đã chọn quest tiếp theo dựa trên SRS, điểm yếu và mục tiêu thi của bạn.'
}
