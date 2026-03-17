/**
 * Generate AI-Powered Listening Questions using Gemini
 * 
 * Reads transcript data from DB for each listening lesson, sends to Gemini API
 * with CEFR-level-appropriate prompts, and updates questions in the database.
 * 
 * Usage:
 *   npx tsx scripts/gen-listening-questions.ts           # all levels
 *   npx tsx scripts/gen-listening-questions.ts A1         # specific level
 *   npx tsx scripts/gen-listening-questions.ts A1 T1      # specific level + teil
 *   npx tsx scripts/gen-listening-questions.ts --dry-run  # preview without saving
 * 
 * Rate limiting: ~15 RPM for Gemini free tier. Script has built-in delays.
 */

import { PrismaClient } from '@prisma/client'
import { GoogleGenerativeAI } from '@google/generative-ai'
import * as dotenv from 'dotenv'
import * as path from 'path'

// Load env from project root
dotenv.config({ path: path.resolve(__dirname, '../.env') })

const prisma = new PrismaClient()
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

// ─── Configuration ─────────────────────────────────
const QUESTIONS_PER_LESSON: Record<string, number> = {
    A1: 6, A2: 5, B1: 6, B2: 6, C1: 7, C2: 8,
}

const QUESTION_TYPES_BY_TEIL: Record<string, Record<number, string>> = {
    A1: { 1: 'mc_abc', 2: 'richtig_falsch', 3: 'mc_abc' },
    A2: { 1: 'mc_abc', 2: 'richtig_falsch', 3: 'mc_abc', 4: 'richtig_falsch' },
    B1: { 1: 'richtig_falsch', 2: 'mc_abc', 3: 'mc_abc', 4: 'richtig_falsch' },
    B2: { 1: 'mc_abc', 2: 'richtig_falsch', 3: 'mc_abc', 4: 'mc_abc' },
    C1: { 1: 'mc_abc', 2: 'richtig_falsch', 3: 'mc_abc', 4: 'mc_abc' },
    C2: { 1: 'mc_abc', 2: 'richtig_falsch', 3: 'mc_abc' },
}

// ─── Prompt Templates ──────────────────────────────
function buildPrompt(
    transcript: string,
    level: string,
    teil: number,
    teilName: string,
    topic: string,
    questionType: string,
    questionCount: number,
): string {
    const isRichtigFalsch = questionType === 'richtig_falsch'

    const levelInstructions: Record<string, string> = {
        A1: `Niveau A1 (Anfänger): Fragen müssen SEHR einfach sein. Nur direkte Informationen aus dem Text. Kurze, klare Sätze. Grundwortschatz (ca. 500 Wörter). Themen: Alltag, Begrüßung, Einkaufen, Familie.`,
        A2: `Niveau A2 (Grundstufe): Einfache Fragen über alltägliche Situationen. Direkte Informationen und leichte Schlussfolgerungen. Einfache Satzstrukturen.`,
        B1: `Niveau B1 (Mittelstufe): Fragen zu Hauptinformationen und einigen Details. Einfache Meinungen und Absichten erkennen. Standardsprache.`,
        B2: `Niveau B2 (Obere Mittelstufe): Detailfragen, Meinungen, Argumente verstehen. Implizite Informationen erkennen. Komplexere Satzstrukturen.`,
        C1: `Niveau C1 (Fortgeschritten): Komplexe Argumentationen, feine Bedeutungsunterschiede, implizite Informationen, Sprecherabsichten, rhetorische Mittel erkennen.`,
        C2: `Niveau C2 (Annähernd muttersprachlich): Feinste Nuancen, ironische oder mehrdeutige Aussagen, kulturelle Referenzen, abstrakte Argumentationen verstehen.`,
    }

    const formatInstructions = isRichtigFalsch
        ? `
Format: Richtig/Falsch
Für jede Frage:
- Formuliere eine AUSSAGE (keinen Fragesatz), die auf dem Text basiert.
- Manche Aussagen sollen RICHTIG sein (stimmen mit dem Text überein), manche FALSCH (widersprechen dem Text).
- Mische richtig und falsch gleichmäßig (~50/50).
- Die falschen Aussagen müssen plausibel klingen, aber einen klaren Widerspruch zum Text enthalten.
- correctAnswer: "a" für Richtig, "b" für Falsch.
- options: ["Richtig", "Falsch"]`
        : `
Format: Multiple Choice (a/b/c)
Für jede Frage:
- Formuliere eine KLARE Frage.
- Biete 3 Antwortmöglichkeiten (a, b, c).
- Genau EINE Antwort ist korrekt.
- Die falschen Antworten (Distraktoren) müssen plausibel klingen, aber eindeutig falsch sein.
- Variiere, welche Option korrekt ist (nicht immer "a"!).
- correctAnswer: "a", "b", oder "c".
- options: ["a) ...", "b) ...", "c) ..."]`

    return `Du bist ein Prüfungsexperte für das Goethe-Zertifikat ${level}, Modul Hören.

${levelInstructions[level] || levelInstructions.B1}

AUFGABE: Erstelle ${questionCount} Hörverstehen-Fragen für folgendes Transkript.

Teil: ${teil} — ${teilName}
Thema: ${topic}
${formatInstructions}

WICHTIGE REGELN:
1. Jede Frage MUSS sich auf KONKRETEN INHALT des Transkripts beziehen.
2. Die richtige Antwort MUSS eindeutig aus dem Text ableitbar sein.
3. Fragen sollen verschiedene Teile des Transkripts abdecken, nicht nur den Anfang.
4. Schreibe Erklärungen auf Deutsch UND Vietnamesisch.
5. Fragen und Optionen auf DEUTSCH.

TRANSKRIPT:
---
${transcript}
---

Antworte NUR mit einem JSON-Array. Kein Markdown, kein Kommentar. Exaktes Format:
[
  {
    "questionNumber": 1,
    "questionType": "${questionType}",
    "questionText": "...",
    "questionTextVi": "...",
    "options": [...],
    "correctAnswer": "a",
    "explanation": "... (Deutsch)",
    "explanationVi": "... (Vietnamesisch)"
  }
]`
}

// ─── Transcript Extraction ─────────────────────────
function extractTranscriptText(transcript: any): string {
    if (!transcript || !transcript.lines) return ''

    return transcript.lines
        .map((line: any) => {
            const role = line.speaker_role === 'exam_narrator' ? '[Erzähler]' : `[${line.speaker}]`
            return `${role}: ${line.text}`
        })
        .join('\n')
}

// ─── Gemini API Call ───────────────────────────────
interface GeneratedQuestion {
    questionNumber: number
    questionType: string
    questionText: string
    questionTextVi: string
    options: string[]
    correctAnswer: string
    explanation: string
    explanationVi: string
}

const MAX_RETRIES = 2

async function generateQuestions(
    transcript: string,
    level: string,
    teil: number,
    teilName: string,
    topic: string,
    questionType: string,
    questionCount: number,
): Promise<GeneratedQuestion[]> {
    const model = genAI.getGenerativeModel({
        model: 'gemini-2.5-flash',
        generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 8192,
            responseMimeType: 'application/json',
        },
    })

    const prompt = buildPrompt(transcript, level, teil, teilName, topic, questionType, questionCount)

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        try {
            const result = await model.generateContent(prompt)
            const text = result.response.text()
            const questions = JSON.parse(text)

            if (!Array.isArray(questions)) {
                throw new Error('Response is not an array')
            }

            // Validate and sanitize
            return questions.slice(0, questionCount).map((q: any, i: number) => ({
                questionNumber: i + 1,
                questionType: q.questionType || questionType,
                questionText: q.questionText || `Frage ${i + 1}`,
                questionTextVi: q.questionTextVi || '',
                options: Array.isArray(q.options) ? q.options : ['a) ...', 'b) ...', 'c) ...'],
                correctAnswer: q.correctAnswer || 'a',
                explanation: q.explanation || '',
                explanationVi: q.explanationVi || '',
            }))
        } catch (error: any) {
            if (attempt < MAX_RETRIES && !error.message?.includes('429')) {
                console.log(`  ⟳ Retry ${attempt + 1}/${MAX_RETRIES}...`)
                await sleep(5000)
                continue
            }
            throw error
        }
    }
    throw new Error('Max retries exceeded')
}

// ─── Main ──────────────────────────────────────────
async function main() {
    const args = process.argv.slice(2)
    const dryRun = args.includes('--dry-run')
    const targetLevel = args.find(a => /^[ABC]\d$/i.test(a))?.toUpperCase()
    const targetTeil = args.find(a => /^T\d$/i.test(a))
    const targetTeilNum = targetTeil ? parseInt(targetTeil.substring(1)) : undefined

    // Build filter
    const where: any = {}
    if (targetLevel) where.cefrLevel = targetLevel
    if (targetTeilNum) where.teil = targetTeilNum

    const lessons = await prisma.listeningLesson.findMany({
        where,
        orderBy: [{ cefrLevel: 'asc' }, { teil: 'asc' }, { sortOrder: 'asc' }],
        select: {
            id: true,
            lessonId: true,
            cefrLevel: true,
            teil: true,
            teilName: true,
            topic: true,
            transcript: true,
        },
    })

    console.log(`🤖 AI Question Generation (Gemini 2.5 Flash)`)
    console.log(`   Lessons: ${lessons.length}`)
    console.log(`   Filter: ${targetLevel || 'ALL'} ${targetTeil || ''}`)
    console.log(`   Dry run: ${dryRun}`)
    console.log(`${'═'.repeat(60)}\n`)

    let totalGenerated = 0
    let totalErrors = 0
    let currentLevel = ''

    for (let i = 0; i < lessons.length; i++) {
        const lesson = lessons[i]
        const level = lesson.cefrLevel

        // Print level header
        if (level !== currentLevel) {
            currentLevel = level
            console.log(`\n📚 ${level}`)
            console.log(`${'─'.repeat(40)}`)
        }

        const transcript = extractTranscriptText(lesson.transcript)
        if (!transcript) {
            console.log(`  ⏭️ ${lesson.lessonId}: No transcript, skipping`)
            continue
        }

        const questionCount = QUESTIONS_PER_LESSON[level] || 6
        const questionType = QUESTION_TYPES_BY_TEIL[level]?.[lesson.teil] || 'mc_abc'

        try {
            console.log(`  🔄 ${lesson.lessonId}: "${lesson.topic}" (${questionType}, ${questionCount}q)...`)

            const questions = await generateQuestions(
                transcript, level, lesson.teil, lesson.teilName,
                lesson.topic, questionType, questionCount,
            )

            if (dryRun) {
                console.log(`  📋 Preview:`)
                for (const q of questions) {
                    console.log(`     ${q.questionNumber}. ${q.questionText.substring(0, 80)}...`)
                    console.log(`        → ${q.correctAnswer}: ${q.options[q.correctAnswer.charCodeAt(0) - 97] || '?'}`)
                }
            } else {
                // Delete old questions
                await prisma.listeningQuestion.deleteMany({
                    where: { lessonId: lesson.id },
                })

                // Insert new questions
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
            }

            totalGenerated += questions.length
            console.log(`  ✅ ${lesson.lessonId}: ${questions.length} questions generated`)

        } catch (error: any) {
            totalErrors++
            console.error(`  ❌ ${lesson.lessonId}: ${error.message}`)

            // Rate limit handling
            if (error.message?.includes('429') || error.message?.includes('RESOURCE_EXHAUSTED')) {
                console.log('  ⏳ Rate limited — waiting 60s...')
                await sleep(60000)
                i-- // Retry this lesson
                continue
            }
        }

        // Rate limiting: wait between API calls (~4s = ~15 RPM)
        if (i < lessons.length - 1) {
            await sleep(4000)
        }
    }

    console.log(`\n${'═'.repeat(60)}`)
    console.log(`🎉 Done! Generated: ${totalGenerated} questions, Errors: ${totalErrors}`)
    console.log(`${'═'.repeat(60)}`)
}

function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
}

main()
    .catch(e => { console.error('❌ Fatal:', e); process.exit(1) })
    .finally(() => prisma.$disconnect())
