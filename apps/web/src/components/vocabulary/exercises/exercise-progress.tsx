'use client'

import { FuxieBadge, FuxieProgressBar } from '@/components/ui/fuxie-ui'

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
        <div className="flex items-center gap-3 border-b border-[#60A8E4]/10 bg-white/95 px-4 py-3 shadow-sm backdrop-blur">
            {/* Close button */}
            <button
                onClick={onClose}
                aria-label="Close exercise"
                className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition-colors hover:bg-[#F3FBFF] hover:text-text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#60A8E4]/40"
            >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>

            {/* Progress bar */}
            <div className="flex-1">
                <FuxieProgressBar value={progress} className="h-3" />
            </div>

            {/* Question counter */}
            <span className="whitespace-nowrap text-sm font-bold text-slate-500">
                Câu {current} / {total}
            </span>

            {/* Timer */}
            {timer !== undefined && timer !== null && (
                <span className="whitespace-nowrap rounded-full bg-[#F3FBFF] px-2.5 py-1 font-mono text-xs font-bold text-text-brand ring-1 ring-[#60A8E4]/15">
                    ⏱ {formatTime(timer)}
                </span>
            )}

            {/* CEFR badge */}
            {cefrLevel && (
                <FuxieBadge tone="brand" className="shrink-0">
                    {cefrLevel}
                </FuxieBadge>
            )}
        </div>
    )
}
