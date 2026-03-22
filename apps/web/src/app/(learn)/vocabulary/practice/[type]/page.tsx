import { redirect } from 'next/navigation'
import { getServerUser } from '@/lib/auth/server-auth'
import { ExercisePlayerWrapper } from '@/components/vocabulary/exercises/exercise-player-wrapper'

interface PageProps {
    params: Promise<{ type: string }>
    searchParams: Promise<{ theme?: string; level?: string }>
}

const VALID_TYPES = ['mc', 'matching', 'spelling', 'cloze', 'scramble', 'speed']
const TYPE_TITLES: Record<string, string> = {
    mc: 'Multiple Choice',
    matching: 'Matching',
    spelling: 'Spelling',
    cloze: 'Lückentext',
    scramble: 'Satzpuzzle',
    speed: 'Speed Review',
}

export async function generateMetadata({ params }: PageProps) {
    const { type } = await params
    return {
        title: `Fuxie 🦊 — ${TYPE_TITLES[type] ?? 'Übung'}`,
        description: `Vocabulary ${TYPE_TITLES[type] ?? 'exercise'} practice`,
    }
}

export default async function ExerciseTypePage({ params, searchParams }: PageProps) {
    const serverUser = await getServerUser()
    if (!serverUser) redirect('/login')

    const { type } = await params
    const { theme, level } = await searchParams

    if (!VALID_TYPES.includes(type)) redirect('/vocabulary/practice')
    if (!theme) redirect('/vocabulary/practice')

    return (
        <ExercisePlayerWrapper
            type={type}
            theme={theme}
            level={level || 'A1'}
        />
    )
}
