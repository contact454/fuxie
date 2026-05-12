'use client'

interface SuggestedTopicsProps {
    topics: string[]
    onSelect: (topic: string) => void
    variant?: 'grid' | 'inline'
}

export function SuggestedTopics({ topics, onSelect, variant = 'inline' }: SuggestedTopicsProps) {
    if (!topics || topics.length === 0) return null

    // Grid variant for the start screen
    if (variant === 'grid') {
        return (
            <div className="grid grid-cols-2 gap-2 w-full max-w-md mx-auto mt-4">
                {topics.map((topic, i) => (
                    <button
                        key={i}
                        onClick={() => onSelect(topic)}
                        className="group relative overflow-hidden rounded-xl px-3 py-3 text-left bg-white ring-1 ring-gray-100 shadow-sm hover:shadow-md hover:ring-[#60A8E4]/30 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 ease-out"
                        style={{ animationDelay: `${i * 60}ms` }}
                    >
                        <p className="text-xs text-gray-700 font-medium leading-snug line-clamp-2">
                            {topic}
                        </p>
                        <div className="absolute -bottom-1 -right-1 text-2xl opacity-0 group-hover:opacity-10 transition-opacity">
                            💬
                        </div>
                    </button>
                ))}
            </div>
        )
    }

    // Inline variant for follow-up suggestions in chat
    return (
        <div className="flex flex-wrap gap-1.5 mt-2 suggested-topics-container">
            {topics.map((topic, i) => (
                <button
                    key={i}
                    onClick={() => onSelect(topic)}
                    className="px-3 py-1.5 rounded-full text-[11px] font-medium bg-[#F3FBFF] text-[#3C78A8] ring-1 ring-[#60A8E4]/25 hover:bg-[#CCE4F0]/45 hover:ring-[#60A8E4]/40 active:scale-95 transition-all duration-150 suggested-topic-pill"
                    style={{
                        animationDelay: `${i * 80}ms`,
                        opacity: 0,
                        animation: `suggestedFadeInUp 0.3s ease-out ${i * 80}ms forwards`,
                    }}
                >
                    {topic}
                </button>
            ))}
        </div>
    )
}
