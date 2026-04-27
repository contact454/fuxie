import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@fuxie/database'
import { getServerUser } from '@/lib/auth/server-auth'
import { z } from 'zod'
import { calculateSpeakingXp, recordLearningActivity } from '@/lib/progress/learning-activity'
import { invalidateLearnerProgressCaches } from '@/lib/progress/cache-invalidation'

const SpeakingProgressSchema = z.object({
    lessonId: z.string().min(1),
    score: z.number().int().min(0).max(100),
    maxScore: z.number().int().min(1).max(100),
    stars: z.number().int().min(0).max(3),
})

export async function POST(req: NextRequest) {
    try {
        const serverUser = await getServerUser()
        if (!serverUser) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

        const body = await req.json()
        const parsed = SpeakingProgressSchema.safeParse(body)
        if (!parsed.success) {
            return NextResponse.json(
                { error: 'Invalid input', details: parsed.error.flatten().fieldErrors },
                { status: 400 }
            )
        }
        const { lessonId, score, maxScore, stars } = parsed.data
        const percentScore = Math.round((score / maxScore) * 100)

        const result = await prisma.$transaction(async (tx) => {
            const existing = await tx.speakingProgress.findFirst({
                where: { userId: serverUser.userId, lessonId },
                select: { id: true, score: true, attempts: true, completed: true },
            })

            const now = new Date()
            const firstCompletion = !existing?.completed

            await (existing
                ? tx.speakingProgress.update({
                    where: { id: existing.id },
                    data: {
                        ...(score > (existing.score ?? 0) ? { score, maxScore, stars } : {}),
                        completed: true,
                        attempts: (existing.attempts ?? 0) + 1,
                        lastAt: now,
                    },
                })
                : tx.speakingProgress.create({
                    data: {
                        userId: serverUser.userId,
                        lessonId,
                        score,
                        maxScore,
                        stars,
                        completed: true,
                        attempts: 1,
                        lastAt: now,
                    },
                }))

            return recordLearningActivity(tx, {
                userId: serverUser.userId,
                lessonId,
                score,
                maxScore,
                percentScore,
                xpEarned: calculateSpeakingXp(),
                lessonsCompleted: firstCompletion ? 1 : 0,
                exercisesCompleted: firstCompletion ? 0 : 1,
            })
        })

        invalidateLearnerProgressCaches(serverUser.userId).catch(() => {})

        return NextResponse.json({
            ok: true,
            saved: true,
            xpEarned: result.xpEarned,
            streak: result.streak,
        })
    } catch (error) {
        console.error('[Speaking Progress API] Error:', error)
        return NextResponse.json(
            { error: 'Failed to save speaking progress' },
            { status: 500 }
        )
    }
}
