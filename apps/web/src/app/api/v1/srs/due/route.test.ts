import { beforeEach, describe, expect, it, vi } from 'vitest'

const {
    getServerUserMock,
    cacheWrapMock,
    getDueSrsCardsMock,
} = vi.hoisted(() => ({
    getServerUserMock: vi.fn(),
    cacheWrapMock: vi.fn(),
    getDueSrsCardsMock: vi.fn(),
}))

vi.mock('@/lib/auth/server-auth', () => ({
    getServerUser: getServerUserMock,
}))

vi.mock('@/lib/cache/redis', () => ({
    cacheWrap: cacheWrapMock,
}))

vi.mock('@/lib/srs/due-cards', () => ({
    getDueSrsCards: getDueSrsCardsMock,
}))

import { GET } from './route'

describe('GET /api/v1/srs/due', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        getServerUserMock.mockResolvedValue({ userId: 'user-1' })
        getDueSrsCardsMock.mockResolvedValue([{ id: 'card-1' }])
        cacheWrapMock.mockImplementation(async (_key: string, _ttl: number, fetcher: () => Promise<unknown>) => fetcher())
    })

    it('caches due cards by user, level, and clamped limit', async () => {
        const response = await GET(new Request('http://localhost/api/v1/srs/due?level=A1&limit=500') as any)

        expect(response.status).toBe(200)
        await expect(response.json()).resolves.toEqual({
            success: true,
            data: [{ id: 'card-1' }],
        })
        expect(cacheWrapMock).toHaveBeenCalledWith(
            'srs:due:user-1:A1:50',
            10,
            expect.any(Function),
        )
        expect(getDueSrsCardsMock).toHaveBeenCalledWith({
            userId: 'user-1',
            level: 'A1',
            limit: 50,
        })
    })

    it('returns 401 for anonymous users without touching cache', async () => {
        getServerUserMock.mockResolvedValueOnce(null)

        const response = await GET(new Request('http://localhost/api/v1/srs/due') as any)

        expect(response.status).toBe(401)
        expect(cacheWrapMock).not.toHaveBeenCalled()
    })
})
