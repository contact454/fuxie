import {
    buildQuestEpisodeCheckpoints,
    buildQuestEpisodeReceipt,
    getQuestEpisodeCheckpoint,
    type QuestEpisode,
    type QuestEpisodeAccuracyBand,
    type QuestEpisodeCheckpoint,
    type QuestEpisodeReceipt,
} from './quest-episode'

export type ReadingQuestCheckpointId = 'scan' | 'understand' | 'prove'
export type ReadingQuestAccuracyBand = QuestEpisodeAccuracyBand
export type ReadingQuestCheckpoint = QuestEpisodeCheckpoint<ReadingQuestCheckpointId>

export interface ReadingQuestEpisode extends QuestEpisode<ReadingQuestCheckpointId> {
    skill: 'reading'
    exerciseId: string
    topic: string
    teil: number
}

export interface ReadingQuestEpisodeReceipt extends QuestEpisodeReceipt {
    skill: 'reading'
    exerciseId: string
}

const CHECKPOINT_DEFINITIONS: Array<Pick<ReadingQuestCheckpoint, 'id' | 'title' | 'objective'>> = [
    {
        id: 'scan',
        title: 'Scan',
        objective: 'Quét tia X — lướt qua nhiễu loạn để khóa thẳng mục tiêu từ khóa.',
    },
    {
        id: 'understand',
        title: 'Understand',
        objective: 'Lắp ráp ngữ cảnh — nối ghép những manh mối rời rạc thành bức tranh tổng thể.',
    },
    {
        id: 'prove',
        title: 'Prove',
        objective: 'Chốt hạ bằng chứng thép — chỉ đáp án nào có dấu vết trên văn bản mới tồn tại.',
    },
]

export function buildReadingQuestEpisode(input: {
    exerciseId: string
    topic: string
    cefrLevel: string
    teil: number
    questionCount: number
    nextEpisodeHref?: string
}): ReadingQuestEpisode {
    return {
        episodeId: readingQuestEpisodeId(input.cefrLevel, input.exerciseId),
        skill: 'reading',
        sourceId: input.exerciseId,
        exerciseId: input.exerciseId,
        topic: input.topic,
        teil: input.teil,
        cefrLevel: input.cefrLevel,
        objective: `Giải mã ${input.topic} — săn lùng thông tin như một thám tử thực thụ.`,
        checkpoints: buildReadingQuestCheckpoints(input.questionCount),
        rewardPreview: [
            { type: 'xp', label: '+XP', detail: 'Chiến lợi phẩm rót ngay vào túi khi quest khép lại' },
            { type: 'streak', label: 'Study streak', detail: 'Ngọn lửa giữ nguyên — không một ngày nào bị bỏ phí!' },
            { type: 'unlock', label: 'Reading mastery', detail: `Khoét sâu thêm một bậc vào lõi ${input.cefrLevel} Reading` },
        ],
        nextEpisodeHref: input.nextEpisodeHref ?? '/reading',
    }
}

export function buildReadingQuestCheckpoints(questionCount: number): ReadingQuestCheckpoint[] {
    return buildQuestEpisodeCheckpoints(CHECKPOINT_DEFINITIONS, questionCount)
}

export function getReadingQuestCheckpoint(input: {
    episode: ReadingQuestEpisode
    currentIndex: number
}): ReadingQuestCheckpoint {
    return getQuestEpisodeCheckpoint(input)
}

export function buildReadingQuestEpisodeReceipt(input: {
    episodeId: string
    exerciseId: string
    cefrLevel: string
    accuracy: number
    totalQuestions: number
    answeredQuestions: number
    checkpointCount?: number
    nextEpisodeHref?: string
}): ReadingQuestEpisodeReceipt {
    const receipt = buildQuestEpisodeReceipt({
        ...input,
        skill: 'reading',
        sourceId: input.exerciseId,
        checkpointCount: input.checkpointCount ?? CHECKPOINT_DEFINITIONS.length,
        masteryContribution: masteryContributionCopy,
    })

    return {
        ...receipt,
        exerciseId: input.exerciseId,
    }
}

export function readingQuestEpisodeId(cefrLevel: string, exerciseId: string) {
    return `reading-episode:${cefrLevel.toUpperCase()}:${exerciseId}`
}

function masteryContributionCopy(band: ReadingQuestAccuracyBand) {
    if (band === 'mastered') return 'Sắc lẹm! Ánh mắt của em vừa quét trúng cốt lõi và đục khắc nó vào Reading Mastery.'
    if (band === 'clear') return 'Chính xác! Reading Mastery đã ghi nhận — nhãn lực của em đang sắc bén lên từng ngày.'
    if (band === 'practice_again') return 'Bằng chứng chưa đủ độ đanh thép. Quét lại một vòng để không bỏ sót manh mối nào.'
    return 'Bình tĩnh — mê cung ngôn từ ban đầu luôn làm mờ mắt. Thử thu hẹp phạm vi Scan lại, lối ra sẽ xuất hiện.'
}
