/**
 * Static scan that enforces lab-route isolation.
 *
 * Validates: Requirement 1.7
 *
 * Requirement 1.7 mandates that `/fuxie-world-lab` be reachable only by
 * direct path entry: it MUST NOT be linked from any production
 * navigation menu, footer, sitemap, or in-app link. The simplest and
 * most regression-resistant way to enforce that contract on a static
 * codebase is to assert that no `.ts` / `.tsx` source under
 * `apps/web/src/components/` or `apps/web/src/app/` (excluding the
 * lab route's own directory) contains the substring `/fuxie-world-lab`.
 *
 * The check is a textual scan (not a module load) so it runs cheaply
 * via the existing `pnpm --filter @fuxie/web test` command and pulls
 * no production code into the test compile graph. It deliberately
 * introduces no new CI job, no new `package.json` script, and no new
 * `scripts/` entry (Task 12.5 contract / Requirement 1.7).
 *
 * Exclusions:
 *   - The lab route's own directory (`apps/web/src/app/fuxie-world-lab/`)
 *     is excluded because the route legitimately self-references the
 *     path string in `href` values and metadata.
 *   - Any `__tests__/` directory is excluded because tests (including
 *     this file) may legitimately mention the path as a string literal
 *     for assertion or fixture purposes; production navigation never
 *     ships from a test directory.
 */

import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative, sep } from 'node:path'
import { describe, expect, it } from 'vitest'

// `apps/web/src/`
const SRC_ROOT = join(__dirname, '..', '..', '..')

// Two roots Task 12.5 mandates: production component code and the
// Next.js app router tree. We scan every `.ts` / `.tsx` file reachable
// from these roots, minus the exclusions documented below.
const SCAN_ROOTS: readonly string[] = [
    join(SRC_ROOT, 'components'),
    join(SRC_ROOT, 'app'),
]

// The lab route's own directory, expressed as a relative path from
// `SRC_ROOT` with forward slashes. Files whose `SRC_ROOT`-relative path
// starts with this prefix are excluded from the scan because they are
// the route under test and may self-reference `/fuxie-world-lab`.
const EXCLUDED_PREFIX_REL = 'app/fuxie-world-lab'

const TESTS_DIRNAME = '__tests__'

const TARGET_SUBSTRING = '/fuxie-world-lab'

/**
 * Recursively collect every `.ts` / `.tsx` file under `dir`, skipping
 * any directory named `__tests__`. Returns absolute paths.
 */
function collectSourceFiles(dir: string): string[] {
    const out: string[] = []
    let entries: string[]
    try {
        entries = readdirSync(dir)
    } catch {
        // A scan root that does not exist is a hard failure: the test
        // must keep its directory contract honest.
        return out
    }
    for (const entry of entries) {
        const full = join(dir, entry)
        const stat = statSync(full)
        if (stat.isDirectory()) {
            if (entry === TESTS_DIRNAME) continue
            out.push(...collectSourceFiles(full))
            continue
        }
        if (!stat.isFile()) continue
        if (entry.endsWith('.ts') || entry.endsWith('.tsx')) {
            out.push(full)
        }
    }
    return out
}

function relativeFromSrc(absPath: string): string {
    return relative(SRC_ROOT, absPath).split(sep).join('/')
}

/**
 * Returns true iff the file at `absPath` is inside the lab route's own
 * directory and therefore exempt from the isolation scan.
 */
function isInsideLabRoute(absPath: string): boolean {
    const rel = relativeFromSrc(absPath)
    return rel === EXCLUDED_PREFIX_REL || rel.startsWith(EXCLUDED_PREFIX_REL + '/')
}

const SOURCE_FILES: readonly string[] = SCAN_ROOTS
    .flatMap((root) => collectSourceFiles(root))
    .filter((f) => !isInsideLabRoute(f))

describe('learning-world layer: lab-route isolation', () => {
    it('discovers at least one source file across both scan roots', () => {
        // Sanity check so a refactor that accidentally moves either of
        // the two directories does not silently turn the scan into a
        // no-op for the missing root.
        expect(SOURCE_FILES.length).toBeGreaterThan(0)
        for (const root of SCAN_ROOTS) {
            const filesUnderRoot = SOURCE_FILES.filter(
                (f) => f.startsWith(root + sep) || f === root,
            )
            expect(
                filesUnderRoot.length,
                `expected at least one .ts/.tsx file under ${relativeFromSrc(root)}`,
            ).toBeGreaterThan(0)
        }
    })

    it('contains zero references to the lab route path outside the lab route directory', () => {
        const violations: string[] = []

        for (const file of SOURCE_FILES) {
            const text = readFileSync(file, 'utf8')
            if (!text.includes(TARGET_SUBSTRING)) continue
            const lines = text.split(/\r?\n/)
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i] ?? ''
                if (line.includes(TARGET_SUBSTRING)) {
                    violations.push(
                        `${relativeFromSrc(file)}:${i + 1} references "${TARGET_SUBSTRING}" outside the lab route directory`,
                    )
                }
            }
        }

        expect(violations, violations.join('\n')).toEqual([])
    })
})
