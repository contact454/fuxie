// ─── Session Exercise Types ─────────────────────────
// Shared types for session items and exercise components.
// Previously all typed as `any`, now properly typed.

/** Shape of data for vocabulary exercises (new word intro, typing, MC review) */
export interface VocabExerciseData {
    term: string
    meaning: string
    partOfSpeech?: string | null
    article?: string | null
    exampleSentence?: string | null
    audioUrl?: string | null
    imageUrl?: string | null
    /** Only present for review items */
    cardId?: string
    /** Only present for new vocab items */
    itemId?: string
    /** MC options (generated or from builder) */
    options?: string[]
    /** Index of correct option */
    correctIndex?: number
}

/** Shape of data for grammar exercises */
export interface GrammarExerciseData {
    lessonId: string
    topicTitle?: string
    questionDe: string
    questionNative?: string
    options: string[]
    correctIndex: number
    explanation?: string
}

/** Union type for exercise data */
export type ExerciseData = VocabExerciseData | GrammarExerciseData

/** Result of completing a single exercise */
export interface ExerciseResult {
    id: string
    type: 'VOCAB_NEW' | 'VOCAB_REVIEW' | 'GRAMMAR' | 'LISTENING'
    data: ExerciseData
    correct: boolean
}
