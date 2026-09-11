/**
 * Spec `content-cefr-stem-regeneration` — Task 1.
 * Apply human-written (Academic-signed-off) stem patches to reading content.
 *
 * Vai chinh: German Content Writer
 * Vai phoi hop: German Academic Lead, Content QA / Linguistic Reviewer
 *
 * SAFETY: surgical, value-invariant. For each patch it replaces ONLY the exact
 * JSON string value of `stem` (and optionally key_evidence / explanation.de /
 * a text fix) of the targeted question, via string replacement of the precise
 * old encoded value — it never re-serialises the whole file (preserves
 * formatting) and ASSERTS that every question's `answer`/`options` is unchanged
 * after the edit (aborts otherwise). READ scope is limited to b2/c1/c2 reading.
 *
 * Patch file (JSON array):
 *   [{ "file": "content/c2/reading/C2-T1-001.json", "itemId": "Q4",
 *      "newStem": "Was fordert Hart ...?",
 *      "newKeyEvidence"?: "...", "newDe"?: "...",
 *      "textFix"?: { "from": "intellectual", "to": "intellektuellen" } }]
 *
 * CLI:
 *   --patch <file>   patch JSON (required to apply)
 *   --level <b2|c1|c2>  restrict to one level
 *   --dry-run        print the diff summary, write nothing (default if no --patch)
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

export interface StemPatch {
  file: string
  itemId: string
  newStem?: string
  newKeyEvidence?: string
  newDe?: string
  textFix?: { from: string; to: string; all?: boolean }
}

/** JSON-encode a string the way it appears as a value inside the file. */
export function enc(s: string): string {
  return JSON.stringify(s)
}

/** Find a question object by id in a parsed reading file. */
export function findQuestion(parsed: any, itemId: string): any | null {
  if (!parsed || !Array.isArray(parsed.questions)) return null
  return parsed.questions.find((q: any) => String(q?.id ?? '') === itemId) ?? null
}

/** Snapshot of the invariants that must never change. */
export function answerOptionsSnapshot(parsed: any): string {
  if (!parsed || !Array.isArray(parsed.questions)) return '[]'
  return JSON.stringify(
    parsed.questions.map((q: any) => ({ id: q?.id, answer: q?.answer, correctIndex: q?.correctIndex, options: q?.options })),
  )
}

/**
 * Locate the raw-text region [start,end) belonging to one question, so that
 * field replacements are SCOPED to that question (avoids "not unique" when a
 * truncated key_evidence string repeats across questions). The region runs from
 * this question's `"id": "<itemId>"` marker to the next question's `"id": "Q...`
 * marker (or end of text).
 */
export function questionRegion(text: string, itemId: string): [number, number] | null {
  const idNeedle = `"id": ${enc(itemId)}`
  const start = text.indexOf(idNeedle)
  if (start < 0) return null
  const nextId = text.indexOf('"id": "Q', start + idNeedle.length)
  return [start, nextId < 0 ? text.length : nextId]
}

export interface ApplyResult {
  text: string
  changes: string[]
  error?: string
}

/**
 * Apply one patch to the raw file text. Pure: returns new text + a change log,
 * or an error (without mutating). Replaces only the exact old encoded values.
 */
export function applyPatchToText(text: string, patch: StemPatch): ApplyResult {
  let parsed: any
  try {
    parsed = JSON.parse(text)
  } catch (e) {
    return { text, changes: [], error: `parse failed: ${(e as Error).message}` }
  }
  const q = findQuestion(parsed, patch.itemId)
  if (!q) return { text, changes: [], error: `question ${patch.itemId} not found` }

  const beforeSnap = answerOptionsSnapshot(parsed)
  let out = text
  const changes: string[] = []

  const region = questionRegion(out, patch.itemId)
  if (!region) return { text, changes: [], error: `question ${patch.itemId} region not found` }

  // Scoped surgical replace: the old value must be unique WITHIN this question's
  // text region (not the whole file), then we reassemble.
  const surgical = (oldVal: unknown, newVal: string, label: string): string | null => {
    if (typeof oldVal !== 'string') return `${label}: old value missing/not string`
    if (oldVal === newVal) return null
    const [rs, re] = questionRegion(out, patch.itemId)! // recompute (text shifts)
    const block = out.slice(rs, re)
    const needle = enc(oldVal)
    const repl = enc(newVal)
    const idx = block.indexOf(needle)
    if (idx < 0) return `${label}: exact old value not found in question region`
    if (block.indexOf(needle, idx + 1) >= 0) return `${label}: old value not unique within question region`
    const newBlock = block.slice(0, idx) + repl + block.slice(idx + needle.length)
    out = out.slice(0, rs) + newBlock + out.slice(re)
    changes.push(label)
    return null
  }

  if (patch.newStem !== undefined) {
    const err = surgical(q.stem, patch.newStem, `${patch.itemId}.stem`)
    if (err) return { text, changes: [], error: err }
  }
  if (patch.newKeyEvidence !== undefined) {
    const err = surgical(q?.explanation?.key_evidence, patch.newKeyEvidence, `${patch.itemId}.key_evidence`)
    if (err) return { text, changes: [], error: err }
  }
  if (patch.newDe !== undefined) {
    const err = surgical(q?.explanation?.de, patch.newDe, `${patch.itemId}.explanation.de`)
    if (err) return { text, changes: [], error: err }
  }
  if (patch.textFix) {
    const occ = out.split(patch.textFix.from).length - 1
    if (occ === 0) return { text, changes: [], error: `textFix "${patch.textFix.from}" not found` }
    if (occ > 1 && !patch.textFix.all) {
      return { text, changes: [], error: `textFix "${patch.textFix.from}" occurs ${occ}x (need exactly 1, or set "all": true)` }
    }
    out = out.split(patch.textFix.from).join(patch.textFix.to)
    changes.push(`${patch.itemId}.textFix${patch.textFix.all ? `(x${occ})` : ''}`)
  }

  // Invariant: answer/options unchanged after the edit.
  let after: any
  try {
    after = JSON.parse(out)
  } catch (e) {
    return { text, changes: [], error: `post-edit parse failed: ${(e as Error).message}` }
  }
  if (answerOptionsSnapshot(after) !== beforeSnap) {
    return { text, changes: [], error: 'answer/options changed — aborted (invariant violated)' }
  }
  return { text: out, changes }
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

const REPO_ROOT = path.resolve(fileURLToPath(import.meta.url), '..', '..')

interface CliArgs { patch?: string; level?: string; dryRun: boolean }

export function parseArgs(argv: readonly string[]): CliArgs {
  const a: CliArgs = { dryRun: false }
  for (let i = 0; i < argv.length; i++) {
    const x = argv[i]
    if (x === '--dry-run') a.dryRun = true
    else if (x === '--patch') a.patch = String(argv[++i] ?? '')
    else if (x.startsWith('--patch=')) a.patch = x.slice('--patch='.length)
    else if (x === '--level') a.level = String(argv[++i] ?? '').toLowerCase()
    else if (x.startsWith('--level=')) a.level = x.slice('--level='.length).toLowerCase()
  }
  if (!a.patch) a.dryRun = true
  return a
}

function main(): void {
  const args = parseArgs(process.argv.slice(2))
  if (!args.patch) {
    process.stdout.write('[regenerate-cefr-stems] no --patch given; nothing to apply. Use --patch <file.json>.\n')
    return
  }
  const patches: StemPatch[] = JSON.parse(fs.readFileSync(path.resolve(REPO_ROOT, args.patch), 'utf8'))
  const byFile = new Map<string, StemPatch[]>()
  for (const p of patches) {
    if (args.level && !p.file.includes(`/${args.level}/`)) continue
    ;(byFile.get(p.file) ?? byFile.set(p.file, []).get(p.file)!).push(p)
  }

  let applied = 0
  const errors: string[] = []
  for (const [rel, ps] of byFile) {
    const abs = path.resolve(REPO_ROOT, rel)
    if (!fs.existsSync(abs)) { errors.push(`${rel}: file missing`); continue }
    let text = fs.readFileSync(abs, 'utf8')
    const fileChanges: string[] = []
    for (const p of ps) {
      const r = applyPatchToText(text, p)
      if (r.error) { errors.push(`${rel} ${p.itemId}: ${r.error}`); continue }
      text = r.text
      fileChanges.push(...r.changes)
    }
    if (fileChanges.length === 0) continue
    if (args.dryRun) {
      process.stdout.write(`[dry-run] ${rel}: would change ${fileChanges.join(', ')}\n`)
    } else {
      fs.writeFileSync(abs, text, 'utf8')
      process.stdout.write(`[applied] ${rel}: ${fileChanges.join(', ')}\n`)
      applied += fileChanges.length
    }
  }
  process.stdout.write(`\n${args.dryRun ? 'DRY-RUN' : 'APPLIED'} changes=${applied} errors=${errors.length}\n`)
  for (const e of errors) process.stderr.write(`  ! ${e}\n`)
  if (errors.length) process.exitCode = 1
}

const invokedDirectly =
  process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
if (invokedDirectly) main()
