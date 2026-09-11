// Public session v2 contracts. Keep database clients, snapshots and answer keys out of this module.
export type SessionLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'
export type SessionStatus = 'IN_PROGRESS' | 'COMPLETED' | 'EXHAUSTED' | 'ABANDONED' | 'EXPIRED'
type ItemBase = { id: string; type: 'VOCAB_NEW' | 'VOCAB_REVIEW'; points: number }
export type PublicSessionItem =
    | (ItemBase & { format: 'INTRO'; data: { term: string; meaning: string; article: string | null; exampleSentence: string | null; audioUrl: string | null } })
    | (ItemBase & { format: 'MULTIPLE_CHOICE'; data: { term: string; options: Array<{ id: string; label: string }> } })
    | (ItemBase & { format: 'TYPING'; data: { meaning: string } })

export type SessionAnswer =
    | { kind: 'option'; optionId: string }
    | { kind: 'text'; text: string }
    | { kind: 'ack'; acknowledged: true }

export interface CheckedSessionAnswer {
    questionId: string
    answer: SessionAnswer
    correct: boolean | null
    points: number
    checkedAt: string
    feedback: { answerLabel: string | null; correctOptionId: string | null }
}

export interface SessionReceipt {
    attemptId: string
    status: 'COMPLETED' | 'EXHAUSTED'
    reason: 'all_answered' | 'hearts_exhausted'
    level: SessionLevel
    gradedCount: number
    correctCount: number
    acknowledgedCount: number
    baseXpEarned: number
    streakBonusXp: number
    xpEarned: number
    heartsRemaining: number
    completionEligible: boolean
    wordsLearned: number
    srsReviewed: number
    savedAt: string
    contractVersion: 2
    gradingVersion: string
}

export interface SessionAttemptView {
    state: 'ready'
    attemptId: string
    contractVersion: 2
    publicRevision: string
    level: SessionLevel
    status: SessionStatus
    expiresAt: string
    items: PublicSessionItem[]
    checkedAnswers: CheckedSessionAnswer[]
    nextQuestionId: string | null
    heartsRemaining: number
    completionAvailable: boolean
    receipt: SessionReceipt | null
}
export type SessionStartResult = SessionAttemptView | { state: 'no_content'; attemptId: null; items: [] }
