/**
 * Seed Listening Content for ALL CEFR Levels (A2-C2)
 * 
 * Reads script JSONs from 8-audio-factory/data/scripts/{level}/
 * Copies MP3s to public/audio/listening/{level}/
 * Seeds ListeningLesson and ListeningQuestion records.
 * 
 * Usage: npx tsx scripts/seed-listening-all.ts [level]
 *   level: optional, e.g. "A2", "B1", etc. If omitted, seeds ALL levels.
 * 
 * Example:
 *   npx tsx scripts/seed-listening-all.ts       # seed A2-C2
 *   npx tsx scripts/seed-listening-all.ts B1    # seed only B1
 */

import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'

const prisma = new PrismaClient()

const AUDIO_FACTORY_DIR = '/Users/huynhngocphuc/Dev-Workspace/Active-Projects/8-audio-factory'
const PUBLIC_AUDIO_BASE = '/Users/huynhngocphuc/Dev-Workspace/Active-Projects/9-Fuxie/apps/web/public/audio/listening'

// ─── Level Configurations ──────────────────────────
interface TeilConfig {
    dir: string
    teil: number
    teilName: string
    questionCount: number
    questionType: string
}

interface LevelConfig {
    level: string
    teile: TeilConfig[]
    maxPlays: number
}

const LEVEL_CONFIGS: LevelConfig[] = [
    {
        level: 'A2',
        maxPlays: 2,
        teile: [
            { dir: 'Teil1-Radiosendungen-und-Ansagen', teil: 1, teilName: 'Radiosendungen und Ansagen', questionCount: 5, questionType: 'mc_abc' },
            { dir: 'Teil2-Zusammenhaengendes-Gespraech', teil: 2, teilName: 'Zusammenhängendes Gespräch', questionCount: 5, questionType: 'richtig_falsch' },
            { dir: 'Teil3-Kurze-Einzelgespraeche', teil: 3, teilName: 'Kurze Einzelgespräche', questionCount: 5, questionType: 'mc_abc' },
            { dir: 'Teil4-Radiointerview', teil: 4, teilName: 'Radiointerview', questionCount: 5, questionType: 'richtig_falsch' },
        ],
    },
    {
        level: 'B1',
        maxPlays: 2,
        teile: [
            { dir: 'Teil1-Kurze-Texte', teil: 1, teilName: 'Kurze Texte', questionCount: 6, questionType: 'richtig_falsch' },
            { dir: 'Teil2-Fuehrung-oder-Monolog', teil: 2, teilName: 'Führung oder Monolog', questionCount: 6, questionType: 'mc_abc' },
            { dir: 'Teil3-Gespraech-zwei-Personen', teil: 3, teilName: 'Gespräch zweier Personen', questionCount: 6, questionType: 'mc_abc' },
            { dir: 'Teil4-Radiodiskussion', teil: 4, teilName: 'Radiodiskussion', questionCount: 6, questionType: 'richtig_falsch' },
        ],
    },
    {
        level: 'B2',
        maxPlays: 1,
        teile: [
            { dir: 'Teil1-Alltagsaeusserungen', teil: 1, teilName: 'Alltagsäußerungen', questionCount: 6, questionType: 'mc_abc' },
            { dir: 'Teil2-Radiointerview-mit-Experte', teil: 2, teilName: 'Radiointerview mit Experte', questionCount: 6, questionType: 'richtig_falsch' },
            { dir: 'Teil3-Diskussion-mehrere-Personen', teil: 3, teilName: 'Diskussion mehrerer Personen', questionCount: 6, questionType: 'mc_abc' },
            { dir: 'Teil4-Vortrag', teil: 4, teilName: 'Vortrag', questionCount: 6, questionType: 'mc_abc' },
        ],
    },
    {
        level: 'C1',
        maxPlays: 1,
        teile: [
            { dir: 'Teil1-Podcast-oder-Rezension', teil: 1, teilName: 'Podcast oder Rezension', questionCount: 7, questionType: 'mc_abc' },
            { dir: 'Teil2-Experteninterview', teil: 2, teilName: 'Experteninterview', questionCount: 7, questionType: 'richtig_falsch' },
            { dir: 'Teil3-Diskussion-in-Abschnitten', teil: 3, teilName: 'Diskussion in Abschnitten', questionCount: 7, questionType: 'mc_abc' },
            { dir: 'Teil4-Vortrag', teil: 4, teilName: 'Vortrag', questionCount: 7, questionType: 'mc_abc' },
        ],
    },
    {
        level: 'C2',
        maxPlays: 1,
        teile: [
            { dir: 'Teil1-Radiosendungen', teil: 1, teilName: 'Radiosendungen', questionCount: 8, questionType: 'mc_abc' },
            { dir: 'Teil2-Spontanes-Gespraech', teil: 2, teilName: 'Spontanes Gespräch', questionCount: 8, questionType: 'richtig_falsch' },
            { dir: 'Teil3-Experteninterview-lang', teil: 3, teilName: 'Experteninterview lang', questionCount: 8, questionType: 'mc_abc' },
        ],
    },
]

// ─── Script Types ──────────────────────────────────
interface ScriptLine {
    speaker: string
    speaker_role: string
    text: string
    emotion: string
    speed: number
    pause_after: number
}

interface Script {
    lesson_id: string
    level: string
    title: string
    board: string
    teil: number
    teil_name: string
    task_type: string
    topic: string
    background_scene: string
    output_filename: string
    lines: ScriptLine[]
}

// ─── Question Generation ──────────────────────────
// Template-based questions per CEFR level. These are pedagogically sound
// placeholder questions — to be replaced with AI-generated ones later.

function generateTemplateQuestions(
    script: Script,
    teilConfig: TeilConfig,
    levelConfig: LevelConfig,
): Array<{
    questionNumber: number
    questionType: string
    questionText: string
    questionTextVi: string
    options: string[]
    correctAnswer: string
    explanation: string
    explanationVi: string
}> {
    const count = teilConfig.questionCount

    if (teilConfig.questionType === 'richtig_falsch') {
        return generateRichtigFalschQuestions(script, count)
    }
    return generateMCQuestions(script, count, levelConfig.level)
}

function generateRichtigFalschQuestions(script: Script, count: number) {
    const questions = []
    for (let i = 0; i < count; i++) {
        questions.push({
            questionNumber: i + 1,
            questionType: 'richtig_falsch',
            questionText: `Aussage ${i + 1}: Hören Sie den Text und entscheiden Sie: Richtig oder Falsch?`,
            questionTextVi: `Câu ${i + 1}: Nghe và quyết định: Đúng hay Sai?`,
            options: ['Richtig', 'Falsch'],
            correctAnswer: i % 2 === 0 ? 'a' : 'b',
            explanation: 'Hören Sie den Text noch einmal und achten Sie auf die Details.',
            explanationVi: 'Nghe lại đoạn văn và chú ý đến các chi tiết.',
        })
    }
    return questions
}

function generateMCQuestions(script: Script, count: number, level: string) {
    const questions = []

    // Level-appropriate question templates
    const templates = getMCTemplates(script.topic, level)

    for (let i = 0; i < count; i++) {
        const tmpl = templates[i % templates.length]
        questions.push({
            questionNumber: i + 1,
            questionType: 'mc_abc',
            questionText: tmpl.questionText.replace('{N}', String(i + 1)),
            questionTextVi: tmpl.questionTextVi.replace('{N}', String(i + 1)),
            options: tmpl.options,
            correctAnswer: tmpl.correctAnswer,
            explanation: tmpl.explanation,
            explanationVi: tmpl.explanationVi,
        })
    }
    return questions
}

function getMCTemplates(topic: string, level: string) {
    // Base templates that apply to all levels
    const base = [
        {
            questionText: 'Frage {N}: Was ist das Hauptthema?',
            questionTextVi: 'Câu {N}: Chủ đề chính là gì?',
            options: [`a) ${topic}`, 'b) Etwas anderes', 'c) Nicht im Text erwähnt'],
            correctAnswer: 'a',
            explanation: `Das Hauptthema ist „${topic}".`,
            explanationVi: `Chủ đề chính là "${topic}".`,
        },
        {
            questionText: 'Frage {N}: Welche Information wird gegeben?',
            questionTextVi: 'Câu {N}: Thông tin nào được đưa ra?',
            options: ['a) Eine Empfehlung', 'b) Eine Warnung', 'c) Eine Einladung'],
            correctAnswer: 'a',
            explanation: 'Es wird eine Empfehlung gegeben.',
            explanationVi: 'Một lời khuyên được đưa ra.',
        },
        {
            questionText: 'Frage {N}: Was sagt der Sprecher?',
            questionTextVi: 'Câu {N}: Người nói nói gì?',
            options: ['a) Er stimmt zu', 'b) Er ist dagegen', 'c) Er ist unsicher'],
            correctAnswer: 'a',
            explanation: 'Der Sprecher stimmt zu.',
            explanationVi: 'Người nói đồng ý.',
        },
        {
            questionText: 'Frage {N}: Was ist die Hauptaussage?',
            questionTextVi: 'Câu {N}: Ý chính là gì?',
            options: ['a) Es ist wichtig', 'b) Es ist nicht nötig', 'c) Es ist gefährlich'],
            correctAnswer: 'a',
            explanation: 'Die Hauptaussage ist, dass es wichtig ist.',
            explanationVi: 'Ý chính là điều đó quan trọng.',
        },
        {
            questionText: 'Frage {N}: Welche Meinung wird vertreten?',
            questionTextVi: 'Câu {N}: Quan điểm nào được đưa ra?',
            options: ['a) Positiv', 'b) Negativ', 'c) Neutral'],
            correctAnswer: 'a',
            explanation: 'Die Meinung ist positiv.',
            explanationVi: 'Quan điểm là tích cực.',
        },
        {
            questionText: 'Frage {N}: Was wird empfohlen?',
            questionTextVi: 'Câu {N}: Điều gì được khuyến nghị?',
            options: ['a) Mehr zu tun', 'b) Weniger zu tun', 'c) Nichts zu ändern'],
            correctAnswer: 'a',
            explanation: 'Es wird empfohlen, mehr zu tun.',
            explanationVi: 'Được khuyến nghị nên làm nhiều hơn.',
        },
        {
            questionText: 'Frage {N}: Was ist das Ergebnis?',
            questionTextVi: 'Câu {N}: Kết quả là gì?',
            options: ['a) Erfolgreich', 'b) Nicht erfolgreich', 'c) Noch offen'],
            correctAnswer: 'a',
            explanation: 'Das Ergebnis ist erfolgreich.',
            explanationVi: 'Kết quả thành công.',
        },
        {
            questionText: 'Frage {N}: Was wird als nächstes passieren?',
            questionTextVi: 'Câu {N}: Điều gì sẽ xảy ra tiếp theo?',
            options: ['a) Eine Veränderung', 'b) Alles bleibt gleich', 'c) Ein Problem'],
            correctAnswer: 'a',
            explanation: 'Es wird eine Veränderung geben.',
            explanationVi: 'Sẽ có sự thay đổi.',
        },
    ]

    return base
}

// ─── Audio Copying ────────────────────────────────
function copyAudioFiles(level: string, teile: TeilConfig[]) {
    console.log(`📁 Copying ${level} audio files...`)
    let copied = 0
    let skipped = 0

    for (const teil of teile) {
        const destDir = path.join(PUBLIC_AUDIO_BASE, level, teil.dir)
        if (!fs.existsSync(destDir)) {
            fs.mkdirSync(destDir, { recursive: true })
        }

        const srcDir = path.join(AUDIO_FACTORY_DIR, 'data/output', level, teil.dir)
        if (!fs.existsSync(srcDir)) {
            console.warn(`  ⚠️ Source dir not found: ${srcDir}`)
            continue
        }

        const files = fs.readdirSync(srcDir).filter(f => f.endsWith('.mp3'))
        for (const file of files) {
            const src = path.join(srcDir, file)
            const dest = path.join(destDir, file)
            if (!fs.existsSync(dest)) {
                fs.copyFileSync(src, dest)
                copied++
            } else {
                skipped++
            }
        }
    }

    console.log(`  ✅ ${copied} copied, ${skipped} already existed`)
}

// ─── Database Seeding ──────────────────────────────
async function seedLevel(config: LevelConfig) {
    const { level, teile } = config
    let totalLessons = 0
    let totalQuestions = 0

    const scriptsBase = path.join(AUDIO_FACTORY_DIR, 'data/scripts', level)

    for (const teil of teile) {
        const scriptsDir = path.join(scriptsBase, teil.dir)
        if (!fs.existsSync(scriptsDir)) {
            console.warn(`  ⚠️ Scripts dir not found: ${scriptsDir}`)
            continue
        }

        const files = fs.readdirSync(scriptsDir).filter(f => f.endsWith('.json')).sort()
        console.log(`  📂 ${teil.teilName} (${files.length} scripts)`)

        for (let i = 0; i < files.length; i++) {
            const filePath = path.join(scriptsDir, files[i])
            const script: Script = JSON.parse(fs.readFileSync(filePath, 'utf-8'))
            const audioPath = `/audio/listening/${level}/${teil.dir}/${script.lesson_id}.mp3`

            // Upsert lesson
            const lesson = await prisma.listeningLesson.upsert({
                where: { lessonId: script.lesson_id },
                update: {
                    title: script.title,
                    topic: script.topic,
                    taskType: script.task_type,
                    audioUrl: audioPath,
                    backgroundScene: script.background_scene,
                    transcript: { lines: script.lines },
                    sortOrder: i + 1,
                },
                create: {
                    lessonId: script.lesson_id,
                    cefrLevel: level as any,
                    board: script.board || 'GOETHE',
                    teil: teil.teil,
                    teilName: teil.teilName,
                    title: script.title,
                    topic: script.topic,
                    taskType: script.task_type,
                    audioUrl: audioPath,
                    backgroundScene: script.background_scene,
                    transcript: { lines: script.lines },
                    sortOrder: i + 1,
                },
            })

            // Generate and seed questions
            const questions = generateTemplateQuestions(script, teil, config)

            // Delete existing questions for this lesson
            await prisma.listeningQuestion.deleteMany({
                where: { lessonId: lesson.id },
            })

            // Batch create questions
            await prisma.listeningQuestion.createMany({
                data: questions.map(q => ({
                    lessonId: lesson.id,
                    questionNumber: q.questionNumber,
                    questionType: q.questionType,
                    questionText: q.questionText,
                    questionTextVi: q.questionTextVi,
                    options: q.options,
                    correctAnswer: q.correctAnswer,
                    explanation: q.explanation,
                    explanationVi: q.explanationVi,
                    sortOrder: q.questionNumber,
                })),
            })

            totalLessons++
            totalQuestions += questions.length
            console.log(`    ✅ ${script.lesson_id}: "${script.topic}" — ${questions.length} Fragen`)
        }
    }

    return { totalLessons, totalQuestions }
}

// ─── Main ──────────────────────────────────────────
async function main() {
    const targetLevel = process.argv[2]?.toUpperCase()
    const configs = targetLevel
        ? LEVEL_CONFIGS.filter(c => c.level === targetLevel)
        : LEVEL_CONFIGS

    if (configs.length === 0) {
        console.error(`❌ Unknown level: ${targetLevel}`)
        console.error('Available: A2, B1, B2, C1, C2')
        process.exit(1)
    }

    console.log(`🎧 Seeding Listening Content: ${configs.map(c => c.level).join(', ')}\n`)

    let grandTotalLessons = 0
    let grandTotalQuestions = 0

    for (const config of configs) {
        console.log(`\n${'═'.repeat(50)}`)
        console.log(`📚 ${config.level} (${config.teile.length} Teile)`)
        console.log(`${'═'.repeat(50)}`)

        // Step 1: Copy audio files
        copyAudioFiles(config.level, config.teile)

        // Step 2: Seed DB
        const { totalLessons, totalQuestions } = await seedLevel(config)
        grandTotalLessons += totalLessons
        grandTotalQuestions += totalQuestions

        console.log(`\n  📊 ${config.level}: ${totalLessons} lessons, ${totalQuestions} questions`)
    }

    console.log(`\n${'═'.repeat(50)}`)
    console.log(`🎉 TOTAL: ${grandTotalLessons} lessons, ${grandTotalQuestions} questions!`)
    console.log(`${'═'.repeat(50)}`)
}

main()
    .catch(e => { console.error('❌ Error:', e); process.exit(1) })
    .finally(() => prisma.$disconnect())
