/**
 * DashboardBackboneHero — first-viewport backbone block for the Dashboard
 * surface.
 *
 * Vai chinh: Frontend Engineer (8.1) / Design System Designer (8.2)
 * Vai phoi hop: Gamification Designer (greeting copy/loop), Design System
 *               Designer (layout tokens), Frontend Engineer (8.2 wiring)
 *
 * Spec source-of-truth:
 *   - Task 8.1, 8.2 (gamified-ui-asset-rollout)
 *   - design.md §I.1 (Dashboard — Village Square hierarchy)
 *   - requirements.md Req 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 11.1, 11.3,
 *     11.5, 15.3
 *
 * Responsibility:
 *   Render the first-viewport block of the Dashboard surface so that on
 *   mobile 390×844 the learner sees, top→bottom:
 *     1. Mascot greeting (`MascotRoleHost surfaceId="dashboard"`).
 *     2. Streak chip + today's XP target (default state only).
 *     3. Quest progress hero card (default state only).
 *     4. Single Primary_CTA (`Tiếp tục học` / `Tạo lộ trình`) inside the
 *        first viewport.
 *
 * The hero never owns the rich data sections rendered below by
 * `DashboardClient` — it strictly enforces the backbone invariants.
 *
 * Notes:
 *   - Streak chip carries `data-reward-context="true"` only when
 *     `currentStreak ≥ 1` (Req 16.1 streak amber exception).
 *   - Empty state hides streak/XP/quest hero (Req 3.6).
 *   - Error state is handled separately by `error.tsx` via
 *     `<StateShell state="error">` (Req 3.7) so this component does not
 *     need to implement an error branch.
 *   - Background identity (task 8.2): the hero resolves a `villageSquare`
 *     world prop via `pickWorldProp(['village','plaza'])`, layers a soft
 *     `Scrim` over it so body text contrast stays ≥ 4.5:1 (Req 3.4, 15.3),
 *     and falls back to the solid `--fuxie-blue-50` Bright Sky surface
 *     when the registry key is missing or the asset fails to load
 *     (Req 3.5). The fallback is decided synchronously at render time so
 *     SSR and runtime degrade identically.
 */

import Image from 'next/image'
import Link from 'next/link'

import { MascotRoleHost } from '@/components/gamification/mascot-role-host'
import { PrimaryCta } from '@/components/ui/primary-cta'
import { Scrim } from '@/components/ui/scrim'
import { fx } from '@/components/ui/fuxie-ui'
import { REWARD_ASSETS } from '@/components/gamification/reward-assets'
import {
    PLACEHOLDER_ASSET,
    getFuxieWorldPropSrc,
} from '@/lib/mascot/fuxie-assets'
import { pickWorldProp } from '@/lib/mascot/fuxie-world-tags'

export type DashboardHeroState = 'default' | 'empty'

export interface DashboardHeroProps {
    /** `default` for active learners, `empty` for first-time/no-path. */
    state: DashboardHeroState
    /** Localized greeting line, already passed through `t()`. */
    greeting: string
    /** Localized streak chip label (e.g. "7 ngày streak"). */
    streakChipLabel: string
    /** Streak count (≥0). When 0 the chip is suppressed. */
    streakCount: number
    /** Localized today's XP label (e.g. "30/50 XP hôm nay"). */
    xpLabel: string
    /** Localized eyebrow above the quest progress hero. */
    questEyebrow: string
    /** Localized quest hero title. */
    questTitle: string
    /** Localized quest hero supporting copy. */
    questMessage: string
    /** Localized Primary_CTA label. */
    ctaLabel: string
    /** Internal href the Primary_CTA navigates to. */
    ctaHref: string
    /** Daily progress percentage (0-100). */
    progressPercent?: number
}

/**
 * The hero is intentionally compact — the design budget is ≤ ~520px
 * vertical space so the Primary_CTA stays inside 844px on mobile after
 * the MobileShell header (~56px). All numeric tokens are derived from
 * Tailwind defaults to keep us inside the design system.
 */
export function DashboardBackboneHero({
    state,
    greeting,
    streakChipLabel,
    streakCount,
    xpLabel,
    questEyebrow,
    questTitle,
    questMessage,
    ctaLabel,
    ctaHref,
    progressPercent,
}: DashboardHeroProps) {
    const isDefault = state === 'default'
    // Req 16.1: streak amber exception applies only when streak ≥ 1.
    const showStreakReward = isDefault && streakCount >= 1

    // Task 8.2 — resolve the Village Square world prop via tags so the
    // dashboard background stays decoupled from any specific Asset_Key
    // (Req 1.2). `pickWorldProp` returns `villageSquare` deterministically
    // for the village/plaza tags, but is also the canonical fallback if the
    // tag set ever drifts.
    const worldPropKey = pickWorldProp(['village', 'plaza'])
    const worldPropSrc = getFuxieWorldPropSrc(worldPropKey)
    // The lookup helper is total: a missing key resolves to
    // `PLACEHOLDER_ASSET`. We treat that as "world prop not available" and
    // fall back to the solid Bright Sky surface (Req 3.5). Detecting it
    // synchronously keeps SSR and runtime degradation identical and means
    // the acceptance check ("removing villageSquare still yields a
    // contrast-passing render") holds without depending on `<Image onError>`.
    const hasWorldProp = worldPropSrc !== PLACEHOLDER_ASSET

    return (
        <section
            data-role="dashboard-backbone-hero"
            data-surface-id="dashboard"
            data-surface-state={state}
            data-world-prop-key={hasWorldProp ? worldPropKey : undefined}
            data-world-prop-fallback={hasWorldProp ? undefined : 'solid'}
            className={fx(
                'relative isolate overflow-hidden',
                'rounded-3xl bg-[var(--fuxie-blue-50)]',
                'ring-1 ring-[var(--fuxie-blue-200)]/60',
            )}
        >
            {/* Background identity — Village Square world prop. Decorative,
                so `alt=""` and `aria-hidden`. Sits behind the soft scrim so
                contrast against deep-blue text stays ≥ 4.5:1 (Req 3.4,
                15.3). Hidden when the registry key is missing — the solid
                `--fuxie-blue-50` background of the section then satisfies
                Req 3.5 by itself. */}
            {hasWorldProp ? (
                <Image
                    src={worldPropSrc}
                    alt=""
                    aria-hidden="true"
                    fill
                    sizes="(min-width: 640px) 640px, 100vw"
                    priority={false}
                    className="pointer-events-none absolute inset-0 -z-10 select-none object-cover opacity-90"
                    data-role="dashboard-world-prop"
                />
            ) : null}

            {/* Soft scrim — `rgba(255,255,255,0.8)` over the world prop so
                body text and Primary_CTA contrast stays AA. The Scrim
                primitive auto-applies its overlay below children, which
                lets the section keep its rounded corners + ring. When the
                world prop is missing the scrim still renders harmlessly:
                its overlay sits over the solid `--fuxie-blue-50` and
                doesn't change the perceived contrast (white over blue-50
                stays ≥ 4.5:1 for body text). */}
            <Scrim
                intensity="soft"
                className={fx(
                    'flex w-full flex-col gap-4 px-5 py-5 sm:px-6 sm:py-6',
                )}
            >
                {/* Greeting row — Req 3.2 */}
                <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                        <MascotRoleHost
                            surfaceId="dashboard"
                            state={state}
                            size={72}
                            priority
                        />
                        <div className="flex flex-col gap-1 min-w-0">
                            <p
                                data-role="dashboard-greeting"
                                className="text-base font-bold leading-snug text-[var(--fuxie-blue-900)] sm:text-lg"
                            >
                                {greeting}
                            </p>
                            
                            {/* Streak chip + XP target — Req 3.3, hidden in empty state Req 3.6 */}
                            {isDefault ? (
                                <div className="flex flex-wrap items-center gap-2 mt-1">
                                    <span
                                        data-role="dashboard-streak-chip"
                                        data-streak-count={streakCount}
                                        data-reward-context={showStreakReward ? 'true' : undefined}
                                        className={fx(
                                            'inline-flex items-center gap-1.5 rounded-full px-3 py-1',
                                            'text-xs font-black ring-1 ring-inset',
                                            showStreakReward
                                                ? 'bg-[#FFF7E0] text-[var(--fuxie-blue-900)] ring-[var(--fuxie-reward,#FFB703)]/40'
                                                : 'bg-white text-[var(--fuxie-blue-700)] ring-[var(--fuxie-blue-200)]',
                                        )}
                                    >
                                        <span aria-hidden="true">🔥</span>
                                        {streakChipLabel}
                                    </span>
                                    <span
                                        data-role="dashboard-xp-target"
                                        className={fx(
                                            'inline-flex items-center gap-1.5 rounded-full px-3 py-1',
                                            'bg-white text-xs font-black text-[var(--fuxie-blue-700)]',
                                            'ring-1 ring-inset ring-[var(--fuxie-blue-200)]',
                                        )}
                                    >
                                        <span aria-hidden="true">⭐</span>
                                        {xpLabel}
                                    </span>
                                </div>
                            ) : null}
                        </div>
                    </div>

                    {/* Progress Ring for default state */}
                    {isDefault && progressPercent !== undefined && (
                        <div className="flex flex-col items-center gap-1 shrink-0 bg-white/80 backdrop-blur-sm p-2.5 rounded-2xl ring-1 ring-[var(--fuxie-blue-200)]/40 shadow-sm">
                            <ProgressRing progress={progressPercent} size={64} strokeWidth={6} />
                            <span className="text-[10px] font-black text-[var(--fuxie-blue-700)]">Hôm nay</span>
                        </div>
                    )}
                </div>

                {/* Quest progress hero — Req 3.3, hidden in empty state Req 3.6 */}
                {isDefault ? (
                    <div
                        data-role="dashboard-quest-hero"
                        className={fx(
                            'flex items-start gap-3 rounded-2xl bg-white p-4',
                            'ring-1 ring-[var(--fuxie-blue-200)]',
                        )}
                    >
                        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-[var(--fuxie-blue-50)] p-1">
                            <Image
                                src={REWARD_ASSETS.xpStar}
                                alt=""
                                width={40}
                                height={40}
                                className="h-full w-full object-contain"
                            />
                        </span>
                        <div className="min-w-0">
                            <p className="text-[10px] font-black uppercase tracking-wide text-[var(--fuxie-blue-600)]">
                                {questEyebrow}
                            </p>
                            <p className="mt-1 text-sm font-bold text-[var(--fuxie-blue-900)]">
                                {questTitle}
                            </p>
                            <p className="mt-1 text-xs font-semibold leading-relaxed text-[var(--fuxie-blue-700)]">
                                {questMessage}
                            </p>
                        </div>
                    </div>
                ) : null}

                {/* Single Primary_CTA — Req 3.1 / 11.3 / 11.5 */}
                <div className="flex" data-cta-context={state}>
                    <PrimaryCta asChild variant="primary" className="w-full sm:w-auto">
                        <Link href={ctaHref}>{ctaLabel}</Link>
                    </PrimaryCta>
                </div>
            </Scrim>
        </section>
    )
}

function ProgressRing({ progress, size = 64, strokeWidth = 6 }: { progress: number; size?: number; strokeWidth?: number }) {
    const radius = (size - strokeWidth) / 2
    const circumference = radius * 2 * Math.PI
    const offset = circumference - (Math.min(100, Math.max(0, progress)) / 100) * circumference

    return (
        <svg width={size} height={size} className="transform -rotate-90">
            <circle
                cx={size / 2} cy={size / 2} r={radius}
                stroke="#CCE4F0" strokeWidth={strokeWidth} fill="none"
            />
            <circle
                cx={size / 2} cy={size / 2} r={radius}
                stroke="#2EC4B6"
                strokeWidth={strokeWidth} fill="none"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                strokeLinecap="round"
                className="transition-all duration-700 ease-out"
            />
        </svg>
    )
}
