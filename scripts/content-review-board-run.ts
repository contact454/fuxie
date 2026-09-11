/**
 * One-shot review-board runner CLI — `scripts/content-review-board-run.ts`
 * Spec `fuxie-content-review-board`, Component 6 (task 6.1) + provider follow-up.
 *
 * Vai chinh: AI / LLM Engineer
 * Vai phoi hop: Content QA / Linguistic Reviewer, German Academic Lead,
 *               QA Automation Engineer, DevOps / Cloud Engineer
 *
 * Runs Tier-1 (REAL, deterministic, offline, free) + Tier-2 over the
 * answer-bearing reading explanation questions and writes the deliverable.
 * READ-ONLY content.
 *
 *   - default            : Tier-2 MOCK runners (no provider credit) → mock
 *                          one-shot deliverable.
 *   - --provider         : Tier-2 REAL free-tier provider runners (≈$0); writes
 *                          a PILOT deliverable (use with --limit to bound scope).
 *
 * Core logic lives in `scripts/lib/review-board-run.ts` (pure + injectable).
 *
 * CLI:
 *   --dry-run            print the cost estimate and exit (no write / no call).
 *   --level <a1..c2>     restrict to one CEFR level.
 *   --limit <n>          bound to AT MOST n answer-bearing items (pilot subset).
 *   --languagetool       opt-in LanguageTool/hunspell spelling (default off).
 *   --out-dir <dir>      output dir (default review-board; provider → pilot-provider).
 *   --provider           run REAL free-tier Tier-2 provider runners (≈$0).
 *   --json               also print the run summary as JSON.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import {
  type ProviderPilotInfo,
  buildEscalationCsv,
  buildPerItemCsv,
  buildProviderPilotReadme,
  buildReadme,
  countItems,
  formatCostReport,
  runReviewBoard,
  scanReadingFiles,
  writeDeliverables,
} from './lib/review-board-run'
import {
  DEFAULT_CONTENT_MODEL,
  DEFAULT_REDTEAM_MODEL,
  DEFAULT_REVIEWER_MODEL,
  createProviderRedTeamRunner,
  createProviderReviewerRunner,
  newProviderRunnerStats,
} from './lib/review-board-provider-runner'

const REPO_ROOT = path.resolve(fileURLToPath(import.meta.url), '..', '..')

const DEFAULT_OUT_DIR = 'docs/content-quality/audit-2026-06/review-board'
const PROVIDER_OUT_DIR = 'docs/content-quality/audit-2026-06/review-board/pilot-provider'

interface CliArgs {
  dryRun: boolean
  level?: string
  limit?: number
  useLanguageTool: boolean
  outDir?: string
  provider: boolean
  throttle?: number
  json: boolean
}

export function parseArgs(argv: readonly string[]): CliArgs {
  const args: CliArgs = {
    dryRun: false,
    useLanguageTool: false,
    provider: false,
    json: false,
  }
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--dry-run') args.dryRun = true
    else if (a === '--level') args.level = String(argv[++i] ?? '').toLowerCase()
    else if (a.startsWith('--level=')) args.level = a.slice('--level='.length).toLowerCase()
    else if (a === '--limit') args.limit = Number(argv[++i])
    else if (a.startsWith('--limit=')) args.limit = Number(a.slice('--limit='.length))
    else if (a === '--languagetool') args.useLanguageTool = true
    else if (a === '--out-dir') args.outDir = String(argv[++i] ?? '')
    else if (a.startsWith('--out-dir=')) args.outDir = a.slice('--out-dir='.length)
    else if (a === '--provider') args.provider = true
    else if (a.startsWith('--provider=')) args.provider = true
    else if (a === '--json') args.json = true
  }
  if (args.limit != null && (!Number.isFinite(args.limit) || args.limit <= 0)) {
    delete args.limit
  }
  return args
}

function writeFileNoBom(p: string, content: string): void {
  fs.mkdirSync(path.dirname(p), { recursive: true })
  fs.writeFileSync(p, content, { encoding: 'utf8' })
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2))

  // --dry-run: count items (read-only) and print cost; never write / call provider.
  if (args.dryRun) {
    const files = scanReadingFiles(REPO_ROOT, args.level)
    const count = countItems(files)
    process.stdout.write(formatCostReport(count) + '\n')
    return
  }

  // -------------------------------------------------------------------------
  // --provider: REAL Tier-2 free-tier provider runners (≈$0). Writes a PILOT.
  // -------------------------------------------------------------------------
  if (args.provider) {
    const stats = newProviderRunnerStats()
    const throttleMs = args.throttle ?? 4000
    const runnerOpts = { stats, throttleMs, maxRetries: 5, baseDelayMs: 5000 }
    const reviewerRunner = createProviderReviewerRunner(runnerOpts)
    const redTeamRunner = createProviderRedTeamRunner(runnerOpts)
    const outDir = args.outDir ?? PROVIDER_OUT_DIR

    process.stderr.write(
      `[review-board] PROVIDER run (free-tier, ~$0): reviewer=${DEFAULT_REVIEWER_MODEL} ` +
        `redteam=${DEFAULT_REDTEAM_MODEL}${args.limit ? ` limit=${args.limit}` : ''} throttle=${throttleMs}ms\n`,
    )

    const { records, summary, contentReadOnly } = await runReviewBoard({
      repoRoot: REPO_ROOT,
      level: args.level,
      limit: args.limit,
      useLanguageTool: args.useLanguageTool,
      subjectiveSource: 'provider',
      reviewerRunner,
      redTeamRunner,
    })

    if (!contentReadOnly) {
      throw new Error('[review-board] CONTENT MUTATED during run — read-only invariant violated (Property 5).')
    }

    const info: ProviderPilotInfo = {
      reviewerModel: DEFAULT_REVIEWER_MODEL,
      redTeamModel: DEFAULT_REDTEAM_MODEL,
      contentModel: DEFAULT_CONTENT_MODEL,
      maxConcurrency: 1,
      totalCalls: stats.reviewerCalls + stats.redTeamCalls,
      reviewerCalls: stats.reviewerCalls,
      redTeamCalls: stats.redTeamCalls,
      providerAttempts: stats.providerAttempts,
      retries: stats.retries,
      totalFailures: stats.reviewerFailures + stats.redTeamFailures,
      reviewerFailures: stats.reviewerFailures,
      redTeamFailures: stats.redTeamFailures,
    }
    if (args.limit != null) info.limit = args.limit

    const absDir = path.resolve(REPO_ROOT, outDir)
    writeFileNoBom(path.join(absDir, 'per-item.csv'), buildPerItemCsv(records))
    writeFileNoBom(path.join(absDir, 'escalation-queue.csv'), buildEscalationCsv(records))
    writeFileNoBom(path.join(absDir, 'README.md'), buildProviderPilotReadme(summary, info) + '\n')

    if (args.json) {
      process.stdout.write(JSON.stringify({ summary, providerStats: stats }, null, 2) + '\n')
    }
    process.stderr.write(
      `\nPILOT provider deliverable: ${absDir}\n` +
        `items=${summary.totalItems} objective PASS=${summary.objectivePass} FAIL=${summary.objectiveFail} ` +
        `escalate=${summary.escalate} advisory-pass=${summary.advisoryPass} redFlags=${summary.redFlags}\n` +
        `provider calls=${info.totalCalls} (reviewer=${info.reviewerCalls} redteam=${info.redTeamCalls}) ` +
        `attempts=${info.providerAttempts} retries=${info.retries} failures=${info.totalFailures}\n` +
        `content read-only: ${contentReadOnly ? 'OK' : 'VIOLATED'}\n`,
    )
    return
  }

  // -------------------------------------------------------------------------
  // Default: Tier-1 real + Tier-2 MOCK (no credit). Write the deliverable.
  // -------------------------------------------------------------------------
  const { records, summary, contentReadOnly } = await runReviewBoard({
    repoRoot: REPO_ROOT,
    level: args.level,
    limit: args.limit,
    useLanguageTool: args.useLanguageTool,
    subjectiveSource: 'mock',
  })

  if (!contentReadOnly) {
    throw new Error('[review-board] CONTENT MUTATED during run — read-only invariant violated (Property 5).')
  }

  const written = writeDeliverables(REPO_ROOT, args.outDir ?? DEFAULT_OUT_DIR, records, summary)

  if (args.json) {
    process.stdout.write(JSON.stringify(summary, null, 2) + '\n')
  } else {
    process.stdout.write(buildReadme(summary) + '\n')
  }

  process.stderr.write(`\nper-item.csv:        ${written.perItemPath} (${records.length} rows)\n`)
  process.stderr.write(`escalation-queue.csv: ${written.escalationPath} (${summary.escalate} rows)\n`)
  process.stderr.write(`README.md:           ${written.readmePath}\n`)
  process.stderr.write(
    `objective: PASS=${summary.objectivePass} FAIL=${summary.objectiveFail} · ` +
      `escalate=${summary.escalate} · subjective_source=${summary.subjectiveSource} · ` +
      `cost=$${summary.freeCost.estimatedCostUsd.toFixed(4)}\n`,
  )
  process.stderr.write(`content read-only: ${contentReadOnly ? 'OK' : 'VIOLATED'}\n`)
}

const invokedDirectly =
  process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
if (invokedDirectly) {
  void main().catch((err) => {
    process.stderr.write(`${err instanceof Error ? err.stack ?? err.message : String(err)}\n`)
    process.exit(1)
  })
}
