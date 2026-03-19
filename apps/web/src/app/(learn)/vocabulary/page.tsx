import { redirect } from 'next/navigation'
import { prisma } from '@fuxie/database'
import { getServerUser } from '@/lib/auth/server-auth'
import { cacheWrap } from '@/lib/cache/redis'
import { VocabularyClient } from '@/components/vocabulary/vocabulary-client'

export const dynamic = 'force-dynamic'

export const metadata = {
    title: 'Fuxie 🦊 — Wortschatz',
    description: 'Deutsche Vokabeln — Browse and learn vocabulary by CEFR level',
}

type CefrLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'

async function getThemes(userId: string | null, cefrLevel: CefrLevel) {
    const themes = await prisma.vocabularyTheme.findMany({
        where: { cefrLevel },
        orderBy: { sortOrder: 'asc' },
        select: {
            id: true,
            slug: true,
            name: true,
            nameVi: true,
            nameEn: true,
            cefrLevel: true,
            imageUrl: true,
            _count: { select: { items: true } },
        },
    })

    // Get SRS progress per theme
    let srsProgress: Record<string, { total: number; learned: number; due: number }> = {}
    let totalDue = 0
    if (userId) {
        const cards = await prisma.srsCard.findMany({
            where: { userId },
            select: {
                vocabularyItem: { select: { themeId: true, cefrLevel: true } },
                state: true,
                nextReviewAt: true,
            },
        })
        const now = new Date()
        for (const card of cards) {
            const themeId = card.vocabularyItem?.themeId
            if (!themeId) continue
            // Only count cards for the selected level
            if (card.vocabularyItem?.cefrLevel !== cefrLevel) continue
            if (!srsProgress[themeId]) srsProgress[themeId] = { total: 0, learned: 0, due: 0 }
            srsProgress[themeId].total++
            if (card.state === 2) srsProgress[themeId].learned++
            if (card.nextReviewAt <= now) {
                srsProgress[themeId].due++
                totalDue++
            }
        }
    }

    const mappedThemes = themes.map((t) => ({
        id: t.id,
        slug: t.slug,
        name: t.name,
        nameVi: t.nameVi,
        nameEn: t.nameEn,
        cefrLevel: t.cefrLevel,
        imageUrl: t.imageUrl,
        wordCount: t._count.items,
        srsProgress: srsProgress[t.id] ?? { total: 0, learned: 0, due: 0 },
    }))

    const totalWords = mappedThemes.reduce((s, t) => s + t.wordCount, 0)

    return { themes: mappedThemes, totalWords, totalDue }
}

async function getAvailableLevels(): Promise<CefrLevel[]> {
    const levels = await prisma.vocabularyTheme.findMany({
        select: { cefrLevel: true },
        distinct: ['cefrLevel'],
        orderBy: { cefrLevel: 'asc' },
    })
    return levels.map(l => l.cefrLevel as CefrLevel)
}

export default async function VocabularyPage() {
    const serverUser = await getServerUser()
    if (!serverUser) redirect('/login')

    const availableLevels = await cacheWrap('vocab:levels', 3600, getAvailableLevels)
    const defaultLevel: CefrLevel = availableLevels[0] || 'A1'
    const { themes, totalWords, totalDue } = await getThemes(serverUser.userId, defaultLevel)

    return (
        <div className="max-w-5xl mx-auto px-4 py-8">
            <VocabularyClient
                themes={themes}
                totalWords={totalWords}
                totalDue={totalDue}
                availableLevels={availableLevels}
                initialLevel={defaultLevel}
            />
        </div>
    )
}
