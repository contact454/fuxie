import { describe, expect, it } from 'vitest'
import { buildLearnerWeaknessProfile } from './learner-weakness-profile'

describe('buildLearnerWeaknessProfile', () => {
    it('prioritizes critical low scores', () => {
        const profile = buildLearnerWeaknessProfile({
            currentLevel: 'B1',
            skillScores: {
                HOEREN: 42,
                SCHREIBEN: 61,
                LESEN: 82,
            },
        })

        expect(profile.weakSkills[0]).toBe('HOEREN')
        expect(profile.signals[0]).toMatchObject({
            skill: 'HOEREN',
            severity: 'critical',
        })
    })

    it('normalizes fractional assessment scores', () => {
        const profile = buildLearnerWeaknessProfile({
            currentLevel: 'A2',
            skillScores: {
                SPRECHEN: 0.52,
            },
        })

        expect(profile.signals.find((signal) => signal.skill === 'SPRECHEN')?.scorePercent).toBe(52)
        expect(profile.weakSkills[0]).toBe('SPRECHEN')
    })

    it('uses explicit weak skills when scores are missing', () => {
        const profile = buildLearnerWeaknessProfile({
            currentLevel: 'A1',
            explicitWeakSkills: ['GRAMMATIK'],
        })

        expect(profile.weakSkills[0]).toBe('GRAMMATIK')
        expect(profile.summary).toContain('ngữ pháp')
    })
})
