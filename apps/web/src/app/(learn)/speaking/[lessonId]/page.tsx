import { redirect, notFound } from 'next/navigation'
import { prisma } from '@fuxie/database'
import { getServerUser } from '@/lib/auth/server-auth'
import SpeakingLessonPlayer from '@/components/speaking/SpeakingLessonPlayer'

export async function generateMetadata({ params }: { params: Promise<{ lessonId: string }> }) {
  const { lessonId } = await params
  const lesson = await prisma.speakingLesson.findUnique({
    where: { id: lessonId },
    select: { titleDe: true, titleVi: true },
  })
  return {
    title: lesson ? `Fuxie 🦊 — ${lesson.titleVi}` : 'Fuxie 🦊 — Sprechen',
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
        select: { titleDe: true, titleVi: true, slug: true },
      },
    },
  })

  if (!lesson) notFound()

  return (
    <SpeakingLessonPlayer
      lessonId={lesson.id}
      titleDe={lesson.titleDe}
      titleVi={lesson.titleVi}
      topicTitleVi={lesson.topic.titleVi}
      topicSlug={lesson.topic.slug}
      cefrLevel={lesson.level}
      exerciseType={lesson.exerciseType}
      exercisesJson={lesson.exercisesJson as any}
      configJson={lesson.configJson as any}
      estimatedMin={lesson.estimatedMin}
    />
  )
}
