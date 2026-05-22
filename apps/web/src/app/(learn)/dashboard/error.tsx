'use client'

/**
 * Dashboard error boundary — Req 3.7 / 11.5
 *
 * Vai chinh: Frontend Engineer
 * Vai phoi hop: Gamification Designer (mascot=guard rules), Design System
 *               Designer (layout tokens)
 *
 * When the dashboard server data fails to load (request error or timeout),
 * Next.js renders this segment-level error boundary. We surface a single
 * Primary_CTA "Thử lại" using the shared `<StateShell>` so:
 *   - Mascot resolves to `guard` via `SURFACE_MASCOT_CONFIG.dashboard.error`.
 *   - The streak count already saved on the server stays untouched
 *     (Req 3.7 — this surface does not write streak state).
 *   - No reward amber animation appears (StateShell forbids reward tokens).
 */

import { useEffect } from 'react'
import { useTranslations } from 'next-intl'

import { StateShell } from '@/components/gamification/state-shell'

interface DashboardErrorProps {
    error: Error & { digest?: string }
    reset: () => void
}

export default function DashboardError({ error, reset }: DashboardErrorProps) {
    const t = useTranslations('Dashboard')

    useEffect(() => {
        // Surface the failure so Sentry / server logs catch it.
        // eslint-disable-next-line no-console
        console.error('[Dashboard] failed to render', error)
    }, [error])

    return (
        <div className="px-4 sm:px-6 lg:px-8 pt-4 pb-8">
            <StateShell
                surfaceId="dashboard"
                state="error"
                title={t('errorTitle')}
                message={t('errorMessage')}
                primaryCta={{
                    label: t('ctaRetry'),
                    onClick: reset,
                }}
            />
        </div>
    )
}
