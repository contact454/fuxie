'use client'

import Image from 'next/image'
import { AudioPlayer } from '@/components/ui/audio-player'
import { type VocabItem, ARTICLE_COLORS, ARTICLE_TEXT, WORD_TYPE_LABELS } from './vocabulary-types'

interface WordCardProps {
    word: VocabItem
    variant: 'preview' | 'list'
}

/**
 * Reusable vocabulary word card.
 *
 * - `preview` variant: compact vertical card for horizontal scroll preview
 * - `list` variant: horizontal row card for full word list grid
 */
export function WordCard({ word: w, variant }: WordCardProps) {
    const color = w.article ? ARTICLE_COLORS[w.article] ?? '#6B7280' : '#6B7280'
    const artText = w.article ? ARTICLE_TEXT[w.article] : null

    if (variant === 'preview') {
        return (
            <div className="flex-shrink-0 w-[140px] bg-gray-50 rounded-xl p-3 border border-gray-100 hover:shadow-sm transition-shadow">
                {w.imageUrl && (
                    <div className="mb-2 flex justify-center">
                        <Image
                            src={w.imageUrl}
                            alt={w.word}
                            width={64}
                            height={64}
                            className="rounded-lg object-cover"
                        />
                    </div>
                )}
                <div className="flex items-center justify-between mb-1.5">
                    {artText ? (
                        <span
                            className="inline-block text-[10px] font-bold px-1.5 py-0.5 rounded"
                            style={{ color, backgroundColor: `${color}15` }}
                        >
                            {artText}
                        </span>
                    ) : <span />}
                    <AudioPlayer src={w.audioUrl} text={w.word} size="sm" />
                </div>
                <p className="font-bold text-gray-900 text-sm leading-tight">{w.word}</p>
                <p className="text-xs text-gray-500 mt-1 leading-tight">{w.meaningNative}</p>
            </div>
        )
    }

    // List variant — horizontal row
    return (
        <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-3 border border-gray-100 hover:bg-white hover:shadow-sm transition-all group">
            {/* Word image or article color block */}
            {w.imageUrl ? (
                <Image
                    src={w.imageUrl}
                    alt={w.word}
                    width={44}
                    height={44}
                    className="rounded-lg object-cover shrink-0"
                />
            ) : (
                <div
                    className="w-11 h-11 rounded-lg flex items-center justify-center shrink-0 text-sm font-bold"
                    style={{ backgroundColor: `${color}12`, color }}
                >
                    {artText ?? w.word.charAt(0)}
                </div>
            )}

            {/* Word info */}
            <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-1.5 flex-wrap">
                    {artText && (
                        <span
                            className="text-[10px] font-bold px-1 py-0.5 rounded"
                            style={{ color, backgroundColor: `${color}15` }}
                        >
                            {artText}
                        </span>
                    )}
                    <span className="font-bold text-gray-900 text-sm">{w.word}</span>
                    {w.plural && w.plural !== '-' && (
                        <span className="text-[11px] text-gray-400">({w.plural})</span>
                    )}
                </div>
                <p className="text-xs text-gray-600 mt-0.5">{w.meaningNative}</p>
            </div>

            {/* Type badge + audio */}
            <div className="flex flex-col items-end gap-1.5 shrink-0">
                <span
                    className="text-[10px] px-1.5 py-0.5 rounded font-semibold"
                    style={{ background: `${color}10`, color }}
                >
                    {WORD_TYPE_LABELS[w.wordType] ?? w.wordType}
                </span>
                <AudioPlayer src={w.audioUrl} text={w.word} size="sm" />
            </div>
        </div>
    )
}
