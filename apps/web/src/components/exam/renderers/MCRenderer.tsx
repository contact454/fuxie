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

    const answeredCount = data.items.filter(i => selected[i.id]).length

    return (
        <div className="flex flex-col lg:flex-row gap-0 -mx-6 -mt-2">
            {/* LEFT: Passage panel — sticky on desktop */}
            <div className="lg:w-[48%] lg:sticky lg:top-0 lg:self-start lg:max-h-[calc(100vh-220px)] lg:overflow-y-auto border-b lg:border-b-0 lg:border-r border-gray-100">
                <div className="px-6 pt-4 pb-5">
                    {data.instructions && (
                        <div className="flex items-start gap-2 bg-blue-50 rounded-lg px-3 py-2 mb-4">
                            <span className="text-blue-400 text-sm mt-0.5">💡</span>
                            <p className="text-xs text-blue-600 leading-relaxed">{data.instructions}</p>
                        </div>
                    )}

                    <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                        📄 Lesetext
                    </h4>

                    <div className="bg-amber-50/50 rounded-xl p-5 ring-1 ring-amber-100/50">
                        <div className="text-sm text-gray-700 whitespace-pre-line leading-[1.8] selection:bg-amber-200">
                            {data.passage}
                        </div>
                    </div>
                </div>
            </div>

            {/* RIGHT: Questions panel */}
            <div className="lg:w-[52%] px-6 pt-4 pb-2">
                <div className="flex items-center justify-between mb-4">
                    <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                        ✏️ Aufgaben
                    </h4>
                    <span className="text-[10px] font-medium text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
                        {answeredCount}/{data.items.length}
                    </span>
                </div>

                <div className="space-y-4">
                    {data.items.map((item, idx) => {
                        const isAnswered = !!selected[item.id]
                        return (
                            <div
                                key={item.id}
                                className={`rounded-xl p-4 transition-all ${
                                    isAnswered
                                        ? 'bg-white ring-2 ring-green-200 shadow-sm'
                                        : 'bg-gray-50 ring-1 ring-gray-100 hover:ring-gray-200'
                                }`}
                            >
                                <p className="text-sm font-medium text-gray-800 mb-3 flex items-start gap-2">
                                    <span className={`inline-flex w-7 h-7 items-center justify-center text-xs font-bold rounded-full shrink-0 ${
                                        isAnswered
                                            ? 'bg-green-500 text-white'
                                            : 'bg-[#FF6B35]/10 text-[#FF6B35]'
                                    }`}>
                                        {idx + 1}
                                    </span>
                                    <span className="pt-0.5">{item.question}</span>
                                </p>
                                <div className="space-y-2 ml-9">
                                    {item.options.map(opt => (
                                        <button
                                            key={opt.key}
                                            onClick={() => select(item.id, opt.key)}
                                            className={`w-full text-left flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all
                                                ${selected[item.id] === opt.key
                                                    ? 'bg-[#FF6B35] text-white ring-2 ring-[#FF6B35] shadow-md shadow-[#FF6B35]/20 font-medium'
                                                    : 'bg-white ring-1 ring-gray-200 text-gray-700 hover:ring-[#FF6B35]/40 hover:bg-[#FF6B35]/5'
                                                }`}
                                        >
                                            <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0
                                                ${selected[item.id] === opt.key
                                                    ? 'bg-white/25 text-white'
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
                        )
                    })}
                </div>
            </div>
        </div>
    )
}
