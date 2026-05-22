import {
    buildQuestEpisodeCheckpoints,
    buildQuestEpisodeReceipt,
    getQuestEpisodeCheckpoint,
    type QuestEpisode,
    type QuestEpisodeAccuracyBand,
    type QuestEpisodeCheckpoint,
    type QuestEpisodeReceipt,
} from './quest-episode'

export type SpeakingQuestCheckpointId = 'listen' | 'record' | 'refine'
export type SpeakingQuestScoreBand = QuestEpisodeAccuracyBand
export type PronunciationFeedbackState = 'evaluated' | 'needs_retry' | 'failed'
export type SpeakingQuestCheckpoint = QuestEpisodeCheckpoint<SpeakingQuestCheckpointId>

export interface SpeakingQuestEpisode extends QuestEpisode<SpeakingQuestCheckpointId> {
    skill: 'speaking'
    lessonId: string
    topicSlug: string
    exerciseType: 'nachsprechen'
    title: string
}

export interface SpeakingQuestEpisodeReceipt extends QuestEpisodeReceipt {
    skill: 'speaking'
    lessonId: string
    scoreBand: SpeakingQuestScoreBand
    pronunciationFeedbackState: PronunciationFeedbackState
}

const CHECKPOINT_DEFINITIONS: Array<Pick<SpeakingQuestCheckpoint, 'id' | 'title' | 'objective'>> = [
    {
        id: 'listen',
        title: 'Listen',
        objective: 'Thẩm âm tĩnh — rót từng tần số mẫu vào tai trước khi mở miệng.',
    },
    {
        id: 'record',
        title: 'Record',
        objective: 'Phóng thích giọng nói — can đảm cất lời, phần sửa lỗi cứ để Fuxie lo.',
    },
    {
        id: 'refine',
        title: 'Refine',
        objective: 'Gọt giũa thanh âm — mài đi những góc cạnh để giọng em hòa nhịp bản xứ.',
    },
]

export function buildSpeakingQuestEpisode(input: {
    lessonId: string
    topicSlug: string
    title: string
    cefrLevel: string
    sentenceCount: number
    exerciseType: 'nachsprechen'
    nextEpisodeHref?: string
}): SpeakingQuestEpisode {
    return {
        episodeId: speakingQuestEpisodeId(input.cefrLevel, input.lessonId),
        skill: 'speaking',
        sourceId: input.lessonId,
        lessonId: input.lessonId,
        topicSlug: input.topicSlug,
        title: input.title,
        exerciseType: input.exerciseType,
        cefrLevel: input.cefrLevel,
        objective: `Hòa thanh ${input.cefrLevel} — thu âm, gọt giũa và làm chủ từng nhịp thở trong phát âm.`,
        checkpoints: buildSpeakingQuestCheckpoints(input.sentenceCount),
        rewardPreview: [
            { type: 'xp', label: '+XP', detail: 'Chiến lợi phẩm rót ngay vào túi khi quest khép lại' },
            { type: 'streak', label: 'Study streak', detail: 'Ngọn lửa giữ nguyên — không một ngày nào bị bỏ phí!' },
            { type: 'unlock', label: 'Speaking mastery', detail: `Khoét sâu thêm một bậc vào lõi ${input.cefrLevel} Speaking` },
        ],
        nextEpisodeHref: input.nextEpisodeHref ?? '/speaking',
    }
}

export function buildSpeakingQuestCheckpoints(sentenceCount: number): SpeakingQuestCheckpoint[] {
    return buildQuestEpisodeCheckpoints(CHECKPOINT_DEFINITIONS, Math.max(1, sentenceCount))
}

export function getSpeakingQuestCheckpoint(input: {
    episode: SpeakingQuestEpisode
    currentIndex: number
}): SpeakingQuestCheckpoint {
    return getQuestEpisodeCheckpoint(input)
}

export function buildSpeakingQuestEpisodeReceipt(input: {
    episodeId: string
    lessonId: string
    cefrLevel: string
    scorePercent: number
    completedCheckpoints?: number
    checkpointCount?: number
    nextEpisodeHref?: string
    pronunciationFeedbackState?: PronunciationFeedbackState
}): SpeakingQuestEpisodeReceipt {
    const checkpointCount = input.checkpointCount ?? CHECKPOINT_DEFINITIONS.length
    const completedCheckpoints = Math.min(
        checkpointCount,
        Math.max(0, input.completedCheckpoints ?? checkpointCount),
    )
    const receipt = buildQuestEpisodeReceipt({
        episodeId: input.episodeId,
        skill: 'speaking',
        sourceId: input.lessonId,
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
        lessonId: input.lessonId,
        scoreBand: receipt.accuracyBand,
        pronunciationFeedbackState: input.pronunciationFeedbackState ?? 'evaluated',
    }
}

export function speakingQuestEpisodeId(cefrLevel: string, lessonId: string) {
    return `speaking-episode:${cefrLevel.toUpperCase()}:${lessonId}`
}

function masteryContributionCopy(band: SpeakingQuestScoreBand) {
    if (band === 'mastered') return 'Rung động! Thanh âm của em vừa cộng hưởng hoàn hảo và khắc sâu vào Speaking Mastery.'
    if (band === 'clear') return 'Trôi chảy! Khẩu hình đang dần mềm mại — Speaking Mastery đã ghi nhận nỗ lực này.'
    if (band === 'practice_again') return 'Âm vực còn vấp váp. Can đảm lắm mới dám nói ra, giờ mài lại một góc nhỏ thôi là âm sẽ sáng bóng.'
    return 'Đừng lo — rào cản lớn nhất của Speaking là sự sợ hãi, không phải ngôn ngữ. Lắng nghe mẫu chậm lại, và thử một lần nữa.'
}
