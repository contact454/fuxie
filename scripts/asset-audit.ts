/**
 * Asset Audit
 *
 * Walks the four "optimized" asset roots and the live Asset Registry to
 * enforce four invariants from Requirements 2.1–2.5:
 *
 *  1. **Coverage** — at least 95% of optimized files (`.webp|.png|.jpg|`
 *     `.jpeg|.svg`) under
 *       - apps/web/public/mascot-3d/optimized/
 *       - apps/web/public/mascot-3d/world/optimized/
 *       - apps/web/public/mascot-3d/ui/optimized/
 *       - apps/web/public/reward-assets/optimized/
 *     are referenced by at least one Asset Registry value (Req 2.1).
 *  2. **Orphan archive** — every optimized file that is *not* referenced by
 *     the registry must have an entry in `docs/design/asset-archive.md`
 *     (Req 2.2). Files that are neither referenced nor archived fail.
 *  3. **Forbidden folders** — no registry value may point inside
 *     `raw/`, `concept/`, `foundation/`, or `reference-parts/` (Req 2.3).
 *  4. **Optimized preference** — when a registry value is `.png`/`.jpg`/
 *     `.jpeg` and a sibling `.webp` with the same basename exists in the
 *     same directory, the registry must pick the `.webp` (Req 2.4).
 *
 * Notes on scope:
 *  - Coverage scans the four roots **recursively**. Versioned subfolders
 *    (e.g. `world/optimized/v1`, `world/optimized/v2`, `ui/optimized/v1`)
 *    contain the actual files, so a top-level-only walk would never see
 *    them. Recursive scanning matches the design.md audit diagram.
 *  - The archive doc may not exist yet (task 2.4 seeds it). When missing,
 *    the script treats the archive as empty (every unreferenced optimized
 *    file is therefore an orphan).
 *  - Output: `tmp/asset-audit.md` summarising coverage, orphans, forbidden
 *    references, and optimized-preference issues. Exit code is `0` on
 *    pass, `1` on any violation.
 *
 * The four invariant predicates live in `scripts/asset-audit-core.ts`
 * so both this script and the property-based test (task 2.8 →
 * `tests/asset-registry.spec.ts` Property 4) drive the *same* logic.
 *
 * Note on FOUNDATION (Decision 2 of `asset-registry-cleanup`):
 * `FUXIE_FOUNDATION_ASSETS` is intentionally excluded from the registry
 * entries `collectRegistryEntries` returns. The map lives in
 * `scripts/foundation-assets.ts` for tooling/DSD use and is NOT a
 * production registry reference, so `findForbiddenRefs` no longer flags
 * its `/mascot-3d/foundation/v1/...` paths. The physical files on disk
 * are still visible to the recursive coverage walk, but they fall under
 * the orphan/archive workflow rather than the forbidden-folder check.
 *
 * Wired as `pnpm check:asset-audit`.
 *
 * Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5, 18.1
 */

import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import path from 'node:path'

import {
    FUXIE_3D_ASSETS,
    FUXIE_GAMIFICATION_MASCOTS,
    FUXIE_LIVING_3D_ASSETS,
    FUXIE_MASCOT_STATES,
    FUXIE_MODULE_MASCOTS,
    FUXIE_UI_FRAMES,
    FUXIE_WORLD_PROPS,
} from '../apps/web/src/lib/mascot/fuxie-assets'
import { REWARD_ASSETS } from '../apps/web/src/components/gamification/reward-assets'
// FOUNDATION map is intentionally NOT imported here (Decision 2 of
// asset-registry-cleanup). The 8 `/mascot-3d/foundation/v1/...`
// reference-sheet paths live in `scripts/foundation-assets.ts` so the
// production surface that `collectRegistryEntries` scans excludes them —
// `findForbiddenRefs` therefore returns 0 entries for FOUNDATION. The
// physical files on disk still appear in the coverage / preference checks
// (which walk `apps/web/public/`), so they remain visible to the audit but
// are no longer counted as production registry references.
import {
    COVERAGE_THRESHOLD,
    ForbiddenRef,
    IMAGE_EXTENSIONS,
    OPTIMIZED_ROOTS,
    OptimizedPreferenceIssue,
    RegistryEntry,
    computeCoverage,
    findForbiddenRefs,
    findOptimizedPreferenceIssues,
    findOrphans,
} from './asset-audit-core'

const PUBLIC_ROOT = path.join('apps', 'web', 'public')
const ARCHIVE_DOC = path.join('docs', 'design', 'asset-archive.md')
const REPORT_PATH = path.join('tmp', 'asset-audit.md')

interface AuditResult {
    coveragePct: number
    coverageDenominator: number
    coverageNumerator: number
    referencedNotOnDisk: string[]
    orphans: string[]
    forbiddenRefs: ForbiddenRef[]
    optimizedPreferenceIssues: OptimizedPreferenceIssue[]
    archiveExists: boolean
    archiveEntries: number
}

/**
 * Convert a public path (`/foo/bar.webp`) to an absolute filesystem path
 * under `apps/web/public/`.
 */
function toFsPath(publicPath: string): string {
    const stripped = publicPath.startsWith('/') ? publicPath.slice(1) : publicPath
    return path.join(PUBLIC_ROOT, stripped)
}

/**
 * Convert a filesystem path under `apps/web/public/` to a public path
 * (`/foo/bar.webp`) using forward slashes — matching how registry values
 * are written.
 */
function toPublicPath(fsPath: string): string {
    const rel = path.relative(PUBLIC_ROOT, fsPath).split(path.sep).join('/')
    return `/${rel}`
}

/**
 * Recursively list image files under a directory. Returns public paths
 * (with leading slash, forward-slash separator). Missing directories are
 * silently skipped — they simply contribute zero files.
 */
function listImagesRecursively(rootPublicDir: string): string[] {
    const fsRoot = path.join(PUBLIC_ROOT, rootPublicDir)
    if (!existsSync(fsRoot)) return []

    const out: string[] = []
    const stack: string[] = [fsRoot]
    while (stack.length > 0) {
        const dir = stack.pop() as string
        let entries: ReturnType<typeof readdirSync>
        try {
            entries = readdirSync(dir, { withFileTypes: true })
        } catch {
            continue
        }
        for (const entry of entries) {
            const full = path.join(dir, entry.name)
            if (entry.isDirectory()) {
                stack.push(full)
                continue
            }
            if (!entry.isFile()) continue
            const ext = path.extname(entry.name).toLowerCase()
            if (!IMAGE_EXTENSIONS.has(ext)) continue
            out.push(toPublicPath(full))
        }
    }
    return out.sort()
}

/**
 * Collect every (group, key, value) triple from the seven registry maps.
 * `FUXIE_LIVING_3D_ASSETS.frames` is an array; everything else is a string.
 */
function collectRegistryEntries(): RegistryEntry[] {
    const out: RegistryEntry[] = []

    const stringMaps: Array<[string, Readonly<Record<string, string>>]> = [
        ['FUXIE_MASCOT_STATES', FUXIE_MASCOT_STATES],
        ['FUXIE_MODULE_MASCOTS', FUXIE_MODULE_MASCOTS],
        ['FUXIE_GAMIFICATION_MASCOTS', FUXIE_GAMIFICATION_MASCOTS],
        ['FUXIE_WORLD_PROPS', FUXIE_WORLD_PROPS],
        ['FUXIE_UI_FRAMES', FUXIE_UI_FRAMES],
        ['FUXIE_3D_ASSETS', FUXIE_3D_ASSETS],
        ['REWARD_ASSETS', REWARD_ASSETS],
    ]

    for (const [group, map] of stringMaps) {
        for (const [key, value] of Object.entries(map)) {
            out.push({ group, key, value })
        }
    }

    // Living 3D map mixes strings and arrays.
    for (const [key, value] of Object.entries(FUXIE_LIVING_3D_ASSETS)) {
        if (Array.isArray(value)) {
            value.forEach((framePath, idx) => {
                out.push({
                    group: 'FUXIE_LIVING_3D_ASSETS',
                    key: `${key}[${idx}]`,
                    value: framePath,
                })
            })
        } else if (typeof value === 'string') {
            out.push({ group: 'FUXIE_LIVING_3D_ASSETS', key, value })
        }
    }

    return out
}

/**
 * Parse `docs/design/asset-archive.md` into the set of archived public
 * paths. The doc is expected to be a Markdown table whose first column is
 * the path (e.g. `/mascot-3d/optimized/foo-512.webp`). Header and divider
 * rows are skipped. If the file is missing the archive is treated as
 * empty.
 */
function parseArchiveEntries(): { entries: Set<string>; exists: boolean } {
    if (!existsSync(ARCHIVE_DOC)) {
        return { entries: new Set(), exists: false }
    }
    const raw = readFileSync(ARCHIVE_DOC, 'utf8')
    const entries = new Set<string>()
    for (const line of raw.split(/\r?\n/)) {
        const trimmed = line.trim()
        if (!trimmed.startsWith('|')) continue
        // First non-empty column.
        const cols = trimmed.split('|').map((c) => c.trim()).filter((c) => c.length > 0)
        if (cols.length === 0) continue
        const first = cols[0]
        // Skip header (`Path | ...`) and divider (`---- | ...`).
        if (!first.startsWith('/')) continue
        if (/^[-: ]+$/.test(first)) continue
        entries.add(first)
    }
    return { entries, exists: true }
}

function ensureDir(dir: string): void {
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
}

function formatList(items: readonly string[], emptyLabel = '_(none)_'): string {
    if (items.length === 0) return emptyLabel
    return items.map((i) => `- \`${i}\``).join('\n')
}

function formatForbiddenList(items: readonly ForbiddenRef[]): string {
    if (items.length === 0) return '_(none)_'
    return items
        .map(
            (i) =>
                `- \`${i.group}.${i.key}\` → \`${i.value}\` (matched \`${i.matched}\`)`,
        )
        .join('\n')
}

function formatPreferenceList(items: readonly OptimizedPreferenceIssue[]): string {
    if (items.length === 0) return '_(none)_'
    return items
        .map(
            (i) =>
                `- \`${i.group}.${i.key}\` → \`${i.value}\` (prefer \`${i.preferredWebp}\`)`,
        )
        .join('\n')
}

function buildReport(result: AuditResult): string {
    const status =
        result.coveragePct >= COVERAGE_THRESHOLD &&
        result.orphans.length === 0 &&
        result.forbiddenRefs.length === 0 &&
        result.optimizedPreferenceIssues.length === 0
            ? '✅ PASS'
            : '❌ FAIL'

    const coveragePctStr = (result.coveragePct * 100).toFixed(2)
    const archiveStatus = result.archiveExists
        ? `present (${result.archiveEntries} entries)`
        : '**missing** — every unreferenced optimized file is treated as an orphan'

    return `# Asset Audit Report

Status: ${status}

Roots scanned (recursive):
${OPTIMIZED_ROOTS.map((r) => `- \`apps/web/public/${r}/\``).join('\n')}

Archive doc: \`${ARCHIVE_DOC}\` — ${archiveStatus}

## Coverage (Req 2.1)

- Threshold: ≥ ${(COVERAGE_THRESHOLD * 100).toFixed(0)}%
- Files on disk: ${result.coverageDenominator}
- Files referenced by registry: ${result.coverageNumerator}
- Coverage: **${coveragePctStr}%** ${result.coveragePct >= COVERAGE_THRESHOLD ? '✓' : '✗'}

## Orphans (Req 2.2)

Optimized files that are not referenced by the registry **and** not listed
in \`${ARCHIVE_DOC}\`. Resolve by either wiring the file into a registry
key or adding an archive entry.

${formatList(result.orphans)}

## Forbidden folder references (Req 2.3)

Registry values inside \`raw/\`, \`concept/\`, \`foundation/\`, or
\`reference-parts/\` are not allowed.

${formatForbiddenList(result.forbiddenRefs)}

## Optimized-preference issues (Req 2.4)

Registry values that point at \`.png\`/\`.jpg\`/\`.jpeg\` while a sibling
\`.webp\` with the same basename exists in the same directory. The
registry must prefer the \`.webp\`.

${formatPreferenceList(result.optimizedPreferenceIssues)}

## Registry references missing on disk

(These are normally caught by \`pnpm check:asset-integrity\` but are
listed here for completeness; they do **not** count toward orphans.)

${formatList(result.referencedNotOnDisk)}
`
}

function main(): void {
    const allOptimizedFiles = OPTIMIZED_ROOTS.flatMap((root) => listImagesRecursively(root))
    const entries = collectRegistryEntries()
    const registryValues = entries.map((e) => e.value)
    const archive = parseArchiveEntries()

    // Coverage: how many optimized files on disk are referenced by the registry.
    const coverage = computeCoverage(registryValues, allOptimizedFiles, archive.entries)

    // Referenced-but-missing-on-disk: useful diagnostic only.
    const referencedNotOnDisk: string[] = []
    for (const entry of entries) {
        const fs = toFsPath(entry.value)
        let exists = false
        try {
            exists = existsSync(fs) && statSync(fs).isFile()
        } catch {
            exists = false
        }
        if (!exists) referencedNotOnDisk.push(`${entry.group}.${entry.key} → ${entry.value}`)
    }

    // Orphans: optimized files on disk, not referenced, not archived.
    const orphans = findOrphans(allOptimizedFiles, registryValues, archive.entries)

    // Forbidden folder references.
    const forbiddenRefs = findForbiddenRefs(entries)

    // Optimized webp preference.
    const optimizedPreferenceIssues = findOptimizedPreferenceIssues(entries, allOptimizedFiles)

    const result: AuditResult = {
        coveragePct: coverage.pct,
        coverageDenominator: coverage.denominator,
        coverageNumerator: coverage.numerator,
        referencedNotOnDisk,
        orphans,
        forbiddenRefs,
        optimizedPreferenceIssues,
        archiveExists: archive.exists,
        archiveEntries: archive.entries.size,
    }

    ensureDir(path.dirname(REPORT_PATH))
    writeFileSync(REPORT_PATH, buildReport(result), 'utf8')

    const failures: string[] = []
    if (coverage.pct < COVERAGE_THRESHOLD) {
        failures.push(
            `coverage ${(coverage.pct * 100).toFixed(2)}% < threshold ${(COVERAGE_THRESHOLD * 100).toFixed(0)}% ` +
                `(${coverage.numerator}/${coverage.denominator} optimized files referenced)`,
        )
    }
    if (orphans.length > 0) {
        failures.push(`${orphans.length} orphan file(s) not referenced and not archived`)
    }
    if (forbiddenRefs.length > 0) {
        failures.push(`${forbiddenRefs.length} registry value(s) inside forbidden folders`)
    }
    if (optimizedPreferenceIssues.length > 0) {
        failures.push(
            `${optimizedPreferenceIssues.length} registry value(s) using non-webp when an optimized webp exists`,
        )
    }

    if (failures.length === 0) {
        console.log(
            `check:asset-audit OK — coverage ${(coverage.pct * 100).toFixed(2)}% ` +
                `(${coverage.numerator}/${coverage.denominator}), 0 orphans, 0 forbidden, ` +
                `0 optimized-preference issues. Report → ${REPORT_PATH}`,
        )
        process.exit(0)
    }

    console.error('check:asset-audit FAILED:')
    for (const f of failures) console.error(`  - ${f}`)
    if (orphans.length > 0) {
        console.error('\nOrphans (first 20 shown):')
        for (const o of orphans.slice(0, 20)) console.error(`  ${o}`)
        if (orphans.length > 20) console.error(`  …and ${orphans.length - 20} more.`)
    }
    if (forbiddenRefs.length > 0) {
        console.error('\nForbidden references:')
        for (const f of forbiddenRefs) console.error(`  ${f.group}.${f.key} → ${f.value} (${f.matched})`)
    }
    if (optimizedPreferenceIssues.length > 0) {
        console.error('\nOptimized-preference issues:')
        for (const i of optimizedPreferenceIssues) {
            console.error(`  ${i.group}.${i.key} → ${i.value} (prefer ${i.preferredWebp})`)
        }
    }
    console.error(`\nReport written to ${REPORT_PATH}`)
    process.exit(1)
}

main()
