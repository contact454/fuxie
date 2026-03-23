'use client'

interface MatchingContent {
    instructions?: string
    situations: Array<{ id: string; text: string }>
    options: Array<{ key: string; title: string; snippet: string }>
}

interface Props {
    content: Record<string, unknown>
    answer: Record<string, unknown>
    onChange: (answer: Record<string, unknown>) => void
}

export function MatchingRenderer({ content, answer, onChange }: Props) {
    const data = content as unknown as MatchingContent
    const mapping = (answer.mapping as Record<string, string>) ?? {}

    const selectOption = (situationId: string, optionKey: string) => {
        onChange({ mapping: { ...mapping, [situationId]: optionKey } })
    }

    // Which options are already used
    const usedOptions = new Set(Object.values(mapping))

    return (
        <div>
            {data.instructions && (
                <p className="text-xs text-gray-400 italic mb-4">{data.instructions}</p>
            )}

            <div className="flex gap-6 flex-col lg:flex-row">
                {/* Situations */}
                <div className="lg:w-1/2 space-y-3">
                    <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Situationen</h4>
                    {data.situations.map((sit, idx) => (
                        <div key={sit.id} className="bg-white rounded-xl ring-1 ring-gray-100 p-4">
                            <div className="flex items-start gap-3">
                                <span className="inline-flex w-6 h-6 items-center justify-center bg-[#FF6B35]/10 text-[#FF6B35] text-xs font-bold rounded-full shrink-0 mt-0.5">
                                    {idx + 1}
                                </span>
                                <p className="text-sm text-gray-700 flex-1">{sit.text}</p>
                            </div>
                            {/* Dropdown */}
                            <div className="mt-3 ml-9">
                                <select
                                    value={mapping[sit.id] ?? ''}
                                    onChange={e => selectOption(sit.id, e.target.value)}
                                    className={`w-full px-3 py-2 rounded-lg text-sm border transition-all
                                        ${mapping[sit.id]
                                            ? 'border-[#FF6B35]/40 bg-[#FF6B35]/5 text-gray-800 font-medium'
                                            : 'border-gray-200 bg-gray-50 text-gray-500'
                                        }`}
                                >
                                    <option value="">— Anzeige wählen —</option>
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
                            </div>
                        </div>
                    ))}
                </div>

                {/* Options reference */}
                <div className="lg:w-1/2 space-y-2 max-h-[500px] overflow-y-auto">
                    <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Anzeigen</h4>
                    {data.options.map(opt => {
                        const isUsed = usedOptions.has(opt.key)
                        return (
                            <div
                                key={opt.key}
                                className={`rounded-xl p-3 transition-all
                                    ${isUsed
                                        ? 'bg-green-50 ring-1 ring-green-200 opacity-60'
                                        : 'bg-gray-50 ring-1 ring-gray-100'
                                    }`}
                            >
                                <div className="flex items-center gap-2 mb-1">
                                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
                                        ${isUsed ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'}`}
                                    >
                                        {opt.key}
                                    </span>
                                    <span className="text-sm font-medium text-gray-800">{opt.title}</span>
                                    {isUsed && <span className="text-[10px] text-green-600 ml-auto">✓ Gewählt</span>}
                                </div>
                                <p className="text-xs text-gray-500 ml-8">{opt.snippet}</p>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}
