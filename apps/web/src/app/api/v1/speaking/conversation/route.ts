import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { handleApiError } from '@/lib/api/error-handler'
import { withDbAuth } from '@/lib/auth/middleware'
import { withGeminiFallback } from '@/lib/ai/gemini-fallback'
import { editDistance } from '@/lib/ai/text-alignment'
import { prisma } from '@fuxie/database'
import { recordAnalyticsEvent } from '@/lib/analytics/events'

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
  targetLanguage: z.string().default('de'), // e.g., 'en', 'de', 'vi'
  uiLanguage: z.string().default('vi'),
})

// editDistance is now imported from '@/lib/ai/text-alignment'

// ─── 1. Gemini Speech-to-Text & Pronunciation Assessment ───
async function evaluateSpeech(base64Audio: string, mimeType: string, level: string, lastAiMessage: string, uiLang: string) {
  const prompt = `You are a strict phonetics expert for the German language (Level ${level}).
The user is currently responding to: "${lastAiMessage}".
Task 1: Transcribe EXACTLY what is said in the audio. Include stutters.
Task 2: Score the general pronunciation accuracy (score 0-100).
Task 3: Create a detailed list of words from the transcript. For each word, rate the pronunciation accuracy (accuracyScore 0-100) and the errorType (None, Mispronunciation, Omission, Insertion). Be extremely critical like a native teacher.
Task 4: Provide overall feedback translated to the user's interface language (${uiLang}).

Return ONLY valid JSON (response_mime_type is application/json. no markdown wrappers):
{
  "transcript": "...",
  "score": 85,
  "feedback": "...",
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
    return { transcript: '', score: 0, feedback: 'Error analyzing phonetic pronunciation.', words: [] }
  }
}

// ─── 2. Generative Roleplay (Gemini) ───
async function generateNextTurn(transcript: string, historyArr: ChatMessage[], level: string, scenario: string) {
  const systemPrompt = `You are Fuxie, a friendly AI conversation partner teaching German. 
Your current scenario: ${scenario}. Learner level: ${level}.
Have a natural conversation. Respond in 1-2 short sentences in German.
Be patient and ask clarifying questions if the user's answer is unclear.`

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
    const auth = await withDbAuth(request)
    const formData = await request.formData()
    const audioFile = formData.get('audio') as File | null
    
    // Support text-only initial start / fallback
    const isAudioInput = !!audioFile;

    const { level, history, scenario, uiLanguage } = conversationSchema.parse({
      level: formData.get('level') || 'A1',
      history: formData.get('history') || '[]',
      scenario: formData.get('scenario') || 'cafe',
      uiLanguage: formData.get('uiLanguage') || 'vi',
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
        
        const evalResult = await evaluateSpeech(base64Data, mimeType, level, lastAiMessage, uiLanguage)
        userTranscript = evalResult.transcript
        accuracy = evalResult.score
        pronunciationFeedback = evalResult.feedback
        wordsDetail = evalResult.words
    }
    
    if (!userTranscript.trim() && isAudioInput) {
        await recordAnalyticsEvent(prisma, {
            userId: auth.userId,
            role: auth.role,
            eventName: 'ai_feedback_failed',
            source: 'speaking.conversation',
            actionId: `${scenario}:${level}`,
            actionType: 'speaking_submission',
            level,
            skill: 'SPRECHEN',
            metadata: {
                flow: 'speaking',
                error_type: 'empty_or_failed_speech_eval',
                scenario,
            },
        })
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

    await recordAnalyticsEvent(prisma, {
      userId: auth.userId,
      role: auth.role,
      eventName: 'ai_feedback_generated',
      source: 'speaking.conversation',
      actionId: `${scenario}:${level}`,
      actionType: isAudioInput ? 'speaking_submission' : null,
      level,
      skill: isAudioInput ? 'SPRECHEN' : 'CHAT',
      metadata: {
        flow: 'chat',
        mode: 'speaking_conversation',
        score_percent: isAudioInput ? accuracy : null,
        word_count: wordsDetail.length,
        scenario,
        tts_provider_status: aiResponseAudioBase64 ? 'generated' : 'fallback',
        provider_status: 'success',
      },
    })

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
