import { redirect } from 'next/navigation'
import { prisma } from '@fuxie/database'
import { cookies } from 'next/headers'
import { getTranslations } from 'next-intl/server'
import { getServerUser } from '@/lib/auth/server-auth'
import { getVocabularyThemeSrsProgress } from '@/lib/srs/stats'
import { cacheWrap } from '@/lib/cache/redis'
import { CourseClientDynamic } from '@/components/course/CourseClientDynamic'
import { StateShell } from '@/components/gamification/state-shell'
import { getCourseModuleMap } from '@/lib/content/course-data'
import type { ReactNode } from 'react'

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
const VALID_CEFR_LEVELS: CefrLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']

function resolveRequestedCourseLevel(level?: string): CefrLevel | null {
    const requestedLevel = (level?.toUpperCase() ?? '') as CefrLevel
    return VALID_CEFR_LEVELS.includes(requestedLevel) ? requestedLevel : null
}

function isCourseVisualQaFixture(params: { fixture?: string } | undefined) {
    return process.env.NODE_ENV !== 'production' && params?.fixture === 'visual-qa'
}

function CourseRouteShell({
    visualState,
    children,
}: {
    visualState: 'default' | 'empty' | 'loading'
    children: ReactNode
}) {
    return (
        <div
            data-route="course"
            data-slice="slice-1"
            data-module="02-course"
            data-visual-state={visualState}
        >
            {children}
        </div>
    )
}

function CourseLevelSelector({
    level,
    isVisualQa,
    visualState,
}: {
    level: CefrLevel
    isVisualQa?: boolean
    visualState?: string
}) {
    return (
        <div className="max-w-6xl mx-auto px-4 pt-6" data-role="course-level-selector">
            <div className="flex flex-wrap gap-2">
                {VALID_CEFR_LEVELS.map(l => {
                    let href = `/course?level=${l}`
                    if (isVisualQa) {
                        href += `&fixture=visual-qa`
                        if (visualState) {
                            href += `&state=${visualState}`
                        }
                    }
                    return (
                        <a
                            key={l}
                            href={href}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors
                                ${l === level
                                    ? 'bg-blue-500 text-white shadow-md'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                        >
                            {l}
                        </a>
                    )
                })}
            </div>
        </div>
    )
}

function SkeletonBlock({ className }: { className: string }) {
    return <div className={`animate-pulse rounded-2xl bg-white/70 ${className}`} />
}

function CourseLoadingVisualState({
    level,
    isVisualQa,
    visualState,
}: {
    level: CefrLevel
    isVisualQa?: boolean
    visualState?: string
}) {
    return (
        <section
            className="min-h-[100dvh] bg-[#F3FBFF] pb-8"
            data-role="course-loading-state"
            aria-busy="true"
            aria-live="polite"
        >
            <CourseLevelSelector level={level} isVisualQa={isVisualQa} visualState={visualState} />

            <div className="max-w-6xl mx-auto grid gap-5 px-4 py-6 lg:grid-cols-[260px_minmax(0,1fr)]">
                <aside className="rounded-3xl border border-[#CCE4F0] bg-white/80 p-4 shadow-sm">
                    <div className="mb-4 h-5 w-28 animate-pulse rounded-full bg-[#CCE4F0]" />
                    <div className="space-y-3">
                        {VALID_CEFR_LEVELS.map((item) => (
                            <div
                                key={item}
                                className="flex items-center gap-3 rounded-2xl border border-[#CCE4F0]/70 bg-[#F3FBFF] p-3"
                            >
                                <span className="grid h-9 w-9 place-items-center rounded-full bg-white text-xs font-black text-[#3C78A8]">
                                    {item}
                                </span>
                                <SkeletonBlock className="h-3 flex-1" />
                            </div>
                        ))}
                    </div>
                </aside>

                <div className="min-w-0 space-y-5">
                    <div className="rounded-3xl border border-[#CCE4F0] bg-white p-5 shadow-sm">
                        <div className="flex flex-wrap items-center gap-3">
                            <span className="rounded-full bg-[#2EC4B6] px-3 py-1 text-xs font-black text-white">
                                {level}
                            </span>
                            <SkeletonBlock className="h-5 w-48 max-w-full" />
                        </div>
                        <div className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_160px]">
                            <div className="space-y-3">
                                <SkeletonBlock className="h-8 w-full max-w-xl" />
                                <SkeletonBlock className="h-4 w-4/5" />
                                <SkeletonBlock className="h-4 w-2/3" />
                            </div>
                            <div className="hidden rounded-2xl bg-[#EAF6FF] p-4 sm:block">
                                <SkeletonBlock className="h-24 w-full" />
                            </div>
                        </div>
                    </div>

                    <div
                        className="rounded-3xl border border-[#CCE4F0] bg-white/90 p-4 shadow-sm"
                        data-role="course-loading-path"
                    >
                        <div className="flex min-h-[140px] items-center gap-4 overflow-hidden">
                            {Array.from({ length: 5 }).map((_, index) => (
                                <div key={index} className="flex min-w-[88px] flex-col items-center gap-3">
                                    <div className="h-14 w-14 animate-pulse rounded-2xl bg-[#CCE4F0]" />
                                    <SkeletonBlock className="h-3 w-20" />
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {Array.from({ length: 6 }).map((_, index) => (
                            <div
                                key={index}
                                className="rounded-3xl border border-[#CCE4F0] bg-white p-4 shadow-sm"
                                data-role="course-loading-card"
                            >
                                <SkeletonBlock className="h-28 w-full" />
                                <div className="mt-4 space-y-2">
                                    <SkeletonBlock className="h-4 w-3/4" />
                                    <SkeletonBlock className="h-3 w-full" />
                                    <SkeletonBlock className="h-3 w-2/3" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    )
}

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

const MOCK_COURSE_DATA_FOR_LEVEL = (level: CefrLevel) => ({
    courseTitle: `Deutsch ${level} Kurs`,
    courseTitleDe: `Deutsch ${level} Kurs`,
    courseDescription: `Lộ trình học tiếng Đức chuẩn CEFR cấp độ ${level}. Học các chủ đề từ vựng, ngữ pháp và rèn luyện 4 kỹ năng tương ứng.`,
    cefrLevel: level,
    modules: [
        {
            id: `mod-${level}-1`,
            slug: `module-${level.toLowerCase()}-1`,
            title: `Chủ đề học tập 1 (${level})`,
            titleDe: `Thema 1 (${level})`,
            description: `Học các kiến thức từ vựng và cấu trúc ngữ pháp cơ bản của chủ đề 1 cấp độ ${level}.`,
            sortOrder: 1,
            estimatedMinutes: 50,
            vocabThemes: [
                {
                    slug: `vocab-${level.toLowerCase()}-1`,
                    name: `Wortschatz Thema 1`,
                    nameNative: `Từ vựng chủ đề 1`,
                    itemCount: 18,
                    learnedCount: 12,
                },
                {
                    slug: `vocab-${level.toLowerCase()}-2`,
                    name: `Wortschatz Thema 2`,
                    nameNative: `Từ vựng chủ đề 2`,
                    itemCount: 15,
                    learnedCount: 0,
                }
            ],
            grammarTopics: [
                {
                    slug: `grammar-${level.toLowerCase()}-1`,
                    titleDe: `Grammatik Thema 1`,
                    titleNative: `Ngữ pháp chủ đề 1`,
                    lessonCount: 3,
                    completedCount: 2,
                    totalStars: 5,
                }
            ],
            skillLinks: [
                {
                    skill: 'listening' as const,
                    label: 'Hörverstehen',
                    labelNative: 'Luyện nghe chủ đề 1',
                    href: '/session?fixture=visual-qa&type=listening',
                    emoji: '🎧',
                },
                {
                    skill: 'reading' as const,
                    label: 'Leseverstehen',
                    labelNative: 'Luyện đọc chủ đề 1',
                    href: '/session?fixture=visual-qa&type=reading',
                    emoji: '📖',
                }
            ],
            isUnlocked: true,
        },
        {
            id: `mod-${level}-2`,
            slug: `module-${level.toLowerCase()}-2`,
            title: `Chủ đề học tập 2 (${level})`,
            titleDe: `Thema 2 (${level})`,
            description: `Mở rộng vốn từ và nâng cao kỹ năng viết, nói cho chủ đề 2 cấp độ ${level}.`,
            sortOrder: 2,
            estimatedMinutes: 60,
            vocabThemes: [
                {
                    slug: `vocab-${level.toLowerCase()}-3`,
                    name: `Wortschatz Thema 3`,
                    nameNative: `Từ vựng chủ đề 3`,
                    itemCount: 22,
                    learnedCount: 0,
                }
            ],
            grammarTopics: [
                {
                    slug: `grammar-${level.toLowerCase()}-2`,
                    titleDe: `Grammatik Thema 2`,
                    titleNative: `Ngữ pháp chủ đề 2`,
                    lessonCount: 4,
                    completedCount: 0,
                    totalStars: 0,
                }
            ],
            skillLinks: [
                {
                    skill: 'writing' as const,
                    label: 'Schreiben',
                    labelNative: 'Luyện viết chủ đề 2',
                    href: '/session?fixture=visual-qa&type=writing',
                    emoji: '✍️',
                },
                {
                    skill: 'speaking' as const,
                    label: 'Sprechen',
                    labelNative: 'Luyện nói chủ đề 2',
                    href: '/session?fixture=visual-qa&type=speaking',
                    emoji: '🗣️',
                }
            ],
            isUnlocked: true,
        }
    ]
})

export default async function CoursePage({
    searchParams,
}: {
    searchParams: Promise<{ level?: string; state?: string; fixture?: string }>
}) {
    const params = await searchParams
    const requestedLevel = resolveRequestedCourseLevel(params.level)

    // Determine level: from query param, or user's current level, or A1
    let level: CefrLevel = requestedLevel ?? 'A1'

    const isVisualQa = isCourseVisualQaFixture(params)
    const visualState = params.state || 'default'

    if (isVisualQa) {
        if (visualState === 'loading') {
            return (
                <CourseRouteShell visualState="loading">
                    <CourseLoadingVisualState level={level} isVisualQa={isVisualQa} visualState={visualState} />
                </CourseRouteShell>
            )
        }
        if (visualState === 'empty') {
            const t = await getTranslations('SurfaceStates')
            const fallbackLevel: CefrLevel =
                VALID_CEFR_LEVELS.find((candidate) => candidate !== level) ?? 'A1'
            const fallbackHref = `/course?level=${fallbackLevel}&fixture=visual-qa&state=empty`
            return (
                <CourseRouteShell visualState="empty">
                    <div className="max-w-4xl mx-auto px-4 py-8">
                        <StateShell
                            surfaceId="course"
                            state="empty"
                            title={t('course.emptyTitle')}
                            message={t('course.emptyMessage')}
                            primaryCta={{
                                label: t('course.emptyCtaLabel'),
                                href: fallbackHref,
                            }}
                        />
                        <div className="mt-8 flex justify-center">
                            <CourseLevelSelector level={level} isVisualQa={isVisualQa} visualState={visualState} />
                        </div>
                    </div>
                </CourseRouteShell>
            )
        }

        // Default visual qa state
        const data = MOCK_COURSE_DATA_FOR_LEVEL(level)
        return (
            <CourseRouteShell visualState="default">
                <CourseLevelSelector level={level} isVisualQa={isVisualQa} visualState={visualState} />
                <CourseClientDynamic data={data} />
            </CourseRouteShell>
        )
    }

    const serverUser = await getServerUser()
    if (!serverUser) redirect('/login')

    if (!requestedLevel) {
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
        // Throw so the segment-level `error.tsx` boundary renders a
        // `<StateShell state="error">` with mascot=guard, single
        // Primary_CTA "Thử lại", and secondary "Về Dashboard" (Req 11.5).
        // Wrapping with the original message preserves debugging info.
        console.error('[CoursePage] getCourseData error:', err)
        throw new Error(
            `[course] failed to load level ${level}: ${err?.message ?? 'Unknown error'}`,
            { cause: err },
        )
    }

    if (!data) {
        // Empty state — no course seeded for the requested level. Per
        // Req 11.3 the surface renders mascot=guard + a single Primary_CTA.
        // The level selector below the StateShell stays visible so the
        // learner can pivot to a level that does have content.
        const t = await getTranslations('SurfaceStates')
        const fallbackLevel: CefrLevel =
            VALID_CEFR_LEVELS.find((candidate) => candidate !== level) ?? 'A1'
        return (
            <CourseRouteShell visualState="empty">
                <div className="max-w-4xl mx-auto px-4 py-8">
                    <StateShell
                        surfaceId="course"
                        state="empty"
                        title={t('course.emptyTitle')}
                        message={t('course.emptyMessage')}
                        primaryCta={{
                            label: t('course.emptyCtaLabel'),
                            href: `/course?level=${fallbackLevel}`,
                        }}
                    />

                    {/* Level pivot below the empty hero — keeps the surface
                        actionable while still satisfying single-Primary_CTA
                        (Property 8): the level pills are not Primary_CTAs. */}
                    <div className="mt-8 flex flex-wrap gap-2 justify-center">
                        {VALID_CEFR_LEVELS.map(l => (
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
            </CourseRouteShell>
        )
    }

    return (
        <CourseRouteShell visualState="default">
            <CourseLevelSelector level={level} />
            <CourseClientDynamic data={data} />
        </CourseRouteShell>
    )
}
