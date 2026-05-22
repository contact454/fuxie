import { describe, expect, it } from 'vitest'

import {
    buildSpeakingQuestEpisode,
    buildSpeakingQuestEpisodeReceipt,
    getSpeakingQuestCheckpoint,
    speakingQuestEpisodeId,
} from './speaking-quest-episode'

describe('buildSpeakingQuestEpisode', () => {
    it('builds a nachsprechen episode with listen record refine checkpoints', () => {
        const episode = buildSpeakingQuestEpisode({
            lessonId: 'S-A1-001',
            topicSlug: 'a1-begruessung',
            title: 'Sich vorstellen',
            cefrLevel: 'A1',
            sentenceCount: 6,
            exerciseType: 'nachsprechen',
        })

        expect(episode).toMatchObject({
            episodeId: 'speaking-episode:A1:S-A1-001',
            skill: 'speaking',
            sourceId: 'S-A1-001',
            lessonId: 'S-A1-001',
            topicSlug: 'a1-begruessung',
            exerciseType: 'nachsprechen',
            nextEpisodeHref: '/speaking',
        })
        expect(episode.checkpoints.map((checkpoint) => checkpoint.id)).toEqual(['listen', 'record', 'refine'])
        expect(episode.rewardPreview.map((reward) => reward.type)).toEqual(['xp', 'streak', 'unlock'])
    })

    it('maps the active checkpoint from sentence progress', () => {
        const episode = buildSpeakingQuestEpisode({
            lessonId: 'S-A1-001',
            topicSlug: 'a1-begruessung',
            title: 'Sich vorstellen',
            cefrLevel: 'A1',
            sentenceCount: 6,
            exerciseType: 'nachsprechen',
        })

        expect(getSpeakingQuestCheckpoint({ episode, currentIndex: 0 }).id).toBe('listen')
        expect(getSpeakingQuestCheckpoint({ episode, currentIndex: 3 }).id).toBe('record')
        expect(getSpeakingQuestCheckpoint({ episode, currentIndex: 5 }).id).toBe('refine')
    })
})

describe('buildSpeakingQuestEpisodeReceipt', () => {
    it('returns score band and pronunciation feedback state', () => {
        const receipt = buildSpeakingQuestEpisodeReceipt({
            episodeId: speakingQuestEpisodeId('A1', 'S-A1-001'),
            lessonId: 'S-A1-001',
            cefrLevel: 'A1',
            scorePercent: 82,
            completedCheckpoints: 3,
            checkpointCount: 3,
            nextEpisodeHref: '/speaking/S-A1-002',
            pronunciationFeedbackState: 'evaluated',
        })

        expect(receipt).toMatchObject({
            skill: 'speaking',
            lessonId: 'S-A1-001',
            accuracyBand: 'clear',
            scoreBand: 'clear',
            pronunciationFeedbackState: 'evaluated',
            completedCheckpoints: 3,
            checkpointCount: 3,
            recommendedAction: 'next_episode',
            nextEpisodeHref: '/speaking/S-A1-002',
        })
    })

    it('recommends retry for low score bands', () => {
        expect(buildSpeakingQuestEpisodeReceipt({
            episodeId: 'speaking-episode:A1:S-A1-001',
            lessonId: 'S-A1-001',
            cefrLevel: 'A1',
            scorePercent: 40,
        })).toMatchObject({
            accuracyBand: 'rebuild',
            recommendedAction: 'retry_episode',
            nextEpisodeHref: '/speaking',
        })
    })
})
