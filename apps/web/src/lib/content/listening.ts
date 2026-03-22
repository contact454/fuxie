import { prisma } from '@fuxie/database'
import { unstable_cache } from 'next/cache'

export type CefrLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'

export interface ListeningLessonListItem {
    id: string
    lessonId: string
    cefrLevel: string
    teil: number
    teilName: string
    title: string
    topic: string
    taskType: string
    audioUrl: string | null
    audioDuration: number | null
    backgroundScene: string | null
    sortOrder: number
    _count: { questions: number }
}

export interface ListeningTeilGroup {
    teil: number
    teilName: string
    lessons: ListeningLessonListItem[]
    totalLessons: number
}

export async function getListeningLessonList(level: CefrLevel) {
    return prisma.listeningLesson.findMany({
        where: { cefrLevel: level },
        orderBy: [{ teil: 'asc' }, { sortOrder: 'asc' }],
        select: {
            id: true,
            lessonId: true,
            cefrLevel: true,
            teil: true,
            teilName: true,
            title: true,
            topic: true,
            taskType: true,
            audioUrl: true,
            audioDuration: true,
            backgroundScene: true,
            sortOrder: true,
            _count: { select: { questions: true } },
        },
    })
}

export function groupListeningLessonsByTeil(lessons: ListeningLessonListItem[]): ListeningTeilGroup[] {
    const teilMap: Record<number, ListeningTeilGroup> = {}

    for (const lesson of lessons) {
        if (!teilMap[lesson.teil]) {
            teilMap[lesson.teil] = {
                teil: lesson.teil,
                teilName: lesson.teilName,
                lessons: [],
                totalLessons: 0,
            }
        }

        const entry = teilMap[lesson.teil]!
        entry.lessons.push(lesson)
        entry.totalLessons++
    }

    return Object.values(teilMap).sort((a, b) => a.teil - b.teil)
}

export const getListeningLevels = unstable_cache(
    async (): Promise<CefrLevel[]> => {
        const levels = await prisma.listeningLesson.findMany({
            select: { cefrLevel: true },
            distinct: ['cefrLevel'],
            orderBy: { cefrLevel: 'asc' },
        })
        if (levels.length === 0) return ['A1']
        return levels.map((level) => level.cefrLevel as CefrLevel)
    },
    ['listening-available-levels'],
    { revalidate: 3600, tags: ['listening-levels'] }
)
