/**
 * Speaking roleplay not-found boundary — Req 11.1 (empty state).
 *
 * Vai chinh: Frontend Engineer
 *
 * Triggered by `notFound()` inside the roleplay route when the parent
 * lesson is missing. We can't use `surfaceId="speaking-roleplay"` here
 * because that surface config does not declare `empty`; instead we
 * delegate the empty UI to the parent `speaking` surface (which has
 * `empty: 'guard'`) so the role resolution stays valid (Req 12.2).
 */

import { getTranslations } from 'next-intl/server'

import { StateShell } from '@/components/gamification/state-shell'

export default async function SpeakingRoleplayNotFound() {
    const t = await getTranslations('SurfaceStates')

    return (
        <div className="max-w-3xl mx-auto px-4 py-12">
            <StateShell
                surfaceId="speaking"
                state="empty"
                title={t('speakingRoleplay.notFoundTitle')}
                message={t('speakingRoleplay.notFoundMessage')}
                primaryCta={{
                    label: t('speakingRoleplay.notFoundCtaLabel'),
                    href: '/speaking',
                }}
            />
        </div>
    )
}
