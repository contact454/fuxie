/**
 * Asset Audit — Pure Invariant Core
 *
 * Vai chinh: Frontend Engineer
 * Vai phoi hop: QA Automation Engineer
 *
 * This module hosts the four pure functions that encode the audit
 * invariants for spec `gamified-ui-asset-rollout`:
 *
 *   1. `computeCoverage(registryValues, optimizedFiles)` — Req 2.1.
 *   2. `findOrphans(optimizedFiles, registryValues, archiveEntries)` — Req 2.2.
 *   3. `findForbiddenRefs(registryEntries)` — Req 2.3.
 *   4. `findOptimizedPreferenceIssues(registryEntries, optimizedFiles)` — Req 2.4.
 *
 * The four functions are shared by:
 *   - `scripts/asset-audit.ts` (the live `pnpm check:asset-audit` script
 *     that walks `apps/web/public/` and the live registry).
 *   - `tests/asset-registry.spec.ts` Property 4 (the property-based test
 *     that feeds *synthetic* fixtures to verify the invariant logic
 *     itself, not the current state of the tree — per task 2.8 brief).
 *
 * Constants (`COVERAGE_THRESHOLD`, `OPTIMIZED_ROOTS`,
 * `IMAGE_EXTENSIONS`, `FORBIDDEN_FOLDER_TOKENS`) are exported so the
 * test can reference the same source-of-truth thresholds the live
 * script uses.
 *
 * Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5, 18.1
 */

import path from 'node:path'

/** Coverage threshold from Req 2.1: ≥ 95% of optimized files referenced. */
export const COVERAGE_THRESHOLD = 0.95

/**
 * Roots scanned recursively for optimized assets. Public-path style
 * (forward slashes, no leading slash) so the helpers can be reused with
 * either filesystem or synthetic inputs.
 */
export const OPTIMIZED_ROOTS = [
    'mascot-3d/optimized',
    'mascot-3d/world/optimized',
    'mascot-3d/ui/optimized',
    'reward-assets/optimized',
] as const

/** Image extensions counted toward coverage / orphan analysis. */
export const IMAGE_EXTENSIONS: ReadonlySet<string> = new Set([
    '.webp',
    '.png',
    '.jpg',
    '.jpeg',
    '.svg',
])

/**
 * Forbidden folder tokens (Req 2.3). Registry values must never include
 * any of these substrings. Tokens are written with leading + trailing
 * slashes so a path like `/mascot-3d/raw/foo.png` is matched but a
 * fragment like `concept-art` is not.
 */
export const FORBIDDEN_FOLDER_TOKENS = [
    '/raw/',
    '/concept/',
    '/foundation/',
    '/reference-parts/',
] as const

/**
 * A registry entry is the (group, key, value) triple that the live
 * registry produces. Property 4 only inspects `value`, but `group`/`key`
 * are kept so reports can pinpoint the offending entry.
 */
export interface RegistryEntry {
    group: string
    key: string
    value: string
}

export interface ForbiddenRef {
    group: string
    key: string
    value: string
    matched: string
}

export interface OptimizedPreferenceIssue {
    group: string
    key: string
    value: string
    preferredWebp: string
}

export interface CoverageResult {
    /** Files on disk (optimized roots) — denominator. */
    denominator: number
    /** Files on disk that ARE referenced — numerator. */
    numerator: number
    /** numerator / denominator (or 1.0 when denominator == 0). */
    pct: number
}

// ---------------------------------------------------------------------------
// Pure invariants
// ---------------------------------------------------------------------------

/**
 * Coverage = |files on disk that the registry references|
 *            / (|files on disk| - |archived files on disk|).
 *
 * Recalibrated to credit/exclude archived files (listed in docs/design/asset-archive.md)
 * from the coverage denominator so that intentional asset storage does not count
 * against the 95% threshold: coverage = referenced / (total - archived).
 *
 * Empty input is treated as 1.0 (vacuous pass) so a fresh repo with no
 * optimized files yet does not fail the gate. This matches the live
 * script's behaviour.
 *
 * Validates: Req 2.1.
 */
export function computeCoverage(
    registryValues: Iterable<string>,
    optimizedFiles: ReadonlyArray<string>,
    archiveEntries?: Iterable<string>,
): CoverageResult {
    const referenced = new Set(registryValues)
    const archived = new Set(archiveEntries || [])
    let numerator = 0
    let archivedCount = 0
    for (const f of optimizedFiles) {
        if (referenced.has(f)) {
            numerator += 1
        } else if (archived.has(f)) {
            archivedCount += 1
        }
    }
    const denominator = optimizedFiles.length - archivedCount
    const pct = denominator <= 0 ? 1 : numerator / denominator
    return { denominator, numerator, pct }
}

/**
 * Orphans = optimized files that are neither referenced by the registry
 * NOR archived in `docs/design/asset-archive.md`. Files that are absent
 * from `optimizedFiles` cannot be orphans by definition (you cannot be
 * orphaned by a tree you do not live in), which gives us the invariant
 * "every optimized file is referenced OR archived OR absent" from the
 * task brief.
 *
 * Validates: Req 2.2, 2.5.
 */
export function findOrphans(
    optimizedFiles: ReadonlyArray<string>,
    registryValues: Iterable<string>,
    archiveEntries: Iterable<string>,
): string[] {
    const referenced = new Set(registryValues)
    const archived = new Set(archiveEntries)
    const orphans: string[] = []
    for (const f of optimizedFiles) {
        if (referenced.has(f)) continue
        if (archived.has(f)) continue
        orphans.push(f)
    }
    return orphans
}

/**
 * Forbidden refs = registry values pointing inside `raw/`, `concept/`,
 * `foundation/`, or `reference-parts/`. Substring match against
 * `FORBIDDEN_FOLDER_TOKENS` so the check is filesystem-agnostic.
 *
 * Validates: Req 2.3.
 */
export function findForbiddenRefs(
    entries: ReadonlyArray<RegistryEntry>,
): ForbiddenRef[] {
    const out: ForbiddenRef[] = []
    for (const entry of entries) {
        for (const token of FORBIDDEN_FOLDER_TOKENS) {
            if (entry.value.includes(token)) {
                out.push({
                    group: entry.group,
                    key: entry.key,
                    value: entry.value,
                    matched: token,
                })
                break
            }
        }
    }
    return out
}

/**
 * Build the "available webp basenames per directory" index that the
 * preference check consults. Pure over an array of public paths.
 */
export function buildWebpIndex(
    optimizedFiles: ReadonlyArray<string>,
): Map<string, Set<string>> {
    const idx = new Map<string, Set<string>>()
    for (const filePath of optimizedFiles) {
        if (!filePath.toLowerCase().endsWith('.webp')) continue
        const dir = path.posix.dirname(filePath)
        const base = path.posix.basename(filePath, path.posix.extname(filePath))
        let bucket = idx.get(dir)
        if (!bucket) {
            bucket = new Set()
            idx.set(dir, bucket)
        }
        bucket.add(base)
    }
    return idx
}

/**
 * Optimized-preference issues = registry values pointing to a `.png` /
 * `.jpg` / `.jpeg` while a sibling `.webp` with the same basename
 * exists in the same directory.
 *
 * Validates: Req 2.4.
 */
export function findOptimizedPreferenceIssues(
    entries: ReadonlyArray<RegistryEntry>,
    optimizedFiles: ReadonlyArray<string>,
): OptimizedPreferenceIssue[] {
    const webpIndex = buildWebpIndex(optimizedFiles)
    const issues: OptimizedPreferenceIssue[] = []
    for (const entry of entries) {
        const lower = entry.value.toLowerCase()
        if (
            !(lower.endsWith('.png') || lower.endsWith('.jpg') || lower.endsWith('.jpeg'))
        ) {
            continue
        }
        const dir = path.posix.dirname(entry.value)
        const base = path.posix.basename(entry.value, path.posix.extname(entry.value))
        const bucket = webpIndex.get(dir)
        if (bucket && bucket.has(base)) {
            issues.push({
                group: entry.group,
                key: entry.key,
                value: entry.value,
                preferredWebp: `${dir}/${base}.webp`,
            })
        }
    }
    return issues
}

/**
 * Convenience: full audit verdict over synthetic inputs. The live
 * script prefers the granular helpers above (so it can format a
 * detailed report); the test suite uses this aggregate to assert the
 * invariant in one shot.
 */
export interface AuditVerdict {
    coverage: CoverageResult
    orphans: string[]
    forbidden: ForbiddenRef[]
    preferenceIssues: OptimizedPreferenceIssue[]
    pass: boolean
}

export function auditInvariant(input: {
    optimizedFiles: ReadonlyArray<string>
    registryEntries: ReadonlyArray<RegistryEntry>
    archiveEntries: ReadonlyArray<string>
}): AuditVerdict {
    const registryValues = input.registryEntries.map((e) => e.value)
    const coverage = computeCoverage(registryValues, input.optimizedFiles, input.archiveEntries)
    const orphans = findOrphans(input.optimizedFiles, registryValues, input.archiveEntries)
    const forbidden = findForbiddenRefs(input.registryEntries)
    const preferenceIssues = findOptimizedPreferenceIssues(
        input.registryEntries,
        input.optimizedFiles,
    )
    const pass =
        coverage.pct >= COVERAGE_THRESHOLD &&
        orphans.length === 0 &&
        forbidden.length === 0 &&
        preferenceIssues.length === 0
    return { coverage, orphans, forbidden, preferenceIssues, pass }
}
