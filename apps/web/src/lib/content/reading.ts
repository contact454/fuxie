import { prisma } from '@fuxie/database'
import { unstable_cache } from 'next/cache'

export type CefrLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'

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

export const getReadingLevels = unstable_cache(
    async (): Promise<CefrLevel[]> => {
        const levels = await prisma.readingExercise.findMany({
            select: { cefrLevel: true },
            distinct: ['cefrLevel'],
            orderBy: { cefrLevel: 'asc' },
        })
        if (levels.length === 0) return ['A1']
        return levels.map((level) => level.cefrLevel as CefrLevel)
    },
    ['reading-available-levels'],
    { revalidate: 3600, tags: ['reading-levels'] }
)
