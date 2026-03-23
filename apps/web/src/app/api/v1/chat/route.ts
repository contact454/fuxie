import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI, type GenerativeModel } from '@google/generative-ai'

// ─── Lazy-init Gemini ──────────────────────────────
const API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY || ''

let genAI: GoogleGenerativeAI | null = null
function getGenAI(): GoogleGenerativeAI {
    if (!genAI) {
        if (!API_KEY) throw new Error('GEMINI_API_KEY is not set')
        genAI = new GoogleGenerativeAI(API_KEY)
    }
    return genAI
}

const BASIC_LEVELS = new Set(['A1', 'A2', 'B1'])
function getChatModel(level: string): GenerativeModel {
    const name = BASIC_LEVELS.has(level)
        ? 'gemini-2.0-flash-lite'
        : 'gemini-2.0-flash'
    return getGenAI().getGenerativeModel({ model: name })
}

// ─── System Prompt ─────────────────────────────────
function getSystemPrompt(level: string): string {
    return `Du bist "Fuxie" 🦊 — ein freundlicher, geduldiger KI-Sprachtutor für Deutsch als Fremdsprache.
Dein Schüler ist vietnamesisch und lernt auf dem CEFR-Niveau ${level}.

## Regeln
1. Passe deine Sprache STRENG an ${level} an:
   - A1-A2: Sehr einfache Sätze, Grundwortschatz, viel Wiederholung
   - B1-B2: Komplexere Sätze, Nebensätze, thematischer Wortschatz
   - C1-C2: Natürliches Deutsch, idiomatische Wendungen, anspruchsvolle Themen

2. Antworte auf DEUTSCH — aber füge vietnamesische Übersetzungen in Klammern hinzu bei:
   - Neuen Vokabeln
   - Grammatikerklärungen
   - Korrekturen

3. Korrigiere Fehler IMMER:
   - Zeige den Fehler und die Korrektur
   - Erkläre kurz die Regel (auf dem passenden Niveau)
   - Gib ein weiteres Beispiel

4. Sei ermutigend und nutze den 🦊 Emoji gelegentlich
5. Stelle Folgefragen, um das Gespräch am Laufen zu halten
6. Wenn der Schüler auf Vietnamesisch schreibt, antworte kurz auf Vietnamesisch und ermutige zum Deutschsprechen

## Format
- Verwende Markdown für Formatierung
- Hebe Korrekturen mit **fett** hervor
- Nutze Aufzählungszeichen für Tipps`
}

// ─── Greetings ─────────────────────────────────────
const GREETINGS: Record<string, string> = {
    A1: 'Hallo! 🦊 Ich bin Fuxie. Wie heißt du?\n\n*(Xin chào! Mình là Fuxie. Bạn tên gì?)*',
    A2: 'Hallo! 🦊 Ich bin Fuxie, dein Deutschtutor. Worüber möchtest du heute sprechen?\n\n*(Bạn muốn nói về chủ đề gì hôm nay?)*',
    B1: 'Hallo! 🦊 Willkommen zurück! Was beschäftigt dich heute? Wollen wir über ein bestimmtes Thema sprechen oder eine Grammatikübung machen?',
    B2: 'Hallo! 🦊 Schön, dass du da bist. Hast du heute ein bestimmtes Lernziel oder sollen wir einfach ein Gespräch führen?',
    C1: 'Guten Tag! 🦊 Freut mich, dich wiederzusehen. Wollen wir heute ein anspruchsvolleres Thema diskutieren?',
    C2: 'Willkommen! 🦊 Auf diesem Niveau können wir über alles reden — von Philosophie bis Alltagskultur. Was interessiert dich gerade besonders?',
}

// ─── POST /api/v1/chat ─────────────────────────────
export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const { message, history = [], level = 'A1', action } = body

        // Start conversation
        if (action === 'start') {
            return NextResponse.json({
                success: true,
                data: {
                    message: GREETINGS[level] || GREETINGS.A1,
                    level,
                },
            })
        }

        // Chat message
        if (!message || typeof message !== 'string' || !message.trim()) {
            return NextResponse.json(
                { success: false, error: 'Message is required' },
                { status: 400 },
            )
        }

        const model = getChatModel(level)

        // Build conversation history
        const chatHistory = (history as Array<{ role: string; text: string }>).map(msg => ({
            role: msg.role === 'user' ? 'user' as const : 'model' as const,
            parts: [{ text: msg.text }],
        }))

        const chat = model.startChat({
            history: chatHistory,
            systemInstruction: getSystemPrompt(level),
        })

        const result = await chat.sendMessageStream(message)

        // Stream response
        const encoder = new TextEncoder()
        const stream = new ReadableStream({
            async start(controller) {
                try {
                    for await (const chunk of result.stream) {
                        const text = chunk.text()
                        if (text) {
                            controller.enqueue(encoder.encode(text))
                        }
                    }
                    controller.close()
                } catch (err) {
                    controller.error(err)
                }
            },
        })

        return new Response(stream, {
            headers: {
                'Content-Type': 'text/plain; charset=utf-8',
                'Cache-Control': 'no-cache',
                'Transfer-Encoding': 'chunked',
            },
        })
    } catch (err) {
        console.error('[Chat API] Error:', err)
        return NextResponse.json(
            { success: false, error: 'Failed to generate response' },
            { status: 500 },
        )
    }
}
