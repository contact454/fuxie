import { Prisma, prisma } from '@fuxie/database'
import { cacheWrap } from '@/lib/cache/redis'

export type { CefrLevel } from '@/lib/types/cefr'
import type { CefrLevel } from '@/lib/types/cefr'

export async function getVocabularyThemes(level: CefrLevel) {
    return cacheWrap(`vocab:themes:${level}`, 3600, () =>
        prisma.vocabularyTheme.findMany({
            where: { cefrLevel: level },
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
    )
}

export function mapVocabularyThemes<
    T extends {
        id: string
        slug: string
        name: string
        nameVi: string | null
        nameEn?: string | null
        cefrLevel: string
        imageUrl: string | null
        _count: { items: number }
    },
>(themes: T[]) {
    return themes.map((theme) => ({
        id: theme.id,
        slug: theme.slug,
        name: theme.name,
        nameVi: theme.nameVi,
        nameEn: 'nameEn' in theme ? theme.nameEn ?? null : null,
        cefrLevel: theme.cefrLevel,
        imageUrl: theme.imageUrl,
        wordCount: theme._count.items,
    }))
}

export async function getVocabularyLevels(): Promise<CefrLevel[]> {
    return cacheWrap('vocab:levels', 3600, async () => {
        const levels = await prisma.vocabularyTheme.findMany({
            select: { cefrLevel: true },
            distinct: ['cefrLevel'],
            orderBy: { cefrLevel: 'asc' },
        })
        if (levels.length === 0) return ['A1']
        return levels.map((level) => level.cefrLevel as CefrLevel)
    })
}

export function buildVocabularyItemWhere(params: {
    level: CefrLevel
    theme?: string
    search?: string
    wordType?: string
}): Prisma.VocabularyItemWhereInput {
    const { level, theme, search, wordType } = params

    return {
        cefrLevel: level,
        ...(theme ? { theme: { slug: theme } } : {}),
        ...(wordType ? { wordType: wordType as any } : {}),
        ...(search
            ? {
                OR: [
                    { word: { contains: search, mode: 'insensitive' } },
                    { meaningVi: { contains: search, mode: 'insensitive' } },
                    { meaningEn: { contains: search, mode: 'insensitive' } },
                ],
            }
            : {}),
    }
}
