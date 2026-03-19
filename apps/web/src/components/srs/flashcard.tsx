'use client'

import { GENDER_ARTICLES } from '@fuxie/shared/types'
import Image from 'next/image'

import { AudioPlayer } from '@/components/ui/audio-player'

interface VocabData {
    word: string
    article: string | null
    plural: string | null
    wordType: string
    meaningVi: string
    meaningEn: string | null
    exampleSentence1: string | null
    exampleTranslation1: string | null
    exampleSentence2: string | null
    exampleTranslation2: string | null
    notes: string | null
    conjugation: Record<string, unknown> | null
    audioUrl?: string | null
    imageUrl?: string | null
}

interface FlashcardProps {
    vocabulary: VocabData
    isFlipped: boolean
    onFlip: () => void
}

const ARTICLE_COLORS: Record<string, string> = {
    MASKULIN: '#3B82F6',   // blue
    FEMININ: '#EC4899',    // pink
    NEUTRUM: '#10B981',    // green
}

const WORD_TYPE_LABELS: Record<string, string> = {
    NOMEN: 'Nomen', VERB: 'Verb', ADJEKTIV: 'Adjektiv',
    ADVERB: 'Adverb', PRAEPOSITION: 'Präposition', KONJUNKTION: 'Konjunktion',
}

export function Flashcard({ vocabulary, isFlipped, onFlip }: FlashcardProps) {
    const {
        word, article, plural, wordType, meaningVi, meaningEn,
        exampleSentence1, exampleTranslation1, exampleSentence2, exampleTranslation2,
        notes, conjugation, audioUrl, imageUrl
    } = vocabulary

    const articleText = article ? GENDER_ARTICLES[article as keyof typeof GENDER_ARTICLES] : null
    const articleColor = article ? ARTICLE_COLORS[article] ?? '#6B7280' : '#6B7280'

    return (
        <div className="w-full max-w-lg mx-auto" style={{ perspective: '1000px' }}>
            <div
                className="relative w-full cursor-pointer transition-transform duration-500"
                style={{
                    transformStyle: 'preserve-3d',
                    transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                    minHeight: '360px',
                }}
                onClick={onFlip}
            >
                {/* ===== FRONT — German word ===== */}
                <div
                    className="absolute inset-0 rounded-2xl p-8 flex flex-col items-center justify-center"
                    style={{
                        backfaceVisibility: 'hidden',
                        background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.08), 0 2px 8px rgba(0,0,0,0.04)',
                        border: `2px solid ${articleColor}20`,
                    }}
                >
                    {/* Word type badge */}
                    <span
                        className="text-xs font-semibold tracking-wider uppercase px-3 py-1 rounded-full mb-3"
                        style={{ background: `${articleColor}15`, color: articleColor }}
                    >
                        {WORD_TYPE_LABELS[wordType] ?? wordType}
                    </span>

                    {/* Vocabulary image */}
                    {imageUrl && (
                        <div className="w-20 h-20 rounded-xl overflow-hidden mb-3 bg-gray-50 flex items-center justify-center">
                            <Image
                                src={imageUrl}
                                alt={word}
                                width={80}
                                height={80}
                                className="object-cover"
                                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                            />
                        </div>
                    )}

                    {/* Article + Word */}
                    <div className="text-center">
                        {articleText && (
                            <span className="text-2xl font-medium mr-2" style={{ color: articleColor }}>
                                {articleText}
                            </span>
                        )}
                        <span className="text-4xl font-bold text-gray-900">{word}</span>
                    </div>

                    {/* Plural */}
                    {plural && plural !== '-' && (
                        <p className="text-sm text-gray-500 mt-2">Pl. {plural}</p>
                    )}

                    {/* Audio button */}
                    <div className="mt-4">
                        <AudioPlayer
                            src={audioUrl}
                            text={word}
                            size="md"
                            label="Anhören"
                        />
                    </div>

                    {/* Tap hint */}
                    <p className="text-xs text-gray-400 mt-4 animate-pulse">
                        Antippen zum Umdrehen ↻
                    </p>
                </div>

                {/* ===== BACK — Meaning + examples ===== */}
                <div
                    className="absolute inset-0 rounded-2xl p-6 flex flex-col overflow-y-auto"
                    style={{
                        backfaceVisibility: 'hidden',
                        transform: 'rotateY(180deg)',
                        background: 'linear-gradient(135deg, #f0f9ff 0%, #ffffff 100%)',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.08), 0 2px 8px rgba(0,0,0,0.04)',
                        border: `2px solid ${articleColor}20`,
                    }}
                >
                    {/* Word header (compact) */}
                    <div className="text-center mb-1">
                        <span className="text-sm font-medium mr-1" style={{ color: articleColor }}>
                            {articleText ?? ''}
                        </span>
                        <span className="text-lg font-bold text-gray-700">{word}</span>
                        <AudioPlayer src={audioUrl} text={word} size="sm" className="ml-2 inline-flex" />
                    </div>

                    {/* Meaning */}
                    <div className="text-center mb-3">
                        <p className="text-2xl font-bold text-gray-900">{meaningVi}</p>
                        {meaningEn ? <p className="text-sm text-gray-500 mt-0.5">{meaningEn}</p> : null}
                    </div>

                    {/* Divider */}
                    <div className="w-12 h-0.5 bg-gray-200 mx-auto mb-3" />

                    {/* Conjugation table for verbs */}
                    {conjugation && !!(conjugation as Record<string, unknown>).praesens && (
                        <div className="mb-3 bg-white/80 rounded-xl p-3">
                            <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Konjugation (Präsens)</p>
                            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                                {Object.entries((conjugation as Record<string, unknown>).praesens as Record<string, string>).map(([pronoun, form]) => (
                                    <div key={pronoun} className="flex gap-2">
                                        <span className="text-gray-400 w-16 text-right">{pronoun.replace('er_sie_es', 'er/sie/es').replace('sie_Sie', 'sie/Sie')}</span>
                                        <span className="font-medium text-gray-800">{String(form)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Examples */}
                    {exampleSentence1 && (
                        <div className="mb-2">
                            <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Beispiele</p>
                            <p className="text-sm font-medium text-gray-800 italic">„{exampleSentence1}&rdquo;</p>
                            <p className="text-xs text-gray-500">{exampleTranslation1}</p>
                        </div>
                    )}
                    {exampleSentence2 && (
                        <div className="mb-2">
                            <p className="text-sm font-medium text-gray-800 italic">„{exampleSentence2}&rdquo;</p>
                            <p className="text-xs text-gray-500">{exampleTranslation2}</p>
                        </div>
                    )}

                    {/* Notes */}
                    {notes && (
                        <div className="mt-auto pt-2 border-t border-gray-100">
                            <p className="text-xs text-amber-600">💡 {notes}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
