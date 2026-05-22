# Visual QA Capture Manifest — Schema Notes

**Date**: 2026-05-16
**Spec**: `.kiro/specs/visual-qa-screenshot-capture/`
**Vai chinh**: QA Automation Engineer
**Vai phoi hop**: PM (decision owner)
**Source manifest**: `tests/integration/visual-capture.manifest.json`

This file documents schema extensions and PM resolutions applied to the Capture_Manifest beyond what design.md §Decision 1 originally enumerated. It exists because the manifest is a JSON array (no comment syntax) and the consuming scripts (capture spec, marker-flip, acceptance script) need an authoritative side note.

## Schema extension — `state` enum

design.md §Decision 1 declares:

```ts
state: 'default' | 'empty' | 'locked' | 'error' | 'success'
```

The Phase 0 baseline (`docs/design/visual-qa-baseline.md` §3) found that `exam.md` declares its post-submit screenshot as **`exam-result-mobile.png`** — i.e. state `result`, not `success`. PM resolution (per task 2.1 brief): **extend the manifest schema enum** to include `result`. No checklist file is renamed; no PNG filename is changed. Effective enum:

```ts
state: 'default' | 'empty' | 'locked' | 'error' | 'success' | 'result'
```

Downstream scripts that validate the state field MUST accept `result` as a valid value:

- `scripts/check-visual-audit-pack.ts` (Decision 6)
- `tests/integration/visual-capture.spec.ts` (Decision 1 schema validator)
- Property test in `tests/property/visual-capture/manifest-bijection.property.test.ts` (Property P1.1)

Only `exam.result` uses this state today (1 manifest entry of 44).

## Driver resolution — `dashboard.empty`

design.md §Decision 2 listed `seedReset` as the primary driver for `dashboard.empty` with a `routeIntercept` fallback. Phase 0 baseline §4 noted no dev-only seed-reset endpoint exists in the codebase.

PM resolution (per task 2.1 brief): **use `routeIntercept` outright** — no `seedReset` driver in the v1 manifest. The intercept fulfills `**/api/learner/dashboard` with status 200 and an empty payload `{ streak: 0, xp: 0, quests: [] }`. If a dev-only reset endpoint lands later, the entry can be migrated.

This eliminates the only `seedReset` entry from the manifest, so the v1 driver kind summary is:

| Driver kind     | Manifest entries |
| --------------- | ---------------: |
| `none`          | 20 (13 mobile defaults + 7 desktop defaults) |
| `routeIntercept`| 24 |
| `seedReset`     | 0 |
| `mockFetch`     | 0 |
| `queryParam`    | 0 |
| **Total**       | **44** |

## API endpoint patterns

The `routeIntercept.pattern` glob values in the manifest are best-estimates derived from baseline §4 surface naming conventions. They MUST be verified during Task 4.2 (capture spec implementation) by either:

1. Running `pnpm dev:web` and inspecting the surface's actual `/api/...` calls in browser DevTools, OR
2. Reading the corresponding route handlers under `apps/web/src/app/api/**`.

If a pattern needs adjustment, update the manifest entry in place (the manifest is the source of truth for the capture spec — no separate driver registry).

## `success` / `result` state capture timing

PM resolution (per task 2.1 brief): drive surface to success/result state via `routeIntercept` response only — no extra learner tap. The capture spec should:

1. Install the route intercept before navigation.
2. Navigate to the surface route.
3. Wait for the surface to render the success/result UI (e.g. `<ResultRewardLoop>` overlay visible) — Playwright's `page.waitForSelector` or `expect(...).toBeVisible()` against a stable testid.
4. Apply `page.emulateMedia({ reducedMotion: 'reduce' })` before the screenshot (per Req 9.4).
5. Capture screenshot.

If a surface requires an additional tap to reveal the success/result frame (e.g. submit button), document it in this file when discovered during Task 4.2.

Affected entries (3 of 44):

- `vocabulary-microgames.success.mobile`
- `rewards-shop.success.mobile`
- `exam.result.mobile`
