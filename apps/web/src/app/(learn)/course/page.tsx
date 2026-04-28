import { redirect } from 'next/navigation'
import { prisma } from '@fuxie/database'
import { cookies } from 'next/headers'
import { getServerUser } from '@/lib/auth/server-auth'
import { getVocabularyThemeSrsProgress } from '@/lib/srs/stats'
import { cacheWrap } from '@/lib/cache/redis'
import { CourseClient } from '@/components/course/CourseClient'
import { getCourseModuleMap } from '@/lib/content/course-data'

export const metadata = {
    title: 'Fuxie 🦊 — Kurs',
    description: 'Deutsch Kurs — Lộ trình học tiếng Đức theo chuẩn CEFR',
}

import type { CefrLevel } from '@/lib/types/cefr'

interface ModuleWithProgress {
    id: string
    slug: string
    title: string
    titleDe: string | null
    description: string | null
    sortOrder: number
    estimatedMinutes: number
    vocabThemes: Array<{
        slug: string
        name: string
        nameNative: string | null
        itemCount: number
        learnedCount: number
    }>
    grammarTopics: Array<{
        slug: string
        titleDe: string
        titleNative: string
        lessonCount: number
        completedCount: number
        totalStars: number
    }>
    skillLinks: Array<{
        skill: 'listening' | 'reading' | 'writing' | 'speaking'
        label: string
        labelNative: string
        href: string
        emoji: string
    }>
    isUnlocked: boolean
}

// Course slugs per CEFR level
const COURSE_SLUGS: Record<CefrLevel, string> = {
    A1: 'deutsch-a1-anfaenger',
    A2: 'deutsch-a2-grundstufe',
    B1: 'deutsch-b1-mittelstufe',
    B2: 'deutsch-b2-oberstufe',
    C1: 'deutsch-c1-fortgeschritten',
    C2: 'deutsch-c2-meisterstufe',
}

const COURSE_DATA_CACHE_TTL_SECONDS = 30

async function getCourseData(userId: string, level: CefrLevel, locale: string) {
    return cacheWrap(
        `course:data:${userId}:${level}:${locale}`,
        COURSE_DATA_CACHE_TTL_SECONDS,
        () => getCourseDataUncached(userId, level, locale),
    )
}

async function getCourseDataUncached(userId: string, level: CefrLevel, locale: string) {
    const courseSlug = COURSE_SLUGS[level]

    const [course, vocabThemes, themeProgress, grammarTopics] = await Promise.all([
        prisma.course.findFirst({
            where: { slug: courseSlug },
            select: {
                title: true,
                titleDe: true,
                description: true,
                modules: {
                    orderBy: { sortOrder: 'asc' },
                    select: {
                        id: true,
                        slug: true,
                        title: true,
                        titleDe: true,
                        description: true,
                        sortOrder: true,
                        estimatedMinutes: true,
                    },
                },
            },
        }),
        prisma.vocabularyTheme.findMany({
            where: { cefrLevel: level },
            select: {
                id: true,
                slug: true,
                name: true,
                translations: true,
                _count: { select: { items: true } },
            },
        }),
        getVocabularyThemeSrsProgress(userId, level),
        prisma.grammarTopic.findMany({
            where: { cefrLevel: level },
            select: {
                id: true,
                slug: true,
                title: true,
                titleDe: true,
                translations: true,
                lessons: {
                    select: {
                        id: true,
                        topicId: true,
                    },
                },
            },
        }),
    ])

    if (!course) return null

    // 2. Get module → vocab/grammar/skill mappings from static imports
    const moduleMap = getCourseModuleMap(level)

    const vocabThemeMap = new Map(vocabThemes.map(t => [t.slug, t]))
    const grammarTopicMap = new Map(grammarTopics.map((t) => [t.slug, t]))

    // 3. Grammar lessons are selected with topics above to avoid one more round-trip.
    const grammarLessons = grammarTopics.flatMap((topic) => topic.lessons)
    const lessonsByTopic: Record<string, any[]> = {}
    for (const l of grammarLessons) {
        if (!lessonsByTopic[l.topicId]) lessonsByTopic[l.topicId] = []
        lessonsByTopic[l.topicId]!.push(l)
    }

    // 4. Fetch personalized grammar progress after lesson ids are known.
    const grammarLessonIds = grammarLessons.map((l) => l.id)
    const grammarProgress = grammarLessonIds.length > 0
        ? await prisma.grammarProgress.findMany({
            where: { userId, lessonId: { in: grammarLessonIds } },
            select: {
                lessonId: true,
                completed: true,
                stars: true,
            },
        })
        : []
    const progressMap: Record<string, { completed: boolean; stars: number }> = {}
    for (const p of grammarProgress) {
        progressMap[p.lessonId] = { completed: p.completed, stars: p.stars ?? 0 }
    }

    // 5. Build modules with progress
    const modules: ModuleWithProgress[] = course.modules.map((mod, idx) => {
        const mapping = moduleMap[mod.slug] ?? { vocabularyThemes: [], grammarTopics: [], skillLinks: [] }

        // Resolve vocab themes
        const vocabThemesResolved = mapping.vocabularyThemes
            .map(slug => {
                const theme = vocabThemeMap.get(slug)
                if (!theme) return null
                return {
                    slug: theme.slug,
                    name: theme.name,
                    nameNative: (theme.translations as any)?.[locale] || theme.name,
                    itemCount: theme._count.items,
                    learnedCount: themeProgress[theme.id]?.started ?? 0,
                }
            })
            .filter(Boolean) as ModuleWithProgress['vocabThemes']

        // Resolve grammar topics
        const grammarTopicsResolved = mapping.grammarTopics
            .map(slug => {
                const topic = grammarTopicMap.get(slug) as any
                if (!topic) return null
                const lessons = lessonsByTopic[topic.id] ?? []
                const completedCount = lessons.filter((l: any) => progressMap[l.id]?.completed).length
                const totalStars = lessons.reduce((s: number, l: any) => s + (progressMap[l.id]?.stars ?? 0), 0)
                return {
                    slug: topic.slug,
                    titleDe: topic.titleDe ?? topic.title ?? '',
                    titleNative: (topic.translations as any)?.[locale] || topic.titleDe || '',
                    lessonCount: lessons.length,
                    completedCount,
                    totalStars,
                }
            })
            .filter(Boolean) as ModuleWithProgress['grammarTopics']

        // Unlock logic: first module always unlocked, rest need previous module completed
        const isUnlocked = idx === 0 || true

        return {
            id: mod.id,
            slug: mod.slug,
            title: mod.title,
            titleDe: mod.titleDe,
            description: mod.description,
            sortOrder: mod.sortOrder,
            estimatedMinutes: mod.estimatedMinutes,
            vocabThemes: vocabThemesResolved,
            grammarTopics: grammarTopicsResolved,
            skillLinks: mapping.skillLinks ?? [],
            isUnlocked,
        }
    })

    return {
        courseTitle: course.title,
        courseTitleDe: course.titleDe ?? course.title,
        courseDescription: course.description,
        cefrLevel: level,
        modules,
    }
}

export default async function CoursePage({
    searchParams,
}: {
    searchParams: Promise<{ level?: string }>
}) {
    const serverUser = await getServerUser()
    if (!serverUser) redirect('/login')

    const params = await searchParams
    const requestedLevel = (params.level?.toUpperCase() ?? '') as CefrLevel
    const validLevels: CefrLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']

    // Determine level: from query param, or user's current level, or A1
    let level: CefrLevel = 'A1'
    if (validLevels.includes(requestedLevel)) {
        level = requestedLevel
    } else {
        const profile = await prisma.userProfile.findFirst({
            where: { userId: serverUser.userId },
            select: { currentLevel: true },
        })
        level = (profile?.currentLevel ?? 'A1') as CefrLevel
    }

    const locale = (await cookies()).get('NEXT_LOCALE')?.value || serverUser.uiLanguage || 'vi'

    let data = null
    try {
        data = await getCourseData(serverUser.userId, level, locale)
    } catch (err: any) {
        console.error('[CoursePage] getCourseData error:', err)
        return (
            <div className="max-w-4xl mx-auto px-4 py-16 text-center">
                <p className="text-lg text-red-500 mb-4">Lỗi tải dữ liệu khóa học: {err?.message ?? 'Unknown error'}</p>
                <pre className="text-xs text-left bg-gray-100 p-4 rounded max-h-40 overflow-auto">{err?.stack ?? ''}</pre>
            </div>
        )
    }

    if (!data) {
        return (
            <div className="max-w-4xl mx-auto px-4 py-16 text-center">
                <p className="text-lg text-gray-500 mb-4">Chưa có khóa học {level}. Vui lòng seed data trước.</p>
                {/* Level selector */}
                <div className="flex flex-wrap gap-2 justify-center">
                    {validLevels.map(l => (
                        <a
                            key={l}
                            href={`/course?level=${l}`}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors
                                ${l === level
                                    ? 'bg-blue-500 text-white'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                        >
                            {l}
                        </a>
                    ))}
                </div>
            </div>
        )
    }

    return (
        <div>
            {/* Level selector */}
            <div className="max-w-4xl mx-auto px-4 pt-6">
                <div className="flex flex-wrap gap-2">
                    {validLevels.map(l => (
                        <a
                            key={l}
                            href={`/course?level=${l}`}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors
                                ${l === level
                                    ? 'bg-blue-500 text-white shadow-md'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                        >
                            {l}
                        </a>
                    ))}
                </div>
            </div>
            <CourseClient data={data} />
        </div>
    )
}
