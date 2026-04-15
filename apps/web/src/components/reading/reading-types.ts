// ─── Types & Constants for Reading Player ──────────────
// Extracted from reading-player.tsx to keep the main component focused on logic

import { CEFR_THEME } from '@/lib/constants/cefr'
import type { ReadingImage, ReadingTextEntry } from './reading-renderer-types'

// ─── Types ──────────────────────────────────────────
export interface Question {
    id: string
    questionNumber: number
    questionType: string
    linkedText: string | null
    statement: string
    options: string[] | null
    sortOrder: number
}

export interface ExplanationData {
    key_evidence?: string
    reasoning?: string
    vocabulary_help?: Record<string, string>
    [key: string]: unknown
}

export interface QuestionResult {
    questionId: string
    questionNumber: number
    questionType: string
    statement: string
    linkedText: string | null
    options: string[]
    userAnswer: string
    correctAnswer: string
    isCorrect: boolean
    explanation: ExplanationData | string | null
}

export interface ReadingPlayerProps {
    exerciseId: string
    cefrLevel: string
    teil: number
    teilName: string
    topic: string
    textsJson: any // eslint-disable-line @typescript-eslint/no-explicit-any -- Prisma Json field, shape varies by exercise type
    imagesJson: any // eslint-disable-line @typescript-eslint/no-explicit-any -- Prisma Json field
    questions: Question[]
}

export type Phase = 'intro' | 'warmup' | 'exercise' | 'results'

export type LookedUpWord = {
    word: string
    translation: string
    context?: string
    timestamp: number
}

export type TooltipState = {
    word: string
    translation: string | null
    loading: boolean
    x: number
    y: number
}

export type TextHighlight = { textIndex: number; text: string; color: string }

// ─── Constants ──────────────────────────────────────
// Re-export from shared CEFR theme — legacy alias kept for backward compat
export const CEFR_COLORS = CEFR_THEME

export const TEIL_DESCRIPTIONS: Record<string, Record<number, { icon: string; strategy: string; genre: string }>> = {
    beginner: {
        1: { icon: '📧', strategy: 'Lies den Text einmal schnell durch. Achte auf die Schlüsselwörter.', genre: 'Kurze Texte' },
        2: { icon: '📋', strategy: 'Vergleiche die zwei Anzeigen. Achte auf die Details (Preis, Ort, Zeit).', genre: 'Anzeigen' },
        3: { icon: '🪧', strategy: 'Lies jedes Schild aufmerksam. Achte auf Zahlen und Verbote.', genre: 'Schilder' },
        4: { icon: '🗓️', strategy: 'Suche die wichtigen Informationen: Datum, Uhrzeit, Ort.', genre: 'Informationstexte' },
    },
    advanced: {
        1: { icon: '📰', strategy: 'Überfliegen Sie zuerst den gesamten Text, dann lesen Sie die Fragen.', genre: 'Sachtext' },
        2: { icon: '📝', strategy: 'Achten Sie auf Signalwörter: jedoch, dennoch, außerdem, folglich...', genre: 'Lückentext' },
        3: { icon: '🔬', strategy: 'Unterstreichen Sie die Hauptaussage jedes Absatzes.', genre: 'Wissenschaftl. Text' },
        4: { icon: '💬', strategy: 'Die Meinungen können ähnlich klingen — achten Sie auf Nuancen.', genre: 'Meinungen' },
        5: { icon: '📖', strategy: 'Lesen Sie den Ratgeber abschnittsweise und beantworten Sie stückweise.', genre: 'Ratgeber' },
    },
}

export const DIFFICULTY: Record<string, { label: string; dots: number; color: string }> = {
    A1: { label: 'Einfach', dots: 1, color: '#22C55E' },
    A2: { label: 'Einfach', dots: 2, color: '#84CC16' },
    B1: { label: 'Mittel', dots: 3, color: '#F97316' },
    B2: { label: 'Anspruchsvoll', dots: 4, color: '#EF4444' },
    C1: { label: 'Fortgeschritten', dots: 5, color: '#A855F7' },
    C2: { label: 'Experte', dots: 5, color: '#7C3AED' },
}

export const WARMUP_QUESTIONS: Record<string, string[]> = {
    A1: [
        'Was siehst du auf dem Bild?',
        'Welche Wörter kennst du schon zum Thema?',
        'Was erwartest du im Text?',
    ],
    A2: [
        'Was weißt du schon über dieses Thema?',
        'Welche Wörter fallen dir zum Thema ein?',
        'Was möchtest du aus dem Text erfahren?',
    ],
    B1: [
        'Was ist Ihre Meinung zu diesem Thema?',
        'Welche Schlüsselbegriffe erwarten Sie?',
        'Was wissen Sie bereits darüber?',
    ],
    B2: [
        'Formulieren Sie eine Hypothese zum Textinhalt.',
        'Welche Argumente erwarten Sie?',
        'Was ist der Kontext dieses Themas?',
    ],
    C1: [
        'Welche Position könnte der Autor vertreten?',
        'Welche Fachbegriffe erwarten Sie?',
        'Was macht dieses Thema aktuell relevant?',
    ],
    C2: [
        'Analysieren Sie den Titel: Welche These steckt dahinter?',
        'Welche akademische Perspektive erwarten Sie?',
        'Wie würden Sie das Thema einordnen?',
    ],
}

export const POST_READING_TIPS: Record<string, string[]> = {
    A1: [
        'Lies den Text noch einmal laut vor — das hilft beim Wortschatz!',
        'Schreibe 3 neue Wörter auf und bilde einfache Sätze.',
        'Versuche morgen den Text ohne Hilfe zu lesen.',
    ],
    A2: [
        'Markiere die wichtigsten Informationen im Text.',
        'Erzähle den Textinhalt in eigenen Worten (2-3 Sätze).',
        'Übe die neuen Wörter mit Karteikarten.',
    ],
    B1: [
        'Fasse den Text in 3-4 Sätzen zusammen.',
        'Notiere die Schlüsselargumente des Autors.',
        'Suche einen ähnlichen Text und vergleiche die Informationen.',
    ],
    B2: [
        'Analysieren Sie die Textstruktur: Einleitung, Hauptteil, Schluss.',
        'Identifizieren Sie die stilistischen Mittel des Autors.',
        'Schreiben Sie eine kurze Stellungnahme zum Textthema.',
    ],
    C1: [
        'Bewerten Sie die Argumentation: Sind die Belege überzeugend?',
        'Vergleichen Sie verschiedene Perspektiven zum Thema.',
        'Formulieren Sie eigene Gegenargumente.',
    ],
    C2: [
        'Analysieren Sie die diskursive Einbettung des Textes.',
        'Identifizieren Sie implizite Annahmen und Prämissen.',
        'Verfassen Sie eine kritische Rezension (200 Wörter).',
    ],
}

// ─── Helpers ────────────────────────────────────────
export function extractKeyWords(textsJson: any, cefrLevel: string): string[] {
    if (!textsJson) return []
    const texts = Array.isArray(textsJson) ? textsJson : [textsJson]
    const allText = texts.map((t: any) => t.text || t.content || t.body || '').join(' ')
    const minLength = ['A1', 'A2'].includes(cefrLevel) ? 5 : 7
    const words = allText.split(/\s+/)
        .filter((w: string) => w.length >= minLength && /^[A-ZÄÖÜa-zäöüß]/.test(w))
        .map((w: string) => w.replace(/[.,!?;:()\"]/g, ''))
        .filter((w: string, i: number, arr: string[]) => arr.indexOf(w) === i)
    return words.sort(() => Math.random() - 0.5).slice(0, 8)
}

export function getImageUrl(filename: string, cefrLevel: string) {
    return `/images/reading/${cefrLevel.toLowerCase()}/${filename}`
}

export function getHeroImage(imagesJson: any, cefrLevel: string): string | null {
    if (!imagesJson || !Array.isArray(imagesJson)) return null
    const hero = imagesJson.find((img: any) => img.placement === 'header' || img.placement === 'anzeige_a' || img.placement === 'schild_1')
    return hero ? getImageUrl(hero.filename, cefrLevel) : null
}
