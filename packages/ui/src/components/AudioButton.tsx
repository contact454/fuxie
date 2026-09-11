import * as React from 'react'

export type AudioButtonState = 'idle' | 'playing' | 'recording'

export interface AudioButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    state: AudioButtonState
    ariaLabel: string
    size?: 'sm' | 'md' | 'lg'
}

export function AudioButton({
    state,
    ariaLabel,
    size = 'md',
    className = '',
    type = 'button',
    disabled = false,
    ...props
}: AudioButtonProps) {
    const isPlaying = state === 'playing'
    const isRecording = state === 'recording'

    const baseStyles = [
        'inline-flex items-center justify-center border-t-2 border-l-2 border-r-2 border-b-[4px]',
        'outline-none touch-action-manipulation select-none',
        // Limited transitions — no transition-all
        'transition-[transform,background-color,border-color,box-shadow,opacity] duration-[var(--fuxie-dur-tap)] ease-[var(--fuxie-ease-tactile)]',
        // Focus ring + offset
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2',
        'focus-visible:outline-[var(--fuxie-blue-700)]',
        'focus-visible:ring-2 focus-visible:ring-[var(--fuxie-blue-700)] focus-visible:ring-offset-2',
        // Pressed tactile
        'active:translate-y-[2px] active:border-b-[2px]',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
        'motion-reduce:transition-none motion-reduce:active:translate-y-0 motion-reduce:active:border-b-[4px]',
    ].join(' ')

    // Touch targets: sm ≥44, md ≥48, lg = 64 (Listening contract)
    const sizeStyles = {
        sm: 'w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl',
        md: 'w-12 h-12 min-w-[48px] min-h-[48px] rounded-[var(--fuxie-radius-md)]',
        lg: 'w-16 h-16 min-w-[64px] min-h-[64px] rounded-[var(--fuxie-radius-lg)]',
    }[size]

    let stateStyles =
        'border-[var(--fuxie-blue-200)] border-b-[var(--fuxie-lip-gray)] bg-white text-[var(--fuxie-blue-600)] hover:bg-[var(--fuxie-blue-50)]'
    if (isPlaying) {
        stateStyles =
            'border-[var(--fuxie-action)] border-b-[var(--fuxie-lip-action)] bg-[var(--fuxie-blue-50)] text-[var(--fuxie-action)]'
    } else if (isRecording) {
        stateStyles =
            'border-[var(--fuxie-lip-danger,#ea2b2b)] border-b-[var(--fuxie-lip-danger,#ea2b2b)] bg-red-50 text-red-600 border-red-500'
    }

    const animKeyframes = `
        @keyframes audioPulse {
            0%, 100% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.05); opacity: 0.95; }
        }
        .audio-pulse {
            animation: audioPulse 1.5s infinite ease-in-out;
        }
        @media (prefers-reduced-motion: reduce) {
            .audio-pulse {
                animation: none !important;
                transform: none !important;
            }
        }
    `

    const iconSize = size === 'lg' ? 'w-8 h-8' : 'w-5 h-5'

    return (
        <>
            <style dangerouslySetInnerHTML={{ __html: animKeyframes }} />
            <button
                type={type}
                disabled={disabled}
                aria-disabled={disabled || undefined}
                aria-label={ariaLabel}
                aria-pressed={isPlaying || isRecording}
                data-audio-state={state}
                className={`${baseStyles} ${sizeStyles} ${stateStyles} ${isPlaying || isRecording ? 'audio-pulse' : ''} ${className}`.trim()}
                {...props}
            >
                {isRecording ? (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={iconSize} aria-hidden="true">
                        <path d="M12 2a3 3 0 00-3 3v7a3 3 0 006 0V5a3 3 0 00-3-3z" />
                        <path d="M19 10a1 1 0 00-2 0 5 5 0 01-10 0 1 1 0 00-2 0 7 7 0 006 6.92V21a1 1 0 102 0v-4.08A7 7 0 0019 10z" />
                    </svg>
                ) : isPlaying ? (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={iconSize} aria-hidden="true">
                        <rect x="6" y="6" width="4" height="12" rx="1" />
                        <rect x="14" y="6" width="4" height="12" rx="1" />
                    </svg>
                ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={iconSize} aria-hidden="true">
                        <path d="M8 5v14l11-7z" />
                    </svg>
                )}
            </button>
        </>
    )
}
