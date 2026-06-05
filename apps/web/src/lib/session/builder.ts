import { prisma } from '@fuxie/database'
import type { CefrLevel } from '@fuxie/database'
import type { ExerciseData } from './types'

export type ExerciseFormat = 'MULTIPLE_CHOICE' | 'TYPING' | 'INTRO' | 'LISTENING_MINI' | 'MATCHING'

export interface SessionItem {
    id: string
    type: 'VOCAB_NEW' | 'VOCAB_REVIEW' | 'GRAMMAR' | 'LISTENING'
    format: ExerciseFormat
    data: ExerciseData
    points: number
}

export async function buildDailySession(userId: string, level: CefrLevel): Promise<SessionItem[]> {
    const items: SessionItem[] = []

    // 1. Fetch 5 due SRS cards for review
    const srsDue = await prisma.srsCard.findMany({
        where: {
            userId,
            nextReviewAt: { lte: new Date() },
            vocabularyItem: { cefrLevel: level }
        },
        include: {
            vocabularyItem: true
        },
        take: 5,
        orderBy: { nextReviewAt: 'asc' }
    })

    // Prepare card structures and formats
    const preparedCards = srsDue
        .filter(card => !!card.vocabularyItem)
        .map(card => {
            const vocabularyItem = card.vocabularyItem!
            let correctWord = (vocabularyItem.translations as any)?.vi || ''
            if (!correctWord) {
                correctWord = vocabularyItem.word || ''
            }
            
            let format: ExerciseFormat = card.interval > 1 ? 'TYPING' : 'MULTIPLE_CHOICE'
            if (format === 'MULTIPLE_CHOICE' && !correctWord) {
                format = 'TYPING'
            }
            
            return {
                card,
                correctWord,
                format
            }
        })

    const themeIds = preparedCards
        .filter(c => c.format === 'MULTIPLE_CHOICE' && c.card.vocabularyItem?.themeId)
        .map(c => c.card.vocabularyItem!.themeId!)
    
    // De-duplicate theme IDs
    const uniqueThemeIds = Array.from(new Set(themeIds))

    const hasMCOption = preparedCards.some(c => c.format === 'MULTIPLE_CHOICE')
    
    const themeCandidates = (hasMCOption && uniqueThemeIds.length > 0)
        ? await prisma.vocabularyItem.findMany({
            where: {
                themeId: { in: uniqueThemeIds }
            },
            select: {
                id: true,
                themeId: true,
                translations: true
            }
        })
        : []

    const cefrCandidates = hasMCOption
        ? await prisma.vocabularyItem.findMany({
            where: {
                cefrLevel: level
            },
            select: {
                id: true,
                themeId: true,
                translations: true
            },
            take: 50
        })
        : []

    for (const prepared of preparedCards) {
        const { card, correctWord, format } = prepared
        const vocabItem = card.vocabularyItem!

        let options: string[] = []
        let correctIndex = 0

        if (format === 'MULTIPLE_CHOICE') {
            // Find theme-level distractors from the pre-fetched list
            const themeDistractors = themeCandidates
                .filter(item => item.themeId === vocabItem.themeId && item.id !== vocabItem.id)
                .map(item => (item.translations as any)?.vi || '')
                .filter(Boolean)
                .filter(text => text.toLowerCase() !== correctWord.toLowerCase())
            
            // Unique theme distractors
            let distractors = Array.from(new Set(themeDistractors))

            // If not enough theme distractors, add from the pre-fetched CEFR candidates
            if (distractors.length < 3) {
                const cefrDistractors = cefrCandidates
                    .filter(item => item.id !== vocabItem.id && item.themeId !== vocabItem.themeId)
                    .map(item => (item.translations as any)?.vi || '')
                    .filter(Boolean)
                    .filter(text => text.toLowerCase() !== correctWord.toLowerCase() && !distractors.includes(text))
                
                const uniqueCefr = Array.from(new Set(cefrDistractors))
                distractors = distractors.concat(uniqueCefr).slice(0, 3)
            }

            // Fallback to default hardcoded distractors if still not enough
            const defaultFallbacks = ['quả táo', 'quả chuối', 'sữa', 'bánh mì', 'nước', 'trà', 'cà phê']
            let idx = 0
            while (distractors.length < 3 && idx < defaultFallbacks.length) {
                const f = defaultFallbacks[idx++] || 'bánh mì'
                if (f.toLowerCase() !== correctWord.toLowerCase() && !distractors.includes(f)) {
                    distractors.push(f)
                }
            }

            // Absolute fallback to ensure we never have fewer than 3 distractors
            while (distractors.length < 3) {
                distractors.push('bánh mì')
            }

            // Pick a random index for the correct word (0 to 3)
            correctIndex = Math.floor(Math.random() * 4)
            options = [...distractors.slice(0, 3)]
            options.splice(correctIndex, 0, correctWord)
        }

        items.push({
            id: `srs-${card.id}`,
            type: 'VOCAB_REVIEW',
            format,
            points: 10,
            data: {
                cardId: card.id,
                term: vocabItem.word,
                meaning: correctWord,
                partOfSpeech: vocabItem.wordType,
                article: vocabItem.article,
                exampleSentence: vocabItem.exampleSentence1,
                audioUrl: vocabItem.audioUrl,
                options: format === 'MULTIPLE_CHOICE' ? options : undefined,
                correctIndex: format === 'MULTIPLE_CHOICE' ? correctIndex : undefined
            }
        })
    }

    // 2. Fetch 5 NEW vocab items (not yet in SrsCard for this user)
    const allThemes = await prisma.vocabularyTheme.findMany({
        where: { cefrLevel: level },
        orderBy: { sortOrder: 'asc' }
    })

    let newVocabItems: Array<{ id: string; word: string; translations: any; wordType: string | null; article: string | null; exampleSentence1: string | null; audioUrl: string | null }> = []
    for (const theme of allThemes) {
        if (newVocabItems.length >= 5) break
        
        const unlearnedInTheme = await prisma.vocabularyItem.findMany({
            where: {
                themeId: theme.id,
                srsCards: { none: { userId } } // Not yet learned
            },
            take: 5 - newVocabItems.length,
            // Assuming no specific order field exists on VocabularyItem, otherwise use it
        })
        newVocabItems = newVocabItems.concat(unlearnedInTheme)
    }

    for (const vItem of newVocabItems) {
        items.push({
            id: `new-v-${vItem.id}`,
            type: 'VOCAB_NEW',
            format: 'INTRO',
            points: 5,
            data: {
                itemId: vItem.id,
                term: vItem.word,
                meaning: (vItem.translations as any)?.vi || '',
                partOfSpeech: vItem.wordType,
                article: vItem.article,
                exampleSentence: vItem.exampleSentence1,
                audioUrl: vItem.audioUrl,
            }
        })
    }

    // 3. Optional: Grammar Exercises
    const incompleteProgress = await prisma.grammarProgress.findFirst({
        where: {
            userId,
            completed: false,
            lesson: { topic: { cefrLevel: level } }
        },
        include: {
            lesson: { include: { topic: true } }
        }
    })

    if (incompleteProgress && incompleteProgress.lesson) {
        items.push({
            id: `gram-${incompleteProgress.lessonId}-1`,
            type: 'GRAMMAR',
            format: 'MULTIPLE_CHOICE',
            points: 15,
            data: {
                lessonId: incompleteProgress.lessonId,
                topicTitle: incompleteProgress.lesson.titleDe, // Using titleDe
                questionDe: 'Wählen Sie die richtige Form: Ich ___ gestern im Kino.',
                questionNative: 'Chọn dạng đúng:',
                options: ['bin', 'war', 'habe', 'wurde'],
                correctIndex: 1,
                explanation: 'Quá khứ của sein là war.'
            }
        })
    }

    // 4. Shuffle items to mix review and new
    const shuffled = items.sort(() => Math.random() - 0.5)

    return shuffled
}
