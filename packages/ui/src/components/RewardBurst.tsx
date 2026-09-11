import * as React from 'react'

export interface RewardBurstProps extends React.HTMLAttributes<HTMLDivElement> {
    active?: boolean
    children?: React.ReactNode
}

export function RewardBurst({ active = true, children, className = '', ...props }: RewardBurstProps) {
    const burstKeyframes = `
        @keyframes rewardSparkle1 {
            0% { transform: translate(0, 0) scale(0.5); opacity: 0; }
            50% { opacity: 1; }
            100% { transform: translate(-30px, -30px) scale(1); opacity: 0; }
        }
        @keyframes rewardSparkle2 {
            0% { transform: translate(0, 0) scale(0.5); opacity: 0; }
            50% { opacity: 1; }
            100% { transform: translate(30px, -25px) scale(1); opacity: 0; }
        }
        @keyframes rewardSparkle3 {
            0% { transform: translate(0, 0) scale(0.5); opacity: 0; }
            50% { opacity: 1; }
            100% { transform: translate(-20px, 35px) scale(1); opacity: 0; }
        }
        @keyframes rewardSparkle4 {
            0% { transform: translate(0, 0) scale(0.5); opacity: 0; }
            50% { opacity: 1; }
            100% { transform: translate(25px, 30px) scale(1); opacity: 0; }
        }
        @keyframes rewardSpin {
            from { transform: translate(-50%, -50%) rotate(0deg); }
            to { transform: translate(-50%, -50%) rotate(360deg); }
        }
        @media (prefers-reduced-motion: reduce) {
            .reward-particle {
                animation: none !important;
                transform: none !important;
                opacity: 0.8 !important;
            }
            .reward-sunburst {
                animation: none !important;
                transform: translate(-50%, -50%) rotate(15deg) !important;
            }
        }
    `

    return (
        <div
            data-reward-state="earned"
            className={`relative inline-flex items-center justify-center ${className}`.trim()}
            {...props}
        >
            <style dangerouslySetInnerHTML={{ __html: burstKeyframes }} />

            {active && (
                <div
                    className="reward-sunburst absolute w-[360px] h-[360px] rounded-full pointer-events-none overflow-visible"
                    style={{
                        background: 'repeating-conic-gradient(from 0deg, var(--fuxie-reward) 0deg 15deg, transparent 15deg 45deg)',
                        opacity: 0.12,
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        animation: 'rewardSpin 30s linear infinite',
                        zIndex: 0,
                    }}
                />
            )}

            <div className="relative z-10">
                {children}
            </div>

            {active && (
                <div className="absolute inset-0 pointer-events-none overflow-visible z-20">
                    {/* Hạt lấp lánh màu amber --fuxie-reward */}
                    <span
                        className="reward-particle absolute w-2 h-2 rounded-full"
                        style={{
                            backgroundColor: 'var(--fuxie-reward)',
                            left: '50%',
                            top: '50%',
                            animation: 'rewardSparkle1 var(--fuxie-dur-reward) cubic-bezier(.2,.8,.2,1.2) infinite',
                        }}
                    />
                    <span
                        className="reward-particle absolute w-3 h-3 rounded-full"
                        style={{
                            backgroundColor: 'var(--fuxie-reward)',
                            left: '50%',
                            top: '50%',
                            animation: 'rewardSparkle2 var(--fuxie-dur-reward) cubic-bezier(.2,.8,.2,1.2) infinite',
                            animationDelay: '100ms',
                        }}
                    />
                    <span
                        className="reward-particle absolute w-2.5 h-2.5 rounded-full"
                        style={{
                            backgroundColor: 'var(--fuxie-reward)',
                            left: '50%',
                            top: '50%',
                            animation: 'rewardSparkle3 var(--fuxie-dur-reward) cubic-bezier(.2,.8,.2,1.2) infinite',
                            animationDelay: '200ms',
                        }}
                    />
                    <span
                        className="reward-particle absolute w-2 h-2 rounded-full"
                        style={{
                            backgroundColor: 'var(--fuxie-reward)',
                            left: '50%',
                            top: '50%',
                            animation: 'rewardSparkle4 var(--fuxie-dur-reward) cubic-bezier(.2,.8,.2,1.2) infinite',
                            animationDelay: '150ms',
                        }}
                    />
                </div>
            )}
        </div>
    )
}
