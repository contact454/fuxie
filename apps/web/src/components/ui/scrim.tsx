'use client'

import type { ReactNode } from 'react'

/**
 * Scrim — accessibility primitive.
 *
 * Phủ một lớp nền bán trong suốt lên world-prop background khi contrast
 * giữa text/CTA và background không đạt ngưỡng AA (≥ 4.5:1 body, ≥ 3:1 large).
 * Children render ở trên overlay.
 *
 * Validates Requirements: 15.1, 15.3, 15.6
 *
 * - `intensity="soft"`  → rgba(255, 255, 255, 0.8) (light scrim)
 * - `intensity="strong"` → rgba(23, 59, 86, 0.85) (deep blue scrim, từ Bright Sky `--fuxie-blue-900`)
 *
 * Auto-apply nằm ở hook tích hợp surfaces (5.x). Component này không tự
 * detect contrast — caller quyết định dùng intensity nào.
 *
 * Owner: FE
 * Co-author: DSD (intensity tokens)
 */

export type ScrimIntensity = 'soft' | 'strong'

export interface ScrimProps {
    children?: ReactNode
    intensity?: ScrimIntensity
    className?: string
}

const SCRIM_BACKGROUND: Record<ScrimIntensity, string> = {
    soft: 'rgba(255, 255, 255, 0.8)',
    strong: 'rgba(23, 59, 86, 0.85)',
}

export function Scrim({ children, intensity = 'soft', className = '' }: ScrimProps) {
    return (
        <div
            data-scrim-intensity={intensity}
            className={`relative ${className}`}
        >
            <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0"
                style={{ backgroundColor: SCRIM_BACKGROUND[intensity] }}
            />
            <div className="relative">{children}</div>
        </div>
    )
}
