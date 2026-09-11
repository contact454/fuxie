import { randomUUID } from 'node:crypto'
import { prisma, Prisma } from '@fuxie/database'
import type { z } from 'zod'
import { NotFoundError } from '@/lib/auth/middleware'
import { recordLearningActivity } from '@/lib/progress/learning-activity'
import { invalidateLearnerSrsCaches } from '@/lib/progress/cache-invalidation'
import { buildSessionSnapshot } from './builder'
import { SESSION_POLICY, sessionCatalog } from './config'
import { SessionError } from './errors'
import { gradeSessionAnswer, sessionProgress, validateStoredAnswers } from './grading'
import { checkedAnswersSchema, receiptSchema, snapshotSchema, type SessionSnapshot, type startSchema, type checkSchema, type completeSchema } from './schemas'
import type { SessionAttemptView, SessionReceipt, SessionStartResult, SessionStatus } from './contracts'

type Tx = Prisma.TransactionClient
type Attempt = Prisma.SessionAttemptGetPayload<Record<string, never>>
const json = (value: unknown) => value as Prisma.InputJsonValue

async function withLearnerLock<T>(userId: string, callback: (tx: Tx) => Promise<T>): Promise<T> {
    return prisma.$transaction(async tx => {
        // NO KEY UPDATE serializes W03 writers without blocking unrelated FK inserts.
        // Every W03 mutation takes this lock before touching an attempt/source/card.
        const users = await tx.$queryRaw<Array<{ id: string }>>`
            SELECT "id" FROM "users" WHERE "id" = ${userId}
            AND "deletedAt" IS NULL AND "role" = 'LEARNER' FOR NO KEY UPDATE`
        if (users.length !== 1) throw new NotFoundError('User not found')
        return callback(tx)
    }, { maxWait: 5000, timeout: 15000 })
}

function requireRetained(attempt: Attempt, now: Date) {
    if (now.getTime() - attempt.startedAt.getTime() >= SESSION_POLICY.retentionMs) throw new NotFoundError('Attempt not found')
}
async function ownAttempt(db: Tx | typeof prisma, userId: string, id: string, now: Date) {
    const attempt = await db.sessionAttempt.findFirst({ where: { id, userId } })
    if (!attempt) throw new NotFoundError('Attempt not found')
    requireRetained(attempt, now)
    return attempt
}
function requireRevision(attempt: Attempt, revision: string) {
    if (attempt.publicRevision !== revision) throw new SessionError(409, 'SESSION_REVISION_CHANGED', 'Session revision does not match')
}
function requireActive(attempt: Attempt, now: Date) {
    if (attempt.status !== 'IN_PROGRESS' || attempt.expiresAt.getTime() <= now.getTime()) {
        throw new SessionError(410, 'SESSION_ENDED', 'Session is no longer active')
    }
}
function storedState(attempt: Attempt) {
    if (attempt.contractVersion !== 2 || attempt.gradingVersion !== SESSION_POLICY.gradingVersion || attempt.rewardPolicyVersion !== SESSION_POLICY.rewardPolicyVersion) {
        throw new SessionError(426, 'SESSION_UPGRADE_REQUIRED', 'Session version is unavailable')
    }
    const snapshot = snapshotSchema.parse(attempt.snapshotJson)
    const answers = checkedAnswersSchema.parse(attempt.answersJson)
    validateStoredAnswers(snapshot, answers)
    return { snapshot, answers }
}
function publicView(attempt: Attempt, now: Date): SessionAttemptView {
    requireRetained(attempt, now)
    const { snapshot, answers } = storedState(attempt)
    const progress = sessionProgress(snapshot, answers)
    const status: SessionStatus = attempt.status === 'IN_PROGRESS' && attempt.expiresAt.getTime() <= now.getTime() ? 'EXPIRED' : attempt.status
    return {
        state: 'ready', attemptId: attempt.id, contractVersion: 2, publicRevision: attempt.publicRevision,
        level: attempt.level, status, expiresAt: attempt.expiresAt.toISOString(),
        items: snapshot.questions.map(question => question.item), checkedAnswers: answers,
        nextQuestionId: status === 'IN_PROGRESS' ? progress.nextQuestionId : null,
        heartsRemaining: progress.heartsRemaining,
        completionAvailable: status === 'IN_PROGRESS' && progress.completionAvailable,
        receipt: attempt.receiptJson ? receiptSchema.parse(attempt.receiptJson) : null,
    }
}

async function lockAndValidateSources(tx: Tx, snapshot: SessionSnapshot, catalog: ReturnType<typeof sessionCatalog>, verifyVersion: boolean) {
    const ids = [...new Set(snapshot.questions.map(question => question.vocabularyItemId))].sort()
    await tx.$queryRaw(Prisma.sql`SELECT "id" FROM "vocabulary_items" WHERE "id" IN (${Prisma.join(ids)}) ORDER BY "id" FOR SHARE`)
    const sources = await tx.vocabularyItem.findMany({ where: { id: { in: ids } }, select: { id: true, status: true, deletedAt: true, updatedAt: true } })
    const byId = new Map(sources.map(source => [source.id, source]))
    for (const question of snapshot.questions) {
        const source = byId.get(question.vocabularyItemId)
        if (!source || source.status !== 'PUBLISHED' || source.deletedAt || (catalog.ids && !catalog.ids.includes(source.id))) {
            throw new SessionError(409, 'SESSION_CONTENT_WITHDRAWN', 'Session content is no longer available')
        }
        if (verifyVersion && source.updatedAt.toISOString() !== question.vocabularyVersion) {
            throw new SessionError(409, 'SESSION_CONTENT_CHANGED', 'Content changed while starting the session')
        }
    }
}

export async function startSession(userId: string, input: z.infer<typeof startSchema>): Promise<SessionStartResult> {
    const catalog = sessionCatalog()
    const profile = await prisma.userProfile.findUnique({ where: { userId }, select: { currentLevel: true } })
    if (!profile) throw new NotFoundError('User profile not found')
    if (input.requestedLevel && input.requestedLevel !== profile.currentLevel) throw new SessionError(400, 'SESSION_LEVEL_MISMATCH', 'Use the learner profile level')
    // Selection stays outside the write transaction; membership/version is rechecked under locks.
    const snapshot = await buildSessionSnapshot(userId, profile.currentLevel, catalog)
    return withLearnerLock(userId, async tx => {
        const now = new Date()
        const existing = await tx.sessionAttempt.findUnique({ where: { userId_clientStartKey: { userId, clientStartKey: input.clientStartKey } } })
        if (existing) return publicView(existing, now)
        const currentProfile = await tx.userProfile.findUnique({ where: { userId }, select: { currentLevel: true } })
        if (currentProfile?.currentLevel !== profile.currentLevel) throw new SessionError(409, 'SESSION_LEVEL_MISMATCH', 'Learner level changed')
        await tx.sessionAttempt.updateMany({ where: { userId, status: 'IN_PROGRESS', expiresAt: { lte: now } }, data: { status: 'EXPIRED' } })
        const active = await tx.sessionAttempt.findFirst({ where: { userId, status: 'IN_PROGRESS' } })
        if (input.restartAttemptId) {
            const old = await ownAttempt(tx, userId, input.restartAttemptId, now)
            // Restart can replace the referenced expired/abandoned attempt only when no new active one exists.
            if ((active && active.id !== old.id) || old.status === 'COMPLETED' || old.status === 'EXHAUSTED') {
                throw new SessionError(409, 'SESSION_RESTART_CONFLICT', 'Another session has already started')
            }
        } else if (active) {
            return publicView(active, now)
        }
        if (!snapshot) return { state: 'no_content', attemptId: null, items: [] }
        const count = await tx.sessionAttempt.count({ where: { userId, startedAt: { gte: new Date(now.getTime() - SESSION_POLICY.lifetimeMs) } } })
        if (count >= SESSION_POLICY.maxNewAttemptsPerDay) throw new SessionError(429, 'SESSION_DAILY_LIMIT', 'Daily new-session limit reached')
        await lockAndValidateSources(tx, snapshot, catalog, true)
        for (const question of snapshot.questions.filter(q => q.cardId)) {
            const card = await tx.srsCard.findFirst({ where: { id: question.cardId!, userId, vocabularyItemId: question.vocabularyItemId, updatedAt: new Date(question.cardUpdatedAt!) }, select: { id: true } })
            if (!card) throw new SessionError(409, 'SESSION_SRS_CHANGED', 'Review state changed; start again')
        }
        if (active) await tx.sessionAttempt.update({ where: { id: active.id }, data: { status: 'ABANDONED' } })
        const attempt = await tx.sessionAttempt.create({ data: {
            id: randomUUID(), userId, level: profile.currentLevel, clientStartKey: input.clientStartKey,
            contractVersion: 2, gradingVersion: SESSION_POLICY.gradingVersion, rewardPolicyVersion: SESSION_POLICY.rewardPolicyVersion,
            catalogRevision: catalog.revision, publicRevision: randomUUID(), snapshotJson: json(snapshot), answersJson: [],
            startedAt: now, expiresAt: new Date(now.getTime() + SESSION_POLICY.lifetimeMs),
        } })
        return publicView(attempt, now)
    })
}

export async function readSessionAttempt(userId: string, attemptId: string): Promise<SessionAttemptView> {
    sessionCatalog()
    const now = new Date()
    return publicView(await ownAttempt(prisma, userId, attemptId, now), now)
}

export async function checkSessionAnswer(userId: string, attemptId: string, input: z.infer<typeof checkSchema>): Promise<SessionAttemptView> {
    sessionCatalog()
    return withLearnerLock(userId, async tx => {
        const now = new Date()
        const attempt = await ownAttempt(tx, userId, attemptId, now)
        requireRevision(attempt, input.publicRevision)
        const { snapshot, answers } = storedState(attempt)
        const question = snapshot.questions.find(q => q.item.id === input.questionId)
        if (!question) throw new NotFoundError('Question not found')
        const previous = answers.find(answer => answer.questionId === input.questionId)
        if (previous) {
            if (JSON.stringify(previous.answer) !== JSON.stringify(input.answer)) throw new SessionError(409, 'SESSION_ANSWER_LOCKED', 'The first answer is already recorded')
            return publicView(attempt, now)
        }
        requireActive(attempt, now)
        const progress = sessionProgress(snapshot, answers)
        if (progress.nextQuestionId !== input.questionId) throw new SessionError(409, 'SESSION_ANSWER_ORDER', 'Answer the current question first')
        const answer = gradeSessionAnswer(question, input.answer, now)
        const updated = await tx.sessionAttempt.update({ where: { id: attempt.id }, data: { answersJson: json([...answers, answer]) } })
        return publicView(updated, now)
    })
}

export async function completeSession(userId: string, input: z.infer<typeof completeSchema>): Promise<SessionReceipt> {
    const catalog = sessionCatalog()
    const receipt = await withLearnerLock(userId, async tx => {
        const now = new Date()
        const attempt = await ownAttempt(tx, userId, input.attemptId, now)
        requireRevision(attempt, input.publicRevision)
        // A committed receipt wins over work expiry, source withdrawal and every reward path.
        if (attempt.receiptJson) return receiptSchema.parse(attempt.receiptJson)
        requireActive(attempt, now)
        const { snapshot, answers } = storedState(attempt)
        const progress = sessionProgress(snapshot, answers)
        if (!progress.completionAvailable || progress.gradedCount === 0) throw new SessionError(409, 'SESSION_INCOMPLETE', 'Session is not ready to complete')
        if (attempt.catalogRevision !== catalog.revision) throw new SessionError(409, 'SESSION_CONTENT_CHANGED', 'Session catalog changed')
        await lockAndValidateSources(tx, snapshot, catalog, false)
        let srsReviewed = 0
        let wordsLearned = 0
        for (const answer of answers) {
            const question = snapshot.questions.find(q => q.item.id === answer.questionId)!
            if (question.item.format === 'INTRO') continue
            const nextReviewAt = new Date(now.getTime() + (answer.correct ? SESSION_POLICY.lifetimeMs : 0))
            if (question.item.type === 'VOCAB_REVIEW') {
                // W01 invariant retained at the mutation sink; version check also prevents stale overwrite.
                const updated = await tx.srsCard.updateMany({
                    where: { id: question.cardId!, userId, vocabularyItemId: question.vocabularyItemId, updatedAt: new Date(question.cardUpdatedAt!) },
                    data: { nextReviewAt },
                })
                if (updated.count !== 1) throw new SessionError(409, 'SESSION_SRS_CHANGED', 'Review state changed; restart the session')
                srsReviewed++
            } else {
                const created = await tx.srsCard.createMany({ data: [{ userId, vocabularyItemId: question.vocabularyItemId, nextReviewAt, easeFactor: 2.5 }], skipDuplicates: true })
                if (answer.correct) wordsLearned += created.count
            }
        }
        const completionEligible = !progress.exhausted
        const activity = await recordLearningActivity(tx, {
            userId, exerciseId: `session:${attempt.id}`, xpEarned: progress.baseXpEarned,
            score: progress.correctCount, maxScore: progress.gradedCount, percentScore: Math.round(100 * progress.correctCount / progress.gradedCount),
            lessonsCompleted: completionEligible ? 1 : 0, srsReviewed, wordsLearned, updateStreak: completionEligible,
            ...(completionEligible ? { analytics: { actionId: `session:${attempt.id}`, actionType: 'lesson_session' as const, level: attempt.level, source: 'session.complete.v2', metadata: { contract_version: 2, graded_count: progress.gradedCount, correct_count: progress.correctCount } } } : {}),
        })
        const saved = receiptSchema.parse({
            attemptId: attempt.id, status: progress.exhausted ? 'EXHAUSTED' : 'COMPLETED', reason: progress.exhausted ? 'hearts_exhausted' : 'all_answered',
            level: attempt.level, gradedCount: progress.gradedCount, correctCount: progress.correctCount, acknowledgedCount: progress.acknowledgedCount,
            baseXpEarned: progress.baseXpEarned, streakBonusXp: activity.streakBonusXp, xpEarned: activity.xpEarned,
            heartsRemaining: progress.heartsRemaining, completionEligible, wordsLearned, srsReviewed, savedAt: now.toISOString(), contractVersion: 2, gradingVersion: attempt.gradingVersion,
        })
        await tx.sessionAttempt.update({ where: { id: attempt.id }, data: { status: saved.status, receiptJson: json(saved), completedAt: now } })
        return saved
    })
    // Invalidation retries are safe; committed rewards never run again because a cache operation failed.
    await invalidateLearnerSrsCaches(userId).catch(() => {
        console.warn('[Session] Post-commit cache invalidation failed', { attemptId: receipt.attemptId })
    })
    return receipt
}
