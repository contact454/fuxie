import type { CefrLevel } from '../types'

// ===== CEFR Level Colors =====
export const CEFR_COLORS: Record<CefrLevel, string> = {
    A1: '#4CAF50',
    A2: '#8BC34A',
    B1: '#FF9800',
    B2: '#FF5722',
    C1: '#9C27B0',
    C2: '#673AB7',
}

// ===== XP System =====
export const XP_REWARDS = {
    EXERCISE_EASY: 10,
    EXERCISE_MEDIUM: 20,
    EXERCISE_HARD: 50,
    SRS_CORRECT: 5,
    DAILY_STREAK: 20,
    PERFECT_SCORE: 2, // multiplier
    MODULE_COMPLETE: 200,
    EXAM_PASS: 500,
} as const

export const LEVEL_THRESHOLDS = [
    { level: 1, xp: 0, title: 'Fuchs-Baby 🦊' },
    { level: 10, xp: 2000, title: 'Fuchs-Baby 🦊' },
    { level: 11, xp: 2000, title: 'Junger Fuchs' },
    { level: 20, xp: 6000, title: 'Junger Fuchs' },
    { level: 21, xp: 6000, title: 'Schlauer Fuchs' },
    { level: 30, xp: 15000, title: 'Schlauer Fuchs' },
    { level: 31, xp: 15000, title: 'Meister Fuchs' },
    { level: 40, xp: 30000, title: 'Meister Fuchs' },
    { level: 41, xp: 30000, title: 'Fuchs-Legende' },
    { level: 50, xp: 50000, title: 'Fuchs-Legende' },
] as const

// ===== SRS Defaults =====
export const SRS_DEFAULTS = {
    INITIAL_EASE_FACTOR: 2.5,
    MIN_EASE_FACTOR: 1.3,
    EASE_BONUS_EASY: 0.15,
    EASE_PENALTY_AGAIN: 0.2,
    GRADUATING_INTERVAL: 1,
    EASY_INTERVAL: 4,
    MAX_INTERVAL: 365,
    NEW_CARDS_PER_DAY: 20,
    REVIEWS_PER_DAY: 100,
} as const

// ===== Brand Colors =====
export const BRAND = {
    PRIMARY: '#FF6B35',
    SECONDARY: '#004E89',
    ACCENT: '#2EC4B6',
} as const

// ===== Google Cloud TTS Voices =====
export const TTS_VOICES = {
    FEMALE_1: 'de-DE-Wavenet-A',
    FEMALE_2: 'de-DE-Wavenet-C',
    MALE_1: 'de-DE-Wavenet-B',
    MALE_2: 'de-DE-Wavenet-D',
    FEMALE_NEURAL: 'de-DE-Neural2-C',
    MALE_NEURAL: 'de-DE-Neural2-D',
} as const

// ===== Rate Limits =====
export const RATE_LIMITS = {
    AUTH: { limit: 10, windowSeconds: 60 },
    CONTENT_READ: { limit: 100, windowSeconds: 60 },
    SRS_REVIEW: { limit: 200, windowSeconds: 60 },
    EXERCISE_SUBMIT: { limit: 60, windowSeconds: 60 },
    AI_CHAT: { limit: 20, windowSeconds: 60 },
    AI_GRADING: { limit: 10, windowSeconds: 60 },
    AUDIO_TTS: { limit: 30, windowSeconds: 60 },
    AUDIO_PRONUNCIATION: { limit: 10, windowSeconds: 60 },
} as const
