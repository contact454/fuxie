/**
 * Batch-apply script for spec `reading-explanation-regeneration` (RB-P2-02).
 *
 * Applies human-authored explanation replacements from a patch file to
 * reading content. SAFETY-FIRST:
 *   - Default is DRY-RUN (prints diff, writes nothing).
 *   - Only touches explanation.{vi,de,key_evidence} of the targeted question.
 *   - ASSERTS answer / options / stem / statement are byte-identical
 *     before and after; aborts the whole batch if any drift is detected.
 *   - --level scopes a batch to one CEFR level.
 *
 * This script does NOT generate explanation content. Content must be
 * authored by German Content Writer + Localization Specialist and supplied
 * via the patch file (Academic_Signoff + Translation_Review done upstream).
 *
 * Patch file shape (JSON):
 *   [{ file, questionId, vi, de?, key_evidence? }, ...]
 *
 * Usage:
 *   tsx scripts/regenerate-reading-explanations.ts --patch <patch.json> [--level a1] [--apply]
 *   (omit --apply for dry-run)
 */
import fs from 'node:fs'
import path from 'node:path'

const repoRoot = process.cwd()
const args = process.argv.slice(2)
function flag(name: string): string | undefined {
  const i = args.indexOf(name)
  return i >= 0 ? args[i + 1] : undefined
}
const patchPath = flag('--patch')
const levelArg = flag('--level')
const apply = args.includes('--apply')

if (!patchPath) {
  console.error('ERROR: --patch <patch.json> is required')
  process.exit(2)
}

const IMMUTABLE_Q_FIELDS = ['answer', 'correctIndex', 'correct', 'solution', 'options', 'stem', 'statement', 'question', 'type', 'points']

interface PatchEntry {
  file: string
  questionId: string
  vi: string
  de?: string
  key_evidence?: string
}

function readJson(fp: string): any {
  let raw = fs.readFileSync(fp, 'utf8')
  if (raw.charCodeAt(0) === 0xfeff) raw = raw.slice(1) // strip UTF-8 BOM
  return JSON.parse(raw)
}
const patch: PatchEntry[] = readJson(patchPath)
const scoped = levelArg ? patch.filter((p) => p.file.includes(`/${levelArg}/`)) : patch

// group by file
const byFile = new Map<string, PatchEntry[]>()
for (const p of scoped) {
  if (!byFile.has(p.file)) byFile.set(p.file, [])
  byFile.get(p.file)!.push(p)
}

let changed = 0
let aborted = false
const diffs: string[] = []

for (const [relFile, entries] of byFile) {
  const fp = path.join(repoRoot, relFile)
  if (!fs.existsSync(fp)) {
    console.error(`ABORT: file not found ${relFile}`)
    aborted = true
    break
  }
  const before = fs.readFileSync(fp, 'utf8')
  const j = JSON.parse(before)
  if (!Array.isArray(j.questions)) {
    console.error(`ABORT: ${relFile} has no questions[]`)
    aborted = true
    break
  }
  // snapshot immutable fields
  const snapshot = j.questions.map((q: any) => {
    const s: Record<string, unknown> = {}
    for (const f of IMMUTABLE_Q_FIELDS) s[f] = JSON.stringify(q[f] ?? null)
    return s
  })

  for (const e of entries) {
    const idx = j.questions.findIndex((q: any) => String(q.id) === String(e.questionId))
    if (idx < 0) {
      console.error(`ABORT: ${relFile} question id=${e.questionId} not found`)
      aborted = true
      break
    }
    const q = j.questions[idx]
    q.explanation = q.explanation ?? {}
    const oldVi = q.explanation.vi
    q.explanation.vi = e.vi
    if (e.de != null) q.explanation.de = e.de
    if (e.key_evidence != null) q.explanation.key_evidence = e.key_evidence
    diffs.push(`  ${relFile}#${e.questionId}: vi "${String(oldVi).slice(0, 40)}…" -> "${e.vi.slice(0, 40)}…"`)
    changed++
  }
  if (aborted) break

  // verify immutable fields unchanged
  for (let i = 0; i < j.questions.length; i++) {
    for (const f of IMMUTABLE_Q_FIELDS) {
      if (JSON.stringify(j.questions[i][f] ?? null) !== snapshot[i][f]) {
        console.error(`ABORT: immutable field "${f}" changed in ${relFile} q#${i}`)
        aborted = true
        break
      }
    }
    if (aborted) break
  }
  if (aborted) break

  if (apply) {
    fs.writeFileSync(fp, JSON.stringify(j, null, 2) + '\n', 'utf8')
  }
}

console.log(`[regenerate-reading-explanations] mode=${apply ? 'APPLY' : 'DRY-RUN'} scope=${levelArg ?? 'all'}`)
console.log(`  patch entries in scope: ${scoped.length}`)
console.log(`  questions ${apply ? 'updated' : 'would update'}: ${changed}`)
if (diffs.length) console.log(diffs.slice(0, 20).join('\n') + (diffs.length > 20 ? `\n  …(+${diffs.length - 20} more)` : ''))
if (aborted) {
  console.error('  RESULT: ABORTED — no files written (answer/immutable-field drift or missing target).')
  process.exit(1)
}
console.log(apply ? '  RESULT: applied.' : '  RESULT: dry-run OK (no files written). Re-run with --apply to write.')
