/**
 * Asset Registry Reference Lint
 *
 * Walks `apps/web/src/**\/*.{ts,tsx}` and fails if any source file (other than
 * the asset registry files themselves and their tests) contains a hardcoded
 * string literal starting with one of the forbidden public-asset prefixes:
 *
 *   /mascot-3d/        (covers raw, concept, reference-parts, foundation, ...)
 *   /reward-assets/    (covers raw and any sub-folder)
 *
 * Components must instead resolve paths through the Asset Registry helpers
 * exported by `fuxie-assets.ts`, `fuxie-global-assets.ts`, and
 * `reward-assets.ts`.
 *
 * Usage: `pnpm lint:asset-paths`
 *
 * A line ending the comment `// asset-registry-allow` is skipped (escape hatch
 * for the rare cases where a literal cannot be avoided, e.g. fixture data).
 *
 * Validates: Requirements 1.3
 */

import { readdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

interface Violation {
    file: string
    line: number
    literal: string
}

// Files that legitimately contain forbidden prefixes (the registries
// themselves and their co-located tests). Matched by basename.
//
// Exported so property tests (tests/asset-discipline.spec.ts) can reuse the
// exact same allow-list the production lint enforces. Adding to this set
// requires updating Property 2 fixtures.
export const EXCLUDED_BASENAMES: ReadonlySet<string> = new Set<string>([
    'fuxie-assets.ts',
    'fuxie-global-assets.ts',
    'fuxie-world-tags.ts',
    'reward-assets.ts',
    'fuxie-assets.test.ts',
    'fuxie-assets.spec.ts',
    'fuxie-global-assets.test.ts',
    'fuxie-global-assets.spec.ts',
    'fuxie-world-tags.test.ts',
    'fuxie-world-tags.spec.ts',
    'reward-assets.test.ts',
    'reward-assets.spec.ts',
])

const SCAN_EXTENSIONS = new Set(['.ts', '.tsx'])
export const ALLOW_COMMENT = '// asset-registry-allow'

// String literals (single quote, double quote, or backtick) whose content
// starts with one of the forbidden prefixes. Capturing group 2 is the literal
// content (without the surrounding quotes).
//
// Exposed as a factory so callers don't share regex state (`lastIndex`
// mutation across `exec` calls). The pattern is sourced from a single
// constant string so the lint script and the Property 2 generator stay in
// lockstep.
export const FORBIDDEN_LITERAL_PATTERN =
    "(['\"`])(\\/(?:mascot-3d|reward-assets)\\/[^'\"`\\r\\n]*)\\1"

const FORBIDDEN_LITERAL = new RegExp(FORBIDDEN_LITERAL_PATTERN, 'g')

/**
 * Return every forbidden string literal that appears on a single source line.
 *
 * Pure, allocation-only helper — does not touch the filesystem. Used by both
 * the `runLint` walker and the Property 2 property test
 * (`tests/asset-discipline.spec.ts`) so the AST scanner and the production
 * lint share one classifier.
 *
 * Lines containing the {@link ALLOW_COMMENT} escape hatch are treated as
 * having zero violations, mirroring `scanFile` below.
 */
export function findForbiddenLiterals(line: string): string[] {
    if (line.includes(ALLOW_COMMENT)) return []
    const re = new RegExp(FORBIDDEN_LITERAL_PATTERN, 'g')
    const out: string[] = []
    let match: RegExpExecArray | null
    while ((match = re.exec(line)) !== null) {
        out.push(match[2])
    }
    return out
}

/**
 * Decide whether a file's basename should be excluded from the
 * forbidden-literal scan. Pure helper — exported for property tests.
 *
 * @param basename The basename of the file (e.g. `fuxie-assets.ts`). Callers
 *                 are expected to pass `path.basename(filepath)` so this
 *                 stays portable across `/` and `\\` separators.
 */
export function isExcludedBasename(basename: string): boolean {
    return EXCLUDED_BASENAMES.has(basename)
}

function walk(dir: string, out: string[] = []): string[] {
    let entries: import('node:fs').Dirent[]
    try {
        entries = readdirSync(dir, { withFileTypes: true })
    } catch {
        return out
    }

    for (const entry of entries) {
        const full = path.join(dir, entry.name)
        if (entry.isDirectory()) {
            // skip nested node_modules / build output if any sneak in
            if (entry.name === 'node_modules' || entry.name === '.next' || entry.name === 'dist') continue
            walk(full, out)
        } else if (entry.isFile()) {
            const ext = path.extname(entry.name)
            if (SCAN_EXTENSIONS.has(ext)) {
                out.push(full)
            }
        }
    }
    return out
}

function isExcluded(filePath: string): boolean {
    const normalized = filePath.replace(/\\/g, '/')
    if (normalized.endsWith('apps/web/src/app/fuxie-live-qa/page.tsx')) {
        return true
    }
    return isExcludedBasename(path.basename(filePath))
}

function scanFile(filePath: string, repoRoot: string): Violation[] {
    const content = readFileSync(filePath, 'utf8')
    const lines = content.split(/\r?\n/)
    const violations: Violation[] = []
    const relPath = path.relative(repoRoot, filePath).replace(/\\/g, '/')

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i]
        for (const literal of findForbiddenLiterals(line)) {
            violations.push({
                file: relPath,
                line: i + 1,
                literal,
            })
        }
    }

    return violations
}

export interface LintOptions {
    repoRoot: string
    scanRoot: string
}

export function runLint(options: LintOptions): Violation[] {
    const { repoRoot, scanRoot } = options
    let stat
    try {
        stat = statSync(scanRoot)
    } catch {
        return []
    }
    if (!stat.isDirectory()) return []

    const files = walk(scanRoot).filter(f => !isExcluded(f))
    const violations: Violation[] = []
    for (const file of files) {
        violations.push(...scanFile(file, repoRoot))
    }
    return violations
}

function main(): void {
    const repoRoot = process.cwd()
    const scanRoot = path.join(repoRoot, 'apps', 'web', 'src')

    // Allow optional CLI argument to override scan root (used for the
    // self-test fixture). Defaults to apps/web/src.
    const overrideRoot = process.argv[2]
    const effectiveScanRoot = overrideRoot ? path.resolve(repoRoot, overrideRoot) : scanRoot

    const violations = runLint({ repoRoot, scanRoot: effectiveScanRoot })

    if (violations.length === 0) {
        console.log(`lint:asset-paths OK (scanned ${path.relative(repoRoot, effectiveScanRoot) || '.'})`)
        process.exit(0)
    }

    console.error(
        `lint:asset-paths found ${violations.length} hardcoded asset path` +
            `${violations.length === 1 ? '' : 's'}:`,
    )
    for (const v of violations) {
        console.error(`${v.file}:${v.line}: ${v.literal}`)
    }
    console.error(
        `\nResolve via the Asset Registry helpers in apps/web/src/lib/mascot/ ` +
            `or apps/web/src/components/gamification/reward-assets.ts. ` +
            `Use a trailing \`${ALLOW_COMMENT}\` comment for documented exceptions.`,
    )
    process.exit(1)
}

// Only run the CLI when this module is the program entrypoint. Importing it
// from a test (e.g. `tests/asset-discipline.spec.ts`) must NOT trigger
// `process.exit` or scan the filesystem. `process.argv[1]` is the script
// being executed; we compare it to this file's URL so both
// `tsx scripts/...ts` and direct `node` invocations work.
const invokedDirectly = (() => {
    try {
        const argv1 = process.argv[1] ?? ''
        const thisFile = fileURLToPath(import.meta.url)
        return path.resolve(argv1) === path.resolve(thisFile)
    } catch {
        return false
    }
})()

if (invokedDirectly) {
    main()
}
