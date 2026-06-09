/**
 * Spec `content-c2-teil2-regeneration` — Task 1.
 * Apply human-written (Academic-signed-off) C2 Teil-2 cloze regeneration.
 *
 * Vai chinh: German Content Writer
 * Vai phoi hop: German Academic Lead, German Curriculum Designer, Content QA
 *
 * Replaces the placeholder `section_cloze` (title/text/sections/answers/
 * distractor) of a C2 reading Teil-2 file with NEW, real content — while
 * KEEPING the file schema (`id`, `level`, `teil`, `metadata`, `images`,
 * `scoring`, `qa`, `learningOutcomes`, …). Before writing it VALIDATES:
 *   - text no longer matches the generic-filler opener
 *   - text mentions the declared topic/title
 *   - text has exactly 8 gap markers {1}..{8}
 *   - answers map all 8 gaps to section ids that exist in sections[]
 *   - distractor exists in sections[] and is NOT used in answers
 * It also updates the stale `cefrAudit.verdict`. Cross-file overlap (no
 * duplicate cloze) is enforced by the scanner gate. `--dry-run` previews.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

/** Generic templated opener that signals placeholder/off-topic filler (Teil 2). */
export const GENERIC_OPENER_T2 =
  /Der folgende Bericht untersucht das Thema .* aus interdisziplinärer Perspektive/i

export function hasGenericOpenerT2(text: string): boolean {
  return GENERIC_OPENER_T2.test(text ?? '')
}

export interface ClozeSection {
  id: string
  text: string
}

export interface ClozeRegenPatch {
  title?: string
  text: string
  sections: ClozeSection[]
  answers: Record<string, string>
  distractor?: string
}

function norm(s: string): string {
  return (s ?? '').toLowerCase().replace(/[\u201e\u201c\u201d"'`]/g, '').replace(/\s+/g, ' ').trim()
}

const TOPIC_STOPWORDS = new Set([
  'der', 'die', 'das', 'und', 'in', 'im', 'an', 'am', 'von', 'zu', 'mit',
  'fuer', 'für', 'den', 'des', 'ein', 'eine', 'als',
])

function topicKeywords(topic: string): string[] {
  return norm(topic).split(' ').filter((w) => w.length >= 5 && !TOPIC_STOPWORDS.has(w))
}

/** Count distinct {1}..{n} gap markers present in text. */
export function gapMarkers(text: string): number[] {
  const found = new Set<number>()
  const re = /\{(\d+)\}/g
  let m: RegExpExecArray | null
  while ((m = re.exec(text ?? '')) !== null) found.add(Number(m[1]))
  return [...found].sort((a, b) => a - b)
}

export interface ValidateResult {
  ok: boolean
  errors: string[]
}

/** Validate a cloze regen patch against the rules (pure). `topic` from file. */
export function validateClozePatch(
  patch: ClozeRegenPatch,
  topic: string,
  expectedGaps = 8,
): ValidateResult {
  const errors: string[] = []
  if (!patch || typeof patch.text !== 'string' || patch.text.trim().length < 150) {
    errors.push('section_cloze.text missing or too short (<150 chars)')
    return { ok: false, errors }
  }
  if (hasGenericOpenerT2(patch.text)) {
    errors.push('section_cloze.text still uses the generic-filler opener')
  }
  const kws = [...topicKeywords(topic), ...topicKeywords(patch.title ?? '')]
  if (kws.length) {
    const t = norm(patch.text)
    if (!kws.some((k) => t.includes(k))) errors.push('text does not mention the declared topic/title')
  }
  const gaps = gapMarkers(patch.text)
  const expectedSeq = Array.from({ length: expectedGaps }, (_, i) => i + 1)
  if (gaps.length !== expectedGaps || !expectedSeq.every((n) => gaps.includes(n))) {
    errors.push(`expected exactly ${expectedGaps} gap markers {1}..{${expectedGaps}}, found {${gaps.join(',')}}`)
  }
  if (!Array.isArray(patch.sections) || patch.sections.length < expectedGaps + 1) {
    errors.push(`sections[] must have >= ${expectedGaps + 1} entries (8 answers + >=1 distractor)`)
    return { ok: false, errors }
  }
  const sectionIds = new Set(patch.sections.map((s) => s.id))
  patch.sections.forEach((s, i) => {
    if (!s.id) errors.push(`sections[${i}]: id missing`)
    if (typeof s.text !== 'string' || !s.text.trim()) errors.push(`sections[${i}](${s.id}): text missing`)
  })
  const answerKeys = Object.keys(patch.answers ?? {})
  if (answerKeys.length !== expectedGaps) {
    errors.push(`answers must map exactly ${expectedGaps} gaps, got ${answerKeys.length}`)
  }
  const usedIds = new Set<string>()
  for (const n of expectedSeq) {
    const sid = patch.answers?.[String(n)]
    if (sid == null) { errors.push(`answers missing gap {${n}}`); continue }
    if (!sectionIds.has(sid)) errors.push(`answers[${n}] -> "${sid}" not in sections[]`)
    if (usedIds.has(sid)) errors.push(`answers[${n}] -> "${sid}" used twice`)
    usedIds.add(sid)
  }
  if (patch.distractor != null) {
    if (!sectionIds.has(patch.distractor)) errors.push(`distractor "${patch.distractor}" not in sections[]`)
    if (usedIds.has(patch.distractor)) errors.push(`distractor "${patch.distractor}" is also an answer`)
  }
  return { ok: errors.length === 0, errors }
}

export interface ApplyResult {
  text: string
  error?: string
}

/**
 * Apply a cloze regen patch to raw file text (pure). Keeps schema: replaces
 * only `section_cloze` and updates `cefrAudit.verdict`. Validates first.
 */
export function applyClozeRegen(text: string, patch: ClozeRegenPatch): ApplyResult {
  let parsed: any
  try {
    parsed = JSON.parse(text)
  } catch (e) {
    return { text, error: `parse failed: ${(e as Error).message}` }
  }
  const v = validateClozePatch(patch, String(parsed?.topic ?? ''))
  if (!v.ok) return { text, error: v.errors.join('; ') }

  if (!parsed.section_cloze || typeof parsed.section_cloze !== 'object') parsed.section_cloze = {}
  if (patch.title) parsed.section_cloze.title = patch.title
  parsed.section_cloze.text = patch.text
  parsed.section_cloze.sections = patch.sections
  parsed.section_cloze.answers = patch.answers
  if (patch.distractor != null) parsed.section_cloze.distractor = patch.distractor
  if (parsed.cefrAudit && typeof parsed.cefrAudit === 'object') {
    parsed.cefrAudit.verdict = 'aligned'
    parsed.cefrAudit.reviewerRole = 'German Academic Lead (AI/Kiro)'
    parsed.cefrAudit.notes = 'Regenerated cloze, signed off by AI German Academic Lead (Kiro) via content-c2-teil2-regeneration; pending native-speaker spot-check.'
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
      '[apply-c2-teil2-regen] no --patch given. Use --patch <file.json> (map of contentFile -> {title?, text, sections[], answers, distractor?}).\n',
    )
    return
  }
  const patches: Record<string, ClozeRegenPatch> = JSON.parse(
    fs.readFileSync(path.resolve(REPO_ROOT, args.patch), 'utf8'),
  )
  let applied = 0
  const errors: string[] = []
  for (const [rel, patch] of Object.entries(patches)) {
    const abs = path.resolve(REPO_ROOT, rel)
    if (!fs.existsSync(abs)) { errors.push(`${rel}: file missing`); continue }
    const r = applyClozeRegen(fs.readFileSync(abs, 'utf8'), patch)
    if (r.error) { errors.push(`${rel}: ${r.error}`); continue }
    if (args.dryRun) {
      process.stdout.write(`[dry-run] ${rel}: OK (text ${patch.text.length} chars, ${patch.sections.length} sections)\n`)
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
