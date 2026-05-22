import type { RewardPreviewItem } from '@/components/gamification/quest-visuals'
import {
    buildQuestEpisodeCheckpoints,
    buildQuestEpisodeReceipt,
    getQuestEpisodeAccuracyBand,
    getQuestEpisodeCheckpoint,
    type QuestEpisode,
    type QuestEpisodeAccuracyBand,
    type QuestEpisodeCheckpoint,
    type QuestEpisodeReceipt,
} from './quest-episode'

export type VocabularyQuestCheckpointId = 'discover' | 'recall' | 'lock_in'
export type VocabularyQuestAccuracyBand = QuestEpisodeAccuracyBand

export type VocabularyQuestCheckpoint = QuestEpisodeCheckpoint<VocabularyQuestCheckpointId>

export interface VocabularyQuestEpisode extends QuestEpisode<VocabularyQuestCheckpointId> {
    skill: 'vocabulary'
    sourceId: string
    themeSlug: string
    themeName: string
}

export interface VocabularyQuestEpisodeReceipt extends QuestEpisodeReceipt {
    skill: 'vocabulary'
    sourceId: string
    themeSlug: string
}

const CHECKPOINT_DEFINITIONS: Array<Pick<VocabularyQuestCheckpoint, 'id' | 'title' | 'objective'>> = [
    {
        id: 'discover',
        title: 'Discover',
        objective: 'Chiết xuất từ vựng — bắt giữ những khái niệm thô ráp ngay từ ánh nhìn đầu tiên.',
    },
    {
        id: 'recall',
        title: 'Recall',
        objective: 'Trích xuất ký ức — ép não bộ tự tìm đường về thay vì dựa dẫm gợi ý.',
    },
    {
        id: 'lock_in',
        title: 'Lock in',
        objective: 'Đóng băng vào não bộ — sau ải này, hệ thống SRS sẽ đan lưới bảo vệ từ vựng của em.',
    },
]

export function buildVocabularyQuestEpisode(input: {
    themeSlug: string
    themeName: string
    cefrLevel: string
    questionCount: number
    nextEpisodeHref?: string
}): VocabularyQuestEpisode {
    const episodeId = vocabularyQuestEpisodeId(input.cefrLevel, input.themeSlug)
    const checkpoints = buildVocabularyQuestCheckpoints(input.questionCount)

    return {
        episodeId,
        skill: 'vocabulary',
        sourceId: input.themeSlug,
        themeSlug: input.themeSlug,
        themeName: input.themeName,
        cefrLevel: input.cefrLevel,
        objective: `Hấp thụ ${input.themeName} — Discover, Recall và Lock in để biến từ vựng thành vũ khí.`,
        checkpoints,
        rewardPreview: [
            { type: 'xp', label: '+XP', detail: 'Chiến lợi phẩm rót ngay vào túi khi quest khép lại' },
            { type: 'streak', label: 'Study streak', detail: 'Ngọn lửa giữ nguyên — không một ngày nào bị bỏ phí!' },
            { type: 'unlock', label: 'Mastery path', detail: `Khoét sâu thêm một bậc vào lõi ${input.cefrLevel} Vocabulary` },
        ],
        nextEpisodeHref: input.nextEpisodeHref ?? '/vocabulary/practice',
    }
}

export function buildVocabularyQuestCheckpoints(questionCount: number): VocabularyQuestCheckpoint[] {
    return buildQuestEpisodeCheckpoints(CHECKPOINT_DEFINITIONS, questionCount)
}

export function getVocabularyQuestCheckpoint(input: {
    episode: VocabularyQuestEpisode
    currentIndex: number
}): VocabularyQuestCheckpoint {
    return getQuestEpisodeCheckpoint(input)
}

export function buildVocabularyQuestEpisodeReceipt(input: {
    episodeId: string
    themeSlug: string
    cefrLevel: string
    accuracy: number
    totalQuestions: number
    answeredQuestions: number
    checkpointCount?: number
    nextEpisodeHref?: string
}): VocabularyQuestEpisodeReceipt {
    const receipt = buildQuestEpisodeReceipt({
        ...input,
        skill: 'vocabulary',
        sourceId: input.themeSlug,
        checkpointCount: input.checkpointCount ?? CHECKPOINT_DEFINITIONS.length,
        masteryContribution: masteryContributionCopy,
    })

    return {
        ...receipt,
        themeSlug: input.themeSlug,
    }
}

export function getVocabularyQuestAccuracyBand(accuracy: number): VocabularyQuestAccuracyBand {
    return getQuestEpisodeAccuracyBand(accuracy)
}

export function vocabularyQuestEpisodeId(cefrLevel: string, themeSlug: string) {
    return `vocab-episode:${cefrLevel.toUpperCase()}:${themeSlug}`
}

function masteryContributionCopy(band: VocabularyQuestAccuracyBand) {
    if (band === 'mastered') return 'Khắc cốt ghi tâm! Tập từ vựng này vừa được đổ khuôn vĩnh viễn vào Vocabulary Mastery.'
    if (band === 'clear') return 'Trí nhớ sắc bén! Vocabulary Mastery đã ghi nhận — kho vũ khí từ vựng của em đang ngày càng chật cứng.'
    if (band === 'practice_again') return 'Ký ức vẫn còn những mảng xám. Quét lại một vòng Recall để đóng băng từ vựng vào bộ nhớ dài hạn.'
    return 'Bình tĩnh — nạp từ mới là cuộc chiến của sự lặp lại. Lướt qua ải Discover một lần nữa, não bộ sẽ tự động hàn gắn liên kết.'
}
