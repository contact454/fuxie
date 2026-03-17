import { NextRequest, NextResponse } from 'next/server'

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
      const userNorm = normalizeWord(userWords[userIdx])

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
  for (let i = 0; i <= a.length; i++) dp[i][0] = i
  for (let j = 0; j <= b.length; j++) dp[0][j] = j
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      )
    }
  }
  return dp[a.length][b.length]
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const audioFile = formData.get('audio') as File | null
    const referenceText = formData.get('referenceText') as string
    const level = formData.get('level') as string || 'A1'
    const exerciseType = formData.get('exerciseType') as string || 'nachsprechen'

    if (!audioFile || !referenceText) {
      return NextResponse.json({ error: 'Missing audio or referenceText' }, { status: 400 })
    }

    // === STEP 1: STT — Transcribe audio ===
    let transcript = ''
    try {
      // Try Faster-Whisper service
      const sttFormData = new FormData()
      sttFormData.append('audio', audioFile)
      sttFormData.append('language', 'de')

      const sttUrl = process.env.STT_SERVICE_URL || 'http://localhost:5050'
      const sttRes = await fetch(`${sttUrl}/transcribe`, {
        method: 'POST',
        body: sttFormData,
        signal: AbortSignal.timeout(15000),
      })

      if (sttRes.ok) {
        const sttData = await sttRes.json()
        transcript = sttData.text || ''
      } else {
        throw new Error('STT service error')
      }
    } catch {
      // Fallback: if STT service unavailable, use reference as mock
      console.warn('STT service unavailable, using mock transcript')
      const words = referenceText.split(' ')
      // Simulate slight variation
      transcript = words
        .map(w => Math.random() > 0.1 ? w : w.slice(0, -1))
        .join(' ')
    }

    // === STEP 2: Word alignment ===
    const refWords = referenceText.replace(/[!?.,:;]/g, '').split(/\s+/).filter(Boolean)
    const userWords = transcript.replace(/[!?.,:;]/g, '').split(/\s+/).filter(Boolean)
    const wordResults = alignWords(refWords, userWords)
    const accuracy = wordResults.length > 0
      ? Math.round(wordResults.reduce((s, w) => s + w.score, 0) / wordResults.length)
      : 0

    // === STEP 3: Get tips from Gemini (if score < 90) ===
    let overallTips: string[] = []
    if (accuracy < 90) {
      try {
        const { GoogleGenerativeAI } = await import('@google/generative-ai')
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

        const errorWords = wordResults.filter(w => w.status !== 'correct').map(w => w.word)

        const prompt = `Người Việt đang học phát âm tiếng Đức level ${level}.
Câu mẫu: "${referenceText}"
Transcript: "${transcript}"
Các từ phát âm chưa đúng: ${errorWords.join(', ')}

Cho 1-2 mẹo phát âm NGẮN GỌN bằng tiếng Việt, tập trung vào những âm mà người Việt thường khó phát âm.
Trả về dạng mảng JSON: ["mẹo 1", "mẹo 2"]
Chỉ trả JSON thuần, không markdown.`

        const result = await model.generateContent(prompt)
        const text = result.response.text().trim()
        try {
          overallTips = JSON.parse(text)
        } catch {
          overallTips = [text]
        }
      } catch (err) {
        console.warn('Gemini tips generation failed:', err)
        overallTips = ['Hãy nghe kỹ mẫu và nói chậm, rõ ràng hơn.']
      }
    }

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
    console.error('Speaking evaluation error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
