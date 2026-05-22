import {
    buildQuestEpisodeCheckpoints,
    buildQuestEpisodeReceipt,
    getQuestEpisodeCheckpoint,
    type QuestEpisode,
    type QuestEpisodeAccuracyBand,
    type QuestEpisodeCheckpoint,
    type QuestEpisodeReceipt,
} from './quest-episode'

export type GrammarQuestCheckpointId = 'notice' | 'apply' | 'explain'
export type GrammarQuestAccuracyBand = QuestEpisodeAccuracyBand
export type GrammarQuestCheckpoint = QuestEpisodeCheckpoint<GrammarQuestCheckpointId>

export interface GrammarQuestEpisode extends QuestEpisode<GrammarQuestCheckpointId> {
    skill: 'grammar'
    lessonId: string
    topicSlug: string
    title: string
}

export interface GrammarQuestEpisodeReceipt extends QuestEpisodeReceipt {
    skill: 'grammar'
    lessonId: string
}

const CHECKPOINT_DEFINITIONS: Array<Pick<GrammarQuestCheckpoint, 'id' | 'title' | 'objective'>> = [
    {
        id: 'notice',
        title: 'Notice',
        objective: 'Đọc vị cấu trúc — ánh nhìn đầu tiên quyết định em đi xa đến đâu.',
    },
    {
        id: 'apply',
        title: 'Apply',
        objective: 'Lắp ráp quy tắc — một nhịp cẩn thận đáng giá bằng mười nhịp vội.',
    },
    {
        id: 'explain',
        title: 'Explain',
        objective: 'Làm chủ ngôn từ — khi em tự giải thích được, quy tắc này chính thức thuộc về em.',
    },
]

export function buildGrammarQuestEpisode(input: {
    lessonId: string
    topicSlug: string
    title: string
    cefrLevel: string
    questionCount: number
    nextEpisodeHref?: string
}): GrammarQuestEpisode {
    return {
        episodeId: grammarQuestEpisodeId(input.cefrLevel, input.lessonId),
        skill: 'grammar',
        sourceId: input.lessonId,
        lessonId: input.lessonId,
        topicSlug: input.topicSlug,
        title: input.title,
        cefrLevel: input.cefrLevel,
        objective: `Chinh phục ${input.title} — 3 ải thử thách để rèn quy tắc thành phản xạ.`,
        checkpoints: buildGrammarQuestCheckpoints(input.questionCount),
        rewardPreview: [
            { type: 'xp', label: '+XP', detail: 'Chiến lợi phẩm rót ngay vào túi khi quest khép lại' },
            { type: 'streak', label: 'Study streak', detail: 'Ngọn lửa giữ nguyên — không một ngày nào bị bỏ phí!' },
            { type: 'unlock', label: 'Grammar mastery', detail: `Khoét sâu thêm một bậc vào lõi ${input.cefrLevel} Grammar` },
        ],
        nextEpisodeHref: input.nextEpisodeHref ?? '/grammar',
    }
}

export function buildGrammarQuestCheckpoints(questionCount: number): GrammarQuestCheckpoint[] {
    return buildQuestEpisodeCheckpoints(CHECKPOINT_DEFINITIONS, questionCount)
}

export function getGrammarQuestCheckpoint(input: {
    episode: GrammarQuestEpisode
    currentIndex: number
}): GrammarQuestCheckpoint {
    return getQuestEpisodeCheckpoint(input)
}

export function buildGrammarQuestEpisodeReceipt(input: {
    episodeId: string
    lessonId: string
    cefrLevel: string
    accuracy: number
    totalQuestions: number
    answeredQuestions: number
    checkpointCount?: number
    nextEpisodeHref?: string
}): GrammarQuestEpisodeReceipt {
    const receipt = buildQuestEpisodeReceipt({
        ...input,
        skill: 'grammar',
        sourceId: input.lessonId,
        checkpointCount: input.checkpointCount ?? CHECKPOINT_DEFINITIONS.length,
        masteryContribution: masteryContributionCopy,
    })

    return {
        ...receipt,
        lessonId: input.lessonId,
    }
}

export function grammarQuestEpisodeId(cefrLevel: string, lessonId: string) {
    return `grammar-episode:${cefrLevel.toUpperCase()}:${lessonId}`
}

function masteryContributionCopy(band: GrammarQuestAccuracyBand) {
    if (band === 'mastered') return 'Hoàn mỹ! Quy tắc này vừa được đục khắc vĩnh viễn vào bộ gen Grammar Mastery của em.'
    if (band === 'clear') return 'Gọn gàng và sắc nét! Grammar Mastery đã ghi nhận — giữ chặt phong độ này nhé.'
    if (band === 'practice_again') return 'Hạt mầm đã gieo nhưng rễ chưa bám sâu. Quét lại một vòng nữa để quy tắc thực sự khóa chặt.'
    return 'Đừng vội — ngữ pháp là nghệ thuật của sự lặp lại. Chậm lại ở ải Notice, em sẽ thấy điểm mù được thắp sáng.'
}
