'use client'

import { useState } from 'react'

interface GapFillContent {
    instructions?: string
    passage: string
    items: Array<{
        id: string
        blankLabel?: string
    }>
}

interface Props {
    content: Record<string, unknown>
    answer: Record<string, unknown>
    onChange: (answer: Record<string, unknown>) => void
}

export function GapFillRenderer({ content, answer, onChange }: Props) {
    const data = content as unknown as GapFillContent
    const userAnswers = (answer.answers as Record<string, string>) ?? {}
    const [activeBlank, setActiveBlank] = useState<string | null>(null)

    const updateBlank = (itemId: string, value: string) => {
        onChange({ answers: { ...userAnswers, [itemId]: value } })
    }

    // Split passage by blanks [___] or [__1__] patterns
    const parts = data.passage.split(/(\[___?\d*___?\])/g)
    let blankIdx = 0

    return (
        <div>
            {data.instructions && (
                <p className="text-xs text-gray-400 italic mb-3">{data.instructions}</p>
            )}

            {/* Passage with inline blanks */}
            <div className="bg-gray-50 rounded-xl p-5 mb-5 leading-relaxed text-sm text-gray-700">
                {parts.map((part, i) => {
                    if (/^\[___?\d*___?\]$/.test(part)) {
                        const item = data.items[blankIdx]
                        if (!item) return part
                        const idx = blankIdx
                        blankIdx++
                        const value = userAnswers[item.id] ?? ''
                        const isActive = activeBlank === item.id

                        return (
                            <span key={i} className="inline-block relative mx-1">
                                <button
                                    onClick={() => setActiveBlank(isActive ? null : item.id)}
                                    className={`inline-flex items-center gap-1 px-3 py-1 rounded-lg text-sm font-medium transition-all border-2 border-dashed
                                        ${value
                                            ? 'bg-[#FF6B35]/10 border-[#FF6B35]/40 text-[#FF6B35]'
                                            : 'bg-white border-gray-300 text-gray-400 hover:border-[#FF6B35]/40'
                                        }`}
                                >
                                    <span className="text-[10px] font-bold text-gray-400 mr-1">{idx + 1}</span>
                                    {value || '...'}
                                </button>

                                {isActive && (
                                    <div className="absolute top-full left-0 mt-1 z-10 bg-white rounded-xl shadow-lg ring-1 ring-gray-200 p-3 min-w-[200px]">
                                        <input
                                            type="text"
                                            value={value}
                                            onChange={e => updateBlank(item.id, e.target.value)}
                                            onKeyDown={e => { if (e.key === 'Enter') setActiveBlank(null) }}
                                            placeholder={item.blankLabel ?? 'Antwort eingeben...'}
                                            autoFocus
                                            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#FF6B35] focus:ring-1 focus:ring-[#FF6B35]/30"
                                        />
                                        <button
                                            onClick={() => setActiveBlank(null)}
                                            className="mt-2 w-full py-1.5 text-xs font-medium text-white bg-[#FF6B35] rounded-lg"
                                        >
                                            OK ✓
                                        </button>
                                    </div>
                                )}
                            </span>
                        )
                    }
                    return <span key={i}>{part}</span>
                })}
            </div>

            {/* Summary of filled blanks */}
            <div className="flex flex-wrap gap-2">
                {data.items.map((item, idx) => {
                    const value = userAnswers[item.id]
                    return (
                        <button
                            key={item.id}
                            onClick={() => setActiveBlank(activeBlank === item.id ? null : item.id)}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all
                                ${value
                                    ? 'bg-green-50 text-green-700 ring-1 ring-green-200'
                                    : 'bg-gray-100 text-gray-400'
                                }`}
                        >
                            <span className="font-bold">{idx + 1}.</span>
                            {value || '—'}
                        </button>
                    )
                })}
            </div>
        </div>
    )
}
