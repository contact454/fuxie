import { fuxieButtonClass, fx } from '@/components/ui/fuxie-ui'

export const exerciseScreenClass = 'fixed inset-0 z-50 flex flex-col bg-[#F7FBFD] text-slate-950'
export const exerciseCenterStageClass = 'flex flex-1 items-center justify-center overflow-y-auto'
export const exerciseStageInnerClass = 'w-full max-w-2xl px-5 py-8 sm:px-6'

export function exercisePromptImageClass(className = '') {
    return fx(
        'rounded-[24px] object-cover shadow-lg shadow-sky-900/12 ring-4 ring-white',
        className
    )
}

export function exerciseAudioButtonClass(className = '') {
    return fx(
        'mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-[#60A8E4] via-[#3C78A8] to-[#2EC4B6] text-white shadow-xl shadow-sky-900/20 transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#60A8E4]/45',
        className
    )
}

export function exerciseInlineAudioClass(className = '') {
    return fx(
        'mt-3 inline-flex items-center gap-2 rounded-full bg-[#F3FBFF] px-3 py-1.5 text-sm font-bold text-[#3C78A8] ring-1 ring-[#60A8E4]/20 transition-colors hover:bg-[#CCE4F0]/55 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#60A8E4]/40',
        className
    )
}

export function exerciseOptionClass({
    selected = false,
    revealed = false,
    className = '',
}: {
    selected?: boolean
    revealed?: boolean
    className?: string
}) {
    return fx(
        'min-h-[64px] rounded-2xl border-2 px-4 py-4 text-center text-base font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#60A8E4]/35 disabled:cursor-default sm:px-5',
        revealed
            ? selected
                ? 'border-[#60A8E4] bg-[#EEF7FF] text-[#3C78A8] shadow-md shadow-sky-900/10 ring-2 ring-[#60A8E4]/20'
                : 'border-slate-100 bg-white/70 text-slate-400'
            : 'border-[#CCE4F0] bg-white text-slate-800 shadow-sm hover:-translate-y-0.5 hover:border-[#60A8E4] hover:bg-[#F3FBFF] hover:shadow-md hover:shadow-sky-900/10',
        className
    )
}

export function exercisePairCardClass({
    matched = false,
    selected = false,
    wrong = false,
    className = '',
}: {
    matched?: boolean
    selected?: boolean
    wrong?: boolean
    className?: string
}) {
    return fx(
        'w-full min-h-[54px] rounded-2xl border-2 px-4 py-3.5 text-sm font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#60A8E4]/35 disabled:cursor-default',
        matched
            ? 'border-[#2EC4B6]/45 bg-[#EAFBF8] text-[#0F766E] opacity-75'
            : wrong
                ? 'animate-shake border-red-300 bg-red-50 text-red-600'
                : selected
                    ? 'border-[#60A8E4] bg-[#EEF7FF] text-[#3C78A8] shadow-md shadow-sky-900/10 ring-2 ring-[#60A8E4]/20'
                    : 'border-[#CCE4F0] bg-white text-slate-800 shadow-sm hover:-translate-y-0.5 hover:border-[#60A8E4] hover:bg-[#F3FBFF] hover:shadow-md hover:shadow-sky-900/10',
        className
    )
}

export function exerciseTextInputClass({
    revealed = false,
    className = '',
}: {
    revealed?: boolean
    className?: string
}) {
    return fx(
        'relative overflow-hidden rounded-2xl border-2 transition-all',
        revealed
            ? 'border-[#60A8E4] bg-[#EEF7FF] shadow-inner'
            : 'border-[#CCE4F0] bg-white focus-within:border-[#60A8E4] focus-within:shadow-lg focus-within:shadow-sky-900/10',
        className
    )
}

export function exerciseSpecialCharClass(className = '') {
    return fx(
        'h-10 w-10 rounded-xl border-2 border-[#CCE4F0] bg-white text-base font-bold text-[#3C78A8] shadow-sm transition-all hover:-translate-y-0.5 hover:border-[#60A8E4] hover:bg-[#F3FBFF] disabled:cursor-not-allowed disabled:border-slate-100 disabled:bg-slate-100 disabled:text-slate-300 disabled:shadow-none',
        className
    )
}

export function exercisePrimaryActionClass(disabled = false, className = '') {
    return fuxieButtonClass(
        'primary',
        'lg',
        fx(
            'min-h-[48px]',
            disabled && 'bg-slate-200 text-slate-400 shadow-none hover:translate-y-0 hover:bg-slate-200',
            className
        )
    )
}

export function exerciseSecondaryActionClass(disabled = false, className = '') {
    return fuxieButtonClass(
        'ghost',
        'lg',
        fx(
            'min-h-[48px]',
            disabled && 'border-slate-100 bg-slate-100 text-slate-300 ring-slate-100 hover:bg-slate-100',
            className
        )
    )
}

export function exerciseHintPanelClass(className = '') {
    return fx(
        'rounded-2xl border border-[#FFD166]/60 bg-[#FFF7D6] p-3 text-center text-sm font-semibold text-[#A66300]',
        className
    )
}

export function exerciseConstructionZoneClass({
    active = false,
    revealed = false,
    className = '',
}: {
    active?: boolean
    revealed?: boolean
    className?: string
}) {
    return fx(
        'min-h-[96px] rounded-2xl border-2 p-4 transition-all',
        revealed || active
            ? 'border-[#60A8E4] bg-[#EEF7FF] shadow-inner'
            : 'border-dashed border-[#CCE4F0] bg-white/70',
        className
    )
}

export function exerciseTokenClass({
    selected = false,
    revealed = false,
    className = '',
}: {
    selected?: boolean
    revealed?: boolean
    className?: string
}) {
    return fx(
        'rounded-xl px-4 py-2.5 text-sm font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#60A8E4]/35 disabled:cursor-not-allowed',
        selected
            ? revealed
                ? 'bg-[#CCE4F0] text-[#3C78A8]'
                : 'border-2 border-[#60A8E4] bg-white text-[#3C78A8] shadow-sm hover:bg-[#60A8E4] hover:text-white'
            : 'border-2 border-[#CCE4F0] bg-white text-slate-700 shadow-sm hover:-translate-y-0.5 hover:border-[#60A8E4] hover:bg-[#F3FBFF] hover:text-[#3C78A8] disabled:border-slate-100 disabled:bg-slate-100 disabled:text-slate-300 disabled:shadow-none',
        className
    )
}
