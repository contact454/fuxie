/**
 * 🦊 Seed Reading Exercises from Scribe AI JSON into Fuxie DB
 *
 * Reads all reading JSON files from content/{level}/reading/
 * and inserts into ReadingExercise + ReadingQuestion tables.
 *
 * Usage:
 *   npx tsx scripts/seed-reading.ts
 *   npx tsx scripts/seed-reading.ts --level=a1       # single level
 *   npx tsx scripts/seed-reading.ts --dry-run        # count only
 */

import { PrismaClient } from '@prisma/client'
import { readdirSync, readFileSync } from 'fs'
import path from 'path'

const prisma = new PrismaClient()
const CONTENT_BASE = path.join(__dirname, '..', 'content')
const LEVELS = ['a1', 'a2', 'b1', 'b2', 'c1', 'c2'] as const
type CefrLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'

const args = process.argv.slice(2)
const levelFilter = args.find(a => a.startsWith('--level='))?.split('=')[1]?.toLowerCase()
const dryRun = args.includes('--dry-run')
const force = args.includes('--force')

interface ScribeQuestion {
    id: string
    teil: number
    linked_text?: string
    type: string
    statement?: string
    stem?: string
    situation?: string
    question?: string
    sentence?: string
    text?: string
    options?: string[] | Record<string, string>
    answer: string
    points: number
    explanation?: Record<string, unknown>
}

interface ScribeExercise {
    id: string
    level: string
    teil: number
    teil_name: string
    topic: string
    topic_id?: string
    metadata?: Record<string, unknown>
    texts?: unknown[]
    text?: unknown
    blog?: Record<string, unknown>
    article?: Record<string, unknown>
    cloze?: Record<string, unknown>
    anzeigen?: unknown[]
    schilder?: unknown[]
    items?: unknown[]
    options?: unknown[]
    images?: unknown[]
    questions: ScribeQuestion[]
    scoring?: Record<string, unknown>
    qa?: Record<string, unknown>
    // Additional content structures (A2-C2)
    schedule?: Record<string, unknown>
    infotafel?: Record<string, unknown>
    debate?: Record<string, unknown>
    infotext?: Record<string, unknown>
    essay?: Record<string, unknown>
    forum?: Record<string, unknown>
    ratgeber?: Record<string, unknown>
    sentence_cloze?: Record<string, unknown>
    opinion_texts?: Record<string, unknown>
    section_cloze?: Record<string, unknown>
}

async function main() {
    console.log('🦊 Fuxie — Reading Exercise Seeder')
    console.log('═══════════════════════════════════\n')
    if (dryRun) console.log('🏃 DRY RUN — no DB writes\n')

    let totalExercises = 0
    let totalQuestions = 0
    let totalSkipped = 0
    const levels = levelFilter ? [levelFilter] : [...LEVELS]

    for (const level of levels) {
        const readingDir = path.join(CONTENT_BASE, level, 'reading')
        const files = readdirSync(readingDir)
            .filter(f => f.endsWith('.json') && !f.endsWith('.qa.json'))
            .sort()

        const cefrLevel = level.toUpperCase() as CefrLevel

        console.log(`📚 ${cefrLevel} — ${files.length} exercises`)

        for (const file of files) {
            const filePath = path.join(readingDir, file)
            const data: ScribeExercise = JSON.parse(readFileSync(filePath, 'utf8'))

            // Check if already exists
            const existing = await prisma.readingExercise.findUnique({
                where: { exerciseId: data.id },
            })
            if (existing) {
                if (force) {
                    // Cascade: delete responses → questions → exercise
                    const questionIds = await prisma.readingQuestion.findMany({
                        where: { exerciseId: existing.id },
                        select: { id: true },
                    })
                    if (questionIds.length > 0) {
                        await prisma.readingResponse.deleteMany({
                            where: { questionId: { in: questionIds.map(q => q.id) } },
                        })
                    }
                    await prisma.readingQuestion.deleteMany({ where: { exerciseId: existing.id } })
                    // Also delete any reading attempts for this exercise
                    await prisma.readingAttempt.deleteMany({ where: { exerciseId: existing.id } })
                    await prisma.readingExercise.delete({ where: { id: existing.id } })
                } else {
                    totalSkipped++
                    continue
                }
            }

            if (dryRun) {
                totalExercises++
                totalQuestions += data.questions?.length || 0
                continue
            }

            // Build texts JSON — normalize the various content structures
            let textsJson: unknown[]
            if (data.texts && data.texts.length > 0) {
                textsJson = data.texts
            } else if (data.article) {
                textsJson = [data.article]
            } else if (data.blog) {
                textsJson = [data.blog]
            } else if (data.cloze) {
                textsJson = [data.cloze]
            } else if (data.text) {
                textsJson = Array.isArray(data.text) ? data.text : [data.text]
            } else if (data.anzeigen) {
                textsJson = data.anzeigen
            } else if (data.schilder) {
                textsJson = data.schilder
            } else if (data.items) {
                textsJson = data.items
            } else if (data.schedule) {
                textsJson = [data.schedule]
            } else if (data.infotafel) {
                textsJson = [data.infotafel]
            } else if (data.debate) {
                textsJson = [data.debate]
            } else if (data.infotext) {
                textsJson = [data.infotext]
            } else if (data.essay) {
                textsJson = [data.essay]
            } else if (data.forum) {
                textsJson = [data.forum]
            } else if (data.ratgeber) {
                textsJson = [data.ratgeber]
            } else if (data.sentence_cloze) {
                textsJson = [data.sentence_cloze]
            } else if (data.opinion_texts) {
                textsJson = [data.opinion_texts]
            } else if (data.section_cloze) {
                textsJson = [data.section_cloze]
            } else {
                textsJson = []
            }

            // Create exercise + questions in a transaction
            await prisma.$transaction(async (tx) => {
                const exercise = await tx.readingExercise.create({
                    data: {
                        exerciseId: data.id,
                        cefrLevel: cefrLevel,
                        teil: data.teil,
                        teilName: data.teil_name,
                        topic: data.topic,
                        textsJson: textsJson as any,
                        imagesJson: (data.images || []) as any,
                        scoringJson: (data.scoring || null) as any,
                        metadataJson: (data.metadata || null) as any,
                        sortOrder: parseInt(data.topic_id || '0', 10),
                    },
                })

                if (data.questions && data.questions.length > 0) {
                    await tx.readingQuestion.createMany({
                        data: data.questions.map((q, idx) => {
                            // Normalize options: convert {a,b,c,d} object to array
                            let normalizedOptions: string[] | null = null
                            if (q.options) {
                                if (Array.isArray(q.options)) {
                                    normalizedOptions = q.options
                                } else if (typeof q.options === 'object') {
                                    // Convert {a: "...", b: "...", c: "...", d: "..."} to array
                                    normalizedOptions = Object.values(q.options as Record<string, string>)
                                }
                            }

                            return {
                                exerciseId: exercise.id,
                                questionNumber: idx + 1,
                                questionType: q.type,
                                linkedText: q.linked_text || null,
                                statement: q.statement || q.stem || q.situation || q.question || q.sentence || q.text || `Frage ${idx + 1}`,
                                options: (normalizedOptions || null) as any,
                                correctAnswer: q.answer,
                                points: q.points || 1,
                                explanation: (q.explanation || null) as any,
                                sortOrder: idx,
                            }
                        }),
                    })
                }

                totalQuestions += data.questions?.length || 0
            })

            totalExercises++
        }

        console.log(`  ✅ ${cefrLevel} done`)
    }

    console.log('\n═══════════════════════════════════')
    console.log('📊 SUMMARY:')
    console.log(`  ✅ Exercises: ${totalExercises}`)
    console.log(`  📝 Questions: ${totalQuestions}`)
    console.log(`  ⏭️  Skipped:   ${totalSkipped}`)
    console.log('\n🦊 Done!')

    await prisma.$disconnect()
}

main().catch(async (err) => {
    console.error('💥 Fatal error:', err)
    await prisma.$disconnect()
    process.exit(1)
})
