import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@fuxie/database'
import { withAuth } from '@/lib/auth/middleware'
import { handleApiError } from '@/lib/api/error-handler'

const VALID_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const
const VALID_TYPES = ['mc', 'matching', 'spelling', 'cloze', 'scramble', 'speed'] as const

const querySchema = z.object({
    level: z.enum(VALID_LEVELS).default('A1'),
    theme: z.string(),
    type: z.enum(VALID_TYPES).default('mc'),
    count: z.coerce.number().min(4).max(20).default(10),
})

// MC variant types
type McVariant = 'de_to_vi' | 'vi_to_de' | 'image_to_word' | 'audio_to_word'

interface VocabWord {
    id: string
    word: string
    article: string | null
    meaningVi: string
    imageUrl: string | null
    audioUrl: string | null
    exampleSentence1: string | null
    exampleTranslation1: string | null
    wordType: string
}

/**
 * Shuffle array (Fisher-Yates)
 */
function shuffle<T>(arr: T[]): T[] {
    const a = [...arr]
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[a[i], a[j]] = [a[j]!, a[i]!]
    }
    return a
}

/**
 * Pick N random items from array
 */
function pickRandom<T>(arr: T[], n: number): T[] {
    return shuffle(arr).slice(0, n)
}

/**
 * Generate MC question
 */
function generateMcQuestion(
    target: VocabWord,
    distractors: VocabWord[],
    variant: McVariant,
    index: number
) {
    const displayWord = target.article
        ? `${target.article === 'MASKULIN' ? 'der' : target.article === 'FEMININ' ? 'die' : 'das'} ${target.word}`
        : target.word

    // Pick 3 distractors
    const wrongAnswers = pickRandom(
        distractors.filter(d => d.id !== target.id),
        3
    )

    let prompt = ''
    let promptImage: string | null = null
    let promptAudio: string | null = null
    let options: string[] = []

    switch (variant) {
        case 'de_to_vi':
            prompt = displayWord
            promptAudio = target.audioUrl
            options = shuffle([
                target.meaningVi,
                ...wrongAnswers.map(w => w.meaningVi),
            ])
            break

        case 'vi_to_de':
            prompt = target.meaningVi
            options = shuffle([
                displayWord,
                ...wrongAnswers.map(w => {
                    return w.article
                        ? `${w.article === 'MASKULIN' ? 'der' : w.article === 'FEMININ' ? 'die' : 'das'} ${w.word}`
                        : w.word
                }),
            ])
            break

        case 'image_to_word':
            promptImage = target.imageUrl
            prompt = '' // Image is the prompt
            options = shuffle([
                displayWord,
                ...wrongAnswers.map(w => {
                    return w.article
                        ? `${w.article === 'MASKULIN' ? 'der' : w.article === 'FEMININ' ? 'die' : 'das'} ${w.word}`
                        : w.word
                }),
            ])
            break

        case 'audio_to_word':
            promptAudio = target.audioUrl
            prompt = '' // Audio is the prompt
            options = shuffle([
                displayWord,
                ...wrongAnswers.map(w => {
                    return w.article
                        ? `${w.article === 'MASKULIN' ? 'der' : w.article === 'FEMININ' ? 'die' : 'das'} ${w.word}`
                        : w.word
                }),
            ])
            break
    }

    return {
        id: `q${index}`,
        type: variant,
        prompt,
        promptImage,
        promptAudio,
        options,
        wordId: target.id,
        word: displayWord,
        meaningVi: target.meaningVi,
    }
}

/**
 * GET /api/v1/vocabulary/practice
 * Generate vocabulary exercise questions
 */
export async function GET(req: NextRequest) {
    try {
        await withAuth(req)

        const params = Object.fromEntries(req.nextUrl.searchParams)
        const { level, theme, type, count } = querySchema.parse(params)

        // Fetch words for this theme + level
        const allWords = await prisma.vocabularyItem.findMany({
            where: {
                cefrLevel: level,
                theme: { slug: theme },
                status: 'PUBLISHED',
            },
            select: {
                id: true,
                word: true,
                article: true,
                meaningVi: true,
                imageUrl: true,
                audioUrl: true,
                exampleSentence1: true,
                exampleTranslation1: true,
                wordType: true,
            },
            orderBy: { word: 'asc' },
        })

        if (allWords.length < 4) {
            return NextResponse.json(
                { success: false, error: 'Not enough vocabulary words in this theme (need at least 4)' },
                { status: 400 }
            )
        }

        const targetWords = pickRandom(allWords, Math.min(count, allWords.length))

        // Available MC variants (only use image/audio variants if data exists)
        const availableVariants: McVariant[] = ['de_to_vi', 'vi_to_de']
        const hasImages = allWords.some(w => w.imageUrl)
        const hasAudio = allWords.some(w => w.audioUrl)
        if (hasImages) availableVariants.push('image_to_word')
        if (hasAudio) availableVariants.push('audio_to_word')

        let questions: any[]
        if (type === 'mc' || type === 'speed') {
            questions = targetWords.map((word, i) => {
                let variant = availableVariants[i % availableVariants.length]!
                // For image_to_word, skip if this word has no image
                if (variant === 'image_to_word' && !word.imageUrl) variant = 'de_to_vi'
                if (variant === 'audio_to_word' && !word.audioUrl) variant = 'de_to_vi'

                return generateMcQuestion(word, allWords, variant, i + 1)
            })
        } else if (type === 'matching') {
            // Return pairs for matching
            const matchCount = Math.min(6, allWords.length)
            const selected = pickRandom(allWords, matchCount)
            questions = selected.map((w, i) => {
                const displayWord = w.article
                    ? `${w.article === 'MASKULIN' ? 'der' : w.article === 'FEMININ' ? 'die' : 'das'} ${w.word}`
                    : w.word
                return {
                    id: `p${i + 1}`,
                    type: 'pair',
                    word: displayWord,
                    meaning: w.meaningVi,
                    wordId: w.id,
                    imageUrl: w.imageUrl,
                }
            })
        } else if (type === 'spelling') {
            questions = targetWords.map((w, i) => ({
                id: `s${i + 1}`,
                type: 'spelling',
                prompt: w.meaningVi,
                promptImage: w.imageUrl,
                promptAudio: w.audioUrl,
                article: w.article,
                wordId: w.id,
                hint: w.word.substring(0, 2),
                answerLength: w.word.length,
            }))
        } else if (type === 'cloze') {
            const withSentences = allWords.filter(w => w.exampleSentence1)
            const selected = pickRandom(withSentences, Math.min(count, withSentences.length))
            questions = selected.map((w, i) => {
                const sentence = w.exampleSentence1 || ''
                const blank = sentence.replace(new RegExp(w.word, 'gi'), '_____')
                return {
                    id: `c${i + 1}`,
                    type: 'cloze',
                    sentence: blank,
                    translation: w.exampleTranslation1,
                    wordType: w.wordType,
                    wordId: w.id,
                }
            })
        } else if (type === 'scramble') {
            const withSentences = allWords.filter(w => w.exampleSentence1)
            const selected = pickRandom(withSentences, Math.min(count, withSentences.length))
            questions = selected.map((w, i) => {
                const sentence = w.exampleSentence1 || ''
                const words = sentence.replace(/[.!?]/g, '').split(/\s+/)
                return {
                    id: `r${i + 1}`,
                    type: 'scramble',
                    scrambledWords: shuffle(words),
                    translation: w.exampleTranslation1,
                    wordId: w.id,
                }
            })
        } else {
            questions = []
        }

        // Get theme info
        const themeInfo = await prisma.vocabularyTheme.findUnique({
            where: { slug: theme },
            select: { slug: true, name: true, nameVi: true, imageUrl: true },
        })

        return NextResponse.json({
            success: true,
            data: {
                exerciseType: type,
                theme: themeInfo,
                cefrLevel: level,
                totalQuestions: questions.length,
                questions,
            },
        })
    } catch (error) {
        return handleApiError(error)
    }
}
