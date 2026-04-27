import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma, type Prisma } from '@fuxie/database'
import { cookies } from 'next/headers'
import { cacheWrap } from '@/lib/cache/redis'
import { buildVocabularyItemWhere, type CefrLevel } from '@/lib/content/vocabulary'
import { handleApiError } from '@/lib/api/error-handler'

const VALID_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const
const VOCABULARY_LIST_CACHE_TTL_SECONDS = 60

const querySchema = z.object({
    level: z.enum(VALID_LEVELS).default('A1'),
    theme: z.string().optional(),
    search: z.string().optional(),
    wordType: z.string().optional(),
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(50),
})

/**
 * GET /api/v1/vocabulary
 * List vocabulary items with filters + pagination
 */
export async function GET(req: NextRequest) {
    try {
        // await withAuth(req)

        const searchParams = req.nextUrl.searchParams
        const params = Object.fromEntries(searchParams)
        const { level, theme, search, wordType, page, limit } = querySchema.parse(params)

        const where: Prisma.VocabularyItemWhereInput = buildVocabularyItemWhere({
            level: level as CefrLevel,
            theme,
            search,
            wordType,
        })

        const locale = searchParams.get('locale') || (await cookies()).get('NEXT_LOCALE')?.value || 'vi'
        const payload = await cacheWrap(
            [
                'vocab:list',
                ...[
                    level,
                    theme ?? 'all',
                    search ?? '',
                    wordType ?? 'all',
                    page,
                    limit,
                    locale,
                ].map(String).map(encodeURIComponent),
            ].join(':'),
            VOCABULARY_LIST_CACHE_TTL_SECONDS,
            async () => {
                const [items, total] = await Promise.all([
                    prisma.vocabularyItem.findMany({
                        where,
                        orderBy: [{ theme: { sortOrder: 'asc' } }, { word: 'asc' }],
                        skip: (page - 1) * limit,
                        take: limit,
                        select: {
                            id: true,
                            word: true,
                            article: true,
                            plural: true,
                            wordType: true,
                            cefrLevel: true,
                            translations: true,
                            ipa: true,
                            audioUrl: true,
                            imageUrl: true,
                            exampleSentence1: true,
                            exampleTranslation1: true,
                            exampleSentence2: true,
                            exampleTranslation2: true,
                            notes: true,
                            conjugation: true,
                            theme: {
                                select: { slug: true, name: true },
                            },
                        },
                    }),
                    prisma.vocabularyItem.count({ where }),
                ])

                const mappedItems = items.map((item) => {
                    const t = item.translations as (Record<string, string> | null)
                    const fallbackMeaning = t ? (t[locale] || t['vi'] || t['en'] || t['meaningVi'] || t['meaningEn'] || JSON.stringify(t)) : ''
                    const meaningDe = t ? (t['de'] || t['meaningDe']) : null
                    return {
                        ...item,
                        meaningNative: fallbackMeaning,
                        meaningDe,
                    }
                })

                return {
                    data: mappedItems,
                    meta: {
                        page,
                        limit,
                        total,
                        totalPages: Math.ceil(total / limit),
                    },
                }
            },
        )

        return NextResponse.json({
            success: true,
            ...payload,
        }, {
            headers: {
                'Cache-Control': 'private, max-age=60, stale-while-revalidate=300',
            },
        })
    } catch (error) {
        return handleApiError(error)
    }
}
