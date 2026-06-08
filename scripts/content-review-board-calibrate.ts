/**
 * Mutation gold-set calibration CLI — `scripts/content-review-board-calibrate.ts`
 * Spec `fuxie-content-review-board`, Component 5 (task 5.1).
 *
 * Vai chinh: AI / LLM Engineer
 * Vai phoi hop: QA Automation Engineer, Content QA / Linguistic Reviewer, DevOps
 *
 * Copies N real items into a TEMP dir, injects 5 known mutation types (genus,
 * umlaut_drop, wrong_answer, level_violation, bad_translation), runs the two-tier
 * board on the mutated copies, measures `Recall_By_Type` (Tier-1 vs Tier-2),
 * flags low/unmeasured recall as "chưa đáng tin", deletes the temp copies, and
 * asserts `content/` is byte-identical (Property 5, Req 4.5).
 *
 * The core logic + all detection lives in `scripts/lib/review-board-calibrate.ts`
 * (pure + injectable, unit-tested). This file is just the CLI seam.
 *
 * READ-ONLY content. NO provider credit (offline Tier-1 + injected mock Tier-2).
 *
 * CLI:
 *   --n <N>            target number of mutation cases (default 20)
 *   --seed <S>         deterministic selection seed (default 1)
 *   --level <a1..c2>   restrict source items to one CEFR level
 *   --languagetool     opt-in LanguageTool spelling/grammar (default off, local)
 *   --report-path <f>  write recall-report.md here (default
 *                      docs/content-quality/audit-2026-06/review-board/recall-report.md)
 *   --json             also print the RecallReport as JSON to stdout
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import {
  type CalibrationOptions,
  formatRecallReport,
  runCalibration,
} from './lib/review-board-calibrate'

const REPO_ROOT = path.resolve(fileURLToPath(import.meta.url), '..', '..')

interface CliArgs {
  n: number
  seed: number
  level?: string
  useLanguageTool: boolean
  reportPath: string
  json: boolean
}

export function parseArgs(argv: readonly string[]): CliArgs {
  const args: CliArgs = {
    n: 20,
    seed: 1,
    useLanguageTool: false,
    reportPath: 'docs/content-quality/audit-2026-06/review-board/recall-report.md',
    json: false,
  }
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--n') args.n = Number(argv[++i] ?? args.n)
    else if (a.startsWith('--n=')) args.n = Number(a.slice('--n='.length))
    else if (a === '--seed') args.seed = Number(argv[++i] ?? args.seed)
    else if (a.startsWith('--seed=')) args.seed = Number(a.slice('--seed='.length))
    else if (a === '--level') args.level = String(argv[++i] ?? '').toLowerCase()
    else if (a.startsWith('--level=')) args.level = a.slice('--level='.length).toLowerCase()
    else if (a === '--languagetool') args.useLanguageTool = true
    else if (a === '--report-path') args.reportPath = String(argv[++i] ?? args.reportPath)
    else if (a.startsWith('--report-path=')) args.reportPath = a.slice('--report-path='.length)
    else if (a === '--json') args.json = true
  }
  if (!Number.isFinite(args.n) || args.n <= 0) args.n = 20
  if (!Number.isFinite(args.seed)) args.seed = 1
  return args
}

/** Refuse to write the report anywhere under content/ (read-only guard). */
export function assertReportPathOutsideContent(repoRoot: string, target: string): void {
  const abs = path.resolve(repoRoot, target)
  const contentDir = path.resolve(repoRoot, 'content') + path.sep
  if ((abs + path.sep).startsWith(contentDir)) {
    throw new Error(`--report-path must not point under content/ (got "${target}")`)
  }
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2))
  assertReportPathOutsideContent(REPO_ROOT, args.reportPath)

  const opts: CalibrationOptions = {
    repoRoot: REPO_ROOT,
    n: args.n,
    seed: args.seed,
    level: args.level,
    useLanguageTool: args.useLanguageTool,
  }

  const { report } = await runCalibration(opts)
  const md = formatRecallReport(report)

  // write report (UTF-8, no BOM); never under content/
  const abs = path.resolve(REPO_ROOT, args.reportPath)
  fs.mkdirSync(path.dirname(abs), { recursive: true })
  fs.writeFileSync(abs, md + '\n', { encoding: 'utf8' })

  if (args.json) {
    process.stdout.write(JSON.stringify(report, null, 2) + '\n')
  } else {
    process.stdout.write(md + '\n')
  }
  process.stderr.write(`recall report written: ${abs}\n`)
  process.stderr.write(
    `content read-only: ${report.contentReadOnly ? 'OK' : 'VIOLATED'} · temp cleaned: ${report.tempCleaned ? 'yes' : 'no'}\n`,
  )

  // exit 0 always (calibration is a measurement, not a gate); content drift
  // would have thrown inside runCalibration already.
}

const invokedDirectly =
  process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
if (invokedDirectly) {
  void main().catch((err) => {
    process.stderr.write(`${err instanceof Error ? err.stack ?? err.message : String(err)}\n`)
    process.exit(1)
  })
}
