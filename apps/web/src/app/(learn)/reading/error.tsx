'use client'

/**
 * Reading surface error boundary — Req 6.10 / 11.1 / 11.5
 * (gamified-ui-asset-rollout task 16.2).
 *
 * Vai chinh: Frontend Engineer
 * Vai phoi hop: Gamification Designer
 *
 * Wraps both the catalog (`/reading`) and the player (`/reading/[exerciseId]`)
 * subtree. When upstream queries fail, surface the error state with
 * mascot=guard via `SURFACE_MASCOT_CONFIG.reading.error`, single
 * Primary_CTA "Thử lại", secondary "Về Dashboard" (Req 11.5).
 */

import { useEffect } from 'react'
import { useTranslations } from 'next-intl'

import { StateShell } from '@/components/gamification/state-shell'

interface ReadingErrorProps {
    error: Error & { digest?: string }
    reset: () => void
}

export default function ReadingError({ error, reset }: ReadingErrorProps) {
    const t = useTranslations('SurfaceStates')

    useEffect(() => {
        // eslint-disable-next-line no-console
        console.error('[reading] segment error:', error)
    }, [error])

    return (
        <div className="max-w-5xl mx-auto px-4 py-8">
            <StateShell
                surfaceId="reading"
                state="error"
                title={t('reading.errorTitle')}
                message={t('reading.errorMessage')}
                primaryCta={{
                    label: t('retryLabel'),
                    onClick: reset,
                }}
            />
        </div>
    )
}
