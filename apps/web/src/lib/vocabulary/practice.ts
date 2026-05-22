import { prisma } from '@fuxie/database'

export const VOCAB_PRACTICE_TYPES = ['mc', 'matching', 'spelling', 'cloze', 'scramble', 'speed', 'mixed'] as const

export type VocabPracticeType = typeof VOCAB_PRACTICE_TYPES[number]

type McVariant = 'de_to_native' | 'native_to_de' | 'image_to_word' | 'audio_to_word'

interface VocabWord {
    id: string
    word: string
    article: string | null
    translations: any
    imageUrl: string | null
    audioUrl: string | null
    exampleSentence1: string | null
    exampleTranslation1: string | null
    wordType: string
}

export class VocabPracticeError extends Error {
    constructor(message: string, public status = 400) {
        super(message)
    }
}

export async function generateVocabularyPractice(params: {
    level: string
    theme: string
    type: VocabPracticeType
    count: number
    locale: string
}) {
    const { level, theme, type, count, locale } = params

    const allWords = await prisma.vocabularyItem.findMany({
        where: {
            cefrLevel: level as any,
            theme: { slug: theme },
            status: 'PUBLISHED',
        },
        select: {
            id: true,
            word: true,
            article: true,
            translations: true,
            imageUrl: true,
            audioUrl: true,
            exampleSentence1: true,
            exampleTranslation1: true,
            wordType: true,
        },
        orderBy: { word: 'asc' },
    })

    if (allWords.length < 4) {
        throw new VocabPracticeError('Not enough vocabulary words in this theme (need at least 4)')
    }

    const wordsWithAudio = allWords.map((word) => ({
        ...word,
        audioUrl: word.audioUrl || `/api/v1/tts?text=${encodeURIComponent(word.word)}`,
    }))

    const targetWords = pickRandom(wordsWithAudio, Math.min(count, wordsWithAudio.length))
    const availableVariants: McVariant[] = ['de_to_native', 'native_to_de']
    if (wordsWithAudio.some((word) => word.imageUrl)) availableVariants.push('image_to_word')
    if (wordsWithAudio.some((word) => word.audioUrl)) availableVariants.push('audio_to_word')

    let questions: any[]

    if (type === 'mc' || type === 'speed') {
        questions = targetWords.map((word, index) => {
            let variant = availableVariants[index % availableVariants.length]!
            if (variant === 'image_to_word' && !word.imageUrl) variant = 'de_to_native'
            if (variant === 'audio_to_word' && !word.audioUrl) variant = 'de_to_native'
            return generateMcQuestion(word, wordsWithAudio, variant, index + 1, locale)
        })
    } else if (type === 'matching') {
        const selected = pickRandom(wordsWithAudio, Math.min(6, wordsWithAudio.length))
        questions = selected.map((word, index) => ({
            id: `p${index + 1}`,
            type: 'pair',
            word: displayWord(word),
            meaning: localizedMeaning(word, locale),
            wordId: word.id,
            imageUrl: word.imageUrl,
        }))
    } else if (type === 'spelling') {
        questions = targetWords.map((word, index) => ({
            id: `s${index + 1}`,
            type: 'spelling',
            prompt: localizedMeaning(word, locale),
            promptImage: word.imageUrl,
            promptAudio: word.audioUrl,
            article: word.article,
            wordId: word.id,
            hint: word.word.substring(0, 2),
            answerLength: word.word.length,
        }))
    } else if (type === 'cloze') {
        const selected = pickRandom(wordsWithAudio.filter((word) => word.exampleSentence1), count)
        questions = selected.map((word, index) => {
            const sentence = word.exampleSentence1 || ''
            return {
                id: `c${index + 1}`,
                type: 'cloze',
                sentence: sentence.replace(new RegExp(word.word, 'gi'), '_____'),
                translation: word.exampleTranslation1,
                wordType: word.wordType,
                wordId: word.id,
            }
        })
    } else if (type === 'scramble') {
        const selected = pickRandom(wordsWithAudio.filter((word) => word.exampleSentence1), count)
        questions = selected.map((word, index) => {
            const sentence = word.exampleSentence1 || ''
            return {
                id: `r${index + 1}`,
                type: 'scramble',
                scrambledWords: shuffle(sentence.replace(/[.!?]/g, '').split(/\s+/)),
                translation: word.exampleTranslation1,
                original: sentence,
                wordId: word.id,
            }
        })
    } else if (type === 'mixed') {
        questions = []
        const selected = pickRandom(wordsWithAudio, Math.min(Math.floor(count / 2) || 4, wordsWithAudio.length))

        selected.forEach((word, index) => {
            questions.push({
                id: `intro_${index}`,
                exerciseComponent: 'intro',
                type: 'intro',
                wordId: word.id,
                word: displayWord(word),
                meaningNative: localizedMeaning(word, locale),
                imageUrl: word.imageUrl,
                audioUrl: word.audioUrl,
                exampleSentence1: word.exampleSentence1,
                exampleTranslation1: word.exampleTranslation1,
            })

            let variant = availableVariants[index % availableVariants.length]!
            if (variant === 'image_to_word' && !word.imageUrl) variant = 'de_to_native'
            if (variant === 'audio_to_word' && !word.audioUrl) variant = 'de_to_native'
            questions.push({ ...generateMcQuestion(word, wordsWithAudio, variant, index, locale), exerciseComponent: 'mc' })
        })
    } else {
        questions = []
    }

    const themeInfo = await prisma.vocabularyTheme.findUnique({
        where: { slug: theme },
        select: { slug: true, name: true, translations: true, imageUrl: true, cefrLevel: true, sortOrder: true },
    })
    const nextTheme = themeInfo
        ? await prisma.vocabularyTheme.findFirst({
            where: {
                cefrLevel: themeInfo.cefrLevel,
                sortOrder: { gt: themeInfo.sortOrder },
            },
            orderBy: { sortOrder: 'asc' },
            select: { slug: true },
        })
        : null

    return {
        exerciseType: type,
        theme: themeInfo,
        cefrLevel: level,
        totalQuestions: questions.length,
        questions,
        nextEpisodeHref: nextTheme
            ? `/vocabulary/practice/mixed?theme=${nextTheme.slug}&level=${level}`
            : '/vocabulary/practice',
    }
}

function generateMcQuestion(
    target: VocabWord,
    distractors: VocabWord[],
    variant: McVariant,
    index: number,
    locale: string,
) {
    const wrongAnswers = pickRandom(distractors.filter((word) => word.id !== target.id), 3)
    let prompt = ''
    let promptImage: string | null = null
    let promptAudio: string | null = null
    let options: string[] = []

    switch (variant) {
        case 'de_to_native':
            prompt = displayWord(target)
            promptAudio = target.audioUrl
            options = shuffle([localizedMeaning(target, locale), ...wrongAnswers.map((word) => localizedMeaning(word, locale))])
            break
        case 'native_to_de':
            prompt = localizedMeaning(target, locale)
            options = shuffle([displayWord(target), ...wrongAnswers.map(displayWord)])
            break
        case 'image_to_word':
            promptImage = target.imageUrl
            options = shuffle([displayWord(target), ...wrongAnswers.map(displayWord)])
            break
        case 'audio_to_word':
            promptAudio = target.audioUrl
            options = shuffle([displayWord(target), ...wrongAnswers.map(displayWord)])
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
        word: displayWord(target),
        meaningNative: localizedMeaning(target, locale),
    }
}

function displayWord(word: VocabWord) {
    if (!word.article) return word.word
    const article = word.article === 'MASKULIN' ? 'der' : word.article === 'FEMININ' ? 'die' : 'das'
    return `${article} ${word.word}`
}

function localizedMeaning(word: VocabWord, locale: string) {
    return (word.translations as any)?.[locale] || (word.translations as any)?.en || ''
}

function shuffle<T>(arr: T[]): T[] {
    const a = [...arr]
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[a[i], a[j]] = [a[j]!, a[i]!]
    }
    return a
}

function pickRandom<T>(arr: T[], n: number): T[] {
    return shuffle(arr).slice(0, n)
}
