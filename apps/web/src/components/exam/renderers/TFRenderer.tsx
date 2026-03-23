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

    return (
        <div>
            {data.instructions && (
                <p className="text-xs text-gray-400 italic mb-3">{data.instructions}</p>
            )}

            {/* Passage */}
            <div className="bg-gray-50 rounded-xl p-4 mb-5 max-h-[300px] overflow-y-auto">
                <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-line leading-relaxed">
                    {data.passage}
                </div>
            </div>

            {/* Statements */}
            <div className="space-y-3">
                {data.items.map((item, idx) => (
                    <div
                        key={item.id}
                        className="flex items-start gap-3 bg-white rounded-xl ring-1 ring-gray-100 p-4"
                    >
                        <span className="inline-flex w-6 h-6 items-center justify-center bg-gray-100 text-gray-500 text-xs font-bold rounded-full shrink-0 mt-0.5">
                            {idx + 1}
                        </span>
                        <p className="flex-1 text-sm text-gray-700 leading-relaxed">{item.statement}</p>
                        <div className="flex gap-1.5 shrink-0">
                            <button
                                onClick={() => toggle(item.id, 'RICHTIG')}
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all
                                    ${selected[item.id] === 'RICHTIG'
                                        ? 'bg-green-500 text-white shadow-sm'
                                        : 'bg-gray-100 text-gray-500 hover:bg-green-50 hover:text-green-600'
                                    }`}
                            >
                                Richtig
                            </button>
                            <button
                                onClick={() => toggle(item.id, 'FALSCH')}
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all
                                    ${selected[item.id] === 'FALSCH'
                                        ? 'bg-red-500 text-white shadow-sm'
                                        : 'bg-gray-100 text-gray-500 hover:bg-red-50 hover:text-red-600'
                                    }`}
                            >
                                Falsch
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
