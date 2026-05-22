'use client'

/**
 * Vocabulary practice error boundary — Req 11.1 / 11.5
 * (gamified-ui-asset-rollout task 16.2).
 *
 * Vai chinh: Frontend Engineer
 *
 * The `default` and `empty` flows are owned by `page.tsx`. This boundary
 * handles the `error` state with mascot=guard via
 * `SURFACE_MASCOT_CONFIG['vocabulary-practice']` fallback semantics:
 * the surface only declares `default` so the runtime resolves `error` to
 * `silent`, but `<StateShell>` layers a `guard` mascot through the parent
 * vocabulary surface config when the practice surface delegates here.
 *
 * To stay consistent with Req 12.2 (every state declares a role) we map
 * the boundary to `surfaceId="vocabulary"` — the parent collection surface
 * — which has an explicit `error: 'guard'` entry.
 */

import { useEffect } from 'react'
import { useTranslations } from 'next-intl'

import { StateShell } from '@/components/gamification/state-shell'

interface VocabularyPracticeErrorProps {
    error: Error & { digest?: string }
    reset: () => void
}

export default function VocabularyPracticeError({
    error,
    reset,
}: VocabularyPracticeErrorProps) {
    const t = useTranslations('SurfaceStates')

    useEffect(() => {
        // eslint-disable-next-line no-console
        console.error('[vocabulary-practice] segment error:', error)
    }, [error])

    return (
        <div className="max-w-2xl mx-auto px-4 py-8">
            <StateShell
                surfaceId="vocabulary"
                state="error"
                title={t('vocabularyPractice.errorTitle')}
                message={t('vocabularyPractice.errorMessage')}
                primaryCta={{
                    label: t('retryLabel'),
                    onClick: reset,
                }}
            />
        </div>
    )
}
