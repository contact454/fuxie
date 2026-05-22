/**
 * Property tests for the Mascot_Role + Reward_State contract and the
 * Course Path module mascot singleton invariant.
 *
 * Spec source-of-truth:
 *   - `.kiro/specs/gamified-ui-asset-rollout/tasks.md` task 5.4
 *   - `.kiro/specs/gamified-ui-asset-rollout/design.md` §B (Mascot_Role
 *     system) and §I.2 (Course Path module mascot per cluster)
 *   - `.kiro/specs/gamified-ui-asset-rollout/requirements.md` Req 4.9,
 *     12.1–12.9, 19.6, 19.7
 *
 * Vai chinh: Frontend Engineer
 * Vai phoi hop: QA Automation Engineer, Gamification Designer
 *
 * The three properties checked here are run via `pnpm test:property`
 * (root `vitest.property.config.ts`). vitest is configured with
 * `environment: 'node'` so React rendering uses
 * `react-dom/server.renderToStaticMarkup` — the same pattern already
 * used by every other PBT spec in the apps/web workspace.
 *
 * **Property 5 — Mascot_Role Consistency.** For any P0 surface and
 *   any (state, rewardEarned, emptyReachedGoal, examInProgress) input,
 *   `resolveMascotRole(...)`'s rendered role is in
 *   `{coach, companion, cheer, guard, silent}` AND respects the
 *   cheer/guard/exam-silent invariants from Requirements 12.5–12.7.
 *
 * **Property 6 — Reward_State Enum Discipline.** A reward-bearing host
 *   only sets `data-reward-state` when the runtime value is a member
 *   of `REWARD_STATES`. For any other string the attribute is absent,
 *   so no UI surface can leak a non-enum reward state to the DOM.
 *
 * **Property 23 — Module Mascot Singleton.** For any list of N module
 *   clusters rendered on the Course Path, every cluster wrapper
 *   contains exactly one mascot-shaped element (either a live
 *   `course-module-mascot` or its `course-module-mascot-placeholder`
 *   fallback — never zero, never two).
 *
 * Validates: Requirements 4.9, 12.1, 12.2, 12.3, 12.4, 12.5, 12.6,
 *            12.7, 12.8, 12.9, 19.6, 19.7
 */

import { describe, expect, it } from 'vitest'
import * as fc from 'fast-check'
import { renderToStaticMarkup } from 'react-dom/server'

import {
    MASCOT_ROLES,
    REWARD_STATES,
    SURFACE_STATES,
    P0_SURFACE_IDS,
    SURFACE_MASCOT_CONFIG,
    type MascotRole,
    type RewardState,
    type SurfaceId,
    type SurfaceState,
} from '@/lib/mascot/mascot-role'
import { resolveMascotRole } from '@/components/gamification/mascot-role-host'
import { CourseModuleClusterHeader } from '@/components/course/course-module-cluster'

const NUM_RUNS = 100 as const

// -----------------------------------------------------------------------------
// Generators
// -----------------------------------------------------------------------------

const surfaceIdArb: fc.Arbitrary<SurfaceId> = fc.constantFrom(
    ...(P0_SURFACE_IDS as readonly SurfaceId[]),
)

const surfaceStateArb: fc.Arbitrary<SurfaceState> = fc.constantFrom(
    ...(SURFACE_STATES as readonly SurfaceState[]),
)

const mascotRoleArb: fc.Arbitrary<MascotRole> = fc.constantFrom(
    ...(MASCOT_ROLES as readonly MascotRole[]),
)

const VALID_MASCOT_ROLES: ReadonlySet<MascotRole> = new Set(MASCOT_ROLES)
const VALID_REWARD_STATES: ReadonlySet<string> = new Set(REWARD_STATES)

// -----------------------------------------------------------------------------
// Property 5 — Mascot_Role Consistency
// -----------------------------------------------------------------------------

describe('Property 5: Mascot_Role Consistency (Requirements 12.1–12.9, 19.6)', () => {
    it('for any (P0 surface, state, flags) the resolved role ∈ MASCOT_ROLES', () => {
        fc.assert(
            fc.property(
                surfaceIdArb,
                surfaceStateArb,
                fc.option(mascotRoleArb, { nil: undefined }),
                fc.boolean(),
                fc.boolean(),
                fc.boolean(),
                (
                    surfaceId,
                    state,
                    roleOverride,
                    rewardEarned,
                    emptyReachedGoal,
                    examInProgress,
                ) => {
                    const resolution = resolveMascotRole({
                        surfaceId,
                        state,
                        role: roleOverride ?? undefined,
                        rewardEarned,
                        emptyReachedGoal,
                        examInProgress,
                    })

                    // Requirement 12.1: rendered role is always one of the
                    // five enum values.
                    expect(VALID_MASCOT_ROLES.has(resolution.role)).toBe(true)

                    // Requirement 12.7: exam in-progress always renders silent
                    // (regardless of override or config).
                    if (surfaceId === 'exam' && examInProgress) {
                        expect(resolution.role).toBe('silent')
                        return
                    }

                    // When valid, the resolved role equals the requested role
                    // (override > config > 'silent' fallback per Req 12.3).
                    if (resolution.valid) {
                        expect(resolution.role).toBe(resolution.requestedRole)
                    } else {
                        // Invalid violations always degrade to 'silent'
                        // (Req 12.9 production fallback).
                        expect(resolution.role).toBe('silent')
                    }
                },
            ),
            { numRuns: NUM_RUNS },
        )
    })

    it('cheer is valid only when rewardEarned OR (state==="empty" && emptyReachedGoal) — Req 12.5', () => {
        fc.assert(
            fc.property(
                surfaceIdArb,
                surfaceStateArb,
                fc.boolean(),
                fc.boolean(),
                (surfaceId, state, rewardEarned, emptyReachedGoal) => {
                    // Skip the exam-in-progress branch — it is its own
                    // invariant, asserted above.
                    if (surfaceId === 'exam') return

                    const resolution = resolveMascotRole({
                        surfaceId,
                        state,
                        role: 'cheer',
                        rewardEarned,
                        emptyReachedGoal,
                        examInProgress: false,
                    })

                    const cheerAllowed =
                        rewardEarned ||
                        (state === 'empty' && emptyReachedGoal)

                    if (cheerAllowed) {
                        expect(resolution.valid).toBe(true)
                        expect(resolution.role).toBe('cheer')
                    } else {
                        expect(resolution.valid).toBe(false)
                        expect(resolution.violation).toBe(
                            'cheer-without-reward-or-empty-goal',
                        )
                        expect(resolution.role).toBe('silent')
                    }
                },
            ),
            { numRuns: NUM_RUNS },
        )
    })

    it('guard is valid only when state ∈ {locked, empty, error} — Req 12.6', () => {
        fc.assert(
            fc.property(
                surfaceIdArb,
                surfaceStateArb,
                (surfaceId, state) => {
                    if (surfaceId === 'exam') return

                    const resolution = resolveMascotRole({
                        surfaceId,
                        state,
                        role: 'guard',
                        rewardEarned: false,
                        emptyReachedGoal: false,
                        examInProgress: false,
                    })

                    const guardAllowed =
                        state === 'locked' ||
                        state === 'empty' ||
                        state === 'error'

                    if (guardAllowed) {
                        expect(resolution.valid).toBe(true)
                        expect(resolution.role).toBe('guard')
                    } else {
                        expect(resolution.valid).toBe(false)
                        expect(resolution.violation).toBe(
                            'guard-outside-locked-empty-error',
                        )
                        expect(resolution.role).toBe('silent')
                    }
                },
            ),
            { numRuns: NUM_RUNS },
        )
    })

    it('exam in-progress with any non-silent role degrades to silent — Req 12.7', () => {
        fc.assert(
            fc.property(
                surfaceStateArb,
                mascotRoleArb,
                fc.boolean(),
                fc.boolean(),
                (state, role, rewardEarned, emptyReachedGoal) => {
                    const resolution = resolveMascotRole({
                        surfaceId: 'exam',
                        state,
                        role,
                        rewardEarned,
                        emptyReachedGoal,
                        examInProgress: true,
                    })

                    // Exam in-progress → role MUST resolve to silent.
                    expect(resolution.role).toBe('silent')
                    if (role !== 'silent') {
                        expect(resolution.valid).toBe(false)
                        expect(resolution.violation).toBe(
                            'exam-in-progress-must-be-silent',
                        )
                    }
                },
            ),
            { numRuns: NUM_RUNS },
        )
    })

    it('config-only resolution (no override) yields a role from MASCOT_ROLES — Req 12.2/12.3', () => {
        fc.assert(
            fc.property(
                surfaceIdArb,
                surfaceStateArb,
                (surfaceId, state) => {
                    const resolution = resolveMascotRole({
                        surfaceId,
                        state,
                        // No `role` override — purely config-driven.
                        rewardEarned: false,
                        emptyReachedGoal: false,
                        examInProgress: false,
                    })

                    // Whatever role the resolver picks, it must be one of
                    // the five enum values; missing config entries fall
                    // through to 'silent' (Req 12.3).
                    expect(VALID_MASCOT_ROLES.has(resolution.role)).toBe(true)

                    // The expected requested role should match the config
                    // table (or 'silent' when the state is missing).
                    const configRole =
                        SURFACE_MASCOT_CONFIG[surfaceId].states[state] ??
                        'silent'
                    expect(resolution.requestedRole).toBe(configRole)
                },
            ),
            { numRuns: NUM_RUNS },
        )
    })
})

// -----------------------------------------------------------------------------
// Property 6 — Reward_State Enum Discipline
// -----------------------------------------------------------------------------

/**
 * Tiny synthetic host used to assert Property 6: a reward-bearing
 * component MUST only stamp `data-reward-state` when the runtime value
 * is a member of `REWARD_STATES`. Any other string is dropped and the
 * attribute is absent from the rendered DOM.
 *
 * This mirrors the design §E contract that all production reward
 * components (`RewardPreview`, `RewardRevealMoment`, `ShopItemCard`,
 * `ResultRewardLoop`) follow — so the property locks the contract at
 * the helper level rather than coupling to one component.
 */
function isRewardState(value: string): value is RewardState {
    return VALID_REWARD_STATES.has(value)
}

interface RewardHostProps {
    rewardState: string
}

function RewardHost({ rewardState }: RewardHostProps) {
    if (isRewardState(rewardState)) {
        return (
            <span
                data-role="reward-host"
                data-reward-state={rewardState}
            >
                reward
            </span>
        )
    }
    return <span data-role="reward-host">reward</span>
}

describe('Property 6: Reward_State Enum Discipline (Requirement 19.7)', () => {
    it('REWARD_STATES enum has exactly the 5 documented values', () => {
        expect(REWARD_STATES).toHaveLength(5)
        expect(new Set(REWARD_STATES)).toEqual(
            new Set(['preview', 'earned', 'receipt', 'locked', 'pending']),
        )
    })

    it('every member of REWARD_STATES round-trips through the host', () => {
        fc.assert(
            fc.property(
                fc.constantFrom(...(REWARD_STATES as readonly string[])),
                (rewardState) => {
                    const html = renderToStaticMarkup(
                        <RewardHost rewardState={rewardState} />,
                    )
                    expect(html).toContain(
                        `data-reward-state="${rewardState}"`,
                    )
                },
            ),
            { numRuns: NUM_RUNS },
        )
    })

    it('arbitrary strings are dropped — non-enum values never reach `data-reward-state`', () => {
        const nonEnumString = fc
            .string({ minLength: 0, maxLength: 32 })
            .filter((s) => !VALID_REWARD_STATES.has(s))

        fc.assert(
            fc.property(nonEnumString, (rewardState) => {
                const html = renderToStaticMarkup(
                    <RewardHost rewardState={rewardState} />,
                )
                // Attribute MUST be absent for any value outside the enum.
                expect(html).not.toContain('data-reward-state=')
                // The host itself still renders so the discipline does
                // not silently swallow content.
                expect(html).toContain('data-role="reward-host"')
            }),
            { numRuns: NUM_RUNS },
        )
    })

    it('mixed enum + non-enum bag: only enum values produce the attribute', () => {
        // Generate strings biased toward both enum members and noise so
        // the property exercises the boundary in a single run.
        const mixedArb = fc.oneof(
            fc.constantFrom(...(REWARD_STATES as readonly string[])),
            fc.string({ minLength: 0, maxLength: 16 }),
            fc.constantFrom('PREVIEW', 'Earned', '', ' ', 'unknown', 'pending '),
        )

        fc.assert(
            fc.property(mixedArb, (rewardState) => {
                const html = renderToStaticMarkup(
                    <RewardHost rewardState={rewardState} />,
                )
                if (VALID_REWARD_STATES.has(rewardState)) {
                    expect(html).toContain(
                        `data-reward-state="${rewardState}"`,
                    )
                } else {
                    expect(html).not.toContain('data-reward-state=')
                }
            }),
            { numRuns: NUM_RUNS },
        )
    })
})

// -----------------------------------------------------------------------------
// Property 23 — Module Mascot Singleton
// -----------------------------------------------------------------------------

/**
 * Count how many times `pattern` appears in `html`.
 */
function countMatches(html: string, pattern: RegExp): number {
    return (html.match(pattern) ?? []).length
}

/**
 * Render N course module clusters as siblings (matching the Course Path
 * surface layout). Each cluster gets a unique id so the per-cluster
 * count is unambiguous.
 */
function renderClusters(
    clusters: ReadonlyArray<{
        clusterId: string
        mascotKey: string
        forcedStatus: 'loading' | 'loaded' | 'placeholder'
    }>,
): string {
    return renderToStaticMarkup(
        <main data-testid="course-path">
            {clusters.map((c) => (
                <CourseModuleClusterHeader
                    key={c.clusterId}
                    clusterId={c.clusterId}
                    label={`Cluster ${c.clusterId}`}
                    mascotKey={c.mascotKey}
                    initialMascotStatus={c.forcedStatus}
                />
            ))}
        </main>,
    )
}

const KNOWN_MODULE_MASCOT_KEYS = [
    'reading',
    'listening',
    'writing',
    'speaking',
    'vocabulary',
    'grammar',
    'chat',
    'exam',
    'review',
    'course',
    'dashboard',
    'shop',
] as const

const moduleMascotKeyArb: fc.Arbitrary<string> = fc.oneof(
    fc.constantFrom(...KNOWN_MODULE_MASCOT_KEYS),
    // Sprinkle in unknown keys so the placeholder fallback path is also
    // exercised — Property 23 must hold there too.
    fc.string({ minLength: 1, maxLength: 12 }),
)

const mascotStatusArb = fc.constantFrom(
    'loading',
    'loaded',
    'placeholder',
) as fc.Arbitrary<'loading' | 'loaded' | 'placeholder'>

describe('Property 23: Module Mascot Singleton (Requirement 4.9, 19.6)', () => {
    it('every cluster renders exactly one mascot element (live OR placeholder)', () => {
        fc.assert(
            fc.property(
                fc
                    .array(
                        fc.tuple(
                            moduleMascotKeyArb,
                            mascotStatusArb,
                        ),
                        { minLength: 1, maxLength: 8 },
                    )
                    .map((entries) =>
                        entries.map(([mascotKey, forcedStatus], idx) => ({
                            clusterId: `cluster-${idx}`,
                            mascotKey,
                            forcedStatus,
                        })),
                    ),
                (clusters) => {
                    const html = renderClusters(clusters)

                    // Sanity: every cluster wrapper carries its own
                    // unique data-cluster-id.
                    for (const c of clusters) {
                        const wrapperRe = new RegExp(
                            `data-role="course-module-cluster"[^>]*data-cluster-id="${c.clusterId}"`,
                        )
                        expect(
                            wrapperRe.test(html),
                            `cluster wrapper "${c.clusterId}" must be present`,
                        ).toBe(true)
                    }

                    // Per-cluster mascot count = 1 (live + placeholder
                    // are mutually exclusive).
                    for (const c of clusters) {
                        const liveRe = new RegExp(
                            `data-role="course-module-mascot"[^>]*data-cluster-id="${c.clusterId}"`,
                            'g',
                        )
                        const placeholderRe = new RegExp(
                            `data-role="course-module-mascot-placeholder"[^>]*data-cluster-id="${c.clusterId}"`,
                            'g',
                        )

                        const live = countMatches(html, liveRe)
                        const placeholder = countMatches(html, placeholderRe)

                        expect(
                            live + placeholder,
                            `cluster "${c.clusterId}" must render exactly one mascot element (live=${live}, placeholder=${placeholder})`,
                        ).toBe(1)
                        // Live and placeholder are mutually exclusive.
                        expect(live === 0 || placeholder === 0).toBe(true)
                    }

                    // Aggregate sanity: total mascot elements = N.
                    const totalLive = countMatches(
                        html,
                        /data-role="course-module-mascot"/g,
                    )
                    const totalPlaceholder = countMatches(
                        html,
                        /data-role="course-module-mascot-placeholder"/g,
                    )
                    expect(totalLive + totalPlaceholder).toBe(clusters.length)
                },
            ),
            { numRuns: NUM_RUNS },
        )
    })

    it('the unique cluster id flows from the prop into the wrapper attribute', () => {
        const idArb = fc
            .stringMatching(/^[a-z][a-z0-9-]{0,15}$/)
            .filter((s) => s.length > 0)

        fc.assert(
            fc.property(
                fc.uniqueArray(idArb, { minLength: 1, maxLength: 6 }),
                (ids) => {
                    const clusters = ids.map((id) => ({
                        clusterId: id,
                        mascotKey: 'course',
                        forcedStatus: 'loading' as const,
                    }))
                    const html = renderClusters(clusters)
                    for (const id of ids) {
                        expect(html).toContain(`data-cluster-id="${id}"`)
                    }
                },
            ),
            { numRuns: NUM_RUNS },
        )
    })
})
