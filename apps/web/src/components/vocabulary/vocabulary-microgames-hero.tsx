/**
 * VocabularyMicrogamesHero — first-viewport backbone block for the
 * `/vocabulary/microgames` learner surface.
 *
 * Vai chinh: Frontend Engineer
 * Vai phoi hop: Gamification Designer (preview reward copy)
 *
 * Spec source-of-truth:
 *   - Task 10.2 (gamified-ui-asset-rollout)
 *   - design.md §I.3 (Vocabulary Collection Book — microgames preview)
 *   - design.md §E (Reward_State handling)
 *   - requirements.md Req 5.4, 16.1, 16.2, 16.5
 *
 * Responsibility:
 *   Render the first-viewport block of the Vocabulary microgames surface
 *   so that BEFORE the learner taps the Primary_CTA, they see, top→bottom:
 *     1. Mascot greeting (`MascotRoleHost surfaceId="vocabulary-microgames"`,
 *        role auto-resolves to `companion` via SURFACE_MASCOT_CONFIG).
 *     2. Reward preview chip with `data-reward-state="preview"`,
 *        `data-reward-context="true"`, the asset from
 *        `REWARD_ASSETS.fucoin`, and the label "+10 Fucoin"
 *        (Req 5.4 — preview state until Primary_CTA tap).
 *     3. Localized eyebrow + title + supporting copy.
 *     4. A single Primary_CTA "Bắt đầu" inside the first viewport.
 *
 * Reward amber containment (Req 16.1, 16.2):
 *   The `--fuxie-reward` token / amber tones are only used inside the
 *   reward-preview subtree which carries `data-reward-state="preview"`.
 *   Other tokens stay on Bright Sky blue.
 */

import Image from 'next/image'
import Link from 'next/link'

import { MascotRoleHost } from '@/components/gamification/mascot-role-host'
import { REWARD_ASSETS } from '@/components/gamification/reward-assets'
import { PrimaryCta } from '@/components/ui/primary-cta'
import { fx } from '@/components/ui/fuxie-ui'

export interface VocabularyMicrogamesHeroProps {
    /** Localized eyebrow label (e.g. "Trò chơi từ vựng • A1"). */
    eyebrow: string
    /** Localized hero title. */
    title: string
    /** Localized supporting copy under the title. */
    message: string
    /** Localized Primary_CTA label. */
    ctaLabel: string
    /** Internal href the Primary_CTA navigates to. */
    ctaHref: string
    /**
     * Reward preview label — shown before the learner taps the Primary_CTA.
     * Defaults to "+10 Fucoin" per task 10.2 acceptance.
     */
    rewardLabel?: string
}

const DEFAULT_REWARD_LABEL = '+10 Fucoin'

export function VocabularyMicrogamesHero({
    eyebrow,
    title,
    message,
    ctaLabel,
    ctaHref,
    rewardLabel = DEFAULT_REWARD_LABEL,
}: VocabularyMicrogamesHeroProps) {
    return (
        <section
            data-role="vocabulary-microgames-hero"
            data-surface-id="vocabulary-microgames"
            data-surface-state="default"
            className={fx(
                'relative flex w-full flex-col gap-4',
                'rounded-3xl bg-[var(--fuxie-blue-50)] px-5 py-5',
                'ring-1 ring-[var(--fuxie-blue-200)]/60',
                'sm:px-6 sm:py-6',
            )}
        >
            {/* Mascot greeting — companion via SURFACE_MASCOT_CONFIG. */}
            <div className="flex items-start gap-4">
                <MascotRoleHost
                    surfaceId="vocabulary-microgames"
                    state="default"
                    size={72}
                    priority
                />
                <div className="min-w-0 flex-1">
                    <p
                        data-role="vocabulary-microgames-eyebrow"
                        className="text-[10px] font-black uppercase tracking-wide text-[var(--fuxie-blue-600)]"
                    >
                        {eyebrow}
                    </p>
                    <h1
                        data-role="vocabulary-microgames-title"
                        className="mt-1 text-base font-extrabold leading-snug text-[var(--fuxie-blue-900)] sm:text-lg"
                    >
                        {title}
                    </h1>
                    <p
                        data-role="vocabulary-microgames-message"
                        className="mt-1 text-xs font-semibold leading-relaxed text-[var(--fuxie-blue-700)] sm:text-sm"
                    >
                        {message}
                    </p>
                </div>
            </div>

            {/* Reward preview chip — Req 5.4 / Req 16.1 / Req 16.2.
                Carries `data-reward-state="preview"` + `data-reward-context="true"`
                so reward-amber tokens are localized inside this subtree only. */}
            <div
                data-role="vocabulary-microgames-reward-preview"
                data-reward-state="preview"
                data-reward-context="true"
                data-reward-key="fucoin"
                className={fx(
                    'inline-flex items-center gap-2 self-start rounded-full',
                    'bg-white px-3 py-1.5',
                    'ring-1 ring-[var(--fuxie-reward,#FFB703)]/40',
                )}
            >
                <Image
                    src={REWARD_ASSETS.fucoin}
                    alt=""
                    aria-hidden="true"
                    width={28}
                    height={28}
                    className="h-7 w-7 shrink-0 object-contain drop-shadow-sm"
                />
                <span
                    data-role="vocabulary-microgames-reward-label"
                    className="text-xs font-black text-[#8A5A00] sm:text-sm"
                >
                    {rewardLabel}
                </span>
            </div>

            {/* Single Primary_CTA — Req 5.4 / Property 7 / Property 8. */}
            <div className="flex" data-cta-context="default">
                <PrimaryCta asChild variant="primary" className="w-full sm:w-auto">
                    <Link href={ctaHref}>{ctaLabel}</Link>
                </PrimaryCta>
            </div>
        </section>
    )
}
