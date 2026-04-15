/**
 * Text alignment utilities for pronunciation evaluation.
 *
 * Previously copy-pasted between evaluate/route.ts and conversation/route.ts.
 * Now a single source of truth.
 */

export type WordStatus = 'correct' | 'warning' | 'error' | 'missing'

export interface AlignedWord {
    word: string
    status: WordStatus
    score: number
    tip?: string
}

/**
 * Levenshtein edit distance between two strings.
 */
export function editDistance(a: string, b: string): number {
    const dp: number[][] = Array(a.length + 1)
        .fill(null)
        .map(() => Array(b.length + 1).fill(0) as number[])
    for (let i = 0; i <= a.length; i++) dp[i]![0] = i
    for (let j = 0; j <= b.length; j++) dp[0]![j] = j
    for (let i = 1; i <= a.length; i++) {
        for (let j = 1; j <= b.length; j++) {
            dp[i]![j] = Math.min(
                dp[i - 1]![j]! + 1,
                dp[i]![j - 1]! + 1,
                dp[i - 1]![j - 1]! + (a[i - 1] === b[j - 1] ? 0 : 1),
            )
        }
    }
    return dp[a.length]![b.length]!
}

const normalize = (w: string) => w.toLowerCase().replace(/[^a-zäöüß]/g, '')

/**
 * Align reference words against user-spoken words using greedy Levenshtein matching.
 * Returns one entry per reference word with a match status and score.
 */
export function alignWords(refWords: string[], userWords: string[]): AlignedWord[] {
    const results: AlignedWord[] = []
    let userIdx = 0

    for (const refWord of refWords) {
        const refNorm = normalize(refWord)
        if (userIdx < userWords.length) {
            const userNorm = normalize(userWords[userIdx]!)
            if (refNorm === userNorm) {
                results.push({ word: refWord, status: 'correct', score: 100 })
                userIdx++
            } else if (editDistance(refNorm, userNorm) <= 2) {
                results.push({ word: refWord, status: 'warning', score: 70 })
                userIdx++
            } else {
                const futureIdx = userWords.slice(userIdx).findIndex(w => normalize(w) === refNorm)
                if (futureIdx > 0) {
                    userIdx += futureIdx
                    results.push({ word: refWord, status: 'correct', score: 100 })
                    userIdx++
                } else {
                    results.push({ word: refWord, status: 'error', score: 0 })
                    userIdx++
                }
            }
        } else {
            results.push({ word: refWord, status: 'missing', score: 0 })
        }
    }
    return results
}
