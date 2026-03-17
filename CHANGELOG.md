# Changelog

All notable changes to the Fuxie project will be documented here.

---

## [2026-03-02] Session 7 — Phase 3+4 Mascot (Gamification + Hero + Stickers)

### Added
- 13 new mascot poses in `apps/web/public/mascot/`:
  - Gamification (7): streak-fire, levelup, achievement, xp-earned, daily-goal, perfect-score, rankup
  - Hero full-body (2): landing, onboarding
  - Stickers (4): love, sleepy, angry, cool
- New folders: `hero/`, `sticker/` in mascot directory
- `fuxie-icon.svg` — simplified Fuxie face SVG for favicon/app icon
- Updated `MascotImage` component: 22 → 35 type-safe poses

---

## [2026-03-02] Session 6 — Phase 2 Mascot (P1 Learning + Skills)

### Added
- 10 new mascot poses in `apps/web/public/mascot/`:
  - Skills (6): Hören, Lesen, Schreiben, Sprechen, Grammatik, Wortschatz
  - Learning (4): studying, graduation, lightbulb, encouragement
- New `skill/` folder in mascot directory
- Updated `MascotImage` component: 12 → 22 type-safe poses

---

## [2026-03-02] Session 5 — Phase 1 Mascot (P0)

### Added
- 12 mascot PNG images in `apps/web/public/mascot/` (4 folders: core, learn, state, game)
  - Core: happy-wave, sad-tears, thinking, surprised, celebrate
  - Learn: correct, wrong
  - State: empty, error, loading, welcome
  - Game: streak-sick
- `MascotImage` component (`components/shared/mascot-image.tsx`)
  - Type-safe pose selection (12 poses)
  - 5 size presets (xs/sm/md/lg/xl)
  - Convenience wrappers: `MascotEmptyState`, `MascotErrorState`, `MascotLoadingState`
- Mascot CSS in `globals.css` (containers, state layouts, bounce animation, action buttons)

---

## [2026-03-02] Session 4 — Dashboard UI (Option A+ Hybrid)


### Added
- `server-auth.ts` — `getServerUser()` for RSC cookie-based Firebase auth
- Dashboard data aggregation (parallel Prisma: profile, streak, SRS, 7-day activity, skills, achievements)
- Dashboard client UI — 4 stat cards, CEFR roadmap, weekly XP chart, 6-skill bars, quick actions, achievements
- Fuxie XP level system (Fuchs-Baby → Fuchs-Legende, 5 tiers)
- Time-aware German greeting (Guten Morgen/Tag/Abend/Nacht)
- Daily goal progress in sidebar (real data from `DailyActivity`)
- CSS animations: fadeInUp, pulseFire, shimmer, countUp, growWidth + stagger delays
- Inter font from Google Fonts
- Glass card styles, custom scrollbar styling
- Dashboard UI research report — analyzed 7+ platforms, 3 design mockups

### Changed
- `globals.css` — expanded with animations, font import, card utilities
- `(learn)/layout.tsx` — now fetches daily goal data, passes to Sidebar
- `sidebar.tsx` — accepts `dailyGoal` prop for real progress display

---

## [2026-03-01] Session 3 — Memory System

### Added
- `.gemini/memory/` — 5-file Memory Bank system
  - `project-state.md` — infrastructure, apps, packages status
  - `active-tasks.md` — task backlog (Now/Next/Later/Done)
  - `decisions-log.md` — 8 ADRs backfilled
  - `known-issues.md` — active bugs, watch items, resolved
  - `file-index.md` — complete project file map
- `CHANGELOG.md` — this file
- `.gemini/workflows/session-start.md` — AI agent session startup workflow
- Memory rules added to `GEMINI.md`

---

## [2026-03-01] Session 2 — Database & Auth

### Added
- Cloud SQL database `fuxie_dev` on instance `dmf-learning-db` (PG15)
- Cloud SQL user `fuxie` with dedicated password
- Authorized IP `171.250.161.93/32` on Cloud SQL
- Prisma migration `20260301164154_init` — 25 tables created
- Firebase web app `Fuxie Web` (App ID: `...6f955f1d40ad19f79803cd`)
- Firebase service account key for server-side auth
- Edge Middleware (`next-firebase-auth-edge`, cookie-based sessions)
- `withAuth()` helper for API Route Handlers
- Centralized error handler (Zod/Auth/NotFound/Prisma)
- `POST /api/v1/auth/register` — creates User+Profile+Settings+Streak+LearningPath
- `GET /api/v1/auth/me` — returns user with profile, streak, settings
- Login page (email + Google OAuth)
- Register page (Firebase signup → DB)
- Dashboard placeholder (streak, XP, SRS cards)

### Changed
- Firebase config: module-level init → lazy getter functions (SSG fix)
- Shared package: removed `.js` extensions from imports (bundler compat)

---

## [2026-03-01] Session 1 — Monorepo Boilerplate

### Added
- Turborepo monorepo with pnpm workspaces
- `apps/web` — Next.js 15 (App Router, Turbopack, TW4, React 19)
- `apps/ai-service` — Hono microservice (5 route groups: health, chat, grade, generate, audio)
- `packages/database` — Prisma schema (25 models, 9 enums), singleton client
- `packages/shared` — Types (`as const`), Zod validators, constants (XP/SRS/CEFR/rate-limits), utils
- `packages/srs-engine` — SM-2 algorithm (`calculateReview`, `createNewCard`, `isDue`)
- `packages/ui` — Design tokens (colors, spacing, fonts, breakpoints)
- `packages/typescript-config` — 3 configs (base strict, nextjs, node)
- `docker-compose.yml` — PostgreSQL 16 + Redis 7
- `infra/docker/Dockerfile.web` — Multi-stage Next.js for Cloud Run
- `infra/docker/Dockerfile.ai` — Hono for Cloud Run
- `.env.example` — all required env vars documented
- Root configs: `turbo.json`, `pnpm-workspace.yaml`, `.npmrc`, `.gitignore`
