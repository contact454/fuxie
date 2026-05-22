import { describe, expect, it } from 'vitest'
import {
    getLearningOutcomesForLevel,
    getLearningOutcomesForSkill,
    recommendNextLearningOutcomes,
    buildRemediationLoop,
} from './learning-outcome-path'

describe('learning outcome path', () => {
    it('loads outcomes for a CEFR level', () => {
        const outcomes = getLearningOutcomesForLevel('A1')

        expect(outcomes.length).toBeGreaterThan(0)
        expect(outcomes.every((outcome) => outcome.cefrLevel === 'A1')).toBe(true)
    })

    it('filters outcomes by level and skill', () => {
        const outcomes = getLearningOutcomesForSkill('B1', 'reading')

        expect(outcomes.length).toBeGreaterThan(0)
        expect(outcomes.every((outcome) => outcome.cefrLevel === 'B1' && outcome.skill === 'reading')).toBe(true)
    })

    it('prioritizes weak skills in recommendations', () => {
        const recommendations = recommendNextLearningOutcomes({
            level: 'A2',
            weakSkills: ['listening'],
            limit: 3,
        })

        expect(recommendations.length).toBeGreaterThan(0)
        expect(recommendations.every((item) => item.outcome.skill === 'listening')).toBe(true)
    })

    it('builds a remediation loop with support outcomes', () => {
        const loops = buildRemediationLoop({
            level: 'B1',
            weakSkills: ['writing'],
        })

        expect(loops.length).toBeGreaterThan(0)
        expect(loops[0]!.outcomes.length).toBeGreaterThan(0)
        expect(loops[0]!.outcomes.some((outcome) => outcome.skill === 'vocabulary' || outcome.skill === 'grammar')).toBe(true)
    })
})
