'use client'

import Image from 'next/image'

/**
 * All available Fuxie mascot poses organized by category.
 * Phase 1 (P0) — Core emotions + App states.
 * Phase 2 (P1) — Learning activities + German skills.
 * Phase 3 (P2) — Gamification.
 * Phase 4 (P3) — Hero images + Stickers.
 */
const MASCOT_POSES = {
    // Core emotions (P0)
    'core-happy-wave': '/mascot/core/fuxie-core-happy-wave.png',
    'core-sad-tears': '/mascot/core/fuxie-core-sad-tears.png',
    'core-thinking': '/mascot/core/fuxie-core-thinking.png',
    'core-surprised': '/mascot/core/fuxie-core-surprised.png',
    'core-celebrate': '/mascot/core/fuxie-core-celebrate.png',

    // Learning feedback (P0 + P1)
    'learn-correct': '/mascot/learn/fuxie-learn-correct.png',
    'learn-wrong': '/mascot/learn/fuxie-learn-wrong.png',
    'learn-studying': '/mascot/learn/fuxie-learn-studying.png',
    'learn-graduation': '/mascot/learn/fuxie-learn-graduation.png',
    'learn-lightbulb': '/mascot/learn/fuxie-learn-lightbulb.png',
    'learn-encouragement': '/mascot/learn/fuxie-learn-encouragement.png',

    // German skills (P1)
    'skill-hoeren': '/mascot/skill/fuxie-skill-hoeren.png',
    'skill-lesen': '/mascot/skill/fuxie-skill-lesen.png',
    'skill-schreiben': '/mascot/skill/fuxie-skill-schreiben.png',
    'skill-sprechen': '/mascot/skill/fuxie-skill-sprechen.png',
    'skill-grammatik': '/mascot/skill/fuxie-skill-grammatik.png',
    'skill-wortschatz': '/mascot/skill/fuxie-skill-wortschatz.png',

    // App states (P0)
    'state-empty': '/mascot/state/fuxie-state-empty.png',
    'state-error': '/mascot/state/fuxie-state-error.png',
    'state-loading': '/mascot/state/fuxie-state-loading.png',
    'state-welcome': '/mascot/state/fuxie-state-welcome.png',

    // Gamification (P0 + P2)
    'game-streak-sick': '/mascot/game/fuxie-game-streak-sick.png',
    'game-streak-fire': '/mascot/game/fuxie-game-streak-fire.png',
    'game-levelup': '/mascot/game/fuxie-game-levelup.png',
    'game-achievement': '/mascot/game/fuxie-game-achievement.png',
    'game-xp-earned': '/mascot/game/fuxie-game-xp-earned.png',
    'game-daily-goal': '/mascot/game/fuxie-game-daily-goal.png',
    'game-perfect-score': '/mascot/game/fuxie-game-perfect-score.png',
    'game-rankup': '/mascot/game/fuxie-game-rankup.png',

    // Hero — full body (P3)
    'hero-landing': '/mascot/hero/fuxie-hero-landing.png',
    'hero-onboarding': '/mascot/hero/fuxie-hero-onboarding.png',

    // Stickers (P3)
    'sticker-love': '/mascot/sticker/fuxie-sticker-love.png',
    'sticker-sleepy': '/mascot/sticker/fuxie-sticker-sleepy.png',
    'sticker-angry': '/mascot/sticker/fuxie-sticker-angry.png',
    'sticker-cool': '/mascot/sticker/fuxie-sticker-cool.png',
} as const

export type MascotPose = keyof typeof MASCOT_POSES

const SIZE_MAP = {
    xs: 48,
    sm: 80,
    md: 128,
    lg: 200,
    xl: 300,
} as const

export type MascotSize = keyof typeof SIZE_MAP

interface MascotImageProps {
    /** Which pose/expression to display */
    pose: MascotPose
    /** Predefined size: xs(48), sm(80), md(128), lg(200), xl(300) */
    size?: MascotSize
    /** Custom width — overrides size preset */
    width?: number
    /** Custom height — overrides size preset */
    height?: number
    /** Alt text override (defaults to pose name) */
    alt?: string
    /** Additional CSS class */
    className?: string
    /** Optional message to display below the mascot */
    message?: string
    /** CSS class for the message text */
    messageClassName?: string
}

/**
 * Reusable Fuxie mascot component with type-safe pose selection.
 *
 * @example
 * // Basic usage
 * <MascotImage pose="core-happy-wave" size="md" />
 *
 * // With message (for empty states, errors, etc.)
 * <MascotImage
 *   pose="state-empty"
 *   size="lg"
 *   message="Chưa có từ vựng nào. Bắt đầu học thôi!"
 * />
 *
 * // Custom size
 * <MascotImage pose="learn-correct" width={96} height={96} />
 */
export function MascotImage({
    pose,
    size = 'md',
    width,
    height,
    alt,
    className = '',
    message,
    messageClassName = '',
}: MascotImageProps): React.ReactElement {
    const resolvedWidth = width ?? SIZE_MAP[size]
    const resolvedHeight = height ?? SIZE_MAP[size]
    const src = MASCOT_POSES[pose]
    const resolvedAlt = alt ?? `Fuxie ${pose.replace(/-/g, ' ')}`

    return (
        <div className={`mascot-container ${className}`}>
            <Image
                src={src}
                width={resolvedWidth}
                height={resolvedHeight}
                alt={resolvedAlt}
                className="mascot-image"
                priority={false}
            />
            {message && (
                <p className={`mascot-message ${messageClassName}`}>{message}</p>
            )}
        </div>
    )
}

/**
 * Convenience wrapper for empty state displays.
 * Centers the mascot with a friendly message.
 */
export function MascotEmptyState({
    message = 'Chưa có gì ở đây cả!',
    actionLabel,
    onAction,
    className = '',
}: {
    message?: string
    actionLabel?: string
    onAction?: () => void
    className?: string
}): React.ReactElement {
    return (
        <div className={`mascot-empty-state ${className}`}>
            <MascotImage
                pose="state-empty"
                size="lg"
                message={message}
            />
            {actionLabel && onAction && (
                <button
                    type="button"
                    onClick={onAction}
                    className="mascot-empty-action"
                >
                    {actionLabel}
                </button>
            )}
        </div>
    )
}

/**
 * Convenience wrapper for error state displays.
 */
export function MascotErrorState({
    message = 'Ôi, có lỗi xảy ra rồi! 🦊',
    onRetry,
    className = '',
}: {
    message?: string
    onRetry?: () => void
    className?: string
}): React.ReactElement {
    return (
        <div className={`mascot-error-state ${className}`}>
            <MascotImage
                pose="state-error"
                size="lg"
                message={message}
            />
            {onRetry && (
                <button
                    type="button"
                    onClick={onRetry}
                    className="mascot-error-retry"
                >
                    Thử lại
                </button>
            )}
        </div>
    )
}

/**
 * Loading state with animated mascot.
 */
export function MascotLoadingState({
    message = 'Fuxie đang chạy tới...',
    className = '',
}: {
    message?: string
    className?: string
}): React.ReactElement {
    return (
        <div className={`mascot-loading-state ${className}`}>
            <MascotImage
                pose="state-loading"
                size="lg"
                message={message}
                className="mascot-loading-bounce"
            />
        </div>
    )
}
