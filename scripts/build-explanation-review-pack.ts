/**
 * READ-ONLY review-pack builder for the 1,282 regenerated reading explanations
 * (commit 755326d25, PR #21). Spec context: RB-P2-02 human sign-off.
 *
 * This script DOES NOT modify content/. It only reads content/*\/reading/*.json
 * (current working tree) plus the de-explanation classification from the PARENT
 * commit (db63af82d) to recover the original Rich / Rewritten split, then writes
 * a reviewer pack under docs/content-quality/audit-2026-06/explanation-review/.
 *
 * Layer A (machine pre-screen): objective signals only — NO judgement of German
 * quality. Layer B: a stratified, reproducible sample for human reviewers with
 * EMPTY verdict columns. Kiro never fills a verdict.
 *
 * Usage: tsx scripts/build-explanation-review-pack.ts
 */
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { execSync } from 'node:child_process'

const repoRoot = process.cwd()
const LEVELS = ['a1', 'a2', 'b1', 'b2', 'c1', 'c2'] as const
const PARENT_COMMIT = 'db63af82d' // parent of 755326d25 (pre-regen de text)
const OUT_DIR = path.join('docs', 'content-quality', 'audit-2026-06', 'explanation-review')
const SEED = 'fuxie-explanation-review-2026-06'

// ---- helpers -------------------------------------------------------------

function norm(s: string): string {
  return (s ?? '')
    .toLowerCase()
    .replace(/[\u201e\u201c\u201d\u00ab\u00bb"'`\u2018\u2019]/g, '') // quotes
    .replace(/\s+/g, ' ')
    .trim()
}

function classifyDe(de: string): 'rich' | 'templated' | 'thin' {
  const s = (de ?? '').trim()
  if (s.length < 15) return 'thin'
  if (/^Die richtige Antwort ist/i.test(s)) return 'templated'
  return 'rich'
}

const VI_BOILERPLATE_TAIL = /Hãy đối chiếu với thông tin then chốt trong bài (đọc|nghe)\.?\s*$/i
function isBoilerplateVi(vi: string): boolean {
  if (!vi || !vi.trim()) return true
  return VI_BOILERPLATE_TAIL.test(vi.trim())
}

// objective mojibake / replacement-char detector
const MOJIBAKE = /\uFFFD|Ã¤|Ã¶|Ã¼|Ã\u009f|Ã„|Ã–|Ãœ|â€™|â€œ|â€\u009d|Ã©|Ã¨/

// Hard flags = concrete structural defect -> mandatory human review.
// Soft flags = heuristic signal (paraphrase-tolerant / statistical) -> oversampled.
const HARD_FLAGS = new Set([
  'no_key_evidence',
  'de_template_residue',
  'de_too_thin',
  'vi_boilerplate_or_empty',
  'vi_no_answer_ref',
  'mojibake',
])

// content-word tokens (len>=4, umlaut-normalized) for evidence-overlap proxy
function contentTokens(s: string): string[] {
  return norm(s)
    .replace(/ä/g, 'a').replace(/ö/g, 'o').replace(/ü/g, 'u').replace(/ß/g, 'ss')
    .replace(/[^a-z0-9 ]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length >= 4)
}

function evidenceOverlap(de: string, evidence: string): number {
  const ev = contentTokens(evidence)
  if (!ev.length) return 1 // nothing to cover
  const deNorm = ' ' + contentTokens(de).join(' ') + ' '
  const hit = ev.filter((t) => deNorm.includes(' ' + t + ' ')).length
  return hit / ev.length
}

function answerOf(q: any): string | number | null {
  if (q.answer != null) return q.answer
  if (q.correctIndex != null) return q.correctIndex
  if (q.correct != null) return q.correct
  if (q.solution != null) return q.solution
  return null
}

function promptOf(q: any): string {
  return String(q.statement ?? q.stem ?? q.situation ?? q.question ?? q.text ?? '')
}

function hashRank(key: string): number {
  const h = crypto.createHash('md5').update(SEED + '|' + key).digest('hex')
  return parseInt(h.slice(0, 12), 16)
}

function csvCell(v: unknown): string {
  const s = String(v ?? '').replace(/\r?\n/g, ' / ')
  return '"' + s.replace(/"/g, '""') + '"'
}

function isSidecar(name: string): boolean {
  return /\.qa\.json$/i.test(name) || /\.meta\.json$/i.test(name)
}

// ---- recover original de-class from parent commit -----------------------

function originalDeClassMap(): Map<string, 'rich' | 'templated' | 'thin'> {
  const map = new Map<string, 'rich' | 'templated' | 'thin'>()
  for (const lv of LEVELS) {
    const dir = path.join(repoRoot, 'content', lv, 'reading')
    if (!fs.existsSync(dir)) continue
    for (const name of fs.readdirSync(dir)) {
      if (!name.endsWith('.json') || isSidecar(name)) continue
      const rel = `content/${lv}/reading/${name}`
      let raw: string
      try {
        raw = execSync(`git show ${PARENT_COMMIT}:"${rel}"`, {
          cwd: repoRoot,
          encoding: 'utf8',
          maxBuffer: 64 * 1024 * 1024,
          stdio: ['ignore', 'pipe', 'ignore'],
        })
      } catch {
        continue // file did not exist in parent
      }
      let j: any
      try {
        j = JSON.parse(raw)
      } catch {
        continue
      }
      if (!Array.isArray(j.questions)) continue
      j.questions.forEach((q: any, i: number) => {
        if (answerOf(q) == null) return
        const de = typeof q?.explanation?.de === 'string' ? q.explanation.de : ''
        map.set(`${rel}#${i}`, classifyDe(de))
      })
    }
  }
  return map
}

// ---- scan current working tree ------------------------------------------

interface Row {
  level: string
  file: string
  itemId: string
  index: number
  teil: string
  type: string
  answer: string
  options: string
  prompt: string
  keyEvidence: string
  keyVocab: string
  de: string
  vi: string
  deClassCurrent: string
  deClassOriginal: 'rich' | 'templated' | 'thin' | 'unknown'
  isRewritten: boolean // original templated|thin
  flags: string[]
}

function scan(origMap: Map<string, 'rich' | 'templated' | 'thin'>): Row[] {
  const rows: Row[] = []
  for (const lv of LEVELS) {
    const dir = path.join(repoRoot, 'content', lv, 'reading')
    if (!fs.existsSync(dir)) continue
    for (const name of fs.readdirSync(dir)) {
      if (!name.endsWith('.json') || isSidecar(name)) continue
      const fp = path.join(dir, name)
      const rel = `content/${lv}/reading/${name}`
      let j: any
      try {
        j = JSON.parse(fs.readFileSync(fp, 'utf8'))
      } catch {
        continue
      }
      if (!Array.isArray(j.questions)) continue
      j.questions.forEach((q: any, i: number) => {
        const ans = answerOf(q)
        if (ans == null) return
        const exp = q.explanation ?? {}
        const de = typeof exp.de === 'string' ? exp.de : ''
        const vi = typeof exp.vi === 'string' ? exp.vi : ''
        const keyEvidence = typeof exp.key_evidence === 'string' ? exp.key_evidence : ''
        const keyVocab = Array.isArray(exp.key_vocabulary)
          ? exp.key_vocabulary.map((k: any) => `${k.word}=${k.meaning}`).join('; ')
          : ''
        const options = Array.isArray(q.options)
          ? q.options.map((o: any) => (typeof o === 'string' ? o : o?.text ?? JSON.stringify(o))).join(' | ')
          : ''
        const orig = origMap.get(`${rel}#${i}`) ?? 'unknown'
        rows.push({
          level: lv,
          file: rel,
          itemId: String(q.id ?? i),
          index: i,
          teil: String(q.teil ?? j.teil ?? ''),
          type: String(q.type ?? ''),
          answer: String(ans),
          options,
          prompt: promptOf(q),
          keyEvidence,
          keyVocab,
          de,
          vi,
          deClassCurrent: classifyDe(de),
          deClassOriginal: orig,
          isRewritten: orig === 'templated' || orig === 'thin',
          flags: [],
        })
      })
    }
  }
  return rows
}

// ---- Layer A: objective pre-screen --------------------------------------

function prescreen(rows: Row[]): void {
  // per-level median lengths (non-empty) for anomaly detection
  const deLens: Record<string, number[]> = {}
  const viLens: Record<string, number[]> = {}
  for (const r of rows) {
    if (r.de.trim()) (deLens[r.level] ||= []).push(r.de.trim().length)
    if (r.vi.trim()) (viLens[r.level] ||= []).push(r.vi.trim().length)
  }
  const median = (a: number[]) => {
    if (!a.length) return 0
    const s = [...a].sort((x, y) => x - y)
    const m = Math.floor(s.length / 2)
    return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2
  }
  const deMed: Record<string, number> = {}
  const viMed: Record<string, number> = {}
  for (const lv of LEVELS) {
    deMed[lv] = median(deLens[lv] || [])
    viMed[lv] = median(viLens[lv] || [])
  }

  for (const r of rows) {
    // 1. de must cover key_evidence (token-overlap, paraphrase-tolerant)
    if (!r.keyEvidence.trim()) {
      r.flags.push('no_key_evidence')
    } else if (evidenceOverlap(r.de, r.keyEvidence) < 0.5) {
      r.flags.push('de_low_evidence_overlap')
    }
    // 2. residual German template
    if (r.deClassCurrent === 'templated') r.flags.push('de_template_residue')
    if (r.deClassCurrent === 'thin') r.flags.push('de_too_thin')
    // 3. vi boilerplate / empty
    if (isBoilerplateVi(r.vi)) r.flags.push('vi_boilerplate_or_empty')
    // 4. vi does not reference the answer/content
    else {
      const nv = norm(r.vi)
      const refsAnswer =
        nv.includes('đáp án') ||
        nv.includes(norm(r.answer)) ||
        (r.options &&
          r.options.split(' | ').some((o) => o.trim() && nv.includes(norm(o))))
      if (!refsAnswer) r.flags.push('vi_no_answer_ref')
    }
    // 5. length anomaly (< 40% of level median)
    if (deMed[r.level] && r.de.trim().length < 0.4 * deMed[r.level]) r.flags.push('de_len_anomaly')
    if (viMed[r.level] && r.vi.trim().length < 0.4 * viMed[r.level]) r.flags.push('vi_len_anomaly')
    // 6. mojibake
    if (MOJIBAKE.test(r.de) || MOJIBAKE.test(r.vi)) r.flags.push('mojibake')
  }
}

// ---- Layer B: reproducible stratified sample ----------------------------

function buildSample(rows: Row[]): Row[] {
  const selected = new Map<string, Row>()
  const key = (r: Row) => `${r.file}#${r.index}`
  const add = (r: Row) => selected.set(key(r), r)
  const byRank = (a: Row, b: Row) => hashRank(key(a)) - hashRank(key(b))

  // Tier 0 — MANDATORY: every flagged item (hard + soft). Acceptance: sample
  // must contain all pre-screen-flagged items.
  for (const r of rows) if (r.flags.length) add(r)

  // Tier 1 — oversample de-rewritten (target >= 60 in sample)
  const rewritten = rows.filter((r) => r.isRewritten).sort(byRank)
  for (const r of rewritten) {
    if ([...selected.values()].filter((x) => x.isRewritten).length >= 60) break
    add(r)
  }
  // Tier 2 — oversample C1/C2 (target >= 30 in sample)
  const hard = rows.filter((r) => r.level === 'c1' || r.level === 'c2').sort(byRank)
  for (const r of hard) {
    if ([...selected.values()].filter((x) => x.level === 'c1' || x.level === 'c2').length >= 30) break
    add(r)
  }
  // Tier 3 — stratified representative core: ensure each present (level x type)
  // stratum has >= 1, then add UNFLAGGED items (baseline for unbiased pass-rate)
  // until at least 72 unflagged items are in the sample.
  const strata = new Map<string, Row[]>()
  for (const r of rows) (strata.get(`${r.level}|${r.type}`) ?? strata.set(`${r.level}|${r.type}`, []).get(`${r.level}|${r.type}`)!).push(r)
  for (const [, group] of strata) {
    if (!group.some((r) => selected.has(key(r)))) add([...group].sort(byRank)[0])
  }
  const unflagged = rows.filter((r) => !r.flags.length).sort(byRank)
  for (const r of unflagged) {
    if ([...selected.values()].filter((x) => !x.flags.length).length >= 72) break
    add(r)
  }
  return [...selected.values()].sort((a, b) => a.file.localeCompare(b.file) || a.index - b.index)
}

// ---- main ---------------------------------------------------------------

console.log('[review-pack] recovering original de-class from parent commit', PARENT_COMMIT, '...')
const origMap = originalDeClassMap()
console.log(`[review-pack] original-class map entries = ${origMap.size}`)

const rows = scan(origMap)
console.log(`[review-pack] answer-bearing reading questions (current) = ${rows.length}`)

prescreen(rows)
const sample = buildSample(rows)

fs.mkdirSync(OUT_DIR, { recursive: true })

// --- full-traceability.csv ---
{
  const head = [
    'file_path', 'item_id', 'index', 'level', 'type', 'teil', 'answer',
    'de_class_original', 'de_class_current', 'de_len', 'vi_len', 'prescreen_flags',
  ]
  const lines = [head.join(',')]
  for (const r of rows) {
    lines.push([
      csvCell(r.file), csvCell(r.itemId), csvCell(r.index), csvCell(r.level),
      csvCell(r.type), csvCell(r.teil), csvCell(r.answer),
      csvCell(r.isRewritten ? 'rewritten' : r.deClassOriginal === 'rich' ? 'translate-only' : r.deClassOriginal),
      csvCell(r.deClassCurrent), csvCell(r.de.trim().length), csvCell(r.vi.trim().length),
      csvCell(r.flags.join('|')),
    ].join(','))
  }
  fs.writeFileSync(path.join(OUT_DIR, 'full-traceability.csv'), lines.join('\n') + '\n', 'utf8')
  console.log(`[review-pack] full-traceability.csv = ${rows.length} rows`)
}

// --- sample-review.csv (verdict columns EMPTY) ---
{
  const head = [
    'file_path', 'item_id', 'level', 'type', 'teil',
    'prompt', 'answer', 'options', 'key_evidence', 'de', 'vi',
    'de_class', 'prescreen_flags', 'selection_reason',
    'verdict', 'error_dimension', 'note', // <-- LEFT BLANK for human reviewer
  ]
  const lines = [head.join(',')]
  for (const r of sample) {
    lines.push([
      csvCell(r.file), csvCell(r.itemId), csvCell(r.level), csvCell(r.type), csvCell(r.teil),
      csvCell(r.prompt), csvCell(r.answer), csvCell(r.options), csvCell(r.keyEvidence),
      csvCell(r.de), csvCell(r.vi),
      csvCell(r.isRewritten ? 'rewritten' : 'translate-only'),
      csvCell(r.flags.join('|')),
      csvCell(r.flags.length ? 'flagged' : 'stratified'),
      csvCell(''), csvCell(''), csvCell(''),
    ].join(','))
  }
  fs.writeFileSync(path.join(OUT_DIR, 'sample-review.csv'), lines.join('\n') + '\n', 'utf8')
  console.log(`[review-pack] sample-review.csv = ${sample.length} rows (verdict blank)`)
}

// --- prescreen-summary.md ---
{
  const flagCounts: Record<string, number> = {}
  const flaggedItems: Row[] = []
  for (const r of rows) {
    if (r.flags.length) flaggedItems.push(r)
    for (const f of r.flags) flagCounts[f] = (flagCounts[f] || 0) + 1
  }
  const byLevel: Record<string, number> = {}
  for (const r of rows) byLevel[r.level] = (byLevel[r.level] || 0) + 1
  const rewrittenCount = rows.filter((r) => r.isRewritten).length

  let md = `# Pre-screen Summary — Reading Explanation Review (2026-06)\n\n`
  md += `> Layer A machine pre-screen. **Objective signals only** — no judgement of German quality. Every flag points to a concrete, checkable defect. Read-only over \`content/\`.\n\n`
  md += `- Total answer-bearing reading questions scanned: **${rows.length}**\n`
  md += `- Original \`de\` rewritten (templated/thin -> rewritten): **${rewrittenCount}** · translate-only (rich): **${rows.length - rewrittenCount - rows.filter(r=>r.deClassOriginal==='unknown').length}** · unknown: **${rows.filter(r=>r.deClassOriginal==='unknown').length}**\n`
  md += `- Items with >=1 flag: **${flaggedItems.length}** (${((flaggedItems.length / rows.length) * 100).toFixed(1)}%)\n\n`
  md += `## Per level (count)\n\n| level | questions |\n| --- | --- |\n`
  for (const lv of LEVELS) if (byLevel[lv]) md += `| ${lv} | ${byLevel[lv]} |\n`
  const meanings: Record<string, string> = {
    no_key_evidence: '`explanation.key_evidence` field empty/missing',
    de_low_evidence_overlap: '`de` shares < 50% of key_evidence content tokens',
    de_template_residue: '`de` still starts with template "Die richtige Antwort ist"',
    de_too_thin: '`de` < 15 chars',
    vi_boilerplate_or_empty: '`vi` empty or old boilerplate tail',
    vi_no_answer_ref: '`vi` does not reference answer / "Đáp án" / option',
    de_len_anomaly: '`de` length < 40% of level median',
    vi_len_anomaly: '`vi` length < 40% of level median',
    mojibake: 'replacement char / mojibake sequence in de or vi',
  }
  md += `\n## Flag counts (objective)\n\n`
  md += `**HARD flags** (concrete structural defect — mandatory review, all forced into sample):\n\n`
  md += `| flag | meaning | count |\n| --- | --- | --- |\n`
  for (const f of Object.keys(meanings)) if (HARD_FLAGS.has(f)) md += `| ${f} | ${meanings[f]} | ${flagCounts[f] || 0} |\n`
  md += `\n**SOFT flags** (heuristic — oversampled, not all forced):\n\n`
  md += `| flag | meaning | count |\n| --- | --- | --- |\n`
  for (const f of Object.keys(meanings)) if (!HARD_FLAGS.has(f)) md += `| ${f} | ${meanings[f]} | ${flagCounts[f] || 0} |\n`
  const hardCount = flaggedItems.filter((r) => r.flags.some((f) => HARD_FLAGS.has(f))).length
  md += `\n- HARD-flagged items (mandatory): **${hardCount}**\n`
  md += `- SOFT-flagged items (heuristic): **${flaggedItems.length - hardCount}**\n`
  md += `\n## Flagged items (HARD = mandatory review)\n\n`
  md += `_Soft-flagged items are enumerated in \`full-traceability.csv\` (filter \`prescreen_flags\`)._\n\n`
  md += `| file_path | item_id | level | type | flags |\n| --- | --- | --- | --- | --- |\n`
  const hardItems = flaggedItems.filter((r) => r.flags.some((f) => HARD_FLAGS.has(f)))
  if (!hardItems.length) md += `| _(none — no hard structural defects detected)_ | | | | |\n`
  for (const r of hardItems.sort((a, b) => a.file.localeCompare(b.file) || a.index - b.index)) {
    md += `| ${r.file} | ${r.itemId} | ${r.level} | ${r.type} | ${r.flags.join(', ')} |\n`
  }
  md += `\n_Generated by \`scripts/build-explanation-review-pack.ts\` (read-only). Seed: \`${SEED}\`._\n`
  fs.writeFileSync(path.join(OUT_DIR, 'prescreen-summary.md'), md, 'utf8')
  console.log(`[review-pack] prescreen-summary.md = ${flaggedItems.length} flagged`)
}

console.log('[review-pack] done. Output dir:', OUT_DIR)
