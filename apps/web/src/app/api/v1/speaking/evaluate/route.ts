import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { handleApiError } from '@/lib/api/error-handler'
import { withAuth } from '@/lib/auth/middleware'
import { GoogleGenerativeAI } from '@google/generative-ai'

// ─── Gemini Client (lazy init) ───────────────────────
let genAI: GoogleGenerativeAI | null = null
function getGenAI() {
  if (!genAI) {
    const key = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY || ''
    if (!key) throw new Error('GEMINI_API_KEY not set')
    genAI = new GoogleGenerativeAI(key)
  }
  return genAI
}

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
          userIdx++ // consume the wrong word
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

    console.log(`[Evaluate] Level: ${level}, Audio: ${audioFile.size} bytes, Type: ${audioFile.type}, Ref: "${referenceText}"`)

    // === STEP 1: Call Gemini for pronunciation evaluation ===
    let transcript = ''
    let aiScore = 0
    let overallTips: string[] = []
    let usedAI = false

    try {
      const model = getGenAI().getGenerativeModel({ model: 'gemini-2.5-flash' })

      const arrayBuffer = await audioFile.arrayBuffer()
      const base64Data = Buffer.from(arrayBuffer).toString('base64')

      console.log(`[Evaluate] Calling Gemini with ${base64Data.length} base64 chars...`)

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
- Typische Fehler von Vietnamesen: "r" als "z", "ch" falsch, "ü/ö/ä" schwierig.

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

      // Force audio/wav MIME type — browser converts WebM→WAV before upload
      const detectedMime = audioFile.name?.endsWith('.wav') ? 'audio/wav' 
        : audioFile.type?.includes('wav') ? 'audio/wav'
        : audioFile.type || 'audio/wav'
      console.log(`[Evaluate] Using MIME: ${detectedMime} (original: ${audioFile.type}, name: ${audioFile.name})`)

      const result = await model.generateContent([
        prompt,
        {
          inlineData: {
            data: base64Data,
            mimeType: detectedMime,
          },
        },
      ])
      const responseText = result.response.text()
      console.log(`[Evaluate] Gemini raw response: ${responseText.substring(0, 300)}`)
      
      const cleaned = responseText.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim()
      const parsed = JSON.parse(cleaned)

      transcript = parsed.transcript || ''
      aiScore = typeof parsed.score === 'number' ? parsed.score : 0
      usedAI = true

      console.log(`[Evaluate] Gemini result: transcript="${transcript}", score=${aiScore}`)

      if (parsed.feedbackVi) {
        overallTips.push(`💡 ${parsed.feedbackVi}`)
      }
      if (parsed.issues?.length > 0) {
        parsed.issues.forEach((issue: any) => {
          overallTips.push(`- "${issue.word}": ${issue.issueVi || issue.tip}`)
        })
      }
    } catch (err: any) {
      console.error('[Evaluate/Gemini] Error:', err?.message || err)
    }

    // Handle different outcomes
    if (!usedAI) {
      // Gemini call completely failed (error)
      console.warn('[Evaluate] Gemini call failed — using error fallback')
      transcript = ''
      aiScore = 0
      overallTips = [
        '⚠️ Hệ thống AI gặp lỗi. Vui lòng thử lại sau.',
      ]
    } else if (!transcript && aiScore === 0) {
      // Gemini worked but detected no speech — valid AI response
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
    
    // Use AI score directly — don't override with word alignment when AI worked
    const accuracy = usedAI ? aiScore : 0

    console.log(`[Evaluate] Final: accuracy=${accuracy}, usedAI=${usedAI}, words=${wordResults.length}`)

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
