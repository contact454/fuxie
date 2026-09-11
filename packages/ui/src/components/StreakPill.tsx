import * as React from 'react'

export interface StreakPillProps extends React.HTMLAttributes<HTMLDivElement> {
    count: number
}

export function StreakPill({ count, className = '', ...props }: StreakPillProps) {
    const hasStreak = count > 0

    return (
        <div
            data-reward-context="true"
            data-reward-color="var(--fuxie-reward)"
            className={`inline-flex items-center gap-[var(--fuxie-space-2)] px-[var(--fuxie-space-3)] py-[var(--fuxie-space-1)] rounded-[var(--fuxie-radius-pill)] border border-[var(--fuxie-blue-200)] bg-[var(--fuxie-blue-50)] shadow-sm ${className}`.trim()}
            {...props}
        >
            {/* Icon ngọn lửa màu amber --fuxie-reward */}
            <img
                src="/fig/ui-icons/icon-streak-flame.png"
                alt="Streak"
                className={`w-5 h-5 object-contain ${hasStreak ? 'animate-pulse' : 'grayscale opacity-60'}`}
            />
            <span className="text-[var(--fuxie-text-caption)] font-black text-[var(--fuxie-blue-900)]">
                {count}
            </span>
        </div>
    )
}
