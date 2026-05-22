'use client'

/**
 * Rewards (Shop / Inventory) error boundary — Req 8.10 / 11.1 / 11.5
 * (gamified-ui-asset-rollout task 16.2).
 *
 * Vai chinh: Frontend Engineer
 *
 * The Shop client (`ShopBackboneClient`) handles its own in-flight error
 * state for catalog refresh failures, but a server-side render failure
 * (e.g. Prisma timeout in `page.tsx`) needs a Next.js error boundary.
 * This boundary surfaces `<StateShell state="error">` with mascot=guard
 * via `SURFACE_MASCOT_CONFIG['rewards-shop'].error`.
 */

import { useEffect } from 'react'
import { useTranslations } from 'next-intl'

import { StateShell } from '@/components/gamification/state-shell'

interface RewardsErrorProps {
    error: Error & { digest?: string }
    reset: () => void
}

export default function RewardsError({ error, reset }: RewardsErrorProps) {
    const t = useTranslations('SurfaceStates')

    useEffect(() => {
        // eslint-disable-next-line no-console
        console.error('[rewards] segment error:', error)
    }, [error])

    return (
        <div className="max-w-3xl mx-auto px-4 py-8">
            <StateShell
                surfaceId="rewards-shop"
                state="error"
                title={t('rewardsShop.errorTitle')}
                message={t('rewardsShop.errorMessage')}
                primaryCta={{
                    label: t('retryLabel'),
                    onClick: reset,
                }}
            />
        </div>
    )
}
