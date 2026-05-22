'use client'

/**
 * Writing surface error boundary — Req 11.1 / 11.5
 * (gamified-ui-asset-rollout task 16.2).
 *
 * Vai chinh: Frontend Engineer
 *
 * Wraps both the catalog (`/writing`) and the player
 * (`/writing/[exerciseId]`). Surfaces `<StateShell state="error">` with
 * mascot=guard via `SURFACE_MASCOT_CONFIG.writing.error`.
 */

import { useEffect } from 'react'
import { useTranslations } from 'next-intl'

import { StateShell } from '@/components/gamification/state-shell'

interface WritingErrorProps {
    error: Error & { digest?: string }
    reset: () => void
}

export default function WritingError({ error, reset }: WritingErrorProps) {
    const t = useTranslations('SurfaceStates')

    useEffect(() => {
        // eslint-disable-next-line no-console
        console.error('[writing] segment error:', error)
    }, [error])

    return (
        <div className="max-w-5xl mx-auto px-4 py-8">
            <StateShell
                surfaceId="writing"
                state="error"
                title={t('writing.errorTitle')}
                message={t('writing.errorMessage')}
                primaryCta={{
                    label: t('retryLabel'),
                    onClick: reset,
                }}
            />
        </div>
    )
}
