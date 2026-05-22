import fs from 'node:fs'
import path from 'node:path'

type Skill = 'course' | 'grammar' | 'listening' | 'reading' | 'speaking' | 'vocabulary' | 'writing' | 'unknown'
type CefrLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'

interface ContentRecord {
    file: string
    skill: Skill
    level: CefrLevel
    id: string
    title: string
    data: Record<string, any>
}

const ROOT = process.cwd()
const CONTENT_DIR = path.join(ROOT, 'content')
const DOCS_DIR = path.join(ROOT, 'docs', 'content-quality')
const APP_DATA_DIR = path.join(ROOT, 'apps', 'web', 'src', 'data', 'content-quality')
const LEVELS: CefrLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']
const SKILLS: Skill[] = ['course', 'grammar', 'listening', 'reading', 'speaking', 'vocabulary', 'writing']
const GENERATED_AT = '2026-05-12'

function main() {
    const records = readContentRecords()
    fs.mkdirSync(DOCS_DIR, { recursive: true })
    fs.mkdirSync(APP_DATA_DIR, { recursive: true })

    const summary = buildSummary(records)
    const spotCheckSamples = buildSpotCheckSamples(records)
    const transcriptParity = buildTranscriptParity(records)
    const learningOutcomeMap = buildLearningOutcomeMap(records)
    const pilotPack = buildPilotPack(spotCheckSamples)

    writeJson(path.join(APP_DATA_DIR, 'content-quality-dashboard-data.json'), {
        generatedAt: GENERATED_AT,
        summary,
        spotCheckSamples,
        transcriptParity,
        pilotPack,
    })
    writeJson(path.join(APP_DATA_DIR, 'learning-outcome-map.json'), learningOutcomeMap)

    writeMarkdown(path.join(DOCS_DIR, 'human-spot-check-samples.md'), renderSpotCheckMarkdown(spotCheckSamples))
    writeMarkdown(path.join(DOCS_DIR, 'transcript-source-parity-report.md'), renderTranscriptParityMarkdown(transcriptParity))
    writeMarkdown(path.join(DOCS_DIR, 'pilot-test-pack.md'), renderPilotPackMarkdown(pilotPack))
    writeMarkdown(path.join(DOCS_DIR, 'learning-outcome-map-report.md'), renderLearningOutcomeMarkdown(learningOutcomeMap))

    console.log(`[content-quality] Generated assets for ${records.length} content records`)
    console.log(`[content-quality] Spot-check samples: ${spotCheckSamples.length}`)
    console.log(`[content-quality] Learning outcomes: ${learningOutcomeMap.outcomes.length}`)
    console.log(`[content-quality] Transcript source ready: ${transcriptParity.sourceReadyCount}/${transcriptParity.totalListening}`)
}

function readContentRecords(): ContentRecord[] {
    return walk(CONTENT_DIR)
        .map((file) => {
            const data = JSON.parse(fs.readFileSync(file, 'utf8'))
            const skill = inferSkill(file)
            const level = inferLevel(file, data)
            return {
                file: normalizePath(path.relative(ROOT, file)),
                skill,
                level,
                id: getContentId(file, data),
                title: getTitle(file, data),
                data,
            }
        })
        .filter((record) => record.skill !== 'unknown')
        .sort((a, b) => a.file.localeCompare(b.file))
}

function buildSummary(records: ContentRecord[]) {
    const byLevel = Object.fromEntries(LEVELS.map((level) => [level, emptyLevelSummary()])) as Record<CefrLevel, ReturnType<typeof emptyLevelSummary>>
    const bySkill = Object.fromEntries(SKILLS.map((skill) => [skill, 0])) as Record<Skill, number>

    let transcriptComplete = 0
    let reconstructedTranscripts = 0
    let cefrAuditCount = 0
    let learningOutcomeFileCount = 0
    let learningOutcomeTotal = 0

    for (const record of records) {
        bySkill[record.skill] += 1
        byLevel[record.level].files += 1
        byLevel[record.level].skills[record.skill] += 1

        if (record.data.cefrAudit) {
            cefrAuditCount += 1
            byLevel[record.level].cefrAudit += 1
        }

        const outcomes = getLearningOutcomes(record)
        if (outcomes.length > 0) {
            learningOutcomeFileCount += 1
            learningOutcomeTotal += outcomes.length
            byLevel[record.level].learningOutcomes += outcomes.length
        }

        if (record.skill === 'listening') {
            if (record.data.transcript?.status === 'complete') transcriptComplete += 1
            if (record.data.transcript?.source === 'reconstructed_full_script') reconstructedTranscripts += 1
        }
    }

    return {
        totalFiles: records.length,
        bySkill,
        byLevel,
        transcriptComplete,
        reconstructedTranscripts,
        cefrAuditCount,
        learningOutcomeFileCount,
        learningOutcomeTotal,
    }
}

function emptyLevelSummary() {
    return {
        files: 0,
        cefrAudit: 0,
        learningOutcomes: 0,
        skills: Object.fromEntries(SKILLS.map((skill) => [skill, 0])) as Record<Skill, number>,
    }
}

function buildSpotCheckSamples(records: ContentRecord[]) {
    const samples: Array<Record<string, unknown>> = []
    for (const level of LEVELS) {
        const levelRecords = records.filter((record) => record.level === level && record.skill !== 'course')
        const buckets = new Map<Skill, ContentRecord[]>()
        for (const skill of ['listening', 'reading', 'writing', 'speaking', 'vocabulary', 'grammar'] as Skill[]) {
            buckets.set(skill, levelRecords.filter((record) => record.skill === skill))
        }

        const selected = new Map<string, ContentRecord>()
        for (const skill of buckets.keys()) {
            const first = buckets.get(skill)?.[0]
            if (first) selected.set(first.file, first)
        }

        let cursor = 0
        while (selected.size < 10 && levelRecords[cursor]) {
            selected.set(levelRecords[cursor].file, levelRecords[cursor])
            cursor += Math.max(1, Math.floor(levelRecords.length / 10))
        }

        for (const record of [...selected.values()].slice(0, 10)) {
            samples.push({
                level,
                skill: record.skill,
                id: record.id,
                title: record.title,
                file: record.file,
                status: 'pending_human_review',
                reviewerRole: record.skill === 'vocabulary' || record.skill === 'grammar'
                    ? 'Content QA / Linguistic Reviewer'
                    : 'German Academic Lead',
                checklist: [
                    'CEFR level fit',
                    'German naturalness',
                    'Vietnamese support clarity',
                    'Answer/evidence fairness',
                    'Learner difficulty estimate',
                ],
            })
        }
    }
    return samples
}

function buildTranscriptParity(records: ContentRecord[]) {
    const listening = records.filter((record) => record.skill === 'listening')
    const items = listening.map((record) => {
        const sourceScript = String(record.data.metadata?.source_script || '')
        const sourcePath = sourceScript ? path.join(ROOT, sourceScript) : ''
        const sourceExists = Boolean(sourcePath && fs.existsSync(sourcePath))
        const transcript = record.data.transcript || {}
        return {
            level: record.level,
            id: record.id,
            file: record.file,
            sourceScript,
            sourceExists,
            transcriptStatus: transcript.status || 'missing',
            transcriptSource: transcript.source || 'missing',
            parityStatus: sourceExists ? 'source_available_for_replacement' : 'blocked_missing_source_script',
        }
    })

    return {
        totalListening: listening.length,
        sourceReadyCount: items.filter((item) => item.sourceExists).length,
        reconstructedCount: items.filter((item) => item.transcriptSource === 'reconstructed_full_script').length,
        blockedCount: items.filter((item) => !item.sourceExists).length,
        items,
    }
}

function buildLearningOutcomeMap(records: ContentRecord[]) {
    const outcomes: Array<Record<string, unknown>> = []
    for (const record of records) {
        for (const item of getLearningOutcomes(record)) {
            outcomes.push({
                ...item,
                ownerFile: record.file,
                ownerId: record.id,
                ownerTitle: record.title,
            })
        }
    }

    const byLevelSkill: Record<string, number> = {}
    for (const outcome of outcomes) {
        const key = `${outcome.cefrLevel}:${outcome.skill}`
        byLevelSkill[key] = (byLevelSkill[key] || 0) + 1
    }

    const nextStepRules = LEVELS.flatMap((level) => [
        {
            level,
            when: 'learner_completed_vocabulary_and_grammar',
            recommendSkills: ['reading', 'listening'],
            rationale: 'Move from recognition and form control into input comprehension.',
        },
        {
            level,
            when: 'learner_completed_reading_and_listening',
            recommendSkills: ['writing', 'speaking'],
            rationale: 'Move from comprehension into productive output.',
        },
        {
            level,
            when: 'learner_struggles_with_output',
            recommendSkills: ['grammar', 'vocabulary'],
            rationale: 'Rebuild language resources before another production attempt.',
        },
    ])

    return {
        generatedAt: GENERATED_AT,
        outcomes,
        byLevelSkill,
        nextStepRules,
    }
}

function buildPilotPack(samples: Array<Record<string, unknown>>) {
    return {
        generatedAt: GENERATED_AT,
        participantTarget: '5-10 Vietnamese German learners',
        sessions: [
            {
                name: 'A1/A2 beginner comprehension',
                levels: ['A1', 'A2'],
                tasks: samples.filter((sample) => ['A1', 'A2'].includes(String(sample.level))).slice(0, 12),
            },
            {
                name: 'B1/B2 independent learner flow',
                levels: ['B1', 'B2'],
                tasks: samples.filter((sample) => ['B1', 'B2'].includes(String(sample.level))).slice(0, 12),
            },
            {
                name: 'C1/C2 advanced academic fit',
                levels: ['C1', 'C2'],
                tasks: samples.filter((sample) => ['C1', 'C2'].includes(String(sample.level))).slice(0, 12),
            },
        ],
        surveyQuestions: [
            'De bai co ro khong?',
            'Noi dung qua de, vua, hay qua kho?',
            'Giai thich tieng Viet co giup ban hieu vi sao dap an dung khong?',
            'Ban co biet nen hoc tiep bai nao sau bai nay khong?',
            'Co cau nao tieng Duc nghe/nhin khong tu nhien khong?',
        ],
        successCriteria: [
            '80% learners rate task clarity as clear or very clear.',
            '70% learners rate difficulty as just right for their level.',
            'No release-blocking German correctness issue in pilot feedback.',
            'At least 5 concrete improvement notes are triaged into content backlog.',
        ],
    }
}

function getLearningOutcomes(record: ContentRecord) {
    if (record.skill === 'grammar' && Array.isArray(record.data.topics)) {
        return record.data.topics.flatMap((topic: any) => Array.isArray(topic.learningOutcomes) ? topic.learningOutcomes : [])
    }
    if (record.skill === 'course' && Array.isArray(record.data.modules)) {
        return [
            ...(Array.isArray(record.data.learningOutcomes) ? record.data.learningOutcomes : []),
            ...record.data.modules.flatMap((module: any) => Array.isArray(module.learningOutcomes) ? module.learningOutcomes : []),
        ]
    }
    return Array.isArray(record.data.learningOutcomes) ? record.data.learningOutcomes : []
}

function renderSpotCheckMarkdown(samples: Array<Record<string, unknown>>) {
    const lines = [
        '# Human Academic Spot-Check Samples',
        '',
        `Generated: ${GENERATED_AT}`,
        '',
        'Status: pending human review. The samples are deterministic and cover 10 files per CEFR level where available.',
        '',
        '| Level | Skill | ID | File | Reviewer | Status |',
        '| --- | --- | --- | --- | --- | --- |',
    ]
    for (const sample of samples) {
        lines.push(`| ${sample.level} | ${sample.skill} | ${sample.id} | \`${sample.file}\` | ${sample.reviewerRole} | ${sample.status} |`)
    }
    lines.push('', '## Required Reviewer Notes', '', '- CEFR level fit.', '- German naturalness.', '- Vietnamese support clarity.', '- Answer/evidence fairness.', '- Learner difficulty estimate.')
    return lines.join('\n')
}

function renderTranscriptParityMarkdown(report: ReturnType<typeof buildTranscriptParity>) {
    const lines = [
        '# Transcript Source Parity Report',
        '',
        `Generated: ${GENERATED_AT}`,
        '',
        `- Listening files: ${report.totalListening}`,
        `- Source scripts available: ${report.sourceReadyCount}`,
        `- Reconstructed transcripts: ${report.reconstructedCount}`,
        `- Blocked by missing source script: ${report.blockedCount}`,
        '',
        '## Decision',
        '',
        'Original studio/source scripts are required before reconstructed transcripts can be replaced. Until then, current transcripts remain release-candidate reconstructed scripts, not production audio-parity transcripts.',
        '',
        '| Level | ID | Source status | Source script |',
        '| --- | --- | --- | --- |',
    ]
    for (const item of report.items.slice(0, 80)) {
        lines.push(`| ${item.level} | ${item.id} | ${item.parityStatus} | \`${item.sourceScript || 'missing'}\` |`)
    }
    if (report.items.length > 80) lines.push(`| ... | ... | ${report.items.length - 80} more rows omitted in markdown | ... |`)
    return lines.join('\n')
}

function renderLearningOutcomeMarkdown(map: ReturnType<typeof buildLearningOutcomeMap>) {
    const lines = [
        '# Learning Outcome Map Report',
        '',
        `Generated: ${GENERATED_AT}`,
        '',
        `- Outcomes: ${map.outcomes.length}`,
        `- Routing rules: ${map.nextStepRules.length}`,
        '',
        '| Level:Skill | Outcomes |',
        '| --- | ---: |',
    ]
    for (const [key, count] of Object.entries(map.byLevelSkill).sort()) {
        lines.push(`| ${key} | ${count} |`)
    }
    return lines.join('\n')
}

function renderPilotPackMarkdown(pack: ReturnType<typeof buildPilotPack>) {
    const lines = [
        '# Vietnamese Learner Pilot Test Pack',
        '',
        `Generated: ${GENERATED_AT}`,
        '',
        `Participant target: ${pack.participantTarget}`,
        '',
        '## Sessions',
        '',
    ]
    for (const session of pack.sessions) {
        lines.push(`### ${session.name}`, '', `Levels: ${session.levels.join(', ')}`, '', '| Level | Skill | ID | File |', '| --- | --- | --- | --- |')
        for (const task of session.tasks) {
            lines.push(`| ${task.level} | ${task.skill} | ${task.id} | \`${task.file}\` |`)
        }
        lines.push('')
    }
    lines.push('## Survey Questions', '', ...pack.surveyQuestions.map((item, index) => `${index + 1}. ${item}`), '', '## Success Criteria', '', ...pack.successCriteria.map((item) => `- ${item}`))
    return lines.join('\n')
}

function walk(dir: string): string[] {
    const files: string[] = []
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const fullPath = path.join(dir, entry.name)
        if (entry.isDirectory()) files.push(...walk(fullPath))
        else if (entry.name.endsWith('.json') && !entry.name.endsWith('.qa.json')) files.push(fullPath)
    }
    return files
}

function inferSkill(file: string): Skill {
    const normalized = normalizePath(file)
    if (normalized.endsWith('/course.json')) return 'course'
    for (const skill of SKILLS) {
        if (normalized.includes(`/${skill}/`)) return skill
    }
    return 'unknown'
}

function inferLevel(file: string, data: Record<string, any>): CefrLevel {
    const candidate = data.level || data.cefrLevel || data.course?.cefrLevel || data.cefrAudit?.targetLevel
    if (typeof candidate === 'string' && LEVELS.includes(candidate.toUpperCase() as CefrLevel)) return candidate.toUpperCase() as CefrLevel
    const match = normalizePath(file).match(/\/(a1|a2|b1|b2|c1|c2)\//i)
    return match ? match[1].toUpperCase() as CefrLevel : 'A1'
}

function getContentId(file: string, data: Record<string, any>) {
    return String(data.id || data.topicSlug || data.theme?.slug || data.course?.slug || path.basename(file, '.json'))
}

function getTitle(file: string, data: Record<string, any>) {
    return String(data.topic || data.titleDe || data.title || data.teil_name || data.teilName || data.theme?.name || data.course?.titleDe || path.basename(file, '.json'))
}

function writeJson(file: string, value: unknown) {
    fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`, 'utf8')
}

function writeMarkdown(file: string, value: string) {
    fs.writeFileSync(file, `${value.trim()}\n`, 'utf8')
}

function normalizePath(value: string) {
    return value.replace(/\\/g, '/')
}

main()
