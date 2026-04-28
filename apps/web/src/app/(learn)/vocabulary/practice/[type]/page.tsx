import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { getServerUser } from '@/lib/auth/server-auth'
import { ExercisePlayerWrapper } from '@/components/vocabulary/exercises/exercise-player-wrapper'
import { generateVocabularyPractice, VocabPracticeError, VOCAB_PRACTICE_TYPES, type VocabPracticeType } from '@/lib/vocabulary/practice'

interface PageProps {
    params: Promise<{ type: string }>
    searchParams: Promise<{ theme?: string; level?: string }>
}

const TYPE_TITLES: Record<string, string> = {
    mixed: 'Mixed Practice',
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
        title: `Fuxie - ${TYPE_TITLES[type] ?? 'Bài luyện'}`,
        description: `Luyện từ vựng với dạng bài ${TYPE_TITLES[type] ?? 'bài luyện'}`,
    }
}

export default async function ExerciseTypePage({ params, searchParams }: PageProps) {
    const serverUser = await getServerUser()
    if (!serverUser) redirect('/login')

    const { type } = await params
    const { theme, level } = await searchParams

    if (!VOCAB_PRACTICE_TYPES.includes(type as VocabPracticeType)) redirect('/vocabulary/practice')
    if (!theme) redirect('/vocabulary/practice')

    const cookieStore = await cookies()
    const locale = cookieStore.get('NEXT_LOCALE')?.value || serverUser.uiLanguage || 'vi'
    let initialExerciseData: any = null
    let initialError: string | null = null

    try {
        initialExerciseData = await generateVocabularyPractice({
            level: level || 'A1',
            theme,
            type: type as VocabPracticeType,
            count: 10,
            locale,
        })
    } catch (error) {
        if (error instanceof VocabPracticeError) {
            initialError = error.message
        } else {
            throw error
        }
    }

    return (
        <ExercisePlayerWrapper
            type={type}
            theme={theme}
            level={level || 'A1'}
            initialExerciseData={initialExerciseData}
            initialError={initialError}
        />
    )
}
