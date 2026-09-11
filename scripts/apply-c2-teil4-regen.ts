/**
 * Spec `content-c2-teil2-regeneration` (extended) — C2 Teil-4 "Meinungen zuordnen".
 * Apply human-/AI-Lead-signed regeneration of C2 reading Teil-4 opinion-matching.
 *
 * Vai chinh: German Content Writer
 * Vai phoi hop: German Academic Lead, Content QA / Linguistic Reviewer
 *
 * Replaces the placeholder `opinion_texts` (question + texts[A..D]) + the
 * matching `questions[]` with NEW real content, KEEPING the schema. Validates:
 *   - no generic filler opener in any opinion text
 *   - texts mention the declared topic/title
 *   - each question.answer is a label present in texts[]
 *   - each question.explanation.key_evidence ⊂ the matched opinion text
 * Sets cefrAudit.verdict = 'aligned' (AI German Academic Lead sign-off).
 * `--dry-run` previews. Aborts the file on any failure.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

export const GENERIC_OPENER_T4 =
  /Die Analyse des Themas .* zeigt, dass ein paradigmatischer Wandel|Die Forderung nach radikaler Erneuerung im Bereich/i

export function hasGenericOpenerT4(text: string): boolean {
  return GENERIC_OPENER_T4.test(text ?? '')
}

export interface OpinionText { name: string; label: string; text: string }
export interface T4Question {
  id?: string
  type?: string
  stem: string
  answer: string
  points?: number
  explanation: { key_evidence: string; reasoning?: string; de: string; vi: string; [k: string]: unknown }
}
export interface T4RegenPatch {
  question?: string
  texts: OpinionText[]
  questions: T4Question[]
}

function norm(s: string): string {
  return (s ?? '').toLowerCase().replace(/[\u201e\u201c\u201d"'`]/g, '').replace(/\s+/g, ' ').trim()
}
const STOP = new Set(['der', 'die', 'das', 'und', 'in', 'im', 'an', 'am', 'von', 'zu', 'mit', 'für', 'den', 'des', 'ein', 'eine', 'als'])
function topicKw(topic: string): string[] {
  return norm(topic).split(' ').filter((w) => w.length >= 5 && !STOP.has(w))
}
function stem6(w: string): string { return w.length <= 6 ? w : w.slice(0, 6) }

export interface ValidateResult { ok: boolean; errors: string[] }

export function validateT4Patch(patch: T4RegenPatch, topic: string): ValidateResult {
  const errors: string[] = []
  if (!patch || !Array.isArray(patch.texts) || patch.texts.length < 3) {
    errors.push('texts[] must have >= 3 opinions'); return { ok: false, errors }
  }
  const labels = new Set(patch.texts.map((t) => t.label))
  const allText = norm(patch.texts.map((t) => t.text).join(' '))
  patch.texts.forEach((t, i) => {
    if (!t.label) errors.push(`texts[${i}]: label missing`)
    if (!t.name) errors.push(`texts[${i}]: name missing`)
    if (typeof t.text !== 'string' || t.text.trim().length < 40) errors.push(`texts[${i}](${t.label}): text too short`)
    else if (hasGenericOpenerT4(t.text)) errors.push(`texts[${i}](${t.label}): generic-filler opener`)
  })
  const kws = [...topicKw(topic), ...topicKw(patch.question ?? '')]
  if (kws.length && !kws.some((k) => allText.includes(stem6(k)))) {
    errors.push('opinion texts do not mention the declared topic/title')
  }
  if (!Array.isArray(patch.questions) || patch.questions.length === 0) {
    errors.push('questions[] missing'); return { ok: false, errors }
  }
  const byLabel = new Map(patch.texts.map((t) => [t.label, norm(t.text)]))
  patch.questions.forEach((q, i) => {
    const tag = `Q[${i}]${q.id ? `(${q.id})` : ''}`
    if (typeof q.stem !== 'string' || !q.stem.trim()) errors.push(`${tag}: stem missing`)
    if (!labels.has(q.answer)) { errors.push(`${tag}: answer "${q.answer}" not a text label`); return }
    const ev = q?.explanation?.key_evidence
    if (typeof ev !== 'string' || !ev.trim()) errors.push(`${tag}: key_evidence missing`)
    else if (/^Text\/Beitrag /i.test(ev.trim())) errors.push(`${tag}: key_evidence is filler ("${ev}")`)
    else {
      const target = byLabel.get(q.answer) ?? ''
      if (!target.includes(norm(ev).slice(0, 40))) errors.push(`${tag}: key_evidence not found in opinion ${q.answer}`)
    }
    if (typeof q?.explanation?.de !== 'string' || !q.explanation.de.trim()) errors.push(`${tag}: explanation.de missing`)
    if (typeof q?.explanation?.vi !== 'string' || !q.explanation.vi.trim()) errors.push(`${tag}: explanation.vi missing`)
  })
  return { ok: errors.length === 0, errors }
}

export interface ApplyResult { text: string; error?: string }

export function applyT4Regen(text: string, patch: T4RegenPatch): ApplyResult {
  let parsed: any
  try { parsed = JSON.parse(text) } catch (e) { return { text, error: `parse failed: ${(e as Error).message}` } }
  const v = validateT4Patch(patch, String(parsed?.topic ?? ''))
  if (!v.ok) return { text, error: v.errors.join('; ') }
  if (!parsed.opinion_texts || typeof parsed.opinion_texts !== 'object') parsed.opinion_texts = {}
  if (patch.question) parsed.opinion_texts.question = patch.question
  parsed.opinion_texts.texts = patch.texts
  parsed.questions = patch.questions
  if (parsed.cefrAudit && typeof parsed.cefrAudit === 'object') {
    parsed.cefrAudit.verdict = 'aligned'
    parsed.cefrAudit.reviewerRole = 'German Academic Lead (AI/Kiro)'
    parsed.cefrAudit.notes = 'Regenerated Teil-4 opinions, signed off by AI German Academic Lead (Kiro); pending native-speaker spot-check.'
  }
  return { text: JSON.stringify(parsed, null, 2) + '\n' }
}

// CLI
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
  if (!args.patch) { process.stdout.write('[apply-c2-teil4-regen] no --patch given.\n'); return }
  const patches: Record<string, T4RegenPatch> = JSON.parse(fs.readFileSync(path.resolve(REPO_ROOT, args.patch), 'utf8'))
  let applied = 0; const errors: string[] = []
  for (const [rel, patch] of Object.entries(patches)) {
    const abs = path.resolve(REPO_ROOT, rel)
    if (!fs.existsSync(abs)) { errors.push(`${rel}: file missing`); continue }
    const r = applyT4Regen(fs.readFileSync(abs, 'utf8'), patch)
    if (r.error) { errors.push(`${rel}: ${r.error}`); continue }
    if (args.dryRun) process.stdout.write(`[dry-run] ${rel}: OK (${patch.texts.length} opinions, ${patch.questions.length} questions)\n`)
    else { fs.writeFileSync(abs, r.text, 'utf8'); process.stdout.write(`[applied] ${rel}\n`); applied++ }
  }
  process.stdout.write(`\n${args.dryRun ? 'DRY-RUN' : 'APPLIED'} files=${applied} errors=${errors.length}\n`)
  for (const e of errors) process.stderr.write(`  ! ${e}\n`)
  if (errors.length) process.exitCode = 1
}
const invokedDirectly = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
if (invokedDirectly) main()
