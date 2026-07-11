import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const {
    getServerUserMock,
    getListeningLessonListMock,
    groupListeningLessonsByTeilMock,
    groupByMock,
} = vi.hoisted(() => ({
    getServerUserMock: vi.fn(),
    getListeningLessonListMock: vi.fn(),
    groupListeningLessonsByTeilMock: vi.fn(),
    groupByMock: vi.fn(),
}))

vi.mock('@/lib/auth/server-auth', () => ({
    getServerUser: getServerUserMock,
}))

vi.mock('@/lib/content/listening', () => ({
    getListeningLessonList: getListeningLessonListMock,
    groupListeningLessonsByTeil: groupListeningLessonsByTeilMock,
}))

vi.mock('@fuxie/database', () => ({
    prisma: {
        listeningAttempt: {
            groupBy: groupByMock,
        },
    },
}))

import { GET } from './route'

function makeReq(level?: string) {
    const url = level
        ? `http://localhost/api/v1/listening?level=${encodeURIComponent(level)}`
        : 'http://localhost/api/v1/listening'
    return new NextRequest(url)
}

const sampleLessons = [
    {
        id: 'db-1',
        lessonId: 'L-A1-1',
        cefrLevel: 'A1',
        teil: 1,
        teilName: 'Teil 1',
        title: 'Lesson 1',
        topic: 'Topic 1',
        taskType: 'mc',
        audioUrl: null,
        audioDuration: 60,
        backgroundScene: null,
        sortOrder: 1,
        _count: { questions: 3 },
    },
    {
        id: 'db-2',
        lessonId: 'L-A1-2',
        cefrLevel: 'A1',
        teil: 1,
        teilName: 'Teil 1',
        title: 'Lesson 2',
        topic: 'Topic 2',
        taskType: 'mc',
        audioUrl: null,
        audioDuration: 90,
        backgroundScene: null,
        sortOrder: 2,
        _count: { questions: 4 },
    },
]

describe('GET /api/v1/listening', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        getListeningLessonListMock.mockResolvedValue(sampleLessons)
        groupListeningLessonsByTeilMock.mockImplementation((lessons: typeof sampleLessons) => [
            {
                teil: 1,
                teilName: 'Teil 1',
                totalLessons: lessons.length,
                lessons,
            },
        ])
        groupByMock.mockResolvedValue([])
    })

    it('returns 401 when unauthenticated', async () => {
        getServerUserMock.mockResolvedValue(null)
        const res = await GET(makeReq('A1'))
        expect(res.status).toBe(401)
        const body = await res.json()
        expect(body.success).toBe(false)
        expect(res.headers.get('Cache-Control')).toContain('private')
        expect(res.headers.get('Cache-Control')).toContain('no-store')
        expect(groupByMock).not.toHaveBeenCalled()
    })

    it('returns 400 for invalid CEFR level', async () => {
        getServerUserMock.mockResolvedValue({ userId: 'user-1' })
        const res = await GET(makeReq('Z9'))
        expect(res.status).toBe(400)
        const body = await res.json()
        expect(body.success).toBe(false)
        expect(getListeningLessonListMock).not.toHaveBeenCalled()
    })

    it('returns success with null completion when user has no attempts', async () => {
        getServerUserMock.mockResolvedValue({ userId: 'user-1' })
        groupByMock.mockResolvedValue([])

        const res = await GET(makeReq('A1'))
        expect(res.status).toBe(200)
        const body = await res.json()
        expect(body.success).toBe(true)
        expect(body.data.totalLessons).toBe(2)
        expect(body.data.totalCompleted).toBe(0)
        expect(body.data.teile[0].lessons[0].completion).toBeNull()
        expect(body.data.teile[0].lessons[0].questionCount).toBe(3)
        expect(res.headers.get('Cache-Control')).toBe('private, no-store')
    })

    it('aggregates bestScore and attempts across multiple attempts', async () => {
        getServerUserMock.mockResolvedValue({ userId: 'user-1' })
        groupByMock.mockResolvedValue([
            {
                lessonId: 'db-1',
                _max: { score: 3, totalQuestions: 3 },
                _count: { _all: 2 },
            },
        ])

        const res = await GET(makeReq('A1'))
        const body = await res.json()
        expect(body.success).toBe(true)
        expect(body.data.totalCompleted).toBe(1)
        expect(body.data.teile[0].lessons[0].completion).toEqual({
            bestScore: 3,
            totalQuestions: 3,
            attempts: 2,
        })
        expect(body.data.teile[0].lessons[1].completion).toBeNull()
    })

    it('scopes groupBy to current user and requested lesson ids only', async () => {
        getServerUserMock.mockResolvedValue({ userId: 'user-42' })
        await GET(makeReq('B1'))
        expect(getListeningLessonListMock).toHaveBeenCalledWith('B1')
        expect(groupByMock).toHaveBeenCalledWith(
            expect.objectContaining({
                by: ['lessonId'],
                where: {
                    userId: 'user-42',
                    lessonId: { in: ['db-1', 'db-2'] },
                },
            }),
        )
    })

    it('returns 500 generic error on DB failure', async () => {
        getServerUserMock.mockResolvedValue({ userId: 'user-1' })
        groupByMock.mockRejectedValue(new Error('db down secret'))

        const res = await GET(makeReq('A1'))
        expect(res.status).toBe(500)
        const body = await res.json()
        expect(body.success).toBe(false)
        expect(body.error).toBe('Failed to load listening data')
        expect(JSON.stringify(body)).not.toContain('db down secret')
    })
})
