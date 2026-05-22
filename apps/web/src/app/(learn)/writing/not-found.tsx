/**
 * Writing exercise not-found boundary — Req 11.1 (empty state).
 *
 * Vai chinh: Frontend Engineer
 *
 * Triggered by `notFound()` inside `[exerciseId]/page.tsx` when the
 * exercise is missing. Emits an `empty` state via `<StateShell>` so the
 * learner gets mascot=guard + Primary_CTA back to the writing catalog.
 */

import { getTranslations } from 'next-intl/server'

import { StateShell } from '@/components/gamification/state-shell'

export default async function WritingNotFound() {
    const t = await getTranslations('SurfaceStates')

    return (
        <div className="max-w-3xl mx-auto px-4 py-12">
            <StateShell
                surfaceId="writing"
                state="empty"
                title={t('writing.notFoundTitle')}
                message={t('writing.notFoundMessage')}
                primaryCta={{
                    label: t('writing.notFoundCtaLabel'),
                    href: '/writing',
                }}
            />
        </div>
    )
}
