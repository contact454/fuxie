import { redirect } from 'next/navigation'
import { prisma } from '@fuxie/database'
import { getServerUser } from '@/lib/auth/server-auth'
import { getVocabularyThemes, mapVocabularyThemes, type CefrLevel } from '@/lib/content/vocabulary'
import { getVocabularyThemeSrsProgress } from '@/lib/srs/stats'
import { VocabularyClient } from '@/components/vocabulary/vocabulary-client'

export const metadata = {
    title: 'Fuxie 🦊 — Wortschatz',
    description: 'Deutsche Vokabeln — Browse and learn vocabulary by CEFR level',
}

async function getAvailableLevels(): Promise<CefrLevel[]> {
    try {
        const levels = await prisma.vocabularyTheme.findMany({
            select: { cefrLevel: true },
            distinct: ['cefrLevel'],
            orderBy: { cefrLevel: 'asc' },
        })
        if (levels.length === 0) return ['A1']
        return levels.map(l => l.cefrLevel as CefrLevel)
    } catch (err) {
        console.error('[Vocabulary] Error fetching levels:', err)
        return ['A1']
    }
}

async function getThemes(userId: string | null, cefrLevel: CefrLevel) {
    const themes = await getVocabularyThemes(cefrLevel)

    let srsProgress: Record<string, { total: number; learned: number; due: number }> = {}
    let totalDue = 0
    if (userId) {
        try {
            const progressMap = await getVocabularyThemeSrsProgress(userId, cefrLevel)
            for (const [themeId, progress] of Object.entries(progressMap)) {
                srsProgress[themeId] = {
                    total: progress.total,
                    learned: progress.learned,
                    due: progress.due,
                }
                totalDue += progress.due
            }
        } catch (err) {
            console.error('[Vocabulary] Error fetching SRS progress:', err)
        }
    }

    const mappedThemes = mapVocabularyThemes(themes).map((theme) => ({
        ...theme,
        srsProgress: srsProgress[theme.id] ?? { total: 0, learned: 0, due: 0 },
    }))

    const totalWords = mappedThemes.reduce((s, t) => s + t.wordCount, 0)

    return { themes: mappedThemes, totalWords, totalDue }
}

export default async function VocabularyPage() {
    const serverUser = await getServerUser()
    if (!serverUser) redirect('/login')

    const availableLevels = await getAvailableLevels()
    const defaultLevel: CefrLevel = availableLevels[0] || 'A1'

    // Parallel: themes + SRS progress load simultaneously
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
