import { prisma } from '@fuxie/database'
import type { CefrLevel } from '@fuxie/database'

export type ExerciseFormat = 'MULTIPLE_CHOICE' | 'TYPING' | 'INTRO' | 'LISTENING_MINI' | 'MATCHING'

export interface SessionItem {
    id: string
    type: 'VOCAB_NEW' | 'VOCAB_REVIEW' | 'GRAMMAR' | 'LISTENING'
    format: ExerciseFormat
    data: any
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

    for (const card of srsDue) {
        if (!card.vocabularyItem) continue
        
        // Build review exercise (either MC or typing depending on interval/ease)
        const format: ExerciseFormat = card.interval > 1 ? 'TYPING' : 'MULTIPLE_CHOICE'
        items.push({
            id: `srs-${card.id}`,
            type: 'VOCAB_REVIEW',
            format,
            points: 10,
            data: {
                cardId: card.id,
                term: card.vocabularyItem.word,
                meaning: card.vocabularyItem.meaningVi,
                partOfSpeech: card.vocabularyItem.wordType,
                article: card.vocabularyItem.article,
                exampleSentence: card.vocabularyItem.exampleSentence1,
                audioUrl: card.vocabularyItem.audioUrl,
            }
        })
    }

    // 2. Fetch 5 NEW vocab items (not yet in SrsCard for this user)
    const allThemes = await prisma.vocabularyTheme.findMany({
        where: { cefrLevel: level },
        orderBy: { sortOrder: 'asc' }
    })

    let newVocabItems: any[] = []
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
                meaning: vItem.meaningVi,
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
                questionVi: 'Chọn dạng đúng:',
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
