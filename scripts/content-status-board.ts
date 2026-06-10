/**
 * Spec `content-program-quality` — Task 2.
 * Status_Board generator (READ-ONLY) — 36 cells (module × level).
 *
 * Vai chinh: Project Manager / Delivery Manager
 * Vai phoi hop: Content QA / Linguistic Reviewer, German Academic Lead
 *
 * Runs the deterministic machine gates (D1 opener, D2 duplicate, D3 topic,
 * D4 fake-segment, D5 broken-stem) across every content cell by REUSING the
 * single-source-of-truth helpers, then merges the human D7 sign-off + audio
 * state from a manifest, and emits docs/.../status-board.{md,json}. The board
 * never writes to content/ and never decides D7 itself.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { overlapScore, internalDupRatio, transcriptDialogueText, normalizeText } from './lib/listening-scan'
import { isBrokenStem } from './lib/cefr-stem-markers'
import {
  declaredTopicTerms,
  loadTopicEvidenceOverrides,
  matchTopicEvidence,
} from './lib/topic-evidence'
import { hasGenericOpener } from './apply-c2-article-regen'
import { hasGenericOpenerT2 } from './apply-c2-teil2-regen'

const REPO_ROOT = path.resolve(fileURLToPath(import.meta.url), '..', '..')
const CONTENT = path.join(REPO_ROOT, 'content')
const DOCS = path.join(REPO_ROOT, 'docs', 'content-quality', 'audit-2026-06')
const MANIFEST = path.join(DOCS, 'signoff-manifest.json')
const TOPIC_EVIDENCE = loadTopicEvidenceOverrides()

const LEVELS = ['a1', 'a2', 'b1', 'b2', 'c1', 'c2'] as const
const MODULES = ['reading', 'listening', 'writing', 'speaking', 'vocabulary', 'grammar'] as const

const SIDE_CAR = /\.(qa|meta)\.json$/i

function listItems(dir: string): any[] {
  if (!fs.existsSync(dir)) return []
  const out: any[] = []
  for (const name of fs.readdirSync(dir).sort()) {
    if (!name.endsWith('.json') || SIDE_CAR.test(name) || name === 'course.json') continue
    try { out.push(JSON.parse(fs.readFileSync(path.join(dir, name), 'utf8'))) } catch { /* skip */ }
  }
  return out
}

/** Main learning text per item (module-aware). */
function contentText(j: any): string {
  if (j?.transcript?.lines) return transcriptDialogueText(j)
  if (typeof j?.article?.text === 'string') return j.article.text
  if (typeof j?.section_cloze?.text === 'string') return j.section_cloze.text
  if (Array.isArray(j?.opinion_texts?.texts)) {
    return j.opinion_texts.texts.map((entry: any) => String(entry?.text ?? '')).join(' ')
  }
  // writing/vocabulary/speaking: gather long strings (skip prompts)
  const parts: string[] = []
  const rec = (o: any, k: string) => {
    if (o == null) return
    if (typeof o === 'string') { if (o.length >= 120 && !['prompt', 'instruction', 'task', 'aufgabe'].includes(k)) parts.push(o); return }
    if (Array.isArray(o)) { o.forEach((v) => rec(v, k)); return }
    if (typeof o === 'object') for (const [kk, vv] of Object.entries(o)) rec(vv, kk)
  }
  rec(j, '')
  return parts.join(' ')
}

function stemsOf(j: any): string[] {
  if (!Array.isArray(j?.questions)) return []
  return j.questions.map((q: any) => String(q?.stem ?? q?.statement ?? q?.question ?? '')).filter(Boolean)
}

interface CellResult {
  module: string
  level: string
  files: number
  d1: string; d2: string; d3: string; d4: string; d5: string
  qaMachine: 'pass' | 'fail' | 'n/a'
  violations: string[]
  d3EvidenceOverrides: string[]
}

function scanCell(module: string, level: string): CellResult {
  const dir = path.join(CONTENT, level, module)
  const items = listItems(dir)
  const res: CellResult = {
    module,
    level,
    files: items.length,
    d1: 'n/a',
    d2: 'n/a',
    d3: 'n/a',
    d4: 'n/a',
    d5: 'n/a',
    qaMachine: 'n/a',
    violations: [],
    d3EvidenceOverrides: [],
  }
  if (!items.length) return res

  const texts = items.map((j) => ({ id: String(j.id ?? ''), text: normalizeText(contentText(j)), raw: contentText(j), j }))

  // D1 opener
  const openerHits = texts.filter((t) => hasGenericOpener(t.raw) || hasGenericOpenerT2(t.raw))
  res.d1 = openerHits.length ? 'fail' : 'pass'
  openerHits.forEach((t) => res.violations.push(`D1 ${t.id}`))

  // D2 duplicate within cell (overlap >= 0.5)
  let dupPairs = 0
  for (let i = 0; i < texts.length; i++) for (let k = i + 1; k < texts.length; k++) {
    if (texts[i].text.length < 200 || texts[k].text.length < 200) continue
    if (overlapScore(texts[i].text, texts[k].text) >= 0.5) { dupPairs++; if (dupPairs <= 5) res.violations.push(`D2 ${texts[i].id}~${texts[k].id}`) }
  }
  res.d2 = dupPairs ? 'fail' : 'pass'

  // D3 topic match (advisory/warn — only when topic/title available; stem-prefix tolerant)
  const withTopic = texts.filter((t) => declaredTopicTerms(t.j).length > 0)
  if (withTopic.length) {
    const evaluated = withTopic.map((t) => ({
      ...t,
      evidence: matchTopicEvidence(t.j, t.raw, TOPIC_EVIDENCE),
    }))
    const mm = evaluated.filter((t) => !t.evidence.matches)
    res.d3EvidenceOverrides = evaluated
      .filter((t) => t.evidence.overrideApplied)
      .map((t) => t.id)
    res.d3 = mm.length ? 'warn' : 'pass'
    mm.slice(0, 5).forEach((t) => res.violations.push(`D3 ${t.id}`))
  }

  // D4 fake-segment (listening only)
  if (module === 'listening') {
    const loop = items.filter((j) => internalDupRatio(j) >= 0.2)
    res.d4 = loop.length ? 'fail' : 'pass'
    loop.slice(0, 5).forEach((j) => res.violations.push(`D4 ${j.id}`))
  }

  // D5 broken-stem (items with questions)
  const withStems = texts.filter((t) => stemsOf(t.j).length > 0)
  if (withStems.length) {
    const broken = withStems.filter((t) => stemsOf(t.j).some((s) => isBrokenStem(s)))
    res.d5 = broken.length ? 'fail' : 'pass'
    broken.slice(0, 5).forEach((t) => res.violations.push(`D5 ${t.id}`))
  }

  // qaMachine = hard gates only (D1, D2, D4, D5). D3 is advisory (warn), not a hard fail.
  const hard = [res.d1, res.d2, res.d4, res.d5].filter((d) => d !== 'n/a')
  res.qaMachine = hard.length === 0 ? 'n/a' : hard.every((d) => d === 'pass') ? 'pass' : 'fail'
  return res
}

function loadManifest(): Record<string, any> {
  if (!fs.existsSync(MANIFEST)) return {}
  try { return JSON.parse(fs.readFileSync(MANIFEST, 'utf8')) } catch { return {} }
}

function main(): void {
  const manifest = loadManifest()
  const cells: CellResult[] = []
  let totalFiles = 0
  for (const lv of LEVELS) for (const mod of MODULES) {
    const r = scanCell(mod, lv)
    cells.push(r)
    totalFiles += r.files
  }

  // JSON
  const json = {
    generatedAt: new Date().toISOString(),
    totalCells: cells.length,
    totalFiles,
    cells: cells.map((c) => {
      const key = `${c.module}/${c.level.toUpperCase()}`
      const sign = manifest[key]?.signoff ?? 'pending'
      const audio = c.module === 'listening' ? (manifest[key]?.audio ?? 'pending') : 'n/a'
      const status = c.qaMachine === 'pass' && sign === 'signed' && audio !== 'pending' ? 'Done (đủ)'
        : c.qaMachine === 'pass' ? 'Done (máy)'
        : c.qaMachine === 'n/a' ? '—' : 'Defect'
      return {
        cell: key,
        files: c.files,
        d1: c.d1,
        d2: c.d2,
        d3: c.d3,
        d4: c.d4,
        d5: c.d5,
        qaMachine: c.qaMachine,
        academicSignoff: sign,
        audio,
        status,
        violations: c.violations,
        d3EvidenceOverrides: c.d3EvidenceOverrides,
      }
    }),
  }
  fs.mkdirSync(DOCS, { recursive: true })
  fs.writeFileSync(path.join(DOCS, 'status-board.json'), JSON.stringify(json, null, 2) + '\n', 'utf8')

  // Markdown
  const lines: string[] = []
  lines.push('# Fuxie Content — Status_Board (36 cells)')
  lines.push('')
  lines.push(`Sinh tự động bởi \`scripts/content-status-board.ts\` (READ-ONLY) · ${json.generatedAt}`)
  lines.push(`Tổng cell: ${json.totalCells} · Tổng item: ${json.totalFiles}`)
  lines.push('')
  lines.push('| Cell | files | D1 | D2 | D3 | D4 | D5 | qa_machine | academic | audio | status |')
  lines.push('| --- | ---: | --- | --- | --- | --- | --- | --- | --- | --- | --- |')
  for (const c of json.cells) {
    lines.push(`| ${c.cell} | ${c.files} | ${c.d1} | ${c.d2} | ${c.d3} | ${c.d4} | ${c.d5} | ${c.qaMachine} | ${c.academicSignoff} | ${c.audio} | ${c.status} |`)
  }
  lines.push('')
  lines.push('> D1 opener · D2 duplicate(<0.5) · D3 topic-match · D4 fake-segment · D5 broken-stem. D6/D7 (answer-integrity sâu + chất lượng học thuật) ngoài board máy: D7 lấy từ `signoff-manifest.json`. "n/a" = cổng không áp dụng cho module.')
  const overrideIds = json.cells.flatMap((c) => c.d3EvidenceOverrides)
  lines.push(`> D3 semantic evidence overrides: ${overrideIds.length} item(s), audited in \`topic-evidence-overrides.json\`; these do not count as D7/native signoff.`)
  fs.writeFileSync(path.join(DOCS, 'status-board.md'), lines.join('\n') + '\n', 'utf8')

  process.stdout.write(`[status-board] ${json.totalCells} cells, ${json.totalFiles} files → status-board.{md,json}\n`)
  const defect = json.cells.filter((c) => c.status === 'Defect')
  process.stdout.write(`[status-board] cells with machine defect: ${defect.length}\n`)
  defect.forEach((c) => process.stdout.write(`  ${c.cell}: ${c.violations.slice(0, 6).join(', ')}${c.violations.length > 6 ? ' …' : ''}\n`))
}

main()
