# Fuxie Current State Audit

Date: 2026-05-12

## Executive Summary

Fuxie is already more than a single learning app. The repository shows an authenticated German-learning platform with learner, teacher, and admin surfaces; AI service routes; CEFR learning content; SRS; rewards/gamification; and a developed mascot/3D asset direction.

The project is not ready for uncontrolled feature expansion. The first operating priority is to create a clean baseline: classify the dirty working tree, verify gates, identify P0 risks, and separate runtime, content, AI, and design workstreams.

## Observed Repository Shape

| Area | Observed state | Owner | Status |
| --- | --- | --- | --- |
| Monorepo tooling | Root `package.json` uses `pnpm@9.15.4` and Turbo scripts | CTO / Tech Lead | Known |
| Web app | `apps/web` contains Next.js app routes for learner, teacher, admin, auth, APIs, and learning modules | Full-stack Engineer | Known |
| AI service | `apps/ai-service` exists with chat, grade, generate, audio, and health routes | AI / LLM Engineer | Known |
| STT service | `services/stt-service` exists | Speech / Audio Engineer | Needs audit |
| Database | `packages/database` exists with Prisma scripts exposed from root | Backend Engineer | Needs drift check |
| SRS | `packages/srs-engine` is part of `test:core` | QA Automation Engineer | Needs test confirmation |
| Shared packages | `packages/shared`, `packages/ui`, and shared TypeScript config exist | CTO / Tech Lead | Known |
| Content | CEFR content exists in `content/` with vocabulary, reading, writing, listening, grammar-related assets | German Academic Lead | Needs QA pass |
| Assets | Mascot, reward, 3D, Blender, and generated web assets exist | Product Designer | Needs production-use audit |
| Verification scripts | Root scripts include typecheck, tests, content QA, secret audit, smoke, perf, bundle budgets | QA Automation Engineer | Known, rerun required |

## Current Working Tree Intake

At intake, `git status --short` showed:

- `.gitignore` modified.
- Runtime UI files modified under `apps/web/src/app` and `apps/web/src/components`.
- `.agents/` and `AGENTS.md` untracked from the newly introduced company operating model.

During Phase 1 gate evidence collection, `pnpm build` also changed the tracked generated service worker artifact:

- `apps/web/public/sw.js`.

Required action: Project Manager must classify these changes before any release work:

- Operating model docs.
- Runtime UI/gamification/vocabulary changes.
- Build-generated service worker artifact.
- Any unrelated user edits.
- Any generated or local-only files.

## Phase 1 Gate Evidence

Current gate evidence collected on 2026-05-12:

| Gate | Status | Evidence |
| --- | --- | --- |
| `pnpm check:quick` | Pass | Turbo typecheck passed across scoped packages |
| `pnpm test:core` | Pass | SRS, web, and AI service tests passed |
| `pnpm qa:content` | Pass | 1191 files scanned; 0 errors, 0 warnings |
| `pnpm security:secrets` | Pass | No secret literals found in tracked or untracked files |
| `pnpm build` | Pass | AI service and Next.js production build passed |

## Phase 2 Stabilization Evidence

Current stabilization evidence collected on 2026-05-12:

| Area | Status | Evidence | Owner |
| --- | --- | --- | --- |
| Dirty tree classification | Classified | Governance docs, intake docs, runtime UI diffs, generated `sw.js`, and local ignored outputs are separated | Project Manager / Delivery Manager |
| Generated service worker | Decision recorded | `apps/web/public/sw.js` is treated as a generated build artifact; keep as evidence for now, regenerate or restore by CTO policy before release candidate | CTO / Tech Lead |
| DB/Prisma generate | Open/failing | `pnpm db:generate` fails with Windows `EPERM` rename for Prisma query engine DLL | Backend Engineer |
| Env shape | Pass | `pnpm env:audit` reports no env issues | DevOps / Cloud Engineer |
| Service readiness | Open/warning | `pnpm env:audit:services` warns Redis at `localhost:6380` is unreachable | DevOps / Cloud Engineer |
| Full local smoke | Blocked | `pnpm smoke:full-local` was not run because service prerequisites are unavailable | QA Automation Engineer |

Phase 2 did not edit runtime UI source, app APIs, schema, deploy config, AI behavior, or content JSON.

## Phase 10 Visual QA Evidence

Collected on 2026-05-12:

| Surface | Status | Evidence | Owner |
| --- | --- | --- | --- |
| Dashboard/mobile shell | Pass | Mobile `390x844` sweep showed usable fixed header, bottom nav, quest cards, reward panels, and final-page clearance | Product Designer / UX/UI Designer |
| Vocabulary | Pass | Desktop and mobile sweeps showed readable CEFR tabs, world map, progress, CTA, theme nodes, and selected-theme panel | Product Designer / UX/UI Designer |
| Vocabulary practice hub | Pass | Mobile sweep showed circular theme images and labels fitting without overlap | Product Designer / UX/UI Designer |
| Leaderboard | Pass | Desktop and mobile empty state is readable with mascot, stats, and recovery CTAs | QA Automation Engineer |
| Runtime UI candidate slice | Accepted for RC packaging | No P0/P1 visual blocker found; P2 polish items logged in Phase 10 | Project Manager / Delivery Manager |

## Prior Audit Signals

Existing docs indicate recent verification and risk work:

- `docs/change-audit-plan.md` records a broad change batch including env/CI/ops, tests, learning progress, teacher/admin analytics, AI service, chat live voice, content QA, cleanup, and API hardening.
- `docs/performance-optimization-plan.md` records performance work around route splitting, caching, smoke tests, bundle budgets, and local performance gates.
- Several prior gates were documented as passing in late April 2026, but all release gates must be rerun against the current working tree.

## Product Surface Audit Checklist

| Surface | What to inspect | Owner | Acceptance signal |
| --- | --- | --- | --- |
| Dashboard | Daily plan, XP/streaks, missions, weak-skill guidance | Product Manager EdTech | Learner knows what to do next |
| Vocabulary | Theme list, practice modes, SRS connection, media assets | German Curriculum Designer | Practice path is level-appropriate |
| Review/SRS | Due cards, scheduling, progress persistence | QA Automation Engineer | SRS tests and learner smoke pass |
| Grammar | Topic navigation, explanations, progress | German Academic Lead | CEFR progression is credible |
| Reading | Exercise selection, submission, feedback | Content QA / Linguistic Reviewer | Answers are unambiguous |
| Listening | Audio availability, scripts, submission | Audio Script & Voice Producer | Audio and task difficulty fit level |
| Writing | Prompt, submission, grading feedback | AI / LLM Engineer | Rubric and feedback are useful |
| Speaking | Topics, recording, evaluation, live voice | Speech / Audio Engineer | Permission, fallback, feedback status known |
| Chat | AI tutor behavior, memory, credentials | AI / LLM Engineer | Tutor is safe, useful, and cost-aware |
| Rewards | Fucoin, missions, shop, redemption/admin | Gamification Designer | Rewards support study behavior |
| Teacher | Classrooms, students, assignments, interventions | Product Manager EdTech | Teacher workflow is coherent |
| Admin | Users, vocabulary, learning, ops, rewards | Operations Manager | Admin can operate core system safely |

## Unknowns To Resolve

- Which modified runtime UI files are intentional and release-bound.
- Whether local DB, Redis, and AI providers are available for full smoke.
- Whether current Prisma schema and generated client are in sync; `pnpm db:generate` is currently blocked by a local `EPERM` rename issue.
- Whether content QA passes after the current content state.
- Whether production deployment settings match local env assumptions.
- Whether growth, pricing, and B2B/B2C priority have been explicitly approved.

## Initial Recommendation

Accept the project into a controlled 30-day stabilization cycle. Do not begin new feature work until the working tree has been classified and the minimum gate matrix has a current pass/fail record.
