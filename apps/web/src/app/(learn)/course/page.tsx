import { redirect } from 'next/navigation'
import { prisma } from '@fuxie/database'
import { getServerUser } from '@/lib/auth/server-auth'
import { getVocabularyThemeSrsProgress } from '@/lib/srs/stats'
import { CourseClient } from '@/components/course/CourseClient'

export const metadata = {
    title: 'Fuxie 🦊 — Kurs',
    description: 'Deutsch Kurs — Lộ trình học tiếng Đức theo chuẩn CEFR',
}

type CefrLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'

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
        nameVi: string | null
        itemCount: number
        learnedCount: number
    }>
    grammarTopics: Array<{
        slug: string
        titleDe: string
        titleVi: string
        lessonCount: number
        completedCount: number
        totalStars: number
    }>
    skillLinks: Array<{
        skill: string
        label: string
        labelVi: string
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

async function getCourseData(userId: string, level: CefrLevel) {
    const courseSlug = COURSE_SLUGS[level]

    // 1. Fetch course + modules
    const course = await prisma.course.findFirst({
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
    })

    if (!course) return null

    // 2. Read course.json to get module → vocab/grammar/skill mappings
    const fs = await import('node:fs')
    const path = await import('node:path')
    const contentDir = path.join(process.cwd(), '..', '..', 'content')
    const courseJsonPath = path.join(contentDir, level.toLowerCase(), 'course.json')
    let moduleMap: Record<string, {
        vocabularyThemes: string[]
        grammarTopics: string[]
        skillLinks?: Array<{ skill: string; label: string; labelVi: string; href: string; emoji: string }>
    }> = {}
    try {
        const courseJson = JSON.parse(fs.readFileSync(courseJsonPath, 'utf-8'))
        for (const mod of courseJson.modules) {
            moduleMap[mod.slug] = {
                vocabularyThemes: mod.vocabularyThemes ?? [],
                grammarTopics: mod.grammarTopics ?? [],
                skillLinks: mod.skillLinks ?? [],
            }
        }
    } catch {
        // fallback: empty mappings
    }

    // 3. Fetch all vocab themes for this level
    const vocabThemes = await prisma.vocabularyTheme.findMany({
        where: { cefrLevel: level },
        select: {
            id: true,
            slug: true,
            name: true,
            nameVi: true,
            _count: { select: { items: true } },
        },
    })
    const vocabThemeMap = new Map(vocabThemes.map(t => [t.slug, t]))

    // 4. Fetch user's SRS cards for vocab progress
    const themeProgress = await getVocabularyThemeSrsProgress(userId, level)

    // 5. Fetch grammar topics for this level
    const grammarTopics = await prisma.grammarTopic.findMany({
        where: { cefrLevel: level },
        select: {
            id: true,
            slug: true,
            title: true,
            titleDe: true,
            titleVi: true,
        },
    })
    const grammarTopicMap = new Map(grammarTopics.map((t) => [t.slug, t]))

    // 6. Fetch grammar lessons for this level
    const topicIds = grammarTopics.map((t) => t.id)
    const grammarLessons = topicIds.length > 0
        ? await prisma.grammarLesson.findMany({
            where: { topicId: { in: topicIds } },
            select: {
                id: true,
                topicId: true,
            },
        })
        : []
    const lessonsByTopic: Record<string, any[]> = {}
    for (const l of grammarLessons) {
        if (!lessonsByTopic[l.topicId]) lessonsByTopic[l.topicId] = []
        lessonsByTopic[l.topicId]!.push(l)
    }

    // 7. Fetch grammar progress
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

    // 8. Build modules with progress
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
                    nameVi: theme.nameVi,
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
                    titleVi: topic.titleVi ?? '',
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

    const data = await getCourseData(serverUser.userId, level)

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
