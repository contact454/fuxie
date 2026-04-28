import { redirect } from 'next/navigation'
import { getServerUser } from '@/lib/auth/server-auth'
import { getVocabularyLevels, getVocabularyThemes, mapVocabularyThemes, type CefrLevel } from '@/lib/content/vocabulary'
import { PracticeHub } from '@/components/vocabulary/practice-hub'

export const metadata = {
    title: 'Fuxie - Luyện từ vựng',
    description: 'Bài luyện từ vựng: trắc nghiệm, ghép cặp, chính tả và nhiều dạng khác',
}

async function getThemesForPractice(cefrLevel: CefrLevel, locale: string) {
    return mapVocabularyThemes(await getVocabularyThemes(cefrLevel)).map(t => ({
        ...t,
        nameNative: (t.translations as Record<string, string>)?.[locale] || '',
    }))
}

export default async function PracticePage() {
    const serverUser = await getServerUser()
    if (!serverUser) redirect('/login')

    const availableLevels = await getVocabularyLevels()
    const defaultLevel: CefrLevel = availableLevels[0] || 'A1'
    const themes = await getThemesForPractice(defaultLevel, serverUser.uiLanguage || 'vi')

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
