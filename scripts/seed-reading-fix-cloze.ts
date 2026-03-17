/**
 * 🦊 Fix: seed cloze-type reading questions for C1/C2 exercises
 * that use cloze/sentence_cloze/section_cloze instead of questions[]
 */
import { PrismaClient } from '@prisma/client'
import { readdirSync, readFileSync } from 'fs'
import path from 'path'

const prisma = new PrismaClient()
const CONTENT_BASE = path.join(__dirname, '..', 'content')

interface ClozeGap {
    pos: number
    options?: Record<string, string>
    answer: string
    explanation?: Record<string, unknown>
}

function extractClozeQuestions(data: any): Array<{
    questionNumber: number
    questionType: string
    statement: string
    options: any
    correctAnswer: string
    points: number
    explanation: any
}> {
    const questions: any[] = []

    // Type 1: cloze.gaps[] — C1 Teil 1 Lückentext
    if (data.cloze?.gaps) {
        const gaps = data.cloze.gaps as ClozeGap[]
        gaps.forEach((gap, idx) => {
            questions.push({
                questionNumber: idx + 1,
                questionType: 'lueckentext',
                statement: `Lücke ${gap.pos}: Wählen Sie das richtige Wort.`,
                options: gap.options || null,
                correctAnswer: gap.answer,
                points: 1,
                explanation: gap.explanation || null,
            })
        })
    }

    // Type 2: sentence_cloze.sentences[] — C1 Teil 3 Satzlücken
    if (data.sentence_cloze) {
        const sc = data.sentence_cloze
        const answers = sc.answers || {}
        const sentences = sc.sentences || []
        const distractors = sc.distractors || []
        // Each "gap" in the text corresponds to matching a sentence
        Object.entries(answers).forEach(([gapNum, sentId], idx) => {
            const sentence = sentences.find((s: any) => s.id === sentId)
            questions.push({
                questionNumber: idx + 1,
                questionType: 'satzluecken',
                statement: sentence?.text || `Lücke ${gapNum}`,
                options: sentences.map((s: any) => s.id) as any,
                correctAnswer: String(sentId),
                points: 1,
                explanation: null,
            })
        })
    }

    // Type 3: section_cloze.sections[] — C2 Teil 2 Lückentext
    if (data.section_cloze) {
        const sc = data.section_cloze
        const answers = sc.answers || {}
        const sections = sc.sections || []
        Object.entries(answers).forEach(([gapNum, answer], idx) => {
            questions.push({
                questionNumber: idx + 1,
                questionType: 'lueckentext',
                statement: `Abschnitt ${gapNum}: Ergänzen Sie den fehlenden Teil.`,
                options: null,
                correctAnswer: String(answer),
                points: 1,
                explanation: null,
            })
        })
    }

    return questions
}

async function main() {
    console.log('🦊 Fix: Seed cloze-type questions\n')

    let totalFixed = 0
    let totalQuestionsAdded = 0

    for (const level of ['c1', 'c2']) {
        const readingDir = path.join(CONTENT_BASE, level, 'reading')
        const files = readdirSync(readingDir)
            .filter(f => f.endsWith('.json') && !f.endsWith('.qa.json'))
            .sort()

        for (const file of files) {
            const filePath = path.join(readingDir, file)
            const data = JSON.parse(readFileSync(filePath, 'utf8'))

            // Skip if has standard questions
            if (data.questions && data.questions.length > 0) continue

            // Check if has cloze data
            const clozeQuestions = extractClozeQuestions(data)
            if (clozeQuestions.length === 0) continue

            // Find the exercise in DB
            const exercise = await prisma.readingExercise.findUnique({
                where: { exerciseId: data.id },
                include: { questions: true },
            })
            if (!exercise) {
                console.log(`  ⚠️  ${data.id} not found in DB`)
                continue
            }
            if (exercise.questions.length > 0) {
                continue // Already has questions
            }

            // Add questions
            await prisma.readingQuestion.createMany({
                data: clozeQuestions.map(q => ({
                    exerciseId: exercise.id,
                    ...q,
                    linkedText: null,
                    sortOrder: q.questionNumber - 1,
                })),
            })

            console.log(`  ✅ ${data.id}: +${clozeQuestions.length} questions`)
            totalFixed++
            totalQuestionsAdded += clozeQuestions.length
        }
    }

    console.log(`\n📊 Fixed ${totalFixed} exercises, added ${totalQuestionsAdded} questions`)
    await prisma.$disconnect()
}

main().catch(async (err) => {
    console.error('💥 Error:', err)
    await prisma.$disconnect()
    process.exit(1)
})
