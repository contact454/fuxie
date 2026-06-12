/**
 * Spec `content-c2-placeholder-regeneration` — Task 1.
 * Apply human-written (Academic-signed-off) C2 article + question regeneration.
 *
 * Vai chinh: German Content Writer
 * Vai phoi hop: German Academic Lead, German Curriculum Designer, Content QA
 *
 * Replaces the placeholder `article.title?`/`article.text` + the entire
 * `questions[]` of a C2 reading file with NEW, real content — while KEEPING the
 * file schema (`id`, `level`, `teil`, `scoring`, `qa`, `cefrAudit`,
 * `learningOutcomes`, …). Before writing it VALIDATES the new content:
 *   - exactly the expected number of questions (default keep existing count)
 *   - each question: non-broken stem, options, answer ∈ options, and
 *     key_evidence is a (normalized) substring of the NEW article.text
 *   - the new article.text no longer matches the generic-filler opener
 * On any failure it aborts that file (writes nothing). `--dry-run` previews.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { isBrokenStem } from './lib/cefr-stem-markers'

/** Generic templated opener that signals placeholder/off-topic filler. */
export const GENERIC_OPENER = /Der vorliegende (Kommentar|Text|Artikel) widmet sich dem Thema|Der wissenschaftliche Diskurs um das Thema/i

export function hasGenericOpener(text: string): boolean {
  return GENERIC_OPENER.test(text ?? '')
}

export interface RegenQuestion {
  id?: string
  type?: string
  stem: string
  options: Record<string, string> | string[]
  answer: string | number
  points?: number
  explanation: { key_evidence: string; de: string; vi: string; [k: string]: unknown }
}

export interface ArticleRegenPatch {
  title?: string
  text: string
  questions: RegenQuestion[]
}

function norm(s: string): string {
  return (s ?? '').toLowerCase().replace(/[\u201e\u201c\u201d"'`]/g, '').replace(/\s+/g, ' ').trim()
}

/** Does `options` contain a valid answer? Supports object (a/b/c/d) + array. */
function answerInOptions(answer: string | number, options: Record<string, string> | string[]): boolean {
  if (Array.isArray(options)) {
    if (typeof answer === 'number') return answer >= 0 && answer < options.length
    return options.includes(String(answer)) || /^[a-z]$/i.test(String(answer))
  }
  const keys = Object.keys(options)
  return keys.includes(String(answer))
}

export interface ValidateResult {
  ok: boolean
  errors: string[]
}

/** Validate a regen patch against the rules (pure). */
export function validatePatch(patch: ArticleRegenPatch, expectedCount?: number): ValidateResult {
  const errors: string[] = []
  if (!patch || typeof patch.text !== 'string' || patch.text.trim().length < 200) {
    errors.push('article.text missing or too short (<200 chars)')
  }
  if (patch.text && hasGenericOpener(patch.text)) {
    errors.push('article.text still uses the generic-filler opener')
  }
  if (!Array.isArray(patch.questions) || patch.questions.length === 0) {
    errors.push('questions[] missing/empty')
    return { ok: false, errors }
  }
  if (expectedCount != null && patch.questions.length !== expectedCount) {
    errors.push(`expected ${expectedCount} questions, got ${patch.questions.length}`)
  }
  const articleNorm = norm(patch.text)
  patch.questions.forEach((q, i) => {
    const tag = `Q[${i}]${q.id ? `(${q.id})` : ''}`
    if (typeof q.stem !== 'string' || !q.stem.trim()) errors.push(`${tag}: stem missing`)
    else if (isBrokenStem(q.stem)) errors.push(`${tag}: stem matches Broken_Stem marker`)
    if (!q.options || (Array.isArray(q.options) ? q.options.length < 2 : Object.keys(q.options).length < 2)) {
      errors.push(`${tag}: options missing/<2`)
    } else if (q.answer === undefined || !answerInOptions(q.answer, q.options)) {
      errors.push(`${tag}: answer not in options`)
    }
    const ev = q?.explanation?.key_evidence
    if (typeof ev !== 'string' || !ev.trim()) errors.push(`${tag}: key_evidence missing`)
    else if (!articleNorm.includes(norm(ev).slice(0, 60))) {
      errors.push(`${tag}: key_evidence not found in new article.text (answer not verifiable)`)
    }
    if (typeof q?.explanation?.de !== 'string' || !q.explanation.de.trim()) errors.push(`${tag}: explanation.de missing`)
    if (typeof q?.explanation?.vi !== 'string' || !q.explanation.vi.trim()) errors.push(`${tag}: explanation.vi missing`)
  })
  return { ok: errors.length === 0, errors }
}

export interface ApplyResult {
  text: string
  error?: string
}

/**
 * Apply a regen patch to the raw file text (pure). Keeps schema: deep-replaces
 * only `article.title`/`article.text` + `questions`, re-serialised with 2-space
 * indent. Validates before producing output.
 */
export function applyArticleRegen(text: string, patch: ArticleRegenPatch): ApplyResult {
  let parsed: any
  try {
    parsed = JSON.parse(text)
  } catch (e) {
    return { text, error: `parse failed: ${(e as Error).message}` }
  }
  const expected = Array.isArray(parsed.questions) ? parsed.questions.length : undefined
  const v = validatePatch(patch, expected)
  if (!v.ok) return { text, error: v.errors.join('; ') }

  if (!parsed.article || typeof parsed.article !== 'object') parsed.article = {}
  if (patch.title) parsed.article.title = patch.title
  parsed.article.text = patch.text
  parsed.questions = patch.questions
  return { text: JSON.stringify(parsed, null, 2) + '\n' }
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

const REPO_ROOT = path.resolve(fileURLToPath(import.meta.url), '..', '..')

interface CliArgs { patch?: string; dryRun: boolean }
export function parseArgs(argv: readonly string[]): CliArgs {
  const a: CliArgs = { dryRun: false }
  for (let i = 0; i < argv.length; i++) {
    const x = argv[i]
    if (x === '--dry-run') a.dryRun = true
    else if (x === '--patch') a.patch = String(argv[++i] ?? '')
    else if (x.startsWith('--patch=')) a.patch = x.slice('--patch='.length)
  }
  if (!a.patch) a.dryRun = true
  return a
}

function main(): void {
  const args = parseArgs(process.argv.slice(2))
  if (!args.patch) {
    process.stdout.write('[apply-c2-article-regen] no --patch given. Use --patch <file.json> (map of contentFile -> {title?, text, questions[]}).\n')
    return
  }
  const patches: Record<string, ArticleRegenPatch> = JSON.parse(fs.readFileSync(path.resolve(REPO_ROOT, args.patch), 'utf8'))
  let applied = 0
  const errors: string[] = []
  for (const [rel, patch] of Object.entries(patches)) {
    const abs = path.resolve(REPO_ROOT, rel)
    if (!fs.existsSync(abs)) { errors.push(`${rel}: file missing`); continue }
    const r = applyArticleRegen(fs.readFileSync(abs, 'utf8'), patch)
    if (r.error) { errors.push(`${rel}: ${r.error}`); continue }
    if (args.dryRun) {
      process.stdout.write(`[dry-run] ${rel}: OK (article ${patch.text.length} chars, ${patch.questions.length} questions)\n`)
    } else {
      fs.writeFileSync(abs, r.text, 'utf8')
      process.stdout.write(`[applied] ${rel}\n`)
      applied++
    }
  }
  process.stdout.write(`\n${args.dryRun ? 'DRY-RUN' : 'APPLIED'} files=${applied} errors=${errors.length}\n`)
  for (const e of errors) process.stderr.write(`  ! ${e}\n`)
  if (errors.length) process.exitCode = 1
}

const invokedDirectly =
  process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
if (invokedDirectly) main()
