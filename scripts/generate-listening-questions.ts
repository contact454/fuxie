/**
 * Generate AI-powered listening comprehension questions using Gemini.
 * 
 * Reads each A1 script's transcript and generates context-aware questions
 * that match Goethe A1 Hören exam format.
 * 
 * Usage: GEMINI_API_KEY=xxx npx tsx scripts/generate-listening-questions.ts
 */

import { PrismaClient } from '@prisma/client'
import { GoogleGenAI } from '@google/genai'
import * as fs from 'fs'
import * as path from 'path'

const prisma = new PrismaClient()
const SCRIPTS_DIR = '/Users/huynhngocphuc/Dev-Workspace/Active-Projects/8-audio-factory/data/scripts/A1'

const TEILE = [
    { dir: 'Teil1-Kurze-Alltagsgespraeche', teil: 1 },
    { dir: 'Teil2-Durchsagen-und-Ansagen', teil: 2 },
    { dir: 'Teil3-Telefonansagen', teil: 3 },
]

// Question counts per Teil (Goethe A1 format)
const QUESTION_COUNTS: Record<number, number> = { 1: 6, 2: 5, 3: 5 }

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

function buildPrompt(script: any, teil: number): string {
    const dialogueText = script.lines
        .filter((l: any) => l.speaker_role === 'dialogue_speaker')
        .map((l: any) => `${l.speaker}: ${l.text}`)
        .join('\n')

    const questionCount = QUESTION_COUNTS[teil] || 5

    if (teil === 1) {
        return `Du bist ein Prüfungsersteller für die Goethe-Zertifikat A1 Hörprüfung, Teil 1 (Kurze Alltagsgespräche).

Hier ist der Dialogtext eines Hörtextes zum Thema "${script.topic}":

---
${dialogueText}
---

Erstelle ${questionCount} Multiple-Choice-Fragen (a/b/c) auf A1-Niveau.

REGELN:
- Fragen MÜSSEN sich auf EXPLIZIT im Dialog vorkommende Informationen beziehen
- Verwende einfache, klare A1-Sprache
- Jede Frage hat genau 3 Optionen (a, b, c)
- Die richtige Antwort muss eindeutig im Dialog vorkommen
- Falsche Antworten müssen plausibel, aber klar falsch sein

Antworte NUR mit einem JSON-Array im folgenden Format:
[
  {
    "questionNumber": 1,
    "questionType": "mc_abc",
    "questionText": "Die Frage auf Deutsch",
    "questionTextVi": "Câu hỏi bằng tiếng Việt",
    "options": ["a) Option A", "b) Option B", "c) Option C"],
    "correctAnswer": "a",
    "explanation": "Erklärung auf Deutsch warum diese Antwort richtig ist",
    "explanationVi": "Giải thích bằng tiếng Việt"
  }
]`
    } else if (teil === 2) {
        return `Du bist ein Prüfungsersteller für die Goethe-Zertifikat A1 Hörprüfung, Teil 2 (Durchsagen und Ansagen).

Hier ist der Text einer Durchsage zum Thema "${script.topic}":

---
${dialogueText}
---

Erstelle ${questionCount} Richtig/Falsch-Fragen auf A1-Niveau.

REGELN:
- Jede Frage ist eine Aussage, die Richtig oder Falsch ist
- Fragen beziehen sich auf EXPLIZIT genannte Informationen (Zeit, Ort, Nummer, etc.)
- Verwende einfache A1-Sprache
- Mischung: ca. 60% Richtig, 40% Falsch
- Bei "Falsch"-Aussagen: Die Aussage muss ein Detail leicht verändern

Antworte NUR mit einem JSON-Array im folgenden Format:
[
  {
    "questionNumber": 1,
    "questionType": "richtig_falsch",
    "questionText": "Die Aussage auf Deutsch",
    "questionTextVi": "Câu phát biểu bằng tiếng Việt",
    "options": ["Richtig", "Falsch"],
    "correctAnswer": "a",
    "explanation": "Erklärung auf Deutsch",
    "explanationVi": "Giải thích bằng tiếng Việt"
  }
]`
    } else {
        return `Du bist ein Prüfungsersteller für die Goethe-Zertifikat A1 Hörprüfung, Teil 3 (Telefonansagen).

Hier ist der Text einer Telefonansage zum Thema "${script.topic}":

---
${dialogueText}
---

Erstelle ${questionCount} Multiple-Choice-Fragen (a/b/c) auf A1-Niveau.

REGELN:
- Fragen beziehen sich auf praktische Informationen: Öffnungszeiten, Telefonnummern, Adressen, Preise, Termine
- Verwende einfache A1-Sprache
- Jede Frage hat genau 3 Optionen
- Die richtige Antwort muss EXPLIZIT in der Ansage vorkommen

Antworte NUR mit einem JSON-Array im folgenden Format:
[
  {
    "questionNumber": 1,
    "questionType": "mc_abc",
    "questionText": "Die Frage auf Deutsch",
    "questionTextVi": "Câu hỏi bằng tiếng Việt",
    "options": ["a) Option A", "b) Option B", "c) Option C"],
    "correctAnswer": "a",
    "explanation": "Erklärung auf Deutsch",
    "explanationVi": "Giải thích bằng tiếng Việt"
  }
]`
    }
}

async function generateQuestionsForLesson(
    genai: GoogleGenAI,
    script: any,
    teil: number,
): Promise<GeneratedQuestion[]> {
    const prompt = buildPrompt(script, teil)

    try {
        const response = await genai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                temperature: 0.3,
                responseMimeType: 'application/json',
            },
        })

        const text = response.text || ''
        const questions: GeneratedQuestion[] = JSON.parse(text)

        if (!Array.isArray(questions) || questions.length === 0) {
            throw new Error('Invalid response format')
        }

        return questions
    } catch (error: any) {
        console.error(`  ❌ Generation failed: ${error.message?.slice(0, 100)}`)
        return []
    }
}

async function main() {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
        console.error('❌ GEMINI_API_KEY environment variable is required')
        console.log('Usage: GEMINI_API_KEY=your-key npx tsx scripts/generate-listening-questions.ts')
        process.exit(1)
    }

    const genai = new GoogleGenAI({ apiKey })
    const dryRun = process.argv.includes('--dry-run')
    const singleLesson = process.argv.find(a => a.startsWith('--lesson='))?.split('=')[1]

    console.log('🤖 AI-Powered Listening Question Generator')
    console.log(`   Mode: ${dryRun ? 'DRY RUN (preview only)' : 'LIVE (updating DB)'}`)
    if (singleLesson) console.log(`   Single lesson: ${singleLesson}`)
    console.log('')

    let totalGenerated = 0
    let totalFailed = 0

    for (const teil of TEILE) {
        const scriptsDir = path.join(SCRIPTS_DIR, teil.dir)
        if (!fs.existsSync(scriptsDir)) continue

        const files = fs.readdirSync(scriptsDir).filter(f => f.endsWith('.json')).sort()
        console.log(`📂 Teil ${teil.teil} — ${files.length} scripts`)

        for (const file of files) {
            const scriptPath = path.join(scriptsDir, file)
            const script = JSON.parse(fs.readFileSync(scriptPath, 'utf-8'))

            if (singleLesson && script.lesson_id !== singleLesson) continue

            console.log(`  🎯 ${script.lesson_id}: "${script.topic}"`)

            // Generate with Gemini
            const questions = await generateQuestionsForLesson(genai, script, teil.teil)

            if (questions.length === 0) {
                totalFailed++
                continue
            }

            console.log(`     ✅ Generated ${questions.length} questions`)

            if (dryRun) {
                // Preview first question
                const q = questions[0]
                console.log(`     Preview: "${q.questionText}"`)
                console.log(`       → ${q.options.join(' | ')} [correct: ${q.correctAnswer}]`)
            } else {
                // Update DB
                const lesson = await prisma.listeningLesson.findUnique({
                    where: { lessonId: script.lesson_id },
                })

                if (!lesson) {
                    console.log(`     ⚠️  Lesson not found in DB, skipping`)
                    continue
                }

                // Delete old questions
                await prisma.listeningQuestion.deleteMany({
                    where: { lessonId: lesson.id },
                })

                // Insert new questions
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

                console.log(`     💾 Saved to DB`)
            }

            totalGenerated++

            // Rate limiting: 1s between API calls
            await new Promise(r => setTimeout(r, 1000))
        }

        console.log('')
    }

    console.log(`\n🎉 Done! Generated: ${totalGenerated}, Failed: ${totalFailed}`)
    await prisma.$disconnect()
}

main()
