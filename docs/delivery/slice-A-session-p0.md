# Slice A — Session P0: real audio + honest chrome

Owner: Claude (spec/QC) → Antigravity (implement). Date: 2026-06-03.
Model: `.agents/workflows/three-agent-delivery-model.md`. Assets: none new (`docs/design/asset-reuse-map.md`).

## Context & Goal

The daily "Session" is the dashboard's primary CTA (`components/dashboard/DashboardMockupClient.tsx:42` → `/session`) yet is the lowest-quality learner surface. It ships **fake audio** (a speaker button with no handler + a hardcoded "waveform"), a **misleading always-on tip**, a **hardcoded level**, and **dead chrome** (a non-functional timer + reset). Goal: make the Session honest and real so the most-used daily loop stops feeling like a mock. No scoring/hearts/results logic changes.

Primary files:
- `apps/web/src/components/session/exercises/MultipleChoice.tsx`
- `apps/web/src/components/session/SessionPlayer.tsx`

Do NOT change: `handleNext`/hearts/score logic (`SessionPlayer.tsx:80-107`), the start/complete API calls (`:69,112`), `SessionResultScreen`, or `lib/session/types.ts` shapes.

## Requirements (SHALL, testable)

- **R-1 — Real audio or none.** When `vocabData.audioUrl` is a non-empty string, the listening MC SHALL play that audio on mount (once) and on speaker-button tap. When there is no real audio source, the component SHALL NOT render a speaker button, waveform, or "HÖREN" framing — it SHALL show the existing text card (`MultipleChoice.tsx:200-213`).
- **R-2 — Remove the mock-audio hack.** The `?mockAudio=true` query param that fakes audio presence (`MultipleChoice.tsx:81-88`) SHALL be removed; `hasAudio` SHALL derive solely from `!isGrammar && !!vocabData.audioUrl`.
- **R-3 — Honest waveform + label.** The audio visualizer SHALL reflect real playback (animate only while playing; idle otherwise) — no static array presented as a live waveform (`MultipleChoice.tsx:186-198`). The exercise badge SHALL read "HÖREN" only for audio items; for non-audio vocab it SHALL read "WORTSCHATZ" and for grammar "GRAMMATIK" (`MultipleChoice.tsx:125-128`).
- **R-4 — No misleading tip.** The always-on hardcoded tip "Tipp: Achte auf den Artikel!" (`MultipleChoice.tsx:246-250`) SHALL be removed (it is wrong for non-article questions). If `GrammarExerciseData.explanation` exists, it MAY be shown only after the answer is checked; otherwise show nothing.
- **R-5 — Real level.** The session level badge and the "DEIN WEG" chip SHALL display the real `level` prop, not hardcoded "A1" (`SessionPlayer.tsx:210`, `:439`).
- **R-6 — Real timer, no dead control.** The "Session-Zeit" readout SHALL show real elapsed time counting up from session start (mm:ss); the no-op "Zurücksetzen" button SHALL be removed (`SessionPlayer.tsx:410-416`).
- **R-7 — No dead-button affordances (de-scope-safe).** The left icon nav rail (`SessionPlayer.tsx:257-278`) SHALL NOT present clickable affordances that do nothing: either wire each to its route (with the existing quit pattern) OR render as non-interactive scenery (no hover/cursor-pointer, `aria-hidden`). Default to non-interactive scenery; real in-session nav is a separate product decision.
- **R-8 — Distractor quality (stretch; may split).** The deterministic hardcoded Vietnamese distractors (`MultipleChoice.tsx:38-78`) can produce semantically wrong choices. Correct fix: the session source SHALL provide real `options` (same-theme words) from the builder/API (`lib/session/builder.ts`, `/api/v1/session/start`). If that change is non-trivial, split into Slice A-2 and leave a `// TODO(slice-A-2)` — do NOT silently keep fabricated distractors as the long-term answer.
- **R-NF — No regressions.** Hearts, scoring, progress, and results behave exactly as before. `pnpm check:quick`, `pnpm test:core`, and `pnpm build` pass.

## Tech Design

Reuse the repo's audio idiom (single `<audio>` element + ref, like `components/listening/lesson-player.tsx`). Concretely in `MultipleChoice.tsx`:
- Add `const audioRef = useRef<HTMLAudioElement>(null)` and `const [isPlaying, setIsPlaying] = useState(false)`.
- Render a hidden `<audio ref={audioRef} src={vocabData.audioUrl ?? undefined} preload="auto" onPlay={() => setIsPlaying(true)} onPause={() => setIsPlaying(false)} onEnded={() => setIsPlaying(false)} />` when `hasAudio`.
- Speaker button `onClick={() => audioRef.current?.play()}`; autoplay once in a `useEffect` on mount when `hasAudio` (guard against double-play; respect that browsers may block autoplay — failure is silent, button still works).
- Waveform bars: gate the existing bars with `className={isPlaying ? 'animate-pulse' : 'opacity-40'}` (or a small per-bar staggered keyframe) so motion only happens while playing. Keep it clearly a decorative equalizer, not a claim of the real signal.
- `hasAudio = !isGrammar && !!vocabData.audioUrl` (delete `mockAudio` state + effect).
- Badge label: compute from `isGrammar`/`hasAudio` (HÖREN | WORTSCHATZ | GRAMMATIK).
- Delete the tip block at `:246-250` (optionally replace with post-check `grammarData.explanation`).

In `SessionPlayer.tsx`:
- Replace hardcoded `A1` at `:210` and `:439` with `{level}` (already a prop, `:43`).
- Timer: add `const [elapsed, setElapsed] = useState(0)` + `useEffect` with `setInterval(() => setElapsed(e => e + 1), 1000)` that runs while `!isFinished` and clears on unmount; format `mm:ss`; render at `:413`. Remove the button at `:415`.
- Nav rail `:257-278`: drop `cursor-pointer`/hover classes and the `<button>` role → render as a static `<div>` list with `aria-hidden="true"`, OR wire `onClick` to `router.push(...)`. Pick the scenery option unless the owner asks for real nav.

Data contract (confirmed): `VocabExerciseData.audioUrl?: string | null` (`lib/session/types.ts:12`).

## Asset plan

**No new assets.** Mascot poses and world/dojo props already resolve via `FUXIE_MASCOT_STATES` / `FUXIE_WORLD_PROPS` (`lib/mascot/fuxie-assets.ts`). Audio is data (`vocabData.audioUrl`), not a render. Codex: none.

## Task List (Antigravity)

- **T-1** (R-2, R-1): Remove `mockAudio`; set `hasAudio = !isGrammar && !!vocabData.audioUrl`. Map → R-1,R-2.
- **T-2** (R-1, R-3): Add `<audio>` ref + `isPlaying`; wire speaker `onClick` + autoplay-once; gate waveform animation on `isPlaying`. Map → R-1,R-3.
- **T-3** (R-3): Compute badge label HÖREN/WORTSCHATZ/GRAMMATIK. Map → R-3.
- **T-4** (R-4): Delete the hardcoded tip block (optional post-check explanation). Map → R-4.
- **T-5** (R-5): `level` prop into badge `:210` and DEIN WEG chip `:439`. Map → R-5.
- **T-6** (R-6): Real elapsed timer; remove reset button. Map → R-6.
- **T-7** (R-7): Make nav rail non-interactive scenery (or wire routes). Map → R-7.
- **T-8** (R-8, stretch): Investigate builder/API distractors; fix at source or split to Slice A-2 with TODO. Map → R-8.
- **T-9** (R-NF): Run gates; confirm hearts/score/results unchanged.

## Acceptance / QC checklist (Claude verifies)

1. Item **with** `audioUrl`: speaker plays on tap; autoplays once on mount; waveform animates only while playing; badge = HÖREN.
2. Item **without** `audioUrl`: no speaker/waveform; text card shown; badge = WORTSCHATZ (vocab) / GRAMMATIK (grammar).
3. `/session?mockAudio=true` no longer fabricates audio.
4. No "Tipp: Achte auf den Artikel!" on non-article questions.
5. An A2+ session shows the real level (not "A1") in header and DEIN WEG.
6. Timer counts up; no "Zurücksetzen" button.
7. Nav rail shows no dead clickable buttons.
8. Hearts/score/results identical to before; `pnpm check:quick`, `pnpm test:core`, `pnpm build` green.

## Antigravity prompt (copy-paste)

```
ROLE: You are the Frontend Engineer for Fuxie (Next.js App Router, TypeScript, Tailwind), executing a fixed spec. Do not make product/UX decisions; if a requirement is ambiguous, stop and ask.

OBJECTIVE: Make the daily "Session" honest and real (Slice A). Remove fake audio, the misleading tip, hardcoded level, and dead timer chrome — without changing scoring/hearts/results.

REPO CONTEXT: Repo root C:\Users\DMF Schule\9-Fuxie, app at apps/web. Read the full spec docs/delivery/slice-A-session-p0.md and the working rules .agents/workflows/three-agent-delivery-model.md. Files to change: apps/web/src/components/session/exercises/MultipleChoice.tsx and apps/web/src/components/session/SessionPlayer.tsx. Audio idiom reference: apps/web/src/components/listening/lesson-player.tsx. Data shape: apps/web/src/lib/session/types.ts (VocabExerciseData.audioUrl). DO NOT touch handleNext/hearts/score (SessionPlayer.tsx:80-107), start/complete API calls, SessionResultScreen, or session types.

TASKS: Implement T-1..T-9 exactly as written in the spec. Reuse existing assets/registry; render no new assets. For T-8 (distractors), if the builder/API fix is non-trivial, leave a // TODO(slice-A-2) and report it rather than keeping fabricated distractors silently.

ACCEPTANCE: All 8 QC items in the spec pass. Run pnpm check:quick, pnpm test:core, and pnpm build; all green. No files changed beyond the two named (plus builder/API only if you do T-8).

REPORT FORMAT: (1) per-task done/blocked with the diff hunks; (2) gate outputs (pass/fail); (3) any ambiguity you hit; (4) confirmation that hearts/score/results are unchanged; (5) screenshots or the exact dev URL+params to view an audio item and a no-audio item.
```

## Codex prompt

None — no new assets for this slice.
