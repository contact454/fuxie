# Fuxie Visual Mocktest Pack Production Handoff

Date: 2026-05-22

## Status

The Fuxie Visual Mocktest Pack is closed for production handoff.

- Final audit state: 18/18 waves PASS.
- Queue state: 54/54 jobs PASS.
- Evidence source: `docs/design/fuxie-visual-mocktests/`.
- Master queue: `.kiro/specs/fuxie-visual-mocktest-pack/render-queue.json`.
- Human-readable queue: `.kiro/specs/fuxie-visual-mocktest-pack/render-queue.md`.
- Independent final consistency audit conclusion: `Fuxie Visual Mocktest Pack final state: 18/18 PASS`.
- Slice 0 foundation fixture: `/fuxie-live-qa`, dev-only route, section selector `[data-role="foundation-lock-fixture"]`.
- Slice 1 visual fixture gate: 8/8 Playwright checks PASS on 2026-05-22 for dashboard empty, course loading, session success, and review empty at 1440 x 900 and 390 x 844.
- Slice 2 visual fixture gate: 14/14 Playwright checks PASS on 2026-05-22 for vocabulary success, grammar error, listening loading, speaking error, reading success, writing error, and exam timeout at 1440 x 900 and 390 x 844.
- Slice 3 visual fixture gate: 8/8 Playwright checks PASS on 2026-05-22 for rewards badge unlock, missions complete, chat typing, and profile goal updated at 1440 x 900 and 390 x 844.
- Slice 4 visual fixture gate: 4/4 Playwright checks PASS on 2026-05-22 for teacher overdue assignment and admin filtered-empty at 1440 x 900 and 390 x 844.
- Consolidated Slice 1-4 visual fixture gate: 34/34 Playwright checks PASS on 2026-05-22 with project `chromium-mobile-capture`.
- Production hardening smoke: 5/5 Playwright checks PASS on 2026-05-22 for protected-route redirects, learner/teacher/admin role boundaries, teacher/admin API authorization, and learner read-only motivation endpoints.

The PNG mockups are visual targets and QA references. They are not runtime layout assets unless a later asset-specific task explicitly converts a visual element into an optimized production asset.

## Source Of Truth

Each module folder contains:

- `mock-desktop.png`: desktop reference at 1440 x 900.
- `mock-mobile.png`: mobile reference at 390 x 844.
- `mock-state.png`: one required non-default state reference.
- `implementation-notes.md`: layout, tokens, responsive rules, chosen state, and accessibility notes.
- `generation-prompt.md`: provenance, visual identity cues, and originality guardrails.
- `qa-checklist.md`: Visual Target Score, PASS gate result, residual risk, and QA sign-off.

Implementation must treat `implementation-notes.md` as the practical build brief and `qa-checklist.md` as the acceptance gate for each module.

## Pack Acceptance Criteria For Frontend

Every implemented surface must satisfy these gates before visual sign-off:

- Desktop viewport at 1440 x 900 renders the primary layout without overlap.
- Mobile viewport at 390 x 844 has no horizontal overflow.
- Header or top chrome stays compact on mobile, targeting <= 64 px where the module brief requires it.
- Exactly one primary CTA is visually dominant in the main task state.
- The chosen `mock-state.png` state exists in production as an accessible UI state.
- Body text and controls are rechecked on live DOM for WCAG contrast and wrapping.
- Long German strings, dynamic user names, emails, labels, and chips do not break the layout.
- Production UI uses existing app components and tokens before adding new primitives.

## Shared Foundations

These shared pieces should be hardened before broad module work:

| Foundation | Existing app targets | Production expectation |
| --- | --- | --- |
| App shell | `apps/web/src/components/shared/sidebar.tsx`, `apps/web/src/components/shared/mobile-shell.tsx`, `apps/web/src/app/(learn)/layout.tsx`, `apps/web/src/app/teacher/layout.tsx`, `apps/web/src/app/admin/layout.tsx` | Consistent desktop nav, mobile chrome, active module identity, and safe bottom spacing. |
| Primary CTA | `apps/web/src/components/ui/primary-cta.tsx`, `apps/web/src/components/ui/fuxie-ui.tsx` | One clear primary action per surface; variants must work on light, soft-sky, and dense operational panels. |
| State shell | `apps/web/src/components/gamification/state-shell.tsx` | Shared empty, locked, loading/error-adjacent state composition with mascot role, primary action, and optional secondary exit. |
| Skill shell | `apps/web/src/components/gamification/skill-player-shell.tsx` | Shared frame for reading, listening, speaking, and writing player states. |
| Mascot and props | `apps/web/src/components/gamification/mascot-role-host.tsx`, `apps/web/src/components/shared/mascot-image.tsx` | Mascot supports task meaning; decorative props stay secondary to learning actions. |
| Tokens | `apps/web/src/app/globals.css`, `apps/web/src/components/ui/fuxie-ui.tsx`, `packages/ui/src/tokens/index.ts` | Bright Sky base palette plus module accents; normalize generated PNG lighting into exact CSS tokens. |

## Module Production Matrix

| Mock folder | Target route or surface | Existing implementation anchors | Required production state | Main component work |
| --- | --- | --- | --- | --- |
| `00-style-master` | Shared design system, no direct app route | `apps/web/src/components/ui/fuxie-ui.tsx`, `apps/web/src/components/ui/primary-cta.tsx`, `apps/web/src/components/gamification/state-shell.tsx`, `apps/web/src/app/globals.css` | Style specimen / token validation state | Lock tokens, CTA hierarchy, cards, chips, state shell, radius/shadow tiers, typography scale. |
| `01-dashboard` | `/dashboard` under `(learn)` | `apps/web/src/app/(learn)/dashboard/page.tsx`, `apps/web/src/components/dashboard/dashboard-client.tsx`, `apps/web/src/components/dashboard/dashboard-backbone-hero.tsx` | Empty state: no session today | Keep daily plan, progress ring, next action, and reward/motivation panels scannable in first viewport. |
| `02-course` | `/course` under `(learn)` | `apps/web/src/app/(learn)/course/page.tsx`, `apps/web/src/components/course/CourseClient.tsx`, `apps/web/src/components/course/course-node.tsx`, `apps/web/src/components/course/course-module-cluster.tsx` | Loading state: loading catalog | Course path, CEFR badge, module cluster, and level switching must remain readable on mobile. |
| `03-session` | `/session` under `(learn)` | `apps/web/src/app/(learn)/session/page.tsx`, `apps/web/src/components/session/SessionPlayer.tsx`, `apps/web/src/components/session/SessionResultScreen.tsx` | Success state: session completed | Start arrow, active exercise frame, progress strip, and completion reward state. |
| `04-review` | `/review` under `(learn)` | `apps/web/src/app/(learn)/review/page.tsx`, `apps/web/src/components/review/review-backbone-hero.tsx`, `apps/web/src/components/srs/review-client.tsx` | Empty state: no item due | Flip-card review queue, due/overdue counters, calm empty state, and review CTA. |
| `05-vocabulary` | `/vocabulary`, `/vocabulary/practice`, `/vocabulary/practice/[type]` | `apps/web/src/components/vocabulary/vocabulary-client.tsx`, `apps/web/src/components/vocabulary/practice-hub.tsx`, `apps/web/src/components/vocabulary/vocabulary-card.tsx`, `apps/web/src/components/vocabulary/exercises/*` | Success state: learned 10 words | Flashcard identity, collection book framing, practice CTA, result feedback, and mastery counter. |
| `06-grammar` | `/grammar`, `/grammar/[topicSlug]`, `/grammar/[topicSlug]/[lessonId]`, `/grammar/mocktest` | `apps/web/src/components/grammar/GrammarClient.tsx`, `apps/web/src/components/grammar/LessonPlayer.tsx`, `apps/web/src/components/grammar/ExerciseRenderer.tsx`, `apps/web/src/components/grammar/diagrams/*` | Error state: common pattern mistake with detailed feedback | Grammar diagram prop, rule explanation, exercise feedback, and correction panel. |
| `07-listening` | `/listening`, `/listening/[lessonId]` | `apps/web/src/components/listening/listening-client.tsx`, `apps/web/src/components/listening/lesson-player.tsx`, `apps/web/src/components/listening/listening-skill-shell.tsx` | Loading state: loading audio | Headphone/waveform identity, audio loading, transcript/question layout, retry-safe audio state. |
| `08-speaking` | `/speaking`, `/speaking/[lessonId]`, roleplay subroutes | `apps/web/src/components/speaking/SpeakingClient.tsx`, `apps/web/src/components/speaking/SpeakingLessonPlayer.tsx`, `apps/web/src/components/speaking/AudioRecorder.tsx`, `apps/web/src/components/speaking/roleplay-stage.tsx` | Error state: pronunciation mismatch with retry | Microphone identity, scoring meter, target sound feedback, record/retry loop, permission state. |
| `09-reading` | `/reading`, `/reading/[exerciseId]` | `apps/web/src/components/reading/reading-client.tsx`, `apps/web/src/components/reading/reading-player.tsx`, `apps/web/src/components/reading/reading-skill-shell.tsx` | Success state: comprehension threshold reached | Reading passage + question split, open-book identity, answer state, and success feedback. |
| `10-writing` | `/writing`, `/writing/[exerciseId]` | `apps/web/src/components/writing/writing-client.tsx`, `apps/web/src/components/writing/writing-player.tsx`, `apps/web/src/components/writing/writing-skill-shell.tsx` | Error state: missing structure requirement with inline feedback | Editor canvas, draft cursor, structure hints, inline requirement feedback, and submit state. |
| `11-exam` | `/exam`, `/exam/[examId]`, `/exam/[examId]/result/[attemptId]` | `apps/web/src/components/exam/ExamListClient.tsx`, `apps/web/src/components/exam/ExamSessionClient.tsx`, `apps/web/src/components/exam/ExamInProgressChrome.tsx`, `apps/web/src/components/exam/ExamResultClient.tsx` | Error state: timeout before submit with retry/submit options | Timer, question navigation, formal exam chrome, timeout dialog, submit/retry/overview exits. |
| `12-rewards` | `/rewards/shop`, `/badges` | `apps/web/src/components/gamification/shop-catalog-client.tsx`, `apps/web/src/components/gamification/shop-backbone-client.tsx`, `apps/web/src/app/(learn)/badges/page.tsx` | Success state: badge unlock reveal | Fucoin, badge shelf, trophy/coin identity, unlock modal, wallet and inventory states. |
| `13-missions` | Dashboard mission area inside `/dashboard`; no standalone `/missions` route in first production slice | `apps/web/src/app/(learn)/dashboard/page.tsx`, `apps/web/src/components/dashboard/dashboard-client.tsx`, `apps/web/src/app/api/v1/missions/route.ts`, `apps/web/src/app/api/v1/missions/[missionId]/claim/route.ts` | Empty state: all daily missions complete | Mission cards, progress bars, weekly trail, claim CTA, completed-day empty state. Use Dashboard as the canonical missions surface until analytics show a need for a standalone route. |
| `14-chat` | `/chat` under `(learn)` | `apps/web/src/app/(learn)/chat/page.tsx`, `apps/web/src/components/chat/ChatClient.tsx`, `apps/web/src/components/chat/ChatHistory.tsx`, `apps/web/src/components/chat/VoiceInput.tsx` | Loading state: tutor typing indicator | Conversation bubbles, composer, disabled send state, typing indicator, stop action. |
| `15-profile` | New learner `/profile` route under `(learn)` | `apps/web/src/app/(auth)/onboarding/page.tsx`, `apps/web/src/app/(learn)/dashboard/page.tsx`, shared learner app shell, profile data from `userProfile` | Success state: personal goal updated | Avatar + goal flag identity, goal cards, progress metrics, edit-goal modal/success state. Create `/profile` as the canonical learner goal/profile management surface, with dashboard linking into it. |
| `16-teacher` | `/teacher`, `/teacher/classrooms`, `/teacher/classrooms/[id]`, `/teacher/students/[id]` | `apps/web/src/app/teacher/page.tsx`, `apps/web/src/app/teacher/classrooms/ClassroomsClient.tsx`, `apps/web/src/app/teacher/classrooms/[id]/ClassroomDetailClient.tsx` | Error state: overdue assignment list + nudge action | Roster table, assignment chips, student progress, overdue dialog, reminder CTA. |
| `17-admin` | `/admin`, `/admin/users`, related admin operations pages | `apps/web/src/app/admin/page.tsx`, `apps/web/src/app/admin/AdminLayoutClient.tsx`, `apps/web/src/app/admin/users/page.tsx`, `apps/web/src/app/admin/users/UserAnalyticsClient.tsx` | Empty state: filter returns no users, suggest reset | Dense data table, filter rail, active filter chips, search, user create CTA, no-results reset state. |

## Implementation Slices

### Slice 0 - Foundation Lock

Owner: Frontend Engineer with Product Designer review.

Scope:

- `00-style-master`.
- Shared CTA, cards, chips, state shell, shell spacing, tokens, mobile nav constraints.
- Do not start module-specific polish until shared primitives support desktop and mobile gates.

Exit criteria:

- Shared components can render one default, one empty, one error, and one success-like state without layout shift.
- Mobile width 390 px is safe for CTA labels and chips.
- Visual QA fixture or Storybook-equivalent page exists, or a temporary local QA route is documented.

Execution brief:

- Audit `PrimaryCta`, `StateShell`, learner shell, teacher shell, admin shell, and base token sources before adding new UI primitives.
- Add or update the smallest possible visual QA fixture that demonstrates one primary CTA, chip row, card stack, empty state, error state, and success-like state at 390 x 844 and 1440 x 900. Current fixture lives at `/fuxie-live-qa` and exposes `[data-role="foundation-lock-fixture"]`.
- Lock the acceptance selectors or test hooks needed for later Playwright checks: primary CTA visibility, state shell role, no horizontal overflow, and active navigation identity.
- Do not refactor module-specific screens in Slice 0 unless a shared primitive cannot pass the foundation gate without it.

### Slice 1 - Learner Navigation And Core Progression

Owner: Frontend Engineer with Product Manager EdTech review.

Scope:

- `01-dashboard`, `02-course`, `03-session`, `04-review`.
- Build the repeat-study loop: dashboard next action, course path, session start/finish, review due/empty state.

Exit criteria:

- Desktop and mobile screenshots captured for all four surfaces.
- State coverage exists for dashboard empty, course loading, session success, and review empty.
- No horizontal overflow at 390 x 844.

Execution evidence:

- Dev-only fixture routes:
  - `/dashboard?state=empty&fixture=visual-qa`
  - `/course?state=loading&fixture=visual-qa&level=A2`
  - `/session?state=success&fixture=visual-qa&level=A1`
  - `/review?state=empty&fixture=visual-qa`
- Automation: `tests/integration/slice-1-visual-fixtures.pw.spec.ts`.
- Last independent QA run: 2026-05-22, `PLAYWRIGHT_AUTOSTART_WEB=1` with project `chromium-mobile-capture`, result `8 passed`.
- Screenshot evidence path: `tmp/browser-qa/slice-1-visual-fixtures/`.
- Residual risks to carry forward: system font variance can affect the CLS budget under weak network, and mascot image loading must be rechecked when switching from local assets to CDN URLs.
- This closes the visual fixture gate for Slice 1 only; production hardening and live data edge cases remain part of normal route implementation.

### Slice 2 - Skill Player Surfaces

Owner: Frontend Engineer with QA Automation Engineer review.

Scope:

- `05-vocabulary`, `06-grammar`, `07-listening`, `08-speaking`, `09-reading`, `10-writing`, `11-exam`.
- Prioritize shell reuse for common progress, result, error, loading, retry, and feedback states.

Exit criteria:

- Each skill route has one primary CTA in default state.
- Each chosen state from the mock pack is implemented and reachable with deterministic test data.
- Audio, recording, timeout, and submit states have explicit failure handling.

Execution evidence:

- Dev-only fixture routes:
  - `/vocabulary?state=success&fixture=visual-qa`
  - `/grammar/akkusativ-dativ/visual-lesson?state=error&fixture=visual-qa`
  - `/listening/visual-audio-loading?state=loading&fixture=visual-qa`
  - `/speaking/visual-pronunciation?state=error&fixture=visual-qa`
  - `/reading/visual-comprehension?state=success&fixture=visual-qa`
  - `/writing/visual-structure?state=error&fixture=visual-qa`
  - `/exam/visual-a2?state=timeout&fixture=visual-qa`
- Automation: `tests/integration/slice-2-skill-fixtures.pw.spec.ts`.
- Last Codex run: 2026-05-22, `PLAYWRIGHT_AUTOSTART_WEB=1` with project `chromium-mobile-capture`, result `14 passed`.
- Screenshot evidence path: `tmp/browser-qa/slice-2-skill-fixtures/`.
- Metadata guard: dynamic fixture routes bypass Prisma-backed metadata lookups so the visual gate can run without a seeded local database.
- Residual risks to carry forward: real audio buffering, microphone permissions, pronunciation scoring quality, writing feedback latency, exam autosave, and long German copy still require live-flow testing beyond deterministic visual fixtures.
- This closes the visual fixture gate for Slice 2 only; live backend contracts, real media, and scoring systems remain part of production hardening.

### Slice 3 - Motivation And Personal Layer

Owner: Product Designer with Frontend Engineer implementation.

Scope:

- `12-rewards`, `13-missions`, `14-chat`, `15-profile`.
- Missions route decision: ship as Dashboard mission area first, backed by the existing missions API.
- Profile route decision: create learner `/profile` as the canonical place to edit goals and profile settings.

Exit criteria:

- Rewards unlock state, missions completed state, chat typing state, and profile goal-updated state are implemented.
- Wallet, badge, mission, and profile copy is checked for long German strings.
- No new decorative visual language is introduced outside the approved Fuxie Bright Sky system.

Execution evidence:

- Dev-only fixture routes:
  - `/badges?state=success&fixture=visual-qa`
  - `/dashboard?state=empty&fixture=visual-qa&module=missions`
  - `/chat?state=loading&fixture=visual-qa`
  - `/profile?state=success&fixture=visual-qa`
- Automation: `tests/integration/slice-3-motivation-fixtures.pw.spec.ts`.
- Last Codex run: 2026-05-22, `PLAYWRIGHT_AUTOSTART_WEB=1` with project `chromium-mobile-capture`, result `8 passed`.
- Screenshot evidence path: `tmp/browser-qa/slice-3-motivation-fixtures/`.
- Metadata guard: dev-only visual QA fixture requests are allowed through middleware without production exposure.
- Residual risks to carry forward: live reward inventory, mission claim timing, AI tutor streaming, and persisted profile editing still require live-flow testing beyond deterministic visual fixtures.
- This closes the visual fixture gate for Slice 3 only; production data contracts and interactive persistence remain part of production hardening.

### Slice 4 - Staff And Operations

Owner: Frontend Engineer with Product Manager EdTech and QA review.

Scope:

- `16-teacher`, `17-admin`.
- Teacher roster/assignments and admin user-management/data operations.

Exit criteria:

- Teacher overdue assignment dialog and admin filtered-empty state are implemented.
- Role boundary smoke tests cover learner, teacher, and admin route access.
- Tables collapse or transform safely on mobile without truncating critical actions.

Execution evidence:

- Dev-only fixture routes:
  - `/teacher?state=error&fixture=visual-qa`
  - `/admin?state=empty&fixture=visual-qa`
- Automation: `tests/integration/slice-4-staff-fixtures.pw.spec.ts`.
- Last Codex run: 2026-05-22, `PLAYWRIGHT_AUTOSTART_WEB=1` with project `chromium-mobile-capture`, result `4 passed`.
- Screenshot evidence path: `tmp/browser-qa/slice-4-staff-fixtures/`.
- Metadata guard: dev-only visual QA fixture requests pass through teacher/admin layouts without requiring real staff accounts; production and non-fixture staff routes still enforce role checks.
- Residual risks to carry forward: assignment reminder delivery, table filtering backed by live data, and admin create-user flows still require live-flow testing beyond deterministic visual fixtures.
- This closes the visual fixture gate for Slice 4 and the first production role-boundary smoke; deeper live staff workflows remain part of production hardening.

### Production Hardening Smoke

Owner: QA Automation Engineer with Security / Privacy Consultant and Backend Engineer review.

Scope:

- Protected route redirects for unauthenticated users on `/dashboard`, `/teacher`, and `/admin`.
- Learner denial on teacher/admin surfaces and privileged staff APIs.
- Teacher access to teacher surfaces and teacher APIs, with denial on admin analytics.
- Admin access to admin/teacher surfaces plus admin analytics.
- Learner read-only availability for missions and reward wallet endpoints.

Execution evidence:

- Automation: `tests/integration/production-hardening-smoke.pw.spec.ts`.
- Backend hardening: `apps/web/src/lib/api/error-handler.ts` preserves explicit HTTP status errors from route guards, so learner access to teacher APIs returns 403 instead of an internal 500.
- Last Codex run: 2026-05-22, `PLAYWRIGHT_AUTOSTART_WEB=1` with project `chromium-mobile-capture`, result `5 passed`.
- Data prerequisite: local Postgres and Redis healthy, Prisma schema synced, content seed completed. Seed emitted known vocabulary content warnings but did not block the hardening smoke.

## QA Runbook For Build Slices

For every slice:

1. Start the local web app with the repo-standard dev command.
2. Capture desktop screenshot at 1440 x 900.
3. Capture mobile screenshot at 390 x 844.
4. Exercise the required `mock-state.png` state with deterministic data or route parameters.
5. Check the browser console for runtime errors.
6. Check horizontal overflow on mobile.
7. Re-measure representative contrast pairs on live DOM.
8. Record residual risk and whether it blocks release.

Recommended automation shape:

- Unit tests for pure state helpers and formatter behavior.
- Component tests for CTA count, state shell composition, and table/list mobile behavior.
- Playwright smoke for route render, viewport fit, and primary action visibility.
- Visual screenshot review for each module against the corresponding PASS mock.

## Route Decisions

The mock pack intentionally covers 18 product surfaces. The two open route decisions are now closed for the first frontend implementation pass:

- `13-missions`: embed as a Dashboard mission area first. Rationale: the dashboard already imports `getMissionBoard`, renders mission UI, and owns daily next-action context; a standalone route would add navigation surface before there is evidence that learners need it.
- `15-profile`: create a dedicated learner `/profile` route under `(learn)`. Rationale: profile and goal editing need a durable destination outside onboarding, and the dashboard can link to it without becoming a settings page.

Non-goals for this pass:

- Do not create `/missions` in the first production pass.
- Do not bury profile editing only inside onboarding.
- Do not add teacher/admin access to learner profile settings in this slice.

## Risks To Carry Into Implementation

- Generated mock text is not final production copy.
- German strings, emails, school names, badge names, and billing labels must be tested with long real data.
- Live DOM contrast may differ from PNG perception and must be measured.
- Teacher/admin surfaces require role-boundary checks before release.
- Audio, microphone, and exam timeout states are higher-risk than static learner surfaces.
- The mock pack is visual guidance; backend contracts and data edge cases still need engineering validation.

## Completion Definition

This handoff is complete when:

- Each module row above has an implementation owner.
- Route decisions are resolved for Missions and Profile.
- Each slice has a QA evidence artifact with desktop, mobile, and required state screenshots.
- All production surfaces pass responsive, accessibility, and role-boundary smoke checks.
