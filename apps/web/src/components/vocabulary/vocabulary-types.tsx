import Image from 'next/image'

// ─── Types ──────────────────────────────────────────
export interface Theme {
    id: string
    slug: string
    name: string
    nameVi: string | null
    nameEn: string | null
    cefrLevel: string
    imageUrl: string | null
    wordCount: number
    srsProgress: { total: number; learned: number; due: number }
}

export interface VocabItem {
    id: string
    word: string
    article: string | null
    plural: string | null
    wordType: string
    meaningVi: string
    meaningEn: string | null
    notes: string | null
    conjugation: Record<string, unknown> | null
    audioUrl?: string | null
    imageUrl?: string | null
    exampleSentence1?: string | null
    exampleTranslation1?: string | null
    theme: { slug: string; name: string } | null
}

// ─── Constants ──────────────────────────────────────
export const ARTICLE_COLORS: Record<string, string> = {
    MASKULIN: '#3B82F6',
    FEMININ: '#EC4899',
    NEUTRUM: '#10B981',
}

export const ARTICLE_TEXT: Record<string, string> = {
    MASKULIN: 'der',
    FEMININ: 'die',
    NEUTRUM: 'das',
}

export const WORD_TYPE_LABELS: Record<string, string> = {
    NOMEN: 'Nomen', VERB: 'Verb', ADJEKTIV: 'Adj.',
    ADVERB: 'Adv.', PRAEPOSITION: 'Präp.', KONJUNKTION: 'Konj.',
    PARTIKEL: 'Part.', PRONOMEN: 'Pron.', PHRASE: 'Phrase',
}

// ─── Progress Ring SVG ──────────────────────────────
export function ProgressRing({ progress, size = 32, strokeWidth = 3 }: { progress: number; size?: number; strokeWidth?: number }) {
    const radius = (size - strokeWidth) / 2
    const circumference = radius * 2 * Math.PI
    const offset = circumference - (progress / 100) * circumference

    return (
        <svg width={size} height={size} className="transform -rotate-90">
            <circle
                cx={size / 2} cy={size / 2} r={radius}
                stroke="#E5E7EB" strokeWidth={strokeWidth} fill="none"
            />
            <circle
                cx={size / 2} cy={size / 2} r={radius}
                stroke={progress >= 100 ? '#10B981' : '#FF6B35'}
                strokeWidth={strokeWidth} fill="none"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                strokeLinecap="round"
                className="transition-all duration-700 ease-out"
            />
        </svg>
    )
}
