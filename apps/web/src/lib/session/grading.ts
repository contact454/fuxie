import type { CheckedSessionAnswer, SessionAnswer } from './contracts'
import type { PrivateSessionQuestion, SessionSnapshot } from './schemas'
import { SessionError } from './errors'
import { SESSION_POLICY } from './config'

export const normalizeSessionText = (text: string) => text.normalize('NFC').trim().toLowerCase()

export function gradeSessionAnswer(question: PrivateSessionQuestion, answer: SessionAnswer, now: Date): CheckedSessionAnswer {
    const { item, expected } = question
    let correct: boolean | null = null
    let answerLabel: string | null = null
    let correctOptionId: string | null = null
    if (item.format === 'INTRO') {
        if (answer.kind !== 'ack') throw new SessionError(400, 'INVALID_ANSWER', 'Acknowledgement required')
    } else if (item.format === 'TYPING') {
        if (answer.kind !== 'text' || expected.kind !== 'text') throw new SessionError(400, 'INVALID_ANSWER', 'Text answer required')
        correct = normalizeSessionText(answer.text) === normalizeSessionText(expected.text)
        answerLabel = expected.text
    } else {
        if (answer.kind !== 'option' || expected.kind !== 'option' || !item.data.options.some(option => option.id === answer.optionId)) {
            throw new SessionError(400, 'INVALID_ANSWER', 'Choose an offered option')
        }
        correct = answer.optionId === expected.optionId
        correctOptionId = expected.optionId
        answerLabel = item.data.options.find(option => option.id === expected.optionId)!.label
    }
    return { questionId: item.id, answer, correct, points: correct ? item.points : 0, checkedAt: now.toISOString(), feedback: { answerLabel, correctOptionId } }
}

export function sessionProgress(snapshot: SessionSnapshot, answers: CheckedSessionAnswer[]) {
    const incorrect = answers.filter(answer => answer.correct === false).length
    const heartsRemaining = Math.max(0, SESSION_POLICY.initialHearts - incorrect)
    const gradedCount = answers.filter(answer => answer.correct !== null).length
    const correctCount = answers.filter(answer => answer.correct === true).length
    const exhausted = heartsRemaining === 0
    const allAnswered = answers.length === snapshot.questions.length && gradedCount > 0
    return {
        heartsRemaining, gradedCount, correctCount, exhausted,
        acknowledgedCount: answers.length - gradedCount,
        baseXpEarned: answers.reduce((sum, answer) => sum + answer.points, 0),
        completionAvailable: exhausted || allAnswered,
        nextQuestionId: exhausted || allAnswered ? null : snapshot.questions[answers.length]!.item.id,
    }
}

export function validateStoredAnswers(snapshot: SessionSnapshot, answers: CheckedSessionAnswer[]) {
    if (answers.length > snapshot.questions.length) throw new SessionError(409, 'SESSION_STATE_INVALID', 'Session state is invalid')
    for (let index = 0; index < answers.length; index++) {
        const answer = answers[index]!
        const question = snapshot.questions[index]!
        if (answer.questionId !== question.item.id || sessionProgress(snapshot, answers.slice(0, index)).completionAvailable) {
            throw new SessionError(409, 'SESSION_STATE_INVALID', 'Session answer order is invalid')
        }
        const grade = gradeSessionAnswer(question, answer.answer, new Date(answer.checkedAt))
        if (JSON.stringify(grade) !== JSON.stringify(answer)) throw new SessionError(409, 'SESSION_STATE_INVALID', 'Session grade is invalid')
    }
}
