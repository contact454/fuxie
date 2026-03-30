import { prisma } from '@fuxie/database'
import { cacheWrap } from '@/lib/cache/redis'

export type { CefrLevel } from '@/lib/types/cefr'
import type { CefrLevel } from '@/lib/types/cefr'

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

export async function getListeningLevels(): Promise<CefrLevel[]> {
    return cacheWrap('listening:levels', 3600, async () => {
        const levels = await prisma.listeningLesson.findMany({
            select: { cefrLevel: true },
            distinct: ['cefrLevel'],
            orderBy: { cefrLevel: 'asc' },
        })
        if (levels.length === 0) return ['A1']
        return levels.map((level) => level.cefrLevel as CefrLevel)
    })
}
