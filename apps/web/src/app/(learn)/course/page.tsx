import { redirect } from 'next/navigation'
import { prisma } from '@fuxie/database'
import { getServerUser } from '@/lib/auth/server-auth'
import { CourseClient } from '@/components/course/CourseClient'

export const dynamic = 'force-dynamic'

export const metadata = {
    title: 'Fuxie 🦊 — Kurs A1',
    description: 'Deutsch A1 — Khóa học tiếng Đức cho người mới bắt đầu',
}

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
    isUnlocked: boolean
}

async function getCourseData(userId: string) {
    // 1. Fetch course + modules
    const course = await prisma.course.findFirst({
        where: { slug: 'deutsch-a1-anfaenger' },
        include: {
            modules: {
                orderBy: { sortOrder: 'asc' },
            },
        },
    })

    if (!course) return null

    // 2. Read course.json to get module → vocab/grammar mappings
    // (modules in DB don't store theme/topic slugs, so we read from JSON)
    const fs = await import('node:fs')
    const path = await import('node:path')
    const contentDir = path.join(process.cwd(), '..', '..', 'content')
    const courseJsonPath = path.join(contentDir, 'a1', 'course.json')
    let moduleMap: Record<string, { vocabularyThemes: string[]; grammarTopics: string[] }> = {}
    try {
        const courseJson = JSON.parse(fs.readFileSync(courseJsonPath, 'utf-8'))
        for (const mod of courseJson.modules) {
            moduleMap[mod.slug] = {
                vocabularyThemes: mod.vocabularyThemes ?? [],
                grammarTopics: mod.grammarTopics ?? [],
            }
        }
    } catch {
        // fallback: empty mappings
    }

    // 3. Fetch all vocab themes for A1
    const vocabThemes = await prisma.vocabularyTheme.findMany({
        where: { cefrLevel: 'A1' },
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
    const srsCards = await prisma.srsCard.findMany({
        where: { userId },
        select: {
            vocabularyItem: {
                select: { themeId: true },
            },
            state: true,
        },
    })
    const learnedByTheme: Record<string, number> = {}
    for (const card of srsCards) {
        const themeId = card.vocabularyItem?.themeId
        if (!themeId) continue
        if (card.state !== 0) { // 0 = NEW state in FSRS
            learnedByTheme[themeId] = (learnedByTheme[themeId] ?? 0) + 1
        }
    }

    // 5. Fetch grammar topics for A1
    const grammarTopics = await (prisma as any).grammarTopic.findMany({
        where: { cefrLevel: 'A1' },
    }) as any[]
    const grammarTopicMap = new Map(grammarTopics.map((t: any) => [t.slug, t]))

    // 6. Fetch grammar lessons for A1
    const topicIds = grammarTopics.map((t: any) => t.id)
    const grammarLessons = topicIds.length > 0
        ? await (prisma as any).grammarLesson.findMany({
            where: { topicId: { in: topicIds } },
        }) as any[]
        : []
    const lessonsByTopic: Record<string, any[]> = {}
    for (const l of grammarLessons) {
        if (!lessonsByTopic[l.topicId]) lessonsByTopic[l.topicId] = []
        lessonsByTopic[l.topicId]!.push(l)
    }

    // 7. Fetch grammar progress
    const grammarLessonIds = grammarLessons.map((l: any) => l.id)
    const grammarProgress = grammarLessonIds.length > 0
        ? await (prisma as any).grammarProgress.findMany({
            where: { userId, lessonId: { in: grammarLessonIds } },
        }) as any[]
        : []
    const progressMap: Record<string, { completed: boolean; stars: number }> = {}
    for (const p of grammarProgress) {
        progressMap[p.lessonId] = { completed: p.completed, stars: p.stars ?? 0 }
    }

    // 8. Build modules with progress
    const modules: ModuleWithProgress[] = course.modules.map((mod, idx) => {
        const mapping = moduleMap[mod.slug] ?? { vocabularyThemes: [], grammarTopics: [] }

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
                    learnedCount: learnedByTheme[theme.id] ?? 0,
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
        // (simplified: always unlocked for now — real logic would check actual completion)
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
            isUnlocked,
        }
    })

    return {
        courseTitle: course.title,
        courseTitleDe: course.titleDe ?? course.title,
        courseDescription: course.description,
        modules,
    }
}

export default async function CoursePage() {
    const serverUser = await getServerUser()
    if (!serverUser) redirect('/login')

    const data = await getCourseData(serverUser.userId)

    if (!data) {
        return (
            <div className="max-w-4xl mx-auto px-4 py-16 text-center">
                <p className="text-lg text-gray-500">Chưa có khóa học nào. Vui lòng seed data trước.</p>
            </div>
        )
    }

    return <CourseClient data={data} />
}
