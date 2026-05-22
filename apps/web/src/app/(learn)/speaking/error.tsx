'use client'

/**
 * Speaking surface error boundary — Req 11.1 / 11.5
 * (gamified-ui-asset-rollout task 16.2).
 *
 * Vai chinh: Frontend Engineer
 *
 * Wraps both the catalog (`/speaking`) and the player
 * (`/speaking/[lessonId]` + `roleplay`). Surfaces `<StateShell state="error">`
 * with mascot=guard via `SURFACE_MASCOT_CONFIG.speaking.error`.
 */

import { useEffect } from 'react'
import { useTranslations } from 'next-intl'

import { StateShell } from '@/components/gamification/state-shell'

interface SpeakingErrorProps {
    error: Error & { digest?: string }
    reset: () => void
}

export default function SpeakingError({ error, reset }: SpeakingErrorProps) {
    const t = useTranslations('SurfaceStates')

    useEffect(() => {
        // eslint-disable-next-line no-console
        console.error('[speaking] segment error:', error)
    }, [error])

    return (
        <div className="max-w-5xl mx-auto px-4 py-8">
            <StateShell
                surfaceId="speaking"
                state="error"
                title={t('speaking.errorTitle')}
                message={t('speaking.errorMessage')}
                primaryCta={{
                    label: t('retryLabel'),
                    onClick: reset,
                }}
            />
        </div>
    )
}
