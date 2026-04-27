import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@fuxie/database'
import { withAuth } from '@/lib/auth/middleware'
import { getDbUserByFirebaseUid } from '@/lib/auth/db-user'
import { handleApiError } from '@/lib/api/error-handler'
import { recordLearningActivity } from '@/lib/progress/learning-activity'
import { invalidateLearnerProgressCaches, invalidateLearnerSrsCaches } from '@/lib/progress/cache-invalidation'

export async function POST(req: NextRequest) {
    try {
        const auth = await withAuth(req)
        const user = await getDbUserByFirebaseUid(auth.userId)
        if (!user) {
            return NextResponse.json(
                { success: false, error: 'User not found' },
                { status: 404 }
            )
        }

        const body = await req.json()
        const { results, totalXp, heartsRemaining, level } = body

        await prisma.$transaction(async (tx) => {
            const reviewResults = results.filter((r: any) => r.type === 'VOCAB_REVIEW')
            for (const r of reviewResults) {
                const cardId = r.data.cardId
                await tx.srsCard.update({
                    where: { id: cardId },
                    data: {
                        nextReviewAt: new Date(Date.now() + (r.correct ? 86400000 : 0)),
                    },
                })
            }

            const newVocabs = results.filter((r: any) => r.type === 'VOCAB_NEW' && r.correct !== false)
            for (const r of newVocabs) {
                const itemId = r.data.itemId
                const existing = await tx.srsCard.findFirst({
                    where: { userId: user.id, vocabularyItemId: itemId },
                })

                if (!existing) {
                    await tx.srsCard.create({
                        data: {
                            userId: user.id,
                            vocabularyItemId: itemId,
                            easeFactor: 2.5,
                            interval: 0,
                            nextReviewAt: new Date(Date.now() + 86400000),
                        },
                    })
                }
            }

            const grammarResults = results.filter((r: any) => r.type === 'GRAMMAR')
            for (const r of grammarResults) {
                if (r.correct) {
                    await tx.grammarProgress.updateMany({
                        where: { userId: user.id, lessonId: r.data.lessonId },
                        data: { completed: true, stars: 3 },
                    })
                }
            }

            await recordLearningActivity(tx, {
                userId: user.id,
                exerciseId: `session:${level ?? 'unknown'}`,
                xpEarned: totalXp || 0,
                lessonsCompleted: 1,
                srsReviewed: reviewResults.length,
                wordsLearned: newVocabs.length,
            })
        })

        const touchedSrs = Array.isArray(results) && results.some((r: any) => r.type === 'VOCAB_REVIEW' || r.type === 'VOCAB_NEW')
        const invalidation = touchedSrs
            ? invalidateLearnerSrsCaches(user.id)
            : invalidateLearnerProgressCaches(user.id)
        invalidation.catch(() => {})

        return NextResponse.json({
            success: true,
            data: {
                heartsRemaining,
                level,
            },
        })
    } catch (err) {
        return handleApiError(err)
    }
}
