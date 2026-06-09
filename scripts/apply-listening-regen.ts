/**
 * Spec `content-listening-regeneration` — Task 1.
 * Apply human-written (Academic-signed-off) listening transcript + question
 * regeneration for B1/B2/C1/C2.
 *
 * Vai chinh: German Content Writer
 * Vai phoi hop: German Academic Lead, German Curriculum Designer, Content QA
 *
 * Replaces a listening file's `transcript.lines` + the entire `questions[]`
 * with NEW, real content — while KEEPING the schema (`id`, `level`, `teil`,
 * `teil_name`, `task_type`, `topic`, `audio_file`, `metadata`, `scoring`,
 * `learningOutcomes`, …). Before writing it VALIDATES the new content:
 *   - transcript present, no fake looping segments (internalDupRatio < 0.2)
 *   - transcript mentions the declared topic/title (Property 2)
 *   - each question: answer valid for task_type, key_evidence ⊂ new transcript
 * It also marks Audio_Restubbing (transcript needs re-record) and updates the
 * stale `cefrAudit.verdict`. Cross-file overlap (Property 1) is enforced by the
 * scanner gate, not per-file. `--dry-run` previews. On failure it aborts the
 * file (writes nothing).
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  normalizeText,
  transcriptDialogueText,
  internalDupRatio,
  transcriptMatchesTopic,
} from './lib/listening-scan'

export interface RegenLine {
  speaker: string
  speaker_role: string
  text: string
}

export interface RegenListeningQuestion {
  id?: string
  type?: string
  statement?: string
  stem?: string
  options?: Record<string, string> | string[]
  answer: string | number | boolean
  points?: number
  explanation: { key_evidence: string; de: string; vi: string; [k: string]: unknown }
}

export interface ListeningRegenPatch {
  transcript_lines: RegenLine[]
  questions: RegenListeningQuestion[]
  gespraech_count?: number
}

/** Answer validity by task type. ja_nein accepts ja/nein/true/false. */
export function answerValidForType(
  answer: string | number | boolean,
  taskType: string,
  options?: Record<string, string> | string[],
): boolean {
  const t = (taskType ?? '').toLowerCase()
  if (t === 'ja_nein' || t === 'richtig_falsch') {
    const a = String(answer).toLowerCase()
    return ['ja', 'nein', 'richtig', 'falsch', 'true', 'false'].includes(a)
  }
  if (!options) return answer !== undefined && answer !== null && String(answer).length > 0
  if (Array.isArray(options)) {
    if (typeof answer === 'number') return answer >= 0 && answer < options.length
    return options.includes(String(answer)) || /^[a-z]$/i.test(String(answer))
  }
  return Object.keys(options).includes(String(answer))
}

export interface ValidateResult {
  ok: boolean
  errors: string[]
}

/**
 * Validate a listening regen patch against an existing file object (pure).
 * `existing` provides topic/title/task_type/expected question count.
 */
export function validateListeningPatch(
  patch: ListeningRegenPatch,
  existing: any,
): ValidateResult {
  const errors: string[] = []
  if (!patch || !Array.isArray(patch.transcript_lines) || patch.transcript_lines.length === 0) {
    errors.push('transcript_lines missing/empty')
    return { ok: false, errors }
  }
  // Build a probe object that looks like a content file for the lib helpers.
  const probe = {
    topic: existing?.topic,
    title: existing?.title,
    transcript: { lines: patch.transcript_lines },
  }
  const transcriptText = normalizeText(transcriptDialogueText(probe))
  if (transcriptText.length < 120) errors.push('transcript dialogue too short (<120 chars)')
  if (internalDupRatio(probe) >= 0.2) {
    errors.push('transcript has fake looping segments (internalDupRatio >= 0.2)')
  }
  if (!transcriptMatchesTopic(probe)) {
    errors.push('transcript does not mention the declared topic/title')
  }

  if (!Array.isArray(patch.questions) || patch.questions.length === 0) {
    errors.push('questions[] missing/empty')
    return { ok: false, errors }
  }
  const expected = Array.isArray(existing?.questions) ? existing.questions.length : undefined
  if (expected != null && patch.questions.length !== expected) {
    errors.push(`expected ${expected} questions, got ${patch.questions.length}`)
  }
  const taskType = String(existing?.task_type ?? '')
  patch.questions.forEach((q, i) => {
    const tag = `Q[${i}]${q.id ? `(${q.id})` : ''}`
    if (!answerValidForType(q.answer, taskType, q.options)) {
      errors.push(`${tag}: answer invalid for task_type "${taskType}"`)
    }
    const ev = q?.explanation?.key_evidence
    if (typeof ev !== 'string' || !ev.trim()) errors.push(`${tag}: key_evidence missing`)
    else if (norm60(ev).length > 0 && !transcriptText.includes(norm60(ev))) {
      errors.push(`${tag}: key_evidence not found in new transcript (answer not verifiable)`)
    } else if (/^die berliner mauer$/i.test(ev.trim())) {
      errors.push(`${tag}: key_evidence is trivial filler`)
    }
    if (typeof q?.explanation?.de !== 'string' || !q.explanation.de.trim()) errors.push(`${tag}: explanation.de missing`)
    if (typeof q?.explanation?.vi !== 'string' || !q.explanation.vi.trim()) errors.push(`${tag}: explanation.vi missing`)
  })
  return { ok: errors.length === 0, errors }
}

function norm60(s: string): string {
  return normalizeText(s).slice(0, 60)
}

export interface ApplyResult {
  text: string
  error?: string
}

/**
 * Apply a listening regen patch to raw file text (pure). Keeps schema:
 * replaces only `transcript.lines` + `questions`, marks Audio_Restubbing
 * (`transcript.status`/`note`), updates stale `cefrAudit.verdict`, optionally
 * adjusts `metadata.gespraech_count`. Validates before producing output.
 */
export function applyListeningRegen(text: string, patch: ListeningRegenPatch): ApplyResult {
  let parsed: any
  try {
    parsed = JSON.parse(text)
  } catch (e) {
    return { text, error: `parse failed: ${(e as Error).message}` }
  }
  const v = validateListeningPatch(patch, parsed)
  if (!v.ok) return { text, error: v.errors.join('; ') }

  if (!parsed.transcript || typeof parsed.transcript !== 'object') parsed.transcript = {}
  parsed.transcript.lines = patch.transcript_lines
  parsed.transcript.status = 'needs_audio_rerecord'
  parsed.transcript.note =
    'Regenerated by content-listening-regeneration; MP3 pending re-record (Audio_Restubbing).'
  parsed.questions = patch.questions
  if (patch.gespraech_count != null) {
    if (!parsed.metadata || typeof parsed.metadata !== 'object') parsed.metadata = {}
    parsed.metadata.gespraech_count = patch.gespraech_count
  }
  if (parsed.cefrAudit && typeof parsed.cefrAudit === 'object') {
    parsed.cefrAudit.verdict = 'pending_reaudit'
  }
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
    process.stdout.write(
      '[apply-listening-regen] no --patch given. Use --patch <file.json> (map of contentFile -> {transcript_lines[], questions[], gespraech_count?}).\n',
    )
    return
  }
  const patches: Record<string, ListeningRegenPatch> = JSON.parse(
    fs.readFileSync(path.resolve(REPO_ROOT, args.patch), 'utf8'),
  )
  let applied = 0
  const errors: string[] = []
  for (const [rel, patch] of Object.entries(patches)) {
    const abs = path.resolve(REPO_ROOT, rel)
    if (!fs.existsSync(abs)) { errors.push(`${rel}: file missing`); continue }
    const r = applyListeningRegen(fs.readFileSync(abs, 'utf8'), patch)
    if (r.error) { errors.push(`${rel}: ${r.error}`); continue }
    if (args.dryRun) {
      process.stdout.write(
        `[dry-run] ${rel}: OK (${patch.transcript_lines.length} lines, ${patch.questions.length} questions)\n`,
      )
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
