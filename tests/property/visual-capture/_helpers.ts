/**
 * Shared helpers for the `visual-qa-screenshot-capture` property suite
 * (spec `.kiro/specs/visual-qa-screenshot-capture/`).
 *
 * Vai chinh: QA Automation Engineer
 * Vai phoi hop: Frontend Engineer
 *
 * The four properties (P1..P4) declared in design.md §"Correctness
 * Properties" all operate on **pure logic** — no Playwright, no real
 * filesystem, no real PNG decoding. Each test file synthesises inputs
 * via fast-check and exercises a small, exported helper from this
 * module. Keeping helpers here (rather than reaching into the real
 * `tests/integration/visual-capture.spec.ts`) is intentional:
 *
 *   - Property tests run via `pnpm test:property` in any environment,
 *     including sandboxes with no dev server (tasks.md §"Execution
 *     model").
 *   - The helpers mirror the Decision 1 schema, the Decision 5 marker
 *     flip algorithm, the Decision 6 acceptance invariants, and the
 *     Decision 7 MAPD formula — so a regression in any of them shows
 *     up here without depending on a Playwright run.
 */

import fc from 'fast-check'

// ---------------------------------------------------------------------------
// Shared types — mirror design.md Decision 1 (Capture_Manifest schema).
// ---------------------------------------------------------------------------

export const SURFACE_IDS = [
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
    'exam',
] as const

export type SurfaceId = (typeof SURFACE_IDS)[number]

/**
 * Canonical state set per design.md Decision 1 + Data Models. The
 * runbook has not promoted `result` to a first-class state — adding it
 * would require a design doc amendment, so the property tests use the
 * five values the schema actually accepts.
 */
export const STATE_IDS = ['default', 'empty', 'locked', 'error', 'success'] as const
export type StateId = (typeof STATE_IDS)[number]

export const VIEWPORT_IDS = ['mobile', 'desktop'] as const
export type ViewportId = (typeof VIEWPORT_IDS)[number]

export type StateDriverKind =
    | 'queryParam'
    | 'mockFetch'
    | 'routeIntercept'
    | 'seedReset'
    | 'none'

export interface StateDriver {
    kind: StateDriverKind
    // Driver-specific fields are not used by the property tests; only
    // the `kind` is dispatched on (Property 2 clause 3).
    [extra: string]: unknown
}

export interface ManifestEntry {
    surface: SurfaceId
    state: StateId
    viewport: ViewportId
    route: string
    evidencePath: string
    requiresSeed: boolean
    stateDriver?: StateDriver
}

// ---------------------------------------------------------------------------
// fast-check arbitraries — used by every property file.
// ---------------------------------------------------------------------------

export const arbSurfaceId = fc.constantFrom(...SURFACE_IDS)
export const arbStateId = fc.constantFrom(...STATE_IDS)
export const arbViewportId = fc.constantFrom(...VIEWPORT_IDS)

/** Routes that satisfy the "starts with `/`" invariant (Decision 1). */
export const arbRoute: fc.Arbitrary<string> = fc.oneof(
    fc.constantFrom(
        '/dashboard',
        '/course?level=A1',
        '/vocabulary',
        '/review',
        '/rewards/shop',
        '/exam/dev-a1-goethe-mini',
        '/reading/A1-T1-001',
        '/listening/L-A1-GOETHE-001-T1',
        '/writing/W-A1-T1-001',
    ),
    fc.stringMatching(/^\/[a-z][a-z0-9/-]{1,30}$/),
)

export const arbStateDriverKind = fc.constantFrom<StateDriverKind>(
    'queryParam',
    'mockFetch',
    'routeIntercept',
    'seedReset',
    'none',
)

/** Build the canonical evidencePath for a triple (Decision 1 regex). */
export function buildEvidencePath(
    surface: SurfaceId,
    state: StateId,
    viewport: ViewportId,
): string {
    return `screenshots/${surface}/${surface}-${state}-${viewport}.png`
}

/**
 * Synthesise a single manifest entry for an explicit triple. Caller is
 * responsible for ensuring uniqueness across triples in the test
 * harness.
 */
export function buildEntry(
    triple: [SurfaceId, StateId, ViewportId],
    options?: {
        requiresSeed?: boolean
        stateDriver?: StateDriver
        route?: string
    },
): ManifestEntry {
    const [surface, state, viewport] = triple
    const requiresSeed = options?.requiresSeed ?? false
    const route = options?.route ?? `/${surface}`
    const driver: StateDriver | undefined =
        state === 'default' ? undefined : (options?.stateDriver ?? { kind: 'none' })
    const entry: ManifestEntry = {
        surface,
        state,
        viewport,
        route,
        evidencePath: buildEvidencePath(surface, state, viewport),
        requiresSeed,
    }
    if (driver) entry.stateDriver = driver
    return entry
}

/**
 * Generator that yields a manifest of arbitrary size with **unique
 * `<surface, state, viewport>` triples** — the uniqueness invariant
 * declared by Decision 1 / Property 1 clause 2.
 */
export const arbManifest: fc.Arbitrary<ManifestEntry[]> = fc
    .uniqueArray(
        fc.tuple(arbSurfaceId, arbStateId, arbViewportId),
        {
            minLength: 1,
            maxLength: 12,
            selector: (t) => `${t[0]}|${t[1]}|${t[2]}`,
        },
    )
    .chain((triples) =>
        fc
            .tuple(
                ...triples.map((triple) =>
                    fc.record({
                        triple: fc.constant(triple),
                        requiresSeed: fc.boolean(),
                        driverKind: arbStateDriverKind,
                    }),
                ),
            )
            .map((records) =>
                records.map(({ triple, requiresSeed, driverKind }) =>
                    buildEntry(triple, {
                        requiresSeed,
                        stateDriver: { kind: driverKind },
                    }),
                ),
            ),
    )

// ---------------------------------------------------------------------------
// Schema validator — Property 1 clause 1.
// ---------------------------------------------------------------------------

const EVIDENCE_PATH_RE = /^screenshots\/([a-z0-9-]+)\/\1-(default|empty|locked|error|success)-(mobile|desktop)\.png$/

export interface ValidationViolation {
    index: number
    field: keyof ManifestEntry | 'evidencePath:regex' | 'requiresSeed:mirror'
    reason: string
}

/**
 * Validate every entry against the Decision 1 schema. Returns the list
 * of violations (empty when manifest is well-formed). Used by Property
 * 1 clause 1.
 *
 * `surfaceTable` carries the authoritative `requiresSeed` flag per
 * surface so we can verify the manifest mirrors `P0_SURFACES` (Req 1.5
 * / Property 1 clause 1 last sub-clause).
 */
export function validateManifest(
    manifest: readonly ManifestEntry[],
    surfaceTable: ReadonlyMap<SurfaceId, boolean>,
): ValidationViolation[] {
    const violations: ValidationViolation[] = []
    for (let i = 0; i < manifest.length; i += 1) {
        const e = manifest[i]
        if (!SURFACE_IDS.includes(e.surface)) {
            violations.push({ index: i, field: 'surface', reason: `unknown surface: ${e.surface}` })
        }
        if (!STATE_IDS.includes(e.state)) {
            violations.push({ index: i, field: 'state', reason: `unknown state: ${e.state}` })
        }
        if (!VIEWPORT_IDS.includes(e.viewport)) {
            violations.push({ index: i, field: 'viewport', reason: `unknown viewport: ${e.viewport}` })
        }
        if (typeof e.route !== 'string' || !e.route.startsWith('/')) {
            violations.push({ index: i, field: 'route', reason: `route must start with '/': ${e.route}` })
        }
        if (!EVIDENCE_PATH_RE.test(e.evidencePath)) {
            violations.push({
                index: i,
                field: 'evidencePath:regex',
                reason: `evidencePath does not match canonical regex: ${e.evidencePath}`,
            })
        } else {
            const [, surfacePart, statePart, viewportPart] = EVIDENCE_PATH_RE.exec(e.evidencePath)!
            if (surfacePart !== e.surface || statePart !== e.state || viewportPart !== e.viewport) {
                violations.push({
                    index: i,
                    field: 'evidencePath',
                    reason: `evidencePath does not align with (surface,state,viewport): ${e.evidencePath}`,
                })
            }
        }
        const expectedSeed = surfaceTable.get(e.surface) ?? false
        if (e.requiresSeed !== expectedSeed) {
            violations.push({
                index: i,
                field: 'requiresSeed:mirror',
                reason: `requiresSeed=${e.requiresSeed} does not mirror P0_SURFACES table value ${expectedSeed} for ${e.surface}`,
            })
        }
    }
    return violations
}

/** Property 1 clause 2 — `<surface, state, viewport>` triples must be unique. */
export function findDuplicateTriples(manifest: readonly ManifestEntry[]): string[] {
    const seen = new Set<string>()
    const duplicates: string[] = []
    for (const e of manifest) {
        const k = `${e.surface}|${e.state}|${e.viewport}`
        if (seen.has(k)) duplicates.push(k)
        seen.add(k)
    }
    return duplicates
}

// ---------------------------------------------------------------------------
// Marker flip — Decision 5 / Property 3 clauses 3 + 4.
// ---------------------------------------------------------------------------

const PENDING_LONG = '(PENDING capture)'
const PENDING_SHORT = '(PENDING)'
const PASS_PREFIX = '(PASS — captured '

/** Replacement format: `(PASS — captured <YYYY-MM-DD>)`. Decision 5. */
export function passMarkerFor(captureDate: string): string {
    return `${PASS_PREFIX}${captureDate})`
}

/**
 * Flip a single line per Decision 5:
 *
 *   - If the line contains an evidencePath AND a PENDING marker
 *     (long or short form) AND a PNG exists for that evidencePath,
 *     replace the marker with `(PASS — captured <date>)`.
 *   - Lines marked `n/a (...)` are left byte-identical.
 *   - Lines with no PENDING marker are left byte-identical.
 *
 * `pngExistsByEvidencePath` is the test stand-in for the real
 * filesystem check the marker-flip script performs.
 */
export function flipLine(
    line: string,
    captureDate: string,
    pngExistsByEvidencePath: (evidencePath: string) => boolean,
): string {
    if (line.includes('n/a (')) return line
    const evidenceMatch = line.match(/screenshots\/[a-z0-9-]+\/[a-z0-9-]+-(?:default|empty|locked|error|success|result)-(?:mobile|desktop)\.png/)
    if (!evidenceMatch) return line
    const evidencePath = evidenceMatch[0]
    if (!pngExistsByEvidencePath(evidencePath)) return line
    const pass = passMarkerFor(captureDate)
    if (line.includes(PENDING_LONG)) {
        return line.replace(PENDING_LONG, pass)
    }
    if (line.includes(PENDING_SHORT)) {
        return line.replace(PENDING_SHORT, pass)
    }
    return line
}

// ---------------------------------------------------------------------------
// PNG bijection + magic bytes — Decision 6 / Property 3 clauses 1 + 2.
// ---------------------------------------------------------------------------

export const PNG_MAGIC = Uint8Array.of(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a)

/** Test whether a buffer begins with the PNG magic bytes (Req 6.3 / Decision 6 I4). */
export function hasPngMagic(buf: Uint8Array): boolean {
    if (buf.length < PNG_MAGIC.length) return false
    for (let i = 0; i < PNG_MAGIC.length; i += 1) {
        if (buf[i] !== PNG_MAGIC[i]) return false
    }
    return true
}

/** Build a synthetic PNG buffer with valid magic bytes and arbitrary tail. */
export function makeValidPng(tail: Uint8Array): Uint8Array {
    const out = new Uint8Array(PNG_MAGIC.length + tail.length)
    out.set(PNG_MAGIC, 0)
    out.set(tail, PNG_MAGIC.length)
    return out
}

export interface BijectionResult {
    missingPng: string[] // evidencePaths in manifest with no PNG on disk (I2)
    orphanPng: string[] // PNGs on disk not referenced by manifest (I3)
}

/**
 * Decision 6 invariants I2 + I3 in one pass: every manifest evidencePath
 * must have a PNG on disk, and every PNG on disk must be referenced by
 * the manifest. The `pngsOnDisk` set is the synthesised filesystem.
 */
export function checkPngBijection(
    manifestPaths: readonly string[],
    pngsOnDisk: ReadonlySet<string>,
): BijectionResult {
    const manifestSet = new Set(manifestPaths)
    const missingPng = manifestPaths.filter((p) => !pngsOnDisk.has(p))
    const orphanPng: string[] = []
    for (const p of pngsOnDisk) {
        if (!manifestSet.has(p)) orphanPng.push(p)
    }
    return { missingPng, orphanPng }
}

// ---------------------------------------------------------------------------
// MAPD — Decision 7 / Property 4.
// ---------------------------------------------------------------------------

/**
 * Bilinear resize a 1-channel grayscale buffer of `srcW × srcH` to
 * `dstW × dstH`. Deterministic — a pure function of (src, srcW, srcH,
 * dstW, dstH). Property 4 clause: bilinear resize is deterministic.
 *
 * Implementation note: we use a simple separable bilinear sampler. For
 * the property tests we only need the determinism + correctness of
 * MAPD = 0 on identical inputs; pixel-perfect agreement with `pngjs`'
 * resampler is not required.
 */
export function bilinearResize(
    src: Uint8Array,
    srcW: number,
    srcH: number,
    dstW: number,
    dstH: number,
): Uint8Array {
    if (srcW <= 0 || srcH <= 0 || dstW <= 0 || dstH <= 0) {
        throw new Error('bilinearResize: positive dimensions required')
    }
    if (src.length !== srcW * srcH) {
        throw new Error(`bilinearResize: src length ${src.length} !== ${srcW * srcH}`)
    }
    const out = new Uint8Array(dstW * dstH)
    if (srcW === dstW && srcH === dstH) {
        out.set(src)
        return out
    }
    const xRatio = srcW > 1 ? (srcW - 1) / Math.max(1, dstW - 1) : 0
    const yRatio = srcH > 1 ? (srcH - 1) / Math.max(1, dstH - 1) : 0
    for (let y = 0; y < dstH; y += 1) {
        const fy = y * yRatio
        const y0 = Math.floor(fy)
        const y1 = Math.min(srcH - 1, y0 + 1)
        const dy = fy - y0
        for (let x = 0; x < dstW; x += 1) {
            const fx = x * xRatio
            const x0 = Math.floor(fx)
            const x1 = Math.min(srcW - 1, x0 + 1)
            const dx = fx - x0
            const a = src[y0 * srcW + x0]
            const b = src[y0 * srcW + x1]
            const c = src[y1 * srcW + x0]
            const d = src[y1 * srcW + x1]
            const top = a + (b - a) * dx
            const bot = c + (d - c) * dx
            out[y * dstW + x] = Math.round(top + (bot - top) * dy)
        }
    }
    return out
}

/**
 * Mean Absolute Pixel Difference between two equal-sized grayscale
 * buffers, reported in the [0, 255] domain. Property 4: identical
 * inputs ⇒ MAPD = 0.
 */
export function mapd(a: Uint8Array, b: Uint8Array): number {
    if (a.length !== b.length) {
        throw new Error(`mapd: length mismatch ${a.length} vs ${b.length}`)
    }
    if (a.length === 0) return 0
    let acc = 0
    for (let i = 0; i < a.length; i += 1) {
        acc += Math.abs(a[i] - b[i])
    }
    return acc / a.length
}

/** Threshold from design.md Decision 7: 2.0 / 255 ≈ 0.00784. */
export const MAPD_THRESHOLD = 2.0

/**
 * Derive the `scripts/visual-capture-diff.ts` exit code from a list of
 * paired MAPDs. Property 4 clause: exit 0 iff every MAPD ≤ threshold
 * (in 0..255 scale).
 */
export function deriveDiffExitCode(mapdValues: readonly number[]): 0 | 1 {
    return mapdValues.every((v) => v <= MAPD_THRESHOLD) ? 0 : 1
}

// ---------------------------------------------------------------------------
// Capture_Spec generator helpers — Property 2.
//
// These helpers mirror the *intent* of `tests/integration/visual-capture.spec.ts`
// without depending on Playwright. They let the property test simulate
// the spec's behaviour (test() invocation count, driver dispatch,
// emulateMedia, error message format, FUXIE_CAPTURE_ONLY filter,
// exit-code derivation) deterministically.
// ---------------------------------------------------------------------------

export interface SimulatedTestCall {
    name: string
    surface: SurfaceId
    state: StateId
    viewport: ViewportId
    evidencePath: string
}

export interface SimulatedDriverCall {
    surface: SurfaceId
    state: StateId
    kind: StateDriverKind
}

export interface SimulatedEmulateCall {
    surface: SurfaceId
    state: StateId
    reducedMotion: 'reduce' | 'no-preference'
}

export interface SimulationResult {
    testCalls: SimulatedTestCall[]
    driverCalls: SimulatedDriverCall[]
    emulateCalls: SimulatedEmulateCall[]
}

/**
 * Apply the `FUXIE_CAPTURE_ONLY` env filter (Req 11.3 / Property 2
 * clause 7): comma-separated list of surface IDs narrows the entry
 * set; missing/empty value leaves the manifest untouched.
 */
export function applyCaptureOnlyFilter(
    manifest: readonly ManifestEntry[],
    envValue: string | undefined,
): ManifestEntry[] {
    if (!envValue || envValue.trim() === '') return [...manifest]
    const allow = new Set(envValue.split(',').map((s) => s.trim()).filter(Boolean))
    return manifest.filter((e) => allow.has(e.surface))
}

/**
 * Pure simulator of the Playwright capture spec. Returns the
 * sequence of `test()`, driver-install, and `emulateMedia` calls the
 * spec would emit for the given manifest. Property 2 clauses 1, 3,
 * 4 + 5 + 6 + 7 read assertions off this object.
 */
export function simulateCaptureSpec(
    manifest: readonly ManifestEntry[],
    options?: { captureOnlyEnv?: string },
): SimulationResult {
    const filtered = applyCaptureOnlyFilter(manifest, options?.captureOnlyEnv)
    const testCalls: SimulatedTestCall[] = []
    const driverCalls: SimulatedDriverCall[] = []
    const emulateCalls: SimulatedEmulateCall[] = []
    for (const e of filtered) {
        testCalls.push({
            name: `${e.surface} / ${e.state} / ${e.viewport}`,
            surface: e.surface,
            state: e.state,
            viewport: e.viewport,
            evidencePath: e.evidencePath,
        })
        if (e.state !== 'default') {
            // Default state has no driver. Other states dispatch on
            // `entry.stateDriver.kind` (Decision 2). Missing driver
            // means `none`.
            const kind: StateDriverKind = e.stateDriver?.kind ?? 'none'
            driverCalls.push({ surface: e.surface, state: e.state, kind })
        }
        // Decision 7 + Req 9.4: emulateMedia({reducedMotion:'reduce'})
        // is applied for every entry whose state ∈ {loading, success}.
        // The current state enum has `success` only; we treat it as
        // the inclusion criterion. Other states keep no-preference.
        emulateCalls.push({
            surface: e.surface,
            state: e.state,
            reducedMotion: e.state === 'success' ? 'reduce' : 'no-preference',
        })
    }
    return { testCalls, driverCalls, emulateCalls }
}

/**
 * Property 2 clause 5: format an error message that contains all four
 * tokens (surface, state, viewport, reason). Mirrors the contract from
 * Req 3.10.
 */
export function formatTimeoutError(
    surface: SurfaceId,
    state: StateId,
    viewport: ViewportId,
    reason: string,
): string {
    return `Capture failed: surface=${surface} state=${state} viewport=${viewport} reason=${reason}`
}

/**
 * Property 2 clause 6: exit code is 0 iff every entry succeeded. Mirrors
 * Req 5.2 + Req 11.2.
 */
export function deriveCaptureExitCode(
    totalEntries: number,
    succeededEntries: number,
): 0 | 1 {
    if (succeededEntries < 0 || succeededEntries > totalEntries) return 1
    return totalEntries === succeededEntries ? 0 : 1
}
