import { z } from 'zod'
import { getModel, getModelForLevel } from './gemini.js'
import { parseGeminiJson } from './parse-json.js'

const CRITERION_NATIVE: Record<string, string> = {
    Inhalt: 'Noi dung',
    'Kommunikative Angemessenheit': 'Phu hop giao tiep',
    Angemessenheit: 'Tinh phu hop',
    Korrektheit: 'Chinh xac ngu phap va chinh ta',
    'Wortschatz & Strukturen': 'Da dang tu vung va cau truc',
    'Kohaerenz & Kohaesion': 'Mach lac va lien ket',
    'Koharenz & Kohasion': 'Mach lac va lien ket',
    Vollstaendigkeit: 'Tinh day du',
    'Formale Richtigkeit': 'Dung hinh thuc',
}

const ERROR_TYPE_NATIVE: Record<string, string> = {
    Grammatik: 'Ngu phap',
    Rechtschreibung: 'Chinh ta',
    Wortschatz: 'Tu vung',
    Syntax: 'Cu phap',
    Interpunktion: 'Dau cau',
    Register: 'Van phong',
    Formatierung: 'Dinh dang',
    Kohaerenz: 'Lien ket',
}

export const writingGradeRequestSchema = z.object({
    cefrLevel: z.string().min(1),
    textType: z.string().min(1),
    register: z.string().min(1),
    situation: z.string().min(1),
    contentPoints: z.array(z.string().min(1)).default([]),
    submittedText: z.string().min(1),
    minWords: z.number().int().nonnegative(),
    maxWords: z.number().int().positive().nullable(),
    uiLanguage: z.string().default('vi'),
    rubric: z.object({
        criteria: z.array(z.object({
            id: z.string().min(1),
            name: z.string().min(1),
            maxScore: z.number().int().positive(),
            weight: z.number().positive().optional(),
        })).min(1),
        maxScore: z.number().int().positive(),
    }),
})

export const grammarGradeRequestSchema = z.object({
    cefrLevel: z.string().min(1),
    sentence: z.string().min(1),
    topic: z.string().optional(),
})

export const speakingGradeRequestSchema = z.object({
    cefrLevel: z.string().default('A1'),
    expectedText: z.string().optional(),
    exerciseType: z.string().default('free-speech'),
    audioBase64: z.string().min(1),
    mimeType: z.string().default('audio/webm'),
})

export type WritingGradeRequest = z.infer<typeof writingGradeRequestSchema>
export type GrammarGradeRequest = z.infer<typeof grammarGradeRequestSchema>
export type SpeakingGradeRequest = z.infer<typeof speakingGradeRequestSchema>
export type GradeJobType = 'writing' | 'grammar' | 'speaking'

export function parseWritingGradeRequest(input: unknown): WritingGradeRequest {
    return writingGradeRequestSchema.parse(input)
}

export function parseGrammarGradeRequest(input: unknown): GrammarGradeRequest {
    return grammarGradeRequestSchema.parse(input)
}

export function parseSpeakingGradeRequest(input: unknown): SpeakingGradeRequest {
    return speakingGradeRequestSchema.parse(input)
}

export async function gradeWritingSubmission(input: WritingGradeRequest) {
    const {
        cefrLevel,
        textType,
        register,
        situation,
        contentPoints,
        submittedText,
        minWords,
        maxWords,
        rubric,
        uiLanguage,
    } = input

    const modelName = getModelForLevel(cefrLevel)
    const model = getModel(modelName)
    console.log(`[Grade/Writing] Level: ${cefrLevel}, Model: ${modelName}`)

    const criteriaList = rubric.criteria.map((criterion) =>
        `- "${criterion.name}" (${uiLanguage === 'vi' ? (CRITERION_NATIVE[criterion.name] ?? criterion.name) : criterion.name}) - max ${criterion.maxScore} Punkte`
    ).join('\n')
    const contentPointsList = contentPoints.map((point, index) => `${index + 1}. ${point}`).join('\n')

    const prompt = `Du bist ein DaF-Pruefer. Bewerte diesen ${cefrLevel}-Text streng nach Goethe-Institut-Standards.

## Aufgabe
- Niveau: ${cefrLevel} | Texttyp: ${textType} | Register: ${register}
- Situation: ${situation}
- Inhaltspunkte: ${contentPointsList || 'Keine'}
- Wortanzahl: ${minWords}${maxWords ? `-${maxWords}` : '+'} Woerter
- Liefere nur valides JSON ohne Markdown.

## Kriterien
${criteriaList}

## Text
"""
${submittedText}
"""

Antworte NUR als JSON:
{
  "criteria": [{ "id": "...", "name": "...", "score": 0, "maxScore": 5, "reasoning": "deutsch", "reasoningNative": "native", "suggestions": ["deutsch"], "suggestionsNative": ["native"] }],
  "overallFeedback": "deutsch",
  "overallFeedbackNative": "native",
  "estimatedLevel": "A1-C2",
  "corrections": [{ "original": "...", "corrected": "...", "type": "Grammatik", "typeNative": "native", "explanation": "deutsch", "explanationNative": "native" }]
}`

    const result = await model.generateContent(prompt)
    const parsed = parseGeminiJson(result.response.text()) as any
    const totalScore = (parsed.criteria || []).reduce(
        (sum: number, criterion: { score?: number }) => sum + (criterion.score || 0),
        0,
    )
    const maxScore = rubric.maxScore

    return {
        totalScore,
        maxScore,
        percentScore: maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0,
        estimatedLevel: parsed.estimatedLevel || cefrLevel,
        criteria: (parsed.criteria || []).map((criterion: any) => ({
            id: criterion.id || criterion.name,
            name: criterion.name,
            nameNative: uiLanguage === 'vi'
                ? (CRITERION_NATIVE[criterion.name] || criterion.nameNative || criterion.name || '')
                : (criterion.nameNative || criterion.name),
            score: criterion.score || 0,
            maxScore: criterion.maxScore || 5,
            reasoning: criterion.reasoning || '',
            reasoningNative: criterion.reasoningNative || '',
            suggestions: criterion.suggestions || [],
            suggestionsNative: criterion.suggestionsNative || [],
        })),
        overallFeedback: parsed.overallFeedback || '',
        overallFeedbackNative: parsed.overallFeedbackNative || '',
        corrections: (parsed.corrections || []).map((correction: any) => ({
            original: correction.original || '',
            corrected: correction.corrected || '',
            type: correction.type || 'Grammatik',
            typeNative: uiLanguage === 'vi'
                ? (correction.typeNative || ERROR_TYPE_NATIVE[correction.type] || 'Ngu phap')
                : (correction.typeNative || correction.type),
            explanation: correction.explanation || '',
            explanationNative: correction.explanationNative || '',
        })),
    }
}

export async function gradeGrammarSentence(input: GrammarGradeRequest) {
    const { cefrLevel, sentence, topic } = input
    const model = getModel(getModelForLevel(cefrLevel))
    const prompt = `Analysiere diesen deutschen Satz eines ${cefrLevel}-Lerners${topic ? ` (Thema: ${topic})` : ''}.

Satz: "${sentence}"

Antworte NUR als JSON:
{
  "correct": true,
  "correctedSentence": "...",
  "errors": [{ "original": "...", "corrected": "...", "rule": "Grammatikregel", "ruleVi": "native", "explanation": "deutsch", "explanationVi": "native" }],
  "analysis": { "sentence_structure": "...", "verb_position": "...", "cases_used": "..." },
  "tip": "Deutsch",
  "tipVi": "native"
}`

    const result = await model.generateContent(prompt)
    return parseGeminiJson(result.response.text())
}

export async function gradeSpeakingAudio(input: SpeakingGradeRequest) {
    const { cefrLevel, expectedText, exerciseType, audioBase64, mimeType } = input
    const model = getModel('gemini-3-flash-preview')
    console.log(`[Grade/Speaking] Level: ${cefrLevel}, Type: ${exerciseType}`)

    const prompt = `Du bist ein DaF-Aussprachetrainer. Hoere dir die Audioaufnahme eines vietnamesischen ${cefrLevel}-Lerners an.

## Kontext
- Niveau: ${cefrLevel}
- Uebungstyp: ${exerciseType}
${expectedText ? `- Erwarteter Text: "${expectedText}"` : ''}

## Aufgabe
1. Transkribiere genau, was der Lerner gesagt hat.
2. Vergleiche es mit dem erwarteten Text, falls vorhanden.
3. Bewerte Aussprache, Fluessigkeit und Genauigkeit.
4. Nenne maximal 3 konkrete Problemstellen.
5. Antworte nur als valides JSON.

{
  "transcript": "gesprochener Text",
  "score": 0,
  "fluency": 0,
  "accuracy": 0,
  "pronunciation": 0,
  "feedback": "Deutsch",
  "feedbackVi": "native",
  "issues": [{ "word": "...", "issue": "Deutsch", "issueVi": "native", "tip": "Hinweis" }],
  "encouragement": "Kurze motivierende Nachricht"
}`

    const result = await model.generateContent([
        prompt,
        {
            inlineData: {
                data: audioBase64,
                mimeType,
            },
        },
    ])
    const parsed = parseGeminiJson(result.response.text()) as any

    return {
        transcript: parsed.transcript || '',
        score: parsed.score ?? 0,
        fluency: parsed.fluency ?? 0,
        accuracy: parsed.accuracy ?? 0,
        pronunciation: parsed.pronunciation ?? 0,
        feedback: parsed.feedback || '',
        feedbackVi: parsed.feedbackVi || '',
        issues: parsed.issues || [],
        encouragement: parsed.encouragement || 'Weiter so!',
    }
}

export async function gradeByType(type: GradeJobType, payload: unknown) {
    switch (type) {
        case 'writing':
            return gradeWritingSubmission(parseWritingGradeRequest(payload))
        case 'grammar':
            return gradeGrammarSentence(parseGrammarGradeRequest(payload))
        case 'speaking':
            return gradeSpeakingAudio(parseSpeakingGradeRequest(payload))
        default:
            throw new Error(`Unsupported grading type: ${String(type)}`)
    }
}
