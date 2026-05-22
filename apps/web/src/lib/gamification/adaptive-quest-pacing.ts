export type LearnerPacingState =
    | 'healthy'
    | 'needs_learning_nudge'
    | 'reward_only_risk'
    | 'streak_recovery'
    | 'low_repeat_study'

export interface AdaptiveQuestPacingSignals {
    meaningfulActions7d: number
    meaningfulDays7d: number
    rewardRequests7d: number
    interventionShown7d: number
    interventionClicked7d: number
}

export interface AdaptiveQuestPacingContext {
    currentStreak: number
    totalXp: number
    srsDueCount: number
}

export interface AdaptiveQuestPacingPlan {
    goalMinutes: number
    remainingMinutes: number
    dueSrsCount: number
    signals: {
        recentMinutes7d: number
    }
}

export interface AdaptiveQuestCandidate {
    id: string
    type: string
    skill: string
    href: string
    priority: number
    estimatedMinutes: number
    status: string
}

export interface AdaptiveQuestPacingResult {
    learnerPacingState: LearnerPacingState
    nextQuestReason: string
    interventionCode: string | null
    interventionRecommendedAction: string
    primaryQuestId: string | null
}

const DEFAULT_SIGNALS: AdaptiveQuestPacingSignals = {
    meaningfulActions7d: 0,
    meaningfulDays7d: 0,
    rewardRequests7d: 0,
    interventionShown7d: 0,
    interventionClicked7d: 0,
}

export function buildAdaptiveQuestPacing(input: {
    quests: AdaptiveQuestCandidate[]
    plan: AdaptiveQuestPacingPlan
    context: AdaptiveQuestPacingContext
    signals?: Partial<AdaptiveQuestPacingSignals> | null
}): AdaptiveQuestPacingResult {
    if (!input.signals) {
        return {
            learnerPacingState: 'healthy',
            nextQuestReason: reasonForState('healthy', input.context),
            interventionCode: null,
            interventionRecommendedAction: actionForState('healthy'),
            primaryQuestId: input.quests[0]?.id ?? null,
        }
    }

    const signals = { ...DEFAULT_SIGNALS, ...input.signals }
    const state = classifyPacingState({
        plan: input.plan,
        context: input.context,
        signals,
    })
    const primaryQuestId = choosePrimaryQuest(input.quests, state)?.id ?? input.quests[0]?.id ?? null

    return {
        learnerPacingState: state,
        nextQuestReason: reasonForState(state, input.context),
        interventionCode: state === 'healthy' ? null : `adaptive_${state}`,
        interventionRecommendedAction: actionForState(state),
        primaryQuestId,
    }
}

export function sortQuestsByAdaptivePacing<T extends AdaptiveQuestCandidate>(
    quests: T[],
    pacing: Pick<AdaptiveQuestPacingResult, 'primaryQuestId'>,
): T[] {
    if (!pacing.primaryQuestId) return quests

    return [...quests].sort((a, b) => {
        if (a.id === pacing.primaryQuestId) return -1
        if (b.id === pacing.primaryQuestId) return 1
        return b.priority - a.priority
    })
}

function classifyPacingState(input: {
    plan: AdaptiveQuestPacingPlan
    context: AdaptiveQuestPacingContext
    signals: AdaptiveQuestPacingSignals
}): LearnerPacingState {
    if (input.signals.rewardRequests7d > 0 && input.signals.meaningfulActions7d === 0) {
        return 'reward_only_risk'
    }

    if (input.context.currentStreak === 0 && input.context.totalXp > 0 && input.signals.meaningfulDays7d <= 1) {
        return 'streak_recovery'
    }

    if (
        input.signals.meaningfulDays7d < 2
        && input.plan.signals.recentMinutes7d < Math.max(input.plan.goalMinutes, 1) * 2
    ) {
        return 'low_repeat_study'
    }

    if (input.context.srsDueCount > 0 || input.plan.dueSrsCount > 0 || input.plan.remainingMinutes > 0) {
        return 'needs_learning_nudge'
    }

    return 'healthy'
}

function choosePrimaryQuest(quests: AdaptiveQuestCandidate[], state: LearnerPacingState) {
    const available = quests.filter((quest) => quest.status !== 'completed' && quest.status !== 'locked')
    const pool = available.length > 0 ? available : quests

    if (state === 'reward_only_risk') {
        return pool.find((quest) => quest.type === 'srs')
            ?? pool.find((quest) => quest.type === 'lesson' || quest.type === 'fresh-start')
            ?? pool[0]
    }

    if (state === 'streak_recovery' || state === 'low_repeat_study') {
        return [...pool].sort((a, b) => {
            const aStudy = a.type === 'lesson' || a.type === 'fresh-start'
            const bStudy = b.type === 'lesson' || b.type === 'fresh-start'
            if (aStudy !== bStudy) return aStudy ? -1 : 1
            return a.estimatedMinutes - b.estimatedMinutes || b.priority - a.priority
        })[0]
    }

    if (state === 'needs_learning_nudge') {
        return pool.find((quest) => quest.type === 'srs') ?? pool[0]
    }

    return pool[0]
}

function reasonForState(state: LearnerPacingState, context: AdaptiveQuestPacingContext) {
    if (state === 'reward_only_risk') return 'Chiến lợi phẩm vô nghĩa nếu thanh kiếm không được mài — vượt qua một quest trước, Fucoin mới có trọng lượng.'
    if (state === 'streak_recovery') return 'Ngọn lửa có thể chập chờn nhưng không được tắt. Nhặt lại nhịp bằng một quest ngắn, Streak sẽ rực cháy trở lại.'
    if (state === 'low_repeat_study') return 'Mưa dầm thấm lâu hơn thác đổ. Một quest ngắn gọn hôm nay sẽ rèn giũa nhịp độ vững như bàn thạch.'
    if (state === 'needs_learning_nudge' && context.srsDueCount > 0) return `${context.srsDueCount} bóng ma ký ức đang kêu gọi. Hồi sinh chúng trên SRS trước khi em khai phá vùng đất mới.`
    if (state === 'needs_learning_nudge') return 'Hành trình hôm nay vẫn còn dang dở — vung kiếm thêm một nhịp nữa là chạm đến vinh quang!'
    return 'Đế chế ngôn ngữ của em đang xây rất vững — Fuxie đã mở sẵn lộ trình tối ưu tiếp theo.'
}

function actionForState(state: LearnerPacingState) {
    if (state === 'reward_only_risk') return 'Show quest CTA before shop CTA and track whether the learner completes a meaningful action.'
    if (state === 'streak_recovery') return 'Prioritize a short restart quest and avoid shame-based streak copy.'
    if (state === 'low_repeat_study') return 'Prioritize short repeat-study quests until the learner has at least two study days in the cohort window.'
    if (state === 'needs_learning_nudge') return 'Keep the next learning action prominent and keep rewards as secondary feedback.'
    return 'No intervention required beyond the normal next-best quest.'
}
