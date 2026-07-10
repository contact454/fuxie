import * as React from 'react'

export type WorldNodeState = 'locked' | 'open' | 'mastered'

export interface WorldNodeProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    state: WorldNodeState
    title: string
    nodeNumber: number
    isPrimaryCta?: boolean
}

export function WorldNode({ state, title, nodeNumber, isPrimaryCta = false, className = '', disabled, ...props }: WorldNodeProps) {
    const isLocked = state === 'locked'
    const isOpen = state === 'open'
    const isMastered = state === 'mastered'

    const nodeDisabled = disabled || isLocked

    const dataAttrs = {
        'data-node-state': state,
        ...(isOpen && isPrimaryCta && !nodeDisabled ? { 'data-role': 'primary-cta' } : {})
    }

    const baseStyles = 'relative inline-flex items-center justify-center font-bold text-center rounded-[var(--fuxie-radius-pill)] min-w-[var(--fuxie-tap-min)] min-h-[var(--fuxie-tap-min)] w-11 h-11 transition-all duration-[var(--fuxie-dur-tap)] ease-[var(--fuxie-ease-tactile)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--fuxie-blue-700)] focus-visible:ring-offset-2 active:shadow-[var(--fuxie-shadow-press)] active:scale-95 disabled:cursor-not-allowed touch-action-manipulation shadow-[var(--fuxie-shadow-card)] border-2 border-white'

    let stateStyles = ''
    if (isLocked) {
        stateStyles = 'bg-[var(--fuxie-blue-200)] text-[var(--fuxie-blue-600)] opacity-60'
    } else if (isOpen) {
        stateStyles = 'bg-[var(--fuxie-action)] hover:bg-[var(--fuxie-action-hover)] hover:-translate-y-0.5 text-white'
    } else if (isMastered) {
        stateStyles = 'bg-[var(--fuxie-success)] hover:opacity-95 text-white'
    }

    const nodeAnimations = `
        @keyframes masteredPop {
            0% { transform: scale(0.9); }
            50% { transform: scale(1.05); }
            100% { transform: scale(1); }
        }
        @keyframes crownFloat {
            0% { transform: translate(-50%, 0px) scale(0.8); opacity: 0; }
            50% { transform: translate(-50%, -8px) scale(1.1); }
            100% { transform: translate(-50%, -4px) scale(1); opacity: 1; }
        }
        .mastered-node {
            animation: masteredPop 0.4s var(--fuxie-ease-tactile);
            box-shadow: 0 0 15px rgba(46, 196, 182, 0.6) !important;
            border: 2px solid rgba(46, 196, 182, 0.4) !important;
        }
        .mastered-crown {
            animation: crownFloat 0.5s var(--fuxie-ease-tactile) forwards;
        }
        @media (prefers-reduced-motion: reduce) {
            .mastered-node, .mastered-crown {
                animation: none !important;
                transition: none !important;
            }
        }
    `

    return (
        <>
            <style dangerouslySetInnerHTML={{ __html: nodeAnimations }} />
            <button
                type="button"
                disabled={nodeDisabled}
                aria-disabled={nodeDisabled || undefined}
                aria-label={`${title} (bài ${nodeNumber}, trạng thái ${state})`}
                className={`${baseStyles} ${stateStyles} ${isMastered ? 'mastered-node' : ''} ${className}`.trim()}
                {...dataAttrs}
                {...props}
            >
                <span className="text-[var(--fuxie-text-body)] font-black">{nodeNumber}</span>
                {isLocked && (
                    <span className="absolute -top-1 -right-1 bg-[var(--fuxie-blue-900)] text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center">
                        🔒
                    </span>
                )}
                {isMastered && (
                    <span
                        data-reward-context="true"
                        className="absolute -top-3 left-1/2 -translate-x-1/2 flex items-center justify-center mastered-crown duration-[var(--fuxie-dur-reward)]"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="var(--fuxie-reward)"
                            className="w-5 h-5 drop-shadow-[0_2px_4px_rgba(23,59,86,0.3)]"
                        >
                            <path d="M11.645 20.91l-9-9c-.77-.77-.77-2.03 0-2.8l9-9c.77-.77 2.03-.77 2.8 0l9 9c.78.78.78 2.04 0 2.8l-9 9c-.78.78-2.04.78-2.8 0z" fill="none"/>
                            <path d="M2 9.137C2 14 6.093 16.448 9.59 21c.54.7.75.98.98.98.24 0 .45-.28.99-.98C15.064 16.448 19.157 14 19.157 9.137c0-2.837-2.3-5.137-5.137-5.137-1.884 0-3.51 1.018-4.43 2.54-.92-1.522-2.546-2.54-4.43-2.54C2.3 4 2 6.3 2 9.137z" className="hidden"/>
                            {/* Biểu tượng vương miện */}
                            <path d="M5 16h14a1 1 0 001-.89l1.25-10a.5.5 0 00-.8-.46l-4.05 3.24L12.7 4.3a.5.5 0 00-.73 0L9.36 7.9L5.3 4.66a.5.5 0 00-.8.46L5.75 15.1A1 1 0 005 16z" />
                        </svg>
                    </span>
                )}
            </button>
        </>
    )
}
