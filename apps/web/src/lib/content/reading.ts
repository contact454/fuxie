import { prisma } from '@fuxie/database'
import { cacheWrap } from '@/lib/cache/redis'

export type { CefrLevel } from '@/lib/types/cefr'
import type { CefrLevel } from '@/lib/types/cefr'

export interface ReadingExerciseListItem {
    id: string
    exerciseId: string
    cefrLevel: string
    teil: number
    teilName: string
    topic: string
    metadataJson: unknown
    sortOrder: number
    _count: { questions: number }
}

export interface ReadingTeilGroup {
    teil: number
    teilName: string
    exercises: ReadingExerciseListItem[]
    totalExercises: number
}

export async function getReadingExerciseList(level: CefrLevel) {
    return prisma.readingExercise.findMany({
        where: { cefrLevel: level },
        orderBy: [{ teil: 'asc' }, { sortOrder: 'asc' }],
        select: {
            id: true,
            exerciseId: true,
            cefrLevel: true,
            teil: true,
            teilName: true,
            topic: true,
            metadataJson: true,
            sortOrder: true,
            _count: { select: { questions: true } },
        },
    })
}

export function groupReadingExercisesByTeil(exercises: ReadingExerciseListItem[]): ReadingTeilGroup[] {
    const teilMap: Record<number, ReadingTeilGroup> = {}

    for (const exercise of exercises) {
        if (!teilMap[exercise.teil]) {
            teilMap[exercise.teil] = {
                teil: exercise.teil,
                teilName: exercise.teilName,
                exercises: [],
                totalExercises: 0,
            }
        }

        const entry = teilMap[exercise.teil]!
        entry.exercises.push(exercise)
        entry.totalExercises++
    }

    return Object.values(teilMap).sort((a, b) => a.teil - b.teil)
}

export async function getReadingLevels(): Promise<CefrLevel[]> {
    return cacheWrap('reading:levels', 3600, async () => {
        const levels = await prisma.readingExercise.findMany({
            select: { cefrLevel: true },
            distinct: ['cefrLevel'],
            orderBy: { cefrLevel: 'asc' },
        })
        if (levels.length === 0) return ['A1']
        return levels.map((level) => level.cefrLevel as CefrLevel)
    })
}
