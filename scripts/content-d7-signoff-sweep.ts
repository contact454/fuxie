/**
 * Spec `content-program-quality` — D7 signoff sweep register.
 *
 * Vai chinh: German Academic Lead
 * Vai phoi hop: Content QA / Linguistic Reviewer, Exam Prep Specialist, Audio Script & Voice Producer
 *
 * Builds an auditable D7 decision register from the current machine board,
 * signoff manifest, human spot-check table, and D2/D3/D4 manual sample packs.
 * This script does not sign content. It makes missing academic/audio decisions
 * explicit so "Done (may)" cannot be confused with release-grade "Done (du)".
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const REPO_ROOT = path.resolve(fileURLToPath(import.meta.url), '..', '..')
const DOCS = path.join(REPO_ROOT, 'docs', 'content-quality')
const AUDIT = path.join(DOCS, 'audit-2026-06')
const STATUS_BOARD = path.join(AUDIT, 'status-board.json')
const SIGNOFF_MANIFEST = path.join(AUDIT, 'signoff-manifest.json')
const HUMAN_SPOT_CHECK = path.join(DOCS, 'human-spot-check-samples.md')
const VOCABULARY_D7_REVIEW_PACK = path.join(AUDIT, 'vocabulary-d7-review-pack.json')
const OUTPUT_JSON = path.join(AUDIT, 'd7-signoff-register.json')
const OUTPUT_MD = path.join(AUDIT, 'd7-signoff-register.md')

const MANUAL_SAMPLE_FILES = [
  {
    source: 'd2-manual-sample',
    dimension: 'D2 level-fit deep review',
    path: path.join(REPO_ROOT, 'tmp', 'd2-manual-sample.json'),
  },
  {
    source: 'd3-manual-sample',
    dimension: 'D3 semantic answer/distractor review',
    path: path.join(REPO_ROOT, 'tmp', 'd3-manual-sample.json'),
  },
  {
    source: 'd4-manual-sample',
    dimension: 'D4 Vietnamese naturalness review',
    path: path.join(REPO_ROOT, 'tmp', 'd4-manual-sample.json'),
  },
] as const

const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']
const MODULES = ['reading', 'listening', 'writing', 'speaking', 'vocabulary', 'grammar']

type DecisionState = 'signed' | 'pending_native_review' | 'pending_ai_advisory_review'

interface BoardCell {
  cell: string
  files: number
  d3: string
  qaMachine: string
  academicSignoff: string
  audio: string
  status: string
}

interface SampleInput {
  source: string
  dimension: string
  file: string
  id?: string
  level: string
  module: string
  cell: string
  reviewer?: string
  status?: string
  exists: boolean
}

interface RegisterCell extends BoardCell {
  requiredReviewer: string
  decisionState: DecisionState
  manualSampleCounts: Record<string, number>
  blockers: string[]
  nextAction: string
}

interface D7Register {
  generatedAt: string
  sources: Record<string, string>
  summary: Record<string, number>
  rules: string[]
  cells: RegisterCell[]
  sampleInputs: SampleInput[]
}

function readJson<T>(filePath: string): T {
  return JSON.parse(fs.readFileSync(filePath, 'utf8')) as T
}

function rel(filePath: string): string {
  return path.relative(REPO_ROOT, filePath).replace(/\\/g, '/')
}

function normalizeSlash(filePath: string): string {
  return filePath.replace(/\\/g, '/')
}

function cellForFile(file: string): string {
  const parts = normalizeSlash(file).split('/')
  const level = parts[1]?.toUpperCase()
  const module = parts[2]
  if (!level || !module) throw new Error(`Cannot derive cell from file path: ${file}`)
  return `${module}/${level}`
}

function parseHumanSpotCheckSamples(markdown: string): SampleInput[] {
  const rows: SampleInput[] = []
  for (const line of markdown.split(/\r?\n/)) {
    if (!line.startsWith('| ') || line.includes('---') || line.includes('Level |')) continue
    const cols = line.split('|').slice(1, -1).map((c) => c.trim())
    if (cols.length < 6) continue
    const [level, skill, id, fileCell, reviewer, status] = cols
    const file = fileCell.replace(/^`|`$/g, '')
    rows.push({
      source: 'human-spot-check',
      dimension: 'D7 academic spot-check',
      file,
      id,
      level,
      module: skill,
      cell: `${skill}/${level}`,
      reviewer,
      status,
      exists: fs.existsSync(path.join(REPO_ROOT, file)),
    })
  }
  return rows
}

function loadManualSamples(): SampleInput[] {
  return MANUAL_SAMPLE_FILES.flatMap((sample) => {
    const files = readJson<string[]>(sample.path)
    return files.map((file) => {
      const cell = cellForFile(file)
      const [module, level] = cell.split('/')
      return {
        source: sample.source,
        dimension: sample.dimension,
        file,
        level,
        module,
        cell,
        exists: fs.existsSync(path.join(REPO_ROOT, file)),
      }
    })
  })
}

function reviewerForCell(cell: string): string {
  const [module] = cell.split('/')
  if (module === 'listening') return 'German Academic Lead + Audio Script & Voice Producer'
  if (module === 'vocabulary' || module === 'grammar') return 'German Academic Lead + Content QA / Linguistic Reviewer'
  return 'German Academic Lead'
}

function nextActionForCell(cell: BoardCell): string {
  if (cell.academicSignoff !== 'signed') {
    if (cell.audio === 'pending') return 'Run D7 academic review, then Audio_Restubbing/parity before final signoff.'
    return 'Run D7 academic/native review and record decision in signoff-manifest.json.'
  }
  if (cell.audio === 'pending') return 'Complete Audio_Restubbing/parity and update audio state.'
  return 'Optional native spot-check; keep evidence attached.'
}

function buildRegister(now = new Date().toISOString()): D7Register {
  const board = readJson<{ cells: BoardCell[]; totalCells: number; totalFiles: number }>(STATUS_BOARD)
  const manifest = readJson<Record<string, { signoff?: string }>>(SIGNOFF_MANIFEST)
  const vocabularyReviewPack = fs.existsSync(VOCABULARY_D7_REVIEW_PACK)
    ? readJson<{ summary?: { reviewItems?: number; byPriority?: Record<string, number> } }>(VOCABULARY_D7_REVIEW_PACK)
    : null
  const sampleInputs = [
    ...parseHumanSpotCheckSamples(fs.readFileSync(HUMAN_SPOT_CHECK, 'utf8')),
    ...loadManualSamples(),
  ]

  const sampleCountsByCell = new Map<string, Record<string, number>>()
  for (const sample of sampleInputs) {
    const counts = sampleCountsByCell.get(sample.cell) ?? {}
    counts[sample.source] = (counts[sample.source] ?? 0) + 1
    sampleCountsByCell.set(sample.cell, counts)
  }

  const cells = board.cells.map((cell) => {
    const manifestSignoff = manifest[cell.cell]?.signoff ?? 'pending'
    const blockers: string[] = []
    if (cell.qaMachine !== 'pass') blockers.push('machine gate not pass')
    if (cell.d3 === 'warn') blockers.push('D3 topic advisory still open')
    if (manifestSignoff !== 'signed') blockers.push('academic/native D7 signoff pending')
    if (cell.audio === 'pending') blockers.push('listening audio parity/restub pending')
    const decisionState: DecisionState = manifestSignoff === 'signed'
      ? 'signed'
      : (sampleCountsByCell.get(cell.cell) ? 'pending_native_review' : 'pending_ai_advisory_review')
    return {
      ...cell,
      academicSignoff: manifestSignoff,
      requiredReviewer: reviewerForCell(cell.cell),
      decisionState,
      manualSampleCounts: sampleCountsByCell.get(cell.cell) ?? {},
      blockers,
      nextAction: nextActionForCell({ ...cell, academicSignoff: manifestSignoff }),
    }
  })

  return {
    generatedAt: now,
    sources: {
      statusBoard: rel(STATUS_BOARD),
      signoffManifest: rel(SIGNOFF_MANIFEST),
      humanSpotCheckSamples: rel(HUMAN_SPOT_CHECK),
      vocabularyD7ReviewPack: rel(VOCABULARY_D7_REVIEW_PACK),
      d2ManualSample: 'tmp/d2-manual-sample.json',
      d3ManualSample: 'tmp/d3-manual-sample.json',
      d4ManualSample: 'tmp/d4-manual-sample.json',
    },
    summary: {
      totalCells: cells.length,
      totalFiles: board.totalFiles,
      qaMachinePassCells: cells.filter((c) => c.qaMachine === 'pass').length,
      d3PassCells: cells.filter((c) => c.d3 === 'pass' || c.d3 === 'n/a').length,
      academicSignedCells: cells.filter((c) => c.academicSignoff === 'signed').length,
      academicPendingCells: cells.filter((c) => c.academicSignoff !== 'signed').length,
      audioPendingCells: cells.filter((c) => c.audio === 'pending').length,
      releaseSignedCells: cells.filter((c) => c.status === 'Done (đủ)').length,
      humanSpotCheckSamples: sampleInputs.filter((s) => s.source === 'human-spot-check').length,
      d2ManualSamples: sampleInputs.filter((s) => s.source === 'd2-manual-sample').length,
      d3ManualSamples: sampleInputs.filter((s) => s.source === 'd3-manual-sample').length,
      d4ManualSamples: sampleInputs.filter((s) => s.source === 'd4-manual-sample').length,
      vocabularyD7ReviewRows: vocabularyReviewPack?.summary?.reviewItems ?? 0,
      vocabularyD7P1Rows: vocabularyReviewPack?.summary?.byPriority?.P1 ?? 0,
      missingSampleFiles: sampleInputs.filter((s) => !s.exists).length,
    },
    rules: [
      'D1-D6 machine pass is necessary but not sufficient for release-grade content.',
      'D7 signoff must be recorded in signoff-manifest.json by an accountable reviewer.',
      'Listening cells also require audio parity/restub state to be non-pending before Done (du).',
      'AI advisory review may prepare evidence, but native/human signoff remains pending until explicitly recorded.',
    ],
    cells,
    sampleInputs,
  }
}

function renderMarkdown(register: D7Register): string {
  const lines: string[] = []
  lines.push('# D7 Academic Signoff Register')
  lines.push('')
  lines.push(`Generated: ${register.generatedAt}`)
  lines.push('')
  lines.push('## Summary')
  lines.push('')
  lines.push(`- Cells: ${register.summary.totalCells}; tracked content files: ${register.summary.totalFiles}.`)
  lines.push(`- Machine pass: ${register.summary.qaMachinePassCells}/${register.summary.totalCells}; D3 pass/n-a: ${register.summary.d3PassCells}/${register.summary.totalCells}.`)
  lines.push(`- Academic signed: ${register.summary.academicSignedCells}/${register.summary.totalCells}; pending: ${register.summary.academicPendingCells}/${register.summary.totalCells}.`)
  lines.push(`- Listening audio pending: ${register.summary.audioPendingCells}/6.`)
  lines.push(`- Review inputs: human=${register.summary.humanSpotCheckSamples}, D2=${register.summary.d2ManualSamples}, D3=${register.summary.d3ManualSamples}, D4=${register.summary.d4ManualSamples}.`)
  lines.push(`- Vocabulary D7 review queue: ${register.summary.vocabularyD7ReviewRows} rows, including ${register.summary.vocabularyD7P1Rows} P1 rows.`)
  lines.push(`- Missing sample files: ${register.summary.missingSampleFiles}.`)
  lines.push('')
  lines.push('## Rules')
  lines.push('')
  register.rules.forEach((rule) => lines.push(`- ${rule}`))
  lines.push('')
  lines.push('## Cell Decisions')
  lines.push('')
  lines.push('| Cell | files | machine | D3 | academic | audio | decision | samples | next action |')
  lines.push('| --- | ---: | --- | --- | --- | --- | --- | --- | --- |')
  for (const cell of register.cells) {
    const samples = Object.entries(cell.manualSampleCounts)
      .map(([source, count]) => `${source}:${count}`)
      .join(', ') || 'none'
    lines.push(`| ${cell.cell} | ${cell.files} | ${cell.qaMachine} | ${cell.d3} | ${cell.academicSignoff} | ${cell.audio} | ${cell.decisionState} | ${samples} | ${cell.nextAction} |`)
  }
  lines.push('')
  lines.push('## Source Files')
  lines.push('')
  Object.entries(register.sources).forEach(([key, value]) => lines.push(`- ${key}: \`${value}\``))
  return `${lines.join('\n')}\n`
}

function validateRegister(register: D7Register): string[] {
  const errors: string[] = []
  const expectedCells = MODULES.flatMap((module) => LEVELS.map((level) => `${module}/${level}`))
  const actualCells = new Set(register.cells.map((c) => c.cell))
  for (const cell of expectedCells) {
    if (!actualCells.has(cell)) errors.push(`missing cell ${cell}`)
  }
  if (register.cells.length !== 36) errors.push(`expected 36 cells, got ${register.cells.length}`)
  if (register.summary.humanSpotCheckSamples !== 60) errors.push(`expected 60 human spot-check samples, got ${register.summary.humanSpotCheckSamples}`)
  if (register.summary.d2ManualSamples !== 24) errors.push(`expected 24 D2 samples, got ${register.summary.d2ManualSamples}`)
  if (register.summary.d3ManualSamples !== 24) errors.push(`expected 24 D3 samples, got ${register.summary.d3ManualSamples}`)
  if (register.summary.d4ManualSamples !== 12) errors.push(`expected 12 D4 samples, got ${register.summary.d4ManualSamples}`)
  if (register.summary.vocabularyD7ReviewRows !== 1482) errors.push(`expected 1482 vocabulary D7 review rows, got ${register.summary.vocabularyD7ReviewRows}`)
  if (register.summary.vocabularyD7P1Rows !== 626) errors.push(`expected 626 vocabulary D7 P1 rows, got ${register.summary.vocabularyD7P1Rows}`)
  if (register.summary.missingSampleFiles !== 0) errors.push(`missing sample files: ${register.summary.missingSampleFiles}`)
  for (const cell of register.cells) {
    if (cell.status === 'Done (đủ)' && cell.academicSignoff !== 'signed') {
      errors.push(`${cell.cell}: Done (du) without signed academic manifest`)
    }
    if (cell.status === 'Done (đủ)' && cell.audio === 'pending') {
      errors.push(`${cell.cell}: Done (du) with pending audio`)
    }
  }
  return errors
}

function main(): void {
  const check = process.argv.includes('--check')
  const register = buildRegister()
  const errors = validateRegister(register)
  if (errors.length) {
    errors.forEach((error) => process.stderr.write(`[d7-signoff-register] ${error}\n`))
    process.exitCode = 1
    return
  }

  const json = `${JSON.stringify(register, null, 2)}\n`
  const md = renderMarkdown(register)
  if (check) {
    const currentJson = fs.existsSync(OUTPUT_JSON) ? fs.readFileSync(OUTPUT_JSON, 'utf8') : ''
    const currentMd = fs.existsSync(OUTPUT_MD) ? fs.readFileSync(OUTPUT_MD, 'utf8') : ''
    const currentJsonStable = currentJson.replace(/"generatedAt": ".*?"/, '"generatedAt": "<timestamp>"')
    const nextJsonStable = json.replace(/"generatedAt": ".*?"/, '"generatedAt": "<timestamp>"')
    const currentMdStable = currentMd.replace(/^Generated: .+$/m, 'Generated: <timestamp>')
    const nextMdStable = md.replace(/^Generated: .+$/m, 'Generated: <timestamp>')
    if (currentJsonStable !== nextJsonStable || currentMdStable !== nextMdStable) {
      process.stderr.write('[d7-signoff-register] generated files are stale\n')
      process.exitCode = 1
    }
    return
  }

  fs.writeFileSync(OUTPUT_JSON, json, 'utf8')
  fs.writeFileSync(OUTPUT_MD, md, 'utf8')
  process.stdout.write(`[d7-signoff-register] ${rel(OUTPUT_JSON)}\n`)
  process.stdout.write(`[d7-signoff-register] ${rel(OUTPUT_MD)}\n`)
}

const invokedDirectly =
  process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
if (invokedDirectly) main()

export {
  buildRegister,
  parseHumanSpotCheckSamples,
  renderMarkdown,
  validateRegister,
}
