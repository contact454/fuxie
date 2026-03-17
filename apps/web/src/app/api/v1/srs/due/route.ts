import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@fuxie/database'
import { getServerUser } from '@/lib/auth/server-auth'

export const dynamic = 'force-dynamic'

/**
 * GET /api/v1/srs/due?level=A1&limit=20
 * Returns due SRS cards for review, optionally filtered by CEFR level.
 */
export async function GET(req: NextRequest) {
    try {
        const serverUser = await getServerUser()
        if (!serverUser) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
        }

        const { searchParams } = new URL(req.url)
        const level = searchParams.get('level')
        const limit = parseInt(searchParams.get('limit') ?? '20', 10)

        const now = new Date()

        const where: any = {
            userId: serverUser.userId,
            nextReviewAt: { lte: now },
        }

        if (level) {
            where.vocabularyItem = {
                cefrLevel: level,
            }
        }

        const cards = await prisma.srsCard.findMany({
            where,
            orderBy: { nextReviewAt: 'asc' },
            take: Math.min(limit, 50),
            select: {
                id: true,
                interval: true,
                easeFactor: true,
                state: true,
                vocabularyItem: {
                    select: {
                        word: true,
                        article: true,
                        plural: true,
                        wordType: true,
                        meaningVi: true,
                        meaningEn: true,
                        exampleSentence1: true,
                        exampleTranslation1: true,
                        exampleSentence2: true,
                        exampleTranslation2: true,
                        notes: true,
                        conjugation: true,
                        audioUrl: true,
                        imageUrl: true,
                    },
                },
            },
        })

        return NextResponse.json({ success: true, data: cards })
    } catch (err) {
        console.error('SRS due fetch error:', err)
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
    }
}
