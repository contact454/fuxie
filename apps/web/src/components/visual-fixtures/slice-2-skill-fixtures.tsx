import { PrimaryCta } from "@/components/ui/primary-cta";
import { MascotImage, type MascotPose } from "@/components/shared/mascot-image";
import type { ReactNode } from "react";

type Slice2State = "success" | "error" | "loading" | "timeout";

type FixtureModule =
  | "05-vocabulary"
  | "06-grammar"
  | "07-listening"
  | "08-speaking"
  | "09-reading"
  | "10-writing"
  | "11-exam";

export type Slice2VisualQaParams = {
  fixture?: string;
  state?: string;
};

export function isSlice2VisualQaFixture(
  params: Slice2VisualQaParams | undefined,
  state: Slice2State,
) {
  return (
    process.env.NODE_ENV !== "production" &&
    params?.fixture === "visual-qa" &&
    params?.state === state
  );
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
  route: string;
  module: FixtureModule;
  visualState: Slice2State;
  stateRole: string;
  accent: string;
  title: string;
  subtitle: string;
  mascotPose: MascotPose;
  children: ReactNode;
  ctaLabel: string;
  secondaryLabel?: string;
}) {
  const navItems = [
    ["Home", "H"],
    ["Course", "C"],
    ["Skill", "S"],
    ["Review", "R"],
    ["Exam", "E"],
  ];

  return (
    <main
      data-route={route}
      data-slice="slice-2"
      data-module={module}
      data-visual-state={visualState}
      className="fixed inset-0 z-[80] h-[100dvh] overflow-hidden bg-[#075aa4] text-white"
    >
      <header
        data-role="slice-2-skill-header"
        className="absolute inset-x-0 top-0 z-20 h-16 overflow-hidden border-b border-[#8bd3ff]/30 bg-[#064987]/95 shadow-lg shadow-sky-950/20"
      >
        <div className="mx-auto flex h-full max-w-7xl items-center justify-between gap-3 px-4 lg:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <div className="hidden text-xl font-black tracking-normal text-white sm:block">
              Fuxie
            </div>
            <div
              className="min-w-0 rounded-2xl border border-white/20 px-4 py-2 shadow-inner shadow-white/10"
              style={{ backgroundColor: accent }}
            >
              <p className="truncate text-xs font-black uppercase tracking-normal text-white/80">
                {module}
              </p>
              <h1 className="truncate text-base font-black text-white sm:text-lg">
                {title}
              </h1>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <span className="rounded-full bg-[#ffb703] px-3 py-1 text-xs font-black text-[#173b56]">
              320
            </span>
            <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-black text-white">
              {title}
            </span>
          </div>
        </div>
      </header>

      <div className="absolute inset-x-0 bottom-0 top-16 grid min-h-0 grid-rows-[minmax(0,1fr)_58px] lg:grid-cols-[82px_minmax(0,1fr)] lg:grid-rows-1">
        <nav
          aria-label="Visual QA skill navigation"
          className="hidden border-r border-[#8bd3ff]/25 bg-[#064987]/85 p-3 lg:block"
        >
          <div className="flex h-full flex-col items-center gap-3">
            {navItems.map(([label, icon]) => (
              <button
                key={label}
                type="button"
                className={`flex h-12 w-12 items-center justify-center rounded-xl border text-lg font-black shadow-md ${
                  label === "Skill"
                    ? "border-white bg-white text-[#075aa4]"
                    : "border-white/20 bg-[#0b67b8] text-white"
                }`}
                aria-label={label}
              >
                {icon}
              </button>
            ))}
            <div className="mt-auto h-10 w-10 rounded-full border border-white/30 bg-[#0b67b8]" />
          </div>
        </nav>

        <section className="relative min-h-0 overflow-hidden px-3 py-3 sm:px-5 sm:py-5 lg:px-6">
          <div className="absolute inset-0 bg-[#0a6fbe]" />
          <div className="absolute left-24 top-10 hidden h-64 w-72 rounded-[28px] border-4 border-[#7fc8f8] bg-[#c9f0ff] shadow-2xl shadow-sky-950/30 lg:block">
            <div className="grid h-full grid-cols-2 grid-rows-2 gap-2 p-4">
              <span className="rounded-2xl bg-white/75" />
              <span className="rounded-2xl bg-white/55" />
              <span className="rounded-2xl bg-white/60" />
              <span className="rounded-2xl bg-white/70" />
            </div>
          </div>
          <div className="absolute left-28 bottom-20 hidden lg:block">
            <MascotImage
              pose={mascotPose}
              size="xl"
              alt="Fuxie skill stage mascot"
              className="drop-shadow-2xl"
            />
          </div>
          <div className="absolute right-4 top-4 z-0 lg:hidden">
            <MascotImage
              pose={mascotPose}
              size="sm"
              alt="Fuxie skill stage mascot"
              className="opacity-90 drop-shadow-xl"
            />
          </div>
          <div className="absolute inset-x-0 bottom-0 h-24 bg-[#064987]" />
          <div className="relative mx-auto grid h-full max-w-6xl min-h-0 gap-4 lg:grid-cols-[minmax(0,1fr)_250px]">
            <div
              data-role={stateRole}
              className="min-h-0 min-w-0 overflow-hidden rounded-[22px] border border-[#b7e9ff] bg-[#eaf8ff] p-3 text-slate-950 shadow-2xl shadow-sky-950/35 sm:p-5"
            >
              <p className="mb-2 text-xs font-black uppercase tracking-normal text-[#3c78a8]">
                {subtitle}
              </p>
              {children}
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <PrimaryCta>{ctaLabel}</PrimaryCta>
                {secondaryLabel ? (
                  <PrimaryCta variant="secondary">{secondaryLabel}</PrimaryCta>
                ) : null}
              </div>
            </div>

            <aside className="hidden min-h-0 min-w-0 overflow-hidden rounded-[22px] border border-[#b7e9ff] bg-[#eaf8ff] p-4 text-slate-900 shadow-xl shadow-sky-950/25 lg:block">
              <MascotImage
                pose={mascotPose}
                size="md"
                alt="Fuxie skill guide"
                className="mx-auto flex justify-center"
              />
              <div className="mt-4 rounded-2xl border border-sky-100 bg-white p-4">
                <p className="text-sm font-black text-slate-900">Fuxie hilft</p>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  Deterministic visual QA surface for 1440 x 900 and 390 x 844.
                </p>
              </div>
            </aside>
          </div>
        </section>

        <nav
          aria-label="Visual QA mobile navigation"
          className="flex items-center justify-around border-t border-[#8bd3ff]/25 bg-[#064987] px-2 lg:hidden"
        >
          {navItems.map(([label, icon]) => (
            <button
              key={label}
              type="button"
              className={`flex h-11 w-14 flex-col items-center justify-center rounded-xl text-xs font-black ${
                label === "Skill" ? "bg-[#2ec4b6] text-white" : "text-white/85"
              }`}
              aria-label={label}
            >
              <span className="text-base leading-none">{icon}</span>
              <span className="text-[10px] leading-none">{label}</span>
            </button>
          ))}
        </nav>
      </div>
    </main>
  );
}

function Meter({
  value,
  label,
  tone = "bg-emerald-400",
}: {
  value: number;
  label: string;
  tone?: string;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3 text-sm font-bold">
        <span>{label}</span>
        <span>{value}%</span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full ${tone}`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
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
            The learner completed the daily vocabulary target with stable
            flashcard identity, meaning panel, and mastery counter.
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
        {["der Termin", "puenktlich", "wiederholen"].map((word) => (
          <div
            key={word}
            className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm"
          >
            <p className="text-lg font-black text-slate-900">{word}</p>
            <p className="mt-1 text-sm text-slate-500">A2 daily set</p>
          </div>
        ))}
      </div>
    </SkillFixtureShell>
  );
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
        <div
          data-role="grammar-diagram"
          className="rounded-2xl bg-violet-50 p-5"
        >
          <p className="text-sm font-bold text-violet-700">Pattern diagram</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {["Ich helfe", "dem Freund", "nach dem Kurs"].map((part, index) => (
              <div
                key={part}
                className={`rounded-xl border-2 p-4 text-center text-sm font-black ${
                  index === 1
                    ? "border-rose-300 bg-rose-50 text-rose-700"
                    : "border-violet-200 bg-white text-violet-800"
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
            Use Dativ after helfen: dem Freund, not den Freund. The feedback
            panel stays attached to the rule and keeps one retry path.
          </p>
        </div>
      </div>
    </SkillFixtureShell>
  );
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
      <div
        data-role="waveform-player"
        aria-busy="true"
        className="rounded-2xl bg-cyan-50 p-5"
      >
        <div className="flex h-28 items-end gap-2 overflow-hidden rounded-2xl bg-white p-4">
          {[42, 68, 34, 82, 55, 74, 38, 62, 88, 46, 70, 40].map(
            (height, index) => (
              <span
                key={`${height}-${index}`}
                className="flex-1 animate-pulse rounded-full bg-cyan-300"
                style={{
                  height: `${height}%`,
                  animationDelay: `${index * 80}ms`,
                }}
              />
            ),
          )}
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {["Audio wird geladen", "Transcript bereit", "Fragen gesperrt"].map(
            (label) => (
              <div
                key={label}
                className="rounded-xl border border-cyan-100 bg-white p-3 text-sm font-bold text-slate-700"
              >
                {label}
              </div>
            ),
          )}
        </div>
      </div>
    </SkillFixtureShell>
  );
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
        <div
          data-role="pronunciation-meter"
          className="rounded-2xl border border-rose-200 bg-rose-50 p-5"
        >
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
            {["moechte", "einen", "Termin"].map((sound) => (
              <span
                key={sound}
                className="rounded-full bg-rose-100 px-3 py-1 text-sm font-bold text-rose-700"
              >
                {sound}
              </span>
            ))}
          </div>
        </div>
      </div>
    </SkillFixtureShell>
  );
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
          <p className="text-sm font-black text-emerald-700">
            Threshold reached
          </p>
          <p className="mt-2 text-4xl font-black text-emerald-600">86%</p>
          <p className="mt-2 text-sm leading-6 text-slate-700">
            All core questions are correct; the learner can continue without
            losing passage context.
          </p>
        </div>
      </div>
    </SkillFixtureShell>
  );
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
        <div
          data-role="editor-canvas"
          className="min-h-[260px] rounded-2xl border border-orange-100 bg-white p-5 shadow-inner"
        >
          <p className="text-sm font-bold text-slate-500">Draft editor</p>
          <p className="mt-4 break-words text-base leading-8 text-slate-800">
            Sehr geehrte Damen und Herren, ich schreibe wegen meines Termins.
            Ich kann am Freitag nicht kommen und brauche einen neuen Vorschlag.
          </p>
          <span className="mt-4 inline-flex h-6 w-1 animate-pulse rounded-full bg-orange-500" />
        </div>
        <aside
          data-role="writing-structure-feedback"
          className="rounded-2xl border border-orange-200 bg-orange-50 p-5"
        >
          <p className="text-sm font-black text-orange-700">
            Missing requirement
          </p>
          <ul className="mt-3 space-y-3 text-sm leading-6 text-slate-700">
            <li>Opening greeting found</li>
            <li>Reason found</li>
            <li className="font-bold text-orange-700">
              Closing sentence missing
            </li>
          </ul>
        </aside>
      </div>
    </SkillFixtureShell>
  );
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
            <span className="text-sm font-bold text-slate-500">
              Frage 18 von 30
            </span>
          </div>
          <div className="mt-5 rounded-2xl bg-white p-5">
            <p className="text-sm font-bold text-slate-500">Question locked</p>
            <p className="mt-2 text-lg font-black text-slate-900">
              The exam chrome remains visible while the timeout decision is
              required.
            </p>
          </div>
        </div>
        <div
          data-role="exam-timeout-dialog"
          className="rounded-2xl border border-rose-200 bg-rose-50 p-5 shadow-lg"
          role="alertdialog"
          aria-labelledby="exam-timeout-title"
        >
          <p
            id="exam-timeout-title"
            className="text-xl font-black text-rose-700"
          >
            Zeit ist abgelaufen
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-700">
            Submit the saved answers now, restart the attempt, or return to the
            overview.
          </p>
          <div className="mt-4 flex flex-wrap gap-2 text-xs font-bold text-rose-700">
            <span className="rounded-full bg-white px-3 py-1">
              Autosave active
            </span>
            <span className="rounded-full bg-white px-3 py-1">
              Retry available
            </span>
          </div>
        </div>
      </div>
    </SkillFixtureShell>
  );
}
