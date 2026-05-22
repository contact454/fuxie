import fs from 'node:fs'
import path from 'node:path'
import {
    buildAiEvalAcademicReviewPack,
} from '../apps/ai-service/src/lib/eval-academic-review-pack.ts'
import {
    buildAiEvalAcademicSignoffTemplate,
    type AiEvalAcademicSignoffRecord,
} from '../apps/ai-service/src/lib/eval-academic-signoff.ts'
import {
    buildAiEvalArtifactReadout,
    type AiEvalArtifact,
} from '../apps/ai-service/src/lib/eval-artifact-readout.ts'
import {
    buildAiEvalFixtureExpansionPlan,
    renderAiEvalFixtureExpansionPlanMarkdown,
} from '../apps/ai-service/src/lib/eval-fixture-expansion.ts'
import type { AiEvalFixture } from '../apps/ai-service/src/lib/eval-harness.ts'

const ROOT = process.cwd()
const DEFAULT_FIXTURE_PATH = path.join('scripts', 'fixtures', 'ai-eval-harness', 'baseline.json')
const DEFAULT_ARTIFACT_DIR = path.join('tmp', 'ai-eval-runs')
const DEFAULT_JSON_PATH = path.join(DEFAULT_ARTIFACT_DIR, 'fixture-expansion-proposal.json')
const DEFAULT_REPORT_PATH = path.join(DEFAULT_ARTIFACT_DIR, 'fixture-expansion-proposal.md')

function main() {
    const fixturePath = path.resolve(ROOT, getArgValue('--fixture') || DEFAULT_FIXTURE_PATH)
    const artifactDir = path.resolve(ROOT, getArgValue('--artifact-dir') || DEFAULT_ARTIFACT_DIR)
    const signoffPathArg = getArgValue('--signoff')
    const jsonPath = path.resolve(ROOT, getArgValue('--json-path') || DEFAULT_JSON_PATH)
    const reportPath = path.resolve(ROOT, getArgValue('--report-path') || DEFAULT_REPORT_PATH)
    const requireFinal = process.argv.includes('--require-final')

    const fixture = JSON.parse(fs.readFileSync(fixturePath, 'utf8')) as AiEvalFixture
    const artifacts = readArtifacts(artifactDir)
    const reviewPack = buildAiEvalAcademicReviewPack(fixture, {
        artifactReadout: buildAiEvalArtifactReadout(artifacts),
    })
    const signoff = signoffPathArg
        ? JSON.parse(fs.readFileSync(path.resolve(ROOT, signoffPathArg), 'utf8')) as AiEvalAcademicSignoffRecord
        : buildAiEvalAcademicSignoffTemplate(reviewPack)
    const plan = buildAiEvalFixtureExpansionPlan(fixture, reviewPack, signoff, { requireFinal })

    writeFile(jsonPath, `${JSON.stringify(plan, null, 2)}\n`)
    writeFile(reportPath, renderAiEvalFixtureExpansionPlanMarkdown(plan))

    console.log(`[ai-eval-fixture-expansion] JSON: ${path.relative(ROOT, jsonPath)}`)
    console.log(`[ai-eval-fixture-expansion] Report: ${path.relative(ROOT, reportPath)}`)

    if (requireFinal && plan.summary.blocked) {
        process.exitCode = 1
    }
}

function readArtifacts(artifactDir: string): AiEvalArtifact[] {
    if (!fs.existsSync(artifactDir)) return []

    return fs.readdirSync(artifactDir)
        .filter((file) => file.endsWith('.json') && file.startsWith('ai-eval-provider-'))
        .sort()
        .map((file) => {
            const artifactPath = path.join(artifactDir, file)
            const data = JSON.parse(fs.readFileSync(artifactPath, 'utf8')) as AiEvalArtifact
            return {
                ...data,
                artifactPath,
            }
        })
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

main()
