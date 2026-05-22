import { AlertTriangle, FilterX, Mail, Search, UsersRound } from 'lucide-react'
import type { ReactNode } from 'react'

import { MascotImage, type MascotPose } from '@/components/shared/mascot-image'
import { PrimaryCta } from '@/components/ui/primary-cta'

type Slice4State = 'error' | 'empty'

type FixtureModule =
    | '16-teacher'
    | '17-admin'

export type Slice4VisualQaParams = {
    fixture?: string
    state?: string
}

export function isSlice4VisualQaFixture(
    params: Slice4VisualQaParams | undefined,
    state: Slice4State,
) {
    return (
        process.env.NODE_ENV !== 'production' &&
        params?.fixture === 'visual-qa' &&
        params?.state === state
    )
}

function Slice4FixtureShell({
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
    visualState: Slice4State
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
            data-slice="slice-4"
            data-module={module}
            data-visual-state={visualState}
            className="min-h-[100dvh] overflow-x-hidden bg-[var(--fuxie-blue-50)] text-slate-900"
        >
            <header
                data-role="slice-4-staff-header"
                className="h-16 overflow-hidden border-b border-white/70 bg-white/90 backdrop-blur"
            >
                <div className="mx-auto flex h-full max-w-6xl items-center justify-between gap-3 px-4">
                    <div className="min-w-0">
                        <p className="truncate text-xs font-bold uppercase tracking-normal text-slate-500">
                            Slice 4 Staff Operations
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
                        alt="Fuxie staff operations guide"
                        className="mx-auto flex justify-center"
                    />
                    <div className="mt-4 rounded-2xl border border-sky-100 bg-sky-50 p-4">
                        <p className="text-sm font-black text-slate-900">Fixture data</p>
                        <p className="mt-1 text-sm leading-6 text-slate-600">
                            Deterministic Slice 4 surface for desktop 1440 x 900 and mobile 390 x 844.
                        </p>
                    </div>
                </aside>
            </section>
        </main>
    )
}

function RiskChip({ label, tone }: { label: string; tone: string }) {
    return (
        <span className={`rounded-full px-3 py-1 text-xs font-black ${tone}`}>
            {label}
        </span>
    )
}

export function Slice4TeacherOverdueFixture() {
    return (
        <Slice4FixtureShell
            route="teacher"
            module="16-teacher"
            visualState="error"
            stateRole="teacher-overdue-assignment-state"
            accent="#B45309"
            title="Teacher overdue assignments"
            subtitle="Error state - overdue submissions need a nudge"
            mascotPose="teacherCoach"
            ctaLabel="Nhac lop nop bai"
            secondaryLabel="Mo danh sach lop"
        >
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
                <div className="rounded-2xl border border-amber-100 bg-amber-50 p-5">
                    <div className="flex flex-wrap items-center gap-2">
                        <AlertTriangle className="h-6 w-6 text-amber-700" aria-hidden="true" />
                        <RiskChip label="4 overdue" tone="bg-white text-amber-700" />
                        <RiskChip label="A2 Klasse" tone="bg-white text-slate-700" />
                    </div>
                    <h2 className="mt-3 break-words text-3xl font-black text-slate-950">
                        Schreibaufgabe A2 ist ueberfaellig.
                    </h2>
                    <p className="mt-3 text-sm leading-6 text-slate-700">
                        The roster stays visible while the teacher reviews who missed the deadline
                        and sends one clear reminder.
                    </p>
                </div>
                <div
                    data-role="teacher-overdue-dialog"
                    role="alertdialog"
                    aria-labelledby="teacher-overdue-title"
                    className="rounded-2xl border border-rose-200 bg-rose-50 p-5 shadow-sm"
                >
                    <p id="teacher-overdue-title" className="text-lg font-black text-rose-700">
                        Reminder needed
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-700">
                        Four learners have not submitted by the agreed deadline.
                    </p>
                    <div className="mt-4 flex items-center gap-2 text-sm font-bold text-rose-700">
                        <Mail className="h-4 w-4" aria-hidden="true" />
                        Parent and learner nudge ready
                    </div>
                </div>
            </div>

            <div data-role="teacher-roster-overdue-list" className="mt-5 overflow-hidden rounded-2xl border border-slate-100">
                {[
                    ['Mai Tran', '2 days late', '0/3 rubric points'],
                    ['Duc Pham', '1 day late', 'draft opened'],
                    ['Linh Ho', '1 day late', 'no activity'],
                ].map(([name, status, detail], index) => (
                    <div
                        key={name}
                        className={`grid gap-2 bg-white p-4 text-sm sm:grid-cols-[minmax(0,1fr)_140px_160px] ${
                            index > 0 ? 'border-t border-slate-100' : ''
                        }`}
                    >
                        <p className="min-w-0 font-black text-slate-900">{name}</p>
                        <p className="font-bold text-rose-700">{status}</p>
                        <p className="text-slate-500">{detail}</p>
                    </div>
                ))}
            </div>
        </Slice4FixtureShell>
    )
}

export function Slice4AdminFilteredEmptyFixture() {
    return (
        <Slice4FixtureShell
            route="admin"
            module="17-admin"
            visualState="empty"
            stateRole="admin-filtered-empty-state"
            accent="#0891B2"
            title="Admin filtered user table"
            subtitle="Empty state - active filters return no users"
            mascotPose="adminAnalyst"
            ctaLabel="Bo loc"
            secondaryLabel="Tao user moi"
        >
            <div className="grid gap-4 lg:grid-cols-[260px_minmax(0,1fr)]">
                <aside data-role="admin-filter-rail" className="rounded-2xl border border-cyan-100 bg-cyan-50 p-5">
                    <div className="flex items-center gap-2">
                        <Search className="h-5 w-5 text-cyan-700" aria-hidden="true" />
                        <p className="text-sm font-black text-cyan-800">Active filters</p>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                        <RiskChip label="Role: Teacher" tone="bg-white text-cyan-700" />
                        <RiskChip label="Level: C2" tone="bg-white text-cyan-700" />
                        <RiskChip label="Status: Invited" tone="bg-white text-cyan-700" />
                    </div>
                </aside>
                <div
                    data-role="admin-user-table-empty"
                    className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm"
                >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <p className="text-sm font-bold text-slate-500">Users table</p>
                            <h2 className="mt-1 break-words text-3xl font-black text-slate-950">
                                No matching users.
                            </h2>
                        </div>
                        <FilterX className="h-10 w-10 text-cyan-600" aria-hidden="true" />
                    </div>
                    <p className="mt-3 text-sm leading-6 text-slate-700">
                        The data table keeps its filters visible, explains the empty result, and
                        offers one reset action.
                    </p>
                    <div className="mt-5 grid gap-2 rounded-2xl border border-slate-100 bg-slate-50 p-3 text-sm">
                        {['Name', 'Role', 'CEFR', 'Last active'].map((label) => (
                            <div key={label} className="flex items-center gap-3 rounded-xl bg-white p-3">
                                <UsersRound className="h-4 w-4 text-slate-400" aria-hidden="true" />
                                <span className="font-bold text-slate-500">{label}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </Slice4FixtureShell>
    )
}
