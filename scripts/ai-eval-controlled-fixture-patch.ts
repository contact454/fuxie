import fs from 'node:fs'
import path from 'node:path'
import {
    buildAiEvalControlledFixturePatch,
    renderAiEvalControlledFixturePatchMarkdown,
    type AiEvalControlledFixturePatch,
} from '../apps/ai-service/src/lib/eval-controlled-fixture-patch.ts'
import type { AiEvalFixtureExpansionPlan } from '../apps/ai-service/src/lib/eval-fixture-expansion.ts'
import type { AiEvalFixture } from '../apps/ai-service/src/lib/eval-harness.ts'

const ROOT = process.cwd()
const DEFAULT_FIXTURE_PATH = path.join('scripts', 'fixtures', 'ai-eval-harness', 'baseline.json')
const DEFAULT_PLAN_PATH = path.join('tmp', 'ai-eval-runs', 'fixture-expansion-proposal.json')
const DEFAULT_PREVIEW_PATH = path.join('tmp', 'ai-eval-runs', 'controlled-fixture-preview.json')
const DEFAULT_REPORT_PATH = path.join('tmp', 'ai-eval-runs', 'controlled-fixture-patch.md')

function main() {
    const fixturePath = path.resolve(ROOT, getArgValue('--fixture') || DEFAULT_FIXTURE_PATH)
    const planPath = path.resolve(ROOT, getArgValue('--plan') || DEFAULT_PLAN_PATH)
    const previewPath = path.resolve(ROOT, getArgValue('--preview-path') || DEFAULT_PREVIEW_PATH)
    const reportPath = path.resolve(ROOT, getArgValue('--report-path') || DEFAULT_REPORT_PATH)
    const apply = process.argv.includes('--apply')
    const proposalIds = getArgValues('--proposal').flatMap((value) => value.split(',')).map((value) => value.trim()).filter(Boolean)

    const fixture = JSON.parse(fs.readFileSync(fixturePath, 'utf8')) as AiEvalFixture
    const plan = JSON.parse(fs.readFileSync(planPath, 'utf8')) as AiEvalFixtureExpansionPlan
    const patch = buildAiEvalControlledFixturePatch(fixture, plan, {
        mode: apply ? 'apply' : 'preview',
        proposalIds,
    })

    writeFile(reportPath, renderAiEvalControlledFixturePatchMarkdown(patch))
    writeFile(previewPath, `${JSON.stringify(patch.fixture, null, 2)}\n`)

    console.log(`[ai-eval-controlled-fixture-patch] Report: ${path.relative(ROOT, reportPath)}`)
    console.log(`[ai-eval-controlled-fixture-patch] Preview fixture: ${path.relative(ROOT, previewPath)}`)

    if (patch.summary.blocked) {
        process.exitCode = 1
        return
    }

    if (apply) {
        writeFixture(fixturePath, patch)
        console.log(`[ai-eval-controlled-fixture-patch] Applied fixture: ${path.relative(ROOT, fixturePath)}`)
    }
}

function writeFixture(fixturePath: string, patch: AiEvalControlledFixturePatch) {
    writeFile(fixturePath, `${JSON.stringify(patch.fixture, null, 2)}\n`)
}

function writeFile(filePath: string, data: string) {
    fs.mkdirSync(path.dirname(filePath), { recursive: true })
    fs.writeFileSync(filePath, data, 'utf8')
}

function getArgValue(name: string) {
    const index = process.argv.indexOf(name)
    if (index === -1) return null
    return process.argv[index + 1] || null
}

function getArgValues(name: string) {
    const values: string[] = []
    for (let index = 0; index < process.argv.length; index += 1) {
        if (process.argv[index] === name && process.argv[index + 1]) {
            values.push(process.argv[index + 1]!)
        }
    }
    return values
}

main()
