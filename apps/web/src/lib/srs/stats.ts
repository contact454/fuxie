import { cache } from 'react'
import { Prisma, prisma } from '@fuxie/database'

type ThemeProgressRow = {
    themeId: string
    total: bigint
    started: bigint
    learned: bigint
    due: bigint
}

type DueCountRow = {
    cefrLevel: string
    due: bigint
}

export interface ThemeSrsProgress {
    total: number
    started: number
    learned: number
    due: number
}

export const getVocabularyThemeSrsProgress = cache(async (userId: string, cefrLevel?: string) => {
    const levelFilter = cefrLevel
        ? Prisma.sql`AND vi."cefrLevel" = ${cefrLevel}::"CefrLevel"`
        : Prisma.empty

    const rows = await prisma.$queryRaw<ThemeProgressRow[]>`
        SELECT vi."themeId" AS "themeId",
               COUNT(*)::bigint AS total,
               COUNT(*) FILTER (WHERE sc.state <> 0)::bigint AS started,
               COUNT(*) FILTER (WHERE sc.state = 2)::bigint AS learned,
               COUNT(*) FILTER (WHERE sc."nextReviewAt" <= NOW())::bigint AS due
        FROM srs_cards sc
        JOIN vocabulary_items vi ON vi.id = sc."vocabularyItemId"
        WHERE sc."userId" = ${userId}
          AND vi."themeId" IS NOT NULL
          ${levelFilter}
        GROUP BY vi."themeId"
    `

    const progressMap: Record<string, ThemeSrsProgress> = {}
    for (const row of rows) {
        progressMap[row.themeId] = {
            total: Number(row.total),
            started: Number(row.started),
            learned: Number(row.learned),
            due: Number(row.due),
        }
    }

    return progressMap
})

export const getVocabularyDueCountsByLevel = cache(async (userId: string) => {
    const rows = await prisma.$queryRaw<DueCountRow[]>`
        SELECT vi."cefrLevel" AS "cefrLevel",
               COUNT(*)::bigint AS due
        FROM srs_cards sc
        JOIN vocabulary_items vi ON vi.id = sc."vocabularyItemId"
        WHERE sc."userId" = ${userId}
          AND sc."nextReviewAt" <= NOW()
        GROUP BY vi."cefrLevel"
    `

    const counts: Record<string, number> = {}
    for (const row of rows) {
        counts[row.cefrLevel] = Number(row.due)
    }

    return counts
})
