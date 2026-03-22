import { redirect } from 'next/navigation'
import { getServerUser } from '@/lib/auth/server-auth'
import { getVocabularyLevels, getVocabularyThemes, mapVocabularyThemes, type CefrLevel } from '@/lib/content/vocabulary'
import { PracticeHub } from '@/components/vocabulary/practice-hub'

export const metadata = {
    title: 'Fuxie 🦊 — Wortschatz üben',
    description: 'Vocabulary practice exercises — Multiple Choice, Matching, Spelling and more',
}

async function getThemesForPractice(cefrLevel: CefrLevel) {
    return mapVocabularyThemes(await getVocabularyThemes(cefrLevel))
}

export default async function PracticePage() {
    const serverUser = await getServerUser()
    if (!serverUser) redirect('/login')

    const availableLevels = await getVocabularyLevels()
    const defaultLevel: CefrLevel = availableLevels[0] || 'A1'
    const themes = await getThemesForPractice(defaultLevel)

    return (
        <div className="max-w-5xl mx-auto px-4 py-8">
            <PracticeHub
                themes={themes}
                availableLevels={availableLevels}
                initialLevel={defaultLevel}
            />
        </div>
    )
}
