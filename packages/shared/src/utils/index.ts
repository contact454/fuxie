import { LEVEL_THRESHOLDS } from '../constants'

/**
 * Calculate user level from total XP
 */
export function getLevelFromXp(xp: number): { level: number; title: string } {
    let result = { level: 1, title: 'Fuchs-Baby 🦊' }
    for (const threshold of LEVEL_THRESHOLDS) {
        if (xp >= threshold.xp) {
            result = { level: threshold.level, title: threshold.title }
        }
    }
    return result
}

/**
 * Get progress percentage to next level
 */
export function getLevelProgress(xp: number): number {
    const thresholds = [...LEVEL_THRESHOLDS]
    for (let i = 0; i < thresholds.length - 1; i++) {
        const current = thresholds[i]
        const next = thresholds[i + 1]
        if (current && next && xp >= current.xp && xp < next.xp) {
            return ((xp - current.xp) / (next.xp - current.xp)) * 100
        }
    }
    return 100
}

/**
 * Format article with word: "der Apfel", "die Katze", "das Haus"
 */
export function formatWordWithArticle(
    word: string,
    gender: 'MASKULIN' | 'FEMININ' | 'NEUTRUM' | null
): string {
    const articles = { MASKULIN: 'der', FEMININ: 'die', NEUTRUM: 'das' }
    if (!gender) return word
    return `${articles[gender]} ${word}`
}

/**
 * Calculate percentage score
 */
export function calculatePercentScore(score: number, maxScore: number): number {
    if (maxScore === 0) return 0
    return Math.round((score / maxScore) * 100 * 10) / 10
}
