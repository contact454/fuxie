/**
 * Listening lesson not-found boundary — Req 11.1 (empty state).
 *
 * Vai chinh: Frontend Engineer
 *
 * Triggered by `notFound()` inside `[lessonId]/page.tsx` when the lesson
 * row does not exist. Emits a surface-level `empty` state via
 * `<StateShell>` with mascot=guard and a Primary_CTA back to the catalog.
 */

import { getTranslations } from 'next-intl/server'

import { StateShell } from '@/components/gamification/state-shell'

export default async function ListeningNotFound() {
    const t = await getTranslations('SurfaceStates')

    return (
        <div className="max-w-3xl mx-auto px-4 py-12">
            <StateShell
                surfaceId="listening"
                state="empty"
                title={t('listening.notFoundTitle')}
                message={t('listening.notFoundMessage')}
                primaryCta={{
                    label: t('listening.notFoundCtaLabel'),
                    href: '/listening',
                }}
            />
        </div>
    )
}
