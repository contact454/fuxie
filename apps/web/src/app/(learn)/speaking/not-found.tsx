/**
 * Speaking lesson not-found boundary — Req 11.1 (empty state).
 *
 * Vai chinh: Frontend Engineer
 *
 * Triggered by `notFound()` inside `[lessonId]/page.tsx` when the lesson
 * is missing. Emits a surface-level `empty` state via `<StateShell>` so
 * the learner sees mascot=guard + Primary_CTA back to the speaking
 * catalog (Req 11.3, Property 8).
 */

import { getTranslations } from 'next-intl/server'

import { StateShell } from '@/components/gamification/state-shell'

export default async function SpeakingNotFound() {
    const t = await getTranslations('SurfaceStates')

    return (
        <div className="max-w-3xl mx-auto px-4 py-12">
            <StateShell
                surfaceId="speaking"
                state="empty"
                title={t('speaking.notFoundTitle')}
                message={t('speaking.notFoundMessage')}
                primaryCta={{
                    label: t('speaking.notFoundCtaLabel'),
                    href: '/speaking',
                }}
            />
        </div>
    )
}
