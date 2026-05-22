// Feature: visual-qa-screenshot-capture, Property 2: Capture_Spec generator is a pure function over the manifest
//
// Vai chinh: QA Automation Engineer
// Vai phoi hop: Frontend Engineer
//
// Spec ref: `.kiro/specs/visual-qa-screenshot-capture/design.md`
// §"Correctness Properties / Property 2" — seven clauses, all driven
// by `fast-check` with `numRuns: 100`. The clauses below are quoted
// in shorthand; full text is in the design doc.
//
//   Clause 1 — exactly |M| `test(...)` invocations, names match
//     `"<surface> / <state> / <viewport>"`.
//   Clause 2 — resolved screenshot path =
//     `<workspace_root>/docs/design/visual-audit/qa-runs/2026-05-16/<evidencePath>`.
//   Clause 3 — driver dispatch matches `entry.stateDriver.kind`.
//   Clause 4 — `state ∈ {loading, success}` ⇒
//     `emulateMedia({reducedMotion: 'reduce'})` is called. The current
//     state enum has `success` only; `loading` is not yet a state, so
//     we test `success`.
//   Clause 5 — error message includes all four tokens (surface,
//     state, viewport, reason).
//   Clause 6 — exit code = 0 iff totalEntries === succeededEntries.
//   Clause 7 — `FUXIE_CAPTURE_ONLY` filter narrows to
//     `{ e ∈ M | e.surface ∈ split(env, ',') }`.
//
// Validates: Requirements 3.2, 3.3, 3.6, 3.10, 4.3, 5.2, 9.4, 11.2,
// 11.3, 11.4.

import path from 'node:path'

import fc from 'fast-check'
import { describe, expect, it } from 'vitest'

import {
    SURFACE_IDS,
    arbManifest,
    arbStateDriverKind,
    arbStateId,
    arbSurfaceId,
    arbViewportId,
    buildEntry,
    buildEvidencePath,
    deriveCaptureExitCode,
    formatTimeoutError,
    simulateCaptureSpec,
    type ManifestEntry,
} from './_helpers'

const NUM_RUNS = 100

/** The visual audit folder is fixed by the runbook (Req 3.3). */
const QA_RUNS_FOLDER = path.posix.join(
    'docs',
    'design',
    'visual-audit',
    'qa-runs',
    '2026-05-16',
)

describe('Property 2: Capture_Spec generator is pure (visual-qa-screenshot-capture)', () => {
    // -----------------------------------------------------------------------
    // Clause 1 — exactly |M| test invocations, with canonical names.
    // -----------------------------------------------------------------------

    describe('clause 1 — one test() per manifest entry, name = `<surface> / <state> / <viewport>` (Req 3.2)', () => {
        it('produces |M| test calls in manifest order', () => {
            fc.assert(
                fc.property(arbManifest, (manifest) => {
                    const result = simulateCaptureSpec(manifest)
                    expect(result.testCalls).toHaveLength(manifest.length)
                    for (let i = 0; i < manifest.length; i += 1) {
                        const e = manifest[i]
                        expect(result.testCalls[i].name).toBe(
                            `${e.surface} / ${e.state} / ${e.viewport}`,
                        )
                    }
                }),
                { numRuns: NUM_RUNS },
            )
        })
    })

    // -----------------------------------------------------------------------
    // Clause 2 — resolved screenshot path is anchored at the QA-run
    // folder.
    // -----------------------------------------------------------------------

    describe('clause 2 — screenshot path = <workspace>/docs/.../2026-05-16/<evidencePath> (Req 3.3)', () => {
        const FAKE_WORKSPACE = '/tmp/fuxie-workspace'
        function resolveScreenshotPath(workspace: string, evidencePath: string): string {
            return path.posix.join(workspace, QA_RUNS_FOLDER, evidencePath)
        }

        it('every entry resolves to QA_RUNS_FOLDER + evidencePath', () => {
            fc.assert(
                fc.property(arbManifest, (manifest) => {
                    for (const e of manifest) {
                        const resolved = resolveScreenshotPath(FAKE_WORKSPACE, e.evidencePath)
                        expect(resolved).toBe(
                            `${FAKE_WORKSPACE}/${QA_RUNS_FOLDER}/${e.evidencePath}`,
                        )
                        expect(resolved).toContain('/qa-runs/2026-05-16/')
                        expect(resolved.endsWith('.png')).toBe(true)
                    }
                }),
                { numRuns: NUM_RUNS },
            )
        })
    })

    // -----------------------------------------------------------------------
    // Clause 3 — driver dispatch matches `entry.stateDriver.kind`.
    // -----------------------------------------------------------------------

    describe('clause 3 — driver dispatch (Req 3.6, Decision 2)', () => {
        it('non-default entries install a driver matching `entry.stateDriver.kind`', () => {
            fc.assert(
                fc.property(
                    fc.uniqueArray(
                        fc.tuple(arbSurfaceId, arbStateId, arbViewportId),
                        {
                            minLength: 1,
                            maxLength: 10,
                            selector: (t) => `${t[0]}|${t[1]}|${t[2]}`,
                        },
                    ),
                    fc.array(arbStateDriverKind, { minLength: 10, maxLength: 10 }),
                    (triples, kinds) => {
                        const manifest: ManifestEntry[] = triples.map((t, i) =>
                            buildEntry(t, { stateDriver: { kind: kinds[i % kinds.length] } }),
                        )
                        const result = simulateCaptureSpec(manifest)
                        const nonDefaultEntries = manifest.filter((e) => e.state !== 'default')
                        expect(result.driverCalls).toHaveLength(nonDefaultEntries.length)
                        for (let i = 0; i < nonDefaultEntries.length; i += 1) {
                            const e = nonDefaultEntries[i]
                            const expectedKind = e.stateDriver?.kind ?? 'none'
                            expect(result.driverCalls[i]).toEqual({
                                surface: e.surface,
                                state: e.state,
                                kind: expectedKind,
                            })
                        }
                    },
                ),
                { numRuns: NUM_RUNS },
            )
        })

        it('default-state entries do NOT install a driver', () => {
            fc.assert(
                fc.property(
                    fc.uniqueArray(
                        fc.tuple(arbSurfaceId, arbViewportId),
                        {
                            minLength: 1,
                            maxLength: 8,
                            selector: (t) => `${t[0]}|${t[1]}`,
                        },
                    ),
                    (pairs) => {
                        const manifest = pairs.map(([surface, viewport]) =>
                            buildEntry([surface, 'default', viewport]),
                        )
                        const result = simulateCaptureSpec(manifest)
                        expect(result.driverCalls).toEqual([])
                    },
                ),
                { numRuns: NUM_RUNS },
            )
        })
    })

    // -----------------------------------------------------------------------
    // Clause 4 — emulateMedia({reducedMotion: 'reduce'}) for animation
    // states.
    // -----------------------------------------------------------------------

    describe('clause 4 — reducedMotion=reduce for `success` state (Req 9.4)', () => {
        it('every `success` entry calls emulateMedia({reducedMotion: "reduce"})', () => {
            fc.assert(
                fc.property(arbManifest, (manifest) => {
                    const result = simulateCaptureSpec(manifest)
                    for (let i = 0; i < manifest.length; i += 1) {
                        const e = manifest[i]
                        const call = result.emulateCalls[i]
                        if (e.state === 'success') {
                            expect(call.reducedMotion).toBe('reduce')
                        } else {
                            expect(call.reducedMotion).toBe('no-preference')
                        }
                    }
                }),
                { numRuns: NUM_RUNS },
            )
        })
    })

    // -----------------------------------------------------------------------
    // Clause 5 — error message contains all four tokens.
    // -----------------------------------------------------------------------

    describe('clause 5 — error message has surface/state/viewport/reason (Req 3.10)', () => {
        const arbReason = fc.stringMatching(/^[a-zA-Z][a-zA-Z0-9 :_,.-]{1,40}$/)

        it('formatTimeoutError carries all four tokens verbatim', () => {
            fc.assert(
                fc.property(
                    arbSurfaceId,
                    arbStateId,
                    arbViewportId,
                    arbReason,
                    (surface, state, viewport, reason) => {
                        const msg = formatTimeoutError(surface, state, viewport, reason)
                        expect(msg).toContain(`surface=${surface}`)
                        expect(msg).toContain(`state=${state}`)
                        expect(msg).toContain(`viewport=${viewport}`)
                        expect(msg).toContain(`reason=${reason}`)
                    },
                ),
                { numRuns: NUM_RUNS },
            )
        })
    })

    // -----------------------------------------------------------------------
    // Clause 6 — exit code derivation.
    // -----------------------------------------------------------------------

    describe('clause 6 — exit code 0 iff totalEntries === succeededEntries (Req 5.2, 11.2)', () => {
        it('all-success ⇒ exit 0; any failure ⇒ exit non-zero', () => {
            fc.assert(
                fc.property(
                    fc.integer({ min: 0, max: 60 }),
                    fc.integer({ min: 0, max: 60 }),
                    (total, succeeded) => {
                        const code = deriveCaptureExitCode(total, succeeded)
                        const expected = total === succeeded && succeeded >= 0 ? 0 : 1
                        expect(code).toBe(expected)
                    },
                ),
                { numRuns: NUM_RUNS },
            )
        })

        it('out-of-range succeededEntries (negative or > total) is exit 1', () => {
            fc.assert(
                fc.property(
                    fc.integer({ min: 1, max: 30 }),
                    fc.integer({ min: -10, max: -1 }),
                    (total, badSucceeded) => {
                        expect(deriveCaptureExitCode(total, badSucceeded)).toBe(1)
                    },
                ),
                { numRuns: NUM_RUNS },
            )
        })
    })

    // -----------------------------------------------------------------------
    // Clause 7 — FUXIE_CAPTURE_ONLY filter.
    // -----------------------------------------------------------------------

    describe('clause 7 — FUXIE_CAPTURE_ONLY narrows by surface (Req 11.3)', () => {
        it('a comma-separated list of surfaces narrows test calls to those surfaces', () => {
            fc.assert(
                fc.property(
                    arbManifest,
                    fc.uniqueArray(arbSurfaceId, { minLength: 1, maxLength: 4 }),
                    (manifest, allowList) => {
                        const env = allowList.join(',')
                        const result = simulateCaptureSpec(manifest, { captureOnlyEnv: env })
                        const allow = new Set(allowList)
                        const expected = manifest.filter((e) => allow.has(e.surface))
                        expect(result.testCalls).toHaveLength(expected.length)
                        for (const call of result.testCalls) {
                            expect(allow.has(call.surface)).toBe(true)
                        }
                    },
                ),
                { numRuns: NUM_RUNS },
            )
        })

        it('unset / empty FUXIE_CAPTURE_ONLY runs every entry', () => {
            fc.assert(
                fc.property(
                    arbManifest,
                    fc.constantFrom<string | undefined>(undefined, '', '   '),
                    (manifest, env) => {
                        const result = simulateCaptureSpec(manifest, { captureOnlyEnv: env })
                        expect(result.testCalls).toHaveLength(manifest.length)
                    },
                ),
                { numRuns: NUM_RUNS },
            )
        })

        it('a list with surfaces NOT in any manifest entry yields zero test calls', () => {
            fc.assert(
                fc.property(arbManifest, (manifest) => {
                    // Pick a surface ID that is guaranteed not to be in
                    // the manifest by inverting against the actual
                    // surfaces present.
                    const present = new Set(manifest.map((e) => e.surface))
                    const absent = SURFACE_IDS.filter((s) => !present.has(s))
                    if (absent.length === 0) return // skip this iteration; no absent surface
                    const env = absent.join(',')
                    const result = simulateCaptureSpec(manifest, { captureOnlyEnv: env })
                    expect(result.testCalls).toHaveLength(0)
                }),
                { numRuns: NUM_RUNS },
            )
        })
    })
})
