import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { handleApiError } from '@/lib/api/error-handler'
import { withAuth } from '@/lib/auth/middleware'

// Increase Vercel function timeout for audio processing
export const maxDuration = 30

// ─── Word alignment (Levenshtein) ────────────────────
function alignWords(refWords: string[], userWords: string[]): Array<{
  word: string
  status: 'correct' | 'warning' | 'error' | 'missing'
  score: number
}> {
  const results: Array<{ word: string; status: 'correct' | 'warning' | 'error' | 'missing'; score: number }> = []
  const normalize = (w: string) => w.toLowerCase().replace(/[^a-zäöüß]/g, '')

  let userIdx = 0
  for (const refWord of refWords) {
    const refNorm = normalize(refWord)
    if (userIdx < userWords.length) {
      const userNorm = normalize(userWords[userIdx]!)
      if (refNorm === userNorm) {
        results.push({ word: refWord, status: 'correct', score: 100 })
        userIdx++
      } else if (editDistance(refNorm, userNorm) <= 2) {
        results.push({ word: refWord, status: 'warning', score: 70 })
        userIdx++
      } else {
        const futureIdx = userWords.slice(userIdx).findIndex(w => normalize(w) === refNorm)
        if (futureIdx > 0) {
          userIdx += futureIdx
          results.push({ word: refWord, status: 'correct', score: 100 })
          userIdx++
        } else {
          results.push({ word: refWord, status: 'error', score: 0 })
          userIdx++
        }
      }
    } else {
      results.push({ word: refWord, status: 'missing', score: 0 })
    }
  }
  return results
}

function editDistance(a: string, b: string): number {
  const dp: number[][] = Array(a.length + 1).fill(null).map(() => Array(b.length + 1).fill(0))
  for (let i = 0; i <= a.length; i++) dp[i]![0] = i
  for (let j = 0; j <= b.length; j++) dp[0]![j] = j
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i]![j] = Math.min(
        dp[i - 1]![j]! + 1,
        dp[i]![j - 1]! + 1,
        dp[i - 1]![j - 1]! + (a[i - 1] === b[j - 1] ? 0 : 1)
      )
    }
  }
  return dp[a.length]![b.length]!
}

const VALID_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const
const speakingSchema = z.object({
  referenceText: z.string().min(1),
  level: z.enum(VALID_LEVELS).default('A1'),
  exerciseType: z.string().default('nachsprechen'),
})

// ─── Call Gemini REST API directly (more reliable than SDK for audio) ───
async function callGeminiWithAudio(
  base64Audio: string,
  mimeType: string,
  prompt: string
): Promise<{ transcript: string; score: number; feedbackVi: string; issues: any[] }> {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY
  if (!apiKey) {
    throw new Error('NO_API_KEY')
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`

  const body = {
    contents: [{
      parts: [
        { text: prompt },
        { inline_data: { mime_type: mimeType, data: base64Audio } }
      ]
    }],
    generationConfig: {
      temperature: 0.1,
      maxOutputTokens: 1024,
    }
  }

  console.log(`[Gemini] Calling REST API, audio: ${base64Audio.length} b64 chars, mime: ${mimeType}`)

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error(`[Gemini] HTTP ${response.status}: ${errorText.substring(0, 500)}`)
    throw new Error(`HTTP_${response.status}: ${errorText.substring(0, 200)}`)
  }

  const result = await response.json()
  
  const text = result?.candidates?.[0]?.content?.parts?.[0]?.text
  if (!text) {
    const resultStr = JSON.stringify(result).substring(0, 300)
    console.error('[Gemini] No text in response:', resultStr)
    throw new Error(`NO_TEXT: ${resultStr}`)
  }

  console.log(`[Gemini] Raw response: ${text.substring(0, 300)}`)

  // Parse JSON from response
  const cleaned = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim()
  return JSON.parse(cleaned)
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

    console.log(`[Evaluate] Level: ${level}, Audio: ${audioFile.size}b, Type: ${audioFile.type}, Name: ${audioFile.name}, Ref: "${referenceText}"`)

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

      const prompt = `Du bist ein strenger DaF-Aussprachetrainer. Höre dir die Audioaufnahme eines vietnamesischen ${level}-Lerners an.

## Kontext
- Niveau: ${level}
- Übungstyp: ${exerciseType}
- Erwarteter Text: "${referenceText}"

## WICHTIGE REGELN
- Transkribiere EXAKT was du hörst, NICHT den erwarteten Text!
- Wenn der Lerner etwas anderes sagt als erwartet, schreibe was er TATSÄCHLICH gesagt hat.
- Wenn du nur Rauschen, Stille oder unverständliche Laute hörst, setze transcript auf "" (leer) und score auf 0.
- Sei STRENG bei der Bewertung. Nur perfekte Aussprache bekommt 90+.

## Bewertungsskala
- 90-100: Nahezu perfekt, muttersprachlich
- 70-89: Gut, verständlich mit kleinen Fehlern
- 50-69: Befriedigend, einige Aussprachefehler
- 30-49: Schwach, schwer verständlich
- 0-29: Unverständlich oder falscher Text

Antworte NUR als JSON (kein Markdown):
{
  "transcript": "Was der Lerner TATSÄCHLICH gesagt hat (oder leer wenn nicht erkennbar)",
  "score": 0-100,
  "feedbackVi": "Đánh giá bằng tiếng Việt",
  "issues": [
    { "word": "Wort", "issueVi": "Vấn đề phát âm", "tip": "Tipp" }
  ]
}`

      const parsed = await callGeminiWithAudio(base64Data, mimeType, prompt)

      if (parsed) {
        transcript = parsed.transcript || ''
        aiScore = typeof parsed.score === 'number' ? parsed.score : 0
        usedAI = true

        console.log(`[Evaluate] Gemini: transcript="${transcript}", score=${aiScore}`)

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
      const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY || ''
      overallTips = [
        `⚠️ Hệ thống AI gặp lỗi. Vui lòng thử lại sau.`,
        `🔍 Debug: key=${apiKey ? apiKey.substring(0,8) + '...' : 'MISSING'}, audioSize=${audioFile.size}b, err=${debugError || 'unknown'}`,
      ]
    } else if (!transcript && aiScore === 0) {
      console.log('[Evaluate] Gemini detected no recognizable speech')
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

    console.log(`[Evaluate] Final: accuracy=${accuracy}, usedAI=${usedAI}`)

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
