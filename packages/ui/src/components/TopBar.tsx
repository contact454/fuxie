import * as React from 'react'
import { StreakPill } from './StreakPill'

export interface TopBarProps extends React.HTMLAttributes<HTMLDivElement> {
    avatarUrl?: string
    username?: string
    streakCount: number
    coinCount?: number
    gemCount: number
    xpCount?: number
    onAvatarClick?: () => void
}

export function TopBar({
    avatarUrl,
    username = 'Learner',
    streakCount,
    gemCount: initialGemCount,
    coinCount: initialCoinCount,
    xpCount,
    onAvatarClick,
    className = '',
    style,
    ...props
}: TopBarProps) {
    // Compatibility fallback: if coinCount is not passed, treat gemCount as coin balance (legacy behavior) and set gemCount to 0.
    const coinCount = initialCoinCount !== undefined ? initialCoinCount : initialGemCount
    const gemCount = initialCoinCount !== undefined ? initialGemCount : 0

    return (
        <header
            className={`fuxie-header-base flex items-center justify-between ${className}`.trim()}
            style={{ ...style, paddingTop: 'env(safe-area-inset-top, 0px)' }}
            {...props}
        >
            <div className="flex items-center gap-[var(--fuxie-space-2)] min-w-0">
                <button
                    type="button"
                    onClick={onAvatarClick}
                    className="w-10 h-10 rounded-[var(--fuxie-radius-pill)] border border-[var(--fuxie-blue-200)] overflow-hidden shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-[var(--fuxie-blue-700)] touch-action-manipulation"
                    aria-label={`Hồ sơ cá nhân của ${username}`}
                >
                    {avatarUrl ? (
                        <img src={avatarUrl} alt={username} className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full bg-[var(--fuxie-blue-200)] flex items-center justify-center text-[var(--fuxie-blue-600)] font-black text-sm">
                            {username.charAt(0).toUpperCase()}
                        </div>
                    )}
                </button>
                <span className="hidden sm:inline text-[var(--fuxie-text-h2)] font-black text-[var(--fuxie-blue-900)] truncate">
                    {username}
                </span>
            </div>

            <div className="flex items-center gap-[var(--fuxie-space-2)]">
                <StreakPill count={streakCount} />

                {/* Coin count pill */}
                {coinCount !== undefined && (
                    <div className="inline-flex items-center gap-[var(--fuxie-space-1)] px-[var(--fuxie-space-3)] py-[var(--fuxie-space-1)] rounded-[var(--fuxie-radius-pill)] border border-[var(--fuxie-blue-200)] bg-[var(--fuxie-blue-50)] shadow-sm">
                        <img
                            src="/fig/ui-icons/icon-coin.png"
                            alt="Coin"
                            className="w-5 h-5 object-contain"
                        />
                        <span className="text-[var(--fuxie-text-caption)] font-black text-[var(--fuxie-blue-900)]">
                            {coinCount}
                        </span>
                    </div>
                )}

                {/* Gem count pill */}
                {gemCount !== undefined && (
                    <div className="inline-flex items-center gap-[var(--fuxie-space-1)] px-[var(--fuxie-space-3)] py-[var(--fuxie-space-1)] rounded-[var(--fuxie-radius-pill)] border border-[var(--fuxie-blue-200)] bg-[var(--fuxie-blue-50)] shadow-sm">
                        <img
                            src="/fig/ui-icons/icon-gem.png"
                            alt="Gem"
                            className="w-5 h-5 object-contain"
                        />
                        <span className="text-[var(--fuxie-text-caption)] font-black text-[var(--fuxie-blue-900)]">
                            {gemCount}
                        </span>
                    </div>
                )}

                {/* XP count pill */}
                {xpCount !== undefined && (
                    <div className="inline-flex items-center gap-[var(--fuxie-space-1)] px-[var(--fuxie-space-3)] py-[var(--fuxie-space-1)] rounded-[var(--fuxie-radius-pill)] border border-[var(--fuxie-blue-200)] bg-[var(--fuxie-blue-50)] shadow-sm">
                        <img
                            src="/fig/ui-icons/icon-xp-star.png"
                            alt="XP"
                            className="w-5 h-5 object-contain"
                        />
                        <span className="text-[var(--fuxie-text-caption)] font-black text-[var(--fuxie-blue-900)]">
                            {xpCount} XP
                        </span>
                    </div>
                )}
            </div>
        </header>
    )
}
