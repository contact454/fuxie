import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from 'react'

type FuxieButtonVariant = 'primary' | 'secondary' | 'ghost' | 'reward'
type FuxieButtonSize = 'sm' | 'md' | 'lg'
type FuxiePanelVariant = 'default' | 'hero' | 'interactive' | 'soft'
type FuxieTone = 'brand' | 'reward' | 'success' | 'danger' | 'neutral'
type FuxieLevelTabDisabled<T extends string> = boolean | ((item: T) => boolean)
export type FuxieRewardTone = 'brand' | 'reward' | 'streak' | 'success' | 'badge' | 'neutral'

export function fx(...classes: Array<string | false | null | undefined>) {
    return classes.filter(Boolean).join(' ')
}

const buttonBase =
    'inline-flex items-center justify-center gap-2 rounded-xl font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#60A8E4]/40 disabled:cursor-not-allowed disabled:opacity-60'

const buttonVariants: Record<FuxieButtonVariant, string> = {
    primary: 'bg-[#60A8E4] text-white shadow-lg shadow-sky-900/15 hover:-translate-y-0.5 hover:bg-[#3C78A8] hover:shadow-sky-900/20',
    secondary: 'bg-[#F3FBFF] text-text-brand ring-1 ring-[#60A8E4]/20 hover:bg-[#CCE4F0]/55',
    ghost: 'bg-white text-text-brand ring-1 ring-slate-200 hover:bg-[#F3FBFF] hover:ring-[#60A8E4]/25',
    reward: 'bg-[#FFB703] text-white shadow-lg shadow-amber-900/15 hover:-translate-y-0.5 hover:bg-[#F59E0B]',
}

const buttonSizes: Record<FuxieButtonSize, string> = {
    sm: 'px-3 py-2 text-xs',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-6 py-3 text-sm',
}

export function fuxieButtonClass(
    variant: FuxieButtonVariant = 'primary',
    size: FuxieButtonSize = 'md',
    className = ''
) {
    return fx(buttonBase, buttonVariants[variant], buttonSizes[size], className)
}

export function FuxieButton({
    variant = 'primary',
    size = 'md',
    className,
    ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: FuxieButtonVariant
    size?: FuxieButtonSize
}) {
    return <button className={fuxieButtonClass(variant, size, className)} {...props} />
}

const panelVariants: Record<FuxiePanelVariant, string> = {
    default: 'rounded-2xl border border-slate-100 bg-white shadow-sm',
    hero: 'rounded-[28px] border border-white/80 bg-gradient-to-br from-[#F3FBFF] via-white to-[#CCE4F0] shadow-[0_24px_70px_rgba(60,120,168,0.14)]',
    interactive: 'rounded-2xl border border-slate-100 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md hover:shadow-sky-900/10',
    soft: 'rounded-2xl border border-[#60A8E4]/15 bg-[#F3FBFF] shadow-sm',
}

export function fuxiePanelClass(variant: FuxiePanelVariant = 'default', className = '') {
    return fx(panelVariants[variant], className)
}

export function FuxiePanel({
    variant = 'default',
    className,
    ...props
}: HTMLAttributes<HTMLDivElement> & {
    variant?: FuxiePanelVariant
}) {
    return <div className={fuxiePanelClass(variant, className)} {...props} />
}

const badgeTones: Record<FuxieTone, string> = {
    brand: 'bg-white/80 text-text-brand ring-[#60A8E4]/25',
    reward: 'bg-[#FFF4D6] text-text-reward ring-[#FFD166]/50',
    success: 'bg-emerald-50 text-emerald-700 ring-emerald-200/70',
    danger: 'bg-red-50 text-red-600 ring-red-200/70',
    neutral: 'bg-slate-100 text-slate-600 ring-slate-200',
}

export function FuxieBadge({
    tone = 'brand',
    className,
    children,
}: {
    tone?: FuxieTone
    className?: string
    children: ReactNode
}) {
    return (
        <span className={fx('inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-black uppercase ring-1', badgeTones[tone], className)}>
            {children}
        </span>
    )
}

const progressTones: Record<FuxieTone, string> = {
    brand: 'from-[#60A8E4] to-[#2EC4B6]',
    reward: 'from-[#FFD166] to-[#FF8A3D]',
    success: 'from-emerald-400 to-emerald-600',
    danger: 'from-red-400 to-red-600',
    neutral: 'from-slate-300 to-slate-500',
}

export function FuxieProgressBar({
    value,
    tone = 'brand',
    className,
    barClassName,
}: {
    value: number
    tone?: FuxieTone
    className?: string
    barClassName?: string
}) {
    const safeValue = Math.max(0, Math.min(100, value))

    return (
        <div className={fx('h-2.5 overflow-hidden rounded-full bg-[#CCE4F0]/60', className)}>
            <div
                className={fx('h-full rounded-full bg-gradient-to-r transition-all duration-700 ease-out', progressTones[tone], barClassName)}
                style={{ width: `${Math.max(safeValue, safeValue > 0 ? 2 : 0)}%` }}
            />
        </div>
    )
}

export function FuxieLevelTabs<T extends string>({
    items,
    activeItem,
    onSelect,
    disabled = false,
    className,
    buttonClassName,
    getLabel,
    getCount,
    getActiveClassName,
    getInactiveClassName,
    ariaLabel = 'Level filter',
}: {
    items: readonly T[]
    activeItem: T
    onSelect: (item: T) => void
    disabled?: FuxieLevelTabDisabled<T>
    className?: string
    buttonClassName?: string
    getLabel?: (item: T) => ReactNode
    getCount?: (item: T) => number | null | undefined
    getActiveClassName?: (item: T) => string
    getInactiveClassName?: (item: T) => string
    ariaLabel?: string
}) {
    return (
        <div
            role="tablist"
            aria-label={ariaLabel}
            className={fx(
                'flex gap-2 overflow-x-auto rounded-2xl border border-[#60A8E4]/15 bg-white/80 p-1.5 shadow-inner [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
                className
            )}
        >
            {items.map((item) => {
                const isActive = item === activeItem
                const itemDisabled = typeof disabled === 'function' ? disabled(item) : disabled
                const count = getCount?.(item)

                return (
                    <button
                        key={item}
                        type="button"
                        role="tab"
                        aria-selected={isActive}
                        disabled={itemDisabled}
                        onClick={() => onSelect(item)}
                        className={fx(
                            'relative inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl px-4 py-2 text-sm font-black min-h-[44px] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#60A8E4]/40 disabled:cursor-wait disabled:opacity-60',
                            isActive
                                ? fx('bg-[#60A8E4] text-white shadow-md shadow-sky-900/15', getActiveClassName?.(item))
                                : fx('bg-white/60 text-text-brand ring-1 ring-[#60A8E4]/15 hover:bg-[#F3FBFF]', getInactiveClassName?.(item)),
                            buttonClassName
                        )}
                    >
                        <span>{getLabel ? getLabel(item) : item}</span>
                        {count ? (
                            <span className={fx(
                                'rounded-full px-1.5 py-0.5 text-xs font-black',
                                isActive ? 'bg-white/20 text-white' : 'bg-[#F3FBFF] text-text-brand'
                            )}>
                                {count}
                            </span>
                        ) : null}
                    </button>
                )
            })}
        </div>
    )
}

type FuxieQuestCardCommon = {
    interactive?: boolean
    className?: string
    children: ReactNode
}

type FuxieQuestCardProps =
    | ({ as?: 'div' } & HTMLAttributes<HTMLDivElement> & FuxieQuestCardCommon)
    | ({ as: 'button' } & ButtonHTMLAttributes<HTMLButtonElement> & FuxieQuestCardCommon)

function fuxieQuestCardClass(interactive = true, className = '') {
    return fx(
        'group relative overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm',
        interactive && 'transition-all hover:-translate-y-0.5 hover:border-[#60A8E4]/35 hover:shadow-lg hover:shadow-sky-900/10',
        className
    )
}

export function FuxieQuestCard(props: FuxieQuestCardProps) {
    const classes = fuxieQuestCardClass(props.interactive, props.className)

    if (props.as === 'button') {
        const {
            as: _as,
            interactive: _interactive,
            className: _className,
            type,
            ...buttonProps
        } = props

        return <button type={type ?? 'button'} className={classes} {...buttonProps} />
    }

    const {
        as: _as,
        interactive: _interactive,
        className: _className,
        ...divProps
    } = props

    return <div className={classes} {...divProps} />
}

export interface FuxieRewardListItem {
    id?: string
    icon: ReactNode
    label: string
    detail: string
    tone?: FuxieRewardTone
}

const rewardListToneClasses: Record<FuxieRewardTone, { item: string; icon: string }> = {
    brand: {
        item: 'bg-[#EEF7FF] ring-[#CCE4F0]/90',
        icon: 'bg-[#3C78A8]',
    },
    reward: {
        item: 'bg-[#FFF7D6] ring-[#FFD166]/45',
        icon: 'bg-[#FFB703]',
    },
    streak: {
        item: 'bg-[#FFF0E5] ring-[#FFB703]/25',
        icon: 'bg-[#FF8A3D]',
    },
    success: {
        item: 'bg-[#EAFBF8] ring-[#2EC4B6]/30',
        icon: 'bg-[#2EC4B6]',
    },
    badge: {
        item: 'bg-violet-50 ring-violet-200/50',
        icon: 'bg-violet-600',
    },
    neutral: {
        item: 'bg-slate-50 ring-slate-200/80',
        icon: 'bg-slate-500',
    },
}

export function FuxieRewardList({
    items,
    layout = 'row',
    className,
}: {
    items: FuxieRewardListItem[]
    layout?: 'row' | 'stack'
    className?: string
}) {
    return (
        <div className={fx('grid gap-2', layout === 'stack' ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-3', className)}>
            {items.map((item) => {
                const tone = rewardListToneClasses[item.tone ?? 'brand']

                return (
                    <div
                        key={item.id ?? `${item.tone ?? 'brand'}-${item.label}`}
                        className={fx('flex min-w-0 items-center gap-3 rounded-xl px-3 py-2.5 ring-1', tone.item)}
                    >
                        <span className={fx('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white shadow-sm', tone.icon)}>
                            {item.icon}
                        </span>
                        <div className="min-w-0">
                            <p className="truncate text-sm font-black text-slate-950">{item.label}</p>
                            <p className="truncate text-xs font-semibold text-slate-500">{item.detail}</p>
                        </div>
                    </div>
                )
            })}
        </div>
    )
}
