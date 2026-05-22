/**
 * Visual capture reproducibility diff (MAPD)
 *
 * Vai chinh: QA Automation Engineer
 * Vai phoi hop: none (post-capture diagnostic; FE reviews PNGs separately)
 *
 * Spec source-of-truth:
 *   - .kiro/specs/visual-qa-screenshot-capture/requirements.md — Req 9.1, 9.2, 9.3
 *   - .kiro/specs/visual-qa-screenshot-capture/design.md — Decision 7
 *   - tasks.md — Task 8.3
 *
 * What this script does
 * ---------------------
 * Given two folders containing the visual-capture PNG output of two
 * independent runs, compute the Mean Absolute Pixel Difference (MAPD) per
 * matched PNG pair on grayscale, deterministically resized 256 × 256
 * images, and exit 0 iff every pair is within the reproducibility
 * tolerance of `2.0 / 255 ≈ 0.00784`.
 *
 * Algorithm (per PNG pair, design Decision 7):
 *   1. Decode both PNGs synchronously via `pngjs`.
 *   2. Convert RGBA → grayscale via the standard luma weighting
 *      `0.299·R + 0.587·G + 0.114·B`. Alpha is ignored — capture PNGs are
 *      opaque full-page screenshots.
 *   3. Resize the grayscale buffer to 256 × 256 using deterministic
 *      bilinear interpolation (same kernel both ways).
 *   4. MAPD = mean(|a[i] − b[i]|) / 255 over all 65 536 cells.
 *   5. Print `<evidencePath>: MAPD=<value>` for every pair.
 *   6. Exit 0 iff every MAPD ≤ MAPD_THRESHOLD; otherwise exit 1 with the
 *      count of violators.
 *
 * Pair matching: PNGs are matched by *relative path* between the two
 * folders. Files present in only one folder are reported as orphans and
 * count as violators (the run is non-reproducible).
 *
 * CLI usage:
 *   tsx scripts/visual-capture-diff.ts <folderA> <folderB>
 *
 * Validates: Requirements 9.1, 9.2, 9.3.
 */

import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'

import { PNG } from 'pngjs'

// -----------------------------------------------------------------------------
// Constants (Decision 7)
// -----------------------------------------------------------------------------

/** Reproducibility tolerance: ≤ 2.0/255 ≈ 0.00784 on the [0, 1] MAPD scale. */
const MAPD_THRESHOLD = 2.0 / 255

/** Resize target width — Decision 7 fixes both axes at 256. */
const RESIZE_WIDTH = 256

/** Resize target height — Decision 7 fixes both axes at 256. */
const RESIZE_HEIGHT = 256

/** Luma weights — ITU-R BT.601 standard (R, G, B). Alpha is dropped. */
const LUMA_R = 0.299
const LUMA_G = 0.587
const LUMA_B = 0.114

// -----------------------------------------------------------------------------
// PNG decode + grayscale
// -----------------------------------------------------------------------------

interface DecodedPNG {
    width: number
    height: number
    /** Tightly packed RGBA, 4 bytes per pixel, length === width * height * 4. */
    data: Buffer
}

/** Synchronously decode a PNG file into a width/height/RGBA buffer. */
function decodePNG(filePath: string): DecodedPNG {
    const buffer = readFileSync(filePath)
    const png = PNG.sync.read(buffer)
    return { width: png.width, height: png.height, data: png.data }
}

/**
 * Convert an RGBA buffer to a grayscale Uint8Array via luma weighting.
 *
 * Each output cell is `round(0.299·R + 0.587·G + 0.114·B)` clamped to
 * [0, 255]. Alpha is intentionally dropped — capture PNGs from
 * Playwright are opaque, so we do not premultiply.
 */
function toGrayscale(
    rgba: Buffer,
    width: number,
    height: number,
): Uint8Array {
    const expected = width * height * 4
    if (rgba.length < expected) {
        throw new Error(
            `RGBA buffer too small: expected ${expected} bytes, got ${rgba.length}`,
        )
    }
    const out = new Uint8Array(width * height)
    for (let i = 0, j = 0; j < out.length; i += 4, j += 1) {
        const r = rgba[i] ?? 0
        const g = rgba[i + 1] ?? 0
        const b = rgba[i + 2] ?? 0
        const luma = LUMA_R * r + LUMA_G * g + LUMA_B * b
        // Math.round is deterministic and platform-independent for
        // finite IEEE-754 inputs in this range, satisfying the
        // "same kernel both ways" requirement of Decision 7.
        const clamped = Math.round(luma)
        out[j] = clamped < 0 ? 0 : clamped > 255 ? 255 : clamped
    }
    return out
}

// -----------------------------------------------------------------------------
// Bilinear resize (deterministic)
// -----------------------------------------------------------------------------

/**
 * Resize a single-channel grayscale buffer to `dstW × dstH` using bilinear
 * interpolation.
 *
 * Mapping uses the *centre-of-pixel* convention so the same kernel produces
 * the same output regardless of input dimensions:
 *   - For each destination pixel `(dx, dy)`, project to source space at
 *     `srcX = (dx + 0.5) · (srcW / dstW) − 0.5`, similarly for `srcY`.
 *   - Sample the four nearest source pixels and weight by fractional
 *     distance.
 *   - Border samples are clamped to the source extent (Math.max / Math.min)
 *     so no special boundary handling is needed.
 *
 * Determinism: all arithmetic is double-precision IEEE-754, which is the
 * same on every Node.js platform we run on (Decision 7 requires the same
 * kernel both ways — this function is the kernel, called twice from the
 * caller).
 *
 * Special-case: when `srcW === dstW && srcH === dstH`, return a copy of
 * the source. This guarantees `resize(x) === resize(x)` for already-sized
 * inputs (used by the property test for MAPD = 0 on identical inputs).
 */
function bilinearResize(
    grayscale: Uint8Array,
    srcW: number,
    srcH: number,
    dstW: number,
    dstH: number,
): Uint8Array {
    if (srcW <= 0 || srcH <= 0 || dstW <= 0 || dstH <= 0) {
        throw new Error(
            `bilinearResize: invalid dimensions (${srcW}×${srcH} → ${dstW}×${dstH})`,
        )
    }
    if (grayscale.length < srcW * srcH) {
        throw new Error(
            `bilinearResize: grayscale buffer too small for ${srcW}×${srcH}`,
        )
    }

    if (srcW === dstW && srcH === dstH) {
        return new Uint8Array(grayscale.subarray(0, srcW * srcH))
    }

    const out = new Uint8Array(dstW * dstH)
    const scaleX = srcW / dstW
    const scaleY = srcH / dstH
    const maxX = srcW - 1
    const maxY = srcH - 1

    for (let dy = 0; dy < dstH; dy += 1) {
        const srcYf = (dy + 0.5) * scaleY - 0.5
        const y0 = Math.max(0, Math.floor(srcYf))
        const y1 = Math.min(maxY, y0 + 1)
        const wy = srcYf - Math.floor(srcYf)
        const wyClamped = wy < 0 ? 0 : wy > 1 ? 1 : wy
        const oneMinusWy = 1 - wyClamped

        for (let dx = 0; dx < dstW; dx += 1) {
            const srcXf = (dx + 0.5) * scaleX - 0.5
            const x0 = Math.max(0, Math.floor(srcXf))
            const x1 = Math.min(maxX, x0 + 1)
            const wx = srcXf - Math.floor(srcXf)
            const wxClamped = wx < 0 ? 0 : wx > 1 ? 1 : wx
            const oneMinusWx = 1 - wxClamped

            const p00 = grayscale[y0 * srcW + x0] ?? 0
            const p01 = grayscale[y0 * srcW + x1] ?? 0
            const p10 = grayscale[y1 * srcW + x0] ?? 0
            const p11 = grayscale[y1 * srcW + x1] ?? 0

            const top = p00 * oneMinusWx + p01 * wxClamped
            const bottom = p10 * oneMinusWx + p11 * wxClamped
            const value = top * oneMinusWy + bottom * wyClamped

            // Math.round is deterministic across platforms for this range.
            const rounded = Math.round(value)
            out[dy * dstW + dx] =
                rounded < 0 ? 0 : rounded > 255 ? 255 : rounded
        }
    }
    return out
}

// -----------------------------------------------------------------------------
// MAPD computation
// -----------------------------------------------------------------------------

/**
 * Mean Absolute Pixel Difference between two equal-length grayscale
 * buffers, normalised to the unit interval [0, 1] by dividing by 255.
 *
 * Decision 7 expresses the threshold as `2.0 / 255` ≈ 0.00784, so the
 * MAPD output uses the same scale: 0 = identical, 1 = worst case.
 *
 * Both buffers MUST have length `RESIZE_WIDTH * RESIZE_HEIGHT`.
 */
function computeMAPD(a: Uint8Array, b: Uint8Array): number {
    if (a.length !== b.length) {
        throw new Error(
            `computeMAPD: length mismatch (${a.length} vs ${b.length})`,
        )
    }
    if (a.length === 0) return 0
    let sum = 0
    for (let i = 0; i < a.length; i += 1) {
        const av = a[i] ?? 0
        const bv = b[i] ?? 0
        const diff = av - bv
        sum += diff < 0 ? -diff : diff
    }
    // Normalise: mean in [0, 255] → divide by 255 → [0, 1].
    return sum / a.length / 255
}

// -----------------------------------------------------------------------------
// PNG pair discovery
// -----------------------------------------------------------------------------

interface PNGPair {
    /** Relative path used as the diagnostic identifier (POSIX separators). */
    path: string
    /** Absolute path of the PNG inside `folderA`. */
    fileA: string
    /** Absolute path of the PNG inside `folderB`. */
    fileB: string
}

interface OrphanPNG {
    /** Relative path (POSIX separators). */
    path: string
    /** `'A'` if the PNG exists only in `folderA`, otherwise `'B'`. */
    side: 'A' | 'B'
}

/** Recursively list `.png` files under `root`, returning POSIX-relative paths. */
function listPNGFilesRelative(root: string): string[] {
    const out: string[] = []
    const stack: string[] = ['']
    while (stack.length > 0) {
        const rel = stack.pop() as string
        const dir = rel === '' ? root : path.join(root, rel)
        let entries: ReturnType<typeof readdirSync>
        try {
            entries = readdirSync(dir, { withFileTypes: true })
        } catch {
            continue
        }
        for (const entry of entries) {
            const childRel =
                rel === '' ? entry.name : `${rel}/${entry.name}`
            if (entry.isDirectory()) {
                stack.push(childRel)
                continue
            }
            if (!entry.isFile()) continue
            if (path.extname(entry.name).toLowerCase() !== '.png') continue
            out.push(childRel)
        }
    }
    // Sort for deterministic output ordering.
    out.sort()
    return out
}

/**
 * Recursively walk both folders and produce the matched-pair set plus the
 * orphan list. Pairing is by relative POSIX path, which mirrors the
 * `evidencePath` convention used by the capture manifest.
 */
function findPNGPairs(
    folderA: string,
    folderB: string,
): { pairs: PNGPair[]; orphans: OrphanPNG[] } {
    const filesA = new Set(listPNGFilesRelative(folderA))
    const filesB = new Set(listPNGFilesRelative(folderB))

    const pairs: PNGPair[] = []
    const orphans: OrphanPNG[] = []

    const sorted = [...new Set([...filesA, ...filesB])].sort()
    for (const rel of sorted) {
        const inA = filesA.has(rel)
        const inB = filesB.has(rel)
        if (inA && inB) {
            pairs.push({
                path: rel,
                fileA: path.join(folderA, rel),
                fileB: path.join(folderB, rel),
            })
        } else if (inA) {
            orphans.push({ path: rel, side: 'A' })
        } else {
            orphans.push({ path: rel, side: 'B' })
        }
    }

    return { pairs, orphans }
}

// -----------------------------------------------------------------------------
// Per-pair MAPD pipeline
// -----------------------------------------------------------------------------

/**
 * Run the full pipeline (decode → grayscale → resize → MAPD) for one pair.
 * Exposed as a top-level helper so the MAPD property test (Task 10.4) can
 * reuse the same logic on synthetic inputs.
 */
export function diffPair(fileA: string, fileB: string): number {
    const a = decodePNG(fileA)
    const b = decodePNG(fileB)
    const grayA = toGrayscale(a.data, a.width, a.height)
    const grayB = toGrayscale(b.data, b.width, b.height)
    const resA = bilinearResize(
        grayA,
        a.width,
        a.height,
        RESIZE_WIDTH,
        RESIZE_HEIGHT,
    )
    const resB = bilinearResize(
        grayB,
        b.width,
        b.height,
        RESIZE_WIDTH,
        RESIZE_HEIGHT,
    )
    return computeMAPD(resA, resB)
}

// -----------------------------------------------------------------------------
// CLI entry point
// -----------------------------------------------------------------------------

interface ParsedArgs {
    folderA: string
    folderB: string
}

function parseArgs(argv: string[]): ParsedArgs {
    // argv shape under tsx: [node, scriptPath, folderA, folderB, ...]
    const positional = argv.slice(2)
    if (positional.length < 2) {
        console.error(
            'Usage: tsx scripts/visual-capture-diff.ts <folderA> <folderB>',
        )
        console.error(
            '  Compares matching PNGs by relative path and reports MAPD per pair.',
        )
        process.exit(2)
    }
    const folderA = path.resolve(positional[0] ?? '')
    const folderB = path.resolve(positional[1] ?? '')
    return { folderA, folderB }
}

function assertFolder(folder: string, label: string): void {
    if (!existsSync(folder)) {
        console.error(`${label} does not exist: ${folder}`)
        process.exit(2)
    }
    let stat: ReturnType<typeof statSync>
    try {
        stat = statSync(folder)
    } catch {
        console.error(`${label} is not accessible: ${folder}`)
        process.exit(2)
        return
    }
    if (!stat.isDirectory()) {
        console.error(`${label} is not a directory: ${folder}`)
        process.exit(2)
    }
}

/** Format a MAPD value with 4 decimal places (per task deliverable). */
function formatMAPD(value: number): string {
    // Guard against NaN / Infinity so the output line is always parseable.
    if (!Number.isFinite(value)) return 'NaN'
    return value.toFixed(4)
}

function main(): void {
    const { folderA, folderB } = parseArgs(process.argv)
    assertFolder(folderA, 'folderA')
    assertFolder(folderB, 'folderB')

    const { pairs, orphans } = findPNGPairs(folderA, folderB)

    if (pairs.length === 0 && orphans.length === 0) {
        console.error(
            `No PNG files found in either folder. Both folders are empty: ${folderA}, ${folderB}`,
        )
        process.exit(2)
    }

    let violators = 0

    for (const pair of pairs) {
        let mapd: number
        try {
            mapd = diffPair(pair.fileA, pair.fileB)
        } catch (err) {
            const message = err instanceof Error ? err.message : String(err)
            console.error(`${pair.path}: ERROR ${message}`)
            violators += 1
            continue
        }
        console.log(`${pair.path}: MAPD=${formatMAPD(mapd)}`)
        if (mapd > MAPD_THRESHOLD) {
            violators += 1
        }
    }

    for (const orphan of orphans) {
        const sideLabel = orphan.side === 'A' ? 'folderA' : 'folderB'
        console.log(
            `${orphan.path}: MAPD=ORPHAN (only present in ${sideLabel})`,
        )
        violators += 1
    }

    const total = pairs.length + orphans.length
    if (violators === 0) {
        console.log(
            `\nvisual-capture-diff OK — ${pairs.length} pair(s) within MAPD ≤ ${formatMAPD(MAPD_THRESHOLD)}.`,
        )
        process.exit(0)
    }

    console.error(
        `\nvisual-capture-diff FAILED — ${violators}/${total} entr${violators === 1 ? 'y' : 'ies'} exceeded MAPD ≤ ${formatMAPD(MAPD_THRESHOLD)} or were orphaned.`,
    )
    process.exit(1)
}

// Exported for property tests (Task 10.4) without triggering CLI execution
// when imported as a module.
export {
    MAPD_THRESHOLD,
    RESIZE_WIDTH,
    RESIZE_HEIGHT,
    bilinearResize,
    computeMAPD,
    decodePNG,
    findPNGPairs,
    toGrayscale,
}

// Run the CLI only when invoked directly (not when imported by tests).
// `tsx` transpiles ESM, so we compare the module URL to the entry script.
const invokedAsScript = (() => {
    const entry = process.argv[1]
    if (typeof entry !== 'string' || entry.length === 0) return false
    try {
        const entryResolved = path.resolve(entry)
        // `import.meta.url` is the most reliable cross-runtime check, but
        // referring to it makes this file ESM-only. Falling back to a
        // filename comparison keeps the script runnable under both `tsx`
        // (ESM) and `ts-node` (CJS) without conditional imports.
        return entryResolved.endsWith('visual-capture-diff.ts')
    } catch {
        return false
    }
})()

if (invokedAsScript) {
    main()
}
