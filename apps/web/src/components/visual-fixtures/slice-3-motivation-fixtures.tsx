import { Award, CheckCircle2, Flag, MessageCircle, Target } from 'lucide-react'
import type { ReactNode } from 'react'

import { MascotImage, type MascotPose } from '@/components/shared/mascot-image'
import { PrimaryCta } from '@/components/ui/primary-cta'

type Slice3State = 'success' | 'empty' | 'loading'

type FixtureModule =
    | '12-rewards'
    | '13-missions'
    | '14-chat'
    | '15-profile'

export type Slice3VisualQaParams = {
    fixture?: string
    state?: string
}

export function isSlice3VisualQaFixture(
    params: Slice3VisualQaParams | undefined,
    state: Slice3State,
) {
    return (
        process.env.NODE_ENV !== 'production' &&
        params?.fixture === 'visual-qa' &&
        params?.state === state
    )
}

function Slice3FixtureShell({
    route,
    module,
    visualState,
    stateRole,
    accent,
    title,
    subtitle,
    mascotPose,
    ctaLabel,
    secondaryLabel,
    children,
}: {
    route: string
    module: FixtureModule
    visualState: Slice3State
    stateRole: string
    accent: string
    title: string
    subtitle: string
    mascotPose: MascotPose
    ctaLabel: string
    secondaryLabel?: string
    children: ReactNode
}) {
    return (
        <main
            data-route={route}
            data-slice="slice-3"
            data-module={module}
            data-visual-state={visualState}
            className="min-h-[100dvh] overflow-x-hidden bg-[var(--fuxie-blue-50)] text-slate-900"
        >
            <header
                data-role="slice-3-motivation-header"
                className="h-16 overflow-hidden border-b border-white/70 bg-white/90 backdrop-blur"
            >
                <div className="mx-auto flex h-full max-w-6xl items-center justify-between gap-3 px-4">
                    <div className="min-w-0">
                        <p className="truncate text-xs font-bold uppercase tracking-normal text-slate-500">
                            Slice 3 Motivation Layer
                        </p>
                        <h1 className="truncate text-lg font-black text-slate-900 sm:text-xl">
                            {title}
                        </h1>
                    </div>
                    <span
                        className="shrink-0 rounded-full px-3 py-1 text-xs font-black text-white"
                        style={{ backgroundColor: accent }}
                    >
                        {module}
                    </span>
                </div>
            </header>

            <section className="mx-auto grid max-w-6xl gap-5 px-4 py-5 lg:grid-cols-[minmax(0,1fr)_280px] lg:py-7">
                <div
                    data-role={stateRole}
                    className="min-w-0 rounded-[24px] border border-white/70 bg-white p-4 shadow-lg shadow-sky-900/10 sm:p-6"
                >
                    <p className="mb-2 text-sm font-bold text-slate-500">{subtitle}</p>
                    {children}
                    <div className="mt-5 flex flex-wrap items-center gap-3">
                        <PrimaryCta>{ctaLabel}</PrimaryCta>
                        {secondaryLabel ? (
                            <PrimaryCta variant="secondary">{secondaryLabel}</PrimaryCta>
                        ) : null}
                    </div>
                </div>

                <aside className="min-w-0 rounded-[24px] border border-white/70 bg-white/80 p-4 shadow-md shadow-sky-900/10">
                    <MascotImage
                        pose={mascotPose}
                        size="md"
                        alt="Fuxie motivation guide"
                        className="mx-auto flex justify-center"
                    />
                    <div className="mt-4 rounded-2xl border border-sky-100 bg-sky-50 p-4">
                        <p className="text-sm font-black text-slate-900">Fixture data</p>
                        <p className="mt-1 text-sm leading-6 text-slate-600">
                            Deterministic Slice 3 surface for desktop 1440 x 900 and mobile 390 x 844.
                        </p>
                    </div>
                </aside>
            </section>
        </main>
    )
}

function ProgressBar({ value, tone }: { value: number; tone: string }) {
    return (
        <div className="h-3 overflow-hidden rounded-full bg-slate-100">
            <div className={`h-full rounded-full ${tone}`} style={{ width: `${value}%` }} />
        </div>
    )
}

export function Slice3RewardsSuccessFixture() {
    return (
        <Slice3FixtureShell
            route="badges"
            module="12-rewards"
            visualState="success"
            stateRole="rewards-badge-unlock-state"
            accent="#FFB703"
            title="Badge unlock reveal"
            subtitle="Success state - badge earned after meaningful completion"
            mascotPose="badgeCurator"
            ctaLabel="Badge ansehen"
            secondaryLabel="Zur Sammlung"
        >
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_240px]">
                <div className="rounded-2xl border border-amber-100 bg-amber-50 p-5">
                    <p className="text-sm font-bold uppercase tracking-normal text-amber-700">
                        Neuer Badge
                    </p>
                    <h2 className="mt-2 break-words text-3xl font-black text-slate-950">
                        A2 Alltagssieger freigeschaltet.
                    </h2>
                    <p className="mt-3 text-sm leading-6 text-slate-700">
                        The reveal keeps Fucoin, badge shelf, and next practice path together without
                        turning the reward into the only goal.
                    </p>
                </div>
                <div
                    data-role="badge-unlock-reveal"
                    className="rounded-2xl border border-white bg-white p-5 text-center shadow-sm"
                >
                    <Award className="mx-auto h-12 w-12 text-amber-500" aria-hidden="true" />
                    <p className="mt-3 text-5xl font-black text-amber-500">+1</p>
                    <p className="text-sm font-bold text-slate-700">badge unlocked</p>
                </div>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
                {['Fucoin +25', 'Streak bleibt', 'Naechstes Ziel bereit'].map((label) => (
                    <div key={label} className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                        <p className="text-sm font-black text-slate-900">{label}</p>
                    </div>
                ))}
            </div>
        </Slice3FixtureShell>
    )
}

export function Slice3MissionsEmptyFixture() {
    return (
        <Slice3FixtureShell
            route="dashboard"
            module="13-missions"
            visualState="empty"
            stateRole="missions-complete-empty-state"
            accent="#16A34A"
            title="Daily missions complete"
            subtitle="Empty state - no missions left today"
            mascotPose="campaignHost"
            ctaLabel="Morgen planen"
            secondaryLabel="Zum Kurs"
        >
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_260px]">
                <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5">
                    <p className="text-sm font-bold text-emerald-700">Mission board</p>
                    <h2 className="mt-2 break-words text-3xl font-black text-slate-950">
                        Alle Tagesmissionen erledigt.
                    </h2>
                    <p className="mt-3 text-sm leading-6 text-slate-700">
                        The dashboard mission area celebrates completion while keeping the next
                        learning step calm and optional.
                    </p>
                </div>
                <div
                    data-role="mission-board-complete"
                    className="rounded-2xl border border-emerald-200 bg-white p-5"
                >
                    <Flag className="h-10 w-10 text-emerald-600" aria-hidden="true" />
                    <p className="mt-3 text-4xl font-black text-emerald-600">3/3</p>
                    <p className="text-sm font-bold text-slate-700">missions complete</p>
                    <ProgressBar value={100} tone="bg-emerald-400" />
                </div>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
                {['Wortschatz', 'Hoeren', 'Review'].map((label) => (
                    <div key={label} className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                        <CheckCircle2 className="h-5 w-5 text-emerald-600" aria-hidden="true" />
                        <p className="mt-2 text-sm font-black text-slate-900">{label}</p>
                    </div>
                ))}
            </div>
        </Slice3FixtureShell>
    )
}

export function Slice3ChatLoadingFixture() {
    return (
        <Slice3FixtureShell
            route="chat"
            module="14-chat"
            visualState="loading"
            stateRole="chat-typing-loading-state"
            accent="#6366F1"
            title="Tutor typing"
            subtitle="Loading state - Fuxie is composing a reply"
            mascotPose="roleplayWaiter"
            ctaLabel="Antwort stoppen"
            secondaryLabel="Thema wechseln"
        >
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_260px]">
                <div data-role="chat-thread" className="rounded-2xl border border-indigo-100 bg-indigo-50 p-5">
                    <div className="max-w-[82%] rounded-2xl bg-white p-4 shadow-sm">
                        <p className="text-sm font-bold text-slate-500">Lina</p>
                        <p className="mt-1 text-sm leading-6 text-slate-700">
                            Kannst du mir den Unterschied zwischen weil und denn erklaeren?
                        </p>
                    </div>
                    <div
                        data-role="tutor-typing-indicator"
                        aria-live="polite"
                        className="mt-4 max-w-[82%] rounded-2xl bg-white p-4 shadow-sm"
                    >
                        <p className="text-sm font-bold text-indigo-700">Fuxie tippt</p>
                        <div className="mt-3 flex gap-2">
                            {[0, 1, 2].map((dot) => (
                                <span
                                    key={dot}
                                    className="h-3 w-3 animate-pulse rounded-full bg-indigo-400"
                                    style={{ animationDelay: `${dot * 120}ms` }}
                                />
                            ))}
                        </div>
                    </div>
                </div>
                <aside className="rounded-2xl border border-indigo-100 bg-white p-5">
                    <MessageCircle className="h-10 w-10 text-indigo-500" aria-hidden="true" />
                    <p className="mt-3 text-sm font-black text-slate-900">Context</p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                        A2 grammar support, short answer mode, voice reply disabled.
                    </p>
                </aside>
            </div>
        </Slice3FixtureShell>
    )
}

export function Slice3ProfileSuccessFixture() {
    return (
        <Slice3FixtureShell
            route="profile"
            module="15-profile"
            visualState="success"
            stateRole="profile-goal-updated-state"
            accent="#C084FC"
            title="Profile goal updated"
            subtitle="Success state - personal study goal changed"
            mascotPose="authWelcomer"
            ctaLabel="Ziel speichern"
            secondaryLabel="Dashboard ansehen"
        >
            <div className="grid gap-4 lg:grid-cols-[240px_minmax(0,1fr)]">
                <div data-role="profile-avatar-goal-card" className="rounded-2xl border border-purple-100 bg-purple-50 p-5">
                    <div className="grid h-20 w-20 place-items-center rounded-full bg-white text-3xl font-black text-purple-600">
                        LN
                    </div>
                    <p className="mt-4 text-sm font-bold text-purple-700">Lina Nguyen</p>
                    <p className="text-sm text-slate-600">A2 to B1 Goethe</p>
                </div>
                <div className="rounded-2xl bg-white p-5 shadow-sm">
                    <div className="flex flex-wrap items-center gap-2">
                        <Target className="h-6 w-6 text-purple-600" aria-hidden="true" />
                        <p className="text-sm font-black text-purple-700">Goal updated</p>
                    </div>
                    <h2 className="mt-3 break-words text-3xl font-black text-slate-950">
                        25 Minuten Lernen pro Tag.
                    </h2>
                    <p className="mt-3 text-sm leading-6 text-slate-700">
                        The profile surface confirms the goal change, shows the active exam target,
                        and gives one clear save path.
                    </p>
                    <div className="mt-4">
                        <div className="mb-2 flex items-center justify-between text-sm font-bold text-slate-600">
                            <span>Daily goal</span>
                            <span>25 min</span>
                        </div>
                        <ProgressBar value={83} tone="bg-purple-400" />
                    </div>
                </div>
            </div>
        </Slice3FixtureShell>
    )
}
