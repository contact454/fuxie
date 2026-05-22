/**
 * Locale Parity + t() Lint
 *
 * Two checks in one script:
 *
 * 1. Locale parity between `apps/web/messages/vi.json` and
 *    `apps/web/messages/de.json`:
 *      - every dotted key path that exists in one file must exist in the other
 *      - every leaf string value must be non-empty and not whitespace-only
 *
 * 2. `t()` discipline in `apps/web/src/**\/*.tsx`:
 *      - JSX text nodes (between `>` and `<`) and learner-facing string-valued
 *        JSX attributes (`title`, `aria-label`, `placeholder`, `alt`) that
 *        clearly look like learner copy must be wrapped in a `t(...)` call.
 *      - The check is heuristic and conservative: it only flags strings that
 *        contain either Vietnamese/German diacritics OR more than two
 *        space-separated words.  Pure-ASCII single tokens, URLs, file paths,
 *        CSS class names and punctuation glyphs are ignored.
 *      - A trailing `// locale-allow` comment on the same line opts a literal
 *        out (escape hatch for genuinely route-local strings, e.g. fixtures or
 *        debug messages).
 *      - `alt=""` (decorative image) is always allowed.
 *
 * Usage: `pnpm check:locale-parity`
 *
 * Optional CLI:
 *   --vi <path>          override path to vi.json
 *   --de <path>          override path to de.json
 *   --scan-root <path>   override the .tsx scan root (defaults to
 *                        `apps/web/src/`)
 *   --skip-tsx-scan      run only the locale parity check
 *   --skip-locale-parity run only the tsx scan
 *
 * Validates: Requirements 17.1, 17.2, 17.3, 17.4
 */

import { readdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'

// ---------- shared types ---------------------------------------------------

interface ParityViolation {
    kind: 'missing-vi' | 'missing-de' | 'empty-vi' | 'empty-de'
    key: string
}

interface CopyViolation {
    file: string
    line: number
    literal: string
    reason: 'jsx-text' | 'jsx-attr'
}

const SCAN_EXTENSIONS = new Set(['.tsx'])
export const ALLOW_COMMENT = '// locale-allow'

// JSX attributes that learners read (and therefore must be localized).
// `alt` is included but `alt=""` is always permitted (decorative image).
export const LEARNER_ATTRS = new Set(['title', 'aria-label', 'placeholder', 'alt'])

// Vietnamese + German + common Latin Extended diacritics (rough but catches
// the cases we actually care about: Tiếng Việt, Übersicht, Bảng, etc.).
// eslint-disable-next-line no-misleading-character-class
export const DIACRITIC_RE = /[\u00c0-\u024f\u1e00-\u1eff]/

// ---------- alt-text classification (Req 17.5–17.7) ------------------------

/**
 * Classify a translation key as one of the alt-text / aria / greeting
 * "buckets" used by Requirement 17. The bucket then drives the allowed
 * length range:
 *
 *   - `decorative`: must be the empty string (Req 17.7).
 *   - `meaningful`: 1–125 characters (Req 15.5 + 17.6).
 *   - `greeting`:   ≤ 200 characters (Req 17.5).
 *   - `other`:      no per-key length rule beyond non-empty + parity.
 *
 * The classifier looks at the FULL dotted key path (e.g.
 * `"Dashboard.greetingDefault"`) so callers can reuse the same heuristic
 * inside the property-test fixture generators.
 */
export type LocaleKeyKind = 'decorative' | 'meaningful' | 'greeting' | 'other'

export function classifyLocaleKey(fullKey: string): LocaleKeyKind {
    // Examine the leaf segment only — that is where the semantic suffix
    // lives in the message JSON shape used by next-intl.
    const segments = fullKey.split('.')
    const leaf = segments[segments.length - 1] ?? fullKey

    // Decorative copy is signalled by an explicit `decorative` suffix
    // (e.g. `coursePathDecorativeAlt`). Frame / world-prop assets that
    // are purely decorative carry `alt=""` in the component tree, so
    // they don't need a message entry at all — but if a key IS in the
    // file with this naming, treat it as decorative.
    if (/decorative(Alt|AriaLabel)?$/i.test(leaf)) return 'decorative'

    // Greetings get a more generous length budget because they include
    // the learner's name + a sentence (Req 17.5, ≤200 chars).
    if (/^greeting/i.test(leaf) || /Greeting$/.test(leaf)) return 'greeting'

    // Meaningful alt / aria text. The `*Alt` suffix is the canonical
    // signal in this codebase (e.g. `mascotCoachAlt`); `aria-label`
    // attributes serialise as `*AriaLabel` keys; `description` is also
    // commonly used for accessible names.
    if (
        /Alt$/.test(leaf) ||
        /AriaLabel$/.test(leaf) ||
        /Description$/.test(leaf) ||
        /^alt[A-Z0-9]/.test(leaf) ||
        /^aria[A-Z]/.test(leaf)
    ) {
        return 'meaningful'
    }

    return 'other'
}

/** Maximum allowed character length per key kind, per Requirement 17. */
export const KEY_KIND_MAX_LENGTH: Record<LocaleKeyKind, number> = {
    decorative: 0,
    meaningful: 125,
    greeting: 200,
    other: Number.POSITIVE_INFINITY,
}

/** Minimum allowed character length per key kind, per Requirement 17. */
export const KEY_KIND_MIN_LENGTH: Record<LocaleKeyKind, number> = {
    decorative: 0, // must be exactly 0
    meaningful: 1,
    greeting: 1,
    other: 1, // empty/whitespace already caught by parity check
}

/**
 * Verify that a `(key, value)` pair satisfies the per-kind length rule.
 * Returns `null` when the value is within bounds, or a short reason
 * string when it is not.  Pure / side-effect free so it can be exercised
 * by `tests/locale-parity.spec.ts` with `fast-check`.
 */
export function validateLocaleValueLength(
    fullKey: string,
    value: string,
): { kind: LocaleKeyKind; ok: true } | { kind: LocaleKeyKind; ok: false; reason: string } {
    const kind = classifyLocaleKey(fullKey)
    const len = [...value].length // count code points, not UTF-16 units
    const min = KEY_KIND_MIN_LENGTH[kind]
    const max = KEY_KIND_MAX_LENGTH[kind]

    if (kind === 'decorative') {
        if (len !== 0) {
            return { kind, ok: false, reason: `decorative key must be empty (got ${len})` }
        }
        return { kind, ok: true }
    }

    if (len < min) {
        return { kind, ok: false, reason: `length ${len} < min ${min} for ${kind}` }
    }
    if (len > max) {
        return { kind, ok: false, reason: `length ${len} > max ${max} for ${kind}` }
    }
    return { kind, ok: true }
}

// ---------- locale parity --------------------------------------------------

export type Json = string | number | boolean | null | { [k: string]: Json } | Json[]

/**
 * Flatten a JSON tree into a `Map<dottedKey, leafValue>`. Exported so
 * `tests/locale-parity.spec.ts` can iterate keys with the same shape the
 * parity check uses internally. `null` leaves resolve to `null`; arrays
 * use `[i]` index notation.
 */
export function flattenLocaleJson(obj: Json): Map<string, string | null> {
    return flatten(obj)
}

function flatten(obj: Json, prefix = '', out: Map<string, string | null> = new Map()): Map<string, string | null> {
    if (obj === null || obj === undefined) {
        out.set(prefix || '<root>', null)
        return out
    }
    if (typeof obj === 'string') {
        out.set(prefix, obj)
        return out
    }
    if (typeof obj === 'number' || typeof obj === 'boolean') {
        // numbers/booleans are not learner copy — store as non-empty so they
        // don't trip the empty check; parity-wise they still need to match.
        out.set(prefix, String(obj))
        return out
    }
    if (Array.isArray(obj)) {
        obj.forEach((entry, i) => flatten(entry, prefix ? `${prefix}[${i}]` : `[${i}]`, out))
        return out
    }
    for (const [k, v] of Object.entries(obj)) {
        flatten(v, prefix ? `${prefix}.${k}` : k, out)
    }
    return out
}

export interface LocaleParityResult {
    violations: ParityViolation[]
    viKeyCount: number
    deKeyCount: number
}

export function checkLocaleParity(viPath: string, dePath: string): LocaleParityResult {
    const vi = JSON.parse(readFileSync(viPath, 'utf8')) as Json
    const de = JSON.parse(readFileSync(dePath, 'utf8')) as Json
    return checkLocaleParityFromJson(vi, de)
}

/**
 * Pure variant of `checkLocaleParity` that accepts already-parsed JSON
 * trees instead of reading from disk. Exported so `tests/locale-parity.spec.ts`
 * can drive the parity invariant with `fast-check`-generated fixtures.
 */
export function checkLocaleParityFromJson(vi: Json, de: Json): LocaleParityResult {
    const viFlat = flatten(vi)
    const deFlat = flatten(de)

    const violations: ParityViolation[] = []

    for (const key of viFlat.keys()) {
        if (!deFlat.has(key)) {
            violations.push({ kind: 'missing-de', key })
        }
    }
    for (const key of deFlat.keys()) {
        if (!viFlat.has(key)) {
            violations.push({ kind: 'missing-vi', key })
        }
    }

    for (const [key, value] of viFlat) {
        if (typeof value === 'string' && value.trim().length === 0) {
            violations.push({ kind: 'empty-vi', key })
        }
    }
    for (const [key, value] of deFlat) {
        if (typeof value === 'string' && value.trim().length === 0) {
            violations.push({ kind: 'empty-de', key })
        }
    }

    // Stable sort: kind, then key
    violations.sort((a, b) => (a.kind === b.kind ? a.key.localeCompare(b.key) : a.kind.localeCompare(b.kind)))

    return { violations, viKeyCount: viFlat.size, deKeyCount: deFlat.size }
}

// ---------- t() / hardcoded copy lint --------------------------------------

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
            if (entry.name === 'node_modules' || entry.name === '.next' || entry.name === 'dist') continue
            walk(full, out)
        } else if (entry.isFile() && SCAN_EXTENSIONS.has(path.extname(entry.name))) {
            out.push(full)
        }
    }
    return out
}

/**
 * Decide whether a candidate string literal is "learner-facing copy" worth
 * flagging.  We deliberately err on the side of letting strings through —
 * the goal is to catch obvious un-localized prose, not every label.
 */
export function looksLikeLearnerCopy(text: string): boolean {
    const trimmed = text.trim()
    if (trimmed.length === 0) return false
    // ignore pure punctuation / arrows / single emoji-style glyphs
    if (/^[\s\p{P}\p{S}]+$/u.test(trimmed)) return false
    // ignore obvious technical strings
    if (/^https?:\/\//i.test(trimmed)) return false
    if (/^\/[\w./?=&%#-]*$/.test(trimmed)) return false // route or path
    if (/^[\w-]+\.[\w.-]+$/.test(trimmed)) return false // file name / domain
    // ignore CSS-ish (class names, var(--…), tailwind composes, etc.)
    if (/^[a-z0-9:_\-/[\] ]+$/i.test(trimmed) && !/\s.*\s/.test(trimmed)) return false

    const hasDiacritic = DIACRITIC_RE.test(trimmed)
    const wordCount = trimmed.split(/\s+/).filter(Boolean).length

    // Flag if it has Vietnamese/German diacritics, OR it has 3+ words.
    return hasDiacritic || wordCount >= 3
}

/**
 * Detect whether a string literal at position `literalStart` of `line` is
 * already wrapped in a `t(...)` call. Used by the lint to avoid flagging
 * strings that ARE going through next-intl. Exported so `tests/locale-parity.spec.ts`
 * can property-test the same discriminator.
 */
export function isInsideTCall(line: string, literalStart: number): boolean {
    // Walk backwards across the same line and look for `t(` or `t  (` etc.
    // We only need to find an *opening* `(` that is preceded by `t` (with no
    // identifier-character in between) and is not yet closed by the time we
    // reach `literalStart`.
    let depth = 0
    for (let i = literalStart - 1; i >= 0; i--) {
        const ch = line[i]
        if (ch === ')') {
            depth++
        } else if (ch === '(') {
            if (depth === 0) {
                // Found the unmatched opening paren — check what precedes it.
                let j = i - 1
                while (j >= 0 && /\s/.test(line[j])) j--
                if (j >= 0 && line[j] === 't') {
                    // ensure `t` is a standalone token (not part of `format` etc.)
                    if (j === 0 || !/[A-Za-z0-9_$]/.test(line[j - 1])) return true
                }
                return false
            }
            depth--
        }
    }
    return false
}

interface CopyScanResult {
    violations: CopyViolation[]
    filesScanned: number
}

export function scanForHardcodedCopy(scanRoot: string, repoRoot: string): CopyScanResult {
    let stat
    try {
        stat = statSync(scanRoot)
    } catch {
        return { violations: [], filesScanned: 0 }
    }
    if (!stat.isDirectory()) return { violations: [], filesScanned: 0 }

    const files = walk(scanRoot)
    const violations: CopyViolation[] = []

    // JSX text node literal: anything between `>` and `<` that is not a tag.
    // We only consider lines that contain `>` followed by some text and then
    // a `<` (single-line case).  Multi-line JSX text is rare in this codebase
    // and is acceptable to miss for a heuristic lint.
    const jsxText = />([^<>{}\n\r]+)</g
    // JSX attribute literal in one of LEARNER_ATTRS
    const jsxAttr = /\b(title|aria-label|placeholder|alt)\s*=\s*"([^"\n\r]*)"/g

    for (const file of files) {
        const raw = readFileSync(file, 'utf8')
        const lines = raw.split(/\r?\n/)
        const relPath = path.relative(repoRoot, file).replace(/\\/g, '/')

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i]
            if (line.includes(ALLOW_COMMENT)) continue

            // jsx text scan
            jsxText.lastIndex = 0
            let m: RegExpExecArray | null
            while ((m = jsxText.exec(line)) !== null) {
                const literal = m[1]
                if (!looksLikeLearnerCopy(literal)) continue
                const literalStart = m.index + 1 // position of first char after `>`
                if (isInsideTCall(line, literalStart)) continue
                violations.push({
                    file: relPath,
                    line: i + 1,
                    literal: literal.trim(),
                    reason: 'jsx-text',
                })
            }

            // jsx attribute scan
            jsxAttr.lastIndex = 0
            while ((m = jsxAttr.exec(line)) !== null) {
                const attr = m[1]
                const literal = m[2]
                if (attr === 'alt' && literal.length === 0) continue // decorative
                if (!looksLikeLearnerCopy(literal)) continue
                const literalStart = m.index + attr.length
                if (isInsideTCall(line, literalStart)) continue
                violations.push({
                    file: relPath,
                    line: i + 1,
                    literal: `${attr}="${literal}"`,
                    reason: 'jsx-attr',
                })
            }
        }
    }

    return { violations, filesScanned: files.length }
}

// ---------- CLI ------------------------------------------------------------

interface Cli {
    viPath: string
    dePath: string
    scanRoot: string
    skipTsxScan: boolean
    skipLocaleParity: boolean
}

function parseCli(repoRoot: string, argv: string[]): Cli {
    const cli: Cli = {
        viPath: path.join(repoRoot, 'apps', 'web', 'messages', 'vi.json'),
        dePath: path.join(repoRoot, 'apps', 'web', 'messages', 'de.json'),
        scanRoot: path.join(repoRoot, 'apps', 'web', 'src'),
        skipTsxScan: false,
        skipLocaleParity: false,
    }
    for (let i = 0; i < argv.length; i++) {
        const arg = argv[i]
        if (arg === '--vi' && argv[i + 1]) {
            cli.viPath = path.resolve(repoRoot, argv[++i])
        } else if (arg === '--de' && argv[i + 1]) {
            cli.dePath = path.resolve(repoRoot, argv[++i])
        } else if (arg === '--scan-root' && argv[i + 1]) {
            cli.scanRoot = path.resolve(repoRoot, argv[++i])
        } else if (arg === '--skip-tsx-scan') {
            cli.skipTsxScan = true
        } else if (arg === '--skip-locale-parity') {
            cli.skipLocaleParity = true
        }
    }
    return cli
}

function main(): void {
    const repoRoot = process.cwd()
    const cli = parseCli(repoRoot, process.argv.slice(2))

    let failed = false

    if (!cli.skipLocaleParity) {
        const result = checkLocaleParity(cli.viPath, cli.dePath)
        if (result.violations.length === 0) {
            console.log(
                `check:locale-parity OK — vi=${result.viKeyCount} keys, de=${result.deKeyCount} keys ` +
                    `(${path.relative(repoRoot, cli.viPath)} ⇄ ${path.relative(repoRoot, cli.dePath)})`,
            )
        } else {
            failed = true
            console.error(`check:locale-parity found ${result.violations.length} parity violation(s):`)
            for (const v of result.violations) {
                switch (v.kind) {
                    case 'missing-de':
                        console.error(`  missing in de.json: ${v.key}`)
                        break
                    case 'missing-vi':
                        console.error(`  missing in vi.json: ${v.key}`)
                        break
                    case 'empty-vi':
                        console.error(`  empty/whitespace in vi.json: ${v.key}`)
                        break
                    case 'empty-de':
                        console.error(`  empty/whitespace in de.json: ${v.key}`)
                        break
                }
            }
        }
    }

    if (!cli.skipTsxScan) {
        const result = scanForHardcodedCopy(cli.scanRoot, repoRoot)
        if (result.violations.length === 0) {
            console.log(
                `check:locale-parity tsx scan OK — ${result.filesScanned} file(s) scanned ` +
                    `(${path.relative(repoRoot, cli.scanRoot) || '.'})`,
            )
        } else {
            failed = true
            console.error(
                `check:locale-parity found ${result.violations.length} hardcoded learner-string ` +
                    `literal(s) not wrapped in t():`,
            )
            for (const v of result.violations) {
                console.error(`  ${v.file}:${v.line} [${v.reason}] ${v.literal}`)
            }
            console.error(
                `\nWrap learner-facing copy with next-intl \`t()\`, move the string to ` +
                    `\`apps/web/messages/{vi,de}.json\`, or append \`${ALLOW_COMMENT}\` to opt out for ` +
                    `genuinely route-local copy.`,
            )
        }
    }

    process.exit(failed ? 1 : 0)
}

// Only run when invoked directly (not when imported by a test).
const invokedFromCli =
    typeof process !== 'undefined' &&
    Array.isArray(process.argv) &&
    /check-locale-parity\.ts$/.test(process.argv[1] ?? '')

if (invokedFromCli) {
    main()
}
