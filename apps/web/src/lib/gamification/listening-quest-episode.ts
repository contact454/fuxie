import {
    buildQuestEpisodeCheckpoints,
    buildQuestEpisodeReceipt,
    getQuestEpisodeCheckpoint,
    type QuestEpisode,
    type QuestEpisodeAccuracyBand,
    type QuestEpisodeCheckpoint,
    type QuestEpisodeReceipt,
} from './quest-episode'

export type ListeningQuestCheckpointId = 'preview' | 'gist' | 'details'
export type ListeningQuestAccuracyBand = QuestEpisodeAccuracyBand
export type ListeningQuestCheckpoint = QuestEpisodeCheckpoint<ListeningQuestCheckpointId>

export interface ListeningQuestEpisode extends QuestEpisode<ListeningQuestCheckpointId> {
    skill: 'listening'
    lessonId: string
    topic: string
}

export interface ListeningQuestEpisodeReceipt extends QuestEpisodeReceipt {
    skill: 'listening'
    lessonId: string
}

const CHECKPOINT_DEFINITIONS: Array<Pick<ListeningQuestCheckpoint, 'id' | 'title' | 'objective'>> = [
    {
        id: 'preview',
        title: 'Preview',
        objective: 'Khởi động radar — kẻ đi săn giỏi luôn biết con mồi trông thế nào trước khi vào rừng.',
    },
    {
        id: 'gist',
        title: 'Gist',
        objective: 'Tóm gọn linh hồn đoạn hội thoại — đừng để tiểu tiết đánh lừa đôi tai em.',
    },
    {
        id: 'details',
        title: 'Details',
        objective: 'Săn lùng mảnh ghép cuối — rà soát âm thanh để trích xuất bằng chứng thép.',
    },
]

export function buildListeningQuestEpisode(input: {
    lessonId: string
    topic: string
    cefrLevel: string
    questionCount: number
    nextEpisodeHref?: string
}): ListeningQuestEpisode {
    const episodeId = listeningQuestEpisodeId(input.cefrLevel, input.lessonId)

    return {
        episodeId,
        skill: 'listening',
        sourceId: input.lessonId,
        lessonId: input.lessonId,
        topic: input.topic,
        cefrLevel: input.cefrLevel,
        objective: `Giải mã ${input.topic} — thả lỏng đôi tai và bắt lấy tần số của người bản xứ.`,
        checkpoints: buildListeningQuestCheckpoints(input.questionCount),
        rewardPreview: [
            { type: 'xp', label: '+XP', detail: 'Chiến lợi phẩm rót ngay vào túi khi quest khép lại' },
            { type: 'streak', label: 'Study streak', detail: 'Ngọn lửa giữ nguyên — không một ngày nào bị bỏ phí!' },
            { type: 'unlock', label: 'Listening mastery', detail: `Xuyên phá thêm một tầng vào lõi ${input.cefrLevel} Listening` },
        ],
        nextEpisodeHref: input.nextEpisodeHref ?? '/listening',
    }
}

export function buildListeningQuestCheckpoints(questionCount: number): ListeningQuestCheckpoint[] {
    return buildQuestEpisodeCheckpoints(CHECKPOINT_DEFINITIONS, questionCount)
}

export function getListeningQuestCheckpoint(input: {
    episode: ListeningQuestEpisode
    currentIndex: number
}): ListeningQuestCheckpoint {
    return getQuestEpisodeCheckpoint(input)
}

export function buildListeningQuestEpisodeReceipt(input: {
    episodeId: string
    lessonId: string
    cefrLevel: string
    accuracy: number
    totalQuestions: number
    answeredQuestions: number
    checkpointCount?: number
    nextEpisodeHref?: string
}): ListeningQuestEpisodeReceipt {
    const receipt = buildQuestEpisodeReceipt({
        ...input,
        skill: 'listening',
        sourceId: input.lessonId,
        checkpointCount: input.checkpointCount ?? CHECKPOINT_DEFINITIONS.length,
        masteryContribution: masteryContributionCopy,
    })

    return {
        ...receipt,
        lessonId: input.lessonId,
    }
}

export function listeningQuestEpisodeId(cefrLevel: string, lessonId: string) {
    return `listening-episode:${cefrLevel.toUpperCase()}:${lessonId}`
}

function masteryContributionCopy(band: ListeningQuestAccuracyBand) {
    if (band === 'mastered') return 'Tuyệt âm! Đôi tai của em vừa bắt được tần số chuẩn nhất và ghim nó thẳng vào Listening Mastery.'
    if (band === 'clear') return 'Sắc bén! Listening Mastery đã ghi nhận — tần số đang dần khớp với người bản xứ rồi.'
    if (band === 'practice_again') return 'Âm thanh vẫn còn hơi nhiễu. Nghe lại một vòng để màng nhĩ em thật sự ghi nhớ nhịp điệu này.'
    return 'Bình tĩnh — tai em đang bị ngợp bởi tốc độ thôi. Nhắm mắt lại, chỉ tập trung vào Gist, phần còn lại sẽ tự hiện hình.'
}
