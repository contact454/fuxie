'use client'

import { useState } from 'react'

interface Correction {
    original: string
    corrected: string
    explanation: string
    rule: string
}

export function CorrectionBubble({ corrections }: { corrections: Correction[] }) {
    const [expandedIndex, setExpandedIndex] = useState<number | null>(null)

    if (!corrections || corrections.length === 0) return null

    return (
        <div className="mt-2 space-y-2">
            {corrections.map((c, i) => (
                <div
                    key={i}
                    className="rounded-xl border border-amber-200 bg-amber-50/80 backdrop-blur-sm overflow-hidden
                        transition-all duration-300 ease-out"
                >
                    {/* Header — always visible */}
                    <button
                        onClick={() => setExpandedIndex(expandedIndex === i ? null : i)}
                        className="w-full flex items-start gap-2 px-3 py-2 text-left hover:bg-amber-100/50 transition-colors"
                    >
                        <span className="text-amber-500 text-sm mt-0.5 shrink-0">✏️</span>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs leading-relaxed">
                                <span className="line-through text-red-400 decoration-red-300">{c.original}</span>
                                <span className="mx-1.5 text-gray-300">→</span>
                                <span className="font-semibold text-green-700">{c.corrected}</span>
                            </p>
                        </div>
                        <span
                            className={`text-gray-400 text-xs shrink-0 transition-transform duration-200
                                ${expandedIndex === i ? 'rotate-180' : ''}`}
                        >
                            ▼
                        </span>
                    </button>

                    {/* Expandable detail */}
                    <div
                        className={`overflow-hidden transition-all duration-300 ease-out
                            ${expandedIndex === i ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'}`}
                    >
                        <div className="px-3 pb-2.5 pt-0.5 border-t border-amber-200/50">
                            <p className="text-xs text-gray-600 leading-relaxed">
                                {c.explanation}
                            </p>
                            {c.rule && (
                                <span className="inline-block mt-1.5 px-2 py-0.5 rounded-full
                                    bg-amber-200/60 text-amber-800 text-xs font-medium">
                                    📐 {c.rule}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    )
}
