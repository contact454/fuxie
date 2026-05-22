# Exploration Findings — Property 1 Counterexample Log

> **Vai chinh:** QA Automation Engineer
> **Vai phoi hop:** Frontend Engineer, Product Designer

This document is the per-class counterexample log produced by task 1
of spec `fuxie-ui-ux-audit-fix`. Every entry below corresponds to one
fixture in `tests/audit/ui-ux/exploration.spec.ts` that the
**unfixed** `auditPass` failed to detect. Each failure is a concrete
counterexample to **Property 1 — Bug Condition** (design.md §
Correctness Properties), and together they confirm root causes 1–7 in
design.md § Hypothesized Root Cause.

## How to read this file

- **Fixture path** — file + JSDOM selector identifying the
  fixture inside `exploration.spec.ts`.
- **Viewport** — pinned reference viewport (one of {360×640, 375×667,
  414×896}) per design.md § Fix Implementation item 7.
- **`auditPass` output observed** — verbatim runtime value from the
  unfixed `auditPass` shim (modeling the current scattered QA pass per
  design.md § Glossary entry "auditPass").
- **Gap vs Finding Schema** — the precise way the observed output
  fails the unified Finding Schema declared in `bugfix.md` §
  Introduction § Finding Schema and the per-class evidence schema in
  `bugfix.md` § 2.11.
- **Root-cause hypothesis confirmed** — references back to
  design.md § Hypothesized Root Cause numbered list (1 — missing
  detectors; 2 — missing mobile viewport pin; 3 — missing unified
  Finding Schema; 4 — no severity mapping in code; 5 — no forward
  routing; 6 — incomplete per-class evidence; 7 — auto-P0 gate not
  encoded).

## Test execution summary

```
RUN  vitest run --config vitest.property.config.ts tests/audit/ui-ux/exploration.spec.ts
FAIL tests/audit/ui-ux/exploration.spec.ts (9 tests | 9 failed)
```

All 9 fixtures failed with `expected 1 received 0` — the unfixed
`auditPass` returned `[]` for every bug-condition input. Failure here
is the **success case** for the bugfix workflow's Exploratory Bug
Condition Checking step (design.md § Testing Strategy): it proves the
bug exists and surfaces concrete counterexamples for downstream
implementation tasks 3.1–3.14 to consume.

---

## 1.1 — Inconsistent spacing vs 4px/8px baseline

- **Fixture path:** `tests/audit/ui-ux/exploration.spec.ts` →
  `[data-fixture="kpi-card-1-1"]` (KPI card with `padding: 14px`).
- **Viewport:** 360 × 640.
- **Bug condition:** `padding: 14px` is a literal `Npx` value outside
  the 4px multiple set and outside the `--space-*` token set declared
  in `apps/web/src/app/globals.css` (bugfix.md § 1.1 conditions 1 and
  3).
- **`auditPass` output observed:** `[]` (zero findings).
- **Gap vs Finding Schema:**
  - No detector exists for class 1.1 — `auditPass` cannot scan
    `padding-*` / `margin-*` / `gap` for 4px-multiple compliance.
  - Even if a finding were emitted, the unified Finding Schema
    (`defectClass`, `severity`, `route`, `component`, `evidence`,
    `expected`, `screenshotPath`, `forwardTo`, `action`) is not
    available — there is no shared schema module yet.
  - Per-class evidence keys for 1.1 (`property`, `computedValue`,
    `expectedToken`, per `bugfix.md` § 2.11) are not produced
    anywhere in the current QA pass.
- **Root cause hypothesis confirmed:** 1 (missing detector), 2
  (missing mobile viewport pin: nothing else in `tests/` runs at
  360 × 640 specifically for spacing baselines), 3 (missing unified
  Finding Schema), 6 (no per-class evidence shape).

## 1.2 — Unclear typography hierarchy

- **Fixture path:** `tests/audit/ui-ux/exploration.spec.ts` →
  `[data-fixture="hierarchy-1-2"]` (heading + body share
  `font-size: 16px` and `font-weight: 600`).
- **Viewport:** 375 × 667.
- **Bug condition:** Adjacent semantic ranks (heading ↔ body) have
  `font-size` ratio 1.0× (< 1.125×) AND `font-weight` delta 0 (< 200)
  in the same semantic block (bugfix.md § 1.2 condition (a)).
- **`auditPass` output observed:** `[]`.
- **Gap vs Finding Schema:**
  - No detector enforces `font-size` ∈ `--text-*-size` token set or
    the 1.125×/200 ratio rule.
  - Evidence keys for 1.2 (`fontSize`, `fontWeight`,
    `expectedTokenSet`) are not produced.
- **Root cause hypothesis confirmed:** 1, 2, 3, 6.

## 1.3 — Off-token color usage (excluding Reward containment)

- **Fixture path:** `tests/audit/ui-ux/exploration.spec.ts` →
  `[data-fixture="off-token-1-3"]` (button with inline
  `style="background:#1da1f2"`).
- **Viewport:** 414 × 896.
- **Bug condition:** Inline style uses literal hex `#1da1f2` outside
  the canonical Bright Sky token set in `apps/web/src/app/globals.css`
  (bugfix.md § 1.3 condition 1).
- **`auditPass` output observed:** `[]`.
- **Gap vs Finding Schema:**
  - No detector regex-scans className/style/inline style for literal
    hex/rgb/hsl/named CSS colors.
  - No CIEDE2000 ΔE computation against canonical tokens, so the
    "near-but-not-equal" trap (bugfix.md § 1.3 condition 4) is
    invisible.
  - Evidence keys for 1.3 (`literal`, `nearestToken`, `deltaE`) are
    not produced.
- **Root cause hypothesis confirmed:** 1, 3, 6.

## 1.4 — Reward Amber containment violation (auto-P0)

- **Fixture path:** `tests/audit/ui-ux/exploration.spec.ts` →
  `[data-fixture="reward-leak-1-4"]` (button with inline
  `style="background:#FFB703"` outside any Reward_State subtree).
- **Viewport:** 360 × 640.
- **Bug condition:** Button background ΔE2000 < 5.0 vs `#FFB703`; no
  ancestor matches `[data-reward-state="preview|earned|receipt"]` or
  `[data-reward-context="true"]` (bugfix.md § 1.4).
- **`auditPass` output observed:** `[]`.
- **Gap vs Finding Schema:**
  - `tests/reward-amber-containment.spec.tsx` (Property 9 from spec
    `gamified-ui-asset-rollout`) DOES enforce the runtime contract on
    its surface fixtures, but it does NOT publish a `Finding[]` JSON
    with the unified shape. Its assertion failures are surfaced as
    fast-check counterexamples, not as schema-conformant Findings,
    so consumers downstream cannot triage by `defectClass` /
    `severity` / `forwardTo`.
  - Auto-P0 gate (bugfix.md § 2.4 ii — `severity = P0` and
    `auditRun.status = "fail"`) is not encoded in any current code
    path.
  - Evidence keys for 1.4 (`nodeSelector`, `ancestorChain`,
    `computedColorHex`) are not packaged into a Finding object.
  - Forward routing target (`forwardTo: "gamified-ui-asset-rollout"`,
    `action: "forward"`) is not produced.
- **Root cause hypothesis confirmed:** 3 (no unified schema even
  though detector logic is partially present), 5 (no forward
  routing), 7 (auto-P0 gate not encoded as code).

## 1.5 — Alignment / CTA overflow container

- **Fixture path:** `tests/audit/ui-ux/exploration.spec.ts` →
  `[data-fixture="cta-overflow-1-5"]` (primary CTA at `left:16px`
  `width:288px` inside container `width:300px`; right edge overflows
  by 4px).
- **Viewport:** 375 × 667.
- **Bug condition:** CTA bounding rect overlap > 0px vs content
  container right edge (bugfix.md § 1.5 (d), § 2.10 row 1.5 P0 when
  on primary task surface).
- **`auditPass` output observed:** `[]`.
- **Gap vs Finding Schema:**
  - No detector measures CTA bounding rect vs container or
    safe-area padding.
  - Evidence keys for 1.5 (`kind`, `firstSelector`, `secondSelector`,
    `driftPx`) are not produced.
- **Root cause hypothesis confirmed:** 1, 2, 3, 6.

## 1.6 — Component pattern inconsistency across routes (paired)

- **Fixture path:** `tests/audit/ui-ux/exploration.spec.ts` →
  `[data-fixture="kpi-pair-1-6"]` (two `.kpi-card` instances on
  `(learn)/dashboard` and `(learn)/course` with `padding: 12px` vs
  `padding: 16px`, no state-attribute).
- **Viewport:** 360 × 640.
- **Bug condition:** Same `className` root (`.kpi-card`) on two
  different `(learn)/*` routes renders with different computed
  `padding-*` and carries no `data-variant` / `aria-disabled` /
  `data-loading` / `data-selected` to explain the diff (bugfix.md §
  1.6 — canonical counterexample called out in the spec).
- **`auditPass` output observed:** `[]`.
- **Gap vs Finding Schema:**
  - No detector groups nodes by component-pattern precedence and
    diffs computed style across routes.
  - Paired evidence (bugfix.md § 2.6 iii — two routes, two
    selectors, two computed style snapshots, two screenshots) is the
    strictest evidence shape in 2.11; nothing in the current QA
    pass produces it.
  - The validator-rejects-unpaired-findings rule (bugfix.md § 2.6
    iii) cannot be enforced because no validator exists.
- **Root cause hypothesis confirmed:** 1, 3, 6 (the paired evidence
  contract is the canonical example of "incomplete per-class
  evidence enforcement").

## 1.7 — Error state exposes stack trace (auto-P0)

- **Fixture path:** `tests/audit/ui-ux/exploration.spec.ts` →
  `[data-fixture="stack-trace-1-7"]` (`error.tsx` rendering
  `<pre>{stack}</pre>` with a multi-line Node.js TLS stack).
- **Viewport:** 360 × 640.
- **Bug condition:** Error state exposes raw runtime stack to the
  learner (bugfix.md § 1.7 condition 3, § 2.7 iii — auto-P0).
- **`auditPass` output observed:** `[]`.
- **Gap vs Finding Schema:**
  - `tests/p0-surface-render.spec.tsx` covers _whether_ error
    surfaces render at all on P0 routes, but it does not assert "no
    stack trace exposed" and does not publish a Finding with
    `evidence.exposesStackTrace = true`.
  - Auto-P0 rule (`defectClass = "1.7" && evidence.exposesStackTrace
    ⇒ severity = "P0"`) is not encoded as code.
  - Evidence keys for 1.7 (`stateKind`, `missingComponents`,
    `exposesStackTrace`) are not produced.
- **Root cause hypothesis confirmed:** 1 (partial), 3, 6, 7 (auto-P0
  gate not encoded).

## 1.8 — Layout-driven text overflow

- **Fixture path:** `tests/audit/ui-ux/exploration.spec.ts` →
  `[data-fixture="overflow-1-8"]` (button with DE compound noun
  ~46 chars inside fixed `width: 200px` button, flex ancestor missing
  `min-width: 0`, `overflow:hidden` + `text-overflow:ellipsis` on a
  meaningful CTA label).
- **Viewport:** 360 × 640.
- **Bug condition:** Meaningful CTA label receives DE compound noun
  inside fixed `Npx` width container with `overflow:hidden` +
  `text-overflow:ellipsis`, flex ancestor missing `min-width: 0`
  (bugfix.md § 1.8 (b), (d), (e)).
- **`auditPass` output observed:** `[]`.
- **Gap vs Finding Schema:**
  - No detector injects synthetic DE 40-char / VI 30-char strings
    into dynamic text slots and re-measures overflow.
  - No detector reads computed `overflow` / `text-overflow` /
    `min-width` / `width` and checks the `min-width: 0` invariant on
    flex/grid ancestors.
  - Evidence keys for 1.8 (`containerSelector`, `overflowKind`,
    `syntheticString`) are not produced.
- **Root cause hypothesis confirmed:** 1, 2, 3, 6.

## 1.9 — Asset spacing rhythm / oversize asset (P0 with forward)

- **Fixture path:** `tests/audit/ui-ux/exploration.spec.ts` →
  `[data-fixture="asset-oversize-1-9"]` (hero illustration at
  `375 × 360` occupying ~54% of above-the-fold area; primary CTA
  "Bắt đầu mission" pushed below the 667px fold).
- **Viewport:** 375 × 667 (the iPhone SE-class above-the-fold
  reference).
- **Bug condition:** Asset > 40% above-the-fold area AND primary CTA
  pushed below fold (bugfix.md § 1.9 (c); § 2.10 row 1.9 P0).
- **`auditPass` output observed:** `[]`.
- **Gap vs Finding Schema:**
  - No detector identifies decoration assets and measures their area
    ratio vs primary CTA / above-the-fold share.
  - No forward routing emits `forwardTo:
    "gamified-ui-asset-rollout"` with `action: "forward"` (bugfix.md
    § 2.9 iv — fix requires reducing rendered asset size, owned by
    that other spec).
  - Evidence keys for 1.9 (`assetSelector`, `assetAreaPx2`,
    `primaryCtaAreaPx2`, `aboveTheFoldShare`, `pushesCtaBelowFold`)
    are not produced.
- **Root cause hypothesis confirmed:** 1, 3, 5 (forward routing
  missing), 6.

---

## Aggregate confirmation of design.md § Hypothesized Root Cause

| Root cause | Confirmed by fixtures | Evidence |
| --- | --- | --- |
| 1 — Missing detectors for 7/9 classes | 1.1, 1.2, 1.3, 1.5, 1.6, 1.8, 1.9 | All 7 fixtures yielded `[]` from `auditPass`. |
| 2 — No mobile-viewport-pinned pipeline | 1.1, 1.2, 1.5, 1.8 | Defect classes that only show on viewport ≤ 480px were entirely missed. |
| 3 — Missing unified Finding Schema | 1.1–1.9 (all 9) | Every fixture emitted no schema-conformant Finding object — the schema does not exist. |
| 4 — No severity mapping in code | 1.1–1.9 (all 9) | Severity (per `bugfix.md` § 2.10) is not assignable by any detector. |
| 5 — No forward routing | 1.4, 1.9 | Findings that should set `forwardTo: "gamified-ui-asset-rollout"` are not produced. |
| 6 — Incomplete per-class evidence | 1.1–1.9 (all 9) | No fixture emitted the per-class evidence keys required by `bugfix.md` § 2.11; class 1.6's paired-evidence rule is unenforceable. |
| 7 — Auto-P0 gate not encoded | 1.4, 1.7 | Reward Amber non-exempt and `evidence.exposesStackTrace` do not force `severity = "P0"` or fail the run. |

These confirmations unblock task 3 (build `auditPass'` per design.md
§ Fix Implementation, sub-tasks 3.1 – 3.14). When `auditPass'` lands,
task 3.15 re-runs `tests/audit/ui-ux/exploration.spec.ts` against the
real entrypoint; the same assertions encoded above will pass and the
nine counterexamples will turn into nine schema-valid Findings.
