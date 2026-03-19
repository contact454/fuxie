import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@fuxie/database'
import { withAuth } from '@/lib/auth/middleware'
import { handleApiError } from '@/lib/api/error-handler'

const VALID_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const

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
        await withAuth(req)

        const params = Object.fromEntries(req.nextUrl.searchParams)
        const { level, theme, search, wordType, page, limit } = querySchema.parse(params)

        const where: Record<string, unknown> = { cefrLevel: level }

        if (theme) {
            where.theme = { slug: theme }
        }
        if (wordType) {
            where.wordType = wordType
        }
        if (search) {
            where.OR = [
                { word: { contains: search, mode: 'insensitive' } },
                { meaningVi: { contains: search, mode: 'insensitive' } },
                { meaningEn: { contains: search, mode: 'insensitive' } },
            ]
        }

        const [items, total] = await Promise.all([
            prisma.vocabularyItem.findMany({
                where: where as any,
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
                    meaningVi: true,
                    meaningEn: true,
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
            prisma.vocabularyItem.count({ where: where as any }),
        ])

        return NextResponse.json({
            success: true,
            data: items,
            meta: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        }, {
            headers: {
                'Cache-Control': 'private, max-age=60, stale-while-revalidate=300',
            },
        })
    } catch (error) {
        return handleApiError(error)
    }
}
