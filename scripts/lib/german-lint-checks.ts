/**
 * Tier-1 German checks — LanguageTool + hunspell wiring.
 * Spec `fuxie-content-review-board`, Component 1 (task 2.1).
 *
 * Vai chinh: QA Automation Engineer
 * Vai phoi hop: DevOps / Cloud Engineer, Content QA / Linguistic Reviewer
 *
 * This module is the real implementation behind the `runGermanChecks` seam in
 * `scripts/content-german-lint.ts`. It is intentionally split out and fully
 * dependency-injectable (`fetchFn`, hunspell `runner`) so it can be unit-tested
 * with a fake LanguageTool server / fake hunspell binary WITHOUT installing
 * Docker / LanguageTool / hunspell on the box.
 *
 * Three responsibilities (design §"Components and Interfaces" / §"Error Handling"):
 *   1. LanguageTool de-DE client  -> map each match to a citeable Tier1Finding.
 *   2. hunspell de_DE spell-check -> rule='hunspell:unknown' findings (skipped
 *      with a recorded note when the binary/dictionary is unavailable — NOT a
 *      hard infra failure on its own).
 *   3. Health-check (Req 1.9, CRITICAL): if LanguageTool is unreachable, surface
 *      an `infraError` so the gate NEVER reports a false PASS.
 *
 * The `Tier1Finding` / `Tier1Severity` contract is imported from the single
 * source of truth `review-board-contract.ts` — never redefined here.
 */
import { spawnSync } from 'node:child_process'

import type { Tier1Finding, Tier1Severity } from './review-board-contract'

// ---------------------------------------------------------------------------
// Scoped German string (mirror of DeString in content-german-lint.ts)
// ---------------------------------------------------------------------------

export interface DeStringRef {
  file: string
  jsonPath: string
  text: string
}

// ---------------------------------------------------------------------------
// LanguageTool — wire format
// ---------------------------------------------------------------------------

/** Minimal shape of a LanguageTool `/v2/check` match we consume. */
export interface LtMatch {
  message: string
  offset: number
  length: number
  replacements?: { value: string }[]
  rule?: {
    id?: string
    issueType?: string
    category?: { id?: string; name?: string }
  }
}

export interface LtResponse {
  matches?: LtMatch[]
}

export type FetchFn = typeof fetch

export const DEFAULT_LANGUAGETOOL_URL = 'http://localhost:8081'

export interface LanguageToolOptions {
  /** Base URL of the LanguageTool server. Default: env LANGUAGETOOL_URL or :8081. */
  url?: string
  /** Injectable fetch (Node 22+ global by default) — fakeable in tests. */
  fetchFn?: FetchFn
  /** Target language. Default: de-DE. */
  language?: string
  /** Max in-flight requests when scanning many strings. Default: 4. */
  concurrency?: number
}

/**
 * LanguageTool categories that represent OBJECTIVE language errors (blocking).
 * Spelling, grammar and German capitalization (CASING) are agreement/correctness
 * issues -> severity='error'. Everything else (style, typography, punctuation,
 * redundancy, register…) is advisory -> severity='warning'.
 *
 * Severity mapping table (design §"Error Handling"):
 *   category TYPOS | GRAMMAR | CASING | CONFUSED_WORDS | COMPOUNDING -> error
 *   issueType misspelling | grammar                                  -> error
 *   everything else (TYPOGRAPHY, STYLE, PUNCTUATION, REDUNDANCY, …)   -> warning
 */
export const LT_ERROR_CATEGORY_IDS: ReadonlySet<string> = new Set([
  'TYPOS',
  'GRAMMAR',
  'CASING',
  'CONFUSED_WORDS',
  'COMPOUNDING',
])

export const LT_ERROR_ISSUE_TYPES: ReadonlySet<string> = new Set([
  'misspelling',
  'grammar',
])

/** Map a LanguageTool match to a Tier-1 severity (error vs warning). */
export function ltSeverity(match: LtMatch): Tier1Severity {
  const categoryId = (match.rule?.category?.id ?? '').toUpperCase()
  const issueType = (match.rule?.issueType ?? '').toLowerCase()
  if (LT_ERROR_CATEGORY_IDS.has(categoryId)) return 'error'
  if (LT_ERROR_ISSUE_TYPES.has(issueType)) return 'error'
  return 'warning'
}

/**
 * Map a single LanguageTool match against its source string to a citeable
 * Tier1Finding. The offset {start,end,excerpt} is computed against `ref.text`
 * so reviewers can quote the exact span.
 */
export function mapLtMatchToFinding(ref: DeStringRef, match: LtMatch): Tier1Finding {
  const ruleId = match.rule?.id ?? 'UNKNOWN'
  const start = Math.max(0, match.offset)
  const end = Math.min(ref.text.length, start + Math.max(0, match.length))
  const excerpt = ref.text.slice(start, end)
  const finding: Tier1Finding = {
    file: ref.file,
    jsonPath: ref.jsonPath,
    rule: `languagetool:${ruleId}`,
    severity: ltSeverity(match),
    message: match.message,
    offset: { start, end, excerpt },
  }
  const replacement = match.replacements?.[0]?.value
  if (replacement) finding.suggestion = replacement
  return finding
}

function resolveLtUrl(opts: LanguageToolOptions): string {
  const base = opts.url ?? process.env.LANGUAGETOOL_URL ?? DEFAULT_LANGUAGETOOL_URL
  return base.replace(/\/+$/, '')
}

/**
 * Health-check the LanguageTool server (Req 1.9, CRITICAL). GETs `/v2/languages`,
 * a tiny endpoint that exists on every LT server. Returns `{ ok:false, error }`
 * (never throws) when the server is unreachable or returns a non-2xx status, so
 * the caller can surface an `infraError` instead of a false PASS.
 */
export async function pingLanguageTool(
  opts: LanguageToolOptions = {},
): Promise<{ ok: boolean; error?: string }> {
  const base = resolveLtUrl(opts)
  const fetchFn = opts.fetchFn ?? fetch
  const url = `${base}/v2/languages`
  try {
    const res = await fetchFn(url, { method: 'GET' })
    if (!res.ok) {
      return { ok: false, error: `LanguageTool health-check ${url} returned HTTP ${res.status}` }
    }
    return { ok: true }
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err)
    return { ok: false, error: `LanguageTool unreachable at ${url}: ${reason}` }
  }
}

/** Check one German string via LanguageTool `/v2/check`. */
export async function checkStringWithLanguageTool(
  ref: DeStringRef,
  opts: LanguageToolOptions = {},
): Promise<Tier1Finding[]> {
  const base = resolveLtUrl(opts)
  const fetchFn = opts.fetchFn ?? fetch
  const language = opts.language ?? 'de-DE'
  const body = new URLSearchParams({ language, text: ref.text })
  const res = await fetchFn(`${base}/v2/check`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
    },
    body: body.toString(),
  })
  if (!res.ok) {
    throw new Error(`LanguageTool /v2/check returned HTTP ${res.status}`)
  }
  const json = (await res.json()) as LtResponse
  const matches = Array.isArray(json?.matches) ? json.matches : []
  return matches.map((m) => mapLtMatchToFinding(ref, m))
}

/** Run a mapper across items with a bounded concurrency pool (order preserved). */
async function mapLimit<T, R>(
  items: readonly T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(items.length)
  let cursor = 0
  const workerCount = Math.max(1, Math.min(limit, items.length))
  const workers = Array.from({ length: workerCount }, async () => {
    while (true) {
      const index = cursor++
      if (index >= items.length) break
      results[index] = await fn(items[index], index)
    }
  })
  await Promise.all(workers)
  return results
}

/**
 * Run LanguageTool over every scoped string. Health-check is the caller's job
 * (see runGermanChecks); this assumes the server is reachable.
 */
export async function checkWithLanguageTool(
  refs: readonly DeStringRef[],
  opts: LanguageToolOptions = {},
): Promise<Tier1Finding[]> {
  const concurrency = opts.concurrency ?? 4
  const perString = await mapLimit(refs, concurrency, (ref) =>
    checkStringWithLanguageTool(ref, opts),
  )
  return perString.flat()
}

// ---------------------------------------------------------------------------
// hunspell — spell-check
// ---------------------------------------------------------------------------

/** A token of the source text with its start offset (for citeable findings). */
export interface Token {
  word: string
  start: number
}

/**
 * Tokenize German text into word tokens (keeps umlauts + ß), recording each
 * token's start offset against the source string.
 */
export function tokenizeGerman(text: string): Token[] {
  const tokens: Token[] = []
  const re = /[A-Za-zÄÖÜäöüß]+/g
  let m: RegExpExecArray | null
  while ((m = re.exec(text)) !== null) {
    tokens.push({ word: m[0], start: m.index })
  }
  return tokens
}

/** Result of spell-checking a single word. */
export interface HunspellWordResult {
  word: string
  correct: boolean
  suggestions?: string[]
}

/**
 * Injectable spell runner: given a list of words, return per-word results.
 * Default implementation shells out to the hunspell binary in pipe (`-a`) mode;
 * tests inject a fake to avoid requiring hunspell on the box.
 */
export type HunspellRunner = (words: readonly string[]) => HunspellWordResult[]

export interface HunspellOptions {
  /** hunspell binary. Default: env HUNSPELL_PATH or 'hunspell'. */
  binary?: string
  /** Dictionary id/path passed to `-d`. Default: env HUNSPELL_DE_DICT or 'de_DE'. */
  dict?: string
  /** Injectable runner (bypasses the real binary in tests). */
  runner?: HunspellRunner
}

/**
 * Parse hunspell pipe-mode (`-a`) stdout into per-word results, aligned to the
 * input `words` order. hunspell emits one result line per input word:
 *   `*`          -> in dictionary
 *   `+ root`     -> found via affix
 *   `- `         -> compound match
 *   `& w n off: s1, s2`  -> miss, with suggestions
 *   `# w off`    -> miss, no suggestions
 *   `? ...`      -> guess (treated as miss)
 * The leading banner line ("@(#) …") and blank separator lines are ignored.
 */
export function parseHunspellOutput(
  stdout: string,
  words: readonly string[],
): HunspellWordResult[] {
  const results: HunspellWordResult[] = []
  const lines = stdout.split(/\r?\n/)
  let wordIndex = 0
  for (const raw of lines) {
    const line = raw.trimEnd()
    if (line.length === 0) continue
    if (line.startsWith('@')) continue // version banner
    const code = line[0]
    if (wordIndex >= words.length) break
    const word = words[wordIndex]
    if (code === '*' || code === '+' || code === '-') {
      results.push({ word, correct: true })
      wordIndex++
    } else if (code === '&' || code === '?') {
      // "& word count offset: s1, s2, s3"
      const colon = line.indexOf(':')
      const suggestions =
        colon >= 0
          ? line
              .slice(colon + 1)
              .split(',')
              .map((s) => s.trim())
              .filter(Boolean)
          : []
      results.push({ word, correct: false, suggestions })
      wordIndex++
    } else if (code === '#') {
      results.push({ word, correct: false, suggestions: [] })
      wordIndex++
    }
    // any other line: ignore
  }
  // Words with no emitted line (shouldn't happen) default to correct=true.
  while (results.length < words.length) {
    results.push({ word: words[results.length], correct: true })
  }
  return results
}

/**
 * Detect whether hunspell is usable: a binary that runs AND a de_DE dictionary
 * it can load. Returns a reason when unavailable so the caller can record a
 * skip note (NOT a hard infra failure).
 */
export function detectHunspell(opts: HunspellOptions = {}): { available: boolean; reason?: string } {
  if (opts.runner) return { available: true }
  const binary = opts.binary ?? process.env.HUNSPELL_PATH ?? 'hunspell'
  const dict = opts.dict ?? process.env.HUNSPELL_DE_DICT ?? 'de_DE'
  try {
    // `-D -d <dict>` lists the dictionaries hunspell can load; exit 0 + the dict
    // name on stderr means the dictionary is present.
    const probe = spawnSync(binary, ['-D', '-d', dict], { input: '', encoding: 'utf8' })
    if (probe.error) {
      return { available: false, reason: `hunspell binary not runnable: ${probe.error.message}` }
    }
    const out = `${probe.stdout ?? ''}${probe.stderr ?? ''}`
    if (!out.toLowerCase().includes(dict.toLowerCase())) {
      return { available: false, reason: `hunspell dictionary "${dict}" not found` }
    }
    return { available: true }
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err)
    return { available: false, reason: `hunspell unavailable: ${reason}` }
  }
}

function defaultHunspellRunner(opts: HunspellOptions): HunspellRunner {
  const binary = opts.binary ?? process.env.HUNSPELL_PATH ?? 'hunspell'
  const dict = opts.dict ?? process.env.HUNSPELL_DE_DICT ?? 'de_DE'
  return (words) => {
    const input = words.join('\n') + '\n'
    const proc = spawnSync(binary, ['-a', '-d', dict], { input, encoding: 'utf8' })
    if (proc.error) throw proc.error
    return parseHunspellOutput(proc.stdout ?? '', words)
  }
}

/**
 * Spell-check every scoped string with hunspell. Emits a `hunspell:unknown`
 * error finding for each unknown token, with a citeable offset/excerpt and the
 * first suggestion (if any). Deduplicates repeated unknown words within a string
 * to the first occurrence to keep the report focused.
 */
export function checkWithHunspell(
  refs: readonly DeStringRef[],
  opts: HunspellOptions = {},
): Tier1Finding[] {
  const runner = opts.runner ?? defaultHunspellRunner(opts)
  const findings: Tier1Finding[] = []
  for (const ref of refs) {
    const tokens = tokenizeGerman(ref.text)
    if (tokens.length === 0) continue
    const results = runner(tokens.map((t) => t.word))
    const seen = new Set<string>()
    results.forEach((res, i) => {
      if (res.correct) return
      const token = tokens[i]
      if (!token) return
      if (seen.has(token.word)) return
      seen.add(token.word)
      const finding: Tier1Finding = {
        file: ref.file,
        jsonPath: ref.jsonPath,
        rule: 'hunspell:unknown',
        severity: 'error',
        message: `Unbekanntes Wort: "${token.word}"`,
        offset: {
          start: token.start,
          end: token.start + token.word.length,
          excerpt: token.word,
        },
      }
      const suggestion = res.suggestions?.[0]
      if (suggestion) finding.suggestion = suggestion
      findings.push(finding)
    })
  }
  return findings
}

// ---------------------------------------------------------------------------
// Orchestration
// ---------------------------------------------------------------------------

export interface GermanChecksOptions {
  languageTool?: LanguageToolOptions
  hunspell?: HunspellOptions
  /** Skip the LanguageTool health-check + scan (e.g. unit-testing hunspell). */
  skipLanguageTool?: boolean
  /** Skip hunspell entirely (records a note). */
  skipHunspell?: boolean
}

export interface GermanChecksResult {
  findings: Tier1Finding[]
  /** Set iff LanguageTool is unreachable (Req 1.9) — forces a non-PASS verdict. */
  infraError?: string
  /** Human-readable notes (e.g. hunspell skipped) for the CLI report. */
  notes: string[]
}

/**
 * Run the deterministic German checks (LanguageTool + hunspell) over the scoped
 * strings. This is the real body wired into `runGermanChecks` in
 * `content-german-lint.ts`.
 *
 * Order of operations (Req 1.9 first):
 *   1. Health-check LanguageTool. If unreachable -> return { infraError } with NO
 *      findings, so `buildTier1Result` yields a non-PASS verdict + exit code 2.
 *      Never a false PASS.
 *   2. Run LanguageTool over every string.
 *   3. hunspell: if available, append unknown-word findings; otherwise record a
 *      skip note (NOT a hard failure).
 */
export async function runGermanChecks(
  refs: readonly DeStringRef[],
  opts: GermanChecksOptions = {},
): Promise<GermanChecksResult> {
  const notes: string[] = []
  const findings: Tier1Finding[] = []

  // 1. LanguageTool health-check (CRITICAL safety path, Req 1.9).
  if (!opts.skipLanguageTool) {
    const health = await pingLanguageTool(opts.languageTool)
    if (!health.ok) {
      return {
        findings: [],
        infraError:
          health.error ??
          'LanguageTool server unavailable (set LANGUAGETOOL_URL or start the :8081 server)',
        notes: ['LanguageTool health-check failed — gate did NOT run (no false PASS).'],
      }
    }
    // 2. LanguageTool scan.
    const ltFindings = await checkWithLanguageTool(refs, opts.languageTool)
    findings.push(...ltFindings)
  } else {
    notes.push('LanguageTool skipped by option.')
  }

  // 3. hunspell (best-effort; skip with a note when unavailable).
  if (opts.skipHunspell) {
    notes.push('hunspell skipped by option.')
  } else {
    const detected = detectHunspell(opts.hunspell)
    if (detected.available) {
      const hunspellFindings = checkWithHunspell(refs, opts.hunspell)
      findings.push(...hunspellFindings)
    } else {
      notes.push(
        `hunspell sub-check skipped: ${detected.reason ?? 'unavailable'} ` +
          '(install hunspell + de_DE dict, or set HUNSPELL_PATH / HUNSPELL_DE_DICT).',
      )
    }
  }

  return { findings, notes }
}
