// Feature: visual-qa-screenshot-capture, Property 3 (clauses 3 + 4): Post-capture marker flip
//
// Vai chinh: QA Automation Engineer
// Vai phoi hop: Project Manager / Delivery Manager
//
// Spec ref: `.kiro/specs/visual-qa-screenshot-capture/design.md`
// §"Correctness Properties / Property 3" clauses 3 + 4 (the
// filesystem-bijection clauses 1 + 2 live in `png-bijection.spec.ts`).
//
//   Clause 3 — for every line that contained both an evidencePath and
//     `(PENDING capture)`, post-flip the line contains the same
//     evidencePath byte-for-byte followed by `(PASS — captured
//     <date>)`. The short PENDING form `(PENDING)` flips identically.
//   Clause 4 — lines marked `n/a (...)` are byte-identical post-flip;
//     lines without any PENDING marker are byte-identical post-flip.
//
// Validates: Requirements 7.1, 7.2, 7.3, 12.2.

import fc from 'fast-check'
import { describe, expect, it } from 'vitest'

import {
    SURFACE_IDS,
    arbStateId,
    arbViewportId,
    buildEvidencePath,
    flipLine,
    passMarkerFor,
    type SurfaceId,
} from './_helpers'

const NUM_RUNS = 100
const CAPTURE_DATE = '2026-05-16'

// ---------------------------------------------------------------------------
// Generators for synthetic checklist lines.
// ---------------------------------------------------------------------------

const arbSurfaceLocal: fc.Arbitrary<SurfaceId> = fc.constantFrom(...SURFACE_IDS)

const arbEvidencePath = fc
    .tuple(arbSurfaceLocal, arbStateId, arbViewportId)
    .map(([s, st, v]) => buildEvidencePath(s, st, v))

/** Plausible Markdown table prefix (e.g. `| default | mobile | `). */
const arbLinePrefix = fc.stringMatching(/^\| [a-z]{3,12}( \| [a-z]{3,12}){0,2} \| /)

/** A line with a PENDING (long form) marker — should flip when PNG exists. */
const arbPendingLongLine = fc
    .tuple(arbLinePrefix, arbEvidencePath)
    .map(([prefix, ev]) => `${prefix}${ev} (PENDING capture) |`)

/** A line with a PENDING (short form) marker — should flip when PNG exists. */
const arbPendingShortLine = fc
    .tuple(arbLinePrefix, arbEvidencePath)
    .map(([prefix, ev]) => `${prefix}${ev} (PENDING) |`)

/** A line with the `n/a (verified by unit test)` marker — never flips. */
const arbNaLine = fc
    .tuple(arbLinePrefix, fc.stringMatching(/^[a-zA-Z ]{4,30}$/))
    .map(([prefix, note]) => `${prefix}n/a (${note}) |`)

/** A line that has neither evidencePath nor PENDING — must remain identical. */
const arbInertLine = fc.stringMatching(/^[A-Za-z0-9 .,;:|()\-_]{0,80}$/).filter(
    (s) =>
        !s.includes('(PENDING') &&
        !s.includes('n/a (') &&
        !/screenshots\/[a-z0-9-]+\//.test(s),
)

describe('Property 3 (clauses 3 + 4): marker flip is byte-precise (visual-qa-screenshot-capture)', () => {
    // -----------------------------------------------------------------------
    // Clause 3 — PENDING flips when PNG exists; evidencePath preserved.
    // -----------------------------------------------------------------------

    describe('clause 3 — PENDING (long form) ⇒ PASS when PNG exists (Req 7.1, 7.2)', () => {
        it('long-form PENDING flips and evidencePath is byte-identical', () => {
            fc.assert(
                fc.property(arbPendingLongLine, (line) => {
                    const evMatch = line.match(
                        /screenshots\/[a-z0-9-]+\/[a-z0-9-]+-(?:default|empty|locked|error|success)-(?:mobile|desktop)\.png/,
                    )
                    expect(evMatch).not.toBeNull()
                    const evidence = evMatch![0]
                    const flipped = flipLine(line, CAPTURE_DATE, () => true)
                    expect(flipped).not.toBe(line)
                    expect(flipped.includes(evidence)).toBe(true)
                    expect(flipped.includes(passMarkerFor(CAPTURE_DATE))).toBe(true)
                    expect(flipped.includes('(PENDING capture)')).toBe(false)
                    expect(flipped.includes('(PENDING)')).toBe(false)
                    // Single-line replacement: only the marker substring
                    // changed; everything else (including the
                    // evidencePath) is byte-identical.
                    const before = line.replace('(PENDING capture)', passMarkerFor(CAPTURE_DATE))
                    expect(flipped).toBe(before)
                }),
                { numRuns: NUM_RUNS },
            )
        })
    })

    describe('clause 3 — PENDING (short form) ⇒ PASS when PNG exists', () => {
        it('short-form PENDING flips and evidencePath is byte-identical', () => {
            fc.assert(
                fc.property(arbPendingShortLine, (line) => {
                    const flipped = flipLine(line, CAPTURE_DATE, () => true)
                    expect(flipped).not.toBe(line)
                    expect(flipped.includes(passMarkerFor(CAPTURE_DATE))).toBe(true)
                    expect(flipped.includes('(PENDING capture)')).toBe(false)
                    expect(flipped.includes('(PENDING)')).toBe(false)
                    const before = line.replace('(PENDING)', passMarkerFor(CAPTURE_DATE))
                    expect(flipped).toBe(before)
                }),
                { numRuns: NUM_RUNS },
            )
        })
    })

    describe('clause 3 — PENDING is left untouched when PNG missing (Decision 5)', () => {
        it('a line with PENDING does NOT flip when pngExists returns false', () => {
            fc.assert(
                fc.property(
                    fc.oneof(arbPendingLongLine, arbPendingShortLine),
                    (line) => {
                        const flipped = flipLine(line, CAPTURE_DATE, () => false)
                        expect(flipped).toBe(line)
                    },
                ),
                { numRuns: NUM_RUNS },
            )
        })
    })

    // -----------------------------------------------------------------------
    // Clause 4 — `n/a (...)` lines and inert lines are byte-identical.
    // -----------------------------------------------------------------------

    describe('clause 4 — `n/a (...)` lines are byte-identical (Req 7.3)', () => {
        it('flipLine returns input unchanged for `n/a (...)` lines', () => {
            fc.assert(
                fc.property(arbNaLine, (line) => {
                    expect(flipLine(line, CAPTURE_DATE, () => true)).toBe(line)
                    expect(flipLine(line, CAPTURE_DATE, () => false)).toBe(line)
                }),
                { numRuns: NUM_RUNS },
            )
        })
    })

    describe('clause 4 — lines with no PENDING marker are byte-identical', () => {
        it('inert text passes through unchanged', () => {
            fc.assert(
                fc.property(arbInertLine, (line) => {
                    expect(flipLine(line, CAPTURE_DATE, () => true)).toBe(line)
                }),
                { numRuns: NUM_RUNS },
            )
        })

        it('a line with an evidencePath but no PENDING marker is byte-identical', () => {
            fc.assert(
                fc.property(arbEvidencePath, arbLinePrefix, (ev, prefix) => {
                    const line = `${prefix}${ev} (PASS — captured 2026-05-16) |`
                    expect(flipLine(line, CAPTURE_DATE, () => true)).toBe(line)
                }),
                { numRuns: NUM_RUNS },
            )
        })
    })

    // -----------------------------------------------------------------------
    // Closure / idempotence — applying flipLine to its own output is a
    // no-op (the marker has already moved past PENDING). This is a
    // direct consequence of clauses 3 + 4 but worth pinning.
    // -----------------------------------------------------------------------

    describe('idempotence — flipLine is a no-op on its own output', () => {
        it('once flipped, a second pass produces the same line', () => {
            fc.assert(
                fc.property(
                    fc.oneof(arbPendingLongLine, arbPendingShortLine, arbNaLine, arbInertLine),
                    (line) => {
                        const once = flipLine(line, CAPTURE_DATE, () => true)
                        const twice = flipLine(once, CAPTURE_DATE, () => true)
                        expect(twice).toBe(once)
                    },
                ),
                { numRuns: NUM_RUNS },
            )
        })
    })
})
