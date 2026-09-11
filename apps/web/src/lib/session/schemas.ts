import { z } from 'zod'

export const levelSchema = z.enum(['A1', 'A2', 'B1', 'B2', 'C1', 'C2'])
const id = z.string().min(1).max(128).refine(value => value.trim().length > 0)
const uuid = z.string().uuid()
const text = z.string().refine(value => [...value].length <= 256, 'Answer is too long')
export const answerSchema = z.discriminatedUnion('kind', [
    z.object({ kind: z.literal('option'), optionId: uuid }).strict(),
    z.object({ kind: z.literal('text'), text: text.refine(value => value.trim().length > 0, 'Answer is empty') }).strict(),
    z.object({ kind: z.literal('ack'), acknowledged: z.literal(true) }).strict(),
])
export const startSchema = z.object({
    contractVersion: z.literal(2), clientStartKey: uuid,
    requestedLevel: levelSchema.optional(), restartAttemptId: uuid.optional(),
}).strict()
export const checkSchema = z.object({
    contractVersion: z.literal(2), publicRevision: uuid, questionId: uuid, answer: answerSchema,
}).strict()
export const completeSchema = z.object({
    contractVersion: z.literal(2), attemptId: uuid, publicRevision: uuid,
}).strict()

const itemSchema = z.discriminatedUnion('format', [
    z.object({
        id: uuid, type: z.literal('VOCAB_NEW'), format: z.literal('INTRO'), points: z.literal(0),
        data: z.object({ term: z.string().min(1).max(256), meaning: z.string().min(1).max(1024), article: z.string().nullable(), exampleSentence: z.string().max(2048).nullable(), audioUrl: z.string().max(2048).nullable() }).strict(),
    }).strict(),
    z.object({
        id: uuid, type: z.literal('VOCAB_REVIEW'), format: z.literal('MULTIPLE_CHOICE'), points: z.literal(10),
        data: z.object({ term: z.string().min(1).max(256), options: z.array(z.object({ id: uuid, label: z.string().min(1).max(1024) }).strict()).min(2).max(4) }).strict(),
    }).strict(),
    z.object({
        id: uuid, type: z.enum(['VOCAB_NEW', 'VOCAB_REVIEW']), format: z.literal('TYPING'), points: z.union([z.literal(5), z.literal(10)]),
        data: z.object({ meaning: z.string().min(1).max(1024) }).strict(),
    }).strict(),
])
const questionSchema = z.object({
    item: itemSchema, vocabularyItemId: id, vocabularyVersion: z.string().datetime(),
    cardId: id.nullable(), cardUpdatedAt: z.string().datetime().nullable(),
    expected: answerSchema, dependsOn: uuid.nullable(),
}).strict()
export const snapshotSchema = z.object({
    version: z.literal(2), questions: z.array(questionSchema).min(1).max(20),
}).strict().superRefine((snapshot, ctx) => {
    const seen = new Map<string, z.infer<typeof questionSchema>>()
    const reviewed = new Set<string>()
    let graded = 0
    for (const q of snapshot.questions) {
        const bad = () => ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Invalid session snapshot' })
        if (seen.has(q.item.id)) bad()
        if (q.item.format === 'INTRO') {
            if (q.expected.kind !== 'ack' || q.dependsOn || q.cardId || q.cardUpdatedAt) bad()
        } else {
            graded++
            if (q.item.format === 'TYPING' && (q.expected.kind !== 'text' || q.item.points !== (q.item.type === 'VOCAB_NEW' ? 5 : 10))) bad()
            if (q.item.format === 'MULTIPLE_CHOICE' && (q.expected.kind !== 'option' || !q.item.data.options.some(o => q.expected.kind === 'option' && o.id === q.expected.optionId))) bad()
            if (q.item.type === 'VOCAB_REVIEW') {
                if (!q.cardId || !q.cardUpdatedAt || q.dependsOn || reviewed.has(q.cardId)) bad()
                if (q.cardId) reviewed.add(q.cardId)
            } else {
                const intro = q.dependsOn ? seen.get(q.dependsOn) : undefined
                if (!intro || intro.item.format !== 'INTRO' || intro.vocabularyItemId !== q.vocabularyItemId || q.cardId || q.cardUpdatedAt) bad()
            }
        }
        seen.set(q.item.id, q)
    }
    if (!graded) ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Session needs a graded question' })
})
export type SessionSnapshot = z.infer<typeof snapshotSchema>
export type PrivateSessionQuestion = SessionSnapshot['questions'][number]
export const checkedAnswerSchema = z.object({
    questionId: uuid, answer: answerSchema, correct: z.boolean().nullable(), points: z.number().int().min(0).max(10),
    checkedAt: z.string().datetime(), feedback: z.object({ answerLabel: z.string().nullable(), correctOptionId: uuid.nullable() }).strict(),
}).strict()
export const checkedAnswersSchema = z.array(checkedAnswerSchema).max(20)
export const receiptSchema = z.object({
    attemptId: uuid, status: z.enum(['COMPLETED', 'EXHAUSTED']), reason: z.enum(['all_answered', 'hearts_exhausted']),
    level: levelSchema, gradedCount: z.number().int().nonnegative(), correctCount: z.number().int().nonnegative(), acknowledgedCount: z.number().int().nonnegative(),
    baseXpEarned: z.number().int().nonnegative(), streakBonusXp: z.number().int().nonnegative(), xpEarned: z.number().int().nonnegative(),
    heartsRemaining: z.number().int().min(0).max(5), completionEligible: z.boolean(), wordsLearned: z.number().int().nonnegative(), srsReviewed: z.number().int().nonnegative(),
    savedAt: z.string().datetime(), contractVersion: z.literal(2), gradingVersion: z.string(),
}).strict()
