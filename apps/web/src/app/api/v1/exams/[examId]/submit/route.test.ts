import { beforeEach, describe, expect, it, vi } from 'vitest'

const {
    getServerUserMock,
    findAttemptMock,
    findExamMock,
    examAnswerCreateMock,
    examAttemptUpdateMock,
    transactionMock,
    recordLearningActivityMock,
} = vi.hoisted(() => ({
    getServerUserMock: vi.fn(),
    findAttemptMock: vi.fn(),
    findExamMock: vi.fn(),
    examAnswerCreateMock: vi.fn(),
    examAttemptUpdateMock: vi.fn(),
    transactionMock: vi.fn(),
    recordLearningActivityMock: vi.fn(),
}))

vi.mock('@/lib/auth/server-auth', () => ({
    getServerUser: getServerUserMock,
}))

vi.mock('@fuxie/database', () => ({
    prisma: {
        examAttempt: {
            findFirst: findAttemptMock,
        },
        examTemplate: {
            findUnique: findExamMock,
        },
        $transaction: transactionMock,
    },
    Prisma: {},
}))

vi.mock('@/lib/progress/learning-activity', () => ({
    calculateExamXp: vi.fn((passed: boolean) => (passed ? 25 : 10)),
    recordLearningActivity: recordLearningActivityMock,
}))

import { POST } from './route'

describe('POST /api/v1/exams/[examId]/submit', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        getServerUserMock.mockResolvedValue({ userId: 'user-1' })
        findAttemptMock.mockResolvedValue({
            id: 'attempt-1',
            startedAt: new Date('2026-04-23T00:00:00.000Z'),
            completedAt: null,
        })
        findExamMock.mockResolvedValue({
            passingScore: 60,
            totalPoints: 10,
            sections: [
                {
                    id: 'section-1',
                    skill: 'LESEN',
                    totalPoints: 10,
                    tasks: [
                        {
                            id: 'task-1',
                            exerciseType: 'MULTIPLE_CHOICE',
                            contentJson: {
                                items: [
                                    { id: 'i1', correctAnswer: 'A' },
                                    { id: 'i2', correctAnswer: 'B' },
                                ],
                            },
                            maxPoints: 10,
                        },
                    ],
                },
            ],
        })
        examAnswerCreateMock.mockResolvedValue({})
        examAttemptUpdateMock.mockResolvedValue({})
        recordLearningActivityMock.mockResolvedValue({
            xpEarned: 10,
            baseXpEarned: 10,
            streakBonusXp: 0,
            streak: {
                currentStreak: 3,
                isNewDay: false,
            },
        })
        transactionMock.mockImplementation(async (callback: (tx: any) => Promise<any>) =>
            callback({
                examAnswer: {
                    create: examAnswerCreateMock,
                },
                examAttempt: {
                    update: examAttemptUpdateMock,
                },
            })
        )
    })

    it('grades an exam attempt and stores the transaction results', async () => {
        const response = await POST(
            new Request('http://localhost/api/v1/exams/exam-1/submit', {
                method: 'POST',
                body: JSON.stringify({
                    attemptId: 'attempt-1',
                    answers: [
                        {
                            taskId: 'task-1',
                            answerJson: {
                                answers: { i1: 'A', i2: 'C' },
                            },
                        },
                    ],
                }),
                headers: { 'content-type': 'application/json' },
            }),
            { params: Promise.resolve({ examId: 'exam-1' }) }
        )

        expect(response.status).toBe(200)
        await expect(response.json()).resolves.toMatchObject({
            success: true,
            data: {
                attemptId: 'attempt-1',
                totalScore: 5,
                maxScore: 10,
                percentScore: 50,
                passed: false,
                xpEarned: 10,
            },
        })

        expect(examAnswerCreateMock).toHaveBeenCalledOnce()
        expect(examAttemptUpdateMock).toHaveBeenCalledWith(
            expect.objectContaining({
                where: { id: 'attempt-1' },
                data: expect.objectContaining({
                    totalScore: 5,
                    percentScore: 50,
                    passed: false,
                }),
            })
        )
        expect(recordLearningActivityMock).toHaveBeenCalledWith(
            expect.anything(),
            expect.objectContaining({
                userId: 'user-1',
                exerciseId: 'exam-1',
                score: 5,
                maxScore: 10,
                percentScore: 50,
                xpEarned: 10,
                exercisesCompleted: 1,
            })
        )
    })

    it('returns 400 when the attempt was already submitted', async () => {
        findAttemptMock.mockResolvedValueOnce({
            id: 'attempt-1',
            startedAt: new Date('2026-04-23T00:00:00.000Z'),
            completedAt: new Date().toISOString(),
        })

        const response = await POST(
            new Request('http://localhost/api/v1/exams/exam-1/submit', {
                method: 'POST',
                body: JSON.stringify({ attemptId: 'attempt-1', answers: [] }),
                headers: { 'content-type': 'application/json' },
            }),
            { params: Promise.resolve({ examId: 'exam-1' }) }
        )

        expect(response.status).toBe(400)
        await expect(response.json()).resolves.toEqual({
            error: 'Already submitted',
        })
    })
})
