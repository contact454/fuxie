import { Hono } from 'hono'
import { getModel, getModelForLevel } from '../lib/gemini.js'

export const gradeRoutes = new Hono()

// ─── Vietnamese Labels ──────────────────────────────
const CRITERION_VI: Record<string, string> = {
    'Inhalt': 'Nội dung',
    'Kommunikative Angemessenheit': 'Phù hợp giao tiếp',
    'Angemessenheit': 'Tính phù hợp',
    'Korrektheit': 'Chính xác ngữ pháp & chính tả',
    'Wortschatz & Strukturen': 'Đa dạng từ vựng & cấu trúc',
    'Kohaerenz & Kohaesion': 'Mạch lạc & liên kết',
    'Kohärenz & Kohäsion': 'Mạch lạc & liên kết',
    'Vollständigkeit': 'Tính đầy đủ',
    'Formale Richtigkeit': 'Đúng hình thức',
}

const ERROR_TYPE_VI: Record<string, string> = {
    'Grammatik': 'Ngữ pháp',
    'Rechtschreibung': 'Chính tả',
    'Wortschatz': 'Từ vựng',
    'Syntax': 'Cú pháp',
    'Interpunktion': 'Dấu câu',
    'Register': 'Văn phong',
    'Formatierung': 'Định dạng',
    'Kohärenz': 'Liên kết',
}

// ─── CEFR Rubric Descriptors ────────────────────────
function getCefrDescriptors(level: string): string {
    const descriptors: Record<string, string> = {
        'A1': `A1: Einfache Sätze, Grundwortschatz. Inhalt/Korrektheit/Angemessenheit je 0-5 Punkte.`,
        'A2': `A2: Einfache zusammenhängende Sätze. Inhalt/Korrektheit/Angemessenheit je 0-5 Punkte.`,
        'B1': `B1: Zusammenhängende Texte, Nebensätze, Konnektoren. 5 Kriterien (Inhalt, Kommunikative Angemessenheit, Korrektheit, Wortschatz & Strukturen, Kohärenz & Kohäsion) je 0-5 Punkte.`,
        'B2': `B2: Argumentative Texte, komplexe Strukturen, differenzierter Wortschatz. 5 Kriterien je 0-5 Punkte.`,
        'C1': `C1: Anspruchsvolle Texte, präziser Ausdruck, souveräner Stil. 5 Kriterien je 0-5 Punkte.`,
        'C2': `C2: Muttersprachliches Niveau, nuancierte Argumentation. 5 Kriterien je 0-5 Punkte.`,
    }
    return descriptors[level] ?? descriptors['B1']!
}

// ─── POST /writing — Writing Grading ────────────────
gradeRoutes.post('/writing', async (c) => {
    let body: {
        cefrLevel: string
        textType: string
        register: string
        situation: string
        contentPoints: string[]
        submittedText: string
        minWords: number
        maxWords: number | null
        rubric: { criteria: Array<{ id: string; name: string; maxScore: number; weight?: number }>; maxScore: number }
    }

    try {
        body = await c.req.json()
    } catch {
        return c.json({ success: false, error: { code: 'INVALID_BODY', message: 'Invalid JSON body' } }, 400)
    }

    const { cefrLevel, textType, register, situation, contentPoints, submittedText, minWords, maxWords, rubric } = body

    if (!submittedText?.trim()) {
        return c.json({ success: false, error: { code: 'MISSING_TEXT', message: 'submittedText is required' } }, 400)
    }

    try {
        const modelName = getModelForLevel(cefrLevel)
        const model = getModel(modelName)
        console.log(`[Grade/Writing] Level: ${cefrLevel}, Model: ${modelName}`)

        const criteriaList = rubric.criteria.map(cr =>
            `- "${cr.name}" (${CRITERION_VI[cr.name] || ''}) — max ${cr.maxScore} Punkte`
        ).join('\n')
        const contentPointsList = contentPoints.map((p, i) => `${i + 1}. ${p}`).join('\n')
        const cefrDesc = getCefrDescriptors(cefrLevel)

        const prompt = `Du bist ein DaF-Prüfer. Bewerte diesen ${cefrLevel}-Text streng nach Goethe-Institut-Standards.

## Aufgabe
- Niveau: ${cefrLevel} | Texttyp: ${textType} | Register: ${register}
- Situation: ${situation}
- Inhaltspunkte: ${contentPointsList}
- Wortanzahl: ${minWords}${maxWords ? `–${maxWords}` : '+'} Wörter
${cefrDesc}

## Kriterien
${criteriaList}

## Text
"""
${submittedText}
"""

Antworte NUR als JSON (kein Markdown):
{
  "criteria": [{ "id": "...", "name": "...", "score": 0, "maxScore": 5, "reasoning": "deutsch", "reasoningVi": "tiếng việt", "suggestions": ["deutsch"], "suggestionsVi": ["tiếng việt"] }],
  "overallFeedback": "deutsch",
  "overallFeedbackVi": "tiếng việt",
  "estimatedLevel": "A1-C2",
  "corrections": [{ "original": "...", "corrected": "...", "type": "Grammatik", "typeVi": "Ngữ pháp", "explanation": "deutsch", "explanationVi": "tiếng việt" }]
}`

        const result = await model.generateContent(prompt)
        const responseText = result.response.text()

        // Parse JSON — clean up markdown fences if present
        const cleaned = responseText.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim()
        const parsed = JSON.parse(cleaned)

        // Calculate total score
        const totalScore = (parsed.criteria || []).reduce(
            (sum: number, cr: { score?: number }) => sum + (cr.score || 0), 0
        )
        const maxScore = rubric.maxScore

        return c.json({
            success: true,
            data: {
                totalScore,
                maxScore,
                percentScore: maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0,
                estimatedLevel: parsed.estimatedLevel || cefrLevel,
                criteria: (parsed.criteria || []).map((cr: any) => ({
                    id: cr.id || cr.name,
                    name: cr.name,
                    nameVi: CRITERION_VI[cr.name] || cr.nameVi || '',
                    score: cr.score || 0,
                    maxScore: cr.maxScore || 5,
                    reasoning: cr.reasoning || '',
                    reasoningVi: cr.reasoningVi || '',
                    suggestions: cr.suggestions || [],
                    suggestionsVi: cr.suggestionsVi || [],
                })),
                overallFeedback: parsed.overallFeedback || '',
                overallFeedbackVi: parsed.overallFeedbackVi || '',
                corrections: (parsed.corrections || []).map((cr: any) => ({
                    original: cr.original || '',
                    corrected: cr.corrected || '',
                    type: cr.type || 'Grammatik',
                    typeVi: cr.typeVi || ERROR_TYPE_VI[cr.type] || 'Ngữ pháp',
                    explanation: cr.explanation || '',
                    explanationVi: cr.explanationVi || '',
                })),
            },
        })
    } catch (err) {
        console.error('[Grade/Writing] Error:', err)
        return c.json({ success: false, error: { code: 'AI_ERROR', message: 'Writing grading failed' } }, 500)
    }
})

// ─── POST /speaking — Pronunciation Feedback ────────
gradeRoutes.post('/speaking', async (c) => {
    let body: {
        cefrLevel: string
        transcript: string
        expectedText?: string
        exerciseType?: string
    }

    try {
        body = await c.req.json()
    } catch {
        return c.json({ success: false, error: { code: 'INVALID_BODY', message: 'Invalid JSON body' } }, 400)
    }

    const { cefrLevel, transcript, expectedText, exerciseType = 'free-speech' } = body

    if (!transcript?.trim()) {
        return c.json({ success: false, error: { code: 'MISSING_TRANSCRIPT', message: 'transcript is required' } }, 400)
    }

    try {
        const model = getModel('gemini-3-flash-preview')
        console.log(`[Grade/Speaking] Level: ${cefrLevel}, Type: ${exerciseType}`)

        const prompt = `Du bist ein DaF-Aussprachetrainer. Analysiere die Transkription eines ${cefrLevel}-Lerners.

## Kontext
- Niveau: ${cefrLevel}
- Übungstyp: ${exerciseType}
${expectedText ? `- Erwarteter Text: "${expectedText}"` : ''}

## Transkription (vom STT)
"""
${transcript}
"""

Antworte NUR als JSON:
{
  "score": 0-100,
  "fluency": 0-100,
  "accuracy": 0-100,
  "pronunciation": 0-100,
  "feedback": "Gesamtbewertung auf Deutsch",
  "feedbackVi": "Đánh giá tổng thể bằng tiếng Việt",
  "issues": [
    { "word": "...", "issue": "Aussprachehinweis auf Deutsch", "issueVi": "Gợi ý tiếng Việt", "tip": "Phonetischer Tipp" }
  ],
  "encouragement": "Ermutigende Nachricht 🦊"
}`

        const result = await model.generateContent(prompt)
        const responseText = result.response.text()

        const cleaned = responseText.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim()
        const parsed = JSON.parse(cleaned)

        return c.json({
            success: true,
            data: {
                score: parsed.score ?? 0,
                fluency: parsed.fluency ?? 0,
                accuracy: parsed.accuracy ?? 0,
                pronunciation: parsed.pronunciation ?? 0,
                feedback: parsed.feedback || '',
                feedbackVi: parsed.feedbackVi || '',
                issues: parsed.issues || [],
                encouragement: parsed.encouragement || 'Weiter so! 🦊',
            },
        })
    } catch (err) {
        console.error('[Grade/Speaking] Error:', err)
        return c.json({ success: false, error: { code: 'AI_ERROR', message: 'Speaking grading failed' } }, 500)
    }
})

// ─── POST /grammar — Grammar Analysis ───────────────
gradeRoutes.post('/grammar', async (c) => {
    let body: { cefrLevel: string; sentence: string; topic?: string }

    try {
        body = await c.req.json()
    } catch {
        return c.json({ success: false, error: { code: 'INVALID_BODY', message: 'Invalid JSON body' } }, 400)
    }

    const { cefrLevel, sentence, topic } = body

    if (!sentence?.trim()) {
        return c.json({ success: false, error: { code: 'MISSING_SENTENCE', message: 'sentence is required' } }, 400)
    }

    try {
        const model = getModel(getModelForLevel(cefrLevel))

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

        const result = await model.generateContent(prompt)
        const responseText = result.response.text()
        const cleaned = responseText.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim()
        const parsed = JSON.parse(cleaned)

        return c.json({ success: true, data: parsed })
    } catch (err) {
        console.error('[Grade/Grammar] Error:', err)
        return c.json({ success: false, error: { code: 'AI_ERROR', message: 'Grammar analysis failed' } }, 500)
    }
})
