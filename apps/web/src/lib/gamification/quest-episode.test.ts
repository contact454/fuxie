import { describe, expect, it } from 'vitest'

import {
    buildQuestEpisodeCheckpoints,
    buildQuestEpisodeReceipt,
    getQuestEpisodeAccuracyBand,
    getQuestEpisodeCheckpoint,
} from './quest-episode'

const definitions = [
    { id: 'preview', title: 'Preview', objective: 'Set focus.' },
    { id: 'gist', title: 'Gist', objective: 'Catch the main idea.' },
    { id: 'details', title: 'Details', objective: 'Lock in details.' },
] as const

describe('quest episode framework', () => {
    it('maps checkpoint ranges across an episode', () => {
        const checkpoints = buildQuestEpisodeCheckpoints(definitions, 10)

        expect(checkpoints).toEqual([
            expect.objectContaining({ id: 'preview', startIndex: 0, endIndex: 3 }),
            expect.objectContaining({ id: 'gist', startIndex: 4, endIndex: 6 }),
            expect.objectContaining({ id: 'details', startIndex: 7, endIndex: 9 }),
        ])
        expect(getQuestEpisodeCheckpoint({ episode: { checkpoints }, currentIndex: 8 }).id).toBe('details')
    })

    it('keeps tiny episode ranges valid', () => {
        const checkpoints = buildQuestEpisodeCheckpoints(definitions, 1)

        expect(checkpoints.map((checkpoint) => [checkpoint.id, checkpoint.startIndex, checkpoint.endIndex])).toEqual([
            ['preview', 0, 0],
            ['gist', 0, 0],
            ['details', 0, 0],
        ])
    })

    it('builds receipt action from accuracy band', () => {
        expect(getQuestEpisodeAccuracyBand(95)).toBe('mastered')
        expect(getQuestEpisodeAccuracyBand(72)).toBe('clear')
        expect(getQuestEpisodeAccuracyBand(55)).toBe('practice_again')
        expect(getQuestEpisodeAccuracyBand(20)).toBe('rebuild')

        expect(buildQuestEpisodeReceipt({
            episodeId: 'listening-episode:A1:L1',
            skill: 'listening',
            sourceId: 'W1',
            cefrLevel: 'A1',
            accuracy: 88,
            totalQuestions: 4,
            answeredQuestions: 4,
            checkpointCount: 3,
            masteryContribution: () => 'Progress recorded.',
        })).toMatchObject({
            accuracyBand: 'clear',
            completedCheckpoints: 3,
            recommendedAction: 'next_episode',
            nextEpisodeHref: '/listening',
        })

        expect(buildQuestEpisodeReceipt({
            episodeId: 'writing-episode:A1:W1',
            skill: 'writing',
            sourceId: 'L1',
            cefrLevel: 'A1',
            accuracy: 40,
            totalQuestions: 4,
            answeredQuestions: 4,
            checkpointCount: 3,
            masteryContribution: () => 'Replay recommended.',
        })).toMatchObject({
            recommendedAction: 'retry_episode',
            nextEpisodeHref: '/writing',
        })
    })
})
