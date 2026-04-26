import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const {
    AuthErrorMock,
    withAuthMock,
    getGeminiKeyMock,
    getDbUserByFirebaseUidMock,
    findProfileMock,
    findLearningPathMock,
    findMemoriesMock,
    findStreakMock,
} = vi.hoisted(() => ({
    AuthErrorMock: class AuthError extends Error {
        constructor(message = 'Unauthorized') {
            super(message)
            this.name = 'AuthError'
        }
    },
    withAuthMock: vi.fn(),
    getGeminiKeyMock: vi.fn(),
    getDbUserByFirebaseUidMock: vi.fn(),
    findProfileMock: vi.fn(),
    findLearningPathMock: vi.fn(),
    findMemoriesMock: vi.fn(),
    findStreakMock: vi.fn(),
}))

vi.mock('@/lib/auth/middleware', () => ({
    AuthError: AuthErrorMock,
    withAuth: withAuthMock,
}))

vi.mock('@/lib/ai/gemini-fallback', () => ({
    getGeminiKey: getGeminiKeyMock,
}))

vi.mock('@/lib/ai/chat-prompt-builder', () => ({
    buildChatSystemPrompt: vi.fn(() => 'system prompt'),
}))

vi.mock('@/lib/auth/db-user', () => ({
    getDbUserByFirebaseUid: getDbUserByFirebaseUidMock,
}))

vi.mock('@fuxie/database', () => ({
    prisma: {
        userProfile: { findUnique: findProfileMock },
        learningPath: { findUnique: findLearningPathMock },
        userChatMemory: { findMany: findMemoriesMock },
        userStreak: { findUnique: findStreakMock },
    },
}))

import { GET } from './route'

describe('GET /api/v1/chat/credentials', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        vi.unstubAllEnvs()
        withAuthMock.mockResolvedValue({
            userId: 'firebase-uid-1',
            email: 'learner@fuxie.test',
        })
        getGeminiKeyMock.mockReturnValue('gemini-secret')
        getDbUserByFirebaseUidMock.mockResolvedValue({ id: 'db-user-1' })
        findProfileMock.mockResolvedValue({
            displayName: 'Learner',
            currentLevel: 'A1',
            totalXp: 100,
        })
        findLearningPathMock.mockResolvedValue({
            weakSkills: [],
            strongSkills: [],
        })
        findMemoriesMock.mockResolvedValue([])
        findStreakMock.mockResolvedValue({ currentStreak: 2 })
    })

    it('does not expose the Gemini key in production by default', async () => {
        vi.stubEnv('NODE_ENV', 'production')

        const response = await GET(request())
        const body = await response.json()

        expect(response.status).toBe(200)
        expect(body).toMatchObject({
            success: true,
            liveApiEnabled: false,
            systemPrompt: 'system prompt',
        })
        expect(body.apiKey).toBeUndefined()
        expect(getGeminiKeyMock).not.toHaveBeenCalled()
    })

    it('returns a signed proxy URL in production when the proxy secret is configured', async () => {
        vi.stubEnv('NODE_ENV', 'production')
        vi.stubEnv('AI_SERVICE_PROXY_SECRET', 'proxy-secret')
        vi.stubEnv('AI_SERVICE_WS_URL', 'wss://ai.fuxie.test/live')

        const response = await GET(request())
        const body = await response.json()

        expect(response.status).toBe(200)
        expect(body).toMatchObject({
            success: true,
            liveApiEnabled: true,
            transport: 'proxy',
            systemPrompt: 'system prompt',
        })
        expect(body.liveProxyUrl).toMatch(/^wss:\/\/ai\.fuxie\.test\/live\?token=/)
        expect(body.apiKey).toBeUndefined()
        expect(getGeminiKeyMock).not.toHaveBeenCalled()
    })

    it('returns the key in development for the direct Live API client', async () => {
        vi.stubEnv('NODE_ENV', 'development')

        const response = await GET(request())
        const body = await response.json()

        expect(response.status).toBe(200)
        expect(body).toMatchObject({
            success: true,
            liveApiEnabled: true,
            transport: 'direct',
            apiKey: 'gemini-secret',
            systemPrompt: 'system prompt',
        })
    })

    it('returns unauthorized auth failures without logging them as system errors', async () => {
        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
        withAuthMock.mockRejectedValue(new AuthErrorMock())

        const response = await GET(request())
        const body = await response.json()

        expect(response.status).toBe(401)
        expect(body).toEqual({ success: false, error: 'Unauthorized' })
        expect(consoleErrorSpy).not.toHaveBeenCalled()

        consoleErrorSpy.mockRestore()
    })
})

function request() {
    return new NextRequest('http://localhost/api/v1/chat/credentials')
}
