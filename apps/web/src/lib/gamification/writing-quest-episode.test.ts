import { describe, expect, it } from 'vitest'

import {
    buildWritingQuestCheckpoints,
    buildWritingQuestEpisode,
    buildWritingQuestEpisodeReceipt,
    getWritingQuestCheckpoint,
    writingQuestEpisodeId,
} from './writing-quest-episode'

describe('writing quest episode', () => {
    it('builds a writing episode with plan, draft, and revise checkpoints', () => {
        const episode = buildWritingQuestEpisode({
            exerciseId: 'w-a1-email-1',
            topic: 'Eine Einladung beantworten',
            textType: 'E-Mail',
            cefrLevel: 'A1',
            minWords: 80,
        })

        expect(episode).toMatchObject({
            episodeId: 'writing-episode:A1:w-a1-email-1',
            skill: 'writing',
            sourceId: 'w-a1-email-1',
            nextEpisodeHref: '/writing',
        })
        expect(episode.checkpoints.map((checkpoint) => checkpoint.id)).toEqual(['plan', 'draft', 'revise'])
        expect(episode.rewardPreview).toEqual([
            expect.objectContaining({ type: 'xp' }),
            expect.objectContaining({ type: 'streak' }),
            expect.objectContaining({ type: 'unlock' }),
        ])
    })

    it('maps word progress to the active writing checkpoint', () => {
        const episode = buildWritingQuestEpisode({
            exerciseId: 'w-b1-forum-1',
            topic: 'Forumbeitrag',
            textType: 'Forum',
            cefrLevel: 'B1',
            minWords: 90,
        })

        expect(getWritingQuestCheckpoint({ episode, currentIndex: 0 }).id).toBe('plan')
        expect(getWritingQuestCheckpoint({ episode, currentIndex: 40 }).id).toBe('draft')
        expect(getWritingQuestCheckpoint({ episode, currentIndex: 89 }).id).toBe('revise')
    })

    it('builds a receipt with feedback state and retry action for weak writing scores', () => {
        const receipt = buildWritingQuestEpisodeReceipt({
            episodeId: writingQuestEpisodeId('B1', 'w-b1-brief-1'),
            exerciseId: 'w-b1-brief-1',
            cefrLevel: 'B1',
            scorePercent: 48,
            completedCheckpoints: 3,
        })

        expect(receipt).toMatchObject({
            skill: 'writing',
            exerciseId: 'w-b1-brief-1',
            accuracyBand: 'rebuild',
            scoreBand: 'rebuild',
            feedbackSummaryState: 'generated',
            completedCheckpoints: 3,
            recommendedAction: 'retry_episode',
            nextEpisodeHref: '/writing',
        })
    })

    it('keeps checkpoint ranges stable for short writing prompts', () => {
        expect(buildWritingQuestCheckpoints(1)).toEqual([
            expect.objectContaining({ id: 'plan', startIndex: 0, endIndex: 0 }),
            expect.objectContaining({ id: 'draft', startIndex: 1, endIndex: 1 }),
            expect.objectContaining({ id: 'revise', startIndex: 2, endIndex: 2 }),
        ])
    })
})
