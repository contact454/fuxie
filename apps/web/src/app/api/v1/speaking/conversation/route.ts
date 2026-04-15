import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { handleApiError } from '@/lib/api/error-handler'
import { withAuth } from '@/lib/auth/middleware'
import { withGeminiFallback } from '@/lib/ai/gemini-fallback'
import { editDistance } from '@/lib/ai/text-alignment'

// ─── Types ───
interface ChatMessage {
  role: 'user' | 'model'
  text: string
}

interface WordDetail {
  word: string
  accuracyScore: number
  errorType: 'None' | 'Mispronunciation' | 'Omission' | 'Insertion'
}

export const maxDuration = 45 // Increased for chaining 3 AI calls (STT -> LLM -> TTS)

const conversationSchema = z.object({
  level: z.enum(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']).default('A1'),
  history: z.string().default('[]'), // JSON stringified array of messages
  scenario: z.string().default('cafe'), // Topic context
})

// editDistance is now imported from '@/lib/ai/text-alignment'

// ─── 1. Gemini Speech-to-Text & Pronunciation Assessment ───
async function evaluateSpeech(base64Audio: string, mimeType: string, level: string, lastAiMessage: string) {
  const prompt = `Du bist ein extrem strenger Experte für deutsche Phonetik (Niveau ${level}).
Der Benutzer antwortet gerade auf: "${lastAiMessage}".
Aufgabe 1: Transkribiere EXAKT, was im Audio gesagt wird. Wenn es stottert, schreib es auf.
Aufgabe 2: Bewerte die generelle Aussprache (score 0-100).
Aufgabe 3: Erstelle eine detaillierte Liste der Wörter aus dem Transkript. Bewerte für jedes Wort präzise die Aussprache-Genauigkeit (accuracyScore 0-100) und den errorType (None, Mispronunciation, Omission, Insertion). Sei bei der phonetischen Bewertung extrem kritisch (wie ein muttersprachlicher Lehrer).

Gib NUR valides JSON zurück (response_mime_type ist application/json aktiviert, also liefere nur das pure Objekt):
{
  "transcript": "...",
  "score": 85,
  "feedbackVi": "...",
  "words": [
    { "word": "...", "accuracyScore": 90, "errorType": "None" }
  ]
}`

  try {
    const result = await withGeminiFallback(async (_, activeKey) => {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=${activeKey}`
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }, { inline_data: { mime_type: mimeType, data: base64Audio } }] }],
          generationConfig: { temperature: 0.1, response_mime_type: 'application/json' }
        }),
      })
      if (!response.ok) {
         // Fallback to flash if pro is not available for this key
         console.warn("[Gemini] Pro failed, trying flash fallback...");
         const urlFlash = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${activeKey}`
         const resFlash = await fetch(urlFlash, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }, { inline_data: { mime_type: mimeType, data: base64Audio } }] }],
              generationConfig: { temperature: 0.1, response_mime_type: 'application/json' }
            }),
         });
         if (!resFlash.ok) throw new Error(await resFlash.text());
         return await resFlash.json();
      }
      return await response.json()
    })

    const text = result?.candidates?.[0]?.content?.parts?.[0]?.text || '{}'
    return JSON.parse(text)
  } catch (err) {
    console.error("[evaluateSpeech] Gemini Error:", err)
    return { transcript: '', score: 0, feedbackVi: 'Lỗi nhận lý luận âm thanh (Phonetic Analysis) từ Gemini.', words: [] }
  }
}

// ─── 2. Generative Roleplay (Gemini) ───
async function generateNextTurn(transcript: string, historyArr: ChatMessage[], level: string, scenario: string) {
  const systemPrompt = `Du bist Fuxie, ein freundlicher KI-Gesprächspartner. 
Euer aktuelles Szenario: ${scenario}. Niveau: ${level}.
Führe ein natürliches Gespräch. Antworte in 1-2 kurzen Sätzen.
Sei geduldig und frage nach, wenn die Antwort des Benutzers unklar war.`

  const chatHistory = historyArr.map((msg) => ({
    role: msg.role === 'user' ? 'user' : 'model',
    parts: [{ text: msg.text }],
  }))

  const result = await withGeminiFallback(async (client) => {
    const model = client.getGenerativeModel({ model: 'gemini-2.5-flash' })
    const chat = model.startChat({ history: chatHistory, systemInstruction: systemPrompt })
    return await chat.sendMessage(transcript)
  })

  return result.response.text()
}

// ─── 3. Audio Factory TTS ───
async function generateTTS(text: string): Promise<string> {
    const baseUrl = process.env.AUDIO_FACTORY_URL || 'http://127.0.0.1:8004'
    try {
        const response = await fetch(`${baseUrl}/synthesize_clone`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                text: text,
                archetype_id: "Modell_A1", // Default archetype to use from the Audio Factory
                language: "German"
            })
        });
        
        if (!response.ok) {
            console.warn(`[Audio Factory] TTS failed with ${response.status}, falling back to browser TTS.`);
            return ""; // Empty string means frontend should fallback to browser TTS
        }
        
        const arrayBuffer = await response.arrayBuffer();
        return Buffer.from(arrayBuffer).toString('base64');
    } catch (e) {
        console.warn(`[Audio Factory] Local server not running or error:`, e);
        return ""; // Fallback to browser TTS
    }
}

export async function POST(request: NextRequest) {
  try {
    await withAuth(request)
    const formData = await request.formData()
    const audioFile = formData.get('audio') as File | null
    
    // Support text-only initial start / fallback
    const isAudioInput = !!audioFile;

    const { level, history, scenario } = conversationSchema.parse({
      level: formData.get('level') || 'A1',
      history: formData.get('history') || '[]',
      scenario: formData.get('scenario') || 'cafe',
    })

    const historyArr = JSON.parse(history)
    let userTranscript = formData.get('text') as string || '' // If user typed instead of voice
    let accuracy = 100
    let pronunciationFeedback = ''
    let wordsDetail: WordDetail[] = []

    if (isAudioInput && audioFile) {
        const arrayBuffer = await audioFile.arrayBuffer()
        const base64Data = Buffer.from(arrayBuffer).toString('base64')
        const mimeType = audioFile.name?.endsWith('.wav') ? 'audio/wav' : 'audio/webm'
        const lastAiMessage = historyArr.length > 0 ? historyArr[historyArr.length - 1].text : ''
        
        const evalResult = await evaluateSpeech(base64Data, mimeType, level, lastAiMessage)
        userTranscript = evalResult.transcript
        accuracy = evalResult.score
        pronunciationFeedback = evalResult.feedbackVi
        wordsDetail = evalResult.words
    }
    
    if (!userTranscript.trim() && isAudioInput) {
        return NextResponse.json({
            error: "Không nghe rõ. Vui lòng nói lại.",
            accuracy: 0,
            transcript: "",
            aiResponseText: "",
            aiResponseAudioBase64: ""
        })
    }

    // 2. Generate Next Reply
    const aiResponseText = await generateNextTurn(userTranscript, historyArr, level, scenario)

    // 3. Synthesize Audio via Audio Factory
    const aiResponseAudioBase64 = await generateTTS(aiResponseText)

    return NextResponse.json({
      transcript: userTranscript,
      accuracy,
      feedback: pronunciationFeedback,
      words: wordsDetail,
      aiResponseText,
      aiResponseAudioBase64
    })
  } catch (err) {
    return handleApiError(err)
  }
}
