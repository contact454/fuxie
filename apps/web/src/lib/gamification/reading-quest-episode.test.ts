import { describe, expect, it } from 'vitest'

import {
    buildReadingQuestCheckpoints,
    buildReadingQuestEpisode,
    buildReadingQuestEpisodeReceipt,
    getReadingQuestCheckpoint,
    readingQuestEpisodeId,
} from './reading-quest-episode'

describe('reading quest episode', () => {
    it('builds a reading episode with scan, understand, and prove checkpoints', () => {
        const episode = buildReadingQuestEpisode({
            exerciseId: 'A1-T1-001',
            topic: 'Kurze Nachrichten',
            cefrLevel: 'A1',
            teil: 1,
            questionCount: 6,
        })

        expect(episode).toMatchObject({
            episodeId: 'reading-episode:A1:A1-T1-001',
            skill: 'reading',
            sourceId: 'A1-T1-001',
            nextEpisodeHref: '/reading',
        })
        expect(episode.checkpoints.map((checkpoint) => checkpoint.id)).toEqual(['scan', 'understand', 'prove'])
        expect(episode.rewardPreview).toEqual([
            expect.objectContaining({ type: 'xp' }),
            expect.objectContaining({ type: 'streak' }),
            expect.objectContaining({ type: 'unlock' }),
        ])
    })

    it('maps current question index to the active reading checkpoint', () => {
        const episode = buildReadingQuestEpisode({
            exerciseId: 'A2-T2-004',
            topic: 'Anzeigen vergleichen',
            cefrLevel: 'A2',
            teil: 2,
            questionCount: 9,
        })

        expect(getReadingQuestCheckpoint({ episode, currentIndex: 0 }).id).toBe('scan')
        expect(getReadingQuestCheckpoint({ episode, currentIndex: 4 }).id).toBe('understand')
        expect(getReadingQuestCheckpoint({ episode, currentIndex: 8 }).id).toBe('prove')
    })

    it('builds receipt with retry action for weak accuracy', () => {
        const receipt = buildReadingQuestEpisodeReceipt({
            episodeId: readingQuestEpisodeId('B1', 'B1-T1-003'),
            exerciseId: 'B1-T1-003',
            cefrLevel: 'B1',
            accuracy: 45,
            totalQuestions: 5,
            answeredQuestions: 5,
        })

        expect(receipt).toMatchObject({
            skill: 'reading',
            exerciseId: 'B1-T1-003',
            accuracyBand: 'rebuild',
            completedCheckpoints: 3,
            recommendedAction: 'retry_episode',
            nextEpisodeHref: '/reading',
        })
    })

    it('keeps checkpoint ranges stable for short reading exercises', () => {
        expect(buildReadingQuestCheckpoints(1)).toEqual([
            expect.objectContaining({ id: 'scan', startIndex: 0, endIndex: 0 }),
            expect.objectContaining({ id: 'understand', startIndex: 0, endIndex: 0 }),
            expect.objectContaining({ id: 'prove', startIndex: 0, endIndex: 0 }),
        ])
    })
})
