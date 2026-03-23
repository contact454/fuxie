'use client'

interface MCContent {
    instructions?: string
    passage: string
    items: Array<{
        id: string
        question: string
        options: Array<{ key: string; text: string }>
    }>
}

interface Props {
    content: Record<string, unknown>
    answer: Record<string, unknown>
    onChange: (answer: Record<string, unknown>) => void
}

export function MCRenderer({ content, answer, onChange }: Props) {
    const data = content as unknown as MCContent
    const selected = (answer.answers as Record<string, string>) ?? {}

    const select = (itemId: string, key: string) => {
        onChange({ answers: { ...selected, [itemId]: key } })
    }

    return (
        <div className="flex gap-6 flex-col lg:flex-row">
            {/* Passage */}
            <div className="lg:w-1/2 max-h-[500px] overflow-y-auto pr-2">
                {data.instructions && (
                    <p className="text-xs text-gray-400 italic mb-3">{data.instructions}</p>
                )}
                <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-line leading-relaxed">
                    {data.passage}
                </div>
            </div>

            {/* Questions */}
            <div className="lg:w-1/2 space-y-5">
                {data.items.map((item, idx) => (
                    <div key={item.id} className="bg-gray-50 rounded-xl p-4">
                        <p className="text-sm font-medium text-gray-800 mb-3">
                            <span className="inline-flex w-6 h-6 items-center justify-center bg-[#FF6B35]/10 text-[#FF6B35] text-xs font-bold rounded-full mr-2">
                                {idx + 1}
                            </span>
                            {item.question}
                        </p>
                        <div className="space-y-2 ml-8">
                            {item.options.map(opt => (
                                <button
                                    key={opt.key}
                                    onClick={() => select(item.id, opt.key)}
                                    className={`w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all
                                        ${selected[item.id] === opt.key
                                            ? 'bg-[#FF6B35]/10 text-[#FF6B35] ring-2 ring-[#FF6B35]/40 font-medium'
                                            : 'bg-white ring-1 ring-gray-200 text-gray-700 hover:ring-gray-300'
                                        }`}
                                >
                                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0
                                        ${selected[item.id] === opt.key
                                            ? 'bg-[#FF6B35] text-white'
                                            : 'bg-gray-100 text-gray-500'
                                        }`}
                                    >
                                        {opt.key}
                                    </span>
                                    {opt.text}
                                </button>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
