import fs from 'node:fs'
import path from 'node:path'

type Difficulty = 'too_easy' | 'just_right' | 'too_hard'

interface PilotTaskFeedback {
    contentId: string
    skill: string
    level: string
    clarityScore: number
    difficulty: Difficulty
    vietnameseSupportScore: number
    knewNextStep: boolean
    germanNaturalnessIssue: boolean
    notes?: string
}

interface PilotParticipant {
    participantId: string
    declaredLevel: string
    targetLevel?: string
    nativeLanguage: string
    tasks: PilotTaskFeedback[]
}

interface PilotFeedback {
    pilotId: string
    collectedAt: string
    participants: PilotParticipant[]
}

const ROOT = process.cwd()
const inputArg = getArgValue('--input') || path.join('docs', 'content-quality', 'pilot-feedback-template.json')
const outputArg = getArgValue('--output') || path.join('docs', 'content-quality', 'pilot-feedback-analysis.md')

function main() {
    const inputPath = path.resolve(ROOT, inputArg)
    const outputPath = path.resolve(ROOT, outputArg)
    const data = JSON.parse(fs.readFileSync(inputPath, 'utf8')) as PilotFeedback
    const tasks = data.participants.flatMap((participant) =>
        participant.tasks.map((task) => ({ participant, task }))
    )

    const realParticipantCount = data.participants.filter((participant) => !participant.participantId.startsWith('pilot-') || !participant.participantId.includes('001')).length
    const clarityPassRate = percent(tasks.filter(({ task }) => task.clarityScore >= 4).length, tasks.length)
    const difficultyFitRate = percent(tasks.filter(({ task }) => task.difficulty === 'just_right').length, tasks.length)
    const vietnameseSupportPassRate = percent(tasks.filter(({ task }) => task.vietnameseSupportScore >= 4).length, tasks.length)
    const nextStepRate = percent(tasks.filter(({ task }) => task.knewNextStep).length, tasks.length)
    const naturalnessIssueCount = tasks.filter(({ task }) => task.germanNaturalnessIssue).length

    const blockers = [
        ...(data.participants.length < 5 ? [`Need at least 5 participants; found ${data.participants.length}.`] : []),
        ...(realParticipantCount === 0 ? ['Only template/sample pilot data detected; collect real learner feedback before academic signoff.'] : []),
        ...(clarityPassRate < 80 ? [`Clarity pass rate below 80%: ${clarityPassRate}%.`] : []),
        ...(difficultyFitRate < 70 ? [`Difficulty fit rate below 70%: ${difficultyFitRate}%.`] : []),
        ...(naturalnessIssueCount > 0 ? [`German naturalness issues reported: ${naturalnessIssueCount}.`] : []),
    ]

    const lines = [
        '# Pilot Feedback Analysis',
        '',
        `Pilot: ${data.pilotId}`,
        `Collected: ${data.collectedAt}`,
        '',
        '## Summary',
        '',
        `- Participants: ${data.participants.length}`,
        `- Task responses: ${tasks.length}`,
        `- Clarity pass rate: ${clarityPassRate}%`,
        `- Difficulty fit rate: ${difficultyFitRate}%`,
        `- Vietnamese support pass rate: ${vietnameseSupportPassRate}%`,
        `- Learners knew next step: ${nextStepRate}%`,
        `- German naturalness issue count: ${naturalnessIssueCount}`,
        '',
        '## Decision',
        '',
        blockers.length === 0
            ? 'Pilot meets v1 learner-validation criteria.'
            : 'Pilot is not ready for learner-validated signoff.',
        '',
        '## Blockers',
        '',
        ...(blockers.length === 0 ? ['No blockers.'] : blockers.map((blocker) => `- ${blocker}`)),
        '',
        '## Notes For Content Backlog',
        '',
        ...tasks
            .filter(({ task }) => task.notes && !task.notes.toLowerCase().includes('template row'))
            .map(({ participant, task }) => `- ${participant.participantId} / ${task.contentId}: ${task.notes}`),
    ]

    fs.writeFileSync(outputPath, `${lines.join('\n')}\n`, 'utf8')
    console.log(`[pilot-feedback] participants=${data.participants.length}`)
    console.log(`[pilot-feedback] taskResponses=${tasks.length}`)
    console.log(`[pilot-feedback] blockers=${blockers.length}`)
    console.log(`[pilot-feedback] report=${outputPath}`)
}

function percent(count: number, total: number) {
    if (total === 0) return 0
    return Math.round((count / total) * 100)
}

function getArgValue(name: string) {
    const index = process.argv.indexOf(name)
    if (index === -1) return null
    return process.argv[index + 1] || null
}

main()
