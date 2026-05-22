import { describe, expect, it } from 'vitest'

import {
    buildGrammarQuestCheckpoints,
    buildGrammarQuestEpisode,
    buildGrammarQuestEpisodeReceipt,
    getGrammarQuestCheckpoint,
    grammarQuestEpisodeId,
} from './grammar-quest-episode'

describe('grammar quest episode', () => {
    it('builds a grammar episode with notice, apply, and explain checkpoints', () => {
        const episode = buildGrammarQuestEpisode({
            lessonId: 'a1-word-order-1',
            topicSlug: 'a1-word-order',
            title: 'Wortstellung',
            cefrLevel: 'A1',
            questionCount: 6,
        })

        expect(episode).toMatchObject({
            episodeId: 'grammar-episode:A1:a1-word-order-1',
            skill: 'grammar',
            sourceId: 'a1-word-order-1',
            nextEpisodeHref: '/grammar',
        })
        expect(episode.checkpoints.map((checkpoint) => checkpoint.id)).toEqual(['notice', 'apply', 'explain'])
        expect(episode.rewardPreview).toEqual([
            expect.objectContaining({ type: 'xp' }),
            expect.objectContaining({ type: 'streak' }),
            expect.objectContaining({ type: 'unlock' }),
        ])
    })

    it('maps current exercise index to the active grammar checkpoint', () => {
        const episode = buildGrammarQuestEpisode({
            lessonId: 'a2-cases-1',
            topicSlug: 'a2-cases',
            title: 'Akkusativ',
            cefrLevel: 'A2',
            questionCount: 9,
        })

        expect(getGrammarQuestCheckpoint({ episode, currentIndex: 0 }).id).toBe('notice')
        expect(getGrammarQuestCheckpoint({ episode, currentIndex: 4 }).id).toBe('apply')
        expect(getGrammarQuestCheckpoint({ episode, currentIndex: 8 }).id).toBe('explain')
    })

    it('builds receipt with retry action for weak accuracy', () => {
        const receipt = buildGrammarQuestEpisodeReceipt({
            episodeId: grammarQuestEpisodeId('B1', 'b1-nebensaetze-1'),
            lessonId: 'b1-nebensaetze-1',
            cefrLevel: 'B1',
            accuracy: 48,
            totalQuestions: 5,
            answeredQuestions: 5,
        })

        expect(receipt).toMatchObject({
            skill: 'grammar',
            lessonId: 'b1-nebensaetze-1',
            accuracyBand: 'rebuild',
            completedCheckpoints: 3,
            recommendedAction: 'retry_episode',
            nextEpisodeHref: '/grammar',
        })
    })

    it('keeps checkpoint ranges stable for short grammar lessons', () => {
        expect(buildGrammarQuestCheckpoints(1)).toEqual([
            expect.objectContaining({ id: 'notice', startIndex: 0, endIndex: 0 }),
            expect.objectContaining({ id: 'apply', startIndex: 0, endIndex: 0 }),
            expect.objectContaining({ id: 'explain', startIndex: 0, endIndex: 0 }),
        ])
    })
})
