import learningOutcomeMap from '@/data/content-quality/learning-outcome-map.json'

export type ContentQualitySkill = 'vocabulary' | 'grammar' | 'reading' | 'listening' | 'writing' | 'speaking' | 'course'
export type ContentQualityLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'

export interface LearningOutcomeEntry {
    id: string
    cefrLevel: ContentQualityLevel
    skill: ContentQualitySkill
    canDoVi: string
    canDoDe: string
    linkedContentIds: string[]
    ownerFile: string
    ownerId: string
    ownerTitle: string
}

export interface PersonalizedOutcomeRecommendation {
    outcome: LearningOutcomeEntry
    reason: string
}

export interface RemediationRecommendation {
    skill: ContentQualitySkill
    outcomes: LearningOutcomeEntry[]
    reason: string
}

const OUTCOMES = (learningOutcomeMap.outcomes || []) as LearningOutcomeEntry[]

const SKILL_PROGRESS_ORDER: ContentQualitySkill[] = [
    'vocabulary',
    'grammar',
    'reading',
    'listening',
    'writing',
    'speaking',
]

export function getLearningOutcomesForLevel(level: ContentQualityLevel) {
    return OUTCOMES.filter((outcome) => outcome.cefrLevel === level)
}

export function getLearningOutcomesForSkill(level: ContentQualityLevel, skill: ContentQualitySkill) {
    return OUTCOMES.filter((outcome) => outcome.cefrLevel === level && outcome.skill === skill)
}

export function recommendNextLearningOutcomes(params: {
    level: ContentQualityLevel
    completedOutcomeIds?: string[]
    weakSkills?: ContentQualitySkill[]
    limit?: number
}): PersonalizedOutcomeRecommendation[] {
    const completed = new Set(params.completedOutcomeIds || [])
    const weakSkills = params.weakSkills || []
    const limit = params.limit ?? 6
    const levelOutcomes = getLearningOutcomesForLevel(params.level)

    const preferredSkills = weakSkills.length > 0
        ? weakSkills
        : SKILL_PROGRESS_ORDER

    const recommendations: PersonalizedOutcomeRecommendation[] = []
    for (const skill of preferredSkills) {
        const candidates = levelOutcomes.filter((outcome) => outcome.skill === skill && !completed.has(outcome.id))
        for (const outcome of candidates) {
            recommendations.push({
                outcome,
                reason: weakSkills.includes(skill)
                    ? `Focus ${skill} because it is marked as a weak skill.`
                    : `Next ${skill} outcome in the CEFR progression.`,
            })
            if (recommendations.length >= limit) return recommendations
        }
    }

    return recommendations
}

export function buildRemediationLoop(params: {
    level: ContentQualityLevel
    weakSkills: ContentQualitySkill[]
    completedOutcomeIds?: string[]
    limitPerWeakSkill?: number
}): RemediationRecommendation[] {
    const completed = new Set(params.completedOutcomeIds || [])
    const limit = params.limitPerWeakSkill ?? 3

    return params.weakSkills.map((skill) => {
        const supportSkills = supportSkillOrder(skill)
        const outcomes = supportSkills
            .flatMap((supportSkill) => getLearningOutcomesForSkill(params.level, supportSkill))
            .filter((outcome) => !completed.has(outcome.id))
            .slice(0, limit)

        return {
            skill,
            outcomes,
            reason: `Use vocabulary/grammar support plus ${skill} practice to repair the weak skill.`,
        }
    }).filter((item) => item.outcomes.length > 0)
}

function supportSkillOrder(skill: ContentQualitySkill): ContentQualitySkill[] {
    if (skill === 'vocabulary' || skill === 'grammar') return [skill, 'reading', 'listening']
    if (skill === 'writing' || skill === 'speaking') return ['vocabulary', 'grammar', skill]
    if (skill === 'reading' || skill === 'listening') return ['vocabulary', 'grammar', skill]
    return ['vocabulary', 'grammar', 'reading']
}
