import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const {
    requireTeacherMock,
    findClassroomMock,
    createAssignmentMock,
    createManySubmissionsMock,
    transactionMock,
    cacheInvalidatePrefixMock,
} = vi.hoisted(() => ({
    requireTeacherMock: vi.fn(),
    findClassroomMock: vi.fn(),
    createAssignmentMock: vi.fn(),
    createManySubmissionsMock: vi.fn(),
    transactionMock: vi.fn(),
    cacheInvalidatePrefixMock: vi.fn(),
}))

vi.mock('@/lib/auth/teacher-guard', () => ({
    requireTeacher: requireTeacherMock,
}))

vi.mock('@/lib/auth/middleware', () => {
    class AuthError extends Error {}
    class NotFoundError extends Error {}
    return { AuthError, NotFoundError }
})

vi.mock('@/lib/cache/redis', () => ({
    cacheInvalidatePrefix: cacheInvalidatePrefixMock,
}))

vi.mock('@fuxie/database', () => ({
    prisma: {
        classroom: {
            findUnique: findClassroomMock,
        },
        $transaction: transactionMock,
    },
    Prisma: {
        JsonNull: 'JsonNull',
    },
}))

import { POST } from './route'

describe('POST /api/v1/teacher/assignments', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        requireTeacherMock.mockResolvedValue({
            userId: 'db-teacher-1',
            role: 'TEACHER',
        })
        findClassroomMock.mockResolvedValue({
            id: classroomId,
            teacherId: 'db-teacher-1',
            enrollments: [
                { studentId: 'student-1' },
                { studentId: 'student-2' },
            ],
        })
        createAssignmentMock.mockResolvedValue({
            id: 'assignment-1',
            title: 'Wortschatz review',
            targetType: 'vocabulary',
            dueDate: new Date('2026-04-25T08:00:00.000Z'),
        })
        createManySubmissionsMock.mockResolvedValue({ count: 2 })
        cacheInvalidatePrefixMock.mockResolvedValue(undefined)
        transactionMock.mockImplementation(async (callback: (tx: any) => Promise<unknown>) =>
            callback({
                assignment: { create: createAssignmentMock },
                assignmentSubmission: { createMany: createManySubmissionsMock },
            })
        )
    })

    it('rejects invalid target types before touching the classroom', async () => {
        const response = await POST(assignmentRequest({
            classroomId,
            title: 'Bad target',
            targetType: 'unknown',
        }))

        expect(response.status).toBe(400)
        expect(findClassroomMock).not.toHaveBeenCalled()
        expect(transactionMock).not.toHaveBeenCalled()
    })

    it('creates an assignment for a teacher-owned classroom and assigns active students', async () => {
        const response = await POST(assignmentRequest({
            classroomId,
            title: 'Wortschatz review',
            description: 'Practice food vocabulary',
            targetType: 'vocabulary',
            dueDate: '2026-04-25T08:00',
        }))

        expect(response.status).toBe(201)
        expect(findClassroomMock).toHaveBeenCalledWith({
            where: { id: classroomId },
            include: {
                enrollments: { where: { removedAt: null }, select: { studentId: true } },
            },
        })
        expect(createAssignmentMock).toHaveBeenCalledWith({
            data: expect.objectContaining({
                classroomId,
                title: 'Wortschatz review',
                description: 'Practice food vocabulary',
                targetType: 'vocabulary',
                targetId: null,
                targetMeta: 'JsonNull',
                dueDate: expect.any(Date),
            }),
        })
        expect(createManySubmissionsMock).toHaveBeenCalledWith({
            data: [
                { assignmentId: 'assignment-1', studentId: 'student-1', status: 'pending' },
                { assignmentId: 'assignment-1', studentId: 'student-2', status: 'pending' },
            ],
        })
        expect(cacheInvalidatePrefixMock).toHaveBeenCalledWith('teacher:classrooms:db-teacher-1')
    })
})

const classroomId = '11111111-1111-4111-8111-111111111111'

function assignmentRequest(body: unknown) {
    return new NextRequest('http://localhost/api/v1/teacher/assignments', {
        method: 'POST',
        body: JSON.stringify(body),
        headers: { 'content-type': 'application/json' },
    })
}
