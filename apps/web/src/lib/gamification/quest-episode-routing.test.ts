import { describe, expect, it } from 'vitest'

import { chooseQuestEpisodeRoute } from './quest-episode-routing'

describe('chooseQuestEpisodeRoute', () => {
    it('keeps weak grammar attempts on retry without punishment', () => {
        expect(chooseQuestEpisodeRoute({
            currentSkill: 'grammar',
            accuracy: 62,
            fallbackHref: '/grammar',
            retryHref: '/grammar/a1-word-order/a1-word-order-1',
            weakSkills: ['HOEREN'],
        })).toEqual({
            nextEpisodeHref: '/grammar/a1-word-order/a1-word-order-1',
            recommendedAction: 'retry_episode',
            reason: 'accuracy_below_clear_threshold',
            routedSkill: 'grammar',
        })
    })

    it('routes clear attempts toward the first non-current weak skill', () => {
        expect(chooseQuestEpisodeRoute({
            currentSkill: 'grammar',
            accuracy: 82,
            fallbackHref: '/grammar',
            weakSkills: ['LESEN', 'GRAMMATIK'],
        })).toMatchObject({
            nextEpisodeHref: '/reading',
            recommendedAction: 'next_episode',
            reason: 'weak_skill_priority',
            routedSkill: 'reading',
        })
    })

    it('falls back to today plan when weak skills do not change the episode path', () => {
        expect(chooseQuestEpisodeRoute({
            currentSkill: 'grammar',
            accuracy: 91,
            fallbackHref: '/grammar',
            weakSkills: ['GRAMMATIK'],
            todayPlanActions: [
                { href: '/listening/L-A1-001', skill: 'HOEREN', type: 'lesson' },
            ],
        })).toMatchObject({
            nextEpisodeHref: '/listening/L-A1-001',
            reason: 'today_plan_priority',
            routedSkill: 'listening',
        })
    })

    it('uses a safe fallback when no learner signal is available', () => {
        expect(chooseQuestEpisodeRoute({
            currentSkill: 'grammar',
            accuracy: 88,
            fallbackHref: '/grammar',
        })).toMatchObject({
            nextEpisodeHref: '/grammar',
            reason: 'safe_fallback',
            routedSkill: 'grammar',
        })
    })
})
