'use client'

interface RatingButtonsProps {
    onRate: (rating: 'AGAIN' | 'HARD' | 'GOOD' | 'EASY') => void
    disabled?: boolean
    currentInterval: number
    easeFactor: number
}

function formatInterval(days: number): string {
    if (days === 0) return '< 1 phút'
    if (days < 1) return `${Math.round(days * 24)} giờ`
    if (days === 1) return '1 ngày'
    if (days < 30) return `${Math.round(days)} ngày`
    if (days < 365) return `${Math.round(days / 30)} tháng`
    return `${Math.round(days / 365)} năm`
}

function previewInterval(interval: number, easeFactor: number, rating: 'AGAIN' | 'HARD' | 'GOOD' | 'EASY'): string {
    if (rating === 'AGAIN') return '< 1 phút'
    if (interval === 0) return '1 ngày'

    let nextInterval: number
    if (rating === 'HARD') {
        nextInterval = Math.max(1, Math.round(interval * 0.8))
    } else if (rating === 'GOOD') {
        nextInterval = interval <= 1 ? 6 : Math.round(interval * easeFactor)
    } else {
        // EASY
        nextInterval = interval <= 1 ? 6 : Math.round(interval * easeFactor * 1.15)
    }

    return formatInterval(Math.min(nextInterval, 365))
}

export function RatingButtons({ onRate, disabled, currentInterval, easeFactor }: RatingButtonsProps) {
    const buttons = [
        {
            rating: 'AGAIN' as const,
            label: 'Làm lại',
            emoji: '🔄',
            color: 'from-red-500 to-red-600',
            hoverColor: 'hover:from-red-600 hover:to-red-700',
            textColor: 'text-white',
            shadow: 'shadow-red-200',
        },
        {
            rating: 'HARD' as const,
            label: 'Khó',
            emoji: '😓',
            color: 'from-orange-400 to-orange-500',
            hoverColor: 'hover:from-orange-500 hover:to-orange-600',
            textColor: 'text-white',
            shadow: 'shadow-orange-200',
        },
        {
            rating: 'GOOD' as const,
            label: 'Ổn',
            emoji: '👍',
            color: 'from-emerald-500 to-emerald-600',
            hoverColor: 'hover:from-emerald-600 hover:to-emerald-700',
            textColor: 'text-white',
            shadow: 'shadow-emerald-200',
        },
        {
            rating: 'EASY' as const,
            label: 'Dễ',
            emoji: '🌟',
            color: 'from-blue-500 to-blue-600',
            hoverColor: 'hover:from-blue-600 hover:to-blue-700',
            textColor: 'text-white',
            shadow: 'shadow-blue-200',
        },
    ]

    return (
        <div className="grid grid-cols-4 gap-3 w-full max-w-lg mx-auto">
            {buttons.map(({ rating, label, emoji, color, hoverColor, textColor, shadow }) => (
                <button
                    key={rating}
                    onClick={() => onRate(rating)}
                    disabled={disabled}
                    className={`
                        flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl
                        bg-gradient-to-b ${color} ${hoverColor} ${textColor}
                        shadow-lg ${shadow}
                        transition-all duration-200 
                        hover:scale-105 hover:shadow-xl
                        active:scale-95
                        disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
                    `}
                >
                    <span className="text-xl">{emoji}</span>
                    <span className="text-sm font-semibold">{label}</span>
                    <span className="text-xs opacity-80">
                        {previewInterval(currentInterval, easeFactor, rating)}
                    </span>
                </button>
            ))}
        </div>
    )
}
