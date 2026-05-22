import 'dotenv/config'
import fs from 'node:fs'
import path from 'node:path'
import { runAiEvalSuite, type AiEvalFixture } from '../apps/ai-service/src/lib/eval-harness.ts'
import { runProviderBackedAiEval } from './ai-eval-provider-runner.ts'

const ROOT = process.cwd()
const DEFAULT_FIXTURE = path.join('scripts', 'fixtures', 'ai-eval-harness', 'baseline.json')
const DEFAULT_ARTIFACT_DIR = path.join('tmp', 'ai-eval-runs')

async function main() {
    const fixturePath = path.resolve(ROOT, getArgValue('--fixture') || DEFAULT_FIXTURE)
    const jsonOutput = process.argv.includes('--json')
    const providerMode = process.argv.includes('--provider')
    const allowProviderBlocked = process.argv.includes('--allow-provider-blocked')
    const artifactDir = path.resolve(ROOT, getArgValue('--artifact-dir') || DEFAULT_ARTIFACT_DIR)

    if (!fs.existsSync(fixturePath)) {
        console.error(`[ai-eval] Missing fixture: ${fixturePath}`)
        process.exit(1)
    }

    const fixture = JSON.parse(fs.readFileSync(fixturePath, 'utf8')) as AiEvalFixture

    if (providerMode) {
        const providerRun = await runProviderBackedAiEval({ fixture, artifactDir })
        if (jsonOutput) {
            console.log(JSON.stringify(providerRun, null, 2))
        } else {
            console.log('[ai-eval] Provider-backed AI Eval Run')
            console.log(`[ai-eval] Status: ${providerRun.status}`)
            console.log(`[ai-eval] Provider cases: ${providerRun.providerCases}`)
            console.log(`[ai-eval] Artifact: ${path.relative(ROOT, providerRun.artifactPath)}`)
            if (providerRun.suiteResult) {
                printHumanReport(fixturePath, providerRun.suiteResult)
            }
        }

        if (providerRun.status !== 'completed' && !allowProviderBlocked) {
            process.exit(1)
        }
        if (providerRun.suiteResult?.summary.failedCases) {
            process.exit(1)
        }
        return
    }

    const result = runAiEvalSuite(fixture)

    if (jsonOutput) {
        console.log(JSON.stringify(result, null, 2))
    } else {
        printHumanReport(fixturePath, result)
    }

    if (result.summary.failedCases > 0) {
        process.exit(1)
    }
}

function printHumanReport(
    fixturePath: string,
    result: ReturnType<typeof runAiEvalSuite>,
) {
    console.log('[ai-eval] AI Eval Harness Report')
    console.log(`[ai-eval] Fixture: ${path.relative(ROOT, fixturePath)}`)
    console.log(`[ai-eval] Suite: ${result.suiteVersion}`)
    console.log(`[ai-eval] Cases: ${result.summary.passedCases}/${result.summary.totalCases} passed (${result.summary.passRate}%)`)
    console.log(`[ai-eval] Average score: ${formatNullable(result.summary.averageScorePercent)}`)
    console.log(`[ai-eval] Median latency ms: ${formatNullable(result.summary.medianLatencyMs)}`)
    console.log(`[ai-eval] Estimated cost USD: ${formatNullable(result.summary.totalEstimatedCostUsd)}`)
    console.log('[ai-eval] Surfaces:')
    for (const surface of result.summary.surfaces) {
        console.log(`  - ${surface.surface}: ${surface.passedCases}/${surface.totalCases} passed`)
    }

    const failedCases = result.cases.filter((testCase) => !testCase.passed)
    if (failedCases.length === 0) {
        console.log('[ai-eval] No release-blocking AI eval issues.')
        return
    }

    console.log('[ai-eval] Failed cases:')
    for (const testCase of failedCases) {
        console.log(`  - ${testCase.id} (${testCase.surface}, ${testCase.level})`)
        for (const issue of testCase.issues.filter((item) => item.severity === 'error')) {
            console.log(`    [${issue.code}] ${issue.message}`)
        }
    }
}

function formatNullable(value: number | null) {
    return value === null ? 'n/a' : String(value)
}

function getArgValue(name: string) {
    const index = process.argv.indexOf(name)
    if (index === -1) return null
    return process.argv[index + 1] || null
}

main().catch((error) => {
    console.error('[ai-eval] Failed:', error instanceof Error ? error.message : String(error))
    process.exit(1)
})
