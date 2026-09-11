import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { getServerUser } from '@/lib/auth/server-auth'
import { ExercisePlayerWrapperDynamic } from '@/components/vocabulary/exercises/ExercisePlayerWrapperDynamic'
import { generateVocabularyPractice, VocabPracticeError, VOCAB_PRACTICE_TYPES, type VocabPracticeType } from '@/lib/vocabulary/practice'

interface PageProps {
    params: Promise<{ type: string }>
    searchParams: Promise<{ theme?: string; level?: string; fixture?: string; showResults?: string }>
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
    const { type } = await params
    const { theme, level, fixture, showResults } = await searchParams

    const isVisualQa = process.env.NODE_ENV !== 'production' && fixture === 'visual-qa'

    if (isVisualQa) {
        const mockExerciseData = {
            exerciseType: type,
            theme: {
                slug: theme || '06-essen-trinken',
                name: 'Essen und Trinken',
                translations: { vi: 'Ăn uống', en: 'Eating and Drinking', de: 'Essen und Trinken' },
                imageUrl: null,
                cefrLevel: level || 'A1'
            },
            cefrLevel: level || 'A1',
            totalQuestions: 4,
            questions: [
                {
                    id: 'q1',
                    type: 'de_to_native',
                    prompt: 'der Apfel',
                    promptImage: null,
                    promptAudio: '/audio/apfel.mp3',
                    options: ['quả táo', 'quả chuối', 'quả cam', 'quả lê'],
                    wordId: 'w1',
                    word: 'der Apfel',
                    meaningNative: 'quả táo'
                },
                {
                    id: 'q2',
                    type: 'native_to_de',
                    prompt: 'quả chuối',
                    promptImage: null,
                    promptAudio: null,
                    options: ['die Banane', 'der Apfel', 'die Birne', 'die Orange'],
                    wordId: 'w2',
                    word: 'die Banane',
                    meaningNative: 'quả chuối'
                }
            ]
        }
        return (
            <ExercisePlayerWrapperDynamic
                type={type}
                theme={theme || '06-essen-trinken'}
                level={level || 'A1'}
                initialExerciseData={mockExerciseData}
                initialError={null}
                showResults={showResults === 'true'}
            />
        )
    }

    const serverUser = await getServerUser()
    if (!serverUser) redirect('/login')

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
        <ExercisePlayerWrapperDynamic
            type={type}
            theme={theme}
            level={level || 'A1'}
            initialExerciseData={initialExerciseData}
            initialError={initialError}
            showResults={showResults === 'true'}
        />
    )
}
