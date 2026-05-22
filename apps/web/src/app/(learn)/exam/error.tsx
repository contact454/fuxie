'use client'

/**
 * Exam surface error boundary — Req 10 / 11.1 / 11.5
 * (gamified-ui-asset-rollout task 16.2).
 *
 * Vai chinh: Frontend Engineer
 *
 * Wraps both the catalog (`/exam`) and the session route
 * (`/exam/[examId]`). Surfaces `<StateShell state="error">` with
 * mascot=guard via `SURFACE_MASCOT_CONFIG.exam.error`.
 *
 * IMPORTANT: in-progress exam disconnect handling is NOT delegated here
 * (Req 10.6 — the player owns offline detection + local progress save).
 * This boundary only catches hard render failures during data fetch.
 */

import { useEffect } from 'react'
import { useTranslations } from 'next-intl'

import { StateShell } from '@/components/gamification/state-shell'

interface ExamErrorProps {
    error: Error & { digest?: string }
    reset: () => void
}

export default function ExamError({ error, reset }: ExamErrorProps) {
    const t = useTranslations('SurfaceStates')

    useEffect(() => {
        // eslint-disable-next-line no-console
        console.error('[exam] segment error:', error)
    }, [error])

    return (
        <div className="max-w-5xl mx-auto px-4 py-8">
            <StateShell
                surfaceId="exam"
                state="error"
                title={t('exam.errorTitle')}
                message={t('exam.errorMessage')}
                primaryCta={{
                    label: t('retryLabel'),
                    onClick: reset,
                }}
            />
        </div>
    )
}
