import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { calculateReview } from '@fuxie/srs-engine'

const {
    transactionMock,
    queryRawMock,
    attemptFindFirstMock,
    attemptUpdateMock,
    vocabularyFindManyMock,
    srsFindFirstMock,
    srsUpdateManyMock,
    srsCreateMock,
    srsLogCreateMock,
    recordLearningActivityMock,
    invalidateLearnerSrsCachesMock,
} = vi.hoisted(() => ({
    transactionMock: vi.fn(),
    queryRawMock: vi.fn(),
    attemptFindFirstMock: vi.fn(),
    attemptUpdateMock: vi.fn(),
    vocabularyFindManyMock: vi.fn(),
    srsFindFirstMock: vi.fn(),
    srsUpdateManyMock: vi.fn(),
    srsCreateMock: vi.fn(),
    srsLogCreateMock: vi.fn(),
    recordLearningActivityMock: vi.fn(),
    invalidateLearnerSrsCachesMock: vi.fn(),
}))

vi.mock('@fuxie/database', () => ({
    prisma: { $transaction: transactionMock },
    Prisma: {
        sql: (strings: TemplateStringsArray, ...values: unknown[]) => ({ strings, values }),
        join: (values: unknown[]) => values,
    },
}))

vi.mock('@/lib/auth/middleware', () => ({
    NotFoundError: class NotFoundError extends Error {
        constructor(message = 'Resource not found') {
            super(message)
            this.name = 'NotFoundError'
        }
    },
}))

vi.mock('@/lib/progress/learning-activity', () => ({ recordLearningActivity: recordLearningActivityMock }))
vi.mock('@/lib/progress/cache-invalidation', () => ({ invalidateLearnerSrsCaches: invalidateLearnerSrsCachesMock }))
vi.mock('./builder', () => ({ buildSessionSnapshot: vi.fn() }))

import { completeSession } from './attempt-service'
import { SessionError } from './errors'

const now = new Date('2026-09-11T10:00:00.000Z')
const attemptId = '11111111-1111-4111-8111-111111111111'
const questionId = '22222222-2222-4222-8222-222222222222'
const publicRevision = '33333333-3333-4333-8333-333333333333'
const clientStartKey = '44444444-4444-4444-8444-444444444444'
const vocabularyVersion = '2026-09-10T10:00:00.000Z'
const cardUpdatedAt = '2026-09-10T11:00:00.000Z'

function snapshot() {
    return {
        version: 2,
        questions: [{
            item: { id: questionId, type: 'VOCAB_REVIEW', format: 'TYPING', points: 10, data: { meaning: 'xin chào' } },
            vocabularyItemId: 'vocab-1',
            vocabularyVersion,
            cardId: 'card-1',
            cardUpdatedAt,
            expected: { kind: 'text', text: 'Hallo' },
            dependsOn: null,
        }],
    }
}

function checked(correct = true) {
    return [{
        questionId,
        answer: { kind: 'text', text: correct ? 'Hallo' : 'Tschüss' },
        correct,
        points: correct ? 10 : 0,
        checkedAt: '2026-09-11T09:59:00.000Z',
        feedback: { answerLabel: 'Hallo', correctOptionId: null },
    }]
}

function attempt(overrides: Record<string, unknown> = {}) {
    return {
        id: attemptId,
        userId: 'db-user-1',
        level: 'A1',
        clientStartKey,
        status: 'IN_PROGRESS',
        contractVersion: 2,
        gradingVersion: 'vocab-nfc-lower-v1',
        rewardPolicyVersion: 'session-v2-2026-09',
        catalogRevision: 'development-published-v1',
        publicRevision,
        snapshotJson: snapshot(),
        answersJson: checked(true),
        receiptJson: null,
        startedAt: new Date('2026-09-11T09:50:00.000Z'),
        expiresAt: new Date('2026-09-12T09:50:00.000Z'),
        completedAt: null,
        updatedAt: new Date('2026-09-11T09:50:00.000Z'),
        ...overrides,
    }
}

const priorCard = {
    id: 'card-1',
    interval: 0,
    repetitions: 0,
    easeFactor: 2.5,
    state: 0,
    lapseCount: 0,
}

const tx = {
    $queryRaw: queryRawMock,
    sessionAttempt: { findFirst: attemptFindFirstMock, update: attemptUpdateMock },
    vocabularyItem: { findMany: vocabularyFindManyMock },
    srsCard: { findFirst: srsFindFirstMock, updateMany: srsUpdateManyMock, create: srsCreateMock },
    srsReviewLog: { create: srsLogCreateMock },
}

describe('completeSession v2 integrity', () => {
    beforeEach(() => {
        vi.resetAllMocks()
        vi.useFakeTimers({ toFake: ['Date'] })
        vi.setSystemTime(now)
        vi.stubEnv('NODE_ENV', 'test')
        vi.stubEnv('FUXIE_SESSION_V2_ENABLED', '')
        vi.stubEnv('FUXIE_SESSION_CATALOG_IDS', '')
        vi.stubEnv('FUXIE_SESSION_CATALOG_REVISION', '')

        queryRawMock.mockResolvedValue([{ id: 'db-user-1' }])
        attemptFindFirstMock.mockResolvedValue(attempt())
        attemptUpdateMock.mockImplementation(async ({ data }: any) => ({ ...attempt(), ...data }))
        vocabularyFindManyMock.mockResolvedValue([{ id: 'vocab-1', status: 'PUBLISHED', deletedAt: null, updatedAt: new Date(vocabularyVersion) }])
        srsFindFirstMock.mockResolvedValue(priorCard)
        srsUpdateManyMock.mockResolvedValue({ count: 1 })
        srsLogCreateMock.mockResolvedValue({})
        recordLearningActivityMock.mockResolvedValue({ xpEarned: 10, baseXpEarned: 10, streakBonusXp: 0, streak: { currentStreak: 1, isNewDay: true } })
        invalidateLearnerSrsCachesMock.mockResolvedValue(undefined)
        transactionMock.mockImplementation(async (callback: (client: any) => Promise<unknown>) => callback(tx))
    })

    afterEach(() => {
        vi.useRealTimers()
        vi.unstubAllEnvs()
    })

    it.each([
        [true, 'GOOD'],
        [false, 'AGAIN'],
    ] as const)('uses the canonical SRS engine for a session review (correct=%s)', async (correct, rating) => {
        attemptFindFirstMock.mockResolvedValue(attempt({ answersJson: checked(correct) }))
        const expected = calculateReview(priorCard, rating)

        const receipt = await completeSession('db-user-1', { contractVersion: 2, attemptId, publicRevision })

        expect(receipt.srsReviewed).toBe(1)
        expect(srsUpdateManyMock).toHaveBeenCalledWith({
            where: {
                id: 'card-1',
                userId: 'db-user-1',
                vocabularyItemId: 'vocab-1',
                updatedAt: new Date(cardUpdatedAt),
            },
            data: {
                interval: expected.interval,
                repetitions: expected.repetitions,
                easeFactor: expected.easeFactor,
                state: expected.state,
                lapseCount: expected.lapseCount,
                nextReviewAt: expected.nextReviewAt,
                lastReviewedAt: now,
                totalReviews: { increment: 1 },
                totalCorrect: correct ? { increment: 1 } : undefined,
                totalIncorrect: correct ? undefined : { increment: 1 },
            },
        })
        expect(srsLogCreateMock).toHaveBeenCalledWith({
            data: expect.objectContaining({
                userId: 'db-user-1',
                cardId: 'card-1',
                rating,
                prevInterval: priorCard.interval,
                prevEaseFactor: priorCard.easeFactor,
                prevState: priorCard.state,
                newInterval: expected.interval,
                newEaseFactor: expected.easeFactor,
                newState: expected.state,
            }),
        })
    })

    it('returns a committed receipt without re-awarding SRS or progress on duplicate complete', async () => {
        const committed = {
            attemptId,
            status: 'COMPLETED',
            reason: 'all_answered',
            level: 'A1',
            gradedCount: 1,
            correctCount: 1,
            acknowledgedCount: 0,
            baseXpEarned: 10,
            streakBonusXp: 0,
            xpEarned: 10,
            heartsRemaining: 5,
            completionEligible: true,
            wordsLearned: 0,
            srsReviewed: 1,
            savedAt: now.toISOString(),
            contractVersion: 2,
            gradingVersion: 'vocab-nfc-lower-v1',
        }
        attemptFindFirstMock.mockResolvedValue(attempt({ status: 'COMPLETED', receiptJson: committed, completedAt: now }))

        await expect(completeSession('db-user-1', { contractVersion: 2, attemptId, publicRevision })).resolves.toEqual(committed)
        expect(srsFindFirstMock).not.toHaveBeenCalled()
        expect(srsUpdateManyMock).not.toHaveBeenCalled()
        expect(recordLearningActivityMock).not.toHaveBeenCalled()
    })

    it('rejects an incomplete attempt without awarding progress', async () => {
        attemptFindFirstMock.mockResolvedValue(attempt({ answersJson: [] }))

        await expect(completeSession('db-user-1', { contractVersion: 2, attemptId, publicRevision })).rejects.toMatchObject({
            status: 409,
            code: 'SESSION_INCOMPLETE',
        } satisfies Partial<SessionError>)
        expect(srsUpdateManyMock).not.toHaveBeenCalled()
        expect(recordLearningActivityMock).not.toHaveBeenCalled()
    })

    it('rejects a cross-user/missing attempt before any learner mutation', async () => {
        attemptFindFirstMock.mockResolvedValue(null)

        await expect(completeSession('db-user-2', { contractVersion: 2, attemptId, publicRevision })).rejects.toMatchObject({ name: 'NotFoundError' })
        expect(vocabularyFindManyMock).not.toHaveBeenCalled()
        expect(srsUpdateManyMock).not.toHaveBeenCalled()
        expect(recordLearningActivityMock).not.toHaveBeenCalled()
    })
})
