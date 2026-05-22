// Feature: visual-qa-screenshot-capture, Property 3 (clauses 1 + 2): PNG ↔ manifest bijection
//
// Vai chinh: QA Automation Engineer
// Vai phoi hop: Frontend Engineer
//
// Spec ref: `.kiro/specs/visual-qa-screenshot-capture/design.md`
// §"Correctness Properties / Property 3" clauses 1 + 2 + the PNG
// magic-bytes invariant from Decision 6 / Req 6.3 / Req 12.3 / Req
// 12.4.
//
//   Clause 1 — for every manifest entry e, a PNG exists at
//     `<qa-runs/2026-05-16>/<e.evidencePath>` and starts with the PNG
//     magic bytes (`89 50 4E 47 0D 0A 1A 0A`).
//   Clause 2 — for every PNG file under
//     `<qa-runs/2026-05-16>/screenshots/**/*.png` there is exactly one
//     manifest entry whose evidencePath resolves to that file.
//
// The marker-flip clauses 3 + 4 live in `marker-flip.spec.ts`.
//
// Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.5, 12.3, 12.4.

import fc from 'fast-check'
import { describe, expect, it } from 'vitest'

import {
    arbManifest,
    checkPngBijection,
    hasPngMagic,
    makeValidPng,
    PNG_MAGIC,
} from './_helpers'

const NUM_RUNS = 100

describe('Property 3 (clauses 1 + 2): PNG ↔ manifest bijection (visual-qa-screenshot-capture)', () => {
    // -----------------------------------------------------------------------
    // Clause 1 — every manifest evidencePath has a corresponding PNG.
    // -----------------------------------------------------------------------

    describe('clause 1 — every manifest evidencePath has a PNG (Decision 6 I2 / Req 6.1)', () => {
        it('a filesystem matching the manifest reports zero missing PNGs', () => {
            fc.assert(
                fc.property(arbManifest, (manifest) => {
                    const fs = new Set(manifest.map((e) => e.evidencePath))
                    const result = checkPngBijection(
                        manifest.map((e) => e.evidencePath),
                        fs,
                    )
                    expect(result.missingPng).toEqual([])
                    expect(result.orphanPng).toEqual([])
                }),
                { numRuns: NUM_RUNS },
            )
        })

        it('removing any single PNG from the filesystem reports it as missing', () => {
            fc.assert(
                fc.property(arbManifest, (manifest) => {
                    if (manifest.length === 0) return
                    const fs = new Set(manifest.map((e) => e.evidencePath))
                    const dropped = manifest[0].evidencePath
                    fs.delete(dropped)
                    const result = checkPngBijection(
                        manifest.map((e) => e.evidencePath),
                        fs,
                    )
                    expect(result.missingPng).toContain(dropped)
                    expect(result.orphanPng).toEqual([])
                }),
                { numRuns: NUM_RUNS },
            )
        })
    })

    // -----------------------------------------------------------------------
    // Clause 2 — every PNG on disk is referenced by the manifest.
    // -----------------------------------------------------------------------

    describe('clause 2 — every on-disk PNG is referenced by the manifest (Decision 6 I3 / Req 6.5)', () => {
        it('an extra orphan PNG with no manifest entry is reported', () => {
            fc.assert(
                fc.property(
                    arbManifest,
                    fc.stringMatching(/^screenshots\/[a-z]{4,8}\/[a-z]{4,8}-default-mobile\.png$/),
                    (manifest, orphan) => {
                        const manifestPaths = manifest.map((e) => e.evidencePath)
                        if (manifestPaths.includes(orphan)) return // skip the case where the orphan is already in the manifest
                        const fs = new Set(manifestPaths)
                        fs.add(orphan)
                        const result = checkPngBijection(manifestPaths, fs)
                        expect(result.missingPng).toEqual([])
                        expect(result.orphanPng).toContain(orphan)
                    },
                ),
                { numRuns: NUM_RUNS },
            )
        })
    })

    // -----------------------------------------------------------------------
    // PNG magic bytes (Decision 6 I4 / Req 6.3).
    // -----------------------------------------------------------------------

    describe('PNG magic-bytes invariant (Decision 6 I4 / Req 6.3)', () => {
        it('a buffer that starts with PNG_MAGIC is detected as PNG', () => {
            fc.assert(
                fc.property(fc.uint8Array({ minLength: 0, maxLength: 32 }), (tail) => {
                    const buf = makeValidPng(tail)
                    expect(hasPngMagic(buf)).toBe(true)
                }),
                { numRuns: NUM_RUNS },
            )
        })

        it('a buffer with any byte in the first 8 bytes corrupted is NOT detected as PNG', () => {
            fc.assert(
                fc.property(
                    fc.integer({ min: 0, max: 7 }),
                    fc.integer({ min: 0, max: 255 }),
                    fc.uint8Array({ minLength: 0, maxLength: 16 }),
                    (corruptIdx, corruptByte, tail) => {
                        const buf = makeValidPng(tail)
                        // Pick a byte value different from the canonical
                        // value at that offset so we are guaranteed to
                        // produce a true corruption (not a no-op).
                        const original = buf[corruptIdx]
                        const replacement = corruptByte === original ? (corruptByte + 1) % 256 : corruptByte
                        buf[corruptIdx] = replacement
                        expect(buf[corruptIdx]).not.toBe(PNG_MAGIC[corruptIdx])
                        expect(hasPngMagic(buf)).toBe(false)
                    },
                ),
                { numRuns: NUM_RUNS },
            )
        })

        it('a buffer shorter than 8 bytes is NOT detected as PNG', () => {
            fc.assert(
                fc.property(
                    fc.uint8Array({ minLength: 0, maxLength: 7 }),
                    (short) => {
                        expect(hasPngMagic(short)).toBe(false)
                    },
                ),
                { numRuns: NUM_RUNS },
            )
        })

        it('arbitrary random bytes are very rarely detected as PNG (sanity)', () => {
            // The random-buffer chance of coincidentally matching the
            // 8-byte signature is 1 / 2^64 ≈ 0. We assert exactly zero
            // hits over 100 runs as an additional guard against the
            // detector being too permissive.
            fc.assert(
                fc.property(
                    fc.uint8Array({ minLength: 8, maxLength: 64 }).filter(
                        (buf) => !(
                            buf[0] === PNG_MAGIC[0] &&
                            buf[1] === PNG_MAGIC[1] &&
                            buf[2] === PNG_MAGIC[2] &&
                            buf[3] === PNG_MAGIC[3]
                        ),
                    ),
                    (buf) => {
                        expect(hasPngMagic(buf)).toBe(false)
                    },
                ),
                { numRuns: NUM_RUNS },
            )
        })
    })
})
