import { Hono } from 'hono'
import { streamText } from 'hono/streaming'
import { getChatModel } from '../lib/gemini.js'

export const chatRoutes = new Hono()

// ─── In-memory rate limiter ──────────────────────────
const rateLimit = new Map<string, { count: number; resetAt: number }>()
const MAX_REQUESTS = 30  // per window
const WINDOW_MS = 60_000 // 1 minute

function checkRateLimit(ip: string): boolean {
    const now = Date.now()
    const entry = rateLimit.get(ip)

    if (!entry || now > entry.resetAt) {
        rateLimit.set(ip, { count: 1, resetAt: now + WINDOW_MS })
        return true
    }

    if (entry.count >= MAX_REQUESTS) return false
    entry.count++
    return true
}

// ─── System Prompts ──────────────────────────────────
function getTutorSystemPrompt(level: string): string {
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

// ─── POST / — Conversational Chat ───────────────────
chatRoutes.post('/', async (c) => {
    const ip = c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || 'unknown'
    if (!checkRateLimit(ip)) {
        return c.json(
            { success: false, error: { code: 'RATE_LIMITED', message: 'Too many requests. Please wait a minute.' } },
            429,
        )
    }

    let body: { message: string; context?: string[]; level?: string }
    try {
        body = await c.req.json()
    } catch {
        return c.json(
            { success: false, error: { code: 'INVALID_BODY', message: 'Invalid JSON body' } },
            400,
        )
    }

    const { message, context = [], level = 'A1' } = body

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
        return c.json(
            { success: false, error: { code: 'MISSING_MESSAGE', message: 'Message is required' } },
            400,
        )
    }

    try {
        const model = getChatModel(level)

        // Build conversation history for context
        const history = context.map((msg, i) => ({
            role: i % 2 === 0 ? 'user' as const : 'model' as const,
            parts: [{ text: msg }],
        }))

        const chat = model.startChat({
            history,
            systemInstruction: getTutorSystemPrompt(level),
        })

        const result = await chat.sendMessageStream(message)

        // Stream the response
        return streamText(c, async (stream) => {
            for await (const chunk of result.stream) {
                const text = chunk.text()
                if (text) {
                    await stream.write(text)
                }
            }
        })
    } catch (err) {
        console.error('[Chat] Error:', err)
        return c.json(
            { success: false, error: { code: 'AI_ERROR', message: 'Failed to generate response' } },
            500,
        )
    }
})

// ─── POST /start — Start new conversation ───────────
chatRoutes.post('/start', async (c) => {
    let body: { level?: string } = {}
    try {
        body = await c.req.json()
    } catch {
        // Default is fine
    }

    const level = body.level || 'A1'

    const greetings: Record<string, string> = {
        'A1': 'Hallo! 🦊 Ich bin Fuxie. Wie heißt du? (Xin chào! Mình là Fuxie. Bạn tên gì?)',
        'A2': 'Hallo! 🦊 Ich bin Fuxie, dein Deutschtutor. Worüber möchtest du heute sprechen? (Xin chào! Bạn muốn nói về chủ đề gì hôm nay?)',
        'B1': 'Hallo! 🦊 Willkommen zurück! Was beschäftigt dich heute? Wollen wir über ein bestimmtes Thema sprechen oder eine Grammatikübung machen?',
        'B2': 'Hallo! 🦊 Schön, dass du da bist. Hast du heute ein bestimmtes Lernziel oder sollen wir einfach ein Gespräch führen? Ich passe mich deinem Niveau an.',
        'C1': 'Guten Tag! 🦊 Freut mich, dich wiederzusehen. Wollen wir heute ein anspruchsvolleres Thema diskutieren — vielleicht aktuelle Nachrichten oder ein kulturelles Thema?',
        'C2': 'Willkommen! 🦊 Auf diesem Niveau können wir über alles reden — von Philosophie bis Alltagskultur. Was interessiert dich gerade besonders?',
    }

    return c.json({
        success: true,
        data: {
            conversationId: crypto.randomUUID(),
            message: greetings[level] || greetings['A1'],
            level,
        },
    })
})
