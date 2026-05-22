/**
 * VocabularyPracticeHero — first-viewport backbone block for the
 * `/vocabulary/practice` learner surface.
 *
 * Vai chinh: Frontend Engineer
 * Vai phoi hop: Gamification Designer (companion semantics + CTA copy),
 *               Design System Designer (layout tokens)
 *
 * Spec source-of-truth:
 *   - Task 10.2 (gamified-ui-asset-rollout)
 *   - design.md §I.3 (Vocabulary Collection Book)
 *   - requirements.md Req 5.3, 11.3
 *
 * Responsibility:
 *   Render the first-viewport block of the Vocabulary practice surface so
 *   that on mobile 390×844 the learner sees, top→bottom:
 *     1. Mascot greeting (`MascotRoleHost surfaceId="vocabulary-practice"`,
 *        role auto-resolves to `companion` via SURFACE_MASCOT_CONFIG —
 *        Requirement 5.3 first sentence).
 *     2. Localized eyebrow + title.
 *     3. A single Primary_CTA "Bắt đầu" inside the first viewport
 *        (Requirement 5.3 second sentence; Property 7).
 *
 * The hero is intentionally compact (≤ ~340px vertical) so the Primary_CTA
 * stays inside the first viewport on a 390×844 device once the MobileShell
 * header (~56px) and page padding are accounted for.
 */

import Link from 'next/link'

import { MascotRoleHost } from '@/components/gamification/mascot-role-host'
import { PrimaryCta } from '@/components/ui/primary-cta'
import { fx } from '@/components/ui/fuxie-ui'

export interface VocabularyPracticeHeroProps {
    /** Localized eyebrow label (e.g. "Luyện từ vựng • A1"). */
    eyebrow: string
    /** Localized hero title. */
    title: string
    /** Localized supporting copy under the title. */
    message: string
    /** Localized Primary_CTA label. Required to be exactly "Bắt đầu" per task 10.2. */
    ctaLabel: string
    /** Internal href the Primary_CTA navigates to. */
    ctaHref: string
}

export function VocabularyPracticeHero({
    eyebrow,
    title,
    message,
    ctaLabel,
    ctaHref,
}: VocabularyPracticeHeroProps) {
    return (
        <section
            data-role="vocabulary-practice-hero"
            data-surface-id="vocabulary-practice"
            data-surface-state="default"
            className={fx(
                'relative flex w-full flex-col gap-4',
                'rounded-3xl bg-[var(--fuxie-blue-50)] px-5 py-5',
                'ring-1 ring-[var(--fuxie-blue-200)]/60',
                'sm:px-6 sm:py-6',
            )}
        >
            <div className="flex items-start gap-4">
                {/* Req 5.3: mascot=companion in default state on this surface. */}
                <MascotRoleHost
                    surfaceId="vocabulary-practice"
                    state="default"
                    size={72}
                    priority
                />
                <div className="min-w-0 flex-1">
                    <p
                        data-role="vocabulary-practice-eyebrow"
                        className="text-[10px] font-black uppercase tracking-wide text-[var(--fuxie-blue-600)]"
                    >
                        {eyebrow}
                    </p>
                    <h1
                        data-role="vocabulary-practice-title"
                        className="mt-1 text-base font-extrabold leading-snug text-[var(--fuxie-blue-900)] sm:text-lg"
                    >
                        {title}
                    </h1>
                    <p
                        data-role="vocabulary-practice-message"
                        className="mt-1 text-xs font-semibold leading-relaxed text-[var(--fuxie-blue-700)] sm:text-sm"
                    >
                        {message}
                    </p>
                </div>
            </div>

            {/* Single Primary_CTA — Req 5.3 / Property 7 / Property 8. */}
            <div className="flex" data-cta-context="default">
                <PrimaryCta asChild variant="primary" className="w-full sm:w-auto">
                    <Link href={ctaHref}>{ctaLabel}</Link>
                </PrimaryCta>
            </div>
        </section>
    )
}
