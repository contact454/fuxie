import { redirect } from 'next/navigation'
import { prisma } from '@fuxie/database'
import { getServerUser } from '@/lib/auth/server-auth'
import { ReviewClient } from '@/components/srs/review-client'

export const dynamic = 'force-dynamic'

export const metadata = {
    title: 'Fuxie 🦊 — Wiederholen',
    description: 'SRS Flashcard Review — Lerne Vokabeln mit Karteikarten',
}

type CefrLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'

async function getThemesForLevel(userId: string, cefrLevel: CefrLevel) {
    const themes = await prisma.vocabularyTheme.findMany({
        where: { cefrLevel },
        orderBy: { sortOrder: 'asc' },
        select: {
            id: true,
            slug: true,
            name: true,
            nameVi: true,
            cefrLevel: true,
            imageUrl: true,
            _count: { select: { items: true } },
        },
    })

    // Get SRS counts per theme
    const now = new Date()
    const cards = await prisma.srsCard.findMany({
        where: { userId },
        select: {
            vocabularyItem: { select: { themeId: true, cefrLevel: true } },
            state: true,
            nextReviewAt: true,
        },
    })

    const srsMap: Record<string, { total: number; learned: number; due: number }> = {}
    for (const card of cards) {
        const tid = card.vocabularyItem?.themeId
        if (!tid || card.vocabularyItem?.cefrLevel !== cefrLevel) continue
        if (!srsMap[tid]) srsMap[tid] = { total: 0, learned: 0, due: 0 }
        srsMap[tid].total++
        if (card.state === 2) srsMap[tid].learned++
        if (card.nextReviewAt <= now) srsMap[tid].due++
    }

    return themes.map(t => ({
        id: t.id,
        slug: t.slug,
        name: t.name,
        nameVi: t.nameVi,
        cefrLevel: t.cefrLevel,
        imageUrl: t.imageUrl,
        wordCount: t._count.items,
        srsProgress: srsMap[t.id] ?? { total: 0, learned: 0, due: 0 },
    }))
}

async function getAvailableLevels(): Promise<CefrLevel[]> {
    const levels = await prisma.vocabularyTheme.findMany({
        select: { cefrLevel: true },
        distinct: ['cefrLevel'],
        orderBy: { cefrLevel: 'asc' },
    })
    return levels.map(l => l.cefrLevel as CefrLevel)
}

async function getDueCounts(userId: string) {
    const now = new Date()
    const cards = await prisma.srsCard.findMany({
        where: { userId, nextReviewAt: { lte: now } },
        select: {
            vocabularyItem: { select: { cefrLevel: true } },
        },
    })
    const counts: Record<string, number> = {}
    for (const c of cards) {
        const lvl = c.vocabularyItem?.cefrLevel
        if (!lvl) continue
        counts[lvl] = (counts[lvl] || 0) + 1
    }
    return counts
}

export default async function ReviewPage() {
    const serverUser = await getServerUser()
    if (!serverUser) redirect('/login')

    const profile = await prisma.userProfile.findFirst({
        where: { userId: serverUser.userId },
        select: { currentLevel: true },
    })
    const userLevel = (profile?.currentLevel ?? 'A1') as CefrLevel

    const [availableLevels, themes, dueCounts] = await Promise.all([
        getAvailableLevels(),
        getThemesForLevel(serverUser.userId, userLevel),
        getDueCounts(serverUser.userId),
    ])

    const totalDueAll = Object.values(dueCounts).reduce((s, n) => s + n, 0)

    return (
        <div className="max-w-5xl mx-auto px-4 py-8">
            <ReviewClient
                themes={themes}
                availableLevels={availableLevels}
                initialLevel={userLevel}
                dueCounts={dueCounts}
                totalDueAll={totalDueAll}
            />
        </div>
    )
}
