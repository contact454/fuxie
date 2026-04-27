# Performance Optimization Plan

Date: 2026-04-27

This document is the working prompt, backlog, and verification plan for the current
performance pass. It is intentionally written before code changes so implementation
stays measurable and scoped.

## Prompt Engineering Brief

### Role

Act as a senior Next.js performance engineer working inside the Fuxie monorepo.
Optimize the learning web app for faster authenticated page loads, smaller initial
JavaScript, safer local smoke testing, and repeatable performance gates.

### Product Context

Fuxie is an authenticated language-learning app with learner, teacher, and admin
surfaces. The highest-traffic learner routes are dashboard, vocabulary, review,
skill lesson players, and chat. Teacher/admin routes are operationally important
but can tolerate slightly higher latency if they stay reliable and predictable.

### Current Baseline

- The working tree already contains a broad performance batch.
- `pnpm check:quick` passed on 2026-04-27.
- `pnpm smoke:full-local` passed on 2026-04-27.
- `pnpm --filter @fuxie/web test` passed on 2026-04-27.
- `pnpm check:bundle` passed on 2026-04-27; all budgeted routes are below the
  current `115kb` gzipped initial JS budget.
- `pnpm check` passed on 2026-04-27, including typecheck, core tests, content QA,
  secret audit, and production build.
- `pnpm perf:local:warn` ran on 2026-04-27; several learner warm medians still
  exceed the local dev budgets and should be treated as follow-up optimization
  targets, not release blockers while running in Next dev mode.
- Bundle budget must still be run only after a clean production build. The script
  correctly rejects dev `.next` artifacts.
- Dev logs show `/dashboard`, `/vocabulary`, and `/admin` returning `200`.
- The AI service can run on port `3001`; recent logs show Redis connected at
  `redis://localhost:6380`.
- New scripts exist for local smoke, local perf, bundle budgets, and dev seeding.

### Primary Goals

1. Reduce initial client JavaScript on route entry by moving heavy interactive
   clients behind route-level dynamic wrappers.
2. Reduce repeated database work on hot authenticated reads with short-lived cache
   wrappers and targeted invalidation.
3. Keep local and CI verification repeatable with smoke, perf, and bundle gates.
4. Preserve auth, role guards, and route behavior while optimizing.
5. Keep content and vocabulary changes isolated from app-runtime performance work.

### Non-Goals

- Do not redesign the product UI during this pass.
- Do not rewrite domain logic or introduce a new caching backend.
- Do not commit or print secrets from `.env` files.
- Do not revert existing working-tree changes unless explicitly requested.
- Do not chase micro-optimizations before the measurement scripts are reliable.

### Engineering Constraints

- Prefer existing Next.js app-router patterns and local helpers.
- Keep server components responsible for data fetching.
- Use `dynamic(..., { ssr: false })` only for genuinely interactive or heavy
  browser-only clients.
- Avoid caching personalized data without user-specific keys.
- Use short TTLs for personalized route data unless invalidation is explicit.
- Every cache must have a safe no-Redis behavior for local development.
- Keep each code step independently typecheckable.

### Measurement Strategy

Use these gates in this order:

1. `pnpm check:quick`
   - Fast correctness gate after each code slice.
2. `pnpm smoke:full-local`
   - Authenticated learner, teacher, admin smoke against local services.
3. `pnpm perf:local:warn`
   - Noisy local latency measurement; useful for trend direction.
4. `pnpm check:bundle`
   - Production build plus route-level initial JavaScript budgets.
5. `pnpm check`
   - Full final gate before commit or deploy handoff.

## Backlog

### P0 - Make Performance Gates Trustworthy

Acceptance criteria:

- Local smoke fails clearly when dev auth is unavailable.
- Perf script reports cold, warm median, warm max, status, bytes, and route budget.
- Bundle script checks actual app routes and rejects dev build artifacts.
- All scripts are documented in `package.json` and can run from the repo root.

Current status:

- Mostly implemented.
- Local smoke and perf scripts have been exercised.
- Bundle budget passes after a clean production build.

### P0 - Preserve Correct Auth While Enabling Dev Smoke

Acceptance criteria:

- Dev auth is gated by an explicit environment flag.
- Learner, teacher, and admin dev sessions are role-scoped.
- Middleware excludes only the intended dev-auth routes.
- Production Firebase auth path is untouched when dev auth is disabled.

Current status:

- Implemented in the working tree.
- Server auth DB lookups now use a short TTL cache after token/dev-cookie
  verification, and admin role mutation invalidates the affected user cache.
- Needs focused tests or smoke verification for all three roles.

### P1 - Reduce Initial Route JavaScript

Acceptance criteria:

- Large client components are wrapped in `*Dynamic.tsx` modules.
- Route files stay server components where possible.
- Loading states are stable, compact, and do not shift layout heavily.
- `pnpm check:bundle` stays under budget for all budgeted routes.

Current status:

- Broad dynamic-wrapper pass is present.
- Bundle verification passes for the current route budget.
- Needs spot review for whether any dynamic wrapper unnecessarily delays first
  interaction.

### P1 - Cache Hot Personalized Reads Safely

Acceptance criteria:

- Dashboard stats/content, SRS due, vocabulary lists, teacher classrooms, and admin
  summaries use short TTL cache where repeated reads are expensive.
- Cache keys include user id, level, locale, paging, filters, and role where needed.
- Mutations invalidate relevant prefixes where stale data would be confusing.
- Local memory fallback is bounded and disabled in production unless explicitly
  enabled.

Current status:

- Several cache wrappers are present.
- Submit/progress routes now invalidate dashboard, today-plan, and SRS cache
  prefixes after mutations commit.
- Vocabulary list cache keys now keep the `vocab:list` prefix literal so admin
  vocabulary mutations can invalidate list caches correctly.
- Needs a follow-up stale-data check during browser smoke.

### P1 - Optimize Admin And Teacher Aggregate Queries

Acceptance criteria:

- Aggregate pages use grouped/count queries instead of loading large row sets.
- Teacher/admin pages do not execute serial query loops for simple summaries.
- Indexes exist for the most common aggregate filters.

Current status:

- Admin dashboard and classrooms route have improvements.
- Prisma schema includes additional indexes.
- Needs DB migration/generate verification before rollout.

### P2 - Split Heavy Tooling From Runtime

Acceptance criteria:

- Scripts for seed, perf, bundle, and QA stay in root `scripts`.
- Runtime app code does not import script-only dependencies.
- Temporary scripts are removed or clearly ignored before final commit.

Current status:

- New scripts exist.
- Temporary root debug scripts were removed after triage; no known root temp
  scripts remain from the audio-check investigation.

### P2 - Content And Image Generation Hygiene

Acceptance criteria:

- Vocabulary JSON edits are validated by content QA.
- Image generation scripts support safe dry runs and clear provider/env errors.
- Large content-only diffs are kept separate from runtime performance commits.

Current status:

- Content changes are present.
- Needs content QA and commit grouping later.

## Suggested Code Order

1. Validate and harden perf/smoke/bundle scripts.
2. Review dev-auth and route middleware boundaries.
3. Review dynamic wrappers for missing imports or excessive `ssr: false`.
4. Review personalized cache keys and invalidation.
5. Run typecheck, smoke, perf, bundle gates.
6. Split changes into small commits by risk area.

## Completed Execution Slice - Dynamic Wrappers, Invalidation, Cleanup

Date: 2026-04-27

### Prompt

Act as a performance-focused reviewer and implementer for the already-open
optimization batch. Before changing code, identify the smallest follow-up slice
that improves confidence without widening the diff unnecessarily. Prefer
verification and cleanup over new architecture.

### Scope

1. Review route-level dynamic wrappers for correctness and unnecessary
   `ssr: false` usage.
2. Verify that learner mutation routes invalidate the caches that power
   dashboard, today plan, SRS due counts, and vocabulary theme progress.
3. Triage temporary root files and decide whether they should be deleted,
   ignored, or kept for follow-up.

### Non-Goals

- Do not redesign page loading states.
- Do not change product behavior unless a bug is found.
- Do not stage or commit until the change groups are reviewed.
- Do not delete temporary files unless their purpose is understood from local
  context.

### Acceptance Criteria

- Dynamic wrapper review finds no broken imports or documents any remaining
  concerns.
- Cache invalidation is exercised by tests, smoke, or direct API checks.
- Temporary files are classified with a recommended action.
- `pnpm --filter @fuxie/web test`, `pnpm check:quick`, and
  `pnpm smoke:full-local` pass after any code changes in this slice.

### Slice Results

- No app `page.tsx` files remain direct client components.
- `/admin/vocabulary` now follows the same dynamic-client wrapper pattern as the
  other admin tool pages.
- Existing mutation route tests now assert cache invalidation for vocabulary
  practice, session completion, exam submit, listening submit, and reading submit.
- Root debug files `temp-check-audio.js` and `temp-pg2.js` were removed after
  confirming they were temporary Postgres audio-check scripts superseded by
  tracked QA tooling.

## Completed Execution Slice - Bundle Regression And Backlog Closure

Date: 2026-04-27

### Prompt

Act as a release-readiness performance engineer for the current optimization
batch. The code diff is already broad, so prioritize regression evidence,
backlog accuracy, and commit hygiene over adding new runtime changes. Verify
that the latest dynamic-wrapper addition has not weakened bundle budgets, then
leave the repo in a state where the next action can be either final full check
or logical commit grouping.

### Scope

1. Re-run the bundle gate after the `/admin/vocabulary` dynamic wrapper change.
2. Restart the local web dev server with the established dev-auth, Redis, and
   Postgres environment if the bundle gate requires stopping it.
3. Re-run authenticated smoke after the restart to confirm learner, teacher,
   and admin flows still respond.
4. Update this plan with concrete gate results and any remaining backlog
   changes.

### Non-Goals

- Do not introduce new performance architecture in this slice.
- Do not stage or commit yet.
- Do not expand content/image JSON work.
- Do not print environment secret values.

### Acceptance Criteria

- `pnpm check:bundle` passes against a clean production build.
- `pnpm smoke:full-local` passes after the local dev server is restarted.
- Backlog status reflects the completed temp-file cleanup and current remaining
  risks.
- Any follow-up work is small enough to become a clearly named next slice.

### Slice Results

- `pnpm check:bundle` passed after stopping the web dev server and running a
  fresh production build.
- `/admin/vocabulary` remained under the route budget after the dynamic wrapper
  change: `104.8kb gzip` against a `115kb` budget.
- The web dev server was restarted on `http://localhost:3000` with the local
  dev-auth, Redis, and Postgres environment used by smoke.
- `pnpm smoke:full-local` passed after restart across learner, teacher, admin,
  web DB health, and AI health checks.

## Completed Execution Slice - Full Gate And Commit Grouping

Date: 2026-04-27

### Prompt

Act as a release-prep engineer taking over a broad but verified performance
batch. Before any further code changes, prove that the full local quality gate
still passes with the latest wrapper, cache, script, and documentation changes.
Then prepare the backlog for logical commit grouping so runtime performance,
auth/smoke tooling, cache invalidation, dynamic splitting, content hygiene, and
cleanup can be reviewed independently.

### Scope

1. Run the full repository gate: `pnpm check`.
2. Inspect the resulting dirty tree by risk area without staging anything.
3. Update this plan with the full-gate result and recommended commit groups.
4. Leave any remaining code work as an explicit next slice.

### Non-Goals

- Do not stage, commit, or push.
- Do not add new optimizations unless the full gate exposes a blocking issue.
- Do not mix large vocabulary JSON diffs with runtime performance grouping.

### Acceptance Criteria

- `pnpm check` passes, or any failure is captured with a concrete fix/backlog
  item.
- Commit grouping recommendations are documented from the actual dirty tree.
- The next code task, if any, has a narrow prompt and acceptance criteria.

### Slice Results

- `pnpm check` passed end to end:
  - `pnpm typecheck`
  - `pnpm test:core`
  - `pnpm qa:content`
  - `pnpm security:secrets`
  - `pnpm build`
- Content QA scanned `1188` files with `0` errors and `0` warnings.
- Secret audit found no secret literals in tracked or untracked files.
- The dirty tree was reviewed after the gate; no staging or commit was
  performed.
- The running web dev server returned a transient `500` after `pnpm check`
  because the production build rewrote `.next` while Next dev was still
  serving. The dev server was restarted, `/api/v1/health` returned `200`, and
  `pnpm smoke:full-local` passed again across learner, teacher, admin, web DB
  health, and AI health checks.

### Recommended Commit Groups

1. Performance process and gates:
   `docs/performance-optimization-plan.md`, `package.json`,
   `scripts/bundle-budget.ts`, `scripts/perf-local.ts`,
   `scripts/smoke-full-local.ts`, `scripts/seed-dev-data.ts`.
2. Local dev auth and smoke infrastructure:
   `.env.example`, `docker-compose.yml`, `apps/web/src/app/api/dev-auth/*`,
   `apps/web/src/lib/auth/dev-auth.ts`, auth middleware/server-auth changes, and
   matching role/auth tests.
3. Dynamic client splitting:
   route `page.tsx` updates plus `*Dynamic.tsx` wrappers under learner, auth,
   admin, teacher, and interactive component directories.
4. Personalized cache and invalidation:
   `apps/web/src/lib/cache/redis.ts`,
   `apps/web/src/lib/progress/cache-invalidation.ts`, hot read routes, mutation
   invalidation routes, and the related route tests.
5. Admin, teacher, SRS, and database aggregate optimization:
   admin/teacher API routes, SRS stats, Prisma schema/index/client changes, and
   focused tests for classrooms/assignments/SRS due.
6. Content and image-generation hygiene:
   vocabulary JSON changes, `apps/web/src/lib/content/scenario-options.ts`,
   image generation scripts, and `scripts/qa-exam-audios.ts`.
7. AI service and service-worker/dev infra:
   AI queue connection changes and `apps/web/public/sw.js`, if they are
   confirmed as part of this optimization batch.

### Commit Prep Notes

- Group 1 was reviewed as a process/tooling group. It includes the bundle
  budget gate, authenticated full-smoke script, local perf script, and the dev
  seed script referenced by the new `db:seed:dev` package script.
- Group 1 was staged as the first review unit:
  `docs/performance-optimization-plan.md`, `package.json`,
  `scripts/bundle-budget.ts`, `scripts/perf-local.ts`,
  `scripts/smoke-full-local.ts`, and `scripts/seed-dev-data.ts`.
- `git diff --cached --check` passed for the staged group.
- `pnpm smoke:full-local` passed after staging group 1.
- AI service dotenv loading and the generated service worker diff are not part
  of the first stage group. They should be reviewed separately because `sw.js`
  is generated/minified and the AI queue change affects service startup
  behavior.

## Completed Execution Slice - Commit Prep Or Narrow Follow-Up

Date: 2026-04-27

### Prompt

Act as a commit curator for the verified performance batch. Do not change code
unless a final diff review finds a blocking defect. Separate the large working
tree into reviewable groups, preserving the boundary between runtime
performance changes and content/image hygiene.

### Scope

1. Review each recommended commit group with `git diff --stat` and focused
   diffs.
2. Decide whether the AI service and service-worker changes belong in this
   batch or should be held for a separate follow-up.
3. Stage only one logical group at a time after review.
4. Re-run targeted tests if staging reveals an accidental cross-group
   dependency.

### Non-Goals

- Do not rewrite the already-passing implementation.
- Do not squash content JSON changes into runtime/cache commits.
- Do not commit until the staged group is reviewed.

### Acceptance Criteria

- Each staged group has a clear review story and matching test evidence.
- Any files that do not belong to the performance batch are explicitly called
  out before staging.
- The next code task is only opened if diff review finds a concrete defect.

## Completed Execution Slice - Finish Verified Commit Groups

Date: 2026-04-27

### Prompt

Act as a careful release integrator finishing the already-verified performance
batch. Preserve the prompt/backlog discipline, but optimize for commits that
are reviewable and internally consistent. If two recommended groups share files
or cannot stand alone, combine them rather than creating a commit that depends
on unstaged work.

### Scope

1. Commit the already-reviewed process/tooling group.
2. Review remaining diffs in dependency order:
   local dev/auth infrastructure, dynamic splitting, cache/invalidation,
   aggregate/database work, content/image hygiene, and AI/service-worker
   follow-up.
3. Stage and commit each coherent group only after checking its diff and
   running at least a targeted gate or relying on the already-passing full gate
   when the working tree is unchanged.
4. Finish with a final status check and, if needed, a smoke check for the local
   dev server.

### Non-Goals

- Do not introduce new feature or performance code unless a blocking defect is
  found during diff review.
- Do not split a shared file into fragile partial commits.
- Do not hide generated/minified service worker changes inside unrelated
  runtime commits.

### Acceptance Criteria

- The staged process/tooling group is committed first.
- Remaining commits are grouped by review story and do not mix large content
  JSON with runtime code.
- Any files held back are explicitly listed with the reason.
- Final `git status --short` and verification results are recorded.

### Slice Results

- The verified batch was split into six commits:
  - `53ac685` `chore: add performance verification tooling`
  - `7a5987a` `feat: add dev auth and cache invalidation`
  - `c6a29ea` `perf: split heavy route clients dynamically`
  - `ddc6daa` `perf: optimize aggregate routes and database indexes`
  - `0f51052` `chore: improve vocabulary image content hygiene`
  - `d7d12fb` `chore: align local service runtime artifacts`
- Final gates passed after commits:
  - `pnpm check`
  - `pnpm bundle:budget`
  - `pnpm smoke:full-local`
- The web dev server was restarted after production build and health returned
  `200`.

## Completed Execution Slice - Perf Baseline And Bottleneck Selection

Date: 2026-04-27

### Prompt

Act as a performance measurement engineer after the first verified optimization
batch. Do not start a new implementation until the current local perf baseline
identifies a clear bottleneck. Treat local dev results as directional only:
prefer warm medians, record noisy cold starts, and avoid broad refactors unless
the data points to one.

### Scope

1. Run `pnpm perf:local:warn` against the currently running local web and AI
   services.
2. Compare warm medians against the configured budgets and identify the top
   slow routes or APIs.
3. If one small, low-risk fix is obvious, add a narrow follow-up prompt before
   coding it.
4. Otherwise, record the baseline and leave implementation for the next
   explicitly scoped slice.

### Non-Goals

- Do not treat dev cold-start compilation as a production regression.
- Do not alter cache TTLs or query shape without a measured target.
- Do not run destructive DB operations.
- Do not push commits from this local branch.

### Acceptance Criteria

- Perf baseline is recorded with cold, warm median, warm max, status, bytes,
  and budget result.
- Any next code task has a single measured target and acceptance criteria.
- Repo returns to a clean state if only documentation is changed.

### Slice Results

- `pnpm perf:local:warn` passed for all measured targets.
- `pnpm perf:local` passed in strict mode for all measured targets.
- Strict warm medians:
  - Learner dashboard: `236ms` / `600ms`
  - Learner vocabulary: `297ms` / `600ms`
  - Learner review: `288ms` / `600ms`
  - Learner today plan API: `392ms` / `450ms`
  - Learner SRS due API: `363ms` / `450ms`
  - Teacher dashboard: `166ms` / `700ms`
  - Teacher classrooms API: `338ms` / `450ms`
  - Admin dashboard: `182ms` / `800ms`
  - Admin ops API: `372ms` / `450ms`
- No new implementation bottleneck was selected because every target was under
  budget. The closest measured margins are today-plan/admin-ops/SRS/teacher
  classrooms APIs, all still below the configured `450ms` API budget.

## Completed Execution Slice - Prisma Index Rollout Verification

Date: 2026-04-27

### Prompt

Act as a database rollout reviewer for the performance batch. The local perf
baseline is green, so do not change query behavior. Focus only on whether the
Prisma index changes have a safe rollout path in this repository, and create
the smallest artifact needed if the repo already uses Prisma migrations.

### Scope

1. Inspect the Prisma package for existing migration conventions.
2. Verify whether the committed schema index additions are backed by migration
   artifacts or whether this repo intentionally uses `db push`.
3. If migrations are used, generate or add a migration for the index changes
   without touching unrelated schema.
4. Record the decision and run the narrow database/typecheck gate.

### Non-Goals

- Do not change application query behavior.
- Do not run destructive database reset commands.
- Do not print database secret values.
- Do not alter content/image generation work.

### Acceptance Criteria

- The repo has a clear answer for Prisma index rollout: migration artifact,
  `db push` workflow, or explicit follow-up.
- Any generated migration contains only the intended index changes.
- Verification includes at least `pnpm check:quick` or the relevant Prisma
  validation/generation command.

### Slice Results

- The repo has a Prisma migrations directory, but migration history currently
  contains only `20260301164154_init` while the schema has continued to evolve.
- To avoid generating a broad historical drift migration, rollout was handled
  with an index-only migration:
  `packages/database/prisma/migrations/20260427091500_add_performance_indexes/migration.sql`.
- The migration contains only the 14 performance indexes added in the schema
  and uses `CREATE INDEX IF NOT EXISTS` for safer local/drifted environments.
- `pnpm --filter @fuxie/database exec prisma validate` passed.
- `pnpm check:quick` passed.

## Completed Execution Slice - Local Migration Status And Smoke

Date: 2026-04-27

### Prompt

Act as a rollout verification engineer after adding the index-only migration.
Do not change schema or query behavior. Verify whether the local development DB
can see the migration state cleanly, and keep the local app usable afterwards.

### Scope

1. Run a read-only Prisma migration status check against the configured local
   development database.
2. If the migration status is clean, record the result.
3. If migration history drift is reported, do not reset the database; record the
   exact follow-up and keep using smoke/typecheck as the local correctness gate.
4. Confirm the dev server remains healthy and run smoke if anything was
   restarted or DB status is ambiguous.

### Non-Goals

- Do not run `migrate reset`.
- Do not run destructive SQL.
- Do not print connection strings or secret environment values.
- Do not add another schema migration unless status exposes a concrete missing
  artifact.

### Acceptance Criteria

- Prisma migration status result is recorded.
- Any drift or unapplied migration state has an explicit non-destructive
  follow-up.
- Local app health remains `200`, or `pnpm smoke:full-local` passes after a
  restart.

### Slice Results

- `pnpm --filter @fuxie/database exec prisma migrate status` reached the local
  `fuxie_dev` database on `127.0.0.1:5434` and reported two migrations not yet
  applied in local migration history:
  - `20260301164154_init`
  - `20260427091500_add_performance_indexes`
- This indicates the current local development DB was likely built with
  `db push`/seed or another non-migration baseline. Do not run `migrate reset`
  or attempt to force `migrate deploy` on this local DB without first creating
  or resolving a baseline.
- Non-destructive follow-up: before production rollout, verify the target
  environment's `_prisma_migrations` history. If it is already migration-based,
  deploy the index-only migration normally. If it is schema-pushed like local,
  baseline/resolve the existing schema first, then apply the index-only
  migration.
- Local app health remained `200`.
- `pnpm smoke:full-local` passed after the migration status check.

## Completed Execution Slice - Release Handoff Checklist

Date: 2026-04-27

### Prompt

Act as a release handoff reviewer for the verified performance optimization
batch. Do not change runtime behavior. Produce the checklist needed before a
push or PR: commits included, gates passed, migration rollout caveat, and any
remaining risks.

### Scope

1. Re-check `git status --short` and recent commits.
2. Summarize the verification evidence from the completed slices.
3. Call out the migration history caveat and required production rollout check.
4. If asked to push or open a PR, do so only after this checklist is reviewed.

### Non-Goals

- Do not run another production build unless files change.
- Do not alter schema/query/UI behavior.
- Do not push without an explicit request.

### Acceptance Criteria

- Handoff checklist is accurate against the current branch state.
- Remaining risks are concrete and actionable.
- Repo stays clean.

### Slice Results

- `git status --short` was clean before this documentation update.
- Local app health endpoint returned `200`.
- Recent performance-batch commits on `master`:
  - `53ac685` `chore: add performance verification tooling`
  - `7a5987a` `feat: add dev auth and cache invalidation`
  - `c6a29ea` `perf: split heavy route clients dynamically`
  - `ddc6daa` `perf: optimize aggregate routes and database indexes`
  - `0f51052` `chore: improve vocabulary image content hygiene`
  - `d7d12fb` `chore: align local service runtime artifacts`
  - `1e73ac7` `chore: add migration for performance indexes`
  - `763e861` `docs: record migration rollout verification`

### Release Handoff Checklist

- Verification already completed:
  - `pnpm check`
  - `pnpm bundle:budget`
  - `pnpm smoke:full-local`
  - `pnpm perf:local:warn`
  - `pnpm perf:local`
  - `pnpm --filter @fuxie/database exec prisma validate`
  - `pnpm check:quick`
- Bundle status:
  - All budgeted app routes passed the `115kb` gzip budget.
  - `/admin/vocabulary` remained at `104.8kb gzip` after dynamic splitting.
- Perf baseline status:
  - All measured local strict warm medians were under budget.
  - Closest margins were today-plan/admin-ops/SRS/teacher classrooms APIs, all
    still below the `450ms` API budget.
- Local runtime status:
  - Web dev server is expected on `http://localhost:3000`.
  - After any production build, restart Next dev before browser/smoke because
    both modes touch `.next`.
- Migration rollout caveat:
  - The repo now has an index-only migration for the 14 performance indexes.
  - Local `fuxie_dev` migration history is not baselined; `migrate status`
    reports both `init` and the new index migration as unapplied.
  - Before production deploy, check the target `_prisma_migrations` history.
    If production is migration-based, deploy the index-only migration normally.
    If production was schema-pushed, baseline/resolve the existing schema first,
    then apply the index-only migration.
- Review/PR notes:
  - Runtime performance work, dynamic splitting, cache invalidation, aggregate
    query/index work, content/image hygiene, and service-runtime artifacts are
    separated into reviewable commits.
  - Draft PR: `https://github.com/contact454/fuxie/pull/1`.

## Completed Execution Slice - Branch Push And PR

Date: 2026-04-27

### Prompt

Act as the release handoff operator for the verified performance batch. The
implementation is already committed and verified, so do not change runtime
behavior. Create the review branch, push it, and open a draft PR if the local
tooling/auth supports it. If PR creation is unavailable locally, record the
exact compare URL for manual PR creation.

### Scope

1. Create or switch to `codex/performance-optimization`.
2. Push the branch to `origin`.
3. Create a draft PR against `master` when possible.
4. Record the PR URL or compare URL.

### Non-Goals

- Do not rewrite commits.
- Do not force push.
- Do not run another production build unless files change.
- Do not deploy.

### Acceptance Criteria

- Branch exists locally and remotely.
- PR URL is recorded, or a manual compare URL is provided with the reason PR
  automation was unavailable.
- Repo remains clean after the handoff.

### Slice Results

- Created local branch `codex/performance-optimization`.
- Pushed branch to `origin/codex/performance-optimization`.
- GitHub CLI was installed and authenticated as `contact454`.
- Created draft PR: `https://github.com/contact454/fuxie/pull/1`.

## Execution Slice - CI Timezone Test Stabilization

Date: 2026-04-27

### Prompt

Act as the CI stabilization engineer for the already pushed performance PR.
GitHub Actions failed in `pnpm check` because one progress helper test
hard-coded the Asia/Saigon representation of local midnight, while the runtime
code intentionally derives the day boundary with `Date#setHours(0, 0, 0, 0)` in
the current process timezone. Make the test deterministic across local Windows
and GitHub Actions UTC without changing production behavior or the performance
implementation.

### Backlog

1. Confirm the failing assertions are limited to
   `apps/web/src/lib/progress/learning-activity.test.ts`.
2. Replace hard-coded midnight timestamps with a test-local helper that computes
   the same process-local day boundary used by the production helper.
3. Run the targeted web test locally.
4. Run the relevant quality gate after the focused fix.
5. Commit and push the CI-only test stabilization to the existing PR branch.

### Non-Goals

- Do not change `recordLearningActivity` runtime behavior.
- Do not change performance indexes, cache behavior, or dynamic import work.
- Do not mark the PR ready until GitHub Actions is green.

### Acceptance Criteria

- The failing progress test passes regardless of whether the process timezone is
  UTC or Asia/Saigon.
- The existing performance PR branch receives a narrow follow-up commit.
- GitHub Actions is rechecked after push.

### Slice Results

- GitHub Actions failure was limited to two timezone-sensitive assertions in
  `apps/web/src/lib/progress/learning-activity.test.ts`.
- The test now computes the expected date with the same process-local midnight
  logic as the runtime helper instead of hard-coding an Asia/Saigon timestamp.
- Targeted verification passed:
  - `pnpm --filter @fuxie/web test -- src/lib/progress/learning-activity.test.ts`
  - `TZ=UTC pnpm --filter @fuxie/web test -- src/lib/progress/learning-activity.test.ts`
- Full local gate passed:
  - `pnpm check`

## Execution Slice - Post-Merge Master Verification

Date: 2026-04-27

### Prompt

Act as the post-merge release verification engineer for the performance
optimization batch now merged into `master`. Confirm the local branch is aligned
with the merged GitHub state, run a focused verification gate on `master`, and
produce the deployment-readiness checklist. Preserve the prompt/backlog-first
workflow and do not make further runtime changes unless verification exposes a
concrete failure.

### Backlog

1. Confirm local `master` points at the PR merge commit and the working tree is
   clean.
2. Confirm PR #1 is merged and the remote branch state is healthy.
3. Run a focused post-merge quality gate on `master`.
4. Re-check database migration status non-destructively.
5. Record results and the exact next deployment steps, including migration
   caveats.

### Non-Goals

- Do not deploy to production.
- Do not run destructive Prisma commands such as `migrate reset`.
- Do not modify performance runtime code unless a verification failure requires
  a narrow fix.
- Do not delete branches until the release state is fully confirmed.

### Acceptance Criteria

- `master` is clean and aligned with the merged PR.
- Focused post-merge verification passes, or any failure has a concrete follow-up.
- Migration rollout guidance is explicit enough to execute safely in staging or
  production later.

### Slice Results

- Local `master` points at merge commit
  `218adcbe2f5ffe07df8054c69d53d20245bcddda`, matching PR #1's GitHub merge
  commit.
- PR #1 is merged:
  `https://github.com/contact454/fuxie/pull/1`.
- The remote-tracking ref `origin/master` was recreated locally with
  `git fetch origin master:refs/remotes/origin/master`; it now points at the
  same merge commit.
- The local `origin` fetch refspec was restored and `master` now tracks
  `origin/master`.
- Focused verification passed on `master`:
  - `pnpm check:quick`
  - `pnpm --filter @fuxie/database exec prisma validate`
  - `SMOKE_WEB_URL=http://localhost:3002 pnpm smoke:full-local`
  - `PERF_WEB_URL=http://localhost:3002 pnpm perf:local`
- Port `3000` was occupied by an older Next `start-server` process and returned
  a plain HTTP `500` for `/api/v1/health`. Because the health route itself would
  return JSON `503` on DB failure, this was treated as a stale local runtime
  issue rather than a `master` code failure.
- A temporary Next dev server was started on port `3002` to verify the merged
  code, returned `/api/v1/health` `200` with DB connected, and was stopped after
  smoke/perf verification.
- Non-destructive migration status still reports unapplied local migration
  history:
  - `20260301164154_init`
  - `20260427091500_add_performance_indexes`

### Deployment Readiness Checklist

1. Confirm the target environment's database URL points to the intended staging
   or production database, not the local `fuxie_dev` database.
2. Run `prisma migrate status` against the target environment before deploying.
3. If the target database already has a valid `_prisma_migrations` history,
   apply the index-only migration with `prisma migrate deploy`.
4. If the target database was created with `db push` or manual schema changes,
   baseline/resolve the existing schema first, then apply
   `20260427091500_add_performance_indexes`.
5. After deployment, verify:
   - `/api/v1/health`
   - learner dashboard and vocabulary pages
   - teacher classrooms API
   - admin ops API
   - SRS due API
6. Keep the performance branch until production rollout is confirmed, then
   delete it if no rollback comparison is needed.

## Execution Slice - Rollout Readiness Discovery

Date: 2026-04-27

### Prompt

Act as the rollout readiness engineer for the merged performance optimization
batch. Continue the prompt/backlog-first workflow. Inspect deployment
configuration, GitHub/Vercel status, and Prisma migration wiring without
printing secret values or touching production data. Determine the safest next
operator step for staging or production rollout.

### Backlog

1. Inspect Vercel, GitHub Actions, package scripts, and Prisma migration
   configuration.
2. Audit production environment variable names only, with secret values redacted.
3. Confirm whether deploy automation applies Prisma migrations automatically or
   only builds the app.
4. Check the latest GitHub/Vercel status for `master`.
5. Record the recommended rollout path and any blocker that requires explicit
   operator confirmation.

### Non-Goals

- Do not run `prisma migrate deploy` against any production or staging database.
- Do not print secret values from `.env`, `.env.production`, `.env.local`, or
  Vercel.
- Do not delete the performance branch yet.
- Do not change runtime code.

### Acceptance Criteria

- The deployment path is understood before any production action.
- Any required manual confirmation is concrete: environment name, database URL
  target, and migration history state.
- The docs capture the next command sequence, but no production mutation happens
  in this slice.

### Slice Results

- Vercel project link:
  - Project: `contact-8252s-projects/fuxie-web`
  - Local project metadata exists in `.vercel/project.json`.
- Deployment automation:
  - `vercel.json` runs `prisma generate` during build.
  - No repo automation runs `prisma migrate deploy`.
  - GitHub Actions only runs `pnpm check`.
- GitHub/Vercel status:
  - Latest `master` CI run for `d01ca4e` completed successfully.
  - Latest Vercel status for `master` completed successfully.
  - Latest production deployment listed by Vercel is ready:
    `https://fuxie-ctemga1z5-contact-8252s-projects.vercel.app`.
- Production environment variable names:
  - Vercel Production has `DATABASE_URL` and `DATABASE_URL_UNPOOLED`.
  - Vercel Production also has the expected Firebase, auth, Gemini, Google Cloud,
    and Upstash env names. Values were not printed.
  - The local `.env.vercel-prod` snapshot is missing `DATABASE_URL_UNPOOLED`, but
    Vercel Production itself has it.
- Production health:
  - Direct curl is blocked by Vercel Authentication.
  - `vercel curl /api/v1/health --deployment <latest-production-url>` returned
    `{"status":"ok","db":"connected"}`.
- Production migration status, read-only:
  - `prisma migrate status` against Production reached database `fuxie_prod`.
  - Both repo migrations are currently unapplied in production migration history:
    - `20260301164154_init`
    - `20260427091500_add_performance_indexes`
- Production schema metadata, read-only:
  - Public schema has 51 base tables.
  - `_prisma_migrations` table does not exist.
  - None of the 14 performance indexes exist yet.
- Production schema diff, read-only:
  - `prisma migrate diff --from-schema-datasource prisma/schema.prisma
    --to-schema-datamodel prisma/schema.prisma --exit-code` reported only the 14
    missing performance indexes.
  - No table or column create/drop/alter drift was reported.

### Recommended Production Migration Path

Because production already has the application tables but no Prisma migration
history, do not run `prisma migrate deploy` first. It would try to apply the
initial migration against existing tables.

Operator-confirmed sequence:

1. Set Production `DATABASE_URL` and `DATABASE_URL_UNPOOLED` in the shell without
   printing values.
2. Baseline the existing production schema:
   `pnpm --filter @fuxie/database exec prisma migrate resolve --applied 20260301164154_init`
3. Apply the index-only performance migration:
   `pnpm --filter @fuxie/database exec prisma migrate deploy`
4. Re-run:
   `pnpm --filter @fuxie/database exec prisma migrate status`
5. Re-run production health:
   `vercel curl /api/v1/health --deployment <latest-production-url>`
6. Read-only verify that the 14 performance indexes now exist.

### Rollout Blocker

Explicit operator confirmation is required before steps 2-3 above because they
mutate the production database metadata and create production indexes.

## Completed Execution Slice - Production Migration Apply

Date: 2026-04-27

### Prompt

Act as the production migration operator for the merged performance optimization
batch. The operator has explicitly approved production mutation with
`ok chạy migration production`. Baseline the existing production schema in
Prisma migration history, apply the index-only performance migration, and verify
health and index creation without printing secret values.

### Backlog

1. Confirm `master` is clean and GitHub CI is green.
2. Confirm the latest Vercel Production deployment is ready.
3. Load Production `DATABASE_URL` and `DATABASE_URL_UNPOOLED` into the shell
   without printing values.
4. Mark `20260301164154_init` as applied with `prisma migrate resolve`.
5. Apply `20260427091500_add_performance_indexes` with `prisma migrate deploy`.
6. Verify migration status, production health, and the 14 performance indexes.

### Non-Goals

- Do not run `migrate reset`.
- Do not run `db push`.
- Do not print database credentials or other secret values.
- Do not change runtime application code.

### Slice Results

- Pre-flight checks:
  - `master` was clean and tracking `origin/master`.
  - Latest GitHub Actions run on `master` was successful.
  - Latest Vercel Production deployment was ready:
    `https://fuxie-gwacn26ue-contact-8252s-projects.vercel.app`.
- Production migration actions:
  - `20260301164154_init` was marked as applied.
  - `20260427091500_add_performance_indexes` was applied successfully.
- Verification:
  - `prisma migrate status` reports `Database schema is up to date!`.
  - `vercel curl /api/v1/health --deployment https://fuxie-gwacn26ue-contact-8252s-projects.vercel.app`
    returned `{"status":"ok","db":"connected"}`.
  - `_prisma_migrations` contains both repo migrations with finished status.
  - All 14 performance indexes now exist in Production.

## Execution Slice - Post-Rollout Closure

Date: 2026-04-27

### Prompt

Act as the post-rollout closure operator for the completed performance
optimization release. The production migration has been applied and verified.
Perform final non-destructive production checks, clean up merged review branches
where safe, and record the release closure state. Do not change runtime code.

### Backlog

1. Confirm `master` is clean, PR #1 is merged, and latest `master` CI is green.
2. Confirm production health still returns `status: ok` and `db: connected`.
3. Confirm Prisma migration status remains up to date and the performance
   indexes are present.
4. Delete the merged performance branch locally and remotely if it still exists.
5. Record closure results and push the docs-only release record.

### Non-Goals

- Do not change application runtime code.
- Do not run any destructive database command.
- Do not create new migrations.
- Do not modify production environment variables.

### Acceptance Criteria

- Production remains healthy after migration and docs deploys.
- The merged performance branch is removed or confirmed absent.
- `master` remains clean and CI/Vercel are green.

### Slice Results

- Pre-closure status:
  - `master` was clean and tracking `origin/master`.
  - PR #1 was merged.
  - Latest `master` CI was green.
- Production verification:
  - `vercel curl /api/v1/health --deployment https://fuxie-kp0w3253q-contact-8252s-projects.vercel.app`
    returned `{"status":"ok","db":"connected"}`.
  - `prisma migrate status` reported `Database schema is up to date!`.
  - `_prisma_migrations` had 2 finished migrations and no unfinished migrations.
  - Production had all 14 performance indexes.
- Branch cleanup:
  - Deleted local branch `codex/performance-optimization`.
  - Deleted remote branch `origin/codex/performance-optimization`.

## Open Risks

- A local perf result can be noisy because Next dev compilation affects cold
  requests. Prefer warm median for local trend checks.
- Short TTL cache can mask fresh mutations if invalidation is incomplete.
- Dynamic wrappers can improve initial bundle size but may delay interactive
  hydration on the first click.
- Prisma migration history is sparse; the performance indexes now have an
  index-only migration, but future schema changes should avoid relying on broad
  drift recovery.
- Local dev DB migration history is not baselined; migration deployment should
  be reconciled per environment before production rollout.
- Large vocabulary JSON rewrites should not be mixed with runtime performance
  commits.
- On local machines, stop or restart Next dev around production builds because
  both can touch `.next`; always smoke after restarting dev.
