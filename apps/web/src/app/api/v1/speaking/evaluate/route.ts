import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { handleApiError } from '@/lib/api/error-handler'
import { withAuth } from '@/lib/auth/middleware'
import { editDistance, alignWords } from '@/lib/ai/text-alignment'

// Increase Vercel function timeout for audio processing
export const maxDuration = 30

// Word alignment is now imported from '@/lib/ai/text-alignment'

const VALID_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const
const speakingSchema = z.object({
  referenceText: z.string().min(1),
  level: z.enum(VALID_LEVELS).default('A1'),
  exerciseType: z.string().default('nachsprechen'),
})

// ─── Call Gemini REST API directly (more reliable than SDK for audio) ───
import { withGeminiFallback, getGeminiKey } from '@/lib/ai/gemini-fallback'

async function callGeminiWithAudio(
  base64Audio: string,
  mimeType: string,
  prompt: string
): Promise<{ transcript: string; score: number; feedbackVi: string; issues: any[] }> {
  const body = {
    contents: [{
      parts: [
        { text: prompt },
        { inline_data: { mime_type: mimeType, data: base64Audio } }
      ]
    }],
    generationConfig: {
      temperature: 0.1,
      maxOutputTokens: 8192,
    }
  }


  const result = await withGeminiFallback(async (_, activeKey) => {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${activeKey}`
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`[Gemini] HTTP ${response.status}: ${errorText.substring(0, 500)}`)
      
      // If 429, throw an error with status so withGeminiFallback can rotate key
      const error: any = new Error(`HTTP_${response.status}: ${errorText.substring(0, 200)}`)
      error.status = response.status
      throw error
    }

    return await response.json()
  })
  
  const text = result?.candidates?.[0]?.content?.parts?.[0]?.text
  if (!text) {
    const resultStr = JSON.stringify(result).substring(0, 300)
    console.error('[Gemini] No text in response:', resultStr)
    throw new Error(`NO_TEXT: ${resultStr}`)
  }


  // Robust JSON parsing — handle markdown fences, truncated strings, etc.
  let cleaned = text
  // Remove markdown code fences
  cleaned = cleaned.replace(/```json\s*/gi, '').replace(/```\s*/gi, '').trim()
  
  try {
    return JSON.parse(cleaned)
  } catch (firstErr) {
    console.warn('[Gemini] First JSON.parse failed, trying regex extraction...')
    // Try to extract JSON object with regex
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0])
      } catch (secondErr) {
        // Try to fix common issues: truncated strings, trailing commas
        let fixedJson = jsonMatch[0]
        // Remove trailing commas before } or ]
        fixedJson = fixedJson.replace(/,\s*([}\]])/g, '$1')
        // If truncated, try to close it
        const openBraces = (fixedJson.match(/\{/g) || []).length
        const closeBraces = (fixedJson.match(/\}/g) || []).length
        if (openBraces > closeBraces) {
          // Truncated — extract what we can
          const transcriptMatch = fixedJson.match(/"transcript"\s*:\s*"([^"]*)"/)
          const scoreMatch = fixedJson.match(/"score"\s*:\s*(\d+)/)
          const feedbackMatch = fixedJson.match(/"feedbackVi"\s*:\s*"([^"]*)"/)
          return {
            transcript: transcriptMatch?.[1] || '',
            score: scoreMatch ? parseInt(scoreMatch[1]) : 0,
            feedbackVi: feedbackMatch?.[1] || '',
            issues: []
          }
        }
        throw new Error(`JSON_PARSE: ${String(secondErr).substring(0, 100)}`)
      }
    }
    throw new Error(`NO_JSON_FOUND: ${cleaned.substring(0, 150)}`)
  }
}

export async function POST(request: NextRequest) {
  try {
    await withAuth(request)

    const formData = await request.formData()
    const audioFile = formData.get('audio') as File | null

    if (!audioFile) {
      return NextResponse.json(
        { success: false, error: 'Missing audio file' },
        { status: 400 }
      )
    }

    const { referenceText, level, exerciseType } = speakingSchema.parse({
      referenceText: formData.get('referenceText'),
      level: formData.get('level') || 'A1',
      exerciseType: formData.get('exerciseType') || 'nachsprechen',
    })

  
    // === STEP 1: Call Gemini for pronunciation evaluation ===
    let transcript = ''
    let aiScore = 0
    let overallTips: string[] = []
    let usedAI = false
    let debugError = ''

    try {
      const arrayBuffer = await audioFile.arrayBuffer()
      const base64Data = Buffer.from(arrayBuffer).toString('base64')

      // Determine MIME type — browser now sends WAV
      const mimeType = audioFile.name?.endsWith('.wav') ? 'audio/wav'
        : audioFile.type?.includes('wav') ? 'audio/wav'
        : 'audio/wav' // Default to WAV since browser converts

      const prompt = `Du bist ein DaF-Aussprachetrainer. Analysiere die Audioaufnahme.

Erwarteter Text: "${referenceText}"
Niveau: ${level}

REGELN:
- Transkribiere EXAKT was du hörst
- Bei Stille/Rauschen: transcript="", score=0
- Bewertung: 90+=perfekt, 70-89=gut, 50-69=ok, 30-49=schwach, 0-29=falsch

Antworte NUR als valides JSON ohne Markdown:
{"transcript":"...","score":0,"feedbackVi":"...","issues":[{"word":"...","issueVi":"..."}]}`

      const parsed = await callGeminiWithAudio(base64Data, mimeType, prompt)

      if (parsed) {
        transcript = parsed.transcript || ''
        aiScore = typeof parsed.score === 'number' ? parsed.score : 0
        usedAI = true

      
        if (parsed.feedbackVi) {
          overallTips.push(`💡 ${parsed.feedbackVi}`)
        }
        if (parsed.issues?.length > 0) {
          parsed.issues.forEach((issue: any) => {
            overallTips.push(`- "${issue.word}": ${issue.issueVi || issue.tip}`)
          })
        }
      }
    } catch (err: any) {
      debugError = `catch: ${err?.message || String(err)}`
      console.error('[Evaluate] Unexpected error:', err?.message || err)
    }

    // Handle different outcomes
    if (!usedAI) {
      console.warn('[Evaluate] Gemini call failed — using error fallback')
      transcript = ''
      aiScore = 0
      let activeKey = ''
      try { activeKey = getGeminiKey() } catch(e) {}
      overallTips = [
        `⚠️ Hệ thống AI gặp lỗi hoặc quá tải. Vui lòng thử lại sau.`,
        `🔍 Debug: audioSize=${audioFile.size}b, err=${debugError || 'unknown'}`,
      ]
    } else if (!transcript && aiScore === 0) {
        overallTips = overallTips.length > 0 ? overallTips : [
        '🎤 AI không nhận diện được lời nói trong bản ghi âm.',
        '💡 Hãy nói to, rõ ràng hơn và gần microphone hơn.',
      ]
    }

    // === STEP 2: Word alignment for UI (Color Chips) ===
    const refWords = referenceText.replace(/[!?.,:;]/g, '').split(/\s+/).filter(Boolean)
    const userWords = transcript.replace(/[!?.,:;()]/g, '').split(/\s+/).filter(Boolean)
    const wordResults = alignWords(refWords, userWords)

    // Use AI score directly
    const accuracy = usedAI ? aiScore : 0

  
    return NextResponse.json({
      transcript: usedAI ? transcript : '',
      accuracy,
      durationSec: 0,
      words: wordResults,
      overallTips,
      suggestRetry: accuracy < 70,
    })

  } catch (err) {
    return handleApiError(err)
  }
}
