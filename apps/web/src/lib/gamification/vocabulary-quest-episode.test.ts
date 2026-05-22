import { describe, expect, it } from 'vitest'

import {
    buildVocabularyQuestCheckpoints,
    buildVocabularyQuestEpisode,
    buildVocabularyQuestEpisodeReceipt,
    getVocabularyQuestAccuracyBand,
    getVocabularyQuestCheckpoint,
} from './vocabulary-quest-episode'

describe('buildVocabularyQuestEpisode', () => {
    it('builds a vocabulary mixed episode with three checkpoints and reward preview', () => {
        const episode = buildVocabularyQuestEpisode({
            themeSlug: 'essen',
            themeName: 'Essen',
            cefrLevel: 'A1',
            questionCount: 10,
        })

        expect(episode).toMatchObject({
            episodeId: 'vocab-episode:A1:essen',
            themeSlug: 'essen',
            cefrLevel: 'A1',
            checkpoints: [
                expect.objectContaining({ id: 'discover', startIndex: 0, endIndex: 3 }),
                expect.objectContaining({ id: 'recall', startIndex: 4, endIndex: 6 }),
                expect.objectContaining({ id: 'lock_in', startIndex: 7, endIndex: 9 }),
            ],
        })
        expect(episode.rewardPreview.map((reward) => reward.type)).toEqual(['xp', 'streak', 'unlock'])
    })

    it('maps current question index to the active checkpoint', () => {
        const episode = buildVocabularyQuestEpisode({
            themeSlug: 'reisen',
            themeName: 'Reisen',
            cefrLevel: 'A2',
            questionCount: 9,
        })

        expect(getVocabularyQuestCheckpoint({ episode, currentIndex: 0 }).id).toBe('discover')
        expect(getVocabularyQuestCheckpoint({ episode, currentIndex: 4 }).id).toBe('recall')
        expect(getVocabularyQuestCheckpoint({ episode, currentIndex: 8 }).id).toBe('lock_in')
    })
})

describe('buildVocabularyQuestEpisodeReceipt', () => {
    it('classifies accuracy bands and recommends the next action', () => {
        expect(getVocabularyQuestAccuracyBand(95)).toBe('mastered')
        expect(getVocabularyQuestAccuracyBand(72)).toBe('clear')
        expect(getVocabularyQuestAccuracyBand(55)).toBe('practice_again')
        expect(getVocabularyQuestAccuracyBand(20)).toBe('rebuild')

        expect(buildVocabularyQuestEpisodeReceipt({
            episodeId: 'vocab-episode:A1:essen',
            themeSlug: 'essen',
            cefrLevel: 'A1',
            accuracy: 88,
            totalQuestions: 10,
            answeredQuestions: 10,
        })).toMatchObject({
            accuracyBand: 'clear',
            completedCheckpoints: 3,
            checkpointCount: 3,
            recommendedAction: 'next_episode',
        })

        expect(buildVocabularyQuestEpisodeReceipt({
            episodeId: 'vocab-episode:A1:essen',
            themeSlug: 'essen',
            cefrLevel: 'A1',
            accuracy: 40,
            totalQuestions: 10,
            answeredQuestions: 10,
        }).recommendedAction).toBe('retry_episode')
    })

    it('keeps checkpoint ranges valid for small episodes', () => {
        expect(buildVocabularyQuestCheckpoints(1)).toEqual([
            expect.objectContaining({ id: 'discover', startIndex: 0, endIndex: 0 }),
            expect.objectContaining({ id: 'recall', startIndex: 0, endIndex: 0 }),
            expect.objectContaining({ id: 'lock_in', startIndex: 0, endIndex: 0 }),
        ])
    })
})
