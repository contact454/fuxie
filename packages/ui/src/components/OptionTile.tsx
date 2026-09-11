import * as React from 'react'

export interface OptionTileProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    text: string
    status?: 'idle' | 'selected' | 'correct' | 'incorrect'
}

export function OptionTile({
    text,
    status = 'idle',
    className = '',
    disabled = false,
    type = 'button',
    ...props
}: OptionTileProps) {
    const isIdle = status === 'idle'
    const isSelected = status === 'selected'
    const isCorrect = status === 'correct'
    const isIncorrect = status === 'incorrect'

    const baseStyles = [
        'option-tile-btn inline-flex items-center w-full',
        'px-[var(--fuxie-space-4)] h-[56px] min-h-[var(--fuxie-tap-min)]',
        'rounded-[var(--fuxie-radius-lg)] border-2 font-extrabold text-left text-[16px]',
        'outline-none select-none touch-action-manipulation',
        // Limited transitions — no transition-all
        'transition-[transform,background-color,border-color,box-shadow,opacity] duration-75',
        // Focus
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2',
        'focus-visible:outline-[var(--fuxie-blue-700)]',
        'disabled:cursor-not-allowed disabled:pointer-events-none disabled:opacity-60',
        'motion-reduce:transition-none motion-reduce:active:translate-y-0',
    ].join(' ')

    // Grade/state contract colors preserved for Listening quiz semantics.
    let stateStyles = ''
    if (isIdle) {
        stateStyles = [
            'bg-white border-[#e5e5e5] text-[#4b4b4b] hover:bg-[#f7f7f7]',
            // Tactile lip 4px
            'shadow-[0_4px_0_0_#ccc]',
            'active:translate-y-[2px] active:shadow-[0_2px_0_0_#ccc]',
            'motion-reduce:active:shadow-[0_4px_0_0_#ccc]',
        ].join(' ')
    } else if (isSelected) {
        stateStyles = [
            'bg-[#ddf4ff] border-[#84d8ff] text-[#1899d6]',
            'shadow-[0_4px_0_0_#1899d6]',
            'active:translate-y-[2px] active:shadow-[0_2px_0_0_#1899d6]',
            'motion-reduce:active:shadow-[0_4px_0_0_#1899d6]',
        ].join(' ')
    } else if (isCorrect) {
        stateStyles =
            'bg-[#d7ffb8] border-[#a5e27a] text-[#58a700] shadow-[0_4px_0_0_#58a700]'
    } else if (isIncorrect) {
        stateStyles =
            'bg-[#ffdfe0] border-[#ffb5b5] text-[#ea2b2b] shadow-[0_4px_0_0_#ea2b2b]'
    }

    const shakeStyle = isIncorrect
        ? { animation: 'OptionTileShake 0.35s cubic-bezier(.36,.07,.19,.97) both' }
        : undefined

    const shakeKeyframes = `
        @keyframes OptionTileShake {
            10%, 90% { transform: translate3d(-1px, 0, 0); }
            20%, 80% { transform: translate3d(2px, 0, 0); }
            30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
            40%, 60% { transform: translate3d(4px, 0, 0); }
        }
        @media (prefers-reduced-motion: reduce) {
            .option-tile-btn {
                animation: none !important;
                transform: none !important;
            }
        }
    `

    return (
        <>
            <style dangerouslySetInnerHTML={{ __html: shakeKeyframes }} />
            <button
                type={type}
                disabled={disabled}
                aria-disabled={disabled || undefined}
                className={`option-tile-btn ${baseStyles} ${stateStyles} ${className}`.trim()}
                style={shakeStyle}
                data-status={status}
                {...props}
            >
                {text}
            </button>
        </>
    )
}
