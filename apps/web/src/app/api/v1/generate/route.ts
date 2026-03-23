import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

const API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY || ''

let genAI: GoogleGenerativeAI | null = null
function getGenAI() {
    if (!genAI) {
        if (!API_KEY) throw new Error('GEMINI_API_KEY is not set')
        genAI = new GoogleGenerativeAI(API_KEY)
    }
    return genAI
}

const BASIC_LEVELS = new Set(['A1', 'A2', 'B1'])
function getModel(level: string) {
    const name = BASIC_LEVELS.has(level) ? 'gemini-2.0-flash-lite' : 'gemini-2.0-flash'
    return getGenAI().getGenerativeModel({ model: name })
}

// ─── POST /api/v1/generate — Exercise Generation ─────
export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const { type = 'vocabulary', cefrLevel = 'A1', topic, count = 5 } = body

        const model = getModel(cefrLevel)

        if (type === 'vocabulary') {
            return generateVocabulary(model, cefrLevel, topic, count)
        }
        if (type === 'grammar') {
            return generateGrammarExercise(model, cefrLevel, topic, count)
        }
        if (type === 'conversation') {
            return generateConversation(model, cefrLevel, topic)
        }

        return NextResponse.json({ success: false, error: 'Unknown type. Use "vocabulary", "grammar", or "conversation".' }, { status: 400 })
    } catch (err) {
        console.error('[Generate API] Error:', err)
        return NextResponse.json({ success: false, error: 'Generation failed' }, { status: 500 })
    }
}

// ─── Vocabulary Context Sentences ────────────────────
async function generateVocabulary(model: ReturnType<typeof getModel>, level: string, topic: string, count: number) {
    const prompt = `Generiere ${count} Beispielsätze mit dem Wort/Thema "${topic || 'Alltag'}" auf ${level}-Niveau.

Antworte NUR als JSON:
{
  "sentences": [
    { "de": "Deutscher Satz", "vi": "Câu tiếng Việt", "highlight": "Hervorgehobenes Wort", "grammar_note": "Kurze Grammatikerklärung" }
  ]
}`

    const result = await model.generateContent(prompt)
    const text = result.response.text()
    const cleaned = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim()
    const parsed = JSON.parse(cleaned)

    return NextResponse.json({ success: true, data: parsed })
}

// ─── Grammar Fill-in-the-blank ───────────────────────
async function generateGrammarExercise(model: ReturnType<typeof getModel>, level: string, topic: string, count: number) {
    const prompt = `Erstelle ${count} Lückentext-Übungen für ${level}-Lerner${topic ? ` zum Thema "${topic}"` : ''}.

Antworte NUR als JSON:
{
  "exercises": [
    {
      "sentence": "Satz mit ___ Lücke",
      "answer": "richtige Antwort",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "explanation": "Erklärung auf Deutsch",
      "explanationVi": "Giải thích tiếng Việt"
    }
  ]
}`

    const result = await model.generateContent(prompt)
    const text = result.response.text()
    const cleaned = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim()
    const parsed = JSON.parse(cleaned)

    return NextResponse.json({ success: true, data: parsed })
}

// ─── Conversation Scenario ───────────────────────────
async function generateConversation(model: ReturnType<typeof getModel>, level: string, topic: string) {
    const prompt = `Erstelle einen kurzen Dialog auf ${level}-Niveau${topic ? ` zum Thema "${topic}"` : ''}.

Der Dialog soll 4-8 Zeilen lang sein, zwischen zwei Personen (A und B).

Antworte NUR als JSON:
{
  "title": "Dialogtitel",
  "titleVi": "Tiêu đề tiếng Việt",
  "situation": "Kurze Beschreibung der Situation",
  "situationVi": "Mô tả tình huống",
  "lines": [
    { "speaker": "A", "text": "Deutsch", "textVi": "Tiếng Việt" }
  ],
  "vocabulary": [
    { "de": "Wort", "vi": "Nghĩa", "partOfSpeech": "Nomen/Verb/..." }
  ]
}`

    const result = await model.generateContent(prompt)
    const text = result.response.text()
    const cleaned = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim()
    const parsed = JSON.parse(cleaned)

    return NextResponse.json({ success: true, data: parsed })
}
