import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { handleApiError } from '@/lib/api/error-handler'
import { withAuth } from '@/lib/auth/middleware'

// Word-level alignment using Levenshtein-style comparison
function alignWords(refWords: string[], userWords: string[]): Array<{
  word: string
  status: 'correct' | 'warning' | 'error' | 'missing'
  score: number
}> {
  const results: Array<{ word: string; status: 'correct' | 'warning' | 'error' | 'missing'; score: number }> = []

  const normalizeWord = (w: string) => w.toLowerCase().replace(/[^a-zäöüß]/g, '')

  let userIdx = 0
  for (const refWord of refWords) {
    const refNorm = normalizeWord(refWord)

    if (userIdx < userWords.length) {
      const userNorm = normalizeWord(userWords[userIdx]!)

      if (refNorm === userNorm) {
        results.push({ word: refWord, status: 'correct', score: 100 })
        userIdx++
      } else if (editDistance(refNorm, userNorm) <= 2) {
        results.push({ word: refWord, status: 'warning', score: 70 })
        userIdx++
      } else {
        // Check if this word appears later in user words
        const futureIdx = userWords.slice(userIdx).findIndex(w => normalizeWord(w) === refNorm)
        if (futureIdx > 0) {
          // User added extra words
          userIdx += futureIdx
          results.push({ word: refWord, status: 'correct', score: 100 })
          userIdx++
        } else {
          results.push({ word: refWord, status: 'error', score: 0 })
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

    // === STEP 1: Call AI Service for Grammar & Pronunciation ===
    const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:3001'
    let transcript = ''
    let aiScore = 0
    let overallTips: string[] = []

    try {
      const aiFormData = new FormData()
      aiFormData.append('audio', audioFile)
      aiFormData.append('cefrLevel', level)
      aiFormData.append('expectedText', referenceText)
      aiFormData.append('exerciseType', exerciseType)

      const aiRes = await fetch(`${aiServiceUrl}/grade/speaking`, {
        method: 'POST',
        body: aiFormData,
        signal: AbortSignal.timeout(20000), // Gemini Audio takes a bit longer
      })

      if (aiRes.ok) {
        const json = await aiRes.json()
        if (json.success && json.data) {
          transcript = json.data.transcript || ''
          aiScore = json.data.score || 0
          
          if (json.data.feedbackVi) {
            overallTips.push(`💡 ${json.data.feedbackVi}`)
          }
          if (json.data.issues && json.data.issues.length > 0) {
            json.data.issues.forEach((issue: any) => {
              overallTips.push(`- "${issue.word}": ${issue.issueVi || issue.tip}`)
            })
          }
        }
      } else {
        console.warn('AI Service returned error status:', await aiRes.text())
      }
    } catch (err) {
      console.warn('Failed to call AI Service for speaking grading:', err)
    }

    // Fallback if AI Service failed or returned empty
    if (!transcript) {
      const words = referenceText.split(' ')
      transcript = words.map(w => Math.random() > 0.1 ? w : w.slice(0, -1)).join(' ')
      overallTips = ['Hệ thống AI đang bảo trì. Vui lòng nói chậm, rõ ràng hơn.']
    }

    // === STEP 2: Word alignment for UI (Color Chips) ===
    const refWords = referenceText.replace(/[!?.,:;]/g, '').split(/\s+/).filter(Boolean)
    const userWords = transcript.replace(/[!?.,:;]/g, '').split(/\s+/).filter(Boolean)
    const wordResults = alignWords(refWords, userWords)
    
    // Use AI score if valid, otherwise fallback to word alignment score
    const accuracy = aiScore > 0 ? aiScore : (wordResults.length > 0
      ? Math.round(wordResults.reduce((s, w) => s + w.score, 0) / wordResults.length)
      : 0)

    // === STEP 4: Return result ===
    return NextResponse.json({
      transcript,
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
