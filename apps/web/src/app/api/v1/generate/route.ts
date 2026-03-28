import { NextRequest, NextResponse } from 'next/server'
import { withGeminiFallback } from '@/lib/ai/gemini-fallback'

const BASIC_LEVELS = new Set(['A1', 'A2', 'B1'])

function getModelName(level: string) {
    return BASIC_LEVELS.has(level) ? 'gemini-2.0-flash-lite' : 'gemini-2.0-flash'
}

// ─── POST /api/v1/generate — Exercise Generation ─────
export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const { type = 'vocabulary', cefrLevel = 'A1', topic, count = 5 } = body

        if (type === 'vocabulary') {
            return generateVocabulary(cefrLevel, topic, count)
        }
        if (type === 'grammar') {
            return generateGrammarExercise(cefrLevel, topic, count)
        }
        if (type === 'conversation') {
            return generateConversation(cefrLevel, topic)
        }

        return NextResponse.json({ success: false, error: 'Unknown type. Use "vocabulary", "grammar", or "conversation".' }, { status: 400 })
    } catch (err) {
        console.error('[Generate API] Error:', err)
        return NextResponse.json({ success: false, error: 'Generation failed' }, { status: 500 })
    }
}

// ─── Vocabulary Context Sentences ────────────────────
async function generateVocabulary(level: string, topic: string, count: number) {
    const prompt = `Generiere ${count} Beispielsätze mit dem Wort/Thema "${topic || 'Alltag'}" auf ${level}-Niveau.

Antworte NUR als JSON:
{
  "sentences": [
    { "de": "Deutscher Satz", "vi": "Câu tiếng Việt", "highlight": "Hervorgehobenes Wort", "grammar_note": "Kurze Grammatikerklärung" }
  ]
}`

    const result = await withGeminiFallback(async (client) => {
        const model = client.getGenerativeModel({ model: getModelName(level) })
        return await model.generateContent(prompt)
    })
    const text = result.response.text()
    const cleaned = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim()
    const parsed = JSON.parse(cleaned)

    return NextResponse.json({ success: true, data: parsed })
}

// ─── Grammar Fill-in-the-blank ───────────────────────
async function generateGrammarExercise(level: string, topic: string, count: number) {
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

    const result = await withGeminiFallback(async (client) => {
        const model = client.getGenerativeModel({ model: getModelName(level) })
        return await model.generateContent(prompt)
    })
    const text = result.response.text()
    const cleaned = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim()
    const parsed = JSON.parse(cleaned)

    return NextResponse.json({ success: true, data: parsed })
}

// ─── Conversation Scenario ───────────────────────────
async function generateConversation(level: string, topic: string) {
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

    const result = await withGeminiFallback(async (client) => {
        const model = client.getGenerativeModel({ model: getModelName(level) })
        return await model.generateContent(prompt)
    })
    const text = result.response.text()
    const cleaned = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim()
    const parsed = JSON.parse(cleaned)

    return NextResponse.json({ success: true, data: parsed })
}
