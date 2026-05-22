import fs from 'node:fs'
import path from 'node:path'

const ROOT = process.cwd()
const CONTENT_DIR = path.join(ROOT, 'content')
const DRY_RUN = process.argv.includes('--dry-run')

interface Result {
    file: string
    sourceScript: string
    status: 'updated' | 'missing_source' | 'unsupported_source_shape' | 'no_source_declared'
}

function main() {
    const results: Result[] = []
    for (const file of walk(CONTENT_DIR).filter((item) => item.replace(/\\/g, '/').includes('/listening/'))) {
        const data = JSON.parse(fs.readFileSync(file, 'utf8'))
        const sourceScript = String(data.metadata?.source_script || '')
        if (!sourceScript) {
            results.push(result(file, sourceScript, 'no_source_declared'))
            continue
        }

        const sourcePath = path.join(ROOT, sourceScript)
        if (!fs.existsSync(sourcePath)) {
            results.push(result(file, sourceScript, 'missing_source'))
            continue
        }

        const sourceData = JSON.parse(fs.readFileSync(sourcePath, 'utf8'))
        const lines = extractLines(sourceData)
        if (lines.length === 0) {
            results.push(result(file, sourceScript, 'unsupported_source_shape'))
            continue
        }

        data.transcript = {
            type: 'studio_source_transcript',
            status: 'complete',
            source: 'studio_source_script',
            quality: 'source_verified',
            sourceScript,
            note: 'Transcript replaced from source script by scripts/apply-source-transcripts.ts.',
            lines,
        }

        if (!DRY_RUN) fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`, 'utf8')
        results.push(result(file, sourceScript, 'updated'))
    }

    const counts = results.reduce<Record<string, number>>((acc, item) => {
        acc[item.status] = (acc[item.status] || 0) + 1
        return acc
    }, {})

    fs.mkdirSync(path.join(ROOT, 'tmp'), { recursive: true })
    fs.writeFileSync(path.join(ROOT, 'tmp', 'source-transcript-apply-report.json'), `${JSON.stringify({ dryRun: DRY_RUN, counts, results }, null, 2)}\n`, 'utf8')
    console.log(`[source-transcripts] dryRun=${DRY_RUN}`)
    console.log(`[source-transcripts] ${JSON.stringify(counts)}`)
}

function extractLines(sourceData: any) {
    const rawLines = Array.isArray(sourceData?.lines)
        ? sourceData.lines
        : Array.isArray(sourceData?.transcript?.lines)
            ? sourceData.transcript.lines
            : []

    return rawLines
        .map((line: any, index: number) => {
            if (typeof line === 'string') {
                return { speaker: `Sprecher ${index + 1}`, speaker_role: 'source_script', text: line }
            }
            if (line && typeof line === 'object' && typeof line.text === 'string') {
                return {
                    speaker: String(line.speaker || `Sprecher ${index + 1}`),
                    speaker_role: String(line.speaker_role || line.role || 'source_script'),
                    text: line.text,
                    ...(line.linkedQuestionId ? { linkedQuestionId: String(line.linkedQuestionId) } : {}),
                }
            }
            return null
        })
        .filter(Boolean)
}

function result(file: string, sourceScript: string, status: Result['status']): Result {
    return {
        file: path.relative(ROOT, file),
        sourceScript,
        status,
    }
}

function walk(dir: string): string[] {
    const files: string[] = []
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const fullPath = path.join(dir, entry.name)
        if (entry.isDirectory()) files.push(...walk(fullPath))
        else if (entry.name.endsWith('.json')) files.push(fullPath)
    }
    return files
}

main()
