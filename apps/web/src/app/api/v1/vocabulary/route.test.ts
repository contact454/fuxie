import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const {
    cacheWrapMock,
    cookiesMock,
    buildVocabularyItemWhereMock,
    findManyVocabularyMock,
    countVocabularyMock,
} = vi.hoisted(() => ({
    cacheWrapMock: vi.fn(),
    cookiesMock: vi.fn(),
    buildVocabularyItemWhereMock: vi.fn(),
    findManyVocabularyMock: vi.fn(),
    countVocabularyMock: vi.fn(),
}))

vi.mock('@/lib/cache/redis', () => ({
    cacheWrap: cacheWrapMock,
}))

vi.mock('next/headers', () => ({
    cookies: cookiesMock,
}))

vi.mock('@/lib/content/vocabulary', () => ({
    buildVocabularyItemWhere: buildVocabularyItemWhereMock,
}))

vi.mock('@/lib/api/error-handler', () => ({
    handleApiError: vi.fn((error: unknown) =>
        Response.json(
            { success: false, error: error instanceof Error ? error.message : 'Internal server error' },
            { status: 500 },
        ),
    ),
}))

vi.mock('@fuxie/database', () => ({
    prisma: {
        vocabularyItem: {
            findMany: findManyVocabularyMock,
            count: countVocabularyMock,
        },
    },
}))

import { GET } from './route'

describe('GET /api/v1/vocabulary', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        buildVocabularyItemWhereMock.mockReturnValue({ cefrLevel: 'A1', theme: { slug: 'essen' } })
        findManyVocabularyMock.mockResolvedValue([
            {
                id: 'word-1',
                word: 'Apfel',
                translations: { vi: 'qua tao', de: 'Apfel' },
                theme: { slug: 'essen', name: 'Essen' },
            },
        ])
        countVocabularyMock.mockResolvedValue(1)
        cacheWrapMock.mockImplementation(async (_key: string, _ttl: number, fetcher: () => Promise<unknown>) => fetcher())
        cookiesMock.mockResolvedValue({
            get: vi.fn().mockReturnValue({ value: 'vi' }),
        })
    })

    it('caches vocabulary lists by filter and query locale', async () => {
        const response = await GET(
            new NextRequest('http://localhost/api/v1/vocabulary?level=A1&theme=essen&limit=10&locale=en'),
        )

        expect(response.status).toBe(200)
        await expect(response.json()).resolves.toMatchObject({
            success: true,
            data: [
                {
                    id: 'word-1',
                    meaningNative: 'qua tao',
                    meaningDe: 'Apfel',
                },
            ],
            meta: {
                page: 1,
                limit: 10,
                total: 1,
                totalPages: 1,
            },
        })
        expect(cacheWrapMock).toHaveBeenCalledWith(
            'vocab:list:A1:essen::all:1:10:en',
            60,
            expect.any(Function),
        )
        expect(cookiesMock).not.toHaveBeenCalled()
        expect(findManyVocabularyMock).toHaveBeenCalledWith(expect.objectContaining({
            where: { cefrLevel: 'A1', theme: { slug: 'essen' } },
            skip: 0,
            take: 10,
        }))
    })
})
