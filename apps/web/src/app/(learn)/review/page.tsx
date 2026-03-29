import { redirect } from 'next/navigation'
import { prisma } from '@fuxie/database'
import { getServerUser } from '@/lib/auth/server-auth'
import { getVocabularyLevels, getVocabularyThemes, mapVocabularyThemes, type CefrLevel } from '@/lib/content/vocabulary'
import { getVocabularyDueCountsByLevel, getVocabularyThemeSrsProgress } from '@/lib/srs/stats'
import { ReviewClient } from '@/components/srs/review-client'

export const metadata = {
    title: 'Fuxie 🦊 — Wiederholen',
    description: 'SRS Flashcard Review — Lerne Vokabeln mit Karteikarten',
}

async function getThemesForLevel(userId: string, cefrLevel: CefrLevel) {
    const themes = await getVocabularyThemes(cefrLevel)

    const srsMap = await getVocabularyThemeSrsProgress(userId, cefrLevel)

    return mapVocabularyThemes(themes).map(theme => ({
        ...theme,
        srsProgress: srsMap[theme.id]
            ? {
                total: srsMap[theme.id]!.total,
                learned: srsMap[theme.id]!.learned,
                due: srsMap[theme.id]!.due,
            }
            : { total: 0, learned: 0, due: 0 },
    }))
}

async function getDueCounts(userId: string) {
    return getVocabularyDueCountsByLevel(userId)
}

export default async function ReviewPage() {
    const serverUser = await getServerUser()
    if (!serverUser) redirect('/login')

    // All 3 queries run in parallel instead of sequential
    const [profile, availableLevels] = await Promise.all([
        prisma.userProfile.findFirst({
            where: { userId: serverUser.userId },
            select: { currentLevel: true },
        }),
        getVocabularyLevels(),
    ])
    const userLevel = (profile?.currentLevel ?? 'A1') as CefrLevel

    // Themes + due counts also in parallel
    const [themes, dueCounts] = await Promise.all([
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
