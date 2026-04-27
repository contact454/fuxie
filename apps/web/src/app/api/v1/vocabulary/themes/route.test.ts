import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const {
    withAuthMock,
    getDbUserByFirebaseUidMock,
    getVocabularyThemesMock,
    getVocabularyThemeSrsProgressMock,
} = vi.hoisted(() => ({
    withAuthMock: vi.fn(),
    getDbUserByFirebaseUidMock: vi.fn(),
    getVocabularyThemesMock: vi.fn(),
    getVocabularyThemeSrsProgressMock: vi.fn(),
}))

vi.mock('@/lib/auth/middleware', () => ({
    withAuth: withAuthMock,
}))

vi.mock('@/lib/auth/db-user', () => ({
    getDbUserByFirebaseUid: getDbUserByFirebaseUidMock,
}))

vi.mock('@/lib/content/vocabulary', () => ({
    getVocabularyThemes: getVocabularyThemesMock,
    mapVocabularyThemes: vi.fn((themes: any[]) =>
        themes.map((theme) => ({
            id: theme.id,
            slug: theme.slug,
            name: theme.name,
            translations: theme.translations,
            cefrLevel: theme.cefrLevel,
            imageUrl: theme.imageUrl,
            wordCount: theme._count.items,
        })),
    ),
}))

vi.mock('@/lib/srs/stats', () => ({
    getVocabularyThemeSrsProgress: getVocabularyThemeSrsProgressMock,
}))

vi.mock('@/lib/api/error-handler', () => ({
    handleApiError: vi.fn((error: unknown) =>
        Response.json(
            { success: false, error: error instanceof Error ? error.message : 'Internal server error' },
            { status: 500 },
        ),
    ),
}))

import { GET } from './route'

describe('GET /api/v1/vocabulary/themes', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        withAuthMock.mockResolvedValue({ userId: 'firebase-user-1' })
        getDbUserByFirebaseUidMock.mockResolvedValue({ id: 'db-user-1' })
        getVocabularyThemesMock.mockResolvedValue([
            {
                id: 'theme-1',
                slug: 'essen',
                name: 'Essen',
                translations: { vi: 'an uong' },
                cefrLevel: 'A1',
                imageUrl: null,
                _count: { items: 12 },
            },
        ])
        getVocabularyThemeSrsProgressMock.mockResolvedValue({
            'theme-1': { total: 12, learned: 3, due: 2 },
        })
    })

    it('uses cached theme and SRS progress helpers for the requested level', async () => {
        const response = await GET(new NextRequest('http://localhost/api/v1/vocabulary/themes?level=A1'))

        expect(response.status).toBe(200)
        await expect(response.json()).resolves.toMatchObject({
            success: true,
            data: [
                {
                    id: 'theme-1',
                    wordCount: 12,
                    srsProgress: { total: 12, learned: 3, due: 2 },
                },
            ],
        })
        expect(getVocabularyThemesMock).toHaveBeenCalledWith('A1')
        expect(getVocabularyThemeSrsProgressMock).toHaveBeenCalledWith('db-user-1', 'A1')
    })
})
