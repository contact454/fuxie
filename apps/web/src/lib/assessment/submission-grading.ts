export interface ReadingQuestionForGrading {
    id: string
    questionNumber: number
    questionType: string
    statement: string
    linkedText: string | null
    options: unknown
    correctAnswer: string
    explanation: unknown
}

export interface ListeningQuestionForGrading {
    id: string
    questionNumber: number
    questionText: string
    options: unknown
    correctAnswer: string
    explanation: string | null
    explanationTrans?: Record<string, string> | null
}

export interface VocabularyAnswerInput {
    questionId: string
    answer: string
    correctAnswer: string
    wordId?: string
    questionType?: string
}

export interface VocabularyWordInfo {
    word: string
    article: string | null
    translations: Record<string, string> | null
    exampleSentence1: string | null
}

export function gradeReadingSubmission(
    questions: ReadingQuestionForGrading[],
    answers: Record<string, string>
) {
    let score = 0
    const totalQuestions = questions.length
    const responseData: { questionId: string; userAnswer: string; isCorrect: boolean }[] = []
    const questionResults: {
        questionId: string
        questionNumber: number
        questionType: string
        statement: string
        linkedText: string | null
        options: unknown
        userAnswer: string
        correctAnswer: string
        isCorrect: boolean
        explanation: unknown
    }[] = []

    for (const q of questions) {
        const userAnswer = answers[q.id] || ''
        const isCorrect = normalizeAnswer(userAnswer) === normalizeAnswer(q.correctAnswer)
        if (isCorrect) score++

        responseData.push({ questionId: q.id, userAnswer, isCorrect })
        questionResults.push({
            questionId: q.id,
            questionNumber: q.questionNumber,
            questionType: q.questionType,
            statement: q.statement,
            linkedText: q.linkedText,
            options: q.options,
            userAnswer,
            correctAnswer: q.correctAnswer,
            isCorrect,
            explanation: q.explanation,
        })
    }

    const percentage = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0

    return {
        score,
        totalQuestions,
        percentage,
        responseData,
        questionResults,
    }
}

export function gradeListeningSubmission(
    questions: ListeningQuestionForGrading[],
    answers: Record<string, string>,
    locale: string
) {
    let score = 0
    const totalQuestions = questions.length
    const responseData: { questionId: string; userAnswer: string; isCorrect: boolean }[] = []
    const questionResults: {
        questionId: string
        questionNumber: number
        questionText: string
        options: unknown
        userAnswer: string
        correctAnswer: string
        isCorrect: boolean
        explanation: string | null
        explanationNative: string | null
    }[] = []

    for (const q of questions) {
        const userAnswer = answers[q.id] || ''
        const isCorrect = normalizeAnswer(userAnswer) === normalizeAnswer(q.correctAnswer)
        if (isCorrect) score++

        responseData.push({ questionId: q.id, userAnswer, isCorrect })
        questionResults.push({
            questionId: q.id,
            questionNumber: q.questionNumber,
            questionText: q.questionText,
            options: q.options,
            userAnswer,
            correctAnswer: q.correctAnswer,
            isCorrect,
            explanation: q.explanation,
            explanationNative: q.explanationTrans?.[locale] || q.explanation,
        })
    }

    const percentage = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0

    return {
        score,
        totalQuestions,
        percentage,
        responseData,
        questionResults,
    }
}

export function gradeExamTask(
    exerciseType: string,
    contentJson: Record<string, unknown>,
    userAnswer: Record<string, unknown>,
    maxPoints: number
): { score: number; details: Record<string, unknown> } {
    switch (exerciseType) {
        case 'TRUE_FALSE':
        case 'MULTIPLE_CHOICE': {
            const items = (contentJson.items as Array<{ id: string; correctAnswer: string }>) ?? []
            const userAnswers = (userAnswer.answers as Record<string, string>) ?? {}
            let correct = 0
            const itemResults: Record<string, boolean> = {}
            for (const item of items) {
                const isCorrect =
                    userAnswers[item.id]?.toUpperCase() === item.correctAnswer.toUpperCase()
                if (isCorrect) correct++
                itemResults[item.id] = isCorrect
            }
            const pointsPerItem = items.length > 0 ? maxPoints / items.length : 0
            return {
                score: Math.round(correct * pointsPerItem),
                details: { correct, total: items.length, itemResults },
            }
        }

        case 'MATCHING': {
            const correctMapping = (contentJson.correctMapping as Record<string, string>) ?? {}
            const userMapping = (userAnswer.mapping as Record<string, string>) ?? {}
            let correct = 0
            const totalItems = Object.keys(correctMapping).length
            const itemResults: Record<string, boolean> = {}
            for (const [key, correctVal] of Object.entries(correctMapping)) {
                const isCorrect = userMapping[key]?.toUpperCase() === correctVal.toUpperCase()
                if (isCorrect) correct++
                itemResults[key] = isCorrect
            }
            const pointsPerItem = totalItems > 0 ? maxPoints / totalItems : 0
            return {
                score: Math.round(correct * pointsPerItem),
                details: { correct, total: totalItems, itemResults },
            }
        }

        case 'FILL_IN_BLANK': {
            const items = (contentJson.items as Array<{ id: string; correctAnswer: string }>) ?? []
            const userAnswers = (userAnswer.answers as Record<string, string>) ?? {}
            let correct = 0
            const itemResults: Record<string, boolean> = {}
            for (const item of items) {
                const isCorrect = normalizeAnswer(userAnswers[item.id] || '') === normalizeAnswer(item.correctAnswer)
                if (isCorrect) correct++
                itemResults[item.id] = isCorrect
            }
            const pointsPerItem = items.length > 0 ? maxPoints / items.length : 0
            return {
                score: Math.round(correct * pointsPerItem),
                details: { correct, total: items.length, itemResults },
            }
        }

        default:
            return { score: 0, details: { error: 'Unsupported exercise type for auto-grading' } }
    }
}

export function buildDisplayWord(word: { word: string; article: string | null }) {
    if (!word.article) return word.word

    return `${word.article === 'MASKULIN' ? 'der' : word.article === 'FEMININ' ? 'die' : 'das'} ${word.word}`
}

export function deriveVocabularyCorrectAnswer(
    answer: VocabularyAnswerInput,
    locale: string,
    word?: VocabularyWordInfo
) {
    if (!word) {
        return answer.correctAnswer
    }

    switch (answer.questionType) {
        case 'de_to_native':
        case 'pair':
            return word.translations?.[locale] || word.translations?.en || ''
        case 'native_to_de':
        case 'image_to_word':
        case 'audio_to_word':
            return buildDisplayWord(word)
        case 'spelling':
        case 'cloze':
            return word.word
        case 'scramble':
            return word.exampleSentence1 ?? answer.correctAnswer
        default:
            return answer.correctAnswer
    }
}

export function calculateVocabularyXp(
    answers: { isCorrect: boolean }[],
    timeTaken?: number
): number {
    let xp = 0
    let streak = 0

    for (const a of answers) {
        if (a.isCorrect) {
            streak++
            const base = 5
            const streakBonus = Math.min(streak - 1, 2) * 3
            xp += base + streakBonus
        } else {
            streak = 0
        }
    }

    if (answers.length > 0 && answers.every((a) => a.isCorrect)) {
        xp += 20
    }

    if (timeTaken && answers.length > 0 && timeTaken / answers.length < 3) {
        xp += answers.filter((a) => a.isCorrect).length * 2
    }

    return xp
}

export function gradeVocabularySubmission(
    answers: VocabularyAnswerInput[],
    locale: string,
    wordMap: Map<string, VocabularyWordInfo>,
    timeTaken?: number
) {
    const results = answers.map((a) => {
        const correctAnswer = deriveVocabularyCorrectAnswer(
            a,
            locale,
            a.wordId ? wordMap.get(a.wordId) : undefined
        )
        const isCorrect = normalizeAnswer(a.answer) === normalizeAnswer(correctAnswer)

        return {
            questionId: a.questionId,
            userAnswer: a.answer,
            correctAnswer,
            isCorrect,
        }
    })

    const correctCount = results.filter((r) => r.isCorrect).length
    const accuracy = answers.length > 0 ? (correctCount / answers.length) * 100 : 0
    const xpEarned = calculateVocabularyXp(results, timeTaken)

    return {
        results,
        correctCount,
        accuracy,
        xpEarned,
    }
}

function normalizeAnswer(value: string): string {
    return value.trim().toLowerCase()
}
