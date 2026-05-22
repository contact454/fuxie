import { describe, expect, it } from 'vitest'

import {
    buildListeningQuestEpisode,
    buildListeningQuestEpisodeReceipt,
    getListeningQuestCheckpoint,
    listeningQuestEpisodeId,
} from './listening-quest-episode'

describe('buildListeningQuestEpisode', () => {
    it('builds a listening episode with reusable quest fields', () => {
        const episode = buildListeningQuestEpisode({
            lessonId: 'L-A1-GOETHE-001-T1',
            topic: 'Im Cafe',
            cefrLevel: 'A1',
            questionCount: 5,
        })

        expect(episode).toMatchObject({
            episodeId: 'listening-episode:A1:L-A1-GOETHE-001-T1',
            skill: 'listening',
            sourceId: 'L-A1-GOETHE-001-T1',
            lessonId: 'L-A1-GOETHE-001-T1',
            cefrLevel: 'A1',
            checkpoints: [
                expect.objectContaining({ id: 'preview', startIndex: 0 }),
                expect.objectContaining({ id: 'gist' }),
                expect.objectContaining({ id: 'details', endIndex: 4 }),
            ],
        })
        expect(episode.rewardPreview.map((reward) => reward.type)).toEqual(['xp', 'streak', 'unlock'])
    })

    it('maps current question index to the active listening checkpoint', () => {
        const episode = buildListeningQuestEpisode({
            lessonId: 'L-A2-GOETHE-002-T1',
            topic: 'Bahnhof',
            cefrLevel: 'A2',
            questionCount: 6,
        })

        expect(getListeningQuestCheckpoint({ episode, currentIndex: 0 }).id).toBe('preview')
        expect(getListeningQuestCheckpoint({ episode, currentIndex: 3 }).id).toBe('gist')
        expect(getListeningQuestCheckpoint({ episode, currentIndex: 5 }).id).toBe('details')
    })
})

describe('buildListeningQuestEpisodeReceipt', () => {
    it('builds a listening episode receipt and retry recommendation', () => {
        expect(listeningQuestEpisodeId('a1', 'L1')).toBe('listening-episode:A1:L1')

        expect(buildListeningQuestEpisodeReceipt({
            episodeId: 'listening-episode:A1:L1',
            lessonId: 'L1',
            cefrLevel: 'A1',
            accuracy: 92,
            totalQuestions: 4,
            answeredQuestions: 4,
        })).toMatchObject({
            skill: 'listening',
            sourceId: 'L1',
            lessonId: 'L1',
            accuracyBand: 'mastered',
            recommendedAction: 'next_episode',
            nextEpisodeHref: '/listening',
        })

        expect(buildListeningQuestEpisodeReceipt({
            episodeId: 'listening-episode:A1:L1',
            lessonId: 'L1',
            cefrLevel: 'A1',
            accuracy: 45,
            totalQuestions: 4,
            answeredQuestions: 4,
        }).recommendedAction).toBe('retry_episode')
    })
})
