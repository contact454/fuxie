import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

import { withGeminiFallback } from '@/lib/ai/gemini-fallback'

const BASIC_LEVELS = new Set(['A1', 'A2', 'B1'])

// ─── Vietnamese Labels ──────────────────────────────
const CRITERION_VI: Record<string, string> = {
    'Inhalt': 'Nội dung',
    'Kommunikative Angemessenheit': 'Phù hợp giao tiếp',
    'Korrektheit': 'Chính xác ngữ pháp & chính tả',
    'Wortschatz & Strukturen': 'Đa dạng từ vựng & cấu trúc',
    'Kohärenz & Kohäsion': 'Mạch lạc & liên kết',
    'Vollständigkeit': 'Tính đầy đủ',
}

const ERROR_TYPE_VI: Record<string, string> = {
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
        const { type = 'grammar', cefrLevel = 'A1' } = body

        if (type === 'grammar') return gradeGrammar(body, cefrLevel)
        if (type === 'writing') return gradeWriting(body, cefrLevel)
        return NextResponse.json({ success: false, error: 'Unknown type. Use "grammar" or "writing".' }, { status: 400 })
    } catch (err) {
        console.error('[Grade API] Error:', err)
        return NextResponse.json({ success: false, error: 'Grading failed' }, { status: 500 })
    }
}

// ─── Grammar Grading ─────────────────────────────────
async function gradeGrammar(body: { sentence?: string; topic?: string }, cefrLevel: string) {
    const { sentence, topic } = body
    if (!sentence?.trim()) {
        return NextResponse.json({ success: false, error: 'sentence is required' }, { status: 400 })
    }

    const modelName = BASIC_LEVELS.has(cefrLevel) ? 'gemini-2.0-flash-lite' : 'gemini-2.0-flash'
    const prompt = `Analysiere diesen deutschen Satz eines ${cefrLevel}-Lerners${topic ? ` (Thema: ${topic})` : ''}.

Satz: "${sentence}"

Antworte NUR als JSON:
{
  "correct": true/false,
  "correctedSentence": "...",
  "errors": [{ "original": "...", "corrected": "...", "rule": "Grammatikregel", "ruleVi": "Quy tắc ngữ pháp", "explanation": "deutsch", "explanationVi": "tiếng việt" }],
  "analysis": { "sentence_structure": "...", "verb_position": "...", "cases_used": "..." },
  "tip": "Deutsch",
  "tipVi": "Tiếng Việt"
}`

    const result = await withGeminiFallback(async (client) => {
        const model = client.getGenerativeModel({ model: modelName })
        return await model.generateContent(prompt)
    })
    const text = result.response.text()
    const cleaned = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim()
    const parsed = JSON.parse(cleaned)

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
}, cefrLevel: string) {
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
        `- "${cr.name}" (${CRITERION_VI[cr.name] || ''}) — max ${cr.maxScore} Punkte`
    ).join('\n')
    const contentPointsList = contentPoints.map((p, i) => `${i + 1}. ${p}`).join('\n')

    const modelName = BASIC_LEVELS.has(cefrLevel) ? 'gemini-2.0-flash-lite' : 'gemini-2.0-flash'
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
  "criteria": [{ "id": "...", "name": "...", "score": 0, "maxScore": 5, "reasoning": "deutsch", "reasoningVi": "tiếng việt", "suggestions": ["deutsch"], "suggestionsVi": ["tiếng việt"] }],
  "overallFeedback": "deutsch",
  "overallFeedbackVi": "tiếng việt",
  "estimatedLevel": "A1-C2",
  "corrections": [{ "original": "...", "corrected": "...", "type": "Grammatik", "typeVi": "Ngữ pháp", "explanation": "deutsch", "explanationVi": "tiếng việt" }]
}`

    const result = await withGeminiFallback(async (client) => {
        const model = client.getGenerativeModel({ model: modelName })
        return await model.generateContent(prompt)
    })
    const text = result.response.text()
    const cleaned = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim()
    const parsed = JSON.parse(cleaned)

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
            criteria: (parsed.criteria || []).map((cr: { id?: string; name?: string; nameVi?: string; score?: number; maxScore?: number; reasoning?: string; reasoningVi?: string; suggestions?: string[]; suggestionsVi?: string[] }) => ({
                id: cr.id || cr.name,
                name: cr.name,
                nameVi: CRITERION_VI[cr.name || ''] || cr.nameVi || '',
                score: cr.score || 0,
                maxScore: cr.maxScore || 5,
                reasoning: cr.reasoning || '',
                reasoningVi: cr.reasoningVi || '',
                suggestions: cr.suggestions || [],
                suggestionsVi: cr.suggestionsVi || [],
            })),
            overallFeedback: parsed.overallFeedback || '',
            overallFeedbackVi: parsed.overallFeedbackVi || '',
            corrections: (parsed.corrections || []).map((cr: { original?: string; corrected?: string; type?: string; typeVi?: string; explanation?: string; explanationVi?: string }) => ({
                original: cr.original || '',
                corrected: cr.corrected || '',
                type: cr.type || 'Grammatik',
                typeVi: cr.typeVi || ERROR_TYPE_VI[cr.type || ''] || 'Ngữ pháp',
                explanation: cr.explanation || '',
                explanationVi: cr.explanationVi || '',
            })),
        },
    })
}
