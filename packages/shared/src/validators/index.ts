import { z } from 'zod'
import {
    CEFR_LEVELS,
    SKILLS,
    EXAM_TYPES,
    SRS_RATINGS,
    EXERCISE_TYPES,
    WORD_TYPES,
    GENDERS,
    CONTENT_STATUSES,
} from '../types'

// ===== Enum Schemas =====
export const CefrLevelSchema = z.enum(CEFR_LEVELS)
export const SkillSchema = z.enum(SKILLS)
export const ExamTypeSchema = z.enum(EXAM_TYPES)
export const SrsRatingSchema = z.enum(SRS_RATINGS)
export const ExerciseTypeSchema = z.enum(EXERCISE_TYPES)
export const WordTypeSchema = z.enum(WORD_TYPES)
export const GenderSchema = z.enum(GENDERS)
export const ContentStatusSchema = z.enum(CONTENT_STATUSES)

// ===== Common Schemas =====
export const PaginationSchema = z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
})

export const SortSchema = z.string().regex(/^[a-zA-Z]+:(asc|desc)$/).optional()

// ===== Auth Schemas =====
export const RegisterSchema = z.object({
    firebaseUid: z.string().min(1),
    email: z.string().email(),
    displayName: z.string().min(1).max(100).optional(),
    nativeLanguage: z.string().length(2).default('vi'),
    targetLevel: CefrLevelSchema.optional(),
    targetExam: ExamTypeSchema.optional(),
})

// ===== Profile Schemas =====
export const UpdateProfileSchema = z.object({
    displayName: z.string().min(1).max(100).optional(),
    targetLevel: CefrLevelSchema.optional(),
    targetExam: ExamTypeSchema.optional(),
    targetExamDate: z.string().datetime().optional(),
    studyGoalMinutes: z.number().int().min(5).max(120).optional(),
    nativeLanguage: z.string().length(2).optional(),
})

export const UpdateSettingsSchema = z.object({
    darkMode: z.boolean().optional(),
    soundEnabled: z.boolean().optional(),
    notificationsEnabled: z.boolean().optional(),
    srsNewCardsPerDay: z.number().int().min(1).max(100).optional(),
    srsReviewsPerDay: z.number().int().min(10).max(500).optional(),
    autoPlayAudio: z.boolean().optional(),
    showTranslation: z.boolean().optional(),
})

// ===== SRS Schemas =====
export const SrsReviewSchema = z.object({
    cardId: z.string().uuid(),
    rating: SrsRatingSchema,
    responseTimeMs: z.number().int().positive().optional(),
})

export const CreateSrsCardSchema = z.object({
    vocabularyItemId: z.string().uuid(),
})

// ===== Exercise Schemas =====
export const ExerciseSubmitSchema = z.object({
    answer: z.union([
        z.number(),
        z.string(),
        z.boolean(),
        z.record(z.unknown()),
        z.array(z.unknown()),
    ]),
    timeSpentSeconds: z.number().int().positive().optional(),
})

// ===== Content Filter Schemas =====
export const ContentFilterSchema = z.object({
    ...PaginationSchema.shape,
    cefrLevel: CefrLevelSchema.optional(),
    skill: SkillSchema.optional(),
    examType: ExamTypeSchema.optional(),
    search: z.string().max(100).optional(),
    sort: SortSchema,
})

export const VocabularyFilterSchema = z.object({
    ...PaginationSchema.shape,
    cefrLevel: CefrLevelSchema.optional(),
    wordType: WordTypeSchema.optional(),
    themeSlug: z.string().optional(),
    search: z.string().max(100).optional(),
})

// ===== AI Chat Schema =====
export const AiChatSchema = z.object({
    conversationId: z.string().uuid().optional(),
    message: z.string().min(1).max(5000),
    cefrLevel: CefrLevelSchema,
})

// ===== Exam Schema =====
export const ExamSubmitSchema = z.object({
    sectionId: z.string().uuid(),
    answers: z.array(
        z.object({
            taskId: z.string().uuid(),
            answer: z.union([z.string(), z.number(), z.record(z.unknown()), z.array(z.unknown())]),
        })
    ),
})
