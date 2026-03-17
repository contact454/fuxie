import { redirect } from 'next/navigation'
import { prisma } from '@fuxie/database'
import { getServerUser } from '@/lib/auth/server-auth'
import { PracticeHub } from '@/components/vocabulary/practice-hub'

export const dynamic = 'force-dynamic'

export const metadata = {
    title: 'Fuxie 🦊 — Wortschatz üben',
    description: 'Vocabulary practice exercises — Multiple Choice, Matching, Spelling and more',
}

type CefrLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'

async function getThemesForPractice(cefrLevel: CefrLevel) {
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

    return themes.map(t => ({
        id: t.id,
        slug: t.slug,
        name: t.name,
        nameVi: t.nameVi,
        cefrLevel: t.cefrLevel,
        imageUrl: t.imageUrl,
        wordCount: t._count.items,
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

export default async function PracticePage() {
    const serverUser = await getServerUser()
    if (!serverUser) redirect('/login')

    const availableLevels = await getAvailableLevels()
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
