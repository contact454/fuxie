# Change Audit And Commit Plan

Date: 2026-04-26

This document groups the current working tree changes, records the main risk areas, and proposes a commit order. It does not mean the changes have been committed.

## Current Verification

- `pnpm check`: passed.
- `pnpm smoke:production`: passed with production env and DB checks.
- Browser smoke: login page and protected dashboard redirect passed.
- Local service audit: app code is OK, but local DB and Redis ports are not currently running.

## Change Groups

| Group | Files | Summary |
| --- | ---: | --- |
| Security, env, CI, ops | 14 | CI gate, shared env validation, smoke scripts, secret audit, docs, gitignore, lockfile updates. |
| Core tests | 24 | Vitest config plus unit and route tests for SRS, assessment, auth, submissions, analytics, rate limits, AI service helpers. |
| Learning progress and personalization | 15 | Unified learning activity tracking across skills, dashboard updates, today-plan API and planner. |
| Teacher and admin analytics | 19 | Class analytics, interventions, admin ops summary, teacher dashboard improvements. |
| AI service | 17 | Generate/audio/grading implementation, queue behavior, health handling, observability, live proxy, rate limiting. |
| Chat live voice | 6 | Live API hook, video layout, chat credentials, memory handling, mascot rendering. |
| Content QA and content fixes | 196 | Vocabulary JSON corrections across CEFR levels plus content QA scripts. |
| Cleanup and script sanitization | 17 | Legacy script sanitization and removal of tracked temp scripts. |
| Web API hardening and shared fixes | 14 | Rate limiting, auth middleware, submission grading, generated service worker and related route fixes. |

Tracked diff currently reports about 273 changed files with roughly 50k insertions and 31k deletions. The content JSON group dominates the diff size.

## Risk Audit

### Highest Risk

- Content QA and content fixes: large JSON rewrites across many vocabulary files. The automated content QA passes, but this group should be reviewed separately because semantic mistakes are easy to miss in a large mechanical content diff.

### High Risk

- AI service: queue, generation, audio, grading, live proxy and health behavior changed together. Unit tests pass, but a real Redis-backed queue run and provider-backed audio/generation smoke should be done before production rollout.
- Learning progress and personalization: many submission routes now affect XP, streaks, daily activity and progress. Tests cover the core logic and route behavior, but logged-in end-to-end learner flows still need real browser validation.

### Medium Risk

- Teacher and admin analytics: many pages and routes changed. Tests cover the analytics/intervention services and route behavior, but the authenticated UI should be checked with teacher/admin accounts.
- Security, env, CI, ops: verification is strong (`pnpm check`, secret audit, production smoke), but CI should still be observed once on the remote branch.
- Chat live voice: auth and credentials behavior is covered, but realtime audio/video behavior should be verified with real browser permissions and provider credentials.

### Lower Risk

- Cleanup and script sanitization: mostly removes tracked temp scripts and replaces literal local values with env-driven usage. Secret audit passes.
- Docs: operational notes only.

## Proposed Commit Order

1. `chore: harden env ci and verification gates`
   - Include CI, env validation, smoke scripts, secret audit, production smoke docs, gitignore and related package scripts.

2. `test: add core learning and service coverage`
   - Include Vitest setup, SRS tests, web route tests, AI helper tests, analytics tests, auth tests and rate limit tests.

3. `feat: standardize learning progress and personalization`
   - Include learning activity service, shared submission grading, progress route updates, dashboard activity updates and today-plan endpoint.

4. `feat: improve teacher admin analytics and ops`
   - Include teacher analytics services, intervention APIs, admin ops summary and teacher/admin UI updates.

5. `feat: complete ai service execution layer`
   - Include AI service env, generate, audio, grading, queue, health, observability, live proxy and rate limiting changes.

6. `feat: harden chat live voice flow`
   - Include chat credentials/memory/route changes, live API hook and video/chat UI adjustments.

7. `chore: sanitize legacy scripts and remove tracked temp files`
   - Include legacy script cleanup and deletion of tracked temporary test scripts.

8. `chore(content): add content qa and fix vocabulary data`
   - Include content QA scripts and CEFR vocabulary JSON changes. Keep this last and separate because it is by far the largest diff.

## Before Committing

- Re-run `pnpm check`.
- Re-run `pnpm smoke:production` if production env files are present.
- Spot-check several changed vocabulary files from A1, B2, C1 and C2.
- If Redis is available, run an AI queue smoke with a real Redis connection.
- Manually open authenticated learner, teacher and admin pages once with seeded accounts.

