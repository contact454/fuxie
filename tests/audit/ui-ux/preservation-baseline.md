# Preservation Baseline — Property 2 Observed Output Log

> **Vai chinh:** QA Automation Engineer
> **Vai phoi hop:** Frontend Engineer, Product Designer

This document is the observation-first baseline produced by **task 2** of
spec `fuxie-ui-ux-audit-fix`. Per the bugfix workflow's Preservation
Checking step (design.md § Testing Strategy § Preservation Checking),
we MUST capture the verbatim behaviour of the **UNFIXED** `auditPass`
on three categories of input *before* we can encode preservation as a
property. Recorded values become the post-fix invariant: anything
listed here MUST stay identical when `auditPass'` lands.

The artefacts checked in here pair 1:1 with the assertions in
`tests/audit/ui-ux/preservation.spec.ts` (PBT 2.A, 2.B, 2.D — PBT 2.C
is `it.skip` until task 3.13 implements forward routing).

---

## A. Existing test surfaces (PBT 2.D baseline)

`bugfix.md` § 3.6 + design.md § Preservation Requirements pin every
test in the list below as part of the unchanged behaviour contract.
Their pre-fix pass/fail status is the post-fix invariant: PBT 2.D
re-runs each suite and asserts the count and status match this log.

### Run command

```
npx vitest run --config vitest.property.config.ts \
  tests/reward-amber-containment.spec.tsx \
  tests/p0-surface-render.spec.tsx \
  tests/result-reward-loop.spec.tsx \
  tests/review-display.spec.tsx \
  tests/skill-motivation-layer.spec.tsx \
  tests/vocabulary-card.spec.tsx \
  tests/ui-primitives.spec.tsx \
  tests/mascot-role.spec.tsx \
  tests/asset-discipline.spec.tsx \
  tests/course-path.spec.tsx \
  tests/locale-parity.spec.ts
```

### Observed result (verbatim)

```
RUN  v3.2.4 C:/Users/DMF Schule/9-Fuxie

 ✓ tests/asset-discipline.spec.ts          (13 tests) 43ms
 ✓ tests/vocabulary-card.spec.tsx          (6 tests)  337ms
 ✓ tests/mascot-role.spec.tsx              (11 tests) 298ms
 ✓ tests/skill-motivation-layer.spec.tsx   (10 tests) 332ms
 ✓ tests/ui-primitives.spec.tsx            (34 tests) 109ms
 ✓ tests/review-display.spec.tsx           (9 tests)  431ms
 ✓ tests/result-reward-loop.spec.tsx       (3 tests)  549ms
 ✓ tests/p0-surface-render.spec.tsx        (18 tests) 503ms
 ✓ tests/course-path.spec.tsx              (5 tests)  681ms
 ✓ tests/locale-parity.spec.ts             (21 tests) 2991ms
 ✓ tests/reward-amber-containment.spec.tsx (43 tests) 10623ms

 Test Files  11 passed (11)
      Tests  173 passed (173)
```

> The `asset-discipline` suite is committed as `tests/asset-discipline.spec.ts`
> at the workspace root. Tasks.md in this spec quotes the older path
> `tests/asset-discipline.spec.tsx`; the suite was renamed to `.ts`
> when its React-rendering helpers moved into a non-JSX module. The
> baseline below tracks the on-disk filename so PBT 2.D can resolve it
> at runtime.

### Per-file baseline table

| # | File | Status | Tests | Notes |
| - | --- | --- | --- | --- |
| 1 | `tests/reward-amber-containment.spec.tsx`  | **pass** | 43 | Property 9 + Property 22 — Reward Amber containment + Bright Sky CTA discipline (Req 6.9, 10.1, 10.4, 11.7, 16.1–16.5, 19.4). Already covers part of `auditPass`'s class 1.4 contract. |
| 2 | `tests/p0-surface-render.spec.tsx`         | **pass** | 18 | P0 surface render baseline — partial coverage of class 1.7 (state quality). |
| 3 | `tests/result-reward-loop.spec.tsx`        | **pass** | 3  | Property 15 — Result_Reward_Loop Earned + Receipt contract (task 6.4). |
| 4 | `tests/review-display.spec.tsx`            | **pass** | 9  | Review backbone display contract. |
| 5 | `tests/skill-motivation-layer.spec.tsx`    | **pass** | 10 | Skill_Motivation_Layer banner contract (Req 6.9). |
| 6 | `tests/vocabulary-card.spec.tsx`           | **pass** | 6  | Vocabulary card contract. |
| 7 | `tests/ui-primitives.spec.tsx`             | **pass** | 34 | UI primitives palette / state contract. |
| 8 | `tests/mascot-role.spec.tsx`               | **pass** | 11 | Mascot role + Reward_State role contract. |
| 9 | `tests/asset-discipline.spec.ts`           | **pass** | 13 | Asset discipline (registry-anchored). On-disk file is `.spec.ts`; tasks.md spelling `.spec.tsx` predates the rename. |
| 10 | `tests/course-path.spec.tsx`              | **pass** | 5  | Property 11 — Course Path Node State Discipline (Req 4.1–4.7, 4.9). |
| 11 | `tests/locale-parity.spec.ts`             | **pass** | 21 | Property 18 — Locale parity + t() discipline (task 17.5). |

### Invariant captured for PBT 2.D

```
existingTestSuiteBaseline = {
  totalFiles:  11,
  totalTests:  173,
  failures:    0,
  perFileStatus: { /* all "pass" — see table above */ },
}
```

PBT 2.D's job in `preservation.spec.ts` is to assert that re-running
this list against `auditPass'` produces an identical record. Any
deviation (added failure, dropped test, different file count) is a
preservation regression.

---

## B. Compliant DOM at viewport 360×640 (PBT 2.A baseline)

A fixture using **only** Bright Sky color tokens, **only** `--text-*-size`
typography tokens, **only** 4px-multiple spacing, and **no** Reward
Amber outside a `[data-reward-state="earned"]` subtree at viewport
**360 × 640**.

### Fixture markup

```html
<main data-route="(learn)/dashboard">
  <section
    data-fixture="compliant-2-a"
    style="
      background: var(--fuxie-blue-50);
      padding: 16px;
      gap: 8px;
      display: flex;
      flex-direction: column;
    "
  >
    <h2 style="font-size: var(--text-xl-size); font-weight: 700; margin: 0">
      Tổng quan hôm nay
    </h2>
    <p style="font-size: var(--text-base-size); font-weight: 400; margin: 0">
      Bạn còn 2 hoạt động để hoàn thành mục tiêu hôm nay.
    </p>
    <div data-reward-state="earned" style="padding: 12px; gap: 4px">
      <span style="background: var(--fuxie-reward); padding: 4px 8px">
        +10 Fucoin
      </span>
    </div>
    <button
      data-role="primary-cta"
      style="
        background: var(--fuxie-action);
        color: white;
        padding: 12px 16px;
        margin-top: 16px;
        height: 44px;
      "
    >
      Tiếp tục học
    </button>
  </section>
</main>
```

### Observed `auditPass` output

```json
[]
```

Zero findings. (`auditPass` is a `[] for every input` shim per
`exploration.spec.ts` § Section 2.) PBT 2.A asserts this property
holds for the full generated space of compliant DOMs — and it MUST
keep holding once the real detectors land in `auditPass'`.

---

## C. Spacing/typography drift at viewport 1280×800 (PBT 2.B baseline)

The **same** drift content as the class 1.1 / 1.2 fixtures from the
exploration step, but rendered at **viewport 1280 × 800** (desktop).
Per `bugfix.md` § 3.5 and design.md § Fix Implementation item 7,
viewport ≥ 768px is a desktop pass-through: `auditPass'` SHALL
short-circuit with `changesProposed: ∅`.

### Fixture markup

```html
<main data-route="(learn)/dashboard">
  <!-- 1.1-shaped drift: padding 14px is a literal Npx, not a 4px multiple -->
  <div data-fixture="drift-1-1-desktop" style="padding: 14px; background: #E0F2FE">
    <p>Streak hôm nay</p>
    <strong>7 ngày</strong>
  </div>
  <!-- 1.2-shaped drift: heading and body share font-size 16px and weight 600 -->
  <section data-fixture="drift-1-2-desktop">
    <h2 style="font-size: 16px; font-weight: 600">Bài đọc số 1</h2>
    <p style="font-size: 16px; font-weight: 600">
      Đoạn văn này nói về một ngày của Anna ở Berlin.
    </p>
  </section>
</main>
```

### Observed `auditPass` output

```json
[]
```

Zero findings. The drift exists but the viewport gate (`viewport.width
>= 768`) takes precedence — the audit is mobile-first by `bugfix.md`
§ Scope (In). PBT 2.B asserts no `action: "fix"` Finding is emitted
across arbitrary drift × arbitrary viewport in `[768, 1920]`.

---

## D. Layout-fit truncation from 200-char copy (informational, PBT 2.C reference)

A fixture where text is truncated **because the copy is 200 chars in a
fit-content container**, NOT because of a layout cause. Per `bugfix.md`
§ 3.1 + § 1.8 / § 2.8, this content belongs to spec
`learner-copy-localization-backfill`; `auditPass'` must `forward` it,
never recommend a layout fix.

### Fixture markup

```html
<main data-route="(learn)/listening">
  <p
    data-fixture="copy-truncation-2-d"
    style="
      max-width: max-content;
      min-width: 0;
      overflow-wrap: anywhere;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    "
  >
    Hôm nay bạn sẽ luyện kỹ năng nghe với một đoạn hội thoại dài về kế hoạch cuối tuần ở Berlin, bao gồm các chủ đề về di chuyển, ăn uống và các hoạt động ngoài trời cùng người bản xứ.
  </p>
</main>
```

(Copy length: 200 characters. Container correctly uses `max-content` +
`min-width: 0` + `overflow-wrap: anywhere`, so the layout invariants
from `bugfix.md` § 2.8 (i)–(v) are met. Truncation is a function of
copy length, not layout.)

### Observed `auditPass` output

```json
[]
```

Zero findings. (`auditPass` has no detector for class 1.8 today; the
post-fix invariant is that `auditPass'` recognizes copy-driven
truncation and emits `action: "forward"` with `forwardTo:
"learner-copy-localization-backfill"` — never a layout fix
recommendation.)

PBT 2.C, which encodes this forward-routing assertion across the four
`ownedByOtherSpec` clusters (asset choice/position, wording/microcopy,
screenshot tooling, registry/filename hygiene), is parked at
`it.skip` in `preservation.spec.ts` until task 3.13 lands the forward
router. Tasks.md task 3.16 un-skips PBT 2.C.

---

## Summary table — what PBT 2.A / 2.B / 2.C / 2.D each observe

| PBT | Property | Observed on UNFIXED `auditPass` | Status on UNFIXED |
| --- | --- | --- | --- |
| 2.A | Compliant DOM, viewport ≤ 480px → `auditPass(X) = ∅` | `[]` | **pass** |
| 2.B | Desktop viewport (768 ≤ w ≤ 1920) → no `action: "fix"` finding | `[]` (no findings at all) | **pass** |
| 2.C | `ownedByOtherSpec` cluster → `action: "forward"` with correct `targetSpec` | n/a (`auditPass` has no router) — `it.skip` until task 3.13 | **skipped (parked)** |
| 2.D | Existing 11-file test list re-runs with identical pass/fail | 11 files / 173 tests, **all pass** (matrix above) | **pass** |

These four observations close the observation-first step of task 2.
They become the runtime invariants encoded in
`tests/audit/ui-ux/preservation.spec.ts`, and they are the diff target
for task 3.16 (re-run preservation tests against `auditPass'`).
