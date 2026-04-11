import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@fuxie/database'
import { withAuth } from '@/lib/auth/middleware'
import { handleApiError } from '@/lib/api/error-handler'

export async function POST(req: NextRequest) {
    try {
        const auth = await withAuth(req)
        const body = await req.json()
        
        const { results, totalXp, heartsRemaining, level } = body

        await prisma.$transaction(async (tx) => {
            // 1. Process SRS Results from VOCAB_REVIEW
            const reviewResults = results.filter((r: any) => r.type === 'VOCAB_REVIEW')
            for (const r of reviewResults) {
                const cardId = r.data.cardId
                // In a real implementation we'd run the SuperMemo-2 algorithm here 
                // using the 'correct' flag to determine the next interval.
                // For this demo, let's just push nextReviewAt by 1 day if correct
                await tx.srsCard.update({
                    where: { id: cardId },
                    data: {
                        nextReviewAt: new Date(Date.now() + (r.correct ? 86400000 : 0))
                    }
                })
            }

            // 2. Process NEW VOCAB items -> Create SRS Cards
            const newVocabs = results.filter((r: any) => r.type === 'VOCAB_NEW' && r.correct !== false)
            for (const r of newVocabs) {
                const itemId = r.data.itemId
                // Check if card already exists to prevent duplicates
                const existing = await tx.srsCard.findFirst({
                    where: { userId: auth.userId, vocabularyItemId: itemId }
                })
                
                if (!existing) {
                    await tx.srsCard.create({
                        data: {
                            userId: auth.userId,
                            vocabularyItemId: itemId,
                            easeFactor: 2.5,
                            interval: 0,
                            nextReviewAt: new Date(Date.now() + 86400000), // Next day
                        }
                    })
                }
            }

            // 3. Process Grammar Progress
            const grammarResults = results.filter((r: any) => r.type === 'GRAMMAR')
            for (const r of grammarResults) {
                if (r.correct) {
                    // Just mark completed for now
                    await tx.grammarProgress.updateMany({
                        where: { userId: auth.userId, lessonId: r.data.lessonId },
                        data: { completed: true, stars: 3 } // Give 3 stars
                    })
                }
            }

            // 4. Update Profile XP
            if (totalXp && totalXp > 0) {
                await tx.userProfile.update({
                    where: { userId: auth.userId },
                    data: { 
                        totalXp: { increment: totalXp },
                        totalLessonsCompleted: { increment: 1 } 
                    }
                })
            }

            // 5. Update Daily Activity / Streak
            const dateStr = new Date().toISOString().split('T')[0]!
            await tx.dailyActivity.upsert({
                where: {
                    userId_date: {
                        userId: auth.userId,
                        date: dateStr,
                    }
                },
                update: {
                    xpEarned: { increment: totalXp || 0 },
                    lessonsCompleted: { increment: 1 }
                },
                create: {
                    userId: auth.userId,
                    date: dateStr,
                    xpEarned: totalXp || 0,
                    lessonsCompleted: 1
                }
            })
        })

        return NextResponse.json({ success: true })
    } catch (err) {
        return handleApiError(err)
    }
}
