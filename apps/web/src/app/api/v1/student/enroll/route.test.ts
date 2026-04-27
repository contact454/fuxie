import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const {
    withDbAuthMock,
    findClassroomMock,
    findEnrollmentMock,
    createEnrollmentMock,
    updateEnrollmentMock,
    findAssignmentsMock,
    createManySubmissionsMock,
    cacheInvalidatePrefixMock,
} = vi.hoisted(() => ({
    withDbAuthMock: vi.fn(),
    findClassroomMock: vi.fn(),
    findEnrollmentMock: vi.fn(),
    createEnrollmentMock: vi.fn(),
    updateEnrollmentMock: vi.fn(),
    findAssignmentsMock: vi.fn(),
    createManySubmissionsMock: vi.fn(),
    cacheInvalidatePrefixMock: vi.fn(),
}))

vi.mock('@/lib/auth/middleware', () => ({
    withDbAuth: withDbAuthMock,
}))

vi.mock('@/lib/cache/redis', () => ({
    cacheInvalidatePrefix: cacheInvalidatePrefixMock,
}))

vi.mock('@fuxie/database', () => ({
    prisma: {
        classroom: {
            findUnique: findClassroomMock,
        },
        classEnrollment: {
            findUnique: findEnrollmentMock,
            create: createEnrollmentMock,
            update: updateEnrollmentMock,
        },
        assignment: {
            findMany: findAssignmentsMock,
        },
        assignmentSubmission: {
            createMany: createManySubmissionsMock,
        },
    },
}))

import { POST } from './route'

describe('POST /api/v1/student/enroll', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        withDbAuthMock.mockResolvedValue({
            userId: 'db-student-1',
            role: 'LEARNER',
        })
        findClassroomMock.mockResolvedValue({
            id: 'classroom-1',
            name: 'A1 Abendkurs',
            cefrLevel: 'A1',
            isArchived: false,
            teacherId: 'teacher-1',
        })
        findEnrollmentMock.mockResolvedValue(null)
        createEnrollmentMock.mockResolvedValue({})
        findAssignmentsMock.mockResolvedValue([
            { id: 'assignment-1' },
            { id: 'assignment-2' },
        ])
        createManySubmissionsMock.mockResolvedValue({ count: 2 })
        cacheInvalidatePrefixMock.mockResolvedValue(undefined)
    })

    it('rejects malformed join codes before querying classrooms', async () => {
        const response = await POST(enrollRequest({ joinCode: 'bad-code' }))

        expect(response.status).toBe(400)
        expect(findClassroomMock).not.toHaveBeenCalled()
    })

    it('enrolls using the database user id and backfills pending submissions', async () => {
        const response = await POST(enrollRequest({ joinCode: 'fux-abc' }))

        expect(response.status).toBe(200)
        expect(findClassroomMock).toHaveBeenCalledWith({
            where: { joinCode: 'FUX-ABC' },
            select: { id: true, name: true, cefrLevel: true, isArchived: true, teacherId: true },
        })
        expect(createEnrollmentMock).toHaveBeenCalledWith({
            data: {
                classroomId: 'classroom-1',
                studentId: 'db-student-1',
            },
        })
        expect(createManySubmissionsMock).toHaveBeenCalledWith({
            data: [
                { assignmentId: 'assignment-1', studentId: 'db-student-1', status: 'pending' },
                { assignmentId: 'assignment-2', studentId: 'db-student-1', status: 'pending' },
            ],
            skipDuplicates: true,
        })
        expect(cacheInvalidatePrefixMock).toHaveBeenCalledWith('teacher:classrooms:teacher-1')
    })
})

function enrollRequest(body: unknown) {
    return new NextRequest('http://localhost/api/v1/student/enroll', {
        method: 'POST',
        body: JSON.stringify(body),
        headers: { 'content-type': 'application/json' },
    })
}
