import fs from 'node:fs'
import path from 'node:path'
import {
    buildAiEvalAcademicReviewPack,
    renderAiEvalAcademicReviewPackMarkdown,
} from '../apps/ai-service/src/lib/eval-academic-review-pack.ts'
import {
    buildAiEvalArtifactReadout,
    type AiEvalArtifact,
} from '../apps/ai-service/src/lib/eval-artifact-readout.ts'
import type { AiEvalFixture } from '../apps/ai-service/src/lib/eval-harness.ts'

const ROOT = process.cwd()
const DEFAULT_FIXTURE_PATH = path.join('scripts', 'fixtures', 'ai-eval-harness', 'baseline.json')
const DEFAULT_ARTIFACT_DIR = path.join('tmp', 'ai-eval-runs')
const DEFAULT_REPORT_PATH = path.join(DEFAULT_ARTIFACT_DIR, 'academic-review-pack.md')

function main() {
    const fixturePath = path.resolve(ROOT, getArgValue('--fixture') || DEFAULT_FIXTURE_PATH)
    const artifactDir = path.resolve(ROOT, getArgValue('--artifact-dir') || DEFAULT_ARTIFACT_DIR)
    const jsonOutput = process.argv.includes('--json')
    const defaultReportPath = jsonOutput
        ? path.join(DEFAULT_ARTIFACT_DIR, 'academic-review-pack.json')
        : DEFAULT_REPORT_PATH
    const reportPath = path.resolve(ROOT, getArgValue('--report-path') || defaultReportPath)

    const fixture = JSON.parse(fs.readFileSync(fixturePath, 'utf8')) as AiEvalFixture
    const artifacts = readArtifacts(artifactDir)
    const artifactReadout = buildAiEvalArtifactReadout(artifacts)
    const pack = buildAiEvalAcademicReviewPack(fixture, { artifactReadout })
    const output = jsonOutput
        ? `${JSON.stringify(pack, null, 2)}\n`
        : renderAiEvalAcademicReviewPackMarkdown(pack)

    fs.mkdirSync(path.dirname(reportPath), { recursive: true })
    fs.writeFileSync(reportPath, output, 'utf8')
    console.log(`[ai-eval-academic-review] Report: ${path.relative(ROOT, reportPath)}`)
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

function getArgValue(name: string) {
    const index = process.argv.indexOf(name)
    if (index === -1) return null
    return process.argv[index + 1] || null
}

main()
