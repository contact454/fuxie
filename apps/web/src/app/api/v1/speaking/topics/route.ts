import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@fuxie/database'
import { withAuth } from '@/lib/auth/middleware'
import { handleApiError } from '@/lib/api/error-handler'

export async function GET(request: NextRequest) {
  try {
    const session = await withAuth(request)
    const { searchParams } = new URL(request.url)
    const level = searchParams.get('level') || 'A1'

    const topics = await prisma.speakingTopic.findMany({
      where: { status: 'PUBLISHED', cefrLevel: level as any },
      select: {
        id: true,
        slug: true,
        titleDe: true,
        titleVi: true,
        description: true,
        cefrLevel: true,
        sortOrder: true,
        lessons: {
          where: { status: 'PUBLISHED' },
          orderBy: { sortOrder: 'asc' },
          select: {
            id: true,
            topicId: true,
            level: true,
            lessonType: true,
            lessonNumber: true,
            titleDe: true,
            titleVi: true,
            exerciseType: true,
            exercisesJson: true,
            configJson: true,
            estimatedMin: true,
          },
        },
      },
      orderBy: [
        { cefrLevel: 'asc' },
        { sortOrder: 'asc' },
      ],
    })

    // Fetch progress
    const allLessonIds = topics.flatMap(t => t.lessons.map(l => l.id))
    const progressRecords = allLessonIds.length > 0
      ? await prisma.speakingProgress.findMany({
          where: { userId: session.userId, lessonId: { in: allLessonIds } },
          select: { lessonId: true, score: true, maxScore: true, stars: true, attempts: true, completed: true },
        })
      : []

    const progressMap: Record<string, any> = {}
    for (const p of progressRecords) {
      progressMap[p.lessonId] = {
        bestScore: p.score ?? 0,
        maxScore: p.maxScore ?? 100,
        stars: p.stars ?? 0,
        attempts: p.attempts,
        completed: p.completed,
      }
    }

    const topicsWithProgress = topics.map(topic => ({
      ...topic,
      lessons: topic.lessons.map(lesson => ({
        ...lesson,
        completion: progressMap[lesson.id] ?? null,
      })),
    }))

    const totalLessons = allLessonIds.length
    const completedLessons = progressRecords.filter(p => p.completed).length
    const totalStars = progressRecords.reduce((s, p) => s + (p.stars ?? 0), 0)

    return NextResponse.json({
      topics: topicsWithProgress,
      totalLessons,
      completedLessons,
      totalStars,
    })
  } catch (err) {
    return handleApiError(err)
  }
}
