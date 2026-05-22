'use client'

/**
 * Course path error boundary — Req 11.1, 11.5 (gamified-ui-asset-rollout
 * task 16.2).
 *
 * Vai chinh: Frontend Engineer
 * Vai phoi hop: Gamification Designer (mascot=guard rules), Design System
 *               Designer (layout tokens)
 *
 * Course is a P0 surface that gates lessons by prerequisite (Req 4.1, 4.4),
 * so per Req 11.1/11.2 it must declare `default | empty | locked | error`.
 * The `default` and `empty/locked` flows are owned by `page.tsx`; this
 * boundary handles the `error` flow when course data fails to load:
 *   - Mascot resolves to `guard` via `SURFACE_MASCOT_CONFIG.course.error`.
 *   - Single Primary_CTA "Thử lại" + secondary "Về Dashboard" (Req 11.5).
 *   - No reward amber animation (Req 11.7 / 16.5 — enforced by StateShell).
 */

import { useEffect } from 'react'
import { useTranslations } from 'next-intl'

import { StateShell } from '@/components/gamification/state-shell'

interface CourseErrorProps {
    error: Error & { digest?: string }
    reset: () => void
}

export default function CourseError({ error, reset }: CourseErrorProps) {
    const t = useTranslations('SurfaceStates')

    useEffect(() => {
        // eslint-disable-next-line no-console
        console.error('[course] segment error:', error)
    }, [error])

    return (
        <div className="max-w-5xl mx-auto px-4 py-8">
            <StateShell
                surfaceId="course"
                state="error"
                title={t('course.errorTitle')}
                message={t('course.errorMessage')}
                primaryCta={{
                    label: t('retryLabel'),
                    onClick: reset,
                }}
            />
        </div>
    )
}
