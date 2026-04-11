/**
 * Adaptive Placement Test Engine
 * 
 * Uses a simplified adaptive algorithm:
 * - Starts at A2 level
 * - Correct answer → try harder question
 * - Wrong answer → try easier question
 * - Tracks running score per level
 * - Stops when confidence is high enough OR questions exhausted
 * - Returns estimated CEFR level
 */

import {
    PLACEMENT_QUESTIONS,
    type PlacementQuestion,
    type PlacementLevel,
} from '@/data/placement-questions'

const LEVELS: PlacementLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']
const LEVEL_INDEX: Record<PlacementLevel, number> = {
    A1: 0, A2: 1, B1: 2, B2: 3, C1: 4, C2: 5,
}

export interface PlacementState {
    /** Questions already asked (by id) */
    askedIds: Set<string>
    /** Current target difficulty level */
    currentLevel: PlacementLevel
    /** Score per level: [correct, total] */
    levelScores: Record<PlacementLevel, [number, number]>
    /** Total questions answered */
    totalAnswered: number
    /** Maximum questions to ask */
    maxQuestions: number
}

export interface PlacementResult {
    estimatedLevel: PlacementLevel
    confidence: number // 0-1
    levelBreakdown: Record<PlacementLevel, { correct: number; total: number; pct: number }>
}

/**
 * Create initial placement state
 */
export function createPlacementState(maxQuestions = 18): PlacementState {
    return {
        askedIds: new Set(),
        currentLevel: 'A2', // Start at A2 — assume most users know basics
        levelScores: {
            A1: [0, 0],
            A2: [0, 0],
            B1: [0, 0],
            B2: [0, 0],
            C1: [0, 0],
            C2: [0, 0],
        },
        totalAnswered: 0,
        maxQuestions,
    }
}

/**
 * Get the next question based on current adaptive state
 * Returns null if test should end
 */
export function getNextQuestion(state: PlacementState): PlacementQuestion | null {
    // End condition: reached max questions
    if (state.totalAnswered >= state.maxQuestions) return null

    // End condition: high confidence (answered 3+ at a level with strong signal)
    if (state.totalAnswered >= 8) {
        const conf = calculateConfidence(state)
        if (conf >= 0.8) return null
    }

    // Find available questions at current level
    let candidates = PLACEMENT_QUESTIONS.filter(
        q => q.difficulty === state.currentLevel && !state.askedIds.has(q.id)
    )

    // If no questions at current level, try adjacent levels
    if (candidates.length === 0) {
        const idx = LEVEL_INDEX[state.currentLevel]
        // Try one level up, then one level down
        for (const offset of [1, -1, 2, -2]) {
            const newIdx = idx + offset
            if (newIdx >= 0 && newIdx < LEVELS.length) {
                const adjLevel = LEVELS[newIdx]!
                candidates = PLACEMENT_QUESTIONS.filter(
                    q => q.difficulty === adjLevel && !state.askedIds.has(q.id)
                )
                if (candidates.length > 0) break
            }
        }
    }

    if (candidates.length === 0) return null // No more questions available

    // Prefer variety in skills
    const skills = ['grammar', 'vocabulary', 'reading'] as const
    const answeredSkills = new Set(
        [...state.askedIds]
            .map(id => PLACEMENT_QUESTIONS.find(q => q.id === id)?.skill)
            .filter(Boolean)
    )

    // Try to pick a skill not yet tested at this level
    for (const skill of skills) {
        const skillCandidates = candidates.filter(q => q.skill === skill)
        if (skillCandidates.length > 0 && !answeredSkills.has(skill)) {
            return skillCandidates[Math.floor(Math.random() * skillCandidates.length)]!
        }
    }

    // Otherwise pick random from candidates
    return candidates[Math.floor(Math.random() * candidates.length)]!
}

/**
 * Process an answer and update the adaptive state
 */
export function processAnswer(
    state: PlacementState,
    question: PlacementQuestion,
    selectedIndex: number
): { correct: boolean; newState: PlacementState } {
    const correct = selectedIndex === question.correctIndex
    const level = question.difficulty

    // Update scores
    const [prevCorrect, prevTotal] = state.levelScores[level]
    const newScores = { ...state.levelScores }
    newScores[level] = [prevCorrect + (correct ? 1 : 0), prevTotal + 1]

    // Determine next level (adaptive logic)
    const currentIdx = LEVEL_INDEX[state.currentLevel]
    let nextIdx = currentIdx

    if (correct) {
        // Move up if consistently correct (2+ correct at current level)
        const [c, t] = newScores[state.currentLevel]
        if (c >= 2 && c / t >= 0.7) {
            nextIdx = Math.min(currentIdx + 1, LEVELS.length - 1)
        }
    } else {
        // Move down if struggling (2+ wrong answers)
        const [c, t] = newScores[state.currentLevel]
        if (t >= 2 && c / t < 0.5) {
            nextIdx = Math.max(currentIdx - 1, 0)
        }
    }

    const newState: PlacementState = {
        ...state,
        askedIds: new Set([...state.askedIds, question.id]),
        currentLevel: LEVELS[nextIdx]!,
        levelScores: newScores,
        totalAnswered: state.totalAnswered + 1,
    }

    return { correct, newState }
}

/**
 * Calculate confidence in the current estimate (0-1)
 * Higher confidence = more consistent pattern of correct/incorrect
 */
function calculateConfidence(state: PlacementState): number {
    let totalAnswered = 0
    let highestConsistentLevel = 0

    for (let i = 0; i < LEVELS.length; i++) {
        const [correct, total] = state.levelScores[LEVELS[i]!]
        if (total === 0) continue
        totalAnswered += total

        const pct = correct / total
        if (pct >= 0.6 && total >= 2) {
            highestConsistentLevel = i
        }
    }

    // More questions answered = higher base confidence
    const questionConfidence = Math.min(totalAnswered / 12, 1)

    // Clear boundary between pass/fail levels = higher confidence
    const level = LEVELS[highestConsistentLevel]!
    const nextLevel = LEVELS[highestConsistentLevel + 1]
    let boundaryConfidence = 0.5

    if (nextLevel) {
        const [, nextTotal] = state.levelScores[nextLevel]
        if (nextTotal >= 2) {
            const [nextCorrect] = state.levelScores[nextLevel]
            const nextPct = nextCorrect / nextTotal
            // Clear drop-off from current to next level = high confidence
            boundaryConfidence = nextPct < 0.5 ? 0.9 : 0.5
        }
    } else {
        boundaryConfidence = 0.9 // At C2 with good scores
    }

    return questionConfidence * 0.4 + boundaryConfidence * 0.6
}

/**
 * Calculate the final placement result
 */
export function calculateResult(state: PlacementState): PlacementResult {
    // Build breakdown
    const breakdown: PlacementResult['levelBreakdown'] = {} as PlacementResult['levelBreakdown']
    for (const level of LEVELS) {
        const [correct, total] = state.levelScores[level]
        breakdown[level] = {
            correct,
            total,
            pct: total > 0 ? Math.round((correct / total) * 100) : 0,
        }
    }

    // Find highest level where user scored >= 60%
    let estimatedLevel: PlacementLevel = 'A1'
    for (const level of LEVELS) {
        const { correct, total, pct } = breakdown[level]
        if (total >= 2 && pct >= 60) {
            estimatedLevel = level
        } else if (total >= 2 && pct < 50) {
            break // Stop at first level with clear failure
        }
    }

    return {
        estimatedLevel,
        confidence: calculateConfidence(state),
        levelBreakdown: breakdown,
    }
}
