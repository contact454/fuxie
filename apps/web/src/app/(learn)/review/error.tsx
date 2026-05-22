'use client'

/**
 * Segment-level error boundary for `/review`.
 *
 * Vai chinh: Frontend Engineer
 * Vai phoi hop: Gamification Designer (mascot=guard rules), Design System
 *               Designer (color tokens)
 *
 * Spec source-of-truth:
 *   - Task 14.1 (gamified-ui-asset-rollout)
 *   - design.md §I.7 (Review surface)
 *   - requirements.md Req 9.6, Req 11.5
 *
 * When the review server data fails to load (Prisma error or timeout),
 * Next.js renders this segment-level error boundary. We surface a single
 * Primary_CTA "Thử lại" using the shared `<StateShell>` so:
 *   - Mascot resolves to `guard` via `SURFACE_MASCOT_CONFIG.review.error`.
 *   - Primary_CTA is "Thử lại" — Req 9.6 explicitly forbids "Ôn ngay" in
 *     the error state.
 *   - No reward amber animation appears (StateShell forbids reward tokens
 *     in error state per Req 11.7 / 16.5).
 */

import { useEffect } from 'react'

import { StateShell } from '@/components/gamification/state-shell'

interface ReviewErrorProps {
    error: Error & { digest?: string }
    reset: () => void
}

export default function ReviewError({ error, reset }: ReviewErrorProps) {
    useEffect(() => {
        console.error('[review] segment error:', error)
    }, [error])

    return (
        <div className="max-w-5xl mx-auto px-4 py-8">
            <StateShell
                surfaceId="review"
                state="error"
                title="Không tải được Ôn tập"
                message="Đã có lỗi khi tải dữ liệu ôn tập. Bạn thử lại nhé, dữ liệu trí nhớ vẫn được giữ nguyên trên máy chủ."
                primaryCta={{
                    label: 'Thử lại',
                    onClick: reset,
                }}
            />
        </div>
    )
}
