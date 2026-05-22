import type { QuestEpisodeSkill } from './quest-episode'
import type { SkillKey, TodayPlanAction } from '@/lib/personalization/today-plan'

export interface QuestEpisodeRoutingDecision {
    nextEpisodeHref: string
    recommendedAction: 'retry_episode' | 'next_episode'
    reason: string
    routedSkill: QuestEpisodeSkill | 'review' | 'exam'
}

const SKILL_TO_EPISODE: Partial<Record<SkillKey, { skill: QuestEpisodeSkill | 'review' | 'exam'; href: string }>> = {
    WORTSCHATZ: { skill: 'vocabulary', href: '/vocabulary/practice' },
    GRAMMATIK: { skill: 'grammar', href: '/grammar' },
    HOEREN: { skill: 'listening', href: '/listening' },
    LESEN: { skill: 'reading', href: '/reading' },
}

export function chooseQuestEpisodeRoute(input: {
    currentSkill: QuestEpisodeSkill
    accuracy: number
    fallbackHref: string
    retryHref?: string
    todayPlanActions?: Pick<TodayPlanAction, 'href' | 'skill' | 'type'>[]
    weakSkills?: SkillKey[]
}): QuestEpisodeRoutingDecision {
    if (input.accuracy < 70) {
        return {
            nextEpisodeHref: input.retryHref ?? input.fallbackHref,
            recommendedAction: 'retry_episode',
            reason: 'accuracy_below_clear_threshold',
            routedSkill: input.currentSkill,
        }
    }

    const weakSkillRoute = firstSkillRoute(input.weakSkills)
    if (weakSkillRoute && weakSkillRoute.skill !== input.currentSkill) {
        return {
            nextEpisodeHref: weakSkillRoute.href,
            recommendedAction: 'next_episode',
            reason: 'weak_skill_priority',
            routedSkill: weakSkillRoute.skill,
        }
    }

    const nextAction = input.todayPlanActions?.find((action) => {
        if (action.type !== 'lesson' && action.type !== 'srs' && action.type !== 'exam') return false
        return typeof action.href === 'string' && action.href.length > 0
    })
    if (nextAction) {
        const routed = nextAction.skill === 'SRS'
            ? 'review'
            : nextAction.skill === 'EXAM'
                ? 'exam'
                : SKILL_TO_EPISODE[nextAction.skill]?.skill ?? input.currentSkill
        return {
            nextEpisodeHref: nextAction.href,
            recommendedAction: 'next_episode',
            reason: 'today_plan_priority',
            routedSkill: routed,
        }
    }

    return {
        nextEpisodeHref: input.fallbackHref,
        recommendedAction: 'next_episode',
        reason: 'safe_fallback',
        routedSkill: input.currentSkill,
    }
}

function firstSkillRoute(weakSkills?: SkillKey[]) {
    for (const skill of weakSkills ?? []) {
        const route = SKILL_TO_EPISODE[skill]
        if (route) return route
    }
    return null
}
