import { beforeEach, describe, expect, it, vi } from 'vitest'

const {
    getServerUserMock,
    createVocabularyItemMock,
} = vi.hoisted(() => ({
    getServerUserMock: vi.fn(),
    createVocabularyItemMock: vi.fn(),
}))

vi.mock('@/lib/auth/server-auth', () => ({
    getServerUser: getServerUserMock,
}))

vi.mock('@fuxie/database', () => ({
    prisma: {
        vocabularyItem: {
            create: createVocabularyItemMock,
        },
    },
    CefrLevel: {
        A1: 'A1',
        A2: 'A2',
        B1: 'B1',
        B2: 'B2',
        C1: 'C1',
        C2: 'C2',
    },
    Gender: {
        MASKULIN: 'MASKULIN',
        FEMININ: 'FEMININ',
        NEUTRUM: 'NEUTRUM',
    },
    WordType: {
        NOMEN: 'NOMEN',
        VERB: 'VERB',
    },
}))

import { POST } from './route'

describe('POST /api/v1/admin/vocabulary', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        getServerUserMock.mockResolvedValue({
            userId: 'admin-1',
            role: 'ADMIN',
        })
        createVocabularyItemMock.mockResolvedValue({
            id: 'vocab-1',
            word: 'Apfel',
            article: 'MASKULIN',
            wordType: 'NOMEN',
            cefrLevel: 'A1',
        })
    })

    it('rejects unauthorized callers', async () => {
        getServerUserMock.mockResolvedValueOnce({
            userId: 'learner-1',
            role: 'LEARNER',
        })

        const response = await POST(vocabularyRequest(validPayload()))

        expect(response.status).toBe(403)
        expect(createVocabularyItemMock).not.toHaveBeenCalled()
    })

    it('validates required vocabulary fields', async () => {
        const response = await POST(vocabularyRequest({
            ...validPayload(),
            term_de: '',
        }))

        expect(response.status).toBe(400)
        expect(createVocabularyItemMock).not.toHaveBeenCalled()
    })

    it('maps German articles to Prisma gender enum values', async () => {
        const response = await POST(vocabularyRequest(validPayload()))

        expect(response.status).toBe(201)
        expect(createVocabularyItemMock).toHaveBeenCalledWith({
            data: expect.objectContaining({
                word: 'Apfel',
                wordLower: 'apfel',
                article: 'MASKULIN',
                wordType: 'NOMEN',
                cefrLevel: 'A1',
                translations: {
                    vi: 'qua tao',
                    meaning: 'Fruit',
                    exampleDe: 'Ich esse einen Apfel.',
                    exampleVi: 'Toi an mot qua tao.',
                },
            }),
            select: {
                id: true,
                word: true,
                article: true,
                wordType: true,
                cefrLevel: true,
                createdAt: true,
            },
        })
    })
})

function vocabularyRequest(body: unknown) {
    return new Request('http://localhost/api/v1/admin/vocabulary', {
        method: 'POST',
        body: JSON.stringify(body),
        headers: { 'content-type': 'application/json' },
    })
}

function validPayload() {
    return {
        cefrLevel: 'A1',
        term_de: 'Apfel',
        term_vi: 'qua tao',
        gender: 'der',
        meaning: 'Fruit',
        exampleDe: 'Ich esse einen Apfel.',
        exampleVi: 'Toi an mot qua tao.',
    }
}
