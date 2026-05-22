/**
 * Static deny-list scan that enforces the world layer's read-only stance
 * toward learner state.
 *
 * Validates: Requirements 7.1, 16.1, 16.5
 *
 * Requirement 7.1 forbids the Learning_World_Core (and, by extension,
 * the React wrapper and the lab route that mount it) from statically
 * importing any module that owns learner progress, persistence,
 * analytics writes, or learner-state-mutating server/API clients.
 * Requirement 16.1 forbids any V0 module from being imported by
 * Production_Surface code; together with 16.5 (no persistence) the
 * three directories below MUST stay free of every prefix in
 * `DENY_PREFIXES`.
 *
 * The check is a textual import scan (not a module load) so it runs
 * cheaply via the existing `pnpm --filter @fuxie/web test` command and
 * does not pull learner-state types into the lab's compile graph.
 * It deliberately introduces no new CI job, no new `package.json`
 * script, and no new `scripts/` entry (Task 13.1 contract / Requirement
 * 7.1).
 *
 * The deny-list is a typed `readonly` constant in this file so that
 * future learner-state modules can be added by appending one line; a
 * sanity check at the bottom of the suite asserts the constant covers
 * every prefix Task 13.1 currently mandates.
 */

import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative, sep } from 'node:path'
import { describe, expect, it } from 'vitest'

// Three roots Task 13.1 mandates: the framework-agnostic core, the
// React wrapper, and the lab route. We scan every `.ts` / `.tsx` file
// reachable from these roots.
const SCAN_ROOTS: readonly string[] = [
    join(__dirname, '..'), // apps/web/src/lib/learning-world
    join(__dirname, '..', '..', '..', 'components', 'learning-world'),
    join(__dirname, '..', '..', '..', 'app', 'fuxie-world-lab'),
]

// Repo-root reference used only for friendly relative paths in failure
// messages. Resolves to `apps/web/src/`.
const SRC_ROOT = join(__dirname, '..', '..', '..')

const TESTS_DIRNAME = '__tests__'

/**
 * Module specifier prefixes that the world layer must NOT import.
 *
 * Encoded as a typed `readonly string[]` so that the deny-list can be
 * extended in one place when new learner-state owners are introduced
 * (e.g. a future `@/lib/badges` write helper). A specifier `s` is
 * considered denied iff for some prefix `p`:
 *   - `s === p`, or
 *   - `s.startsWith(p + '/')` (when `p` does not already end with `/`),
 *     or
 *   - `s.startsWith(p)` (when `p` already ends with `/`, e.g. `@/server/`).
 *
 * Rationale per prefix:
 *   - `@/lib/learner`, `@/lib/srs`, `@/lib/progress`: learner-progress
 *     modules (Requirement 7.1).
 *   - `@/lib/analytics`: analytics writers that mutate learner-tied
 *     event streams.
 *   - `@/lib/xp`, `@/lib/streak`, `@/lib/fucoin`: gamification reward
 *     ledgers; world layer must remain read-only with respect to them.
 *   - `@/lib/persistence`, `@/lib/storage`: persistence / storage write
 *     helpers (Requirement 16.5; world state is in-memory only).
 *   - `@/server/`, `@/api/`: learner-state-mutating server/API clients;
 *     trailing `/` keeps the bare tokens `@/server` or `@/api` (which
 *     are not currently used as paths in this repo) out of the match
 *     while still flagging every subpath.
 *   - `@fuxie/srs-engine`, `@fuxie/database`: workspace packages that
 *     own learner state directly.
 */
const DENY_PREFIXES: readonly string[] = [
    '@/lib/learner',
    '@/lib/srs',
    '@/lib/progress',
    '@/lib/analytics',
    '@/lib/xp',
    '@/lib/streak',
    '@/lib/fucoin',
    '@/lib/persistence',
    '@/lib/storage',
    '@/server/',
    '@/api/',
    '@fuxie/srs-engine',
    '@fuxie/database',
]

/**
 * Returns true iff `specifier` is denied by some prefix in
 * `DENY_PREFIXES` per the matching rule documented above.
 */
function isDeniedSpecifier(specifier: string): { denied: boolean; matchedPrefix: string | null } {
    for (const prefix of DENY_PREFIXES) {
        if (prefix.endsWith('/')) {
            if (specifier.startsWith(prefix)) return { denied: true, matchedPrefix: prefix }
        } else {
            if (specifier === prefix || specifier.startsWith(prefix + '/')) {
                return { denied: true, matchedPrefix: prefix }
            }
        }
    }
    return { denied: false, matchedPrefix: null }
}

/**
 * Recursively collect every `.ts` / `.tsx` file under `dir`, skipping
 * any directory named `__tests__` so this test file (and any future
 * fixtures alongside it) never flags itself for mentioning denied
 * prefixes in documentation strings.
 */
function collectSourceFiles(dir: string): string[] {
    const out: string[] = []
    let entries: string[]
    try {
        entries = readdirSync(dir)
    } catch {
        // A scan root that does not exist yet is a hard failure: the
        // test must keep this slice's directory contract honest.
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

/**
 * Extract the module specifier from a single source line, if it begins
 * with an `import` statement. Recognizes:
 *   - `import X from 'mod'`
 *   - `import 'mod'` (side-effect import)
 *   - `import type X from 'mod'`
 * Returns `null` when the line is not an import line.
 */
function extractImportSpecifier(line: string): string | null {
    const fromMatch = line.match(/^\s*import\s+(?:type\s+)?[^;]*?\s+from\s+['"]([^'"]+)['"]/)
    if (fromMatch) return fromMatch[1] ?? null

    const sideEffect = line.match(/^\s*import\s+['"]([^'"]+)['"]/)
    if (sideEffect) return sideEffect[1] ?? null

    return null
}

function relativeFromSrc(absPath: string): string {
    return relative(SRC_ROOT, absPath).split(sep).join('/')
}

const SOURCE_FILES: readonly string[] = SCAN_ROOTS.flatMap((root) => collectSourceFiles(root))

describe('learning-world layer: learner-state deny-list', () => {
    it('discovers at least one source file across all three scan roots', () => {
        // Sanity check so a refactor that accidentally moves any of
        // the three directories does not silently turn the scan into
        // a no-op for the missing root.
        expect(SOURCE_FILES.length).toBeGreaterThan(0)
        for (const root of SCAN_ROOTS) {
            const filesUnderRoot = SOURCE_FILES.filter((f) => f.startsWith(root + sep) || f === root)
            expect(
                filesUnderRoot.length,
                `expected at least one .ts/.tsx file under ${relativeFromSrc(root)}`,
            ).toBeGreaterThan(0)
        }
    })

    it('contains no imports targeting any module under the learner-state deny-list', () => {
        const violations: string[] = []

        for (const file of SOURCE_FILES) {
            const text = readFileSync(file, 'utf8')
            const lines = text.split(/\r?\n/)
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i] ?? ''
                const specifier = extractImportSpecifier(line)
                if (specifier === null) continue
                const { denied, matchedPrefix } = isDeniedSpecifier(specifier)
                if (denied) {
                    violations.push(
                        `${relativeFromSrc(file)}:${i + 1} imports denied module "${specifier}" (matches prefix "${matchedPrefix}")`,
                    )
                }
            }
        }

        expect(violations, violations.join('\n')).toEqual([])
    })

    it('keeps the typed deny-list aligned with the Task 13.1 contract', () => {
        // Guard against accidental shrinkage of the deny-list. If a
        // legitimate need ever arises to remove a prefix, update this
        // expectation explicitly so the change is reviewed in the diff.
        const expectedRequiredPrefixes: readonly string[] = [
            '@/lib/learner',
            '@/lib/srs',
            '@/lib/progress',
            '@/lib/analytics',
            '@/lib/xp',
            '@/lib/streak',
            '@/lib/fucoin',
            '@/lib/persistence',
            '@/lib/storage',
            '@/server/',
            '@/api/',
            '@fuxie/srs-engine',
            '@fuxie/database',
        ]
        for (const prefix of expectedRequiredPrefixes) {
            expect(
                DENY_PREFIXES,
                `DENY_PREFIXES is missing required prefix "${prefix}" (Task 13.1 contract)`,
            ).toContain(prefix)
        }
    })
})
