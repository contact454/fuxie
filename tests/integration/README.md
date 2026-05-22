# Integration / Perf Tests (Playwright)

**Owner:** QA Automation Engineer
**Co-owner:** Frontend Engineer, DevOps / Cloud Engineer

These tests assert performance and accessibility budgets on every P0
learner surface listed in
[`requirements.md` Req 20.1](../../.kiro/specs/gamified-ui-asset-rollout/requirements.md).

## What runs here

| Spec file | Purpose | Runner | Requirements |
| --- | --- | --- | --- |
| `perf.spec.ts` | CLS ≤ 0.05 across 3 consecutive Slow 4G runs and (mascot hero + world prop + UI frame) ≤ 350 KB on each P0 surface. | Playwright (`pnpm test:integration:perf`) | 14.3, 18.3 |
| `visual-capture.spec.ts` | Capture one PNG per `<surface, state, viewport>` triple in `visual-capture.manifest.json` to close R3 of the `gamified-ui-asset-rollout` DoD pack. | Playwright (`pnpm test:integration:capture`) | spec `visual-qa-screenshot-capture`, Req 3, Req 5 |
| `slice-1-visual-fixtures.pw.spec.ts` | Verify the Slice 1 dev-only visual fixtures for dashboard empty, course loading, session success, and review empty at desktop and mobile viewports. | Playwright (`PLAYWRIGHT_AUTOSTART_WEB=1 .\node_modules\.bin\playwright.CMD test tests/integration/slice-1-visual-fixtures.pw.spec.ts --config tests/integration/playwright.config.ts --project chromium-mobile-capture`) | Fuxie visual mocktest pack Slice 1 gate |
| `slice-2-skill-fixtures.pw.spec.ts` | Verify the Slice 2 dev-only skill fixtures for vocabulary, grammar, listening, speaking, reading, writing, and exam chosen states at desktop and mobile viewports. | Playwright (`PLAYWRIGHT_AUTOSTART_WEB=1 .\node_modules\.bin\playwright.CMD test tests/integration/slice-2-skill-fixtures.pw.spec.ts --config tests/integration/playwright.config.ts --project chromium-mobile-capture`) | Fuxie visual mocktest pack Slice 2 gate |
| `slice-3-motivation-fixtures.pw.spec.ts` | Verify the Slice 3 dev-only motivation fixtures for rewards badge unlock, missions complete, chat typing, and profile goal updated states at desktop and mobile viewports. | Playwright (`PLAYWRIGHT_AUTOSTART_WEB=1 .\node_modules\.bin\playwright.CMD test tests/integration/slice-3-motivation-fixtures.pw.spec.ts --config tests/integration/playwright.config.ts --project chromium-mobile-capture`) | Fuxie visual mocktest pack Slice 3 gate |
| `slice-4-staff-fixtures.pw.spec.ts` | Verify the Slice 4 dev-only staff fixtures for teacher overdue assignment and admin filtered-empty states at desktop and mobile viewports. | Playwright (`PLAYWRIGHT_AUTOSTART_WEB=1 .\node_modules\.bin\playwright.CMD test tests/integration/slice-4-staff-fixtures.pw.spec.ts --config tests/integration/playwright.config.ts --project chromium-mobile-capture`) | Fuxie visual mocktest pack Slice 4 gate |
| `production-hardening-smoke.pw.spec.ts` | Verify protected route redirects, learner/teacher/admin role boundaries, staff API authorization, and read-only learner motivation endpoints with dev-auth identities. | Playwright (`PLAYWRIGHT_AUTOSTART_WEB=1 .\node_modules\.bin\playwright.CMD test tests/integration/production-hardening-smoke.pw.spec.ts --config tests/integration/playwright.config.ts --project chromium-mobile-capture`) | Production hardening smoke |
| `a11y.spec.tsx` | axe-core scan + DOM focus order + Primary_CTA outline contract for every P0 surface. Runs against rendered backbone components inside JSDOM, gated on every PR via `pnpm test:property`. | Vitest + JSDOM (`pnpm test:property`) | 4.2, 15.1, 15.2, 15.4, 15.5 |

The throttle profile is "Slow 4G" (400 Kbps down / 400 Kbps up / 400 ms
latency) applied via Chromium DevTools Protocol (`Network.emulateNetworkConditions`),
matching the Chrome DevTools preset.

## Prerequisites

1. **Install Playwright browsers** (first time only):
   ```bash
   pnpm test:integration:install
   ```
   This installs Chromium with system deps. Other browsers are not
   needed because Slow 4G throttling and CLS measurement use CDP.

2. **Start the dev server with dev-auth enabled.** The tests use the
   `/api/dev-auth/login?role=learner` endpoint to mint an auth cookie.
   In a terminal:
   ```bash
   FUXIE_DEV_AUTH_ENABLED=true pnpm dev:web
   # default port is 3005 (apps/web `dev` script)
   ```

   Or let Playwright spawn the dev server automatically:
   ```bash
   PLAYWRIGHT_AUTOSTART_WEB=1 pnpm test:integration:perf
   ```

3. **Seed the dev database** so the seeded P0 surfaces (reading,
   listening, speaking, writing, exam) have content. Without seed data
   those surfaces are auto-skipped with a clear PM follow-up reason.
   ```bash
   pnpm db:seed:dev
   ```

## Running

```bash
# Just the perf suite
pnpm test:integration:perf

# Skip seeded surfaces (e.g. on a fresh CI without DB seed)
FUXIE_PLAYWRIGHT_SKIP_SEEDED=1 pnpm test:integration:perf

# Accessibility audit (Vitest + JSDOM, no Playwright dependency)
pnpm test:property      # runs a11y.spec.tsx alongside the property suite

# Slice 1 visual fixture gate
PLAYWRIGHT_AUTOSTART_WEB=1 .\node_modules\.bin\playwright.CMD test tests/integration/slice-1-visual-fixtures.pw.spec.ts --config tests/integration/playwright.config.ts --project chromium-mobile-capture

# Slice 2 skill visual fixture gate
PLAYWRIGHT_AUTOSTART_WEB=1 .\node_modules\.bin\playwright.CMD test tests/integration/slice-2-skill-fixtures.pw.spec.ts --config tests/integration/playwright.config.ts --project chromium-mobile-capture

# Slice 3 motivation visual fixture gate
PLAYWRIGHT_AUTOSTART_WEB=1 .\node_modules\.bin\playwright.CMD test tests/integration/slice-3-motivation-fixtures.pw.spec.ts --config tests/integration/playwright.config.ts --project chromium-mobile-capture

# Slice 4 staff visual fixture gate
PLAYWRIGHT_AUTOSTART_WEB=1 .\node_modules\.bin\playwright.CMD test tests/integration/slice-4-staff-fixtures.pw.spec.ts --config tests/integration/playwright.config.ts --project chromium-mobile-capture

# Production hardening smoke
PLAYWRIGHT_AUTOSTART_WEB=1 .\node_modules\.bin\playwright.CMD test tests/integration/production-hardening-smoke.pw.spec.ts --config tests/integration/playwright.config.ts --project chromium-mobile-capture
```

## CI smoke job

`.github/workflows/ci.yml` runs `production-hardening-smoke.pw.spec.ts`
in the `smoke-test` job. The job provisions Postgres with pgvector and
Redis as GitHub Actions services, generates the Prisma client, pushes
the schema, runs `pnpm db:seed:dev`, installs Chromium, and then starts
the Next.js dev server via `PLAYWRIGHT_AUTOSTART_WEB=1`.

On failure, Playwright traces, videos, screenshots, and the JUnit report
under `tmp/playwright` are uploaded as the
`production-hardening-smoke-artifacts` artifact. Slack and Discord
failure notifications are sent only when the corresponding repository
secret is configured.

## Tunable budgets (env vars)

| Env var | Default | Spec |
| --- | --- | --- |
| `BASE_URL` | `http://localhost:3005` | — |
| `PLAYWRIGHT_PERF_RUNS` | `3` | Req 14.3 (≥3 consecutive runs) |
| `PLAYWRIGHT_CLS_BUDGET` | `0.05` | Req 14.3 |
| `PLAYWRIGHT_BYTES_BUDGET_KB` | `350` | Req 18.3 |
| `PLAYWRIGHT_OBSERVE_MS` | `5000` | Req 14.3 ("trong 5 giây") |
| `PLAYWRIGHT_AUTOSTART_WEB` | unset | Opt-in: spawn `pnpm dev:web` automatically |
| `FUXIE_PLAYWRIGHT_SKIP_SEEDED` | unset | Opt-in: skip seeded surfaces |

## What gets measured

* **CLS**: a `PerformanceObserver({ type: 'layout-shift', buffered: true })`
  is registered before navigation finishes (via `page.addInitScript`).
  Layout-shift entries with `hadRecentInput=true` are excluded per the
  Web Vitals spec. The accumulated value is read after a 5 s observation
  window post-`load`.

* **Bytes**: every response with a URL prefixed by
  `/mascot-3d/optimized/`, `/mascot-3d/world/optimized/`, or
  `/mascot-3d/ui/optimized/` is attributed to mascot / world / UI frame
  family respectively. We sum response body sizes for the three families
  per run. Reward props (`/reward-assets/optimized/`) are intentionally
  excluded — Req 18.3 budget is for "(mascot hero + world prop + UI
  frame)" only.

## Failure modes

Failing thresholds break the integration job (Task 18.1 acceptance).
Each assertion message names the surface, run index, observed value,
budget, and the requirement it violates so the trail back to the spec
is one click.

## Open follow-ups (PM)

* Surfaces marked `requiresSeed` rely on `pnpm db:seed:dev` having run.
  If a CI job runs against an empty DB the test soft-skips with a
  `seedNote` describing exactly which seed entry is missing — track
  these in the PM DoD pack (`docs/design/release/gamified-ui-asset-rollout-dod.md`).
* The `exam/[examId]` surface uses the `dev-a1-goethe-mini` slug. The
  exam route forwards the slug straight to the client, so if the
  template is missing the page may render an empty client shell rather
  than 404. Watch the `bytesBudget` failure mode for that case and
  adjust the seed if needed.


## Accessibility audit (`a11y.spec.tsx`, task 18.2)

`a11y.spec.tsx` is a Vitest + JSDOM suite — it does **not** boot a browser.
For each P0 surface listed in
[`requirements.md` Req 20.1](../../.kiro/specs/gamified-ui-asset-rollout/requirements.md)
it:

1. Renders the backbone component (`DashboardBackboneHero`,
   `ReviewBackboneHero`, `SkillMotivationLayer`, `RoleplayStage`,
   `VocabularyPracticeHero`, `VocabularyMicrogamesHero`,
   `ExamInProgressChrome`, `StateShell`) into a fresh JSDOM document.
2. Runs `axe.run` (the engine `@axe-core/playwright` wraps) over the
   rendered subtree and asserts zero `serious`/`critical` violations.
3. Walks the DOM for focusable nodes (`a, button, input,
   [tabindex]:not([tabindex="-1"])`) and asserts no positive `tabindex`
   re-orders the sequence — i.e. focus order matches DOM order
   (Req 4.2 + design §H).
4. Asserts every Primary_CTA carries the design-system focus outline
   contract emitted by `apps/web/src/components/ui/primary-cta.tsx`:
   `focus-visible:outline focus-visible:outline-2
   focus-visible:outline-offset-2
   focus-visible:outline-[var(--fuxie-blue-700)]`. The token contrast
   ratio against `#F3FBFF` and `#FFFFFF` is computed from the WCAG 2.1
   relative-luminance formula directly inside the spec so the
   assertion is self-contained.

### Documented gaps relative to the original task brief

* The backbone component is the unit of test, not the live route.
  Surfaces that need server-fetched fixtures (course nodes, vocabulary
  collection, full skill players, full shop, exam in-progress with
  seeded template) exercise the empty/error `StateShell` variant. Once
  task 18.1's Playwright + dev-auth setup stabilizes, the same spec
  surface can be re-implemented with `@axe-core/playwright` against the
  real route — this file documents the mapping in its module-level
  JSDoc.
* Pixel-level contrast on world-prop image backgrounds, computed
  outline width, and color-contrast on iconographic ligatures cannot be
  measured in JSDOM (no canvas backend). The static `<Scrim>` primitive
  guarantees ≥ 4.5:1 by construction; pixel-level verification belongs
  to the Playwright run once 18.1's webServer is reusable.

### Running locally

```bash
pnpm test:property      # runs all PBT specs + a11y.spec.tsx in ~2s
```

The spec is included automatically by `vitest.property.config.ts`
(`tests/**/*.spec.{ts,tsx}`). Playwright-flavoured specs are excluded
from that runner explicitly so `perf.spec.ts` does not blow up when
loaded without `@playwright/test`.


## Visual QA capture (`visual-capture.spec.ts`, spec `visual-qa-screenshot-capture`)

`visual-capture.spec.ts` is the Playwright capture run that closes R3
of the `gamified-ui-asset-rollout` DoD pack. It walks the entries in
[`tests/integration/visual-capture.manifest.json`](./visual-capture.manifest.json)
and writes one `fullPage` PNG per `<surface, state, viewport>` triple
to
`docs/design/visual-audit/qa-runs/2026-05-16/screenshots/<surface>/<surface>-<state>-<viewport>.png`.

The spec is bound to a dedicated Playwright project,
`chromium-mobile-capture`, that is a sibling of `chromium-mobile-slow4g`
and intentionally:

- does **not** register Slow 4G throttling (Req 5.4) so we never record
  a partial-render frame, and
- sets `screenshot: 'off'` (Req 5.3) so Playwright never auto-writes a
  debug PNG into `tmp/playwright/output/...` next to the on-disk
  evidence.

### Run

```bash
pnpm test:integration:capture
```

### Prerequisites

1. **Seed the dev database** so the four seeded surfaces (reading,
   listening, writing, exam) resolve their alias slugs:
   ```bash
   pnpm db:seed:dev
   ```
2. **Start the dev server with dev-auth enabled** at the default
   `http://localhost:3005`:
   ```bash
   FUXIE_DEV_AUTH_ENABLED=true pnpm dev:web
   ```
   (or set `PLAYWRIGHT_AUTOSTART_WEB=1` to let Playwright spawn it).
3. **Install Playwright browsers** (first time only):
   ```bash
   pnpm test:integration:install
   ```

`FUXIE_PLAYWRIGHT_SKIP_SEEDED=1` is **not** compatible with the capture
run — the spec fails immediately with a structured message because
seeded surfaces are required to capture every state in the manifest
(Req 4.2).

### Output

```
docs/design/visual-audit/qa-runs/2026-05-16/screenshots/
└── <surface>/
    └── <surface>-<state>-<viewport>.png
```

Every PNG path matches the `evidencePath` field on the corresponding
manifest entry, which in turn matches the `evidencePath` referenced by
the per-surface checklist files under
`docs/design/visual-audit/qa-runs/2026-05-16/*.md`.
`pnpm check:visual-audit` enforces this bijection (spec
`visual-qa-screenshot-capture`, Decision 6).

### Filtering by surface (`FUXIE_CAPTURE_ONLY`)

Set `FUXIE_CAPTURE_ONLY` to a comma-separated list of surface IDs to
narrow the run to those surfaces only (Req 11.3). The remaining
manifest entries are skipped via `test.skip`. Example:

```bash
FUXIE_CAPTURE_ONLY=dashboard,review pnpm test:integration:capture
```

Surface IDs match the `surface` field of `visual-capture.manifest.json`
and the `P0_SURFACES` table in
[`tests/integration/utils/surfaces.ts`](./utils/surfaces.ts).

### Reference

- Spec: `.kiro/specs/visual-qa-screenshot-capture/`
  ([requirements.md](../../.kiro/specs/visual-qa-screenshot-capture/requirements.md),
  [design.md](../../.kiro/specs/visual-qa-screenshot-capture/design.md),
  [tasks.md](../../.kiro/specs/visual-qa-screenshot-capture/tasks.md))
- DoD pack: [`docs/design/release/gamified-ui-asset-rollout-dod.md`](../../docs/design/release/gamified-ui-asset-rollout-dod.md)


## Reproducibility diff (`scripts/visual-capture-diff.ts`)

`scripts/visual-capture-diff.ts` is the offline reproducibility check
required by Req 9 of `visual-qa-screenshot-capture`. It compares two
PNG folders that were produced by back-to-back capture runs and exits
non-zero if any paired screenshot drifts beyond the agreed tolerance.

### Usage

```bash
tsx scripts/visual-capture-diff.ts <folderA> <folderB>
```

Each folder must contain the same `evidencePath` tree as
`docs/design/visual-audit/qa-runs/2026-05-16/screenshots/`. The script
walks every PNG in `folderA`, looks up the matching path in
`folderB`, and computes the per-pair distance.

### Threshold

A pair passes when its **Mean Absolute Pixel Difference (MAPD)** is
**≤ 2.0 / 255** on a `256 × 256` grayscale-luma resample of the two
PNGs (bilinear resize + Rec. 709 luma weighting). The script prints
one diagnostic line per pair:

```
<evidencePath>: MAPD=<value>
```

Exit code is 0 iff every pair is within tolerance, non-zero otherwise.
See spec `visual-qa-screenshot-capture` design.md Decision 7 for the
rationale (cheap, deterministic, anti-aliasing-tolerant).
