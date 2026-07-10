import * as React from 'react'

export type AudioButtonState = 'idle' | 'playing' | 'recording'

export interface AudioButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    state: AudioButtonState
    ariaLabel: string
    size?: 'sm' | 'md' | 'lg'
}

export function AudioButton({ state, ariaLabel, size = 'md', className = '', ...props }: AudioButtonProps) {
    const isPlaying = state === 'playing'
    const isRecording = state === 'recording'

    const baseStyles = 'inline-flex items-center justify-center border-2 transition-all duration-[var(--fuxie-dur-tap)] ease-[var(--fuxie-ease-tactile)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--fuxie-blue-700)] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed touch-action-manipulation'

    const sizeStyles = {
        sm: 'w-9 h-9 min-w-[36px] min-h-[36px] rounded-xl shadow-sm',
        md: 'w-12 h-12 min-w-[var(--fuxie-tap-min)] min-h-[var(--fuxie-tap-min)] rounded-[var(--fuxie-radius-md)] shadow-[var(--fuxie-shadow-card)]',
        lg: 'w-16 h-16 min-w-[64px] min-h-[64px] rounded-[var(--fuxie-radius-lg)] shadow-[var(--fuxie-shadow-card)]',
    }[size]

    let stateStyles = 'border-[var(--fuxie-blue-200)] bg-white text-[var(--fuxie-blue-600)] hover:bg-[var(--fuxie-blue-50)]'
    if (isPlaying) {
        stateStyles = 'border-[var(--fuxie-action)] bg-[var(--fuxie-blue-50)] text-[var(--fuxie-action)] animate-pulse'
    } else if (isRecording) {
        stateStyles = 'border-red-500 bg-red-50 text-red-600 animate-pulse'
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
                type="button"
                aria-label={ariaLabel}
                aria-pressed={isPlaying || isRecording}
                className={`${baseStyles} ${sizeStyles} ${stateStyles} ${isPlaying || isRecording ? 'audio-pulse' : ''} ${className}`.trim()}
                {...props}
            >
                {isRecording ? (
                    /* Icon Mic đỏ hoặc Stop vuông */
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={iconSize}>
                        <path d="M12 2a3 3 0 00-3 3v7a3 3 0 006 0V5a3 3 0 00-3-3z" />
                        <path d="M19 10a1 1 0 00-2 0 5 5 0 01-10 0 1 1 0 00-2 0 7 7 0 006 6.92V21a1 1 0 102 0v-4.08A7 7 0 0019 10z" />
                    </svg>
                ) : isPlaying ? (
                    /* Icon Pause/Stop */
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={iconSize}>
                        <rect x="6" y="6" width="4" height="12" rx="1" />
                        <rect x="14" y="6" width="4" height="12" rx="1" />
                    </svg>
                ) : (
                    /* Icon Play */
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={iconSize}>
                        <path d="M8 5v14l11-7z" />
                    </svg>
                )}
            </button>
        </>
    )
}
