'use client'

/**
 * Speaking roleplay error boundary — Req 11.1 / 11.5
 * (gamified-ui-asset-rollout task 16.2).
 *
 * Vai chinh: Frontend Engineer
 *
 * Renders `<StateShell state="error">` for the
 * `/speaking/[lessonId]/roleplay` sub-route with mascot=guard via
 * `SURFACE_MASCOT_CONFIG['speaking-roleplay'].error`.
 */

import { useEffect } from 'react'
import { useTranslations } from 'next-intl'

import { StateShell } from '@/components/gamification/state-shell'

interface SpeakingRoleplayErrorProps {
    error: Error & { digest?: string }
    reset: () => void
}

export default function SpeakingRoleplayError({
    error,
    reset,
}: SpeakingRoleplayErrorProps) {
    const t = useTranslations('SurfaceStates')

    useEffect(() => {
        // eslint-disable-next-line no-console
        console.error('[speaking-roleplay] segment error:', error)
    }, [error])

    return (
        <div className="max-w-5xl mx-auto px-4 py-8">
            <StateShell
                surfaceId="speaking-roleplay"
                state="error"
                title={t('speakingRoleplay.errorTitle')}
                message={t('speakingRoleplay.errorMessage')}
                primaryCta={{
                    label: t('retryLabel'),
                    onClick: reset,
                }}
            />
        </div>
    )
}
