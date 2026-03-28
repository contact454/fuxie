'use client'

import Image from 'next/image'

const AD_ICONS: Record<string, string> = {
    'Sprachschule': '🎓', 'Familienpark': '🎪', 'Büro': '💼', 'Zimmer': '🏠', 'WG': '🏠',
    'Koch': '🍳', 'Fahrrad': '🚲', 'Ehrenamt': '🤝', 'Helfer': '🤝', 'Fitness': '💪',
    'Nachhilfe': '📚', 'Hunde': '🐕', 'Kurs': '📖', 'Job': '💼', 'Wohnung': '🏠',
}

const AD_COLORS = [
    'from-blue-50 to-blue-100 ring-blue-200',
    'from-green-50 to-green-100 ring-green-200',
    'from-amber-50 to-amber-100 ring-amber-200',
    'from-purple-50 to-purple-100 ring-purple-200',
    'from-rose-50 to-rose-100 ring-rose-200',
    'from-teal-50 to-teal-100 ring-teal-200',
    'from-indigo-50 to-indigo-100 ring-indigo-200',
    'from-orange-50 to-orange-100 ring-orange-200',
    'from-cyan-50 to-cyan-100 ring-cyan-200',
    'from-pink-50 to-pink-100 ring-pink-200',
]

interface MatchingContent {
    instructions?: string
    situations: Array<{ id: string; text: string }>
    options: Array<{ key: string; title: string; snippet: string; imageUrl?: string }>
}

interface Props {
    content: Record<string, unknown>
    answer: Record<string, unknown>
    onChange: (answer: Record<string, unknown>) => void
}

function getIcon(title: string): string {
    for (const [keyword, icon] of Object.entries(AD_ICONS)) {
        if (title.includes(keyword)) return icon
    }
    return '📋'
}

export function MatchingRenderer({ content, answer, onChange }: Props) {
    const data = content as unknown as MatchingContent
    const mapping = (answer.mapping as Record<string, string>) ?? {}

    const selectOption = (situationId: string, optionKey: string) => {
        onChange({ mapping: { ...mapping, [situationId]: optionKey } })
    }

    const usedOptions = new Set(Object.values(mapping))
    const answeredCount = data.situations.filter(s => mapping[s.id]).length

    return (
        <div className="-mx-6 -mt-2">
            {data.instructions && (
                <div className="flex items-start gap-2 bg-blue-50 rounded-lg px-3 py-2 mx-6 mt-4 mb-4">
                    <span className="text-blue-400 text-sm mt-0.5">💡</span>
                    <p className="text-xs text-blue-600 leading-relaxed">{data.instructions}</p>
                </div>
            )}

            {/* Anzeigen cards — visual ad board */}
            <div className="px-6 mb-5">
                <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    📌 Anzeigen
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {data.options.map((opt, idx) => {
                        const isUsed = usedOptions.has(opt.key)
                        const colorClass = AD_COLORS[idx % AD_COLORS.length]
                        return (
                            <div
                                key={opt.key}
                                className={`relative rounded-xl overflow-hidden transition-all ring-1 bg-gradient-to-br ${colorClass}
                                    ${isUsed ? 'opacity-50 scale-[0.98]' : 'hover:scale-[1.01] hover:shadow-md'}`}
                            >
                                {isUsed && (
                                    <div className="absolute z-10 top-2 right-2 w-6 h-6 rounded-full bg-green-500 flex items-center justify-center shadow-sm">
                                        <span className="text-white text-xs font-bold">✓</span>
                                    </div>
                                )}
                                
                                {opt.imageUrl && (
                                    <div className="relative w-full h-24 sm:h-32 bg-white/40 border-b border-white/20">
                                        <Image src={opt.imageUrl} alt={opt.title} fill className="object-cover" sizes="(max-width: 640px) 100vw, 50vw" />
                                    </div>
                                )}

                                <div className="p-4 flex items-start gap-3">
                                    {!opt.imageUrl && (
                                        <div className="text-3xl shrink-0 drop-shadow-sm">{getIcon(opt.title)}</div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1.5">
                                            <span className="w-6 h-6 rounded-full bg-white flex items-center justify-center text-xs font-bold text-gray-700 shrink-0 shadow-sm border border-black/5">
                                                {opt.key}
                                            </span>
                                            <span className="text-sm font-bold text-gray-800 leading-tight drop-shadow-sm">{opt.title}</span>
                                        </div>
                                        <p className="text-xs text-gray-700 leading-relaxed font-medium line-clamp-none sm:line-clamp-3">{opt.snippet}</p>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Divider */}
            <div className="border-t border-gray-100 mx-6" />

            {/* Situationen — matching dropdowns */}
            <div className="px-6 pt-4 pb-2">
                <div className="flex items-center justify-between mb-3">
                    <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                        🧩 Situationen zuordnen
                    </h4>
                    <span className="text-[10px] font-medium text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
                        {answeredCount}/{data.situations.length}
                    </span>
                </div>

                <div className="space-y-3">
                    {data.situations.map((sit, idx) => {
                        const isAnswered = !!mapping[sit.id]
                        const selectedOpt = data.options.find(o => o.key === mapping[sit.id])
                        return (
                            <div
                                key={sit.id}
                                className={`flex items-start gap-3 rounded-xl p-4 transition-all ${
                                    isAnswered
                                        ? 'bg-white ring-2 ring-green-200 shadow-sm'
                                        : 'bg-gray-50 ring-1 ring-gray-100 hover:ring-gray-200'
                                }`}
                            >
                                <span className={`inline-flex w-7 h-7 items-center justify-center text-xs font-bold rounded-full shrink-0 mt-0.5 ${
                                    isAnswered ? 'bg-green-500 text-white' : 'bg-[#FF6B35]/10 text-[#FF6B35]'
                                }`}>
                                    {idx + 1}
                                </span>

                                <div className="flex-1 min-w-0">
                                    <p className="text-sm text-gray-700 leading-relaxed mb-2">{sit.text}</p>
                                    <select
                                        value={mapping[sit.id] ?? ''}
                                        onChange={e => selectOption(sit.id, e.target.value)}
                                        className={`w-full px-3 py-2.5 rounded-xl text-sm transition-all appearance-none cursor-pointer
                                            ${mapping[sit.id]
                                                ? 'border-2 border-green-400 bg-green-50 text-gray-800 font-medium'
                                                : 'border-2 border-dashed border-gray-300 bg-white text-gray-500 hover:border-[#FF6B35]/40'
                                            }`}
                                    >
                                        <option value="">— Passende Anzeige wählen —</option>
                                        {data.options.map(opt => (
                                            <option
                                                key={opt.key}
                                                value={opt.key}
                                                disabled={usedOptions.has(opt.key) && mapping[sit.id] !== opt.key}
                                            >
                                                {opt.key}: {opt.title}
                                            </option>
                                        ))}
                                    </select>

                                    {selectedOpt && (
                                        <div className="mt-2 flex items-center gap-2 text-xs text-green-600">
                                            <span className="text-base">{getIcon(selectedOpt.title)}</span>
                                            <span className="font-medium">{selectedOpt.title}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}
