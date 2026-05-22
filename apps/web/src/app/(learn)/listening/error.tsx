'use client'

/**
 * Listening surface error boundary — Req 6.10 / 11.1 / 11.5
 * (gamified-ui-asset-rollout task 16.2).
 *
 * Vai chinh: Frontend Engineer
 *
 * Wraps both the catalog (`/listening`) and the player
 * (`/listening/[lessonId]`). Surfaces `<StateShell state="error">` with
 * mascot=guard, single Primary_CTA "Thử lại", secondary "Về Dashboard".
 */

import { useEffect } from 'react'
import { useTranslations } from 'next-intl'

import { StateShell } from '@/components/gamification/state-shell'

interface ListeningErrorProps {
    error: Error & { digest?: string }
    reset: () => void
}

export default function ListeningError({ error, reset }: ListeningErrorProps) {
    const t = useTranslations('SurfaceStates')

    useEffect(() => {
        // eslint-disable-next-line no-console
        console.error('[listening] segment error:', error)
    }, [error])

    return (
        <div className="max-w-5xl mx-auto px-4 py-8">
            <StateShell
                surfaceId="listening"
                state="error"
                title={t('listening.errorTitle')}
                message={t('listening.errorMessage')}
                primaryCta={{
                    label: t('retryLabel'),
                    onClick: reset,
                }}
            />
        </div>
    )
}
