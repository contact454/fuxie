/**
 * Mascot role system and per-surface state contract.
 *
 * Implements the canonical enums and per-surface configuration table from
 * design §B.1 of `gamified-ui-asset-rollout`. This module is a pure
 * declarative source of truth — it does not render mascots, validate runtime
 * rules, or emit warnings. The `MascotRoleHost` component (task 5.2) consumes
 * `SURFACE_MASCOT_CONFIG` to resolve roles and enforce semantic rules
 * (cheer ⇒ earned/empty-reached-goal, guard ⇒ locked|empty|error, exam
 * in-progress ⇒ silent).
 *
 * Validates: Requirements 12.1, 12.2, 12.3
 */

// -----------------------------------------------------------------------------
// Mascot_Role enumeration
// -----------------------------------------------------------------------------

/**
 * The closed set of mascot roles. A mascot is never a decoration — every
 * appearance carries one of these roles.
 *
 * - `coach`     Hướng dẫn / first viewport / Skill_Motivation_Layer.
 * - `companion` Đi cùng quá trình học (vocabulary, roleplay, shop).
 * - `cheer`     Reward / streak / level-up. Allowed only when reward earned
 *               or learner reached an empty-state goal.
 * - `guard`     Locked / empty / error states. Never on a happy path.
 * - `silent`    Mascot không render. Default when a state has no entry.
 *
 * Validates: Requirement 12.1
 */
export const MASCOT_ROLES = ['coach', 'companion', 'cheer', 'guard', 'silent'] as const

export type MascotRole = (typeof MASCOT_ROLES)[number]

// -----------------------------------------------------------------------------
// Reward_State enumeration
// -----------------------------------------------------------------------------

/**
 * Runtime values that a reward-bearing component may set on `data-reward-state`.
 *
 * - `preview` Trước action — hiển thị thứ sẽ nhận.
 * - `earned`  Sau action thành công — animation reveal (1.2–2.0s).
 * - `receipt` Lưu trữ vào inventory/badges/shop sau đó (static badge).
 * - `locked`  Chưa đủ điều kiện — không reward amber.
 * - `pending` Đang xử lý — spinner, không reward amber.
 *
 * Validates: Requirement 19.7 (reward state enum discipline)
 */
export const REWARD_STATES = ['preview', 'earned', 'receipt', 'locked', 'pending'] as const

export type RewardState = (typeof REWARD_STATES)[number]

// -----------------------------------------------------------------------------
// Surface_State enumeration
// -----------------------------------------------------------------------------

/**
 * The closed set of states a learner surface may declare a mascot role for.
 * Mirrors design §B.1 exactly. Note: exam `in-progress` is treated as
 * `default` here with role `silent`; the exam-specific timer/no-overlay
 * constraints are enforced by the exam surface (Requirement 10) and by the
 * mascot rule validation in `MascotRoleHost` (task 5.2), not by the config
 * shape.
 *
 * Validates: Requirement 12.2
 */
export const SURFACE_STATES = ['default', 'empty', 'locked', 'error', 'success'] as const

export type SurfaceState = (typeof SURFACE_STATES)[number]

// -----------------------------------------------------------------------------
// Per-surface mascot configuration
// -----------------------------------------------------------------------------

/**
 * Declarative configuration for a single learner surface. A missing state ⇒
 * default role `silent` (Requirement 12.3) — `MascotRoleHost` will not render
 * a mascot for that state.
 */
export interface SurfaceMascotConfig {
    /** Stable surface identifier matching the keys of `SURFACE_MASCOT_CONFIG`. */
    surfaceId: SurfaceId
    /** Optional role override per surface state. Missing entries fall back to `silent`. */
    states: Partial<Record<SurfaceState, MascotRole>>
}

/**
 * The 13 P0 learner surfaces enumerated by design §I plus the
 * `result-reward` ephemeral surface (used by `ResultRewardLoop`). Listed in
 * the order they appear in design §B.1 / §I.
 *
 * Surfaces:
 *  1. dashboard
 *  2. course
 *  3. vocabulary (collection)
 *  4. vocabulary-practice
 *  5. vocabulary-microgames
 *  6. reading
 *  7. listening
 *  8. speaking
 *  9. speaking-roleplay
 * 10. writing
 * 11. review
 * 12. rewards-shop
 * 13. exam
 *
 * Plus the cross-surface `result-reward` overlay (driven by Requirement 7).
 */
export const P0_SURFACE_IDS = [
    'dashboard',
    'course',
    'vocabulary',
    'vocabulary-practice',
    'vocabulary-microgames',
    'reading',
    'listening',
    'speaking',
    'speaking-roleplay',
    'writing',
    'review',
    'rewards-shop',
    'result-reward',
    'exam',
] as const

export type SurfaceId = (typeof P0_SURFACE_IDS)[number]

/**
 * Per-surface mascot role configuration table.
 *
 * Mirrors design §B.1 verbatim. Every P0 surface has at least a `default`
 * entry (Acceptance for task 5.1). Missing states fall back to role `silent`
 * (Requirement 12.3). Rule validation (cheer/guard/silent invariants per
 * Requirements 12.5–12.9) is applied at render time by `MascotRoleHost`.
 *
 * Validates: Requirements 12.2, 12.3
 */
export const SURFACE_MASCOT_CONFIG: Record<SurfaceId, SurfaceMascotConfig> = {
    dashboard: {
        surfaceId: 'dashboard',
        states: { default: 'coach', empty: 'guard', error: 'guard' },
    },
    course: {
        surfaceId: 'course',
        states: { default: 'coach', empty: 'guard', locked: 'guard', error: 'guard' },
    },
    vocabulary: {
        surfaceId: 'vocabulary',
        states: { default: 'companion', empty: 'guard', error: 'guard' },
    },
    'vocabulary-practice': {
        surfaceId: 'vocabulary-practice',
        states: { default: 'companion' },
    },
    'vocabulary-microgames': {
        surfaceId: 'vocabulary-microgames',
        states: { default: 'companion', success: 'cheer' },
    },
    reading: {
        surfaceId: 'reading',
        states: { default: 'coach', empty: 'guard', error: 'guard' },
    },
    listening: {
        surfaceId: 'listening',
        states: { default: 'coach', empty: 'guard', error: 'guard' },
    },
    speaking: {
        surfaceId: 'speaking',
        states: { default: 'coach', empty: 'guard', error: 'guard' },
    },
    'speaking-roleplay': {
        surfaceId: 'speaking-roleplay',
        states: { default: 'companion', error: 'guard' },
    },
    writing: {
        surfaceId: 'writing',
        states: { default: 'coach', empty: 'guard', error: 'guard' },
    },
    review: {
        surfaceId: 'review',
        states: { default: 'coach', empty: 'cheer', error: 'guard' },
    },
    'rewards-shop': {
        surfaceId: 'rewards-shop',
        states: { default: 'companion', empty: 'guard', error: 'guard', success: 'cheer' },
    },
    'result-reward': {
        surfaceId: 'result-reward',
        states: { default: 'cheer', error: 'guard' },
    },
    exam: {
        surfaceId: 'exam',
        // Exam `in-progress` mascot is `silent` — modeled as `default: 'silent'`
        // and enforced by the surface (Requirement 10.1). Error fallback uses
        // `guard` (Requirement 12.7).
        states: { default: 'silent', error: 'guard' },
    },
} as const satisfies Record<SurfaceId, SurfaceMascotConfig>
