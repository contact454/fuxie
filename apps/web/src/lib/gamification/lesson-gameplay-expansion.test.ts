import { describe, expect, it } from 'vitest'

import {
    A1_FIRST_CONTACT_PATH,
    A1_CAMPAIGN_NODES,
    GERMAN_ROLEPLAY_SCENARIOS,
    VOCABULARY_MICROGAMES,
    buildBadgeAlbum,
    buildCampaignNodeProgress,
    buildFirstSessionPathProgress,
    getFirstSessionNextStep,
    getMicrogameById,
    getRoleplayScenarioById,
} from './lesson-gameplay-expansion'

describe('lesson gameplay expansion catalog', () => {
    it('defines the pilot microgame pack without changing reward economy routes', () => {
        expect(VOCABULARY_MICROGAMES.map((game) => game.id)).toEqual([
            'speed-match',
            'cloze-streak',
            'boss-review',
        ])
        expect(VOCABULARY_MICROGAMES.map((game) => game.hrefForTheme('a1-person', 'A1'))).toEqual([
            '/vocabulary/practice/speed?theme=a1-person&level=A1',
            '/vocabulary/practice/cloze?theme=a1-person&level=A1',
            '/vocabulary/practice/mixed?theme=a1-person&level=A1',
        ])
        expect(getMicrogameById('missing')?.id).toBe('speed-match')
    })

    it('defines sprint 2 round contracts and next actions for each microgame', () => {
        for (const game of VOCABULARY_MICROGAMES) {
            expect(game.successCriteria.length).toBeGreaterThanOrEqual(3)
            expect(game.completionRule).toContain('submit')
            expect(game.receiptExpectation.toLowerCase()).toContain('receipt')
            expect(game.nextActionLabel.toLowerCase()).toContain('theo')
            expect(game.nextActionHrefForTheme('a1-person', 'A1')).toMatch(/^\/(vocabulary|campaign)/)
        }

        expect(VOCABULARY_MICROGAMES.map((game) => game.nextActionHrefForTheme('a1-person', 'A1'))).toEqual([
            '/vocabulary/practice/cloze?theme=a1-person&level=A1',
            '/vocabulary/practice/mixed?theme=a1-person&level=A1',
            '/campaign',
        ])
    })

    it('defines sprint 3 first-session path from recognition to roleplay', () => {
        expect(A1_FIRST_CONTACT_PATH.map((step) => step.id)).toEqual([
            'speed-match',
            'cloze-streak',
            'boss-review',
            'roleplay-self-intro',
        ])
        expect(getFirstSessionNextStep('speed-match')).toMatchObject({
            id: 'cloze-streak',
            href: '/vocabulary/practice/cloze?theme=a1-person&level=A1',
        })
        expect(getFirstSessionNextStep('boss-review')).toMatchObject({
            id: 'roleplay-self-intro',
            href: '/speaking/roleplay?scenario=self-intro&level=A1',
        })
    })

    it('computes first-session path progress from learning and roleplay evidence', () => {
        const progress = buildFirstSessionPathProgress([
            event('meaningful_action_completed', 'vocabulary_practice', 'WORTSCHATZ', 'attempt-speed', {
                theme_slug: 'a1-person',
                exercise_type: 'speed',
            }),
            event('meaningful_action_completed', 'vocabulary_practice', 'WORTSCHATZ', 'vocab:A1:a1-person:cloze', {
                theme_slug: 'a1-person',
                exercise_type: 'cloze',
            }),
            event('quest_episode_completed', 'speaking_submission', 'speaking', 'roleplay:self-intro:A1', {
                scenarioId: 'self-intro',
            }),
        ])

        expect(progress.map((step) => [step.id, step.status])).toEqual([
            ['speed-match', 'done'],
            ['cloze-streak', 'done'],
            ['boss-review', 'next'],
            ['roleplay-self-intro', 'done'],
        ])
        expect(progress[0]?.completedAt).toBeTruthy()
    })

    it('keeps roleplay scenarios bounded and scenario-addressable', () => {
        expect(GERMAN_ROLEPLAY_SCENARIOS).toHaveLength(2)
        expect(getRoleplayScenarioById('cafe-order')).toMatchObject({
            id: 'cafe-order',
            cefrLevel: 'A1',
            href: '/speaking/roleplay?scenario=cafe-order&level=A1',
        })
    })

    it('builds a badge album with earned, ready, and locked states', () => {
        const album = buildBadgeAlbum({
            earnedBadgeSlugs: ['first-quest'],
            currentLevel: 'A1',
            events: [
                event('meaningful_action_completed', 'vocabulary_practice', 'vocabulary'),
                event('meaningful_action_completed', 'vocabulary_practice', 'vocabulary'),
            ],
        })

        expect(album.find((badge) => badge.id === 'first-quest')).toMatchObject({
            displayState: 'earned',
            unlocked: true,
        })
        expect(album.find((badge) => badge.id === 'vocabulary-starter')).toMatchObject({
            displayState: 'ready',
            progress: 100,
        })
        expect(album.find((badge) => badge.id === 'speaking-starter')?.displayState).toBe('locked')
    })

    it('computes campaign node progress from meaningful learning evidence', () => {
        const node = A1_CAMPAIGN_NODES[0]!
        const progress = buildCampaignNodeProgress({
            node,
            meaningfulEvents: [
                event('meaningful_action_completed', 'vocabulary_practice', 'vocabulary', 'a1-person-round'),
                event('meaningful_action_completed', 'speaking_submission', 'speaking', 'self-intro'),
            ],
        })

        expect(progress).toMatchObject({
            nodeId: 'a1-person',
            evidenceCount: 2,
        })
        expect(progress.progress).toBeGreaterThan(0)
        expect(progress.state).toBe('in_progress')
        expect(progress.stateLabel).toBe('In progress')
    })

    it('marks campaign boss nodes ready when evidence is strong enough', () => {
        const node = A1_CAMPAIGN_NODES.find((item) => item.boss)!
        const progress = buildCampaignNodeProgress({
            node,
            meaningfulEvents: [
                event('meaningful_action_completed', 'vocabulary_practice', 'vocabulary', 'a1-einkaufen-speed'),
            ],
        })

        expect(progress).toMatchObject({
            state: 'ready_for_boss',
            stateLabel: 'Ready for boss',
            completed: false,
        })
    })
})

function event(
    eventName: string,
    actionType: string,
    skill: string,
    actionId = 'lesson-1',
    metadata: Record<string, unknown> = { accuracy: 80, cefrLevel: 'A1' },
) {
    return {
        userId: 'learner-1',
        eventName,
        actionId,
        actionType,
        skill,
        level: 'A1',
        metadata,
        createdAt: new Date('2026-05-01T08:00:00.000Z'),
    }
}
