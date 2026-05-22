'use client'

import Image from 'next/image'
import { getFuxieMascotSrc, type FuxieMascotKey } from '@/lib/mascot/fuxie-assets'

export type MascotPose = FuxieMascotKey

const SIZE_MAP = {
    xs: 48,
    sm: 80,
    md: 128,
    lg: 200,
    xl: 300,
} as const

export type MascotSize = keyof typeof SIZE_MAP

interface MascotImageProps {
    pose: MascotPose
    size?: MascotSize
    width?: number
    height?: number
    alt?: string
    className?: string
    message?: string
    messageClassName?: string
}

export function MascotImage({
    pose,
    size = 'md',
    width,
    height,
    alt,
    className = '',
    message,
    messageClassName = '',
}: MascotImageProps) {
    const resolvedWidth = width ?? SIZE_MAP[size]
    const resolvedHeight = height ?? SIZE_MAP[size]
    const src = getFuxieMascotSrc(pose)
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

export function MascotEmptyState({
    message = 'Chua co gi o day ca!',
    actionLabel,
    onAction,
    className = '',
}: {
    message?: string
    actionLabel?: string
    onAction?: () => void
    className?: string
}) {
    return (
        <div className={`mascot-empty-state ${className}`}>
            <MascotImage pose="empty" size="lg" message={message} />
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

export function MascotErrorState({
    message = 'Co loi xay ra roi!',
    onRetry,
    className = '',
}: {
    message?: string
    onRetry?: () => void
    className?: string
}) {
    return (
        <div className={`mascot-error-state ${className}`}>
            <MascotImage pose="error" size="lg" message={message} />
            {onRetry && (
                <button
                    type="button"
                    onClick={onRetry}
                    className="mascot-error-retry"
                >
                    Thu lai
                </button>
            )}
        </div>
    )
}

export function MascotLoadingState({
    message = 'Fuxie dang tai...',
    className = '',
}: {
    message?: string
    className?: string
}) {
    return (
        <div className={`mascot-loading-state ${className}`}>
            <MascotImage
                pose="loading"
                size="lg"
                message={message}
                className="mascot-loading-bounce"
            />
        </div>
    )
}
