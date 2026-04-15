// ─── Stat Card (Hero stats at top of dashboard) ─────
interface StatCardProps {
    label: string
    value: number
    icon: string
    suffix?: string
    detail: string
    gradient: string
    color: string
    pulse?: boolean
    urgent?: boolean
    index: number
    goalPercent?: number
}

export function StatCard({
    label, value, icon, suffix, detail, gradient, color,
    pulse, urgent, index, goalPercent,
}: StatCardProps) {
    return (
        <div
            className={`card-hover group relative overflow-hidden rounded-2xl bg-white p-4 sm:p-5 shadow-sm ring-1 ring-gray-100 animate-fade-in-up stagger-${index + 1}`}
        >
            {/* Background decoration */}
            <div className={`absolute -right-4 -top-4 h-20 w-20 rounded-full bg-gradient-to-br ${gradient} opacity-60 transition-transform group-hover:scale-125`} />

            {/* Label */}
            <p className="text-xs sm:text-sm font-medium text-gray-400 relative z-10">{label}</p>

            {/* Value */}
            <div className="mt-1 flex items-baseline gap-1 relative z-10">
                <span
                    className="text-3xl sm:text-4xl font-bold animate-count-up"
                    style={{ color }}
                >
                    {value}
                </span>
                {suffix && (
                    <span className="text-sm font-normal text-gray-400">{suffix}</span>
                )}
                <span className={`ml-1 text-xl sm:text-2xl ${pulse ? 'animate-pulse-fire' : ''}`}>
                    {icon}
                </span>
            </div>

            {/* Detail */}
            <p className="mt-1 text-[10px] sm:text-xs text-gray-400 relative z-10">{detail}</p>

            {/* Goal progress bar (for study time card) */}
            {goalPercent !== undefined && (
                <div className="mt-2 h-1.5 w-full rounded-full bg-gray-100 relative z-10">
                    <div
                        className="h-1.5 rounded-full transition-all duration-700"
                        style={{
                            width: `${goalPercent}%`,
                            backgroundColor: goalPercent >= 100 ? '#4CAF50' : color,
                        }}
                    />
                </div>
            )}

            {/* Urgent badge */}
            {urgent && (
                <div className="absolute top-2 right-2 flex h-2 w-2 z-10">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
                </div>
            )}
        </div>
    )
}

// ─── Mini Stat (compact stat chip) ──────────────────
export function MiniStat({ value, label, icon }: { value: number | string; label: string; icon: string }) {
    return (
        <div className="rounded-xl bg-gray-50 p-2.5 text-center transition-colors hover:bg-gray-100">
            <p className="text-lg sm:text-xl font-bold text-gray-800">
                <span className="mr-0.5 text-sm">{icon}</span> {value}
            </p>
            <p className="text-[10px] text-gray-400">{label}</p>
        </div>
    )
}
