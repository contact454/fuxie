// ===== CEFR Levels =====
export const CEFR_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const
export type CefrLevel = (typeof CEFR_LEVELS)[number]

// ===== Skills =====
export const SKILLS = [
    'HOEREN',
    'LESEN',
    'SCHREIBEN',
    'SPRECHEN',
    'GRAMMATIK',
    'WORTSCHATZ',
] as const
export type Skill = (typeof SKILLS)[number]

export const SKILL_LABELS: Record<Skill, { de: string; vi: string; en: string }> = {
    HOEREN: { de: 'Hören', vi: 'Nghe', en: 'Listening' },
    LESEN: { de: 'Lesen', vi: 'Đọc', en: 'Reading' },
    SCHREIBEN: { de: 'Schreiben', vi: 'Viết', en: 'Writing' },
    SPRECHEN: { de: 'Sprechen', vi: 'Nói', en: 'Speaking' },
    GRAMMATIK: { de: 'Grammatik', vi: 'Ngữ pháp', en: 'Grammar' },
    WORTSCHATZ: { de: 'Wortschatz', vi: 'Từ vựng', en: 'Vocabulary' },
}

// ===== Exam Types =====
export const EXAM_TYPES = ['GOETHE', 'TELC', 'OESD'] as const
export type ExamType = (typeof EXAM_TYPES)[number]

// ===== Exercise Types =====
export const EXERCISE_TYPES = [
    'MULTIPLE_CHOICE',
    'TRUE_FALSE',
    'MATCHING',
    'FILL_IN_BLANK',
    'SPRACHBAUSTEINE',
    'WRITE_EMAIL',
    'WRITE_ESSAY',
    'FILL_FORM',
    'SUMMARY',
    'PRESENTATION',
    'ROLE_PLAY',
    'PLANNING',
    'DISCUSSION',
    'MEDIATION',
    'TEXT_RECONSTRUCTION',
    'DICTATION',
    'PRONUNCIATION',
    'FLASHCARD',
    'SENTENCE_ORDER',
    'WORD_FORMATION',
] as const
export type ExerciseType = (typeof EXERCISE_TYPES)[number]

// ===== Word Types =====
export const WORD_TYPES = [
    'NOMEN',
    'VERB',
    'ADJEKTIV',
    'ADVERB',
    'PRAEPOSITION',
    'KONJUNKTION',
    'PRONOMEN',
    'ARTIKEL',
    'PARTIKEL',
    'NUMERALE',
] as const
export type WordType = (typeof WORD_TYPES)[number]

// ===== Gender (Article) =====
export const GENDERS = ['MASKULIN', 'FEMININ', 'NEUTRUM'] as const
export type Gender = (typeof GENDERS)[number]

export const GENDER_ARTICLES: Record<Gender, string> = {
    MASKULIN: 'der',
    FEMININ: 'die',
    NEUTRUM: 'das',
}

// ===== SRS Rating =====
export const SRS_RATINGS = ['AGAIN', 'HARD', 'GOOD', 'EASY'] as const
export type SrsRating = (typeof SRS_RATINGS)[number]

// ===== Content Status =====
export const CONTENT_STATUSES = ['DRAFT', 'REVIEW', 'PUBLISHED', 'ARCHIVED'] as const
export type ContentStatus = (typeof CONTENT_STATUSES)[number]

// ===== User Role =====
export const USER_ROLES = ['LEARNER', 'ADMIN', 'CONTENT_CREATOR'] as const
export type UserRole = (typeof USER_ROLES)[number]

// ===== SRS Card State =====
export const SRS_CARD_STATES = {
    NEW: 0,
    LEARNING: 1,
    REVIEW: 2,
    RELEARNING: 3,
} as const
export type SrsCardState = (typeof SRS_CARD_STATES)[keyof typeof SRS_CARD_STATES]

// ===== API Response =====
export interface ApiResponse<T = unknown> {
    success: true
    data: T
    meta?: PaginationMeta
}

export interface ApiError {
    success: false
    error: {
        code: string
        message: string
        details?: Array<{ field: string; message: string }>
    }
}

export interface PaginationMeta {
    page: number
    limit: number
    total: number
    totalPages: number
}

// ===== User =====
export interface UserProfile {
    id: string
    displayName: string | null
    avatarUrl: string | null
    nativeLanguage: string
    currentLevel: CefrLevel
    targetLevel: CefrLevel | null
    targetExam: ExamType | null
    totalXp: number
    totalWordsLearned: number
    totalLessonsCompleted: number
    totalStudyMinutes: number
}

// ===== Vocabulary =====
export interface VocabularyItem {
    id: string
    word: string
    article: Gender | null
    plural: string | null
    wordType: WordType
    cefrLevel: CefrLevel
    meaningVi: string
    meaningEn: string | null
    ipa: string | null
    audioUrl: string | null
    exampleSentence1: string | null
    exampleTranslation1: string | null
    exampleSentence2: string | null
    exampleTranslation2: string | null
    notes: string | null
}

// ===== SRS =====
export interface SrsCard {
    id: string
    vocabularyItemId: string | null
    interval: number
    repetitions: number
    easeFactor: number
    nextReviewAt: string
    state: SrsCardState
    totalReviews: number
    totalCorrect: number
    lapseCount: number
}

export interface SrsReviewResult {
    cardId: string
    newInterval: number
    newState: SrsCardState
    nextReviewAt: string
    xpEarned: number
}
