/**
 * Reading exercise not-found boundary — Req 11.1 (empty state).
 *
 * Vai chinh: Frontend Engineer
 *
 * Triggered by `notFound()` inside `[exerciseId]/page.tsx` when the exercise
 * row does not exist. We treat this as a surface-level `empty` state since
 * the learner reached a player route with no resource to render — guard
 * mascot + single Primary_CTA back to the catalog (Req 11.3 / Property 8).
 */

import { getTranslations } from 'next-intl/server'

import { StateShell } from '@/components/gamification/state-shell'

export default async function ReadingNotFound() {
    const t = await getTranslations('SurfaceStates')

    return (
        <div className="max-w-3xl mx-auto px-4 py-12">
            <StateShell
                surfaceId="reading"
                state="empty"
                title={t('reading.notFoundTitle')}
                message={t('reading.notFoundMessage')}
                primaryCta={{
                    label: t('reading.notFoundCtaLabel'),
                    href: '/reading',
                }}
            />
        </div>
    )
}
