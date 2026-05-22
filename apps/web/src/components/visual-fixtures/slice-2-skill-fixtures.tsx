import { PrimaryCta } from '@/components/ui/primary-cta'
import { MascotImage, type MascotPose } from '@/components/shared/mascot-image'
import type { ReactNode } from 'react'

type Slice2State =
    | 'success'
    | 'error'
    | 'loading'
    | 'timeout'

type FixtureModule =
    | '05-vocabulary'
    | '06-grammar'
    | '07-listening'
    | '08-speaking'
    | '09-reading'
    | '10-writing'
    | '11-exam'

export type Slice2VisualQaParams = {
    fixture?: string
    state?: string
}

export function isSlice2VisualQaFixture(
    params: Slice2VisualQaParams | undefined,
    state: Slice2State,
) {
    return (
        process.env.NODE_ENV !== 'production' &&
        params?.fixture === 'visual-qa' &&
        params?.state === state
    )
}

function SkillFixtureShell({
    route,
    module,
    visualState,
    stateRole,
    accent,
    title,
    subtitle,
    mascotPose,
    children,
    ctaLabel,
    secondaryLabel,
}: {
    route: string
    module: FixtureModule
    visualState: Slice2State
    stateRole: string
    accent: string
    title: string
    subtitle: string
    mascotPose: MascotPose
    children: ReactNode
    ctaLabel: string
    secondaryLabel?: string
}) {
    return (
        <main
            data-route={route}
            data-slice="slice-2"
            data-module={module}
            data-visual-state={visualState}
            className="min-h-[100dvh] overflow-x-hidden bg-[var(--fuxie-blue-50)] text-slate-900"
        >
            <header
                data-role="slice-2-skill-header"
                className="h-16 overflow-hidden border-b border-white/70 bg-white/90 backdrop-blur"
            >
                <div className="mx-auto flex h-full max-w-6xl items-center justify-between gap-3 px-4">
                    <div className="min-w-0">
                        <p className="truncate text-xs font-bold uppercase tracking-normal text-slate-500">
                            Slice 2 Skill Player
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
                        alt="Fuxie skill guide"
                        className="mx-auto flex justify-center"
                    />
                    <div className="mt-4 rounded-2xl border border-sky-100 bg-sky-50 p-4">
                        <p className="text-sm font-black text-slate-900">Fixture data</p>
                        <p className="mt-1 text-sm leading-6 text-slate-600">
                            Deterministic visual QA surface for desktop 1440 x 900 and mobile 390 x 844.
                        </p>
                    </div>
                </aside>
            </section>
        </main>
    )
}

function Meter({ value, label, tone = 'bg-emerald-400' }: { value: number; label: string; tone?: string }) {
    return (
        <div>
            <div className="mb-2 flex items-center justify-between gap-3 text-sm font-bold">
                <span>{label}</span>
                <span>{value}%</span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                <div className={`h-full rounded-full ${tone}`} style={{ width: `${value}%` }} />
            </div>
        </div>
    )
}

export function Slice2VocabularySuccessFixture() {
    return (
        <SkillFixtureShell
            route="vocabulary"
            module="05-vocabulary"
            visualState="success"
            stateRole="vocabulary-success-state"
            accent="#FFB703"
            title="Vocabulary mastery"
            subtitle="Success state - learned 10 words"
            mascotPose="resultCelebration"
            ctaLabel="Weiter ueben"
            secondaryLabel="Zur Sammlung"
        >
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px]">
                <div className="rounded-2xl border border-amber-100 bg-amber-50 p-5">
                    <p className="text-sm font-bold uppercase tracking-normal text-amber-700">
                        Collection book
                    </p>
                    <h2 className="mt-2 break-words text-3xl font-black text-slate-950">
                        10 neue Woerter sitzen.
                    </h2>
                    <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-700">
                        The learner completed the daily vocabulary target with stable flashcard identity,
                        meaning panel, and mastery counter.
                    </p>
                </div>
                <div
                    data-role="vocabulary-mastery-counter"
                    className="rounded-2xl border border-white bg-white p-5 text-center shadow-sm"
                >
                    <p className="text-sm font-bold text-slate-500">Mastery</p>
                    <p className="mt-2 text-5xl font-black text-amber-500">10</p>
                    <p className="text-sm font-bold text-slate-700">words learned</p>
                </div>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
                {['der Termin', 'puenktlich', 'wiederholen'].map((word) => (
                    <div key={word} className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                        <p className="text-lg font-black text-slate-900">{word}</p>
                        <p className="mt-1 text-sm text-slate-500">A2 daily set</p>
                    </div>
                ))}
            </div>
        </SkillFixtureShell>
    )
}

export function Slice2GrammarErrorFixture() {
    return (
        <SkillFixtureShell
            route="grammar"
            module="06-grammar"
            visualState="error"
            stateRole="grammar-error-state"
            accent="#7C3AED"
            title="Grammar correction"
            subtitle="Error state - common Dativ pattern mistake"
            mascotPose="grammarMentor"
            ctaLabel="Regel erneut ueben"
            secondaryLabel="Hinweis ansehen"
        >
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_260px]">
                <div data-role="grammar-diagram" className="rounded-2xl bg-violet-50 p-5">
                    <p className="text-sm font-bold text-violet-700">Pattern diagram</p>
                    <div className="mt-4 grid gap-3 sm:grid-cols-3">
                        {['Ich helfe', 'dem Freund', 'nach dem Kurs'].map((part, index) => (
                            <div
                                key={part}
                                className={`rounded-xl border-2 p-4 text-center text-sm font-black ${
                                    index === 1
                                        ? 'border-rose-300 bg-rose-50 text-rose-700'
                                        : 'border-violet-200 bg-white text-violet-800'
                                }`}
                            >
                                {part}
                            </div>
                        ))}
                    </div>
                </div>
                <div
                    data-role="grammar-error-feedback"
                    className="rounded-2xl border border-rose-200 bg-rose-50 p-5"
                >
                    <p className="text-sm font-black text-rose-700">Correction</p>
                    <p className="mt-2 text-sm leading-6 text-slate-700">
                        Use Dativ after helfen: dem Freund, not den Freund. The feedback panel stays
                        attached to the rule and keeps one retry path.
                    </p>
                </div>
            </div>
        </SkillFixtureShell>
    )
}

export function Slice2ListeningLoadingFixture() {
    return (
        <SkillFixtureShell
            route="listening"
            module="07-listening"
            visualState="loading"
            stateRole="listening-loading-state"
            accent="#2EC4B6"
            title="Listening audio loader"
            subtitle="Loading state - audio metadata and waveform"
            mascotPose="listeningFocus"
            ctaLabel="Audio neu laden"
            secondaryLabel="Zur Liste"
        >
            <div data-role="waveform-player" aria-busy="true" className="rounded-2xl bg-cyan-50 p-5">
                <div className="flex h-28 items-end gap-2 overflow-hidden rounded-2xl bg-white p-4">
                    {[42, 68, 34, 82, 55, 74, 38, 62, 88, 46, 70, 40].map((height, index) => (
                        <span
                            key={`${height}-${index}`}
                            className="flex-1 animate-pulse rounded-full bg-cyan-300"
                            style={{ height: `${height}%`, animationDelay: `${index * 80}ms` }}
                        />
                    ))}
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    {['Audio wird geladen', 'Transcript bereit', 'Fragen gesperrt'].map((label) => (
                        <div key={label} className="rounded-xl border border-cyan-100 bg-white p-3 text-sm font-bold text-slate-700">
                            {label}
                        </div>
                    ))}
                </div>
            </div>
        </SkillFixtureShell>
    )
}

export function Slice2SpeakingErrorFixture() {
    return (
        <SkillFixtureShell
            route="speaking"
            module="08-speaking"
            visualState="error"
            stateRole="speaking-error-state"
            accent="#EF4444"
            title="Speaking pronunciation retry"
            subtitle="Error state - pronunciation mismatch"
            mascotPose="speakingRecord"
            ctaLabel="Nochmal aufnehmen"
            secondaryLabel="Langsam anhoeren"
        >
            <div className="grid gap-4 lg:grid-cols-[240px_minmax(0,1fr)]">
                <div data-role="pronunciation-meter" className="rounded-2xl border border-rose-200 bg-rose-50 p-5">
                    <p className="text-sm font-bold text-rose-700">Pronunciation score</p>
                    <p className="mt-2 text-5xl font-black text-rose-600">42%</p>
                    <Meter value={42} label="Target match" tone="bg-rose-400" />
                </div>
                <div className="rounded-2xl bg-white p-5 shadow-sm">
                    <p className="text-sm font-bold text-slate-500">Target phrase</p>
                    <p className="mt-2 break-words text-3xl font-black text-slate-900">
                        Ich moechte einen Termin machen.
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                        {['moechte', 'einen', 'Termin'].map((sound) => (
                            <span key={sound} className="rounded-full bg-rose-100 px-3 py-1 text-sm font-bold text-rose-700">
                                {sound}
                            </span>
                        ))}
                    </div>
                </div>
            </div>
        </SkillFixtureShell>
    )
}

export function Slice2ReadingSuccessFixture() {
    return (
        <SkillFixtureShell
            route="reading"
            module="09-reading"
            visualState="success"
            stateRole="reading-success-state"
            accent="#3C78A8"
            title="Reading comprehension"
            subtitle="Success state - comprehension threshold reached"
            mascotPose="reading"
            ctaLabel="Naechsten Text lesen"
            secondaryLabel="Antworten pruefen"
        >
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
                <article className="rounded-2xl border border-sky-100 bg-sky-50 p-5">
                    <p className="text-sm font-bold text-sky-700">Passage</p>
                    <p className="mt-2 text-sm leading-7 text-slate-700">
                        Lina liest eine kurze Nachricht ueber einen Sprachkurs. The two-pane
                        reading context stays visible while the success feedback appears.
                    </p>
                </article>
                <div
                    data-role="reading-comprehension-success"
                    className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5"
                >
                    <p className="text-sm font-black text-emerald-700">Threshold reached</p>
                    <p className="mt-2 text-4xl font-black text-emerald-600">86%</p>
                    <p className="mt-2 text-sm leading-6 text-slate-700">
                        All core questions are correct; the learner can continue without losing
                        passage context.
                    </p>
                </div>
            </div>
        </SkillFixtureShell>
    )
}

export function Slice2WritingErrorFixture() {
    return (
        <SkillFixtureShell
            route="writing"
            module="10-writing"
            visualState="error"
            stateRole="writing-error-state"
            accent="#F97316"
            title="Writing structure feedback"
            subtitle="Error state - required structure missing"
            mascotPose="writingDelivery"
            ctaLabel="Struktur pruefen"
            secondaryLabel="Entwurf speichern"
        >
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_260px]">
                <div data-role="editor-canvas" className="min-h-[260px] rounded-2xl border border-orange-100 bg-white p-5 shadow-inner">
                    <p className="text-sm font-bold text-slate-500">Draft editor</p>
                    <p className="mt-4 break-words text-base leading-8 text-slate-800">
                        Sehr geehrte Damen und Herren, ich schreibe wegen meines Termins.
                        Ich kann am Freitag nicht kommen und brauche einen neuen Vorschlag.
                    </p>
                    <span className="mt-4 inline-flex h-6 w-1 animate-pulse rounded-full bg-orange-500" />
                </div>
                <aside data-role="writing-structure-feedback" className="rounded-2xl border border-orange-200 bg-orange-50 p-5">
                    <p className="text-sm font-black text-orange-700">Missing requirement</p>
                    <ul className="mt-3 space-y-3 text-sm leading-6 text-slate-700">
                        <li>Opening greeting found</li>
                        <li>Reason found</li>
                        <li className="font-bold text-orange-700">Closing sentence missing</li>
                    </ul>
                </aside>
            </div>
        </SkillFixtureShell>
    )
}

export function Slice2ExamTimeoutFixture() {
    return (
        <SkillFixtureShell
            route="exam"
            module="11-exam"
            visualState="timeout"
            stateRole="exam-timeout-state"
            accent="#B91C1C"
            title="Timed CEFR exam"
            subtitle="Timeout state - time expired before submit"
            mascotPose="examProctor"
            ctaLabel="Jetzt abgeben"
            secondaryLabel="Zur Uebersicht"
        >
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
                <div className="rounded-2xl bg-slate-50 p-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <span className="rounded-full bg-rose-100 px-4 py-2 text-sm font-black text-rose-700">
                            00:00 Zeit abgelaufen
                        </span>
                        <span className="text-sm font-bold text-slate-500">Frage 18 von 30</span>
                    </div>
                    <div className="mt-5 rounded-2xl bg-white p-5">
                        <p className="text-sm font-bold text-slate-500">Question locked</p>
                        <p className="mt-2 text-lg font-black text-slate-900">
                            The exam chrome remains visible while the timeout decision is required.
                        </p>
                    </div>
                </div>
                <div
                    data-role="exam-timeout-dialog"
                    className="rounded-2xl border border-rose-200 bg-rose-50 p-5 shadow-lg"
                    role="alertdialog"
                    aria-labelledby="exam-timeout-title"
                >
                    <p id="exam-timeout-title" className="text-xl font-black text-rose-700">
                        Zeit ist abgelaufen
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-700">
                        Submit the saved answers now, restart the attempt, or return to the overview.
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2 text-xs font-bold text-rose-700">
                        <span className="rounded-full bg-white px-3 py-1">Autosave active</span>
                        <span className="rounded-full bg-white px-3 py-1">Retry available</span>
                    </div>
                </div>
            </div>
        </SkillFixtureShell>
    )
}
