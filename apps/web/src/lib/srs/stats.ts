import { cache } from 'react'
import { prisma } from '@fuxie/database'
import { cacheWrap } from '@/lib/cache/redis'

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
    return cacheWrap(`srs:progress:${userId}:${cefrLevel ?? 'all'}`, 30, async () => {
        const rows = cefrLevel
            ? await prisma.$queryRaw<ThemeProgressRow[]>`
                SELECT vi."themeId" AS "themeId",
                       COUNT(*)::bigint AS total,
                       COUNT(*) FILTER (WHERE sc.state <> 0)::bigint AS started,
                       COUNT(*) FILTER (WHERE sc.state = 2)::bigint AS learned,
                       COUNT(*) FILTER (WHERE sc."nextReviewAt" <= NOW())::bigint AS due
                FROM srs_cards sc
                JOIN vocabulary_items vi ON vi.id = sc."vocabularyItemId"
                WHERE sc."userId" = ${userId}
                  AND vi."themeId" IS NOT NULL
                  AND vi."cefrLevel" = ${cefrLevel}::"CefrLevel"
                GROUP BY vi."themeId"
            `
            : await prisma.$queryRaw<ThemeProgressRow[]>`
            SELECT vi."themeId" AS "themeId",
                   COUNT(*)::bigint AS total,
                   COUNT(*) FILTER (WHERE sc.state <> 0)::bigint AS started,
                   COUNT(*) FILTER (WHERE sc.state = 2)::bigint AS learned,
                   COUNT(*) FILTER (WHERE sc."nextReviewAt" <= NOW())::bigint AS due
            FROM srs_cards sc
            JOIN vocabulary_items vi ON vi.id = sc."vocabularyItemId"
            WHERE sc."userId" = ${userId}
              AND vi."themeId" IS NOT NULL
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
})

export const getVocabularyDueCountsByLevel = cache(async (userId: string) => {
    return cacheWrap(`srs:due:${userId}`, 30, async () => {
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
})


/**
 * Counts of SRS cards bucketed for the Review surface hero.
 *
 * - `dueToday` — cards whose `nextReviewAt` lies inside today's calendar
 *   day (server clock); essentially "must review today, not yet missed".
 * - `overdue`  — cards whose `nextReviewAt` is before the start of today;
 *   missed from previous days.
 *
 * Together they back Req 9.2 (saturated counters) and Req 9.4 (empty
 * state when both are 0).
 */
export interface ReviewBucketCounts {
    dueToday: number
    overdue: number
}

interface ReviewBucketRow {
    bucket: 'due_today' | 'overdue'
    count: bigint
}

export const getVocabularyReviewBucketCounts = cache(
    async (userId: string): Promise<ReviewBucketCounts> => {
        return cacheWrap(`srs:bucket:${userId}`, 30, async () => {
            const rows = await prisma.$queryRaw<ReviewBucketRow[]>`
                SELECT bucket, COUNT(*)::bigint AS count
                FROM (
                    SELECT
                        CASE
                            WHEN sc."nextReviewAt" < date_trunc('day', NOW())
                                THEN 'overdue'
                            WHEN sc."nextReviewAt" <  date_trunc('day', NOW()) + INTERVAL '1 day'
                                THEN 'due_today'
                            ELSE NULL
                        END AS bucket
                    FROM srs_cards sc
                    JOIN vocabulary_items vi ON vi.id = sc."vocabularyItemId"
                    WHERE sc."userId" = ${userId}
                      AND sc."nextReviewAt" <= NOW()
                ) AS bucketed
                WHERE bucket IS NOT NULL
                GROUP BY bucket
            `

            const counts: ReviewBucketCounts = { dueToday: 0, overdue: 0 }
            for (const row of rows) {
                if (row.bucket === 'due_today') {
                    counts.dueToday = Number(row.count)
                } else if (row.bucket === 'overdue') {
                    counts.overdue = Number(row.count)
                }
            }
            return counts
        })
    },
)


/**
 * Count of SRS cards owned by a learner — backs the "vocabulary list = 0"
 * empty-state branch on `/vocabulary/practice` and `/vocabulary/microgames`
 * (Requirement 5.5; Task 10.2).
 *
 * Cached for 30s via `cacheWrap` so the surface render and any nearby
 * navigation reads share the same lookup.
 */
export const getLearnerVocabularyCardCount = cache(
    async (userId: string): Promise<number> => {
        return cacheWrap(`srs:total:${userId}`, 30, async () => {
            return prisma.srsCard.count({ where: { userId } })
        })
    },
)
