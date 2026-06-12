/**
 * Spec `fuxie-content-review-board` — Task 6.1 (Component 6: One-shot runner)
 * Pure + injectable core behind the thin CLI `scripts/content-review-board-run.ts`.
 *
 * Vai chinh: AI / LLM Engineer
 * Vai phoi hop: Content QA / Linguistic Reviewer, German Academic Lead,
 *               QA Automation Engineer, DevOps / Cloud Engineer
 *
 * Runs the two-tier board over the 1.282 answer-bearing reading explanation
 * questions (READ-ONLY content) and produces the `review-board/` deliverable:
 *   - per-item.csv         (objective + Tier1 findings + subjective + confidence
 *                           + redFlag + status + subjective_source)
 *   - escalation-queue.csv (items with status=escalate, + escalation_reason)
 *   - README.md            (objective vs advisory, thresholds, how to operate
 *                           the gate, placeholder note + cost estimate)
 *   - recall-report.md     is produced by task 5.1 and is NOT overwritten here.
 *
 * ── Honesty / credit contract (Req 5.6, 6.1–6.5, 7.4) ───────────────────────
 *   - Tier-1 is REAL on all items: the deterministic answer-key / enum / genus
 *     checks (`checkReadingFile`) run offline + free and produce the
 *     AUTHORITATIVE objective PASS/FAIL per item. LanguageTool is opt-in and, if
 *     unreachable, is recorded as a note WITHOUT blocking the deliverable.
 *   - Tier-2 DEFAULTS to the deterministic MOCK runners (no provider credit).
 *     The mock board is NOT a real review model — every subjective column is a
 *     PLACEHOLDER, labelled `subjective_source=mock`. Because the blind mock
 *     red-team cannot truly self-solve, it conservatively disagrees, so no item
 *     can earn `advisory-pass` from a mock: everything escalates pending a real
 *     provider/human. That is the honest, intended outcome.
 *   - `item_id` reuses the `explanation-review/` traceability scheme: the
 *     question `id` (e.g. "Q1"), disambiguated by `file` (Req 6.5).
 *   - Content is hashed before+after and asserted byte-identical (Property 5).
 *
 * Reuse-first: the Tier-2 assembly (`executeBoard`, dual-label `combineLabels`),
 * the mock runners, the reading scan, and the content read-only hash guard are
 * all REUSED from existing modules — never reimplemented here.
 */
import fs from 'node:fs'
import path from 'node:path'

import {
  type Confidence,
  type ItemLabel,
  type ReadingQuestion,
  type Tier1Finding,
  type Tier1Result,
  NOT_REVIEWED_NOTE,
  buildTier1Result,
} from './review-board-contract'
import { checkReadingFile } from './german-content-checks'
import {
  type GermanChecksOptions,
  type HunspellOptions,
  type LanguageToolOptions,
  detectHunspell,
  runGermanChecks,
} from './german-lint-checks'
import {
  type RawReadingQuestion,
  type ReviewBoardItem,
  type ReviewerRunner,
  createMockReviewerRunner,
  normalizeReadingItem,
} from './review-board-reviewers'
import {
  type RedTeamRunner,
  createMockRedTeamRunner,
} from './review-board-redteam'
import {
  type BoardItemInput,
  type CostEstimate,
  type ModelPricing,
  EXAMPLE_PAID_PRICING,
  FREE_TIER_PRICING,
  estimateBoardCost,
  executeBoard,
} from './review-board-aggregator'
// Reuse the calibration read-only hash guard (single source of truth).
import { diffTrees, hashTree, isCleanDiff } from './review-board-calibrate'
import { collectDeStringRefs } from './review-board-calibrate'

// ===========================================================================
// Types
// ===========================================================================

export type SubjectiveSource = 'mock' | 'provider'

/** One finished row of the per-item deliverable. */
export interface PerItemRecord {
  /** content-relative path, forward slashes. */
  file: string
  /** question id (reuses explanation-review item_id scheme), e.g. "Q1". */
  itemId: string
  level: string
  type: string
  /** Tier-1 objective verdict — authoritative. */
  objectiveVerdict: 'PASS' | 'FAIL'
  /** compact summary of Tier-1 findings for this item (rule keys + counts). */
  tier1Findings: string
  /** Tier-2 advisory opinion (mock by default) — a PLACEHOLDER, not a verdict. */
  subjectiveLabel: 'ok' | 'concern' | 'fail'
  confidence: Confidence
  redFlag: boolean
  status: ItemLabel['status']
  subjectiveSource: SubjectiveSource
}

/** CSV column order for per-item.csv (Req 6.1). */
export const PER_ITEM_COLUMNS = [
  'file',
  'item_id',
  'level',
  'type',
  'objective_verdict',
  'tier1_findings',
  'subjective_label',
  'confidence',
  'red_flag',
  'status',
  'subjective_source',
] as const

/** Extra column appended to the escalation queue for human triage. */
export const ESCALATION_COLUMNS = [...PER_ITEM_COLUMNS, 'escalation_reason'] as const

export interface RunSummary {
  totalItems: number
  byLevel: Record<string, number>
  objectivePass: number
  objectiveFail: number
  escalate: number
  advisoryPass: number
  redFlags: number
  subjectiveSource: SubjectiveSource
  languageToolUsed: boolean
  tier1Notes: string[]
  /** Cost of THIS run (free-tier / mock => $0). */
  freeCost: CostEstimate
  /** Worked example of a PAID provider run over the same item count (Req 7.3). */
  paidCostExample: CostEstimate
}

export interface RunResult {
  records: PerItemRecord[]
  summary: RunSummary
  /** Property 5: content/ byte-identical before+after this run. */
  contentReadOnly: boolean
}

// ===========================================================================
// Read-only reading scan (mirrors reading-explanation-lib's item_id scheme)
// ===========================================================================

const LEVELS = ['a1', 'a2', 'b1', 'b2', 'c1', 'c2'] as const

function isSidecar(name: string): boolean {
  return /\.qa\.json$/i.test(name) || /\.meta\.json$/i.test(name)
}

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

/** Stored answer of a reading question (answer ?? correctIndex ?? solution). */
export function answerOf(q: RawReadingQuestion): string | number | null {
  if (q.answer != null) return q.answer as string | number
  if (q.correctIndex != null) return q.correctIndex as number
  if ((q as Record<string, unknown>).correct != null) {
    return (q as Record<string, unknown>).correct as string | number
  }
  if (q.solution != null) return q.solution as string | number
  return null
}

export interface ScannedQuestion {
  index: number
  questionId: string
  type: string
  raw: RawReadingQuestion
}

export interface ScannedFile {
  /** content-relative path, forward slashes. */
  file: string
  level: string
  data: Record<string, unknown>
  /** answer-bearing questions only. */
  questions: ScannedQuestion[]
}

/**
 * Scan all reading files (optionally one level), returning per-file groups of
 * the ANSWER-BEARING questions. Read-only over `content/`.
 */
export function scanReadingFiles(repoRoot: string, level?: string): ScannedFile[] {
  const out: ScannedFile[] = []
  const levels = level ? [level.toLowerCase()] : (LEVELS as readonly string[])
  for (const lv of levels) {
    const dir = path.join(repoRoot, 'content', lv, 'reading')
    if (!fs.existsSync(dir)) continue
    for (const name of fs.readdirSync(dir)) {
      if (!name.endsWith('.json') || isSidecar(name)) continue
      const fp = path.join(dir, name)
      let data: unknown
      try {
        data = JSON.parse(fs.readFileSync(fp, 'utf8'))
      } catch {
        continue
      }
      if (!isObject(data) || !Array.isArray(data.questions)) continue
      const rel = path.relative(repoRoot, fp).split(path.sep).join('/')
      const questions: ScannedQuestion[] = []
      data.questions.forEach((q, i) => {
        if (!isObject(q)) return
        if (answerOf(q as RawReadingQuestion) == null) return // answer-bearing only
        questions.push({
          index: i,
          questionId: String((q as Record<string, unknown>).id ?? i),
          type: String((q as Record<string, unknown>).type ?? ''),
          raw: q as RawReadingQuestion,
        })
      })
      if (questions.length > 0) out.push({ file: rel, level: lv, data, questions })
    }
  }
  return out
}

/** Total answer-bearing question count across a scan (the one-shot scope). */
export function countItems(files: readonly ScannedFile[]): number {
  return files.reduce((n, f) => n + f.questions.length, 0)
}

/**
 * Trim a scan to AT MOST `limit` answer-bearing questions, in scan order. Used
 * by `--limit` to bound a (provider) pilot to a small, cheap subset. A nullish
 * or non-positive limit returns the scan unchanged. Read-only over the input.
 */
export function limitScannedFiles(
  files: readonly ScannedFile[],
  limit?: number,
): ScannedFile[] {
  if (limit == null || !Number.isFinite(limit) || limit <= 0) return [...files]
  let remaining = Math.floor(limit)
  const out: ScannedFile[] = []
  for (const f of files) {
    if (remaining <= 0) break
    if (f.questions.length <= remaining) {
      out.push(f)
      remaining -= f.questions.length
    } else {
      out.push({ ...f, questions: f.questions.slice(0, remaining) })
      remaining = 0
    }
  }
  return out
}

// ===========================================================================
// Tier-1 finding attribution (per-question objective verdict)
// ===========================================================================

const QUESTION_INDEX_RE = /questions\[(\d+)\]/

/** Group Tier-1 findings by the question index referenced in their jsonPath. */
export function groupFindingsByQuestion(
  findings: readonly Tier1Finding[],
): Map<number, Tier1Finding[]> {
  const map = new Map<number, Tier1Finding[]>()
  for (const f of findings) {
    const m = QUESTION_INDEX_RE.exec(f.jsonPath)
    if (!m) continue
    const idx = Number(m[1])
    const bucket = map.get(idx) ?? []
    bucket.push(f)
    map.set(idx, bucket)
  }
  return map
}

/** Compact, citeable summary of a question's Tier-1 findings (rule + count). */
export function summarizeFindings(findings: readonly Tier1Finding[]): string {
  if (findings.length === 0) return ''
  const counts = new Map<string, number>()
  for (const f of findings) {
    const key = `${f.severity === 'error' ? 'E' : 'W'}:${f.rule}`
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }
  return [...counts.entries()].map(([k, n]) => `${k}x${n}`).join('; ')
}

// ===========================================================================
// CSV building (UTF-8, no BOM; every field quoted/escaped)
// ===========================================================================

export function csvEscape(value: unknown): string {
  return `"${String(value ?? '').replace(/"/g, '""')}"`
}

export function toCsvLine(fields: readonly unknown[]): string {
  return fields.map(csvEscape).join(',')
}

export function perItemRow(r: PerItemRecord): string[] {
  return [
    r.file,
    r.itemId,
    r.level,
    r.type,
    r.objectiveVerdict,
    r.tier1Findings,
    r.subjectiveLabel,
    r.confidence,
    String(r.redFlag),
    r.status,
    r.subjectiveSource,
  ]
}

export function buildPerItemCsv(records: readonly PerItemRecord[]): string {
  const lines = [toCsvLine([...PER_ITEM_COLUMNS])]
  for (const r of records) lines.push(toCsvLine(perItemRow(r)))
  return lines.join('\n') + '\n'
}

/** Items that must escalate (Req 5.5, 6.2): status === 'escalate'. */
export function filterEscalation(records: readonly PerItemRecord[]): PerItemRecord[] {
  return records.filter((r) => r.status === 'escalate')
}

/** Human-readable reason an item is in the escalation queue. */
export function escalationReason(r: PerItemRecord): string {
  const reasons: string[] = []
  if (r.objectiveVerdict === 'FAIL') reasons.push('objective=FAIL (Tier-1, authoritative)')
  if (r.redFlag) {
    reasons.push(
      r.subjectiveSource === 'mock'
        ? 'redFlag (mock red-team — PLACEHOLDER, not a real disagreement)'
        : 'redFlag (red-team disagrees with stored answer)',
    )
  }
  if (r.confidence !== 'high') reasons.push(`confidence=${r.confidence}`)
  return reasons.join('; ')
}

export function buildEscalationCsv(records: readonly PerItemRecord[]): string {
  const lines = [toCsvLine([...ESCALATION_COLUMNS])]
  for (const r of filterEscalation(records)) {
    lines.push(toCsvLine([...perItemRow(r), escalationReason(r)]))
  }
  return lines.join('\n') + '\n'
}

// ===========================================================================
// Orchestration (Tier-1 real + Tier-2 mock by default; no provider credit)
// ===========================================================================

export interface RunOptions {
  repoRoot: string
  level?: string
  /** Opt-in LanguageTool/hunspell augmentation (default off → free + offline). */
  useLanguageTool?: boolean
  languageTool?: LanguageToolOptions
  hunspell?: HunspellOptions
  /** Provenance label for the subjective columns. Default 'mock'. */
  subjectiveSource?: SubjectiveSource
  /** Bound the run to AT MOST this many answer-bearing items (pilot subset). */
  limit?: number
  /** Injected Tier-2 runners (default: deterministic mocks — no credit). */
  reviewerRunner?: ReviewerRunner
  redTeamRunner?: RedTeamRunner
  /** Pricing used for the worked PAID cost example in the summary. */
  paidPricing?: ModelPricing
}

interface Prepared {
  boardId: string
  file: string
  questionId: string
  level: string
  type: string
  findings: Tier1Finding[]
  input: BoardItemInput
}

/**
 * Run the two-tier board over every answer-bearing reading question.
 *
 *   - Tier-1: `checkReadingFile` per file (deterministic, free) + optional
 *     hunspell/LanguageTool over the German strings. Findings are attributed to
 *     the owning question to compute its authoritative objective verdict.
 *   - Tier-2: ONE `executeBoard` call over all items via the injected runners
 *     (mock by default → $0). The dual-label `combineLabels` runs inside.
 *
 * Content is hashed before + after and asserted byte-identical (Property 5).
 */
export async function runReviewBoard(opts: RunOptions): Promise<RunResult> {
  const repoRoot = opts.repoRoot
  const subjectiveSource: SubjectiveSource = opts.subjectiveSource ?? 'mock'
  const contentDir = path.join(repoRoot, 'content')

  const before = hashTree(contentDir)

  const files = limitScannedFiles(scanReadingFiles(repoRoot, opts.level), opts.limit)
  const tier1Notes: string[] = []
  let languageToolUsed = false

  if (opts.useLanguageTool) {
    languageToolUsed = true
  }
  const hunspell = detectHunspell(opts.hunspell)
  if (opts.useLanguageTool && !hunspell.available) {
    tier1Notes.push(
      `hunspell unavailable (${hunspell.reason ?? 'not detected'}) — spelling checks limited to LanguageTool.`,
    )
  }

  const prepared: Prepared[] = []

  for (const f of files) {
    // Deterministic Tier-1 over the whole file (answer-key / enum / genus).
    let findings: Tier1Finding[] = checkReadingFile(f.file, f.data)

    // Optional German spelling/grammar augmentation — never blocks the run.
    if (opts.useLanguageTool) {
      try {
        const refs = collectDeStringRefs('reading', f.file, f.data)
        const checks: GermanChecksOptions = {
          skipLanguageTool: false,
          languageTool: opts.languageTool,
          hunspell: opts.hunspell,
        }
        const german = await runGermanChecks(refs, checks)
        if (german.infraError) {
          tier1Notes.push(`LanguageTool unavailable for ${f.file}: ${german.infraError}`)
        } else {
          findings = [...findings, ...german.findings]
        }
      } catch (err) {
        tier1Notes.push(
          `German check skipped for ${f.file}: ${err instanceof Error ? err.message : String(err)}`,
        )
      }
    }

    const byQuestion = groupFindingsByQuestion(findings)

    for (const q of f.questions) {
      const qFindings = byQuestion.get(q.index) ?? []
      const tier1: Tier1Result = buildTier1Result(
        { files: 1, deStrings: 0 },
        qFindings,
      )
      // Board id is globally unique (file#index); item_id in the CSV stays the
      // question id to match the explanation-review traceability scheme.
      const boardId = `${f.file}#${q.index}`
      const reviewItem: ReviewBoardItem = normalizeReadingItem(q.raw, {
        itemId: q.questionId,
        level: f.level,
      })
      prepared.push({
        boardId,
        file: f.file,
        questionId: q.questionId,
        level: f.level,
        type: q.type,
        findings: qFindings,
        input: {
          itemId: boardId,
          level: f.level,
          reviewItem,
          question: q.raw as ReadingQuestion,
          tier1,
        },
      })
    }
  }

  // Tier-2 board — single executeBoard call (mock runners by default → $0).
  const reviewerRunner = opts.reviewerRunner ?? createMockReviewerRunner()
  const redTeamRunner = opts.redTeamRunner ?? createMockRedTeamRunner()
  const board = await executeBoard(
    prepared.map((p) => p.input),
    { dryRun: false, reviewerRunner, redTeamRunner },
  )
  const byBoardId = new Map(board.items.map((it) => [it.itemId, it]))

  const records: PerItemRecord[] = []
  for (const p of prepared) {
    const item = byBoardId.get(p.boardId)
    const objectiveVerdict = p.input.tier1.objectiveVerdict
    if (!item) {
      // Defensive: an item with no board result escalates conservatively.
      records.push({
        file: p.file,
        itemId: p.questionId,
        level: p.level,
        type: p.type,
        objectiveVerdict,
        tier1Findings: summarizeFindings(p.findings),
        subjectiveLabel: 'concern',
        confidence: 'low',
        redFlag: true,
        status: 'escalate',
        subjectiveSource,
      })
      continue
    }
    records.push({
      file: p.file,
      itemId: p.questionId,
      level: p.level,
      type: p.type,
      objectiveVerdict,
      tier1Findings: summarizeFindings(p.findings),
      subjectiveLabel: item.aggregate.consensus,
      confidence: item.aggregate.confidence,
      redFlag: item.aggregate.redFlag,
      status: item.label.status,
      subjectiveSource,
    })
  }

  // Property 5 — content read-only.
  const after = hashTree(contentDir)
  const contentReadOnly = isCleanDiff(diffTrees(before, after))

  const summary = summarize(records, {
    subjectiveSource,
    languageToolUsed,
    tier1Notes,
    paidPricing: opts.paidPricing ?? EXAMPLE_PAID_PRICING,
  })

  return { records, summary, contentReadOnly }
}

function summarize(
  records: readonly PerItemRecord[],
  ctx: {
    subjectiveSource: SubjectiveSource
    languageToolUsed: boolean
    tier1Notes: string[]
    paidPricing: ModelPricing
  },
): RunSummary {
  const byLevel: Record<string, number> = {}
  let objectivePass = 0
  let objectiveFail = 0
  let escalate = 0
  let advisoryPass = 0
  let redFlags = 0
  for (const r of records) {
    byLevel[r.level] = (byLevel[r.level] ?? 0) + 1
    if (r.objectiveVerdict === 'PASS') objectivePass++
    else objectiveFail++
    if (r.status === 'escalate') escalate++
    else advisoryPass++
    if (r.redFlag) redFlags++
  }
  const total = records.length
  return {
    totalItems: total,
    byLevel,
    objectivePass,
    objectiveFail,
    escalate,
    advisoryPass,
    redFlags,
    subjectiveSource: ctx.subjectiveSource,
    languageToolUsed: ctx.languageToolUsed,
    tier1Notes: ctx.tier1Notes,
    freeCost: estimateBoardCost(total, FREE_TIER_PRICING),
    paidCostExample: estimateBoardCost(total, ctx.paidPricing),
  }
}

// ===========================================================================
// README (Vietnamese) — objective vs advisory + thresholds + how to operate
// ===========================================================================

export function buildReadme(summary: RunSummary): string {
  const s = summary
  const usd = (n: number) => `$${n.toFixed(4)}`
  const levelRows = Object.keys(s.byLevel)
    .sort()
    .map((lv) => `| ${lv} | ${s.byLevel[lv]} |`)
    .join('\n')

  return [
    '# Content Review Board — One-shot 1.282 Reading Explanation',
    '',
    'Spec: `fuxie-content-review-board` · Task 6.1 · Component 6 (one-shot runner).',
    '',
    'Vai chinh: AI / LLM Engineer · Vai phoi hop: Content QA / Linguistic Reviewer, German Academic Lead, QA Automation Engineer, DevOps',
    '',
    '> Chạy **1 lượt** cổng QA 2 tầng trên toàn bộ **' +
      s.totalItems +
      '** câu hỏi reading có đáp án (answer-bearing) do AI sinh (PR #21). READ-ONLY: KHÔNG sửa `content/`, chỉ đọc và xuất tài liệu vào thư mục này.',
    '',
    '## ⚠️ Đọc trước — khách quan vs advisory',
    '',
    'Mỗi item mang **HAI nhãn tách biệt** (không bao giờ gộp thành "approved"):',
    '',
    '1. **Objective (Tier-1, CÓ THẨM QUYỀN, miễn phí, deterministic).** Cột `objective_verdict` = `PASS|FAIL` dựa trên kiểm tra answer-key/enum/genus chạy thật, offline. Đây là con số đáng tin để de-risk PR #21.',
    '2. **Subjective (Tier-2, ADVISORY, chỉ là GỢI Ý).** Các cột `subjective_label`, `confidence`, `red_flag` đến từ **board mô phỏng (mock)** trừ khi chạy `--provider`. Cột `subjective_source` ghi rõ nguồn.',
    '',
    '`' + NOT_REVIEWED_NOTE + '` — mọi nhãn subjective đều mang ghi chú này. Không item nào được tự gán "approved".',
    '',
    s.subjectiveSource === 'mock'
      ? [
          '### Vì sao gần như tất cả item đều `escalate`?',
          '',
          'Lần chạy này dùng **Tier-2 mock** (mặc định, không tốn credit). Red-team mù mô phỏng **không thật sự tự giải** được câu hỏi nên nó luôn bất đồng một cách thận trọng → `red_flag=true` → `confidence` không thể đạt `high` → **không item nào được `advisory-pass`**. Đây là kết quả **trung thực và cố ý**: máy KHÔNG được tự chứng nhận chất lượng tiếng Đức khi chưa có model/người thật duyệt. Vì vậy:',
          '',
          '- Hãy đọc cột **`objective_verdict` (Tier-1)** như tín hiệu THẬT.',
          '- Coi cột subjective là **placeholder** cho tới khi chạy `--provider` hoặc người rành tiếng Đức duyệt.',
        ].join('\n')
      : '### Tier-2 chạy provider thật — các cột subjective là ý kiến model (vẫn advisory, vẫn chờ người duyệt).',
    '',
    '## Kết quả lần chạy này',
    '',
    '| Chỉ số | Giá trị |',
    '| --- | ---: |',
    `| Tổng item (answer-bearing) | ${s.totalItems} |`,
    `| Objective PASS (Tier-1) | ${s.objectivePass} |`,
    `| Objective FAIL (Tier-1) | ${s.objectiveFail} |`,
    `| advisory-pass (low-assurance) | ${s.advisoryPass} |`,
    `| escalate (vào hàng đợi) | ${s.escalate} |`,
    `| red_flag | ${s.redFlags} |`,
    `| subjective_source | ${s.subjectiveSource} |`,
    `| LanguageTool | ${s.languageToolUsed ? 'có dùng' : 'không (offline, deterministic)'} |`,
    '',
    '### Phân bố theo level',
    '',
    '| Level | Items |',
    '| --- | ---: |',
    levelRows,
    '',
    s.tier1Notes.length > 0
      ? ['### Ghi chú hạ tầng Tier-1', '', ...s.tier1Notes.map((n) => `- ${n}`)].join('\n')
      : '### Ghi chú hạ tầng Tier-1\n\n- (không có) — Tier-1 chạy deterministic offline, không cần credit.',
    '',
    '## Ước tính chi phí (Req 7.3)',
    '',
    'In trước khi gọi provider để chủ sở hữu quyết định tiêu credit:',
    '',
    '| Kịch bản | Calls | $/call | Tổng ước tính |',
    '| --- | ---: | ---: | ---: |',
    `| Free-tier / mock (lần chạy này) | ${s.freeCost.totalCalls} | ${usd(s.freeCost.usdPerCall)} | ${usd(s.freeCost.estimatedCostUsd)} |`,
    `| Ví dụ provider trả phí | ${s.paidCostExample.totalCalls} | ${usd(s.paidCostExample.usdPerCall)} | ${usd(s.paidCostExample.estimatedCostUsd)} |`,
    '',
    `Mỗi item tốn 4 call (3 reviewer + 1 red-team). Lần chạy mock = **${usd(s.freeCost.estimatedCostUsd)}** (không tốn credit).`,
    '',
    '## Các file trong gói',
    '',
    '| File | Nội dung |',
    '| --- | --- |',
    '| `per-item.csv` | ' +
      s.totalItems +
      ' dòng: `file, item_id, level, type, objective_verdict, tier1_findings, subjective_label, confidence, red_flag, status, subjective_source`. |',
    '| `escalation-queue.csv` | Các item `status=escalate` + cột `escalation_reason` để người duyệt ưu tiên. |',
    '| `recall-report.md` | Báo cáo recall của mutation calibration (task 5.1) — **KHÔNG** ghi đè bởi script này. |',
    '| `README.md` | Tài liệu này. |',
    '',
    '## Ngưỡng + cách vận hành cổng (gate)',
    '',
    '**Quy tắc status (Component 4 / Req 5.4–5.5):**',
    '',
    '- `advisory-pass (low-assurance)` ⟺ `objective=PASS` ∧ `confidence=high` ∧ `red_flag=false`. Vẫn kèm "chưa người duyệt".',
    '- ngược lại ⟹ `escalate` (vào `escalation-queue.csv`).',
    '',
    '**Cách dùng kết quả:**',
    '',
    '1. **Ưu tiên P0** mọi dòng `objective_verdict=FAIL` — đây là lỗi answer-key/enum/genus deterministic, gần như chắc chắn là lỗi thật cần sửa.',
    '2. Mở `escalation-queue.csv`, đọc `escalation_reason`; lọc `objective=FAIL` trước, rồi tới `red_flag` (khi đã chạy provider thật).',
    '3. Người rành tiếng Đức duyệt phần subjective; chỉ khi đó mới có "duyệt" theo chất lượng chủ quan.',
    '4. `item_id` + `file` truy vết ngược về `content/*/reading/*.json` và khớp với `explanation-review/full-traceability.csv` (cùng `item_id`).',
    '',
    '## Tái chạy',
    '',
    '```',
    'node_modules\\.bin\\tsx.cmd scripts\\content-review-board-run.ts --dry-run   # in cost, không ghi',
    'node_modules\\.bin\\tsx.cmd scripts\\content-review-board-run.ts             # chạy mock, ghi gói này',
    '```',
    '',
    'READ-ONLY với `content/` (hash byte-identical trước/sau). `--provider` được để dành làm điểm nối Tier-2 thật và **không** được kích hoạt trong script một-lượt này để bảo vệ credit.',
    '',
  ].join('\n')
}

// ===========================================================================
// Provider pilot README (Vietnamese) — real free-tier provider deliverable
// ===========================================================================

export interface ProviderPilotInfo {
  reviewerModel: string
  redTeamModel: string
  contentModel: string
  maxConcurrency: number
  /** total provider cases issued (reviewer + red-team). */
  totalCalls: number
  reviewerCalls: number
  redTeamCalls: number
  /** raw provider attempts incl. retries. */
  providerAttempts: number
  retries: number
  /** cases that fell back to the conservative escalate path. */
  totalFailures: number
  reviewerFailures: number
  redTeamFailures: number
  /** the --limit value applied (if any). */
  limit?: number
}

/**
 * Pilot README for a REAL free-tier provider run. Unlike `buildReadme` (the
 * mock one-shot), this documents the actual model ids, the call/failure counts,
 * the PILOT subset, and reiterates the honesty note: the subjective columns are
 * now a REAL model advisory but still "chưa được người rành tiếng Đức duyệt".
 */
export function buildProviderPilotReadme(summary: RunSummary, info: ProviderPilotInfo): string {
  const s = summary
  const levelRows = Object.keys(s.byLevel)
    .sort()
    .map((lv) => `| ${lv} | ${s.byLevel[lv]} |`)
    .join('\n')

  return [
    '# Content Review Board — PILOT (Tier-2 provider THẬT, free-tier)',
    '',
    'Spec: `fuxie-content-review-board` · Follow-up · Tier-2 `--provider` runner THẬT.',
    '',
    'Vai chinh: AI / LLM Engineer · Vai phoi hop: QA Automation Engineer, German Academic Lead',
    '',
    '> ⚠️ **PILOT — tập con giới hạn.** Lần chạy này dùng `--limit ' +
      (info.limit ?? s.totalItems) +
      '` nên CHỈ chấm **' +
      s.totalItems +
      '** item (KHÔNG phải toàn bộ 1.282). Đây là chạy thử có giới hạn để kiểm chứng đường nối provider thật, không phải audit đầy đủ.',
    '',
    '## Provider thật (free-tier, ~$0)',
    '',
    'Tier-2 lần này gọi model THẬT qua OpenRouter, **chỉ dùng model `:free`** nên chi phí ~$0.',
    '',
    '| Thành phần | Model (free-tier) |',
    '| --- | --- |',
    `| Reviewer board (3 reviewer) | \`${info.reviewerModel}\` |`,
    `| Red-team (mù đáp án) | \`${info.redTeamModel}\` |`,
    `| Model SINH nội dung (để đối chiếu) | \`${info.contentModel}\` |`,
    '',
    `Reviewer/red-team model **KHÁC** model sinh nội dung (Req 2.2 — ý kiến độc lập). Concurrency tối đa = ${info.maxConcurrency} (gọi tuần tự, backoff luỹ thừa khi 429/5xx).`,
    '',
    '## Số lần gọi provider + lỗi',
    '',
    '| Chỉ số | Giá trị |',
    '| --- | ---: |',
    `| Tổng case (reviewer + red-team) | ${info.totalCalls} |`,
    `| · reviewer cases | ${info.reviewerCalls} |`,
    `| · red-team cases | ${info.redTeamCalls} |`,
    `| Tổng lần gọi provider (kể cả retry) | ${info.providerAttempts} |`,
    `| Số lần retry (429/5xx) | ${info.retries} |`,
    `| Case lỗi → escalate thận trọng | ${info.totalFailures} |`,
    `| · reviewer lỗi | ${info.reviewerFailures} |`,
    `| · red-team lỗi | ${info.redTeamFailures} |`,
    '',
    'Khi provider lỗi bền (hết retry) hoặc trả output sai schema: reviewer trả `concern` thận trọng, red-team trả output **không hợp lệ** → item luôn **escalate**, KHÔNG bao giờ bịa "pass".',
    '',
    '## ⚠️ Khách quan vs advisory (vẫn áp dụng)',
    '',
    '1. **Objective (Tier-1, CÓ THẨM QUYỀN, miễn phí).** Cột `objective_verdict` = `PASS|FAIL` từ kiểm tra answer-key/enum/genus deterministic. Đây là tín hiệu THẬT để de-risk PR #21.',
    '2. **Subjective (Tier-2, ADVISORY).** Lần này `subjective_source=provider` → các cột `subjective_label`, `confidence`, `red_flag` là ý kiến **model THẬT** (free-tier). Nhưng vẫn chỉ là **advisory**:',
    '',
    `> \`${NOT_REVIEWED_NOTE}\``,
    '',
    'Model thật có thể sai về tiếng Đức. Một item chỉ thực sự "đạt" về chất lượng chủ quan khi **người rành tiếng Đức** duyệt. `advisory-pass (low-assurance)` chỉ là tín hiệu yếu (PASS ∧ confidence=high ∧ ¬red_flag), không phải "approved".',
    '',
    '## Kết quả pilot',
    '',
    '| Chỉ số | Giá trị |',
    '| --- | ---: |',
    `| Item đã chấm (pilot) | ${s.totalItems} |`,
    `| Objective PASS (Tier-1) | ${s.objectivePass} |`,
    `| Objective FAIL (Tier-1) | ${s.objectiveFail} |`,
    `| advisory-pass (low-assurance) | ${s.advisoryPass} |`,
    `| escalate | ${s.escalate} |`,
    `| red_flag | ${s.redFlags} |`,
    `| subjective_source | ${s.subjectiveSource} |`,
    '',
    '### Phân bố theo level',
    '',
    '| Level | Items |',
    '| --- | ---: |',
    levelRows,
    '',
    '## Các file trong gói pilot',
    '',
    '| File | Nội dung |',
    '| --- | --- |',
    '| `per-item.csv` | ' +
      s.totalItems +
      ' dòng: `file, item_id, level, type, objective_verdict, tier1_findings, subjective_label, confidence, red_flag, status, subjective_source`. |',
    '| `escalation-queue.csv` | Các item `status=escalate` + `escalation_reason`. |',
    '| `README.md` | Tài liệu này. |',
    '',
    'Gói pilot này nằm trong thư mục `pilot-provider/` để **không ghi đè** gói mock một-lượt ở thư mục cha. READ-ONLY với `content/` (hash byte-identical trước/sau).',
    '',
  ].join('\n')
}



/** Refuse to write anywhere under content/ (read-only guard). */
export function assertOutDirOutsideContent(repoRoot: string, outDir: string): void {
  const abs = path.resolve(repoRoot, outDir)
  const contentDir = path.resolve(repoRoot, 'content') + path.sep
  if ((abs + path.sep).startsWith(contentDir)) {
    throw new Error(`--out-dir must not point under content/ (got "${outDir}")`)
  }
}

export interface WriteResult {
  outDir: string
  perItemPath: string
  escalationPath: string
  readmePath: string
}

/** Write per-item.csv, escalation-queue.csv, README.md (never recall-report.md). */
export function writeDeliverables(
  repoRoot: string,
  outDir: string,
  records: readonly PerItemRecord[],
  summary: RunSummary,
): WriteResult {
  assertOutDirOutsideContent(repoRoot, outDir)
  const absDir = path.resolve(repoRoot, outDir)
  fs.mkdirSync(absDir, { recursive: true })

  const perItemPath = path.join(absDir, 'per-item.csv')
  const escalationPath = path.join(absDir, 'escalation-queue.csv')
  const readmePath = path.join(absDir, 'README.md')

  // `encoding: 'utf8'` writes NO BOM.
  fs.writeFileSync(perItemPath, buildPerItemCsv(records), { encoding: 'utf8' })
  fs.writeFileSync(escalationPath, buildEscalationCsv(records), { encoding: 'utf8' })
  fs.writeFileSync(readmePath, buildReadme(summary) + '\n', { encoding: 'utf8' })

  return { outDir: absDir, perItemPath, escalationPath, readmePath }
}

// ===========================================================================
// Dry-run cost report (printed by --dry-run; spends nothing)
// ===========================================================================

export function formatCostReport(itemCount: number, paidPricing: ModelPricing = EXAMPLE_PAID_PRICING): string {
  const free = estimateBoardCost(itemCount, FREE_TIER_PRICING)
  const paid = estimateBoardCost(itemCount, paidPricing)
  const usd = (n: number) => `$${n.toFixed(4)}`
  return [
    '=== Fuxie Content Review Board — One-shot DRY RUN (no provider call) ===',
    `items (answer-bearing reading): ${itemCount}`,
    `calls/item:                     4  (3 reviewers + 1 red-team)`,
    `total calls:                    ${free.totalCalls}`,
    '',
    `Free-tier / mock (default):     ${usd(free.estimatedCostUsd)}  (no credit spent)`,
    `Example PAID provider run:      ${usd(paid.estimatedCostUsd)}  @ ${usd(paid.usdPerCall)}/call`,
    '',
    'NOTE: the default one-shot uses MOCK Tier-2 runners → $0. Paid figure is an',
    'illustrative estimate the owner sees BEFORE deciding to spend any credit.',
  ].join('\n')
}
