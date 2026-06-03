# Phase 34 — Learning Experience Audit & Mock-Parity Strategy

Date: 2026-06-03
Vai chinh: Product Manager EdTech
Vai phoi hop: Product Designer (UX/UI), Frontend Engineer, QA Automation

Scope: top-to-bottom survey of the Fuxie learning experience, the motivation/"wow"
layer, and whether production matches the "Fuxie Quest Worlds V2" mockup. Evidence
is cited as `path:line`. Production = what a real authenticated learner renders.

## Executive verdict

| Question | Answer |
| --- | --- |
| Is the learning experience good? | The six dedicated skill modules are genuinely strong (4–5/5). The **daily "Session"** — the front door from the dashboard START button — is the weakest surface (2/5) and the one most learners hit every day. |
| Is it "wow" enough? | Wow at the per-skill level, **not** in the main daily loop (Dashboard → Session → reward). The dashboard looks like Quest Worlds but is hollow at its reward core; the 3D mascot — the headline differentiator — is **lab-only**. |
| Does it match the mockup? | Mostly **no, in production**. The `visual-mocktest-parity` branch (46 commits) changed **one dev-only fixture file**. Only the **Dashboard** and part of the **Course path** match the mockup in production. |

## 1. Product & architecture

Fuxie — German (CEFR A1–C2) learning for Vietnamese learners. North Star: weekly
meaningful CEFR progress; B2C self-study first. Monorepo (Turbo+pnpm): `apps/web`
(Next.js App Router), `apps/ai-service` (Hono; Gemini + OpenRouter), `services/stt-service`,
`packages/{database,srs-engine,shared,ui}`. Firebase Auth · Neon Postgres · Vercel.
This is a mature, feature-complete platform with a heavy governance/docs culture.

Hygiene note: many uncommitted scratch/log files at repo root (`run_log.txt`,
`gha_job_log.txt`, `qa_report.md`, `out.txt`, `tmp-*.log`…) — gitignore/clean before release.
Security note (non-blocking): `.gemini/memory/project-state.md` holds a plaintext prod DB
password; it is **gitignored and not in git history** (verified) — still worth rotating.

## 2. Learning experience — per module

| Module | Flow complete? | Polish | Biggest issue |
| --- | --- | --- | --- |
| Vocabulary | Yes (7 types, hearts, quest) | 5/5 | `onComplete` no-op; spelling can't grade offline |
| Grammar | Yes (theory→8 types→results) | 5/5 | 🔴 AI grading hardcodes `cefrLevel:'A1'` (`grammar/ExerciseRenderer.tsx:219,517`) |
| Reading | Yes (intro→warmup→exercise) | 5/5 | Submit failure console-only (`reading-player.tsx:234`); no per-question feedback |
| Listening | Yes (custom audio player) | 5/5 | Submit failure console-only (`listening/lesson-player.tsx:284`) |
| Writing | Yes (AI rubric + inline fixes) | 5/5 | No draft autosave; retry wipes essay (`writing-player.tsx:549`) |
| Speaking | Yes (real mic + per-word scoring) | 5/5 | 🔴 hardcodes `level:'A1'` (`NachsprechenPlayer.tsx:251`); score = naive average |
| Review/SRS | Yes (SM-2, Anki rating) | 4/5 | Rating-sync failures silent (`srs/review-client.tsx:242`); optimistic +10 XP |
| **Session (daily)** | Shallow | **2/5** | 🔴 Fake audio, hardcoded distractors/tip, dead chrome (see Slice A) |

### Top 5 cross-cutting weaknesses

1. **Session daily is a fake-audio skeleton** and is the dashboard's primary CTA target (`DashboardMockupClient.tsx:42` → `/session`). → **Slice A**.
2. **Hardcoded CEFR level in AI calls** (Grammar, Speaking) → B1–C2 learners graded as A1.
3. **Submit/sync failures swallowed** (Reading, Listening, Grammar progress, SRS) — no learner-facing error/retry.
4. **No draft persistence** in Writing — refresh/retry destroys minutes of work.
5. **Inconsistent feedback immediacy & brittle scoring** (Reading/Listening defer all feedback; Speaking averages sink on one AI error).

## 3. Motivation / "wow" layer

- **Dashboard** = `DashboardMockupClient` (the mock IS production here): gradient, isometric village board, mascot, hotspots. But **no Fucoin wallet, read-only missions (no claim), no reward reveal**, hardcoded coach copy. The full wallet/claim/`RewardRevealMoment` logic exists in **dead** `dashboard-client.tsx`. → **Slice B**.
- Three dashboards coexist: `DashboardMockupClient` (live), `dashboard-client.tsx` (~90KB dead), `dashboard-backbone-hero.tsx` (empty-state only). Tech debt.
- **Course `/course`**: real winding quest path (4/5) but unlock gating disabled (`page.tsx` `isUnlocked = idx === 0 || true`). **`/campaign`**: a built Quest Campaign Map that is **orphaned** (not in nav).
- **Gamification economy** is real and DB-backed (Fucoin ledger, missions, shop redeem). `RewardRevealMoment` is polished and fires in vocab/listening/exam — but **not** on dashboard or daily-session result (the two highest-traffic surfaces).
- **Mascot**: static WebP everywhere except the listening player (animated 2D sprite). True 3D GLB rig is **lab/QA only** (`/fuxie-live-qa` returns `notFound()` in prod). The living-3D prototype exists (`FUXIE_LIVING_3D_ASSETS`) but is not in the learner flow.
- Onboarding (real placement engine, 3.5/5), Leaderboard (leagues/podium, 4/5), Chat (real Gemini tutor, 4/5): solid, not village-styled.

## 4. Mock-parity finding & STRATEGY DECISION

**Finding.** Branch `codex/visual-mocktest-parity` = 46 commits, **1 file changed**:
`apps/web/src/components/visual-fixtures/slice-2-skill-fixtures.tsx` (+839/−221).
Fixtures are gated `NODE_ENV !== 'production'` + `?fixture=visual-qa&state=…`
(`slice-2-skill-fixtures.tsx:22-31`) — **invisible to real users**. They are
standalone hardcoded JSX, not the real components. Real skill screens diverge
(vocabulary = world map vs fixture flashcard; listening = gamified player vs fixture
booth). Only the Dashboard (and partly Course) match the mockup in production, and
that wiring predates this branch.

**Implication.** Effort spent making fixtures match mocks does **not** move
production toward the mockup. It produces a QA reference, not a shipped UI.

**Decision (recommended).** Adopt this rule going forward:

> A fixture is a **visual QA reference only**. "Mock parity" is considered **done**
> only when the **real production component** matches the approved mock. Parity work
> lands in real components via `docs/delivery/` spec packages (like Slice A/B), not
> by editing fixtures.

Concretely:
1. Keep the slice fixtures as the approved visual target (before/after reference).
2. Stop counting fixture edits as parity progress; track parity per **real screen**.
3. For each screen that should match the mock, write a delivery spec that ports the
   approved styling into the real component (reusing the asset registry).
4. Maintain a parity tracker: [Screen | Mock approved | Prod matches? | Spec link].

**Scope decision — LOCKED 2026-06-03 (owner): "Shell + reward first."**
Align the **shared skill shell** (header / nav / coach panel / reward rail) and the
**reward moments** to the mock across all skill screens; **keep each module's bespoke
interior** (the module interiors are often richer than the mock). This is the high-ROI,
low-risk path. Vehicle: a future `docs/delivery/slice-C-shared-shell-reward-parity.md`.

### Parity tracker (per real production screen)

Parity = **real component matches the approved mock in production** (fixture edits do not count).

| Screen | Mock approved | Prod shell matches? | Prod reward moment? | Spec / status |
| --- | --- | --- | --- | --- |
| Dashboard | Yes (board v2) | Yes (mock IS prod) | No → Slice B | `slice-B-dashboard-wowgap.md` |
| Session (daily) | Yes | Partial (styled, but fake) | No → Slice A | `slice-A-session-p0.md` |
| Vocabulary | Yes (slice-2) | To assess (shell) | Yes (reveal) | Slice C |
| Grammar | Yes (slice-2) | To assess | Yes | Slice C |
| Reading | Yes (slice-2) | To assess | Partial | Slice C |
| Listening | Yes (slice-2) | To assess | Yes | Slice C |
| Writing | Yes (slice-2) | To assess | n/a (AI feedback) | Slice C |
| Speaking | Yes (slice-2) | To assess | Yes | Slice C |
| Course path | Yes | Yes (winding path) | Yes (RewardPreview) | — |

Slice C will: (1) audit the shared skill shell (`SkillPlayerShell`, `FuxieCoach`,
`RewardPreview`, `SkillMotivationRail`, header/nav) against the slice-2 fixture shell;
(2) spec the minimal shell/reward deltas to reach parity in the real components;
(3) leave module interiors untouched.

## 5. Prioritized backlog

- **P0** — Slice A (Session real audio + honest chrome); fix hardcoded `'A1'` in Grammar/Speaking AI; surface submit/sync errors with retry.
- **P1** — Slice B (Dashboard wallet + claimable missions + reward reveal); Writing draft autosave; re-enable Course unlock gating.
- **P2** — Decide mock-parity scope (above); remove dead dashboards; expose or retire `/campaign`; decide 3D-mascot-in-flow; clean root scratch files.

## 6. Delivery handoffs (this cycle)

- `docs/delivery/slice-A-session-p0.md` — Session P0 fix (Antigravity).
- `docs/delivery/slice-B-dashboard-wowgap.md` — Dashboard wow-gap (Antigravity).

Both follow `.agents/workflows/three-agent-delivery-model.md`. Neither needs new
assets (`docs/design/asset-reuse-map.md`).
