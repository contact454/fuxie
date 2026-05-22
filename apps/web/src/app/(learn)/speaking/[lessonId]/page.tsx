import { redirect, notFound } from 'next/navigation'
import { prisma } from '@fuxie/database'
import { cookies } from 'next/headers'
import { getServerUser } from '@/lib/auth/server-auth'
import { SpeakingLessonPlayerDynamic } from '@/components/speaking/SpeakingLessonPlayerDynamic'
import { pickWorldProp, type WorldTag } from '@/lib/mascot/fuxie-world-tags'
import {
  isSlice2VisualQaFixture,
  Slice2SpeakingErrorFixture,
  type Slice2VisualQaParams,
} from '@/components/visual-fixtures/slice-2-skill-fixtures'

/**
 * World prop tags used to resolve the speaking player's background identity
 * (Requirement 6.6: speaking surface tags ∈ `cafe`/`plaza`).
 *
 * Validates: Requirements 6.6
 */
const SPEAKING_WORLD_PROP_TAGS: WorldTag[] = ['cafe', 'plaza']


export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ lessonId: string }>
  searchParams?: Promise<Slice2VisualQaParams>
}) {
  const visualParams = await searchParams
  if (isSlice2VisualQaFixture(visualParams, 'error')) {
    return {
      title: 'Fuxie - Speaking Visual QA',
      description: 'Slice 2 speaking pronunciation error visual fixture',
    }
  }

  const { lessonId } = await params
  const lesson = await prisma.speakingLesson.findUnique({
    where: { id: lessonId },
    select: { titleDe: true, translations: true },
  })
  return {
    title: lesson ? `Fuxie - ${(lesson.translations as any)?.['vi'] || lesson.titleDe}` : 'Fuxie - Luyện nói',
    description: lesson?.titleDe ?? 'Bài luyện nói tiếng Đức',
  }
}
export default async function SpeakingLessonPage({
  params,
  searchParams,
}: {
  params: Promise<{ lessonId: string }>
  searchParams?: Promise<Slice2VisualQaParams>
}) {
  const visualParams = await searchParams

  if (isSlice2VisualQaFixture(visualParams, 'error')) {
    return <Slice2SpeakingErrorFixture />
  }

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

  // Speaking surface background identity (Requirement 6.6). Resolved through
  // the canonical `pickWorldProp` helper so the asset key swaps with the
  // Asset Registry instead of a hardcoded path.
  const worldPropKey = pickWorldProp(SPEAKING_WORLD_PROP_TAGS)

  return (
    <section
      data-surface-id="speaking"
      data-world-prop-tags={SPEAKING_WORLD_PROP_TAGS.join(',')}
      data-world-prop-key={worldPropKey}
      className="speaking-surface"
    >
      <SpeakingLessonPlayerDynamic
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
    </section>
  )
}
