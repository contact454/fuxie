import { redirect, notFound } from 'next/navigation'
import { prisma } from '@fuxie/database'
import { cookies } from 'next/headers'
import { getServerUser } from '@/lib/auth/server-auth'
import dynamic from 'next/dynamic'

const SpeakingLessonPlayer = dynamic(
  () => import('@/components/speaking/SpeakingLessonPlayer'),
  {
    loading: () => (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-gray-200 border-t-[#FF6B35] rounded-full animate-spin mx-auto" />
          <p className="text-sm text-gray-500 mt-3">Lektion wird geladen…</p>
        </div>
      </div>
    ),
  }
)

export async function generateMetadata({ params }: { params: Promise<{ lessonId: string }> }) {
  const { lessonId } = await params
  const lesson = await prisma.speakingLesson.findUnique({
    where: { id: lessonId },
    select: { titleDe: true, translations: true },
  })
  return {
    title: lesson ? `Fuxie 🦊 — ${(lesson.translations as any)?.['vi'] || lesson.titleDe}` : 'Fuxie 🦊 — Sprechen',
    description: lesson?.titleDe ?? 'German speaking exercise',
  }
}

export default async function SpeakingLessonPage({ params }: { params: Promise<{ lessonId: string }> }) {
  const serverUser = await getServerUser()
  if (!serverUser) redirect('/login')

  const { lessonId } = await params

  const lesson = await prisma.speakingLesson.findUnique({
    where: { id: lessonId },
    include: {
      topic: {
        select: { titleDe: true, translations: true, slug: true },
      },
    },
  })

  if (!lesson) notFound()

  // Prisma JSON fields need explicit serialization to pass through RSC boundary
  const exercisesJson = JSON.parse(JSON.stringify(lesson.exercisesJson ?? {}))
  const configJson = lesson.configJson ? JSON.parse(JSON.stringify(lesson.configJson)) : null

  const locale = (await cookies()).get('NEXT_LOCALE')?.value || 'vi'

  return (
    <SpeakingLessonPlayer
      lessonId={lesson.id}
      titleDe={lesson.titleDe}
      titleNative={(lesson.translations as any)?.[locale] || lesson.titleDe}
      topicTitleNative={(lesson.topic.translations as any)?.[locale] || lesson.topic.titleDe}
      topicSlug={lesson.topic.slug}
      cefrLevel={lesson.level}
      exerciseType={lesson.exerciseType}
      exercisesJson={exercisesJson}
      configJson={configJson}
      estimatedMin={lesson.estimatedMin}
    />
  )
}
