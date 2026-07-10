import * as React from 'react'

export interface OptionTileProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    text: string
    status?: 'idle' | 'selected' | 'correct' | 'incorrect'
}

export function OptionTile({ text, status = 'idle', className = '', ...props }: OptionTileProps) {
    const isIdle = status === 'idle'
    const isSelected = status === 'selected'
    const isCorrect = status === 'correct'
    const isIncorrect = status === 'incorrect'

    const baseStyles = 'inline-flex items-center w-full px-[var(--fuxie-space-4)] h-[56px] rounded-[var(--fuxie-radius-lg)] border-2 font-extrabold text-left transition-all duration-75 outline-none disabled:cursor-not-allowed select-none touch-action-manipulation text-[16px]'

    let stateStyles = ''
    if (isIdle) {
        stateStyles = 'bg-white border-[#e5e5e5] text-[#4b4b4b] hover:bg-[#f7f7f7] shadow-[0_4px_0_0_#ccc] active:translate-y-[2px] active:shadow-[0_2px_0_0_#ccc]'
    } else if (isSelected) {
        stateStyles = 'bg-[#ddf4ff] border-[#84d8ff] text-[#1899d6] shadow-[0_4px_0_0_#1899d6] active:translate-y-[2px] active:shadow-[0_2px_0_0_#1899d6]'
    } else if (isCorrect) {
        stateStyles = 'bg-[#d7ffb8] border-[#a5e27a] text-[#58a700] shadow-[0_4px_0_0_#58a700]'
    } else if (isIncorrect) {
        stateStyles = 'bg-[#ffdfe0] border-[#ffb5b5] text-[#ea2b2b] shadow-[0_4px_0_0_#ea2b2b]'
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
                type="button"
                className={`option-tile-btn ${baseStyles} ${stateStyles} ${className}`.trim()}
                style={shakeStyle}
                {...props}
            >
                {text}
            </button>
        </>
    )
}
