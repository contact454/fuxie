/**
 * Seed A1 Listening Content
 * 
 * Reads all 30 A1 script JSONs from 8-audio-factory/data/scripts/A1/
 * and seeds ListeningLesson records into the database.
 * 
 * Audio files will be referenced from local public/audio/listening/ for now,
 * to be migrated to GCS later.
 * 
 * Usage: npx tsx scripts/seed-listening-a1.ts
 */

import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'

const prisma = new PrismaClient()

const AUDIO_FACTORY_DIR = '/Users/huynhngocphuc/Dev-Workspace/Active-Projects/8-audio-factory'
const SCRIPTS_DIR = path.join(AUDIO_FACTORY_DIR, 'data/scripts/A1')
const OUTPUT_DIR = path.join(AUDIO_FACTORY_DIR, 'data/output/A1')
const PUBLIC_AUDIO_DIR = '/Users/huynhngocphuc/Dev-Workspace/Active-Projects/9-Fuxie/apps/web/public/audio/listening/A1'

// A1 Teil structure
const TEILE = [
    { dir: 'Teil1-Kurze-Alltagsgespraeche', teil: 1, teilName: 'Kurze Alltagsgespräche' },
    { dir: 'Teil2-Durchsagen-und-Ansagen', teil: 2, teilName: 'Durchsagen und Ansagen' },
    { dir: 'Teil3-Telefonansagen', teil: 3, teilName: 'Telefonansagen' },
]

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

/**
 * Generate comprehension questions based on script content and teil type.
 * These are A1-level questions: simple, direct, based on explicit information.
 */
function generateQuestionsForScript(script: Script): Array<{
    questionNumber: number
    questionType: string
    questionText: string
    questionTextVi: string
    options: string[]
    correctAnswer: string
    explanation: string
    explanationVi: string
}> {
    // Extract dialogue lines (non-narrator)
    const dialogueLines = script.lines.filter(l => l.speaker_role === 'dialogue_speaker')

    // For A1, we create 6 questions per lesson for Teil 1 (conversations)
    // and 5 questions for Teil 2 & 3 (announcements, phone messages)

    // Since actual question content needs to match the German text,
    // we generate template questions that match common A1 listening patterns

    const questions: Array<{
        questionNumber: number
        questionType: string
        questionText: string
        questionTextVi: string
        options: string[]
        correctAnswer: string
        explanation: string
        explanationVi: string
    }> = []

    if (script.teil === 1) {
        // Teil 1: Short conversations — MC a/b/c
        // Goethe A1 Hören Teil 1: 6 short conversations, 1 question each
        const conversationTopics = getConversationQuestions(script)
        for (let i = 0; i < Math.min(conversationTopics.length, 6); i++) {
            questions.push({
                questionNumber: i + 1,
                ...conversationTopics[i],
            })
        }
    } else if (script.teil === 2) {
        // Teil 2: Announcements — Richtig/Falsch  
        const announcementQuestions = getAnnouncementQuestions(script)
        for (let i = 0; i < Math.min(announcementQuestions.length, 5); i++) {
            questions.push({
                questionNumber: i + 1,
                ...announcementQuestions[i],
            })
        }
    } else if (script.teil === 3) {
        // Teil 3: Phone messages — MC a/b/c
        const phoneQuestions = getPhoneMessageQuestions(script)
        for (let i = 0; i < Math.min(phoneQuestions.length, 5); i++) {
            questions.push({
                questionNumber: i + 1,
                ...phoneQuestions[i],
            })
        }
    }

    return questions
}

function getConversationQuestions(script: Script) {
    // Parse conversations — each starts after "Gespräch X." narrator line
    const conversations: ScriptLine[][] = []
    let currentConv: ScriptLine[] = []

    for (const line of script.lines) {
        if (line.speaker === 'Narrator' && line.text.match(/Gespräch \d/)) {
            if (currentConv.length > 0) conversations.push(currentConv)
            currentConv = []
        } else if (line.speaker_role === 'dialogue_speaker') {
            currentConv.push(line)
        }
    }
    if (currentConv.length > 0) conversations.push(currentConv)

    const questions: any[] = []

    for (let i = 0; i < conversations.length; i++) {
        const conv = conversations[i]
        if (conv.length < 2) continue

        const allText = conv.map(l => l.text).join(' ')

        // Generate a question about the main information in the conversation
        const q = generateQuestionFromText(allText, i, script.topic)
        if (q) questions.push(q)
    }

    return questions
}

function getAnnouncementQuestions(script: Script) {
    // Teil 2: Announcements are Richtig/Falsch
    const dialogues = script.lines.filter(l => l.speaker_role === 'dialogue_speaker')
    const questions: any[] = []

    // Split into segments by Narrator markers
    const segments: string[] = []
    let currentSegment = ''
    for (const line of script.lines) {
        if (line.speaker === 'Narrator' && (line.text.includes('Durchsage') || line.text.includes('Ansage') || line.text.includes('Text'))) {
            if (currentSegment) segments.push(currentSegment)
            currentSegment = ''
        } else if (line.speaker_role === 'dialogue_speaker') {
            currentSegment += line.text + ' '
        }
    }
    if (currentSegment) segments.push(currentSegment)

    for (let i = 0; i < Math.min(segments.length, 5); i++) {
        questions.push({
            questionType: 'richtig_falsch',
            questionText: `Aussage ${i + 1}: Hören Sie den Text und entscheiden Sie: Richtig oder Falsch?`,
            questionTextVi: `Câu ${i + 1}: Nghe đoạn văn và quyết định: Đúng hay Sai?`,
            options: ['Richtig', 'Falsch'],
            correctAnswer: 'a', // Will need manual correction
            explanation: 'Basierend auf den Informationen im Text.',
            explanationVi: 'Dựa trên thông tin trong đoạn văn.',
        })
    }

    return questions
}

function getPhoneMessageQuestions(script: Script) {
    // Teil 3: Phone messages — MC a/b/c
    const dialogues = script.lines.filter(l => l.speaker_role === 'dialogue_speaker')
    const questions: any[] = []

    // Split into messages
    const messages: string[] = []
    let currentMsg = ''
    for (const line of script.lines) {
        if (line.speaker === 'Narrator' && (line.text.includes('Nachricht') || line.text.includes('Anruf') || line.text.includes('Hören'))) {
            if (currentMsg) messages.push(currentMsg)
            currentMsg = ''
        } else if (line.speaker_role === 'dialogue_speaker') {
            currentMsg += line.text + ' '
        }
    }
    if (currentMsg) messages.push(currentMsg)

    for (let i = 0; i < Math.min(messages.length, 5); i++) {
        const q = generateQuestionFromText(messages[i], i, script.topic)
        if (q) questions.push(q)
    }

    return questions
}

function generateQuestionFromText(text: string, index: number, topic: string): any {
    // Simple pattern-based question generation for A1
    // These are placeholder questions — for production, use Gemini AI

    const questionTemplates = [
        {
            questionType: 'mc_abc',
            questionText: `Was ist das Thema von Gespräch ${index + 1}?`,
            questionTextVi: `Chủ đề của đoạn hội thoại ${index + 1} là gì?`,
            options: [`a) ${topic}`, `b) Einkaufen`, `c) Sport`],
            correctAnswer: 'a',
            explanation: `Das Gespräch handelt von "${topic}".`,
            explanationVi: `Đoạn hội thoại nói về "${topic}".`,
        },
        {
            questionType: 'mc_abc',
            questionText: `Wer spricht in diesem Gespräch?`,
            questionTextVi: `Ai đang nói trong đoạn hội thoại này?`,
            options: ['a) Zwei Freunde', 'b) Ein Arzt und ein Patient', 'c) Ein Lehrer und ein Schüler'],
            correctAnswer: 'a',
            explanation: 'Im Gespräch sprechen zwei Personen miteinander.',
            explanationVi: 'Trong đoạn hội thoại, hai người đang nói chuyện với nhau.',
        },
        {
            questionType: 'mc_abc',
            questionText: `Was fragt die Person?`,
            questionTextVi: `Người đó hỏi gì?`,
            options: ['a) Nach dem Weg', 'b) Nach dem Namen', 'c) Nach der Uhrzeit'],
            correctAnswer: 'b',
            explanation: 'Die Person fragt nach dem Namen.',
            explanationVi: 'Người đó hỏi tên.',
        },
        {
            questionType: 'mc_abc',
            questionText: `Wo findet das Gespräch statt?`,
            questionTextVi: `Đoạn hội thoại diễn ra ở đâu?`,
            options: ['a) Im Büro', 'b) Im Café', 'c) Im Supermarkt'],
            correctAnswer: 'b',
            explanation: 'Das Gespräch findet im Café statt.',
            explanationVi: 'Đoạn hội thoại diễn ra ở quán cà phê.',
        },
        {
            questionType: 'mc_abc',
            questionText: `Was antwortet die Person?`,
            questionTextVi: `Người đó trả lời gì?`,
            options: ['a) Ja, gerne', 'b) Nein, danke', 'c) Vielleicht morgen'],
            correctAnswer: 'a',
            explanation: 'Die Person antwortet positiv.',
            explanationVi: 'Người đó trả lời tích cực.',
        },
        {
            questionType: 'mc_abc',
            questionText: `Wann passiert das?`,
            questionTextVi: `Điều này xảy ra khi nào?`,
            options: ['a) Am Morgen', 'b) Am Nachmittag', 'c) Am Abend'],
            correctAnswer: 'a',
            explanation: 'Das Ereignis findet am Morgen statt.',
            explanationVi: 'Sự kiện diễn ra vào buổi sáng.',
        },
    ]

    return questionTemplates[index % questionTemplates.length]
}

async function copyAudioFiles() {
    console.log('📁 Copying A1 audio files to public/audio/listening/A1/...')

    for (const teil of TEILE) {
        const destDir = path.join(PUBLIC_AUDIO_DIR, teil.dir)
        if (!fs.existsSync(destDir)) {
            fs.mkdirSync(destDir, { recursive: true })
        }

        const srcDir = path.join(OUTPUT_DIR, teil.dir)
        if (!fs.existsSync(srcDir)) {
            console.warn(`⚠️  Source dir not found: ${srcDir}`)
            continue
        }

        const files = fs.readdirSync(srcDir).filter(f => f.endsWith('.mp3'))
        for (const file of files) {
            const src = path.join(srcDir, file)
            const dest = path.join(destDir, file)
            if (!fs.existsSync(dest)) {
                fs.copyFileSync(src, dest)
                console.log(`  ✅ Copied ${file}`)
            } else {
                console.log(`  ⏭️  Already exists: ${file}`)
            }
        }
    }
}

async function seedListeningLessons() {
    console.log('🎧 Seeding A1 Listening Lessons...\n')

    let totalLessons = 0
    let totalQuestions = 0

    for (const teil of TEILE) {
        const scriptsDir = path.join(SCRIPTS_DIR, teil.dir)
        if (!fs.existsSync(scriptsDir)) {
            console.warn(`⚠️  Scripts dir not found: ${scriptsDir}`)
            continue
        }

        const files = fs.readdirSync(scriptsDir).filter(f => f.endsWith('.json')).sort()
        console.log(`\n📂 ${teil.teilName} (${files.length} scripts)`)

        for (let i = 0; i < files.length; i++) {
            const filePath = path.join(scriptsDir, files[i])
            const script: Script = JSON.parse(fs.readFileSync(filePath, 'utf-8'))

            const audioPath = `/audio/listening/A1/${teil.dir}/${script.lesson_id}.mp3`

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
                    cefrLevel: 'A1',
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
            const questions = generateQuestionsForScript(script)

            // Delete existing questions for this lesson
            await prisma.listeningQuestion.deleteMany({
                where: { lessonId: lesson.id },
            })

            for (const q of questions) {
                await prisma.listeningQuestion.create({
                    data: {
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
                    },
                })
            }

            totalLessons++
            totalQuestions += questions.length
            console.log(`  ✅ ${script.lesson_id}: "${script.topic}" — ${questions.length} Fragen`)
        }
    }

    console.log(`\n🎉 Seeded ${totalLessons} lessons with ${totalQuestions} questions!`)
}

async function main() {
    try {
        // Step 1: Copy audio files
        await copyAudioFiles()

        // Step 2: Seed lessons + questions
        await seedListeningLessons()

    } catch (error) {
        console.error('❌ Error:', error)
        process.exit(1)
    } finally {
        await prisma.$disconnect()
    }
}

main()
