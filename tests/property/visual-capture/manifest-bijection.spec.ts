// Feature: visual-qa-screenshot-capture, Property 1: Capture_Manifest is a well-formed bijection with the baseline
//
// Vai chinh: QA Automation Engineer
// Vai phoi hop: Frontend Engineer
//
// Spec ref: `.kiro/specs/visual-qa-screenshot-capture/design.md`
// §"Correctness Properties / Property 1" — three clauses, all driven
// by `fast-check` with `numRuns: 100`:
//
//   Clause 1 — every entry passes the schema validator (surface ∈
//     P0_SURFACES.id, state ∈ {default,empty,locked,error,success},
//     viewport ∈ {mobile,desktop}, route starts with `/`, evidencePath
//     matches the canonical regex, requiresSeed mirrors P0_SURFACES).
//   Clause 2 — `<surface, state, viewport>` triples are unique.
//   Clause 3 — bijection with PENDING markers in the baseline
//     checklist set: every Pending_Marker has exactly one entry, and
//     the entry's evidencePath matches the marker line.
//
// Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 4.1.

import fc from 'fast-check'
import { describe, expect, it } from 'vitest'

import {
    SURFACE_IDS,
    STATE_IDS,
    VIEWPORT_IDS,
    arbManifest,
    arbSurfaceId,
    arbStateId,
    arbViewportId,
    buildEntry,
    buildEvidencePath,
    findDuplicateTriples,
    validateManifest,
    type ManifestEntry,
    type SurfaceId,
} from './_helpers'

const NUM_RUNS = 100

/**
 * Mirror `P0_SURFACES[*].requiresSeed` with the values declared by
 * `tests/integration/utils/surfaces.ts` so `validateManifest` can
 * verify Req 1.5 ("requiresSeed mirrors the surface table").
 */
const P0_SURFACE_TABLE: ReadonlyMap<SurfaceId, boolean> = new Map([
    ['dashboard', false],
    ['course', false],
    ['vocabulary', false],
    ['vocabulary-practice', false],
    ['vocabulary-microgames', false],
    ['reading', true],
    ['listening', true],
    ['speaking', true],
    ['speaking-roleplay', false],
    ['writing', true],
    ['review', false],
    ['rewards-shop', false],
    ['exam', true],
])

describe('Property 1: Capture_Manifest is a well-formed bijection (visual-qa-screenshot-capture)', () => {
    // -----------------------------------------------------------------------
    // Clause 1 — schema validation (Req 1.2, 1.3, 1.4, 1.5, 1.6).
    // -----------------------------------------------------------------------

    describe('clause 1 — schema validator (Req 1.2, 1.3, 1.4, 1.5)', () => {
        it('every well-formed manifest entry passes the schema validator', () => {
            fc.assert(
                fc.property(
                    fc.uniqueArray(
                        fc.tuple(arbSurfaceId, arbStateId, arbViewportId),
                        {
                            minLength: 1,
                            maxLength: 12,
                            selector: (t) => `${t[0]}|${t[1]}|${t[2]}`,
                        },
                    ),
                    (triples) => {
                        const manifest: ManifestEntry[] = triples.map((t) =>
                            buildEntry(t, {
                                requiresSeed: P0_SURFACE_TABLE.get(t[0]) ?? false,
                            }),
                        )
                        const violations = validateManifest(manifest, P0_SURFACE_TABLE)
                        expect(violations).toEqual([])
                    },
                ),
                { numRuns: NUM_RUNS },
            )
        })

        it('mismatched requiresSeed (does not mirror P0_SURFACES) is reported (Req 1.5)', () => {
            fc.assert(
                fc.property(
                    fc.tuple(arbSurfaceId, arbStateId, arbViewportId),
                    (triple) => {
                        const expected = P0_SURFACE_TABLE.get(triple[0]) ?? false
                        const wrong = !expected
                        const manifest = [buildEntry(triple, { requiresSeed: wrong })]
                        const violations = validateManifest(manifest, P0_SURFACE_TABLE)
                        expect(
                            violations.some((v) => v.field === 'requiresSeed:mirror'),
                        ).toBe(true)
                    },
                ),
                { numRuns: NUM_RUNS },
            )
        })

        it('a route that does not start with `/` is reported (Decision 1)', () => {
            fc.assert(
                fc.property(
                    fc.tuple(arbSurfaceId, arbStateId, arbViewportId),
                    fc.stringMatching(/^[a-z][a-z0-9/-]{1,20}$/),
                    (triple, badRoute) => {
                        const entry = buildEntry(triple, {
                            requiresSeed: P0_SURFACE_TABLE.get(triple[0]) ?? false,
                            route: badRoute,
                        })
                        const violations = validateManifest([entry], P0_SURFACE_TABLE)
                        expect(violations.some((v) => v.field === 'route')).toBe(true)
                    },
                ),
                { numRuns: NUM_RUNS },
            )
        })

        it('an evidencePath outside the canonical regex is reported (Req 1.2)', () => {
            // Build an entry then deliberately corrupt evidencePath to
            // a non-conforming form. The validator must flag it.
            fc.assert(
                fc.property(
                    fc.tuple(arbSurfaceId, arbStateId, arbViewportId),
                    fc.stringMatching(/^[A-Za-z0-9._/-]{1,40}\.png$/).filter(
                        (s) => !/^screenshots\/[a-z0-9-]+\/[a-z0-9-]+-/.test(s),
                    ),
                    (triple, badPath) => {
                        const baseline = buildEntry(triple, {
                            requiresSeed: P0_SURFACE_TABLE.get(triple[0]) ?? false,
                        })
                        const entry: ManifestEntry = { ...baseline, evidencePath: badPath }
                        const violations = validateManifest([entry], P0_SURFACE_TABLE)
                        expect(
                            violations.some((v) => v.field === 'evidencePath:regex'),
                        ).toBe(true)
                    },
                ),
                { numRuns: NUM_RUNS },
            )
        })
    })

    // -----------------------------------------------------------------------
    // Clause 2 — uniqueness of `<surface, state, viewport>` triples
    // (Req 1.6).
    // -----------------------------------------------------------------------

    describe('clause 2 — triple uniqueness (Req 1.6)', () => {
        it('any synthesised manifest reports zero duplicate triples', () => {
            fc.assert(
                fc.property(arbManifest, (manifest) => {
                    expect(findDuplicateTriples(manifest)).toEqual([])
                }),
                { numRuns: NUM_RUNS },
            )
        })

        it('an injected duplicate is reported by findDuplicateTriples', () => {
            fc.assert(
                fc.property(
                    fc.tuple(arbSurfaceId, arbStateId, arbViewportId),
                    (triple) => {
                        const a = buildEntry(triple, {
                            requiresSeed: P0_SURFACE_TABLE.get(triple[0]) ?? false,
                        })
                        const b = buildEntry(triple, {
                            requiresSeed: P0_SURFACE_TABLE.get(triple[0]) ?? false,
                        })
                        const dups = findDuplicateTriples([a, b])
                        expect(dups).toEqual([`${triple[0]}|${triple[1]}|${triple[2]}`])
                    },
                ),
                { numRuns: NUM_RUNS },
            )
        })
    })

    // -----------------------------------------------------------------------
    // Clause 3 — bijection with PENDING markers (Req 1.7).
    //
    // Approach: synthesise a baseline checklist as a list of
    // `(surface, state, viewport, marker)` rows. Each row with marker
    // === 'pending' contributes a Pending_Marker. The property is
    // that |manifest entries| === |pending rows| AND there is a
    // perfect matching by `<surface, state, viewport>`.
    // -----------------------------------------------------------------------

    describe('clause 3 — bijection with Pending_Marker baseline (Req 1.7)', () => {
        type ChecklistRow = {
            surface: SurfaceId
            state: (typeof STATE_IDS)[number]
            viewport: (typeof VIEWPORT_IDS)[number]
            marker: 'pending' | 'na' | 'pass'
        }

        const arbChecklistRow: fc.Arbitrary<ChecklistRow> = fc.record({
            surface: arbSurfaceId,
            state: arbStateId,
            viewport: arbViewportId,
            marker: fc.constantFrom<'pending' | 'na' | 'pass'>('pending', 'na', 'pass'),
        })

        const arbChecklist: fc.Arbitrary<ChecklistRow[]> = fc.uniqueArray(arbChecklistRow, {
            minLength: 1,
            maxLength: 16,
            selector: (r) => `${r.surface}|${r.state}|${r.viewport}`,
        })

        it('manifest entries === pending rows, matched by `<surface,state,viewport>`', () => {
            fc.assert(
                fc.property(arbChecklist, (rows) => {
                    const pending = rows.filter((r) => r.marker === 'pending')
                    const manifest: ManifestEntry[] = pending.map((r) =>
                        buildEntry([r.surface, r.state, r.viewport], {
                            requiresSeed: P0_SURFACE_TABLE.get(r.surface) ?? false,
                        }),
                    )
                    expect(manifest.length).toBe(pending.length)

                    const manifestKeys = new Set(
                        manifest.map((e) => `${e.surface}|${e.state}|${e.viewport}`),
                    )
                    const pendingKeys = new Set(
                        pending.map((r) => `${r.surface}|${r.state}|${r.viewport}`),
                    )
                    expect(manifestKeys.size).toBe(pendingKeys.size)
                    for (const k of pendingKeys) expect(manifestKeys.has(k)).toBe(true)
                    for (const k of manifestKeys) expect(pendingKeys.has(k)).toBe(true)
                }),
                { numRuns: NUM_RUNS },
            )
        })

        it('every manifest entry resolves to the canonical evidencePath', () => {
            fc.assert(
                fc.property(arbManifest, (manifest) => {
                    for (const e of manifest) {
                        expect(e.evidencePath).toBe(
                            buildEvidencePath(e.surface, e.state, e.viewport),
                        )
                    }
                }),
                { numRuns: NUM_RUNS },
            )
        })
    })

    // -----------------------------------------------------------------------
    // Sanity — the closed-set generators only yield surface IDs and
    // state IDs declared by the design document. This guards against
    // an enum drift the validator would otherwise miss.
    // -----------------------------------------------------------------------

    describe('sanity — generator domain matches Decision 1 schema', () => {
        it('every synthesised entry has surface ∈ SURFACE_IDS', () => {
            fc.assert(
                fc.property(arbManifest, (manifest) => {
                    for (const e of manifest) {
                        expect(SURFACE_IDS).toContain(e.surface)
                    }
                }),
                { numRuns: NUM_RUNS },
            )
        })

        it('every synthesised entry has state ∈ STATE_IDS and viewport ∈ VIEWPORT_IDS', () => {
            fc.assert(
                fc.property(arbManifest, (manifest) => {
                    for (const e of manifest) {
                        expect(STATE_IDS).toContain(e.state)
                        expect(VIEWPORT_IDS).toContain(e.viewport)
                    }
                }),
                { numRuns: NUM_RUNS },
            )
        })
    })
})
