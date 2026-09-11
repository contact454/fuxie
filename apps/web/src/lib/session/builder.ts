import { randomUUID, randomInt } from 'node:crypto'
import { prisma, type Prisma, type CefrLevel } from '@fuxie/database'
import type { PrivateSessionQuestion, SessionSnapshot } from './schemas'
import { snapshotSchema } from './schemas'
import type { sessionCatalog } from './config'

type Catalog = ReturnType<typeof sessionCatalog>
type Word = Prisma.VocabularyItemGetPayload<Record<string, never>>

function meaning(word: Word): string {
    const translations = word.translations
    if (!translations || typeof translations !== 'object' || Array.isArray(translations)) return ''
    return typeof translations.vi === 'string' ? translations.vi.trim() : ''
}
function usable(word: Word): boolean {
    return Boolean(word.word.trim() && word.word.length <= 256 && meaning(word) && meaning(word).length <= 1024)
}
function source(word: Word) {
    return { vocabularyItemId: word.id, vocabularyVersion: word.updatedAt.toISOString(), cardId: null, cardUpdatedAt: null, dependsOn: null }
}
function shuffle<T>(items: T[]) {
    for (let index = items.length - 1; index > 0; index--) {
        const other = randomInt(index + 1)
        ;[items[index], items[other]] = [items[other]!, items[index]!]
    }
    return items
}

// Server-only consumers: the private snapshot is never a client prop or API response.
export async function buildSessionSnapshot(userId: string, level: CefrLevel, catalog: Catalog): Promise<SessionSnapshot | null> {
    const eligible: Prisma.VocabularyItemWhereInput = {
        cefrLevel: level, status: 'PUBLISHED', deletedAt: null,
        ...(catalog.ids ? { id: { in: catalog.ids } } : {}),
    }
    const [due, fresh, candidates] = await Promise.all([
        prisma.srsCard.findMany({
            where: { userId, nextReviewAt: { lte: new Date() }, vocabularyItem: eligible },
            include: { vocabularyItem: true }, orderBy: [{ nextReviewAt: 'asc' }, { id: 'asc' }], take: 5,
        }),
        prisma.vocabularyItem.findMany({
            where: { ...eligible, srsCards: { none: { userId } } },
            orderBy: [{ theme: { sortOrder: 'asc' } }, { id: 'asc' }], take: 5,
        }),
        prisma.vocabularyItem.findMany({ where: eligible, orderBy: { id: 'asc' }, take: 50 }),
    ])
    const groups: PrivateSessionQuestion[][] = []
    for (const card of due) {
        const word = card.vocabularyItem
        if (!word || !usable(word)) continue
        const distractors = [...new Set(candidates.filter(candidate => candidate.id !== word.id && usable(candidate)).map(meaning))]
            .filter(label => label.toLowerCase() !== meaning(word).toLowerCase()).slice(0, 3)
        const common = { ...source(word), cardId: card.id, cardUpdatedAt: card.updatedAt.toISOString() }
        if (card.interval <= 1 && distractors.length >= 1) {
            const answer = { id: randomUUID(), label: meaning(word) }
            const options = shuffle([answer, ...distractors.map(label => ({ id: randomUUID(), label }))])
            groups.push([{ ...common, item: { id: randomUUID(), type: 'VOCAB_REVIEW', format: 'MULTIPLE_CHOICE', points: 10, data: { term: word.word, options } }, expected: { kind: 'option', optionId: answer.id } }])
        } else {
            groups.push([{ ...common, item: { id: randomUUID(), type: 'VOCAB_REVIEW', format: 'TYPING', points: 10, data: { meaning: meaning(word) } }, expected: { kind: 'text', text: word.word } }])
        }
    }
    for (const word of fresh.filter(usable)) {
        const introId = randomUUID()
        groups.push([
            { ...source(word), item: { id: introId, type: 'VOCAB_NEW', format: 'INTRO', points: 0, data: { term: word.word, meaning: meaning(word), article: word.article, exampleSentence: word.exampleSentence1?.slice(0, 2048) ?? null, audioUrl: word.audioUrl?.slice(0, 2048) ?? null } }, expected: { kind: 'ack', acknowledged: true } },
            { ...source(word), dependsOn: introId, item: { id: randomUUID(), type: 'VOCAB_NEW', format: 'TYPING', points: 5, data: { meaning: meaning(word) } }, expected: { kind: 'text', text: word.word } },
        ])
    }
    if (!groups.length) return null
    // Shuffle groups only: every acknowledgement precedes its linked recall.
    return snapshotSchema.parse({ version: 2, questions: shuffle(groups).flat() })
}
