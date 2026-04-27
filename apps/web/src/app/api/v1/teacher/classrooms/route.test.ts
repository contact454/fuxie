import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const {
    requireTeacherMock,
    generateJoinCodeMock,
    cacheWrapMock,
    cacheInvalidatePrefixMock,
    findManyClassroomsMock,
    createClassroomMock,
} = vi.hoisted(() => ({
    requireTeacherMock: vi.fn(),
    generateJoinCodeMock: vi.fn(),
    cacheWrapMock: vi.fn(),
    cacheInvalidatePrefixMock: vi.fn(),
    findManyClassroomsMock: vi.fn(),
    createClassroomMock: vi.fn(),
}))

vi.mock('@/lib/auth/teacher-guard', () => ({
    requireTeacher: requireTeacherMock,
    generateJoinCode: generateJoinCodeMock,
}))

vi.mock('@/lib/cache/redis', () => ({
    cacheWrap: cacheWrapMock,
    cacheInvalidatePrefix: cacheInvalidatePrefixMock,
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
        classroom: {
            findMany: findManyClassroomsMock,
            create: createClassroomMock,
        },
    },
}))

import { GET, POST } from './route'

describe('/api/v1/teacher/classrooms', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        requireTeacherMock.mockResolvedValue({
            userId: 'teacher-1',
            role: 'TEACHER',
        })
        cacheWrapMock.mockImplementation(async (_key: string, _ttl: number, fetcher: () => Promise<unknown>) => fetcher())
        cacheInvalidatePrefixMock.mockResolvedValue(undefined)
        findManyClassroomsMock.mockResolvedValue([
            {
                id: 'classroom-1',
                name: 'A1 Abendkurs',
                description: null,
                joinCode: 'FUX-ABC',
                cefrLevel: 'A1',
                createdAt: new Date('2026-04-24T08:00:00.000Z'),
                _count: {
                    enrollments: 3,
                    assignments: 2,
                },
            },
        ])
        generateJoinCodeMock.mockResolvedValue('FUX-XYZ')
        createClassroomMock.mockResolvedValue({
            id: 'classroom-2',
            name: 'B1 Kurs',
            joinCode: 'FUX-XYZ',
            cefrLevel: 'B1',
        })
    })

    it('caches the teacher classroom list and selects only rendered fields', async () => {
        const response = await GET(new NextRequest('http://localhost/api/v1/teacher/classrooms'))

        expect(response.status).toBe(200)
        await expect(response.json()).resolves.toMatchObject({
            success: true,
            data: [
                {
                    id: 'classroom-1',
                    studentCount: 3,
                    assignmentCount: 2,
                },
            ],
        })
        expect(cacheWrapMock).toHaveBeenCalledWith(
            'teacher:classrooms:teacher-1',
            15,
            expect.any(Function),
        )
        expect(findManyClassroomsMock).toHaveBeenCalledWith({
            where: { teacherId: 'teacher-1', isArchived: false },
            select: {
                id: true,
                name: true,
                description: true,
                joinCode: true,
                cefrLevel: true,
                createdAt: true,
                _count: { select: { enrollments: true, assignments: true } },
            },
            orderBy: { createdAt: 'desc' },
        })
    })

    it('invalidates the cached classroom list after creating a classroom', async () => {
        const response = await POST(classroomRequest({
            name: 'B1 Kurs',
            cefrLevel: 'B1',
        }))

        expect(response.status).toBe(201)
        expect(createClassroomMock).toHaveBeenCalledWith({
            data: {
                name: 'B1 Kurs',
                description: null,
                cefrLevel: 'B1',
                joinCode: 'FUX-XYZ',
                teacherId: 'teacher-1',
            },
        })
        expect(cacheInvalidatePrefixMock).toHaveBeenCalledWith('teacher:classrooms:teacher-1')
    })
})

function classroomRequest(body: unknown) {
    return new NextRequest('http://localhost/api/v1/teacher/classrooms', {
        method: 'POST',
        body: JSON.stringify(body),
        headers: { 'content-type': 'application/json' },
    })
}
