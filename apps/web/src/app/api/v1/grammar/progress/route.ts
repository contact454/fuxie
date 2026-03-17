import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@fuxie/database'
import { getServerUser } from '@/lib/auth/server-auth'

export async function POST(req: NextRequest) {
    const serverUser = await getServerUser()
    if (!serverUser) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

    const body = await req.json()
    const { lessonId, score, maxScore, stars } = body

    if (!lessonId || score == null || maxScore == null || stars == null) {
        return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    const existing = await (prisma as any).grammarProgress.findFirst({
        where: { userId: serverUser.userId, lessonId },
    }) as any

    if (existing) {
        if (score > (existing.score ?? 0)) {
            await (prisma as any).grammarProgress.update({
                where: { id: existing.id },
                data: {
                    score,
                    maxScore,
                    stars,
                    completed: true,
                    attempts: (existing.attempts ?? 0) + 1,
                    lastAt: new Date(),
                },
            })
        } else {
            await (prisma as any).grammarProgress.update({
                where: { id: existing.id },
                data: {
                    attempts: (existing.attempts ?? 0) + 1,
                    lastAt: new Date(),
                },
            })
        }
    } else {
        await (prisma as any).grammarProgress.create({
            data: {
                userId: serverUser.userId,
                lessonId,
                score,
                maxScore,
                stars,
                completed: true,
                attempts: 1,
                lastAt: new Date(),
            },
        })
    }

    return NextResponse.json({ ok: true, saved: true })
}
