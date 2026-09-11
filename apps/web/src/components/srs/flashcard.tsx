'use client'

import type { KeyboardEvent, MouseEvent } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { GENDER_ARTICLES } from '@fuxie/shared/types'
import Image from 'next/image'

import { AudioPlayer } from '@/components/ui/audio-player'

interface VocabData {
    word: string
    article: string | null
    plural: string | null
    wordType: string
    translations: Record<string, string> | null
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

const FLIP_BUTTON_CLASS =
    'mt-4 inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl ' +
    'px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 ' +
    'transition-[transform,opacity,background-color] duration-150 ' +
    'motion-reduce:transition-none ' +
    'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ' +
    'focus-visible:outline-[var(--fuxie-blue-700)]'

function stopInteractiveBubble(e: MouseEvent | KeyboardEvent) {
    e.stopPropagation()
}

export function Flashcard({ vocabulary, isFlipped, onFlip }: FlashcardProps) {
    const locale = useLocale()
    const t = useTranslations('SRS')
    const {
        word, article, plural, wordType, translations,
        exampleSentence1, exampleTranslation1, exampleSentence2, exampleTranslation2,
        notes, conjugation, audioUrl, imageUrl
    } = vocabulary

    const articleText = article ? GENDER_ARTICLES[article as keyof typeof GENDER_ARTICLES] : null
    const articleColor = article ? ARTICLE_COLORS[article] ?? '#6B7280' : '#6B7280'

    const displayMeaning = translations?.[locale] || translations?.['vi'] || ''
    const meaningDe = translations?.['de'] || translations?.['meaningDe']

    const handleFaceActivate = () => {
        onFlip()
    }

    const handleFlipControlClick = (e: MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation()
        onFlip()
    }

    // Keep both faces mounted for the 3D flip animation; only the active face
    // participates in a11y tree / focus / pointer interaction.
    const frontActive = !isFlipped
    const backActive = isFlipped

    return (
        <div className="w-full max-w-lg mx-auto" style={{ perspective: '1000px' }} data-role="flashcard">
            {/* Presentational 3D stage — not a single composite button (avoids nested interactive). */}
            <div
                className="relative w-full transition-[transform] duration-500 motion-reduce:transition-none hover:scale-[1.02] motion-reduce:hover:scale-100"
                style={{
                    transformStyle: 'preserve-3d',
                    transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                    minHeight: '360px',
                }}
                data-flipped={isFlipped ? 'true' : 'false'}
            >
                {/* ===== FRONT — German word ===== */}
                <div
                    className="absolute inset-0 rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer"
                    style={{
                        backfaceVisibility: 'hidden',
                        background: '#ffffff',
                        boxShadow: '0 12px 28px -4px rgba(23,59,86,0.16), 0 4px 12px -2px rgba(23,59,86,0.08)',
                        border: `2px solid ${articleColor}40`,
                    }}
                    onClick={frontActive ? handleFaceActivate : undefined}
                    data-face="front"
                    data-face-active={frontActive ? 'true' : 'false'}
                    aria-hidden={frontActive ? undefined : true}
                    inert={frontActive ? undefined : true}
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
                            <span className="text-2xl font-black mr-2" style={{ color: articleColor }}>
                                {articleText}
                            </span>
                        )}
                        <span className="text-4xl font-black text-slate-900 leading-tight">{word}</span>
                    </div>

                    {/* Plural */}
                    {plural && plural !== '-' && (
                        <p className="text-sm text-slate-500 font-bold mt-2">Pl. {plural}</p>
                    )}

                    {/* Audio — stopPropagation so play does not flip */}
                    <div
                        className="mt-4"
                        data-role="flashcard-audio"
                        onClick={stopInteractiveBubble}
                        onKeyDown={stopInteractiveBubble}
                    >
                        <AudioPlayer
                            src={audioUrl}
                            text={word}
                            size="md"
                            label={t('listenLabel')}
                        />
                    </div>

                    {/* Dedicated flip control — keyboard focus + ≥44px target */}
                    <button
                        type="button"
                        data-role="flashcard-flip"
                        aria-label={t('flipCard')}
                        onClick={handleFlipControlClick}
                        className={FLIP_BUTTON_CLASS}
                    >
                        {t('tapToFlip')}
                    </button>
                </div>

                {/* ===== BACK — Meaning + examples ===== */}
                <div
                    className="absolute inset-0 rounded-2xl p-6 flex flex-col overflow-y-auto cursor-pointer"
                    style={{
                        backfaceVisibility: 'hidden',
                        transform: 'rotateY(180deg)',
                        background: '#ffffff',
                        boxShadow: '0 12px 28px -4px rgba(23,59,86,0.16), 0 4px 12px -2px rgba(23,59,86,0.08)',
                        border: `2px solid ${articleColor}40`,
                    }}
                    onClick={backActive ? handleFaceActivate : undefined}
                    data-face="back"
                    data-face-active={backActive ? 'true' : 'false'}
                    aria-hidden={backActive ? undefined : true}
                    inert={backActive ? undefined : true}
                >
                    {/* Word header (compact) */}
                    <div className="text-center mb-1">
                        <span className="text-sm font-medium mr-1" style={{ color: articleColor }}>
                            {articleText ?? ''}
                        </span>
                        <span className="text-lg font-bold text-gray-700">{word}</span>
                        <span
                            className="ml-2 inline-flex"
                            data-role="flashcard-audio"
                            onClick={stopInteractiveBubble}
                            onKeyDown={stopInteractiveBubble}
                        >
                            <AudioPlayer src={audioUrl} text={word} size="sm" className="inline-flex" />
                        </span>
                    </div>

                    {/* Meaning */}
                    <div className="text-center mb-3">
                        <p className="text-2xl font-bold text-gray-900">{displayMeaning}</p>
                        {meaningDe && (
                            <div className="mt-2 inline-block bg-[#3C78A8]/5 border border-[#3C78A8]/20 rounded-lg px-3 py-2">
                                <p className="text-sm font-medium text-text-brand">{meaningDe}</p>
                            </div>
                        )}
                    </div>

                    {/* Divider */}
                    <div className="w-12 h-0.5 bg-gray-200 mx-auto mb-3" />

                    {/* Conjugation table for verbs */}
                    {conjugation && !!(conjugation as Record<string, unknown>).praesens && (
                        <div className="mb-3 bg-white/80 rounded-xl p-3">
                            <p className="text-xs font-semibold text-gray-500 uppercase mb-2">{t('conjugation')}</p>
                            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                                {Object.entries((conjugation as Record<string, unknown>).praesens as Record<string, string>).map(([pronoun, form]) => ( // locale-allow
                                    <div key={pronoun} className="flex gap-2">
                                        <span className="text-gray-600 w-16 text-right">{pronoun.replace('er_sie_es', 'er/sie/es').replace('sie_Sie', 'sie/Sie')}</span>
                                        <span className="font-medium text-gray-800">{String(form)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Examples */}
                    {exampleSentence1 && (
                        <div className="mb-2">
                            <p className="text-xs font-semibold text-gray-500 uppercase mb-1">{t('examples')}</p>
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
                            <p className="text-xs text-amber-800">💡 {notes}</p>
                        </div>
                    )}

                    <div className="mt-auto flex justify-center pt-3">
                        <button
                            type="button"
                            data-role="flashcard-flip"
                            aria-label={t('flipCard')}
                            onClick={handleFlipControlClick}
                            className={FLIP_BUTTON_CLASS}
                        >
                            {t('tapToFlip')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
