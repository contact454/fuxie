'use client'

interface TFContent {
    instructions?: string
    passage: string
    items: Array<{
        id: string
        statement: string
    }>
}

interface Props {
    content: Record<string, unknown>
    answer: Record<string, unknown>
    onChange: (answer: Record<string, unknown>) => void
}

export function TFRenderer({ content, answer, onChange }: Props) {
    const data = content as unknown as TFContent
    const selected = (answer.answers as Record<string, string>) ?? {}

    const toggle = (itemId: string, value: string) => {
        onChange({ answers: { ...selected, [itemId]: value } })
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

                <div className="space-y-3">
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
                                <div className="flex items-start gap-3 mb-3">
                                    <span className={`inline-flex w-7 h-7 items-center justify-center text-xs font-bold rounded-full shrink-0 ${
                                        isAnswered
                                            ? 'bg-green-500 text-white'
                                            : 'bg-[#FF6B35]/10 text-[#FF6B35]'
                                    }`}>
                                        {idx + 1}
                                    </span>
                                    <p className="text-sm text-gray-700 leading-relaxed flex-1 pt-0.5">{item.statement}</p>
                                </div>

                                <div className="flex gap-2 ml-10">
                                    <button
                                        onClick={() => toggle(item.id, 'RICHTIG')}
                                        className={`flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium transition-all
                                            ${selected[item.id] === 'RICHTIG'
                                                ? 'bg-green-500 text-white shadow-md shadow-green-200 scale-[1.02]'
                                                : 'bg-white ring-1 ring-gray-200 text-gray-600 hover:ring-green-300 hover:text-green-600'
                                            }`}
                                    >
                                        <span className="text-base">✓</span> Richtig
                                    </button>
                                    <button
                                        onClick={() => toggle(item.id, 'FALSCH')}
                                        className={`flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium transition-all
                                            ${selected[item.id] === 'FALSCH'
                                                ? 'bg-red-500 text-white shadow-md shadow-red-200 scale-[1.02]'
                                                : 'bg-white ring-1 ring-gray-200 text-gray-600 hover:ring-red-300 hover:text-red-600'
                                            }`}
                                    >
                                        <span className="text-base">✗</span> Falsch
                                    </button>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}
