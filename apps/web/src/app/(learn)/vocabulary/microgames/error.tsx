'use client'

/**
 * Vocabulary microgames error boundary — Req 11.1 / 11.5
 * (gamified-ui-asset-rollout task 16.2).
 *
 * Vai chinh: Frontend Engineer
 *
 * Default + empty flows are owned by `page.tsx`. The error path uses the
 * parent `vocabulary` surface config for the `error: 'guard'` mapping
 * (microgames surface only declares `default` + `success`).
 */

import { useEffect } from 'react'
import { useTranslations } from 'next-intl'

import { StateShell } from '@/components/gamification/state-shell'

interface VocabularyMicrogamesErrorProps {
    error: Error & { digest?: string }
    reset: () => void
}

export default function VocabularyMicrogamesError({
    error,
    reset,
}: VocabularyMicrogamesErrorProps) {
    const t = useTranslations('SurfaceStates')

    useEffect(() => {
        // eslint-disable-next-line no-console
        console.error('[vocabulary-microgames] segment error:', error)
    }, [error])

    return (
        <div className="max-w-2xl mx-auto px-4 py-8">
            <StateShell
                surfaceId="vocabulary"
                state="error"
                title={t('vocabularyMicrogames.errorTitle')}
                message={t('vocabularyMicrogames.errorMessage')}
                primaryCta={{
                    label: t('retryLabel'),
                    onClick: reset,
                }}
            />
        </div>
    )
}
