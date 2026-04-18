import { NextRequest, NextResponse } from 'next/server'

import { withGeminiFallback } from '@/lib/ai/gemini-fallback'
import { parseGeminiJson } from '@/lib/ai/parse-json'

const BASIC_LEVELS = new Set(['A1', 'A2', 'B1'])

const CRITERION_NATIVE: Record<string, string> = {
    'Inhalt': 'Nội dung',
    'Kommunikative Angemessenheit': 'Phù hợp giao tiếp',
    'Korrektheit': 'Chính xác ngữ pháp & chính tả',
    'Wortschatz & Strukturen': 'Đa dạng từ vựng & cấu trúc',
    'Kohärenz & Kohäsion': 'Mạch lạc & liên kết',
    'Vollständigkeit': 'Tính đầy đủ',
}

const ERROR_TYPE_NATIVE: Record<string, string> = {
    'Grammatik': 'Ngữ pháp',
    'Rechtschreibung': 'Chính tả',
    'Wortschatz': 'Từ vựng',
    'Syntax': 'Cú pháp',
    'Interpunktion': 'Dấu câu',
}

// ─── POST /api/v1/grade — Grammar & Writing auto-grading ─
export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const { type = 'grammar', cefrLevel = 'A1', uiLanguage = 'vi' } = body

        if (type === 'grammar') return gradeGrammar(body, cefrLevel, uiLanguage)
        if (type === 'writing') return gradeWriting(body, cefrLevel, uiLanguage)
        return NextResponse.json({ success: false, error: 'Unknown type. Use "grammar" or "writing".' }, { status: 400 })
    } catch (err) {
        console.error('[Grade API] Error:', err)
        return NextResponse.json({ success: false, error: 'Grading failed' }, { status: 500 })
    }
}

// ─── Grammar Grading ─────────────────────────────────
async function gradeGrammar(body: { sentence?: string; topic?: string }, cefrLevel: string, uiLanguage: string) {
    const { sentence, topic } = body
    if (!sentence?.trim()) {
        return NextResponse.json({ success: false, error: 'sentence is required' }, { status: 400 })
    }

    const modelName = BASIC_LEVELS.has(cefrLevel) ? 'gemini-2.5-flash' : 'gemini-2.5-flash'
    const prompt = `Analysiere diesen deutschen Satz eines ${cefrLevel}-Lerners${topic ? ` (Thema: ${topic})` : ''}.

Satz: "${sentence}"

Antworte NUR als JSON:
{
  "correct": true/false,
  "correctedSentence": "...",
  "errors": [{ "original": "...", "corrected": "...", "rule": "Grammatikregel", "ruleNative": "Translated rule depending on UI Language", "explanation": "deutsch", "explanationNative": "Translated explanation depending on UI Language ${uiLanguage}" }],
  "analysis": { "sentence_structure": "...", "verb_position": "...", "cases_used": "..." },
  "tip": "Deutsch",
  "tipNative": "Translated tip depending on UI Language ${uiLanguage}"
}`

    const result = await withGeminiFallback(async (client) => {
        const model = client.getGenerativeModel({ model: modelName })
        return await model.generateContent(prompt)
    })
    const text = result.response.text()
    const parsed = parseGeminiJson<any>(text)

    return NextResponse.json({ success: true, data: parsed })
}

// ─── Writing Grading ─────────────────────────────────
async function gradeWriting(body: {
    submittedText?: string
    textType?: string
    register?: string
    situation?: string
    contentPoints?: string[]
    minWords?: number
    maxWords?: number | null
    rubric?: { criteria: Array<{ id: string; name: string; maxScore: number }>; maxScore: number }
}, cefrLevel: string, uiLanguage: string) {
    const { submittedText, textType = 'Brief', register = 'formell', situation = '', contentPoints = [], minWords = 80, maxWords, rubric } = body
    if (!submittedText?.trim()) {
        return NextResponse.json({ success: false, error: 'submittedText is required' }, { status: 400 })
    }

    const defaultRubric = rubric ?? {
        criteria: [
            { id: 'inhalt', name: 'Inhalt', maxScore: 5 },
            { id: 'korrektheit', name: 'Korrektheit', maxScore: 5 },
            { id: 'wortschatz', name: 'Wortschatz & Strukturen', maxScore: 5 },
            { id: 'kohaerenz', name: 'Kohärenz & Kohäsion', maxScore: 5 },
        ],
        maxScore: 20,
    }

    const criteriaList = defaultRubric.criteria.map(cr =>
        `- "${cr.name}" (${uiLanguage === 'vi' ? CRITERION_NATIVE[cr.name] : cr.name}) — max ${cr.maxScore} Punkte`
    ).join('\n')
    const contentPointsList = contentPoints.map((p, i) => `${i + 1}. ${p}`).join('\n')

    const modelName = 'gemma-4-31b-it'
    const prompt = `Du bist ein DaF-Prüfer. Bewerte diesen ${cefrLevel}-Text streng nach Goethe-Institut-Standards.

## Aufgabe
- Niveau: ${cefrLevel} | Texttyp: ${textType} | Register: ${register}
- Situation: ${situation}
- Inhaltspunkte: ${contentPointsList || 'Keine'}
- Wortanzahl: ${minWords}${maxWords ? `–${maxWords}` : '+'} Wörter

## Kriterien
${criteriaList}

## Text
"""
${submittedText}
"""

Antworte NUR als JSON:
{
  "criteria": [{ "id": "...", "name": "...", "score": 0, "maxScore": 5, "reasoning": "deutsch", "reasoningNative": "Translated reasoning depending on UI Language ${uiLanguage}", "suggestions": ["deutsch"], "suggestionsNative": ["Translated suggestions depending on UI Language ${uiLanguage}"] }],
  "overallFeedback": "deutsch",
  "overallFeedbackNative": "Translated feedback depending on UI Language ${uiLanguage}",
  "estimatedLevel": "A1-C2",
  "corrections": [{ "original": "...", "corrected": "...", "type": "Grammatik", "typeNative": "Translated type depending on UI Language ${uiLanguage}", "explanation": "deutsch", "explanationNative": "Translated explanation depending on UI Language ${uiLanguage}" }]
}`

    const result = await withGeminiFallback(async (client) => {
        const model = client.getGenerativeModel({ model: modelName })
        return await model.generateContent(prompt)
    })
    const text = result.response.text()
    const parsed = parseGeminiJson<any>(text)

    const totalScore = (parsed.criteria || []).reduce(
        (sum: number, cr: { score?: number }) => sum + (cr.score || 0), 0
    )

    return NextResponse.json({
        success: true,
        data: {
            totalScore,
            maxScore: defaultRubric.maxScore,
            percentScore: defaultRubric.maxScore > 0 ? Math.round((totalScore / defaultRubric.maxScore) * 100) : 0,
            estimatedLevel: parsed.estimatedLevel || cefrLevel,
            criteria: (parsed.criteria || []).map((cr: { id?: string; name?: string; nameNative?: string; score?: number; maxScore?: number; reasoning?: string; reasoningNative?: string; suggestions?: string[]; suggestionsNative?: string[] }) => ({
                id: cr.id || cr.name,
                name: cr.name,
                nameNative: uiLanguage === 'vi' ? CRITERION_NATIVE[cr.name || ''] : cr.nameNative || cr.name,
                score: cr.score || 0,
                maxScore: cr.maxScore || 5,
                reasoning: cr.reasoning || '',
                reasoningNative: cr.reasoningNative || '',
                suggestions: cr.suggestions || [],
                suggestionsNative: cr.suggestionsNative || [],
            })),
            overallFeedback: parsed.overallFeedback || '',
            overallFeedbackNative: parsed.overallFeedbackNative || '',
            corrections: (parsed.corrections || []).map((cr: { original?: string; corrected?: string; type?: string; typeNative?: string; explanation?: string; explanationNative?: string }) => ({
                original: cr.original || '',
                corrected: cr.corrected || '',
                type: cr.type || 'Grammatik',
                typeNative: uiLanguage === 'vi' ? ERROR_TYPE_NATIVE[cr.type || ''] : cr.typeNative || cr.type,
                explanation: cr.explanation || '',
                explanationNative: cr.explanationNative || '',
            })),
        },
    })
}
