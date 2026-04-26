import { z } from 'zod'
import { getModel, getModelForLevel } from './gemini.js'
import { parseGeminiJson } from './parse-json.js'

const CEFR_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const

const baseRequestSchema = z.object({
    level: z.enum(CEFR_LEVELS).default('A1'),
    topic: z.string().trim().min(1).max(120),
    count: z.number().int().min(1).max(10).default(5),
    uiLanguage: z.string().trim().min(2).max(10).default('vi'),
})

const exercisesRequestSchema = baseRequestSchema.extend({
    skill: z.enum(['grammar', 'reading', 'listening', 'vocabulary']).default('grammar'),
})

const vocabularyContextRequestSchema = baseRequestSchema.extend({
    words: z.array(z.string().trim().min(1).max(80)).max(10).optional(),
})

const examTaskRequestSchema = baseRequestSchema.extend({
    board: z.enum(['GOETHE', 'TELC', 'OESD']).default('GOETHE'),
    module: z.enum(['lesen', 'hoeren', 'schreiben', 'sprechen']).default('schreiben'),
})

const generatedExerciseSchema = z.object({
    title: z.string().min(1),
    instruction: z.string().min(1),
    prompt: z.string().min(1),
    answer: z.string().min(1),
    options: z.array(z.string().min(1)).min(3).max(5).optional(),
    explanation: z.string().min(1),
    explanationNative: z.string().min(1),
})

const generatedExercisesSchema = z.object({
    skill: z.string().min(1),
    level: z.enum(CEFR_LEVELS),
    topic: z.string().min(1),
    items: z.array(generatedExerciseSchema).min(1).max(10),
})

const vocabularyContextItemSchema = z.object({
    word: z.string().min(1),
    partOfSpeech: z.string().min(1),
    sentence: z.string().min(1),
    sentenceNative: z.string().min(1),
    highlight: z.string().min(1),
    note: z.string().min(1),
    noteNative: z.string().min(1),
})

const vocabularyContextSchema = z.object({
    level: z.enum(CEFR_LEVELS),
    topic: z.string().min(1),
    items: z.array(vocabularyContextItemSchema).min(1).max(10),
})

const examTaskSchema = z.object({
    board: z.enum(['GOETHE', 'TELC', 'OESD']),
    level: z.enum(CEFR_LEVELS),
    module: z.enum(['lesen', 'hoeren', 'schreiben', 'sprechen']),
    title: z.string().min(1),
    situation: z.string().min(1),
    instructions: z.array(z.string().min(1)).min(2).max(8),
    checklist: z.array(z.string().min(1)).min(2).max(8),
    sampleAnswer: z.string().min(1),
    examinerTip: z.string().min(1),
    examinerTipNative: z.string().min(1),
})

export type GenerateType = 'exercises' | 'vocabulary-context' | 'exam-task'
export type ExercisesRequest = z.infer<typeof exercisesRequestSchema>
export type VocabularyContextRequest = z.infer<typeof vocabularyContextRequestSchema>
export type ExamTaskRequest = z.infer<typeof examTaskRequestSchema>
export type GeneratedExercises = z.infer<typeof generatedExercisesSchema>
export type GeneratedVocabularyContext = z.infer<typeof vocabularyContextSchema>
export type GeneratedExamTask = z.infer<typeof examTaskSchema>

export function parseExercisesRequest(input: unknown): ExercisesRequest {
    return exercisesRequestSchema.parse(input)
}

export function parseVocabularyContextRequest(input: unknown): VocabularyContextRequest {
    return vocabularyContextRequestSchema.parse(input)
}

export function parseExamTaskRequest(input: unknown): ExamTaskRequest {
    return examTaskRequestSchema.parse(input)
}

export async function generateExercises(input: ExercisesRequest): Promise<GeneratedExercises> {
    const model = getModel(getModelForLevel(input.level))
    const prompt = `Du bist ein DaF-Content-Autor fuer Fuxie.

Erzeuge ${input.count} kurze Uebungen fuer ${input.level}-Lerner zum Thema "${input.topic}".
Skill: ${input.skill}
UI language for native explanations: ${input.uiLanguage}

Regeln:
- Niveau strikt an ${input.level} anpassen.
- Jede Aufgabe soll klar, kurz und ohne Mehrdeutigkeit sein.
- Falls Optionen enthalten sind, genau 4 plausible Optionen liefern.
- Erklaerungen zuerst auf Deutsch, dann in ${input.uiLanguage}.

Antworte NUR als JSON:
{
  "skill": "${input.skill}",
  "level": "${input.level}",
  "topic": "${input.topic}",
  "items": [
    {
      "title": "Kurzer Titel",
      "instruction": "Kurze Anweisung",
      "prompt": "Aufgabeninhalt",
      "answer": "Richtige Antwort",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "explanation": "Erklaerung auf Deutsch",
      "explanationNative": "Giai thich bang ${input.uiLanguage}"
    }
  ]
}`

    const result = await model.generateContent(prompt)
    return generatedExercisesSchema.parse(parseGeminiJson(result.response.text()))
}

export async function generateVocabularyContext(
    input: VocabularyContextRequest
): Promise<GeneratedVocabularyContext> {
    const model = getModel(getModelForLevel(input.level))
    const wordsLine = input.words?.length ? `Nutze diese Woerter bevorzugt: ${input.words.join(', ')}.` : ''
    const prompt = `Du bist ein DaF-Vokabeltrainer fuer Fuxie.

Erzeuge ${input.count} Kontextbeispiele fuer ${input.level}-Lerner zum Thema "${input.topic}".
${wordsLine}
UI language for translations: ${input.uiLanguage}

Regeln:
- Saetze muessen natuerlich und alltagsnah sein.
- Highlight muss exakt im deutschen Satz vorkommen.
- Notizen sollen kurz und lehrreich sein.

Antworte NUR als JSON:
{
  "level": "${input.level}",
  "topic": "${input.topic}",
  "items": [
    {
      "word": "Wort oder Phrase",
      "partOfSpeech": "Nomen/Verb/Adjektiv/Redemittel",
      "sentence": "Deutscher Beispielsatz",
      "sentenceNative": "Cau dich bang ${input.uiLanguage}",
      "highlight": "markiertes Wort",
      "note": "Kurzer Lernhinweis auf Deutsch",
      "noteNative": "Ghi chu bang ${input.uiLanguage}"
    }
  ]
}`

    const result = await model.generateContent(prompt)
    return vocabularyContextSchema.parse(parseGeminiJson(result.response.text()))
}

export async function generateExamTask(input: ExamTaskRequest): Promise<GeneratedExamTask> {
    const model = getModel(getModelForLevel(input.level))
    const prompt = `Du bist ein Pruefungsautor fuer Deutschpruefungen.

Erzeuge eine ${input.board}-Aufgabe fuer das Modul ${input.module} auf Niveau ${input.level}.
Thema: "${input.topic}"
UI language for native coach tip: ${input.uiLanguage}

Regeln:
- Aufgabe muss realistisch, pruefungsnah und sofort nutzbar sein.
- Keine Metakommentare.
- Instruktionen und Checkliste sollen handlungsorientiert sein.
- sampleAnswer nur als kurzes Modell, nicht zu lang.

Antworte NUR als JSON:
{
  "board": "${input.board}",
  "level": "${input.level}",
  "module": "${input.module}",
  "title": "Aufgabentitel",
  "situation": "Kurze Pruefungssituation",
  "instructions": ["Punkt 1", "Punkt 2"],
  "checklist": ["Was der Lerner pruefen soll"],
  "sampleAnswer": "Kurzes Modell",
  "examinerTip": "Deutsch",
  "examinerTipNative": "Huong dan bang ${input.uiLanguage}"
}`

    const result = await model.generateContent(prompt)
    return examTaskSchema.parse(parseGeminiJson(result.response.text()))
}

export async function generateContentByType(type: GenerateType, input: unknown) {
    switch (type) {
        case 'exercises':
            return generateExercises(parseExercisesRequest(input))
        case 'vocabulary-context':
            return generateVocabularyContext(parseVocabularyContextRequest(input))
        case 'exam-task':
            return generateExamTask(parseExamTaskRequest(input))
    }
}
