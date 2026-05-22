'use client'

/**
 * Vocabulary collection error boundary — Req 11.1 / 11.5
 * (gamified-ui-asset-rollout task 16.2).
 *
 * Vai chinh: Frontend Engineer
 *
 * The `default` flow is owned by `page.tsx`; the empty case (no SRS cards)
 * is handled by the practice / microgames sub-routes via `<StateShell>`.
 * This boundary surfaces the `error` state with mascot=guard,
 * Primary_CTA "Thử lại", secondary "Về Dashboard" (Req 11.5).
 */

import { useEffect } from 'react'
import { useTranslations } from 'next-intl'

import { StateShell } from '@/components/gamification/state-shell'

interface VocabularyErrorProps {
    error: Error & { digest?: string }
    reset: () => void
}

export default function VocabularyError({ error, reset }: VocabularyErrorProps) {
    const t = useTranslations('SurfaceStates')

    useEffect(() => {
        // eslint-disable-next-line no-console
        console.error('[vocabulary] segment error:', error)
    }, [error])

    return (
        <div className="max-w-5xl mx-auto px-4 py-8">
            <StateShell
                surfaceId="vocabulary"
                state="error"
                title={t('vocabulary.errorTitle')}
                message={t('vocabulary.errorMessage')}
                primaryCta={{
                    label: t('retryLabel'),
                    onClick: reset,
                }}
            />
        </div>
    )
}
