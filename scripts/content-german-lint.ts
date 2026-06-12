/**
 * Tier-1 German Lint — `scripts/content-german-lint.ts` (npm `qa:german-lint`)
 * Spec `fuxie-content-review-board`, Component 1.
 *
 * Vai chinh: QA Automation Engineer
 * Vai phoi hop: DevOps / Cloud Engineer, Content QA / Linguistic Reviewer
 *
 * Deterministic, local, blocking German content gate. Originally scaffolded in
 * task 1.2, this module now (task 2.3) carries the full CLI seam. At its core it
 *   1. scans every Content_String_De out of the reading content tree
 *      (read-only, reusing the scanning style of `reading-explanation-lib.ts`),
 *   2. runs the German checks through a clearly-marked STUB that currently
 *      returns an empty findings array (LanguageTool / hunspell / dictionary /
 *      answer-key land in tasks 2.1 / 2.2), and
 *   3. produces a `Tier1Result` (scope counts + findings + objectiveVerdict)
 *      and exits with `tier1ExitCode(result)` as the process exit code.
 *
 * The contract types + verdict/exit-code logic are imported from the single
 * source of truth `scripts/lib/review-board-contract.ts` (shared with the PBT
 * suite) — they are NOT redefined here (design "Reuse-first").
 *
 * READ-ONLY: this script never writes under `content/`.
 *
 * CLI (task 2.3 — full flag set, runs fully local, no credit needed):
 *   --diff                 only scan content files changed vs the working tree
 *                          (unstaged + staged + untracked); falls back to a full
 *                          scan with a printed note when git is unavailable
 *   --skill <reading|vocabulary|all>   which skill surface to scan (default reading)
 *   --level <a1..c2>       restrict to a single CEFR level
 *   --json                 print the Tier1Result as JSON instead of text
 *   --report-path <file>   also write the full Tier1Result (+ notes) as JSON to
 *                          <file> (parent dirs created, UTF-8 no BOM); the path
 *                          MUST NOT live under `content/`
 */
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import {
  buildTier1Result,
  tier1ExitCode,
  type Tier1Finding,
  type Tier1Result,
} from './lib/review-board-contract'
import {
  runGermanChecks as runGermanChecksImpl,
  type DeStringRef,
  type GermanChecksOptions,
  type GermanChecksResult,
} from './lib/german-lint-checks'
import {
  scanVocabularyFindings,
  scanReadingAnswerKeyFindings,
} from './lib/german-content-checks'

export const LEVELS = ['a1', 'a2', 'b1', 'b2', 'c1', 'c2'] as const
export type Level = (typeof LEVELS)[number]

const REPO_ROOT = path.resolve(fileURLToPath(import.meta.url), '..', '..')

// ---------------------------------------------------------------------------
// German string scoping (read-only) — reuse of reading-explanation-lib style
// ---------------------------------------------------------------------------

/**
 * A single German string scoped out of the content tree, with a citeable
 * `jsonPath`. Future checks (tasks 2.1 / 2.2) lint `text` and attach
 * Tier1Finding offsets relative to it.
 */
export interface DeString {
  file: string // path relative to repo root, forward slashes
  jsonPath: string // e.g. questions[3].explanation.de
  text: string
}

function isSidecar(name: string): boolean {
  return /\.qa\.json$/i.test(name) || /\.meta\.json$/i.test(name)
}

function pushString(out: DeString[], file: string, jsonPath: string, value: unknown): void {
  if (typeof value === 'string' && value.trim().length > 0) {
    out.push({ file, jsonPath, text: value })
  }
}

/**
 * Collect the German strings from one parsed reading item. Scopes:
 *   - texts[].content              (passage German)
 *   - questions[].statement|stem|situation
 *   - questions[].options[]        (German answer options, when present)
 *   - questions[].explanation.de
 *   - questions[].explanation.key_evidence
 */
function collectDeStringsFromReading(rel: string, j: any): DeString[] {
  const out: DeString[] = []

  if (Array.isArray(j?.texts)) {
    j.texts.forEach((t: any, i: number) => {
      pushString(out, rel, `texts[${i}].content`, t?.content)
    })
  }

  if (Array.isArray(j?.questions)) {
    j.questions.forEach((q: any, i: number) => {
      pushString(out, rel, `questions[${i}].statement`, q?.statement)
      pushString(out, rel, `questions[${i}].stem`, q?.stem)
      pushString(out, rel, `questions[${i}].situation`, q?.situation)
      if (Array.isArray(q?.options)) {
        q.options.forEach((opt: unknown, oi: number) => {
          pushString(out, rel, `questions[${i}].options[${oi}]`, opt)
        })
      }
      const exp = q?.explanation
      if (exp && typeof exp === 'object') {
        pushString(out, rel, `questions[${i}].explanation.de`, exp.de)
        pushString(out, rel, `questions[${i}].explanation.key_evidence`, exp.key_evidence)
      }
    })
  }

  return out
}

export interface ScanResult {
  files: string[] // relative paths scanned (forward slashes)
  deStrings: DeString[]
}

/** Scan reading content for German strings. Read-only; skips sidecars. */
export function scanReadingDeStrings(
  repoRoot: string,
  level?: string,
  fileFilter?: (rel: string) => boolean,
): ScanResult {
  const files: string[] = []
  const deStrings: DeString[] = []
  const levels = level ? [level] : (LEVELS as readonly string[])

  for (const lv of levels) {
    const dir = path.join(repoRoot, 'content', lv, 'reading')
    if (!fs.existsSync(dir)) continue
    for (const name of fs.readdirSync(dir)) {
      if (!name.endsWith('.json') || isSidecar(name)) continue
      const fp = path.join(dir, name)
      const rel = path.relative(repoRoot, fp).split(path.sep).join('/')
      if (fileFilter && !fileFilter(rel)) continue
      let j: any
      try {
        j = JSON.parse(fs.readFileSync(fp, 'utf8'))
      } catch {
        continue
      }
      files.push(rel)
      deStrings.push(...collectDeStringsFromReading(rel, j))
    }
  }

  return { files, deStrings }
}

// ---------------------------------------------------------------------------
// Diff scoping (task 2.3) — testable git-diff file collector
// ---------------------------------------------------------------------------

/**
 * Injectable git runner: given argv (without the leading `git`), return stdout.
 * Tests inject a fake so they never depend on real repo state.
 */
export type GitRunner = (args: readonly string[]) => string

/** Default runner — shells out to the real `git` from the repo root. */
export const defaultGitRunner: GitRunner = (args) =>
  execFileSync('git', args as string[], { encoding: 'utf8', cwd: REPO_ROOT })

const CONTENT_JSON_RE = /^content\/.+\.json$/i

/**
 * Is `rel` a lint-eligible content JSON file? (under `content/`, `.json`, not a
 * `.qa.json`/`.meta.json` sidecar). Accepts both `/` and `\` separators.
 */
export function isContentJsonPath(rel: string): boolean {
  const f = rel.trim().split('\\').join('/')
  if (!CONTENT_JSON_RE.test(f)) return false
  return !isSidecar(path.posix.basename(f))
}

/**
 * Collect the content files changed vs the working tree, scoping the gate like
 * `qa:content`'s diff model. Unions three git views:
 *   - `git diff --name-only`            (unstaged tracked changes)
 *   - `git diff --name-only --staged`   (staged changes)
 *   - `git ls-files --others --exclude-standard`  (untracked, not ignored)
 * then keeps only `content/**\/*.json`, dedupes, and sorts.
 *
 * Returns `null` when git is unavailable / not a repo (any runner throw) so the
 * caller can fall back to a full scan instead of crashing.
 */
export function collectDiffContentFiles(runGit: GitRunner = defaultGitRunner): string[] | null {
  let lines: string[]
  try {
    lines = [
      ...runGit(['diff', '--name-only']).split(/\r?\n/),
      ...runGit(['diff', '--name-only', '--staged']).split(/\r?\n/),
      ...runGit(['ls-files', '--others', '--exclude-standard']).split(/\r?\n/),
    ]
  } catch {
    return null
  }

  const seen = new Set<string>()
  const out: string[] = []
  for (const raw of lines) {
    const f = raw.trim().split('\\').join('/')
    if (!f || !isContentJsonPath(f) || seen.has(f)) continue
    seen.add(f)
    out.push(f)
  }
  return out.sort()
}

// ---------------------------------------------------------------------------
// German checks — LanguageTool + hunspell (task 2.1)
// ---------------------------------------------------------------------------

/**
 * A `DeString` is structurally a `DeStringRef`; this adapter keeps the two
 * module-local names from drifting.
 */
function toRef(s: DeString): DeStringRef {
  return { file: s.file, jsonPath: s.jsonPath, text: s.text }
}

/**
 * Run the deterministic German checks over the scoped strings.
 *
 * Task 2.1: LanguageTool de-DE + hunspell de_DE on every `s.text`, plus the
 * LanguageTool health-check that surfaces an `infraError` (Req 1.9) so the gate
 * never reports a false PASS. The actual wiring lives in
 * `scripts/lib/german-lint-checks.ts` (fully dependency-injectable for tests).
 *
 * Task 2.2 (dictionary Genus/plural + wordType/enum + answer-key) appends its
 * findings into the same result downstream.
 */
export function runGermanChecks(
  deStrings: readonly DeString[],
  opts: GermanChecksOptions = {},
): Promise<GermanChecksResult> {
  return runGermanChecksImpl(deStrings.map(toRef), opts)
}

// ---------------------------------------------------------------------------
// Tier-1 lint orchestration
// ---------------------------------------------------------------------------

export interface LintOptions {
  skill?: string
  level?: string
  repoRoot?: string
  checks?: GermanChecksOptions
  /**
   * When provided, restrict the scan to exactly these content files (relative,
   * forward-slash paths). Used by `--diff` to scope the gate to changed files.
   * `undefined` means full scope.
   */
  files?: readonly string[]
}

export interface LintOutcome {
  result: Tier1Result
  /** Non-contract notes (e.g. hunspell skipped) for the CLI report. */
  notes: string[]
}

/**
 * Produce a Tier1Result (+ notes) for the requested scope. Read-only.
 *
 * Tier-1 merges TWO finding sources into one `Tier1Result`:
 *   - task 2.1 LanguageTool + hunspell over reading Content_String_De
 *     (server-gated; may surface an `infraError`), and
 *   - task 2.2 deterministic content checks (enum / Genus / plural / answer-key)
 *     which are local + free and ALWAYS run for their skill.
 *
 * Skill scoping:
 *   - 'reading'    (default): LanguageTool/hunspell + reading answer-key checks.
 *   - 'vocabulary'         : vocabulary enum/Genus/plural checks (no server).
 *   - 'all'                : both skills.
 *
 * CRITICAL (Req 1.9): when LanguageTool is unavailable the LT/hunspell pass
 * yields an `infraError`, which forces a non-PASS verdict + exit code 2 (the
 * safety path wins). The deterministic content findings are STILL computed and
 * merged into `result.findings` so they remain visible in the report — the
 * infraError simply rides alongside them.
 */
export async function lint(options: LintOptions = {}): Promise<LintOutcome> {
  const repoRoot = options.repoRoot ?? REPO_ROOT
  const skill = options.skill ?? 'reading'
  const runReading = skill === 'reading' || skill === 'all'
  const runVocabulary = skill === 'vocabulary' || skill === 'all'

  // Optional diff/file scoping: when a file allow-list is supplied, every scan
  // result is restricted to it (read-only either way).
  const allow = options.files ? new Set(options.files) : null
  const fileFilter = allow ? (rel: string) => allow.has(rel) : undefined
  const keepFinding = (f: Tier1Finding) => (allow ? allow.has(f.file) : true)
  const keepFile = (rel: string) => (allow ? allow.has(rel) : true)

  const findings: Tier1Finding[] = []
  const notes: string[] = []
  let files = 0
  let deStrings = 0
  let infraError: string | undefined

  // --- Reading: LanguageTool/hunspell (task 2.1) + answer-key (task 2.2) ---
  if (runReading) {
    const scan = scanReadingDeStrings(repoRoot, options.level, fileFilter)
    files += scan.files.length
    deStrings += scan.deStrings.length

    const checks = await runGermanChecks(scan.deStrings, options.checks)
    findings.push(...checks.findings)
    notes.push(...checks.notes)
    infraError = checks.infraError

    // Deterministic answer-key checks run regardless of LanguageTool status.
    const answerKey = scanReadingAnswerKeyFindings(repoRoot, options.level)
    findings.push(...answerKey.findings.filter(keepFinding))
  }

  // --- Vocabulary: enum / Genus / plural (task 2.2) — local + free ---
  if (runVocabulary) {
    const vocab = scanVocabularyFindings(repoRoot, options.level)
    files += vocab.files.filter(keepFile).length
    findings.push(...vocab.findings.filter(keepFinding))
  }

  const result = buildTier1Result({ files, deStrings }, findings, infraError)
  return { result, notes }
}

// ---------------------------------------------------------------------------
// CLI seam (basic; full flag set is task 2.3)
// ---------------------------------------------------------------------------

interface CliArgs {
  skill: string
  level?: string
  json: boolean
  diff: boolean
  reportPath?: string
}

export function parseArgs(argv: readonly string[]): CliArgs {
  const args: CliArgs = { skill: 'reading', json: false, diff: false }
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--json') {
      args.json = true
    } else if (a === '--diff') {
      args.diff = true
    } else if (a === '--skill') {
      args.skill = String(argv[++i] ?? '').toLowerCase()
    } else if (a.startsWith('--skill=')) {
      args.skill = a.slice('--skill='.length).toLowerCase()
    } else if (a === '--level') {
      args.level = String(argv[++i] ?? '').toLowerCase()
    } else if (a.startsWith('--level=')) {
      args.level = a.slice('--level='.length).toLowerCase()
    } else if (a === '--report-path') {
      args.reportPath = String(argv[++i] ?? '')
    } else if (a.startsWith('--report-path=')) {
      args.reportPath = a.slice('--report-path='.length)
    }
  }
  return args
}

// ---------------------------------------------------------------------------
// Report writing (task 2.3) — JSON Tier1Result to a non-content path
// ---------------------------------------------------------------------------

/** The JSON payload written by `--report-path` (the contract result + notes). */
export interface Tier1Report extends Tier1Result {
  notes: string[]
}

/**
 * Refuse to write the report anywhere under `content/` so the gate stays
 * strictly READ-ONLY with respect to content (Req 6.4 spirit / task guidance).
 */
export function assertReportPathOutsideContent(repoRoot: string, target: string): void {
  const abs = path.resolve(repoRoot, target)
  const contentDir = path.resolve(repoRoot, 'content') + path.sep
  if ((abs + path.sep).startsWith(contentDir)) {
    throw new Error(`--report-path must not point under content/ (got "${target}")`)
  }
}

/** Write the report as UTF-8 (no BOM) JSON, creating parent dirs. */
export function writeReport(repoRoot: string, target: string, report: Tier1Report): string {
  assertReportPathOutsideContent(repoRoot, target)
  const abs = path.resolve(repoRoot, target)
  fs.mkdirSync(path.dirname(abs), { recursive: true })
  fs.writeFileSync(abs, JSON.stringify(report, null, 2) + '\n', { encoding: 'utf8' })
  return abs
}

function formatText(result: Tier1Result, args: CliArgs, notes: readonly string[]): string {
  const lines: string[] = []
  const scopeLabel = args.level ? `${args.skill}/${args.level}` : args.skill
  lines.push(`Tier-1 German Lint — scope: ${scopeLabel}`)
  lines.push(`  files scanned : ${result.scope.files}`)
  lines.push(`  de strings    : ${result.scope.deStrings}`)
  lines.push(`  findings      : ${result.findings.length}`)
  const errors = result.findings.filter((f) => f.severity === 'error').length
  const warnings = result.findings.length - errors
  lines.push(`    errors      : ${errors}`)
  lines.push(`    warnings    : ${warnings}`)
  lines.push(`  objective     : ${result.objectiveVerdict}`)
  if (result.infraError) lines.push(`  infraError    : ${result.infraError}`)
  // Per-rule breakdown — a real content-health signal.
  if (result.findings.length > 0) {
    const byRule = new Map<string, { error: number; warning: number }>()
    for (const f of result.findings) {
      const e = byRule.get(f.rule) ?? { error: 0, warning: 0 }
      e[f.severity]++
      byRule.set(f.rule, e)
    }
    lines.push('  by rule       :')
    for (const [rule, c] of [...byRule.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
      lines.push(`    ${rule.padEnd(28)} error=${c.error} warning=${c.warning}`)
    }
  }
  for (const note of notes) lines.push(`  note          : ${note}`)
  return lines.join('\n')
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2))
  if (args.level && !(LEVELS as readonly string[]).includes(args.level)) {
    process.stderr.write(`Unknown --level "${args.level}" (expected one of ${LEVELS.join(', ')})\n`)
    process.exit(2)
  }

  // --diff: scope to changed content files; fall back to a full scan if git is
  // unavailable (never crash).
  let files: string[] | undefined
  const scopeNotes: string[] = []
  if (args.diff) {
    const diff = collectDiffContentFiles()
    if (diff === null) {
      scopeNotes.push('--diff: git unavailable or not a repo; falling back to full scan.')
    } else {
      files = diff
      scopeNotes.push(`--diff: scoped to ${diff.length} changed content file(s).`)
    }
  }

  const { result, notes } = await lint({ skill: args.skill, level: args.level, files })
  const allNotes = [...scopeNotes, ...notes]

  if (args.json) {
    process.stdout.write(JSON.stringify({ ...result, notes: allNotes }, null, 2) + '\n')
  } else {
    process.stdout.write(formatText(result, args, allNotes) + '\n')
  }

  if (args.reportPath) {
    try {
      const abs = writeReport(REPO_ROOT, args.reportPath, { ...result, notes: allNotes })
      process.stderr.write(`report written: ${abs}\n`)
    } catch (err) {
      process.stderr.write(`${err instanceof Error ? err.message : String(err)}\n`)
      process.exit(2)
    }
  }

  process.exit(tier1ExitCode(result))
}

// Run only when invoked directly (not when imported by tests).
const invokedDirectly =
  process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
if (invokedDirectly) {
  void main()
}
