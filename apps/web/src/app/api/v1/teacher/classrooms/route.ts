import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@fuxie/database'
import { handleApiError } from '@/lib/api/error-handler'
import { requireTeacher, generateJoinCode } from '@/lib/auth/teacher-guard'

// GET /api/v1/teacher/classrooms — list teacher's classrooms
export async function GET(request: NextRequest) {
  try {
    const user = await requireTeacher(request)

    const classrooms = await prisma.classroom.findMany({
      where: { teacherId: user.userId, isArchived: false },
      include: {
        _count: { select: { enrollments: true, assignments: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({
      success: true,
      data: classrooms.map(c => ({
        id: c.id,
        name: c.name,
        description: c.description,
        joinCode: c.joinCode,
        cefrLevel: c.cefrLevel,
        studentCount: c._count.enrollments,
        assignmentCount: c._count.assignments,
        createdAt: c.createdAt,
      })),
    })
  } catch (err) {
    return handleApiError(err)
  }
}

// POST /api/v1/teacher/classrooms — create a new classroom
export async function POST(request: NextRequest) {
  try {
    const user = await requireTeacher(request)
    const body = await request.json()
    const { name, description, cefrLevel } = body

    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return NextResponse.json(
        { success: false, error: 'Tên lớp phải có ít nhất 2 ký tự.' },
        { status: 400 },
      )
    }

    const joinCode = await generateJoinCode()

    const classroom = await prisma.classroom.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        cefrLevel: cefrLevel || 'A1',
        joinCode,
        teacherId: user.userId,
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        id: classroom.id,
        name: classroom.name,
        joinCode: classroom.joinCode,
        cefrLevel: classroom.cefrLevel,
      },
    }, { status: 201 })
  } catch (err) {
    return handleApiError(err)
  }
}
