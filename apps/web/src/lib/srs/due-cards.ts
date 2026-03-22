import { Prisma, prisma } from '@fuxie/database'

function buildDueWhere(userId: string, now: Date, level?: string): Prisma.SrsCardWhereInput {
    return {
        userId,
        nextReviewAt: { lte: now },
        ...(level
            ? {
                vocabularyItem: {
                    is: {
                        cefrLevel: level as any,
                    },
                },
            }
            : {}),
    }
}

export async function getDueSrsCards(params: {
    userId: string
    now?: Date
    level?: string
    limit?: number
}) {
    const now = params.now ?? new Date()

    return prisma.srsCard.findMany({
        where: buildDueWhere(params.userId, now, params.level),
        orderBy: { nextReviewAt: 'asc' },
        take: Math.min(params.limit ?? 20, 50),
        select: {
            id: true,
            interval: true,
            repetitions: true,
            easeFactor: true,
            nextReviewAt: true,
            state: true,
            totalReviews: true,
            totalCorrect: true,
            lapseCount: true,
            vocabularyItem: {
                select: {
                    id: true,
                    word: true,
                    article: true,
                    plural: true,
                    wordType: true,
                    cefrLevel: true,
                    meaningVi: true,
                    meaningEn: true,
                    ipa: true,
                    audioUrl: true,
                    imageUrl: true,
                    exampleSentence1: true,
                    exampleTranslation1: true,
                    exampleSentence2: true,
                    exampleTranslation2: true,
                    notes: true,
                    conjugation: true,
                },
            },
        },
    })
}

export async function countDueSrsCards(params: {
    userId: string
    now?: Date
    level?: string
}) {
    const now = params.now ?? new Date()

    return prisma.srsCard.count({
        where: buildDueWhere(params.userId, now, params.level),
    })
}
