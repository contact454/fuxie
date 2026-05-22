import { describe, it, expect } from 'vitest'

import {
    formatMascotRoleViolation,
    pickMascotPoseKey,
    resolveMascotRole,
} from './mascot-role-host'

/**
 * Unit tests locking the role-validation invariants and pose mapping for
 * task 5.2.
 *
 * Validates: Requirements 12.4, 12.5, 12.6, 12.7, 12.8, 12.9
 */
describe('mascot-role-host: resolveMascotRole', () => {
    it('Requirement 12.2/12.3: resolves the configured role for a known surface state', () => {
        const r = resolveMascotRole({ surfaceId: 'dashboard', state: 'default' })
        expect(r.valid).toBe(true)
        expect(r.role).toBe('coach')
        expect(r.violation).toBeNull()
    })

    it('Requirement 12.3: missing state falls back to `silent` and is valid', () => {
        // `vocabulary-practice` only declares `default` — a `success` state is
        // not configured so it must default to `silent` without violation.
        const r = resolveMascotRole({
            surfaceId: 'vocabulary-practice',
            state: 'success',
        })
        expect(r.role).toBe('silent')
        expect(r.requestedRole).toBe('silent')
        expect(r.valid).toBe(true)
    })

    it('Requirement 12.5: cheer is allowed when rewardEarned === true', () => {
        const r = resolveMascotRole({
            surfaceId: 'result-reward',
            state: 'default',
            role: 'cheer',
            rewardEarned: true,
        })
        expect(r.valid).toBe(true)
        expect(r.role).toBe('cheer')
    })

    it('Requirement 12.5: cheer is allowed when state === "empty" AND emptyReachedGoal', () => {
        const r = resolveMascotRole({
            surfaceId: 'review',
            state: 'empty',
            // review.empty is configured as `cheer` already, so this also
            // exercises the config path for cheer + empty-reached-goal.
            emptyReachedGoal: true,
        })
        expect(r.role).toBe('cheer')
        expect(r.valid).toBe(true)
    })

    it('Requirement 12.5: cheer outside reward/empty-reached-goal is invalid and falls back to silent', () => {
        const r = resolveMascotRole({
            surfaceId: 'dashboard',
            state: 'default',
            role: 'cheer',
        })
        expect(r.valid).toBe(false)
        expect(r.role).toBe('silent')
        expect(r.violation).toBe('cheer-without-reward-or-empty-goal')
    })

    it('Requirement 12.6: guard is allowed in {locked, empty, error}', () => {
        for (const state of ['locked', 'empty', 'error'] as const) {
            const r = resolveMascotRole({
                surfaceId: 'course',
                state,
                role: 'guard',
            })
            expect(r.valid, `guard should be allowed for state ${state}`).toBe(true)
            expect(r.role).toBe('guard')
        }
    })

    it('Requirement 12.6: guard outside locked/empty/error is invalid and falls back to silent', () => {
        const r = resolveMascotRole({
            surfaceId: 'dashboard',
            state: 'default',
            role: 'guard',
        })
        expect(r.valid).toBe(false)
        expect(r.role).toBe('silent')
        expect(r.violation).toBe('guard-outside-locked-empty-error')
    })

    it('Requirement 12.7: exam in-progress forces silent regardless of override', () => {
        const r = resolveMascotRole({
            surfaceId: 'exam',
            state: 'default',
            role: 'coach',
            examInProgress: true,
        })
        expect(r.role).toBe('silent')
        expect(r.valid).toBe(false)
        expect(r.violation).toBe('exam-in-progress-must-be-silent')
    })

    it('Requirement 12.7: exam in-progress with role silent is a valid render', () => {
        const r = resolveMascotRole({
            surfaceId: 'exam',
            state: 'default',
            examInProgress: true,
        })
        expect(r.role).toBe('silent')
        expect(r.valid).toBe(true)
        expect(r.violation).toBeNull()
    })

    it('Requirement 12.7: exam without in-progress flag respects config (silent on default, guard on error)', () => {
        const def = resolveMascotRole({ surfaceId: 'exam', state: 'default' })
        expect(def.role).toBe('silent')
        const err = resolveMascotRole({ surfaceId: 'exam', state: 'error' })
        expect(err.role).toBe('guard')
        expect(err.valid).toBe(true)
    })
})

describe('mascot-role-host: pickMascotPoseKey', () => {
    it('Requirement 12.4: maps roles to FUXIE_MASCOT_STATES pose keys', () => {
        expect(pickMascotPoseKey('coach', 'dashboard', 'default')).toBe(
            'sessionFocusCoach',
        )
        expect(pickMascotPoseKey('cheer', 'result-reward', 'default')).toBe(
            'resultCelebration',
        )
        expect(pickMascotPoseKey('guard', 'dashboard', 'empty')).toBe('calmEmpty')
        expect(pickMascotPoseKey('guard', 'dashboard', 'error')).toBe(
            'errorRepairHelper',
        )
    })

    it('companion pose varies per surface (roleplay vs vocabulary vs default)', () => {
        expect(
            pickMascotPoseKey('companion', 'speaking-roleplay', 'default'),
        ).toBe('roleplayWaiter')
        expect(pickMascotPoseKey('companion', 'vocabulary', 'default')).toBe(
            'microgameReferee',
        )
        // surfaces without a specific entry fall back to roleplayWaiter
        expect(pickMascotPoseKey('companion', 'review', 'default')).toBe(
            'roleplayWaiter',
        )
    })
})

describe('mascot-role-host: formatMascotRoleViolation', () => {
    it('produces the explicit dev-error message format', () => {
        const r = resolveMascotRole({
            surfaceId: 'dashboard',
            state: 'default',
            role: 'cheer',
        })
        const msg = formatMascotRoleViolation(r, 'dashboard', 'default')
        expect(msg).toMatch(
            /^\[MascotRoleHost\] role "cheer" not allowed for state "default" on surface "dashboard" — reason: /,
        )
    })
})
