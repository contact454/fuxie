import { redirect } from 'next/navigation'
import { prisma } from '@fuxie/database'
import { getServerUser } from '@/lib/auth/server-auth'
import { cacheWrap } from '@/lib/cache/redis'
import { getVocabularyLevels, getVocabularyThemes, mapVocabularyThemes, type CefrLevel } from '@/lib/content/vocabulary'
import { getVocabularyThemeSrsProgress } from '@/lib/srs/stats'
import { VocabularyClient } from '@/components/vocabulary/vocabulary-client'

export const metadata = {
    title: 'Fuxie 🦊 — Wortschatz',
    description: 'Deutsche Vokabeln — Browse and learn vocabulary by CEFR level',
}

async function getThemes(userId: string | null, cefrLevel: CefrLevel) {
    const themes = await getVocabularyThemes(cefrLevel)

    // Get SRS progress per theme
    let srsProgress: Record<string, { total: number; learned: number; due: number }> = {}
    let totalDue = 0
    if (userId) {
        const progressMap = await getVocabularyThemeSrsProgress(userId, cefrLevel)
        for (const [themeId, progress] of Object.entries(progressMap)) {
            srsProgress[themeId] = {
                total: progress.total,
                learned: progress.learned,
                due: progress.due,
            }
            totalDue += progress.due
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

    const availableLevels = await cacheWrap('vocab:levels', 3600, getVocabularyLevels)
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
