import fs from 'node:fs'
import path from 'node:path'
import {
    buildAiEvalArtifactReadout,
    renderAiEvalArtifactReadoutMarkdown,
    type AiEvalArtifact,
} from '../apps/ai-service/src/lib/eval-artifact-readout.ts'

const ROOT = process.cwd()
const DEFAULT_ARTIFACT_DIR = path.join('tmp', 'ai-eval-runs')

function main() {
    const artifactDir = path.resolve(ROOT, getArgValue('--artifact-dir') || DEFAULT_ARTIFACT_DIR)
    const reportPathArg = getArgValue('--report-path')
    const reportPath = reportPathArg ? path.resolve(ROOT, reportPathArg) : null
    const jsonOutput = process.argv.includes('--json')

    const artifacts = readArtifacts(artifactDir)
    const readout = buildAiEvalArtifactReadout(artifacts)
    const output = jsonOutput
        ? `${JSON.stringify(readout, null, 2)}\n`
        : renderAiEvalArtifactReadoutMarkdown(readout)

    if (reportPath) {
        fs.mkdirSync(path.dirname(reportPath), { recursive: true })
        fs.writeFileSync(reportPath, output, 'utf8')
        console.log(`[ai-eval-readout] Report: ${path.relative(ROOT, reportPath)}`)
        return
    }

    process.stdout.write(output)
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
