'use client'

import { useLocale, useTranslations } from 'next-intl'

type Rating = 'AGAIN' | 'HARD' | 'GOOD' | 'EASY'

type RatingLabelKey = 'rateAgain' | 'rateHard' | 'rateGood' | 'rateEasy'

interface RatingButtonsProps {
    onRate: (rating: Rating) => void
    disabled?: boolean
    currentInterval: number
    easeFactor: number
}

type DurationUnit = 'minute' | 'hour' | 'day' | 'month' | 'year'

function resolveLocale(locale: string): string {
    return locale.toLowerCase().startsWith('de') ? 'de' : 'vi'
}

function formatUnit(value: number, unit: DurationUnit, locale: string): string {
    try {
        return new Intl.NumberFormat(locale, {
            style: 'unit',
            unit,
            unitDisplay: 'short',
        }).format(value)
    } catch {
        return `${value} ${unit}`
    }
}

/**
 * Format an SRS interval preview (in days) for the active UI locale.
 * Exported for focused unit tests.
 */
export function formatIntervalPreview(days: number, locale: string): string {
    const loc = resolveLocale(locale)

    if (days <= 0) {
        // Sub-hour bucket shown as under one minute.
        return `< ${formatUnit(1, 'minute', loc)}`
    }
    if (days < 1) {
        const hours = Math.max(1, Math.round(days * 24))
        return formatUnit(hours, 'hour', loc)
    }
    if (days === 1) {
        return formatUnit(1, 'day', loc)
    }
    if (days < 30) {
        return formatUnit(Math.round(days), 'day', loc)
    }
    if (days < 365) {
        return formatUnit(Math.max(1, Math.round(days / 30)), 'month', loc)
    }
    return formatUnit(Math.max(1, Math.round(days / 365)), 'year', loc)
}

function previewInterval(
    interval: number,
    easeFactor: number,
    rating: Rating,
    locale: string,
): string {
    if (rating === 'AGAIN') return formatIntervalPreview(0, locale)
    if (interval === 0) return formatIntervalPreview(1, locale)

    let nextInterval: number
    if (rating === 'HARD') {
        nextInterval = Math.max(1, Math.round(interval * 0.8))
    } else if (rating === 'GOOD') {
        nextInterval = interval <= 1 ? 6 : Math.round(interval * easeFactor)
    } else {
        // EASY
        nextInterval = interval <= 1 ? 6 : Math.round(interval * easeFactor * 1.15)
    }

    return formatIntervalPreview(Math.min(nextInterval, 365), locale)
}

export function RatingButtons({ onRate, disabled, currentInterval, easeFactor }: RatingButtonsProps) {
    const t = useTranslations('SRS')
    const locale = useLocale()

    const buttons: Array<{
        rating: Rating
        labelKey: RatingLabelKey
        emoji: string
        bgClass: string
        borderClass: string
        lipColor: string
        textColor: string
    }> = [
        {
            rating: 'AGAIN',
            labelKey: 'rateAgain',
            emoji: '🔄',
            bgClass: 'bg-[#ff4b4b]',
            borderClass: 'border-[#ff4b4b]',
            lipColor: '#ea2b2b',
            textColor: 'text-white',
        },
        {
            rating: 'HARD',
            labelKey: 'rateHard',
            emoji: '😓',
            bgClass: 'bg-[#ff9600]',
            borderClass: 'border-[#ff9600]',
            lipColor: '#e68000',
            textColor: 'text-white',
        },
        {
            rating: 'GOOD',
            labelKey: 'rateGood',
            emoji: '👍',
            bgClass: 'bg-[var(--fuxie-action)]',
            borderClass: 'border-[var(--fuxie-action)]',
            lipColor: 'var(--fuxie-lip-action)',
            textColor: 'text-white',
        },
        {
            rating: 'EASY',
            labelKey: 'rateEasy',
            emoji: '🌟',
            bgClass: 'bg-[#58a700]',
            borderClass: 'border-[#58a700]',
            lipColor: '#468500',
            textColor: 'text-white',
        },
    ]

    return (
        <div className="grid grid-cols-4 gap-3.5 w-full max-w-lg mx-auto px-4 sm:px-0">
            {buttons.map(({ rating, labelKey, emoji, bgClass, borderClass, lipColor, textColor }) => {
                const preview = previewInterval(currentInterval, easeFactor, rating, locale)
                const shadowStyle = `0 4px 0 0 ${lipColor}`
                const activeShadowStyle = `0 2px 0 0 ${lipColor}`

                return (
                    <button
                        key={rating}
                        type="button"
                        onClick={() => onRate(rating)}
                        disabled={disabled}
                        style={{
                            boxShadow: shadowStyle,
                        }}
                        className={`
                            flex flex-col items-center justify-between py-2.5 px-1 rounded-2xl border-2
                            ${bgClass} ${borderClass} ${textColor} h-[76px] min-h-[44px] min-w-[44px]
                            transition-[transform,opacity,box-shadow] duration-100
                            hover:scale-[1.03] active:scale-[0.98]
                            active:translate-y-[2px]
                            focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2
                            focus-visible:outline-[var(--fuxie-blue-700)]
                            disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:translate-y-0
                        `}
                        onMouseDown={(e) => {
                            if (!disabled) {
                                e.currentTarget.style.boxShadow = activeShadowStyle
                            }
                        }}
                        onMouseUp={(e) => {
                            e.currentTarget.style.boxShadow = shadowStyle
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.boxShadow = shadowStyle
                        }}
                        onTouchStart={(e) => {
                            if (!disabled) {
                                e.currentTarget.style.boxShadow = activeShadowStyle
                            }
                        }}
                        onTouchEnd={(e) => {
                            e.currentTarget.style.boxShadow = shadowStyle
                        }}
                    >
                        <span className="text-lg leading-none" role="img" aria-hidden="true">{emoji}</span>
                        <span className="text-xs sm:text-sm font-black tracking-wide leading-none">{t(labelKey)}</span>
                        <span className="text-[10px] font-bold opacity-90 leading-none">
                            {preview}
                        </span>
                    </button>
                )
            })}
        </div>
    )
}
