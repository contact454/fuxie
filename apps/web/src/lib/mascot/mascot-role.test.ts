import { describe, it, expect } from 'vitest'
import {
    MASCOT_ROLES,
    REWARD_STATES,
    SURFACE_STATES,
    P0_SURFACE_IDS,
    SURFACE_MASCOT_CONFIG,
    type MascotRole,
    type RewardState,
    type SurfaceState,
    type SurfaceId,
} from './mascot-role'

/**
 * Unit tests locking the acceptance criteria of task 5.1:
 *   - `MASCOT_ROLES` length is exactly 5.
 *   - Every P0 surface has an entry covering at least `default`.
 *
 * Validates: Requirements 12.1, 12.2, 12.3
 */
describe('mascot-role: enums and SURFACE_MASCOT_CONFIG', () => {
    it('Requirement 12.1: MASCOT_ROLES has exactly 5 values', () => {
        expect(MASCOT_ROLES).toHaveLength(5)
        expect(new Set(MASCOT_ROLES)).toEqual(
            new Set(['coach', 'companion', 'cheer', 'guard', 'silent']),
        )
    })

    it('REWARD_STATES has exactly 5 values', () => {
        expect(REWARD_STATES).toHaveLength(5)
        expect(new Set(REWARD_STATES)).toEqual(
            new Set(['preview', 'earned', 'receipt', 'locked', 'pending']),
        )
    })

    it('SURFACE_STATES matches the design §B.1 enum', () => {
        expect(SURFACE_STATES).toHaveLength(5)
        expect(new Set(SURFACE_STATES)).toEqual(
            new Set(['default', 'empty', 'locked', 'error', 'success']),
        )
    })

    it('Requirement 12.2: every P0 surface has an entry covering at least `default`', () => {
        for (const surfaceId of P0_SURFACE_IDS) {
            const config = SURFACE_MASCOT_CONFIG[surfaceId]
            expect(config, `surface "${surfaceId}" missing config`).toBeDefined()
            expect(config.surfaceId).toBe(surfaceId)
            expect(
                config.states.default,
                `surface "${surfaceId}" missing default state`,
            ).toBeDefined()
        }
    })

    it('every SURFACE_MASCOT_CONFIG role value is one of MASCOT_ROLES', () => {
        const validRoles = new Set<MascotRole>(MASCOT_ROLES)
        for (const config of Object.values(SURFACE_MASCOT_CONFIG)) {
            for (const [state, role] of Object.entries(config.states)) {
                expect(
                    validRoles.has(role as MascotRole),
                    `surface "${config.surfaceId}" state "${state}" has invalid role "${role}"`,
                ).toBe(true)
            }
        }
    })

    it('exposes the 13 P0 surfaces plus the result-reward overlay', () => {
        // 13 P0 learner surfaces from design §I + the cross-surface
        // `result-reward` overlay used by ResultRewardLoop.
        expect(P0_SURFACE_IDS).toHaveLength(14)
        expect(P0_SURFACE_IDS).toContain('dashboard')
        expect(P0_SURFACE_IDS).toContain('exam')
        expect(P0_SURFACE_IDS).toContain('result-reward')
    })

    it('type aliases are usable at the type level', () => {
        // Smoke-check the exported type aliases compile against expected literals.
        const role: MascotRole = 'coach'
        const reward: RewardState = 'earned'
        const state: SurfaceState = 'default'
        const surface: SurfaceId = 'dashboard'
        expect([role, reward, state, surface]).toEqual([
            'coach',
            'earned',
            'default',
            'dashboard',
        ])
    })
})
