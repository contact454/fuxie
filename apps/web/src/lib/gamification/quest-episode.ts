import type { RewardPreviewItem } from '@/components/gamification/quest-visuals'

export type QuestEpisodeSkill = 'vocabulary' | 'listening' | 'reading' | 'grammar' | 'writing' | 'speaking'
export type QuestEpisodeAccuracyBand = 'mastered' | 'clear' | 'practice_again' | 'rebuild'
export type QuestEpisodeRecommendedAction = 'next_episode' | 'retry_episode'

export interface QuestEpisodeCheckpoint<Id extends string = string> {
    id: Id
    title: string
    objective: string
    startIndex: number
    endIndex: number
    progress: number
}

export interface QuestEpisode<CheckpointId extends string = string> {
    episodeId: string
    skill: QuestEpisodeSkill
    sourceId: string
    cefrLevel: string
    objective: string
    checkpoints: Array<QuestEpisodeCheckpoint<CheckpointId>>
    rewardPreview: RewardPreviewItem[]
    nextEpisodeHref: string
}

export interface QuestEpisodeReceipt {
    episodeId: string
    skill: QuestEpisodeSkill
    sourceId: string
    cefrLevel: string
    accuracyBand: QuestEpisodeAccuracyBand
    completedCheckpoints: number
    checkpointCount: number
    masteryContribution: string
    nextEpisodeHref: string
    recommendedAction: QuestEpisodeRecommendedAction
}

export function buildQuestEpisodeCheckpoints<Id extends string>(
    definitions: ReadonlyArray<Pick<QuestEpisodeCheckpoint<Id>, 'id' | 'title' | 'objective'>>,
    questionCount: number,
): Array<QuestEpisodeCheckpoint<Id>> {
    const safeCount = Math.max(1, questionCount)
    const firstEnd = Math.ceil(safeCount / 3)
    const secondEnd = Math.ceil((safeCount * 2) / 3)
    const ranges = [
        { startIndex: 0, endIndex: firstEnd - 1 },
        { startIndex: firstEnd, endIndex: secondEnd - 1 },
        { startIndex: secondEnd, endIndex: safeCount - 1 },
    ]

    return definitions.map((definition, index) => ({
        ...definition,
        startIndex: Math.min(ranges[index]?.startIndex ?? 0, safeCount - 1),
        endIndex: Math.max(
            Math.min(ranges[index]?.endIndex ?? safeCount - 1, safeCount - 1),
            Math.min(ranges[index]?.startIndex ?? 0, safeCount - 1),
        ),
        progress: 0,
    }))
}

export function getQuestEpisodeCheckpoint<CheckpointId extends string>(input: {
    episode: Pick<QuestEpisode<CheckpointId>, 'checkpoints'>
    currentIndex: number
}): QuestEpisodeCheckpoint<CheckpointId> {
    const checkpoint = input.episode.checkpoints.find((item) => (
        input.currentIndex >= item.startIndex && input.currentIndex <= item.endIndex
    ))

    return checkpoint ?? input.episode.checkpoints[input.episode.checkpoints.length - 1]!
}

export function buildQuestEpisodeReceipt<Skill extends QuestEpisodeSkill>(input: {
    episodeId: string
    skill: Skill
    sourceId: string
    cefrLevel: string
    accuracy: number
    totalQuestions: number
    answeredQuestions: number
    checkpointCount: number
    nextEpisodeHref?: string
    masteryContribution: (band: QuestEpisodeAccuracyBand) => string
}): QuestEpisodeReceipt & { skill: Skill } {
    const checkpointCount = Math.max(1, input.checkpointCount)
    const completedCheckpoints = Math.min(
        checkpointCount,
        Math.floor((Math.max(0, input.answeredQuestions) / Math.max(1, input.totalQuestions)) * checkpointCount),
    )
    const accuracyBand = getQuestEpisodeAccuracyBand(input.accuracy)
    const shouldRetry = accuracyBand === 'practice_again' || accuracyBand === 'rebuild'

    return {
        episodeId: input.episodeId,
        skill: input.skill,
        sourceId: input.sourceId,
        cefrLevel: input.cefrLevel,
        accuracyBand,
        completedCheckpoints,
        checkpointCount,
        masteryContribution: input.masteryContribution(accuracyBand),
        nextEpisodeHref: input.nextEpisodeHref ?? fallbackHref(input.skill),
        recommendedAction: shouldRetry ? 'retry_episode' : 'next_episode',
    }
}

export function getQuestEpisodeAccuracyBand(accuracy: number): QuestEpisodeAccuracyBand {
    if (accuracy >= 90) return 'mastered'
    if (accuracy >= 70) return 'clear'
    if (accuracy >= 50) return 'practice_again'
    return 'rebuild'
}

function fallbackHref(skill: QuestEpisodeSkill) {
    if (skill === 'speaking') return '/speaking'
    if (skill === 'writing') return '/writing'
    if (skill === 'reading') return '/reading'
    if (skill === 'grammar') return '/grammar'
    return skill === 'listening' ? '/listening' : '/vocabulary/practice'
}
