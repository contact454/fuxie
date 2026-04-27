import { redirect } from 'next/navigation'
import { getServerUser } from '@/lib/auth/server-auth'
import { getVocabularyLevels, getVocabularyThemes, mapVocabularyThemes, type CefrLevel } from '@/lib/content/vocabulary'
import { getVocabularyThemeSrsProgress } from '@/lib/srs/stats'
import { VocabularyClientDynamic } from '@/components/vocabulary/VocabularyClientDynamic'

export const metadata = {
    title: 'Fuxie 🦊 — Wortschatz',
    description: 'Deutsche Vokabeln — Browse and learn vocabulary by CEFR level',
}

async function getThemes(userId: string | null, cefrLevel: CefrLevel, locale: string) {
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
        nameNative: (theme.translations as Record<string, string>)?.[locale] || '',
        srsProgress: srsProgress[theme.id] ?? { total: 0, learned: 0, due: 0 },
    }))

    const totalWords = mappedThemes.reduce((s, t) => s + t.wordCount, 0)

    return { themes: mappedThemes, totalWords, totalDue }
}

export default async function VocabularyPage() {
    const serverUser = await getServerUser()
    if (!serverUser) redirect('/login')

    const availableLevels = await getVocabularyLevels()
    const defaultLevel: CefrLevel = availableLevels[0] || 'A1'

    // Parallel: themes + SRS progress load simultaneously
    const { themes, totalWords, totalDue } = await getThemes(serverUser.userId, defaultLevel, serverUser.uiLanguage || 'vi')

    return (
        <div className="max-w-5xl mx-auto px-4 py-8">
            <VocabularyClientDynamic
                themes={themes}
                totalWords={totalWords}
                totalDue={totalDue}
                availableLevels={availableLevels}
                initialLevel={defaultLevel}
            />
        </div>
    )
}
