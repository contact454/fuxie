/**
 * Visual Audit Pack Acceptance Check — `pnpm check:visual-audit`
 *
 * Vai chinh: QA Automation Engineer
 * Vai phoi hop: Frontend Engineer (PNG review post-capture),
 *               Project Manager / Delivery Manager (DoD pack flip ownership)
 *
 * Spec source-of-truth:
 *   - .kiro/specs/visual-qa-screenshot-capture/requirements.md
 *     (Req 12.1, 12.2, 12.3, 12.4, 12.5, Req 6.3, 6.4, 6.5)
 *   - .kiro/specs/visual-qa-screenshot-capture/design.md — Decision 6
 *     (the four invariants below).
 *   - .kiro/specs/visual-qa-screenshot-capture/tasks.md — Task 8.1.
 *
 * Decision 6 — four invariants enforced by this script. On any violation the
 * script prints a precise file:line list per invariant and exits non-zero.
 *
 *   I1. Zero `(PENDING capture)` AND `(PENDING)` markers anywhere under
 *       `docs/design/visual-audit/qa-runs/2026-05-16/`. Both the long form
 *       (`(PENDING capture)`) and the short form (`(PENDING)`) are caught
 *       via the regex `\(PENDING( capture)?\)` so a stray short marker
 *       cannot slip through.
 *
 *   I2. Every `evidencePath` referenced by any Checklist_File OR by the
 *       Capture_Manifest has a matching PNG file at
 *       `<qa-runs/2026-05-16>/<evidencePath>`.
 *
 *   I3. Every PNG file under
 *       `qa-runs/2026-05-16/screenshots/<surface>/*.png` is referenced by
 *       BOTH at least one Checklist_File AND the Capture_Manifest. (Symmetric
 *       to I2 — together they enforce a bijection between
 *       <evidencePath in checklist + manifest> and <PNG on disk>.)
 *
 *       Sandbox tolerance: when zero PNG files are present (Phase 5 has not
 *       yet been executed), I3 is skipped with an explanatory note so the
 *       script still reports the I1/I2 violations actionably without
 *       crashing on an empty `screenshots/` tree.
 *
 *   I4. Every PNG begins with the canonical PNG magic bytes
 *       `89 50 4E 47 0D 0A 1A 0A` at offset 0 (a partial-write or
 *       file-extension mistake would leave a non-PNG payload).
 *
 * Wired into `pnpm check:quick` after `test:property` (Req 12.5) so the
 * acceptance gate runs LAST and existing checks still fail-fast.
 *
 * Usage:
 *   tsx scripts/check-visual-audit-pack.ts
 *
 * Validates: Requirements 12.1, 12.2, 12.3, 12.4, 12.5, 6.3, 6.4, 6.5.
 */

import { readdirSync, readFileSync, statSync, openSync, readSync, closeSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

// --------------------------------------------------------------------------
// Constants
// --------------------------------------------------------------------------

/** Folder under audit. Relative to the workspace root. */
const VISUAL_AUDIT_FOLDER = 'docs/design/visual-audit/qa-runs/2026-05-16'

/** Capture_Manifest authored in Phase 1 (Task 2.1). */
const MANIFEST_PATH = 'tests/integration/visual-capture.manifest.json'

/** PNG magic bytes per RFC 2083 §3.1. */
const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])

/**
 * Catches BOTH the long-form `(PENDING capture)` marker (12 occurrences in
 * the 2026-05-16 baseline) AND the short-form `(PENDING)` marker
 * (110 occurrences in the same baseline). The trailing `g` flag is required
 * so `String.matchAll` yields every occurrence on a multi-line file read.
 */
const PENDING_REGEX = /\(PENDING( capture)?\)/g

/**
 * Matches `evidencePath` references inside a Checklist_File, e.g.
 *   `screenshots/dashboard/dashboard-default-mobile.png`
 *
 * The pattern intentionally constrains to:
 *   - lowercase `screenshots/` prefix
 *   - `<surface>/<surface>-<state>-<viewport>.png` shape
 *   - `<surface>` matches `[a-z][a-z0-9-]*`
 *   - `<state>`   matches `[a-z][a-z0-9-]*`
 *   - `<viewport>` matches `mobile` or `desktop`
 *
 * The `g` flag is required so we can extract every reference on the same
 * line via `String.matchAll`.
 */
const EVIDENCE_PATH_REGEX = /screenshots\/[a-z][a-z0-9-]*\/[a-z][a-z0-9-]*-[a-z][a-z0-9-]*-(?:mobile|desktop)\.png/g

// --------------------------------------------------------------------------
// Types
// --------------------------------------------------------------------------

interface ManifestEntry {
    surface: string
    state: string
    viewport: string
    route: string
    evidencePath: string
    requiresSeed: boolean
    stateDriver?: unknown
}

interface PendingViolation {
    /** workspace-relative path */
    file: string
    /** 1-based line number */
    line: number
    /** the literal marker found, e.g. `(PENDING)` or `(PENDING capture)` */
    marker: string
}

interface MissingPngViolation {
    /** workspace-relative path of the PNG that should exist */
    expectedPng: string
    /**
     * One or more "<file>:<line>" pointers (or `<MANIFEST_PATH>:<index>` for
     * manifest-only references). Always non-empty.
     */
    referencedBy: string[]
}

interface OrphanPngViolation {
    /** workspace-relative path of the PNG that has no manifest+checklist ref */
    pngPath: string
    /** human-readable reason, e.g. "missing from manifest" */
    reason: string
}

interface InvalidMagicViolation {
    /** workspace-relative path of the PNG with bad header */
    pngPath: string
    /** the actual first 8 bytes, hex-encoded with single spaces */
    actualBytes: string
}

// --------------------------------------------------------------------------
// I/O helpers
// --------------------------------------------------------------------------

/** Read + parse the Capture_Manifest. */
function loadManifest(): ManifestEntry[] {
    const raw = readFileSync(MANIFEST_PATH, 'utf8')
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) {
        throw new Error(`[check:visual-audit] manifest at ${MANIFEST_PATH} is not a JSON array`)
    }
    // Light structural type guard. The full schema is enforced by the
    // manifest validator (Task 2.2) and the property tests (Task 10.1);
    // here we only assert the fields this script reads.
    return parsed.map((entry, i) => {
        if (typeof entry !== 'object' || entry === null) {
            throw new Error(`[check:visual-audit] manifest entry ${i} is not an object`)
        }
        const e = entry as Record<string, unknown>
        const surface = e.surface
        const state = e.state
        const viewport = e.viewport
        const route = e.route
        const evidencePath = e.evidencePath
        const requiresSeed = e.requiresSeed
        if (
            typeof surface !== 'string' ||
            typeof state !== 'string' ||
            typeof viewport !== 'string' ||
            typeof route !== 'string' ||
            typeof evidencePath !== 'string' ||
            typeof requiresSeed !== 'boolean'
        ) {
            throw new Error(
                `[check:visual-audit] manifest entry ${i} is missing one of: surface, state, viewport, route, evidencePath, requiresSeed`,
            )
        }
        const out: ManifestEntry = { surface, state, viewport, route, evidencePath, requiresSeed }
        if (e.stateDriver !== undefined) {
            out.stateDriver = e.stateDriver
        }
        return out
    })
}

/** List all `<surface>.md` Checklist_Files (excluding `README.md`). */
function listChecklistFiles(): string[] {
    const entries = readdirSync(VISUAL_AUDIT_FOLDER)
    return entries
        .filter((name) => name.endsWith('.md') && name !== 'README.md')
        .map((name) => path.join(VISUAL_AUDIT_FOLDER, name))
        .sort()
}

/**
 * Extract every `screenshots/<surface>/<surface>-<state>-<viewport>.png`
 * reference from a Checklist_File. Returns workspace-relative paths
 * (i.e. `screenshots/...` — NOT prefixed with `VISUAL_AUDIT_FOLDER/`).
 */
function extractEvidencePathsFromChecklist(filePath: string): string[] {
    const text = readFileSync(filePath, 'utf8')
    const out = new Set<string>()
    for (const match of text.matchAll(EVIDENCE_PATH_REGEX)) {
        out.add(match[0])
    }
    return [...out].sort()
}

/**
 * Recursive walk of `<VISUAL_AUDIT_FOLDER>/screenshots/**\/*.png`.
 *
 * Returns paths relative to `VISUAL_AUDIT_FOLDER` (so each entry is
 * directly comparable to a `manifest.evidencePath`). When the
 * `screenshots/` folder does not exist (Phase 5 has not been run yet in
 * the current sandbox) the function returns an empty list — I3 reacts to
 * this by skipping the orphan check.
 */
function listPNGFiles(): string[] {
    const root = path.join(VISUAL_AUDIT_FOLDER, 'screenshots')
    let rootStat
    try {
        rootStat = statSync(root)
    } catch {
        return []
    }
    if (!rootStat.isDirectory()) {
        return []
    }
    const out: string[] = []
    const stack: string[] = [root]
    while (stack.length > 0) {
        const dir = stack.pop()!
        for (const name of readdirSync(dir)) {
            const full = path.join(dir, name)
            const st = statSync(full)
            if (st.isDirectory()) {
                stack.push(full)
            } else if (st.isFile() && name.toLowerCase().endsWith('.png')) {
                // Normalise to forward slashes so the comparison with
                // `evidencePath` (which always uses `/`) is portable
                // across Windows / POSIX.
                const rel = path.relative(VISUAL_AUDIT_FOLDER, full).split(path.sep).join('/')
                out.push(rel)
            }
        }
    }
    out.sort()
    return out
}

// --------------------------------------------------------------------------
// Invariants
// --------------------------------------------------------------------------

/**
 * I1. Zero `(PENDING capture)` AND `(PENDING)` markers under
 * `docs/design/visual-audit/qa-runs/2026-05-16/`.
 *
 * The check intentionally does NOT fail-fast on the first match — every
 * occurrence is collected so the operator sees the full picture in one
 * acceptance run.
 */
function checkI1(checklistFiles: string[]): PendingViolation[] {
    const violations: PendingViolation[] = []
    for (const file of checklistFiles) {
        const text = readFileSync(file, 'utf8')
        const lines = text.split(/\r?\n/)
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i]!
            // Reset lastIndex for safety since PENDING_REGEX is /g.
            PENDING_REGEX.lastIndex = 0
            for (const match of line.matchAll(PENDING_REGEX)) {
                violations.push({
                    file: file.split(path.sep).join('/'),
                    line: i + 1,
                    marker: match[0],
                })
            }
        }
    }
    return violations
}

/**
 * I2. Every `evidencePath` referenced by any Checklist_File OR by the
 * manifest has a matching PNG on disk.
 *
 * The `pngsOnDisk` set must contain workspace-relative paths anchored at
 * `VISUAL_AUDIT_FOLDER` (i.e. `screenshots/...`).
 */
function checkI2(
    manifest: ManifestEntry[],
    checklistFiles: string[],
    pngsOnDisk: Set<string>,
): MissingPngViolation[] {
    // path → list of "<file>:<line>" pointers
    const referencedBy = new Map<string, string[]>()

    // Manifest references
    for (let i = 0; i < manifest.length; i++) {
        const entry = manifest[i]!
        const list = referencedBy.get(entry.evidencePath) ?? []
        list.push(`${MANIFEST_PATH}:[${i}]`)
        referencedBy.set(entry.evidencePath, list)
    }

    // Checklist references — record file:line so the operator can jump to
    // the exact place that needs a captured PNG.
    for (const file of checklistFiles) {
        const text = readFileSync(file, 'utf8')
        const lines = text.split(/\r?\n/)
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i]!
            for (const match of line.matchAll(EVIDENCE_PATH_REGEX)) {
                const evidencePath = match[0]
                const list = referencedBy.get(evidencePath) ?? []
                list.push(`${file.split(path.sep).join('/')}:${i + 1}`)
                referencedBy.set(evidencePath, list)
            }
        }
    }

    const violations: MissingPngViolation[] = []
    // Sort for deterministic output.
    const refKeys = [...referencedBy.keys()].sort()
    for (const evidencePath of refKeys) {
        if (!pngsOnDisk.has(evidencePath)) {
            violations.push({
                expectedPng: evidencePath,
                referencedBy: referencedBy.get(evidencePath)!,
            })
        }
    }
    return violations
}

/**
 * I3. Every PNG under `qa-runs/2026-05-16/screenshots/**\/*.png` is
 * referenced by both at least one Checklist_File AND the manifest.
 *
 * Skipped when zero PNGs exist (Phase 5 has not been run yet).
 */
function checkI3(
    manifest: ManifestEntry[],
    checklistFiles: string[],
    pngsOnDisk: string[],
): OrphanPngViolation[] {
    if (pngsOnDisk.length === 0) {
        return []
    }
    const manifestRefs = new Set<string>(manifest.map((e) => e.evidencePath))
    const checklistRefs = new Set<string>()
    for (const file of checklistFiles) {
        for (const ev of extractEvidencePathsFromChecklist(file)) {
            checklistRefs.add(ev)
        }
    }
    const violations: OrphanPngViolation[] = []
    for (const png of pngsOnDisk) {
        const inManifest = manifestRefs.has(png)
        const inChecklist = checklistRefs.has(png)
        if (!inManifest && !inChecklist) {
            violations.push({ pngPath: png, reason: 'missing from manifest AND every checklist' })
        } else if (!inManifest) {
            violations.push({ pngPath: png, reason: 'missing from manifest' })
        } else if (!inChecklist) {
            violations.push({ pngPath: png, reason: 'missing from every checklist' })
        }
    }
    return violations
}

/**
 * I4. Every PNG begins with the magic bytes `89 50 4E 47 0D 0A 1A 0A`
 * at offset 0.
 *
 * Reads ONLY the first 8 bytes — the script must stay fast on a folder
 * with dozens of multi-MB PNGs.
 */
function checkI4(pngsOnDisk: string[]): InvalidMagicViolation[] {
    const violations: InvalidMagicViolation[] = []
    const buf = Buffer.alloc(8)
    for (const png of pngsOnDisk) {
        const abs = path.join(VISUAL_AUDIT_FOLDER, png)
        const fd = openSync(abs, 'r')
        let read = 0
        try {
            read = readSync(fd, buf, 0, 8, 0)
        } finally {
            closeSync(fd)
        }
        if (read !== 8 || !buf.equals(PNG_MAGIC)) {
            const actual = Array.from(buf.subarray(0, read))
                .map((b) => b.toString(16).padStart(2, '0'))
                .join(' ')
            violations.push({ pngPath: png, actualBytes: actual })
        }
    }
    return violations
}

// --------------------------------------------------------------------------
// main
// --------------------------------------------------------------------------

function formatI1(violations: PendingViolation[]): string {
    const lines = [`[check:visual-audit] I1 FAILED — found ${violations.length} PENDING marker(s):`]
    for (const v of violations) {
        lines.push(`  - ${v.file}:${v.line}  ${v.marker}`)
    }
    return lines.join('\n')
}

function formatI2(violations: MissingPngViolation[]): string {
    const lines = [
        `[check:visual-audit] I2 FAILED — found ${violations.length} evidencePath(s) without a matching PNG:`,
    ]
    for (const v of violations) {
        lines.push(`  - ${VISUAL_AUDIT_FOLDER}/${v.expectedPng}`)
        for (const ref of v.referencedBy) {
            lines.push(`      referenced by ${ref}`)
        }
    }
    return lines.join('\n')
}

function formatI3(violations: OrphanPngViolation[]): string {
    const lines = [
        `[check:visual-audit] I3 FAILED — found ${violations.length} orphan PNG file(s):`,
    ]
    for (const v of violations) {
        lines.push(`  - ${VISUAL_AUDIT_FOLDER}/${v.pngPath}  (${v.reason})`)
    }
    return lines.join('\n')
}

function formatI4(violations: InvalidMagicViolation[]): string {
    const lines = [
        `[check:visual-audit] I4 FAILED — found ${violations.length} PNG(s) with invalid magic bytes:`,
        `  expected first 8 bytes: 89 50 4e 47 0d 0a 1a 0a`,
    ]
    for (const v of violations) {
        lines.push(`  - ${VISUAL_AUDIT_FOLDER}/${v.pngPath}  actual: ${v.actualBytes}`)
    }
    return lines.join('\n')
}

function main(): number {
    const manifest = loadManifest()
    const checklistFiles = listChecklistFiles()
    const pngsOnDisk = listPNGFiles()
    const pngsOnDiskSet = new Set(pngsOnDisk)

    const i1 = checkI1(checklistFiles)
    const i2 = checkI2(manifest, checklistFiles, pngsOnDiskSet)
    const i3 = checkI3(manifest, checklistFiles, pngsOnDisk)
    const i4 = checkI4(pngsOnDisk)

    const failed = i1.length > 0 || i2.length > 0 || i3.length > 0 || i4.length > 0

    if (!failed) {
        if (pngsOnDisk.length === 0) {
            // Sandbox-friendly success path: I1 passed (no PENDING markers
            // remaining), and I2/I3/I4 are vacuously satisfied because no
            // captures exist yet. Surface this clearly so the operator
            // doesn't mistake the green for "captures already in place".
            console.log(
                '[check:visual-audit] OK — 0 PNG files found (run `pnpm test:integration:capture` first), 4 invariants vacuously pass.',
            )
        } else {
            console.log(
                `[check:visual-audit] OK — ${pngsOnDisk.length} PNG(s) verified, all 4 invariants pass.`,
            )
        }
        return 0
    }

    // Failure path. Print every invariant that failed, in order.
    if (i1.length > 0) console.error(formatI1(i1))
    if (i2.length > 0) console.error(formatI2(i2))
    if (i3.length > 0) console.error(formatI3(i3))
    if (i4.length > 0) console.error(formatI4(i4))

    if (pngsOnDisk.length === 0) {
        console.error(
            '[check:visual-audit] note: 0 PNG files found under ' +
                `${VISUAL_AUDIT_FOLDER}/screenshots/ — I3 was skipped. Run \`pnpm test:integration:capture\` to produce captures.`,
        )
    }

    const total = i1.length + i2.length + i3.length + i4.length
    console.error(
        `[check:visual-audit] FAILED — ${total} violation(s) across` +
            ` I1=${i1.length} I2=${i2.length} I3=${i3.length} I4=${i4.length}.`,
    )
    return 1
}

// Entrypoint guard: only run main() when invoked directly via tsx/node, not
// when imported by a test. ESM-friendly equivalent of `require.main === module`.
const isDirectInvocation = (() => {
    try {
        const thisFile = fileURLToPath(import.meta.url)
        const argv1 = process.argv[1]
        if (!argv1) return false
        return path.resolve(thisFile) === path.resolve(argv1)
    } catch {
        return false
    }
})()

if (isDirectInvocation) {
    process.exit(main())
}

// Exports for unit tests and Property tests (Task 10.x can depend on these).
export {
    VISUAL_AUDIT_FOLDER,
    MANIFEST_PATH,
    PNG_MAGIC,
    PENDING_REGEX,
    EVIDENCE_PATH_REGEX,
    loadManifest,
    listChecklistFiles,
    extractEvidencePathsFromChecklist,
    listPNGFiles,
    checkI1,
    checkI2,
    checkI3,
    checkI4,
    main,
}
export type { ManifestEntry, PendingViolation, MissingPngViolation, OrphanPngViolation, InvalidMagicViolation }
