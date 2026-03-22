import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@fuxie/database'
import { getServerUser } from '@/lib/auth/server-auth'
import { z } from 'zod'

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

        const result = await prisma.$transaction(async (tx) => {
            const existing = await (tx as any).speakingProgress.findFirst({
                where: { userId: serverUser.userId, lessonId },
                select: { id: true, score: true, attempts: true },
            })

            const now = new Date()

            if (existing) {
                const shouldUpdateScore = score > (existing.score ?? 0)
                return await (tx as any).speakingProgress.update({
                    where: { id: existing.id },
                    data: {
                        ...(shouldUpdateScore ? { score, maxScore, stars } : {}),
                        completed: true,
                        attempts: (existing.attempts ?? 0) + 1,
                        lastAt: now,
                    },
                })
            } else {
                return await (tx as any).speakingProgress.create({
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
                })
            }
        })

        return NextResponse.json({ ok: true, saved: true })
    } catch (error) {
        console.error('[Speaking Progress API] Error:', error)
        return NextResponse.json(
            { error: 'Failed to save speaking progress' },
            { status: 500 }
        )
    }
}
