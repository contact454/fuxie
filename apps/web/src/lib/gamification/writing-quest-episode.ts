import {
    buildQuestEpisodeCheckpoints,
    buildQuestEpisodeReceipt,
    getQuestEpisodeCheckpoint,
    type QuestEpisode,
    type QuestEpisodeAccuracyBand,
    type QuestEpisodeCheckpoint,
    type QuestEpisodeReceipt,
} from './quest-episode'

export type WritingQuestCheckpointId = 'plan' | 'draft' | 'revise'
export type WritingQuestAccuracyBand = QuestEpisodeAccuracyBand
export type WritingFeedbackSummaryState = 'generated' | 'needs_review' | 'failed'
export type WritingQuestCheckpoint = QuestEpisodeCheckpoint<WritingQuestCheckpointId>

export interface WritingQuestEpisode extends QuestEpisode<WritingQuestCheckpointId> {
    skill: 'writing'
    exerciseId: string
    textType: string
    topic: string
}

export interface WritingQuestEpisodeReceipt extends QuestEpisodeReceipt {
    skill: 'writing'
    exerciseId: string
    scoreBand: WritingQuestAccuracyBand
    feedbackSummaryState: WritingFeedbackSummaryState
}

const CHECKPOINT_DEFINITIONS: Array<Pick<WritingQuestCheckpoint, 'id' | 'title' | 'objective'>> = [
    {
        id: 'plan',
        title: 'Plan',
        objective: 'Lập dàn ý chi tiết cho bài viết.',
    },
    {
        id: 'draft',
        title: 'Draft',
        objective: 'Viết bản nháp đầu tiên, tập trung vào ý tưởng chính.',
    },
    {
        id: 'revise',
        title: 'Revise',
        objective: 'Rà soát lỗi chính tả và diễn đạt trước khi nộp bài.',
    },
]

export function buildWritingQuestEpisode(input: {
    exerciseId: string
    topic: string
    textType: string
    cefrLevel: string
    minWords: number
    nextEpisodeHref?: string
}): WritingQuestEpisode {
    return {
        episodeId: writingQuestEpisodeId(input.cefrLevel, input.exerciseId),
        skill: 'writing',
        sourceId: input.exerciseId,
        exerciseId: input.exerciseId,
        textType: input.textType,
        topic: input.topic,
        cefrLevel: input.cefrLevel,
        objective: `Viết bài ${input.textType} trình độ ${input.cefrLevel} theo chủ đề yêu cầu.`,
        checkpoints: buildWritingQuestCheckpoints(input.minWords),
        rewardPreview: [
            { type: 'xp', label: '+XP', detail: 'Chiến lợi phẩm rót ngay vào túi khi AI định phẩm xong' },
            { type: 'streak', label: 'Study streak', detail: 'Ngọn lửa giữ nguyên — không một ngày nào bị bỏ phí!' },
            { type: 'unlock', label: 'Writing mastery', detail: `Khoét sâu thêm một bậc vào lõi ${input.cefrLevel} Writing` },
        ],
        nextEpisodeHref: input.nextEpisodeHref ?? '/writing',
    }
}

export function buildWritingQuestCheckpoints(minWords: number): WritingQuestCheckpoint[] {
    return buildQuestEpisodeCheckpoints(CHECKPOINT_DEFINITIONS, Math.max(3, minWords))
}

export function getWritingQuestCheckpoint(input: {
    episode: WritingQuestEpisode
    currentIndex: number
}): WritingQuestCheckpoint {
    return getQuestEpisodeCheckpoint(input)
}

export function buildWritingQuestEpisodeReceipt(input: {
    episodeId: string
    exerciseId: string
    cefrLevel: string
    scorePercent: number
    completedCheckpoints?: number
    checkpointCount?: number
    nextEpisodeHref?: string
    feedbackSummaryState?: WritingFeedbackSummaryState
}): WritingQuestEpisodeReceipt {
    const checkpointCount = input.checkpointCount ?? CHECKPOINT_DEFINITIONS.length
    const completedCheckpoints = Math.min(
        checkpointCount,
        Math.max(0, input.completedCheckpoints ?? checkpointCount),
    )
    const receipt = buildQuestEpisodeReceipt({
        episodeId: input.episodeId,
        skill: 'writing',
        sourceId: input.exerciseId,
        cefrLevel: input.cefrLevel,
        accuracy: input.scorePercent,
        totalQuestions: checkpointCount,
        answeredQuestions: completedCheckpoints,
        checkpointCount,
        nextEpisodeHref: input.nextEpisodeHref,
        masteryContribution: masteryContributionCopy,
    })

    return {
        ...receipt,
        exerciseId: input.exerciseId,
        scoreBand: receipt.accuracyBand,
        feedbackSummaryState: input.feedbackSummaryState ?? 'generated',
    }
}

export function writingQuestEpisodeId(cefrLevel: string, exerciseId: string) {
    return `writing-episode:${cefrLevel.toUpperCase()}:${exerciseId}`
}

function masteryContributionCopy(band: WritingQuestAccuracyBand) {
    if (band === 'mastered') return 'Bài viết rất tốt! Trình độ viết của bạn đã được ghi nhận.'
    if (band === 'clear') return 'Bài viết mạch lạc, rõ ràng. Kỹ năng viết của bạn đang tiến bộ.'
    if (band === 'practice_again') return 'Bài viết cần cải thiện thêm. Hãy xem nhận xét để chỉnh sửa nhé.'
    return 'Đừng lo lắng, hãy bắt đầu bằng việc viết những câu đơn giản trước.'
}
