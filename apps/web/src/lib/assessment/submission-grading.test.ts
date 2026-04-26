import { describe, expect, it } from 'vitest'
import {
    buildDisplayWord,
    calculateVocabularyXp,
    deriveVocabularyCorrectAnswer,
    gradeExamTask,
    gradeListeningSubmission,
    gradeReadingSubmission,
    gradeVocabularySubmission,
} from './submission-grading'

describe('submission grading helpers', () => {
    it('grades reading answers case-insensitively and trims whitespace', () => {
        const result = gradeReadingSubmission(
            [
                {
                    id: 'q1',
                    questionNumber: 1,
                    questionType: 'richtig_falsch',
                    statement: 'A',
                    linkedText: 'TextA',
                    options: null,
                    correctAnswer: 'Richtig',
                    explanation: { de: 'Because' },
                },
                {
                    id: 'q2',
                    questionNumber: 2,
                    questionType: 'mc_abc',
                    statement: 'B',
                    linkedText: null,
                    options: ['a', 'b', 'c'],
                    correctAnswer: 'b',
                    explanation: { de: 'Evidence' },
                },
            ],
            {
                q1: ' richtig ',
                q2: 'A',
            }
        )

        expect(result.score).toBe(1)
        expect(result.totalQuestions).toBe(2)
        expect(result.percentage).toBe(50)
        expect(result.responseData).toEqual([
            { questionId: 'q1', userAnswer: ' richtig ', isCorrect: true },
            { questionId: 'q2', userAnswer: 'A', isCorrect: false },
        ])
    })

    it('uses localized listening explanations when available', () => {
        const result = gradeListeningSubmission(
            [
                {
                    id: 'q1',
                    questionNumber: 1,
                    questionText: 'Was ist richtig?',
                    options: ['a', 'b'],
                    correctAnswer: 'a',
                    explanation: 'Deutsch',
                    explanationTrans: {
                        vi: 'Tiếng Việt',
                    },
                },
            ],
            { q1: 'A' },
            'vi'
        )

        expect(result.score).toBe(1)
        expect(result.questionResults[0]?.explanationNative).toBe('Tiếng Việt')
    })

    it('grades matching exam tasks proportionally', () => {
        const result = gradeExamTask(
            'MATCHING',
            { correctMapping: { a: '1', b: '2', c: '3' } },
            { mapping: { a: '1', b: 'x', c: '3' } },
            9
        )

        expect(result.score).toBe(6)
        expect(result.details).toEqual({
            correct: 2,
            total: 3,
            itemResults: { a: true, b: false, c: true },
        })
    })

    it('returns zero for unsupported exam task types', () => {
        expect(gradeExamTask('ESSAY', {}, {}, 10)).toEqual({
            score: 0,
            details: { error: 'Unsupported exercise type for auto-grading' },
        })
    })

    it('derives vocabulary answers from localized translations and articles', () => {
        const word = {
            word: 'Apfel',
            article: 'MASKULIN',
            translations: { vi: 'quả táo', en: 'apple' },
            exampleSentence1: 'Ich esse einen Apfel.',
        }

        expect(buildDisplayWord(word)).toBe('der Apfel')
        expect(
            deriveVocabularyCorrectAnswer(
                {
                    questionId: '1',
                    answer: '',
                    correctAnswer: '',
                    questionType: 'de_to_native',
                },
                'vi',
                word
            )
        ).toBe('quả táo')
        expect(
            deriveVocabularyCorrectAnswer(
                {
                    questionId: '1',
                    answer: '',
                    correctAnswer: '',
                    questionType: 'native_to_de',
                },
                'vi',
                word
            )
        ).toBe('der Apfel')
    })

    it('calculates vocabulary XP with streak, perfect and speed bonuses', () => {
        const xp = calculateVocabularyXp(
            [{ isCorrect: true }, { isCorrect: true }, { isCorrect: true }],
            6
        )

        expect(xp).toBe(50)
    })

    it('grades vocabulary submissions against the generated answers', () => {
        const wordMap = new Map([
            [
                'word-1',
                {
                    word: 'Apfel',
                    article: 'MASKULIN',
                    translations: { vi: 'quả táo', en: 'apple' },
                    exampleSentence1: 'Ich esse einen Apfel.',
                },
            ],
        ])

        const result = gradeVocabularySubmission(
            [
                {
                    questionId: 'q1',
                    answer: 'quả táo',
                    correctAnswer: '',
                    wordId: 'word-1',
                    questionType: 'de_to_native',
                },
                {
                    questionId: 'q2',
                    answer: 'der Apfel',
                    correctAnswer: '',
                    wordId: 'word-1',
                    questionType: 'native_to_de',
                },
            ],
            'vi',
            wordMap,
            4
        )

        expect(result.correctCount).toBe(2)
        expect(result.accuracy).toBe(100)
        expect(result.xpEarned).toBe(37)
        expect(result.results[0]?.correctAnswer).toBe('quả táo')
        expect(result.results[1]?.correctAnswer).toBe('der Apfel')
    })
})
