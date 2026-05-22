/**
 * Exam not-found boundary — Req 11.1 (empty state).
 *
 * Vai chinh: Frontend Engineer
 *
 * Triggered when an exam id has no record. Surfaces an `empty` state so
 * the learner gets mascot=guard + Primary_CTA back to the exam catalog
 * (Req 11.3, Property 8). The exam config's `default` role is `silent`
 * but `error: 'guard'` (Req 12.7); we route the not-found UI through the
 * catalog `exam` config which uses the same surfaceId.
 */

import { getTranslations } from 'next-intl/server'

import { StateShell } from '@/components/gamification/state-shell'

export default async function ExamNotFound() {
    const t = await getTranslations('SurfaceStates')

    return (
        <div className="max-w-3xl mx-auto px-4 py-12">
            <StateShell
                surfaceId="exam"
                state="empty"
                title={t('exam.notFoundTitle')}
                message={t('exam.notFoundMessage')}
                primaryCta={{
                    label: t('exam.notFoundCtaLabel'),
                    href: '/exam',
                }}
            />
        </div>
    )
}
