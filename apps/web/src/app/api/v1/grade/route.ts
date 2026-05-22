import { NextRequest, NextResponse } from 'next/server'

import { handleApiError } from '@/lib/api/error-handler'
import { enforceRateLimit, getRateLimitNumber, getRequestClientKey } from '@/lib/api/rate-limit'
import { withAuth } from '@/lib/auth/middleware'
import { generateContentOpenRouter, getModelForLevel } from '@/lib/ai/openrouter'
import { parseGeminiJson } from '@/lib/ai/parse-json'

const CRITERION_DICT: Record<string, Record<string, string>> = {
    'vi': {
        'Inhalt': 'Nội dung',
        'Kommunikative Angemessenheit': 'Phù hợp giao tiếp',
        'Korrektheit': 'Chính xác ngữ pháp & chính tả',
        'Wortschatz & Strukturen': 'Đa dạng từ vựng & cấu trúc',
        'Kohärenz & Kohäsion': 'Mạch lạc & liên kết',
        'Vollständigkeit': 'Tính đầy đủ',
        'Aussprache': 'Phát âm & Trọng âm',
        'Flüssigkeit': 'Độ trôi chảy',
    },
    'en': {
        'Inhalt': 'Content',
        'Kommunikative Angemessenheit': 'Communicative Adequacy',
        'Korrektheit': 'Grammar & Spelling Correctness',
        'Wortschatz & Strukturen': 'Vocabulary & Structures',
        'Kohärenz & Kohäsion': 'Coherence & Cohesion',
        'Vollständigkeit': 'Completeness',
        'Aussprache': 'Pronunciation & Accent',
        'Flüssigkeit': 'Fluency',
    },
    'de': {
        'Inhalt': 'Inhalt',
        'Kommunikative Angemessenheit': 'Kommunikative Angemessenheit',
        'Korrektheit': 'Grammatikalische Korrektheit',
        'Wortschatz & Strukturen': 'Wortschatz & Strukturen',
        'Kohärenz & Kohäsion': 'Kohärenz & Kohäsion',
        'Vollständigkeit': 'Vollständigkeit',
        'Aussprache': 'Aussprache & Betonung',
        'Flüssigkeit': 'Flüssigkeit',
    }
}

const ERROR_TYPE_DICT: Record<string, Record<string, string>> = {
    'vi': {
        'Grammatik': 'Ngữ pháp',
        'Rechtschreibung': 'Chính tả',
        'Wortschatz': 'Từ vựng',
        'Syntax': 'Cú pháp',
        'Interpunktion': 'Dấu câu',
        'Aussprache': 'Phát âm',
    },
    'en': {
        'Grammatik': 'Grammar',
        'Rechtschreibung': 'Spelling',
        'Wortschatz': 'Vocabulary',
        'Syntax': 'Syntax',
        'Interpunktion': 'Punctuation',
        'Aussprache': 'Pronunciation',
    },
    'de': {
        'Grammatik': 'Grammatik',
        'Rechtschreibung': 'Rechtschreibung',
        'Wortschatz': 'Wortschatz',
        'Syntax': 'Syntax',
        'Interpunktion': 'Interpunktion',
        'Aussprache': 'Aussprache',
    }
}

function getTranslation(dict: Record<string, Record<string, string>>, lang: string, key: string, fallback: string) {
    const l = dict[lang] || dict['en'] || {};
    return l[key] || fallback;
}

// ─── POST /api/v1/grade — Auto-grading ─
export async function POST(req: NextRequest) {
    try {
        const auth = await withAuth(req)
        const limited = enforceRateLimit(getRequestClientKey(req, auth.userId), {
            keyPrefix: 'web-grade',
            windowMs: getRateLimitNumber('WEB_GRADE_RATE_LIMIT_WINDOW_MS', 60_000),
            max: getRateLimitNumber('WEB_GRADE_RATE_LIMIT_MAX', 20),
        })
        if (limited) {
            return limited
        }

        const body = await req.json()
        const { type = 'grammar', cefrLevel = 'A1', uiLanguage = 'vi' } = body

        if (type === 'grammar') return gradeGrammar(body, cefrLevel, uiLanguage)
        if (type === 'writing') return gradeWriting(body, cefrLevel, uiLanguage)
        if (type === 'speaking') return gradeSpeaking(body, cefrLevel, uiLanguage)
        return NextResponse.json({ success: false, error: 'Unknown type. Use "grammar", "writing", or "speaking".' }, { status: 400 })
    } catch (err) {
        console.error('[Grade API] Error:', err)
        return handleApiError(err)
    }
}

// ─── Grammar Grading ─────────────────────────────────
async function gradeGrammar(body: { exerciseContext?: string; userAnswer?: string; expectedAnswer?: string }, cefrLevel: string, uiLanguage: string) {
    const { exerciseContext, userAnswer, expectedAnswer } = body
    if (!userAnswer?.trim()) {
        return NextResponse.json({ success: false, error: 'userAnswer is required' }, { status: 400 })
    }

    const modelName = getModelForLevel(cefrLevel)
    const prompt = `Du bist ein strenger DaF-Lehrer (Niveau ${cefrLevel}).

Aufgabe/Kontext: "${exerciseContext || 'Kein Kontext'}"
Musterlösung (Erwartet): "${expectedAnswer || 'Keine Musterlösung'}"
Antwort des Schülers: "${userAnswer}"

Ist die Antwort des Schülers im gegebenen Kontext grammatikalisch korrekt und sinnvoll? Auch wenn sie leicht von der Musterlösung abweicht, aber trotzdem stimmt, gib correct: true zurück.

Antworte NUR als JSON:
{
  "correct": true/false,
  "correctedSentence": "Die grammatikalisch korrekte Version der Schülerantwort",
  "errors": [{ "original": "...", "corrected": "...", "rule": "Grammatikregel", "ruleNative": "Translated rule depending on UI Language ${uiLanguage}", "explanation": "deutsch", "explanationNative": "Translated explanation depending on UI Language ${uiLanguage}" }],
  "tip": "Deutsch",
  "tipNative": "Translated tip depending on UI Language ${uiLanguage}"
}`

    const text = await generateContentOpenRouter(prompt, modelName)
    const parsed = parseGeminiJson<any>(text)

    return NextResponse.json({ success: true, data: parsed })
}

// ─── Writing Grading ─────────────────────────────────
export async function gradeWriting(body: {
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
        `- "${cr.name}" (${getTranslation(CRITERION_DICT, uiLanguage, cr.name, cr.name)}) — max ${cr.maxScore} Punkte`
    ).join('\n')
    const contentPointsList = contentPoints.map((p, i) => `${i + 1}. ${p}`).join('\n')

    const modelName = getModelForLevel(cefrLevel)
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

    const text = await generateContentOpenRouter(prompt, modelName)
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
                nameNative: getTranslation(CRITERION_DICT, uiLanguage, cr.name || '', cr.nameNative || cr.name || ''),
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
                typeNative: getTranslation(ERROR_TYPE_DICT, uiLanguage, cr.type || '', cr.typeNative || cr.type || ''),
                explanation: cr.explanation || '',
                explanationNative: cr.explanationNative || '',
            })),
        },
    })
}

// ─── Speaking Grading ─────────────────────────────────
async function gradeSpeaking(body: {
    transcript?: string
    scenario?: string
    rubric?: { criteria: Array<{ id: string; name: string; maxScore: number }>; maxScore: number }
}, cefrLevel: string, uiLanguage: string) {
    const { transcript, scenario = '', rubric } = body
    if (!transcript?.trim()) {
        return NextResponse.json({ success: false, error: 'transcript is required' }, { status: 400 })
    }

    const defaultRubric = rubric ?? {
        criteria: [
            { id: 'inhalt', name: 'Inhalt', maxScore: 5 },
            { id: 'aussprache', name: 'Aussprache', maxScore: 5 },
            { id: 'korrektheit', name: 'Korrektheit', maxScore: 5 },
            { id: 'fluessigkeit', name: 'Flüssigkeit', maxScore: 5 },
        ],
        maxScore: 20,
    }

    const criteriaList = defaultRubric.criteria.map(cr =>
        `- "${cr.name}" (${getTranslation(CRITERION_DICT, uiLanguage, cr.name, cr.name)}) — max ${cr.maxScore} Punkte`
    ).join('\n')

    const modelName = getModelForLevel(cefrLevel)
    const prompt = `Du bist ein DaF-Prüfer. Bewerte diesen ${cefrLevel}-Sprechbeitrag (Transcript) streng nach Goethe-Institut-Standards.

## Aufgabe
- Niveau: ${cefrLevel}
- Situation/Szenario: ${scenario}

## Kriterien
${criteriaList}

## Transcript
"""
${transcript}
"""

Antworte NUR als JSON:
{
  "criteria": [{ "id": "...", "name": "...", "score": 0, "maxScore": 5, "reasoning": "deutsch", "reasoningNative": "Translated reasoning depending on UI Language ${uiLanguage}", "suggestions": ["deutsch"], "suggestionsNative": ["Translated suggestions depending on UI Language ${uiLanguage}"] }],
  "overallFeedback": "deutsch",
  "overallFeedbackNative": "Translated feedback depending on UI Language ${uiLanguage}",
  "estimatedLevel": "A1-C2",
  "corrections": [{ "original": "...", "corrected": "...", "type": "Grammatik oder Aussprache", "typeNative": "Translated type depending on UI Language ${uiLanguage}", "explanation": "deutsch", "explanationNative": "Translated explanation depending on UI Language ${uiLanguage}" }]
}`

    const text = await generateContentOpenRouter(prompt, modelName)
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
                nameNative: getTranslation(CRITERION_DICT, uiLanguage, cr.name || '', cr.nameNative || cr.name || ''),
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
                typeNative: getTranslation(ERROR_TYPE_DICT, uiLanguage, cr.type || '', cr.typeNative || cr.type || ''),
                explanation: cr.explanation || '',
                explanationNative: cr.explanationNative || '',
            })),
        },
    })
}
