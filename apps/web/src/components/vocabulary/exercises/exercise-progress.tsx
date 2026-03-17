'use client'

interface ExerciseProgressProps {
    current: number
    total: number
    onClose: () => void
    timer?: number | null // seconds
    cefrLevel?: string
}

export function ExerciseProgress({ current, total, onClose, timer, cefrLevel }: ExerciseProgressProps) {
    const progress = total > 0 ? (current / total) * 100 : 0

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60)
        const s = seconds % 60
        return `${m}:${s.toString().padStart(2, '0')}`
    }

    return (
        <div className="flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-100">
            {/* Close button */}
            <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600"
            >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>

            {/* Progress bar */}
            <div className="flex-1">
                <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${Math.max(progress, 2)}%` }}
                    />
                </div>
            </div>

            {/* Question counter */}
            <span className="text-sm text-gray-500 font-medium whitespace-nowrap">
                Frage {current} von {total}
            </span>

            {/* Timer */}
            {timer !== undefined && timer !== null && (
                <span className="text-sm text-gray-400 font-mono whitespace-nowrap">
                    ⏱ {formatTime(timer)}
                </span>
            )}

            {/* CEFR badge */}
            {cefrLevel && (
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-[#004E89] text-white">
                    {cefrLevel}
                </span>
            )}
        </div>
    )
}
