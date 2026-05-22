/**
 * Static import / token scan for `apps/web/src/lib/learning-world/`.
 *
 * Validates: Requirements 3.2, 3.3, 3.4, 3.6, 3.9, 8.4
 *
 * Enforces, at test time, that the framework-agnostic Learning_World_Core
 * stays free of React, Next, the design-system package, and DOM-only
 * identifiers. This test is intentionally a static scan (no module load)
 * so it runs without bringing the React or Next type graphs into scope,
 * mirroring the production constraint that the core never imports them.
 *
 * Runs via the existing `pnpm --filter @fuxie/web test` command; it
 * deliberately does NOT introduce a new CI job, package script, or
 * watcher (Requirement 8.4 / Task 8.1 contract).
 */

import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative, sep } from 'node:path'
import { describe, expect, it } from 'vitest'

// Root of the framework-agnostic core. We scan everything under here, but
// skip the `__tests__` subdirectory so this file does not flag itself.
const CORE_ROOT = join(__dirname, '..')
const TESTS_DIRNAME = '__tests__'

/**
 * Module specifiers that may never appear in a learning-world `import`.
 *
 * Encoded as predicates so we can match both bare specifiers (`react`)
 * and their subpath variants (`react/jsx-runtime`, `next/headers`,
 * `@fuxie/ui/Button`) in one pass.
 */
const FORBIDDEN_IMPORT_PREDICATES: ReadonlyArray<{
    readonly label: string
    readonly test: (specifier: string) => boolean
}> = [
    { label: 'react', test: (s) => s === 'react' || s.startsWith('react/') },
    { label: 'react-dom', test: (s) => s === 'react-dom' || s.startsWith('react-dom/') },
    { label: 'next', test: (s) => s === 'next' || s.startsWith('next/') },
    { label: '@fuxie/ui', test: (s) => s === '@fuxie/ui' || s.startsWith('@fuxie/ui/') },
]

/**
 * Literal tokens that must not appear in any learning-world source file.
 * The scan uses `\b<token>\b` regex to avoid false positives in JSDoc
 * prose like "Documents the foo" — the task spec calls these "literal
 * tokens" and we treat them as identifier-shaped matches. If a legitimate
 * occurrence ever lands in JSDoc, the right fix is to rephrase the
 * comment, not to weaken this test.
 */
const FORBIDDEN_TOKENS: readonly string[] = [
    'CanvasRenderingContext2D',
    'HTMLCanvasElement',
    'HTMLElement',
    'Window',
    'Document',
    'Navigator',
    'setInterval',
]

/**
 * Recursively collect every `.ts` / `.tsx` file under `dir`, skipping
 * any directory named `__tests__` (so this scan never includes itself
 * or future test fixtures alongside it).
 */
function collectSourceFiles(dir: string): string[] {
    const out: string[] = []
    for (const entry of readdirSync(dir)) {
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
 * with an `import` statement. Recognizes the three syntactic shapes that
 * carry a specifier:
 *   - `import X from 'mod'`
 *   - `import 'mod'`            (side-effect import)
 *   - `import type X from 'mod'`
 * Returns `null` when the line is not an import line.
 */
function extractImportSpecifier(line: string): string | null {
    // Match `import [type] ... from 'mod'` (with `"` or `'`).
    const fromMatch = line.match(/^\s*import\s+(?:type\s+)?[^;]*?\s+from\s+['"]([^'"]+)['"]/)
    if (fromMatch) return fromMatch[1] ?? null

    // Match side-effect imports: `import 'mod'`.
    const sideEffect = line.match(/^\s*import\s+['"]([^'"]+)['"]/)
    if (sideEffect) return sideEffect[1] ?? null

    return null
}

/**
 * Heuristic: detect an unconditional top-level call to
 * `requestAnimationFrame(`. Top-level here means the call appears at
 * column 0 (or with only leading whitespace on its own line) and is not
 * the body of a function, method, arrow, or block.
 *
 * We approximate "top-level" by scanning per line: a line that starts
 * (after optional whitespace) with `requestAnimationFrame(` is treated
 * as top-level when its indentation is zero. Any indented occurrence is
 * assumed to be inside a function/method body and is allowed. This is
 * a lint-style heuristic, not a parser; it errs on the side of the spec
 * (Task 8.1: "matched by syntactic context, not just text").
 */
function findTopLevelRafCalls(source: string): number[] {
    const lines = source.split(/\r?\n/)
    const offendingLineNumbers: number[] = []
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i] ?? ''
        // Column 0, no indentation: a true top-level statement.
        if (/^requestAnimationFrame\s*\(/.test(line)) {
            offendingLineNumbers.push(i + 1)
        }
    }
    return offendingLineNumbers
}

const SOURCE_FILES: readonly string[] = collectSourceFiles(CORE_ROOT)

function relativeFromCore(absPath: string): string {
    return relative(CORE_ROOT, absPath).split(sep).join('/')
}

describe('learning-world core: forbidden imports / tokens scan', () => {
    it('discovers at least one source file under the learning-world core', () => {
        // Sanity check so a refactor that accidentally moves the core out
        // of this directory does not silently turn the scan into a no-op.
        expect(SOURCE_FILES.length).toBeGreaterThan(0)
    })

    it('contains no forbidden import specifiers (react, react-dom, next, next/, @fuxie/ui)', () => {
        const violations: string[] = []

        for (const file of SOURCE_FILES) {
            const text = readFileSync(file, 'utf8')
            const lines = text.split(/\r?\n/)
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i] ?? ''
                const specifier = extractImportSpecifier(line)
                if (specifier === null) continue
                for (const rule of FORBIDDEN_IMPORT_PREDICATES) {
                    if (rule.test(specifier)) {
                        violations.push(
                            `${relativeFromCore(file)}:${i + 1} imports forbidden module "${specifier}" (matches "${rule.label}")`,
                        )
                    }
                }
            }
        }

        expect(violations, violations.join('\n')).toEqual([])
    })

    it('contains no DOM-only literal tokens (CanvasRenderingContext2D, HTMLCanvasElement, HTMLElement, Window, Document, Navigator, setInterval)', () => {
        const violations: string[] = []

        for (const file of SOURCE_FILES) {
            const text = readFileSync(file, 'utf8')
            for (const token of FORBIDDEN_TOKENS) {
                const re = new RegExp(`\\b${token}\\b`)
                if (re.test(text)) {
                    violations.push(`${relativeFromCore(file)} contains forbidden token "${token}"`)
                }
            }
        }

        expect(violations, violations.join('\n')).toEqual([])
    })

    it('contains no unconditional top-level requestAnimationFrame(...) call', () => {
        const violations: string[] = []

        for (const file of SOURCE_FILES) {
            const text = readFileSync(file, 'utf8')
            const offendingLines = findTopLevelRafCalls(text)
            for (const lineNumber of offendingLines) {
                violations.push(
                    `${relativeFromCore(file)}:${lineNumber} calls requestAnimationFrame() at top level`,
                )
            }
        }

        expect(violations, violations.join('\n')).toEqual([])
    })
})
