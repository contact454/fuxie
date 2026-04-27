import { redirect } from 'next/navigation'
import { prisma } from '@fuxie/database'
import { cookies } from 'next/headers'
import { getServerUser } from '@/lib/auth/server-auth'
import { cacheWrap } from '@/lib/cache/redis'
import { SpeakingClientDynamic } from '@/components/speaking/SpeakingClientDynamic'
import type { SpeakingTopicData, CefrLevel } from '@/components/speaking/types'

export const metadata = {
  title: 'Sprechen | Fuxie',
  description: 'Luyện nói tiếng Đức — Phát âm, hội thoại, trình bày',
}

async function getSpeakingLevels(): Promise<CefrLevel[]> {
  return cacheWrap('speaking:levels', 3600, async () => {
    const levels = await prisma.speakingTopic.findMany({
      where: { status: 'PUBLISHED' },
      select: { cefrLevel: true },
      distinct: ['cefrLevel'],
      orderBy: { cefrLevel: 'asc' },
    })
    if (levels.length === 0) return ['A1']
    return levels.map(l => l.cefrLevel as CefrLevel)
  })
}

async function getSpeakingData(userId: string, cefrLevel: CefrLevel) {
  const topics = await cacheWrap(`speaking:topics:${cefrLevel}`, 3600, () => prisma.speakingTopic.findMany({
    where: { status: 'PUBLISHED', cefrLevel },
    select: {
      id: true,
      slug: true,
      titleDe: true,
      translations: true,
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
          translations: true,
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
  }))

  // Fetch progress for all lessons
  const allLessonIds = topics.flatMap(t => t.lessons.map(l => l.id))
  const progressRecords = allLessonIds.length > 0
    ? await prisma.speakingProgress.findMany({
        where: { userId, lessonId: { in: allLessonIds } },
        select: { lessonId: true, score: true, maxScore: true, stars: true, attempts: true, completed: true },
      })
    : []
  const progressMap: Record<string, { bestScore: number; maxScore: number; stars: number; attempts: number; completed: boolean }> = {}
  for (const p of progressRecords) {
    progressMap[p.lessonId] = {
      bestScore: p.score ?? 0,
      maxScore: p.maxScore ?? 100,
      stars: p.stars ?? 0,
      attempts: p.attempts,
      completed: p.completed,
    }
  }

  // Attach completion data to lessons
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

  const locale = (await cookies()).get('NEXT_LOCALE')?.value || 'vi'

  // Map translations to titleNative for client
  const mappedTopics = topicsWithProgress.map(topic => ({
    ...topic,
    titleNative: (topic.translations as any)?.[locale] || topic.titleDe,
    lessons: topic.lessons.map(lesson => ({
      ...lesson,
      titleNative: (lesson.translations as any)?.[locale] || lesson.titleDe,
    })),
  }))

  return {
    topics: mappedTopics,
    totalLessons,
    completedLessons,
    totalStars,
  }
}

export default async function SpeakingPage() {
  const serverUser = await getServerUser()
  if (!serverUser) redirect('/login')

  const availableLevels = await getSpeakingLevels()
  const defaultLevel: CefrLevel = availableLevels[0] || 'A1'
  const data = await getSpeakingData(serverUser.userId, defaultLevel)

  return (
    <SpeakingClientDynamic
      topics={data.topics as unknown as SpeakingTopicData[]}
      availableLevels={availableLevels}
      initialLevel={defaultLevel}
      totalLessons={data.totalLessons}
      completedLessons={data.completedLessons}
      totalStars={data.totalStars}
    />
  )
}
