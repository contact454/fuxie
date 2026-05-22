# Asset Archive

Vai chinh: Project Manager / Delivery Manager
Vai phoi hop: Design System Designer

## Purpose

This document is the **single source of truth for optimized asset files
that exist on disk under `apps/web/public/` but are intentionally NOT
referenced by the Asset Registry**. It is consumed by
`scripts/asset-audit.ts` (`pnpm check:asset-audit`) which treats every
unreferenced optimized file as an orphan unless it has an entry here.

An archive entry says: *"we know this file exists, we have decided not to
wire it into a registry key today, and here is why."* It is **not** a
substitute for deleting files; it is a controlled exception so we can
keep the file available (e.g. for rollback or for a future surface)
without failing CI.

Validates: Requirements 2.2, 2.5.

## File format

The audit script parses this file as a Markdown table whose first column
is the public path (starting with `/`). Rows whose first column does not
start with `/` (header, divider, prose) are ignored. Any line outside the
table is also ignored, so prose like this section is safe to keep.

The required columns are:

| Column        | Meaning                                                                        |
| ------------- | ------------------------------------------------------------------------------ |
| `Path`        | Public path under `apps/web/public/`, e.g. `/mascot-3d/optimized/foo-512.webp` |
| `Reason`      | Short justification for archiving (e.g. "superseded by v2 in registry")        |
| `Archived by` | Person or role that archived the entry (e.g. `PM`, `DSD`, `FE`)                |
| `Date`        | ISO date `YYYY-MM-DD` when the entry was added                                 |

## Ownership convention

- **Whoever removes a registry reference (or generates a new optimized
  variant we are not yet ready to wire) MUST add the corresponding row in
  the same PR.** Reviewers should reject a PR that orphans an asset
  without an archive entry.
- **DSD owns the format and the taxonomy of `Reason` strings.** Prefer
  one of the canonical reasons below so audit logs stay searchable:
  - `legacy v1 — superseded by v2 in registry`
  - `legacy v1 — pending v2 swap (no v2 on disk yet)`
  - `variant — png alongside webp, kept for rollback`
  - `variant — alternative pose, not yet wired to a surface`
  - `seed — generated for future surface, registry wiring pending <task>`
- **PM owns the rollout schedule.** Archive entries are reviewed at the
  end of each rollout milestone; entries older than 90 days without a
  follow-up task should either be wired into the registry or deleted
  from `apps/web/public/`.
- **Engineering deletes**, not archive entries, are the long-term resting
  state. This file should shrink over time, not grow.

## Known follow-ups (NOT archived here)

The audit also enforces Requirement 2.3 (no registry value may point
inside `raw/`, `concept/`, `foundation/`, or `reference-parts/`). The
`FUXIE_FOUNDATION_ASSETS` map currently exposes 8 keys whose values live
under `/mascot-3d/foundation/v1/...`. Those are **registry references**,
not orphan files, so they cannot be silenced by archiving — they must be
either:

- relocated into a non-forbidden folder (preferred), or
- removed from the registry and any consumer rewired to a non-foundation
  variant.

This is tracked as a separate registry-refactor follow-up and is out of
scope for task 2.4. Adding those paths to this archive would be wrong:
they are referenced, not orphaned.

## Archived files

| Path | Reason | Archived by | Date |
| ---- | ------ | ----------- | ---- |
| /mascot-3d/optimized/fuxie-3d-core-celebration-512.png | variant — png alongside webp, kept for rollback | PM | 2026-05-16 |
| /mascot-3d/optimized/fuxie-3d-core-celebration-512.webp | seed — generated for future surface, registry wiring pending §6 result loop | PM | 2026-05-16 |
| /mascot-3d/optimized/fuxie-3d-core-daily-mission-512.png | variant — png alongside webp, kept for rollback | PM | 2026-05-16 |
| /mascot-3d/optimized/fuxie-3d-core-daily-mission-512.webp | seed — generated for future surface, registry wiring pending §3 dashboard | PM | 2026-05-16 |
| /mascot-3d/optimized/fuxie-3d-core-happy-wave-512.png | variant — png alongside webp, kept for rollback | PM | 2026-05-16 |
| /mascot-3d/optimized/fuxie-3d-core-happy-wave-512.webp | seed — generated for future surface, registry wiring pending §3 dashboard greeting | PM | 2026-05-16 |
| /mascot-3d/optimized/fuxie-3d-game-fucoin-reward-512.png | variant — png alongside webp, kept for rollback | PM | 2026-05-16 |
| /mascot-3d/optimized/fuxie-3d-game-fucoin-reward-512.webp | seed — generated for future surface, registry wiring pending §7 result reward loop | PM | 2026-05-16 |
| /mascot-3d/optimized/fuxie-3d-game-streak-freeze-saved-512.png | variant — png alongside webp, kept for rollback | PM | 2026-05-16 |
| /mascot-3d/optimized/fuxie-3d-game-streak-freeze-saved-512.webp | seed — generated for future surface, registry wiring pending streak save flow | PM | 2026-05-16 |
| /mascot-3d/optimized/fuxie-3d-role-exam-guide-512.png | variant — png alongside webp, kept for rollback | PM | 2026-05-16 |
| /mascot-3d/optimized/fuxie-3d-role-exam-guide-512.webp | seed — generated for future surface, registry wiring pending §10 exam | PM | 2026-05-16 |
| /mascot-3d/optimized/fuxie-3d-role-librarian-512.png | variant — png alongside webp, kept for rollback | PM | 2026-05-16 |
| /mascot-3d/optimized/fuxie-3d-role-librarian-512.webp | seed — generated for future surface, registry wiring pending §6.4 reading | PM | 2026-05-16 |
| /mascot-3d/optimized/fuxie-3d-role-pack-contact-sheet.png | variant — contact sheet for QA review, not a learner-facing asset | PM | 2026-05-16 |
| /mascot-3d/optimized/fuxie-3d-role-post-office-512.png | variant — png alongside webp, kept for rollback | PM | 2026-05-16 |
| /mascot-3d/optimized/fuxie-3d-role-post-office-512.webp | seed — generated for future surface, registry wiring pending §6.8 writing | PM | 2026-05-16 |
| /mascot-3d/optimized/fuxie-3d-role-radio-host-512.png | variant — png alongside webp, kept for rollback | PM | 2026-05-16 |
| /mascot-3d/optimized/fuxie-3d-role-radio-host-512.webp | seed — generated for future surface, registry wiring pending §6.5 listening | PM | 2026-05-16 |
| /mascot-3d/optimized/fuxie-3d-role-shopkeeper-512.png | variant — png alongside webp, kept for rollback | PM | 2026-05-16 |
| /mascot-3d/optimized/fuxie-3d-role-shopkeeper-512.webp | seed — generated for future surface, registry wiring pending §8 shop | PM | 2026-05-16 |
| /mascot-3d/optimized/fuxie-3d-role-speaking-coach-512.png | variant — png alongside webp, kept for rollback | PM | 2026-05-16 |
| /mascot-3d/optimized/fuxie-3d-role-speaking-coach-512.webp | seed — generated for future surface, registry wiring pending §6.6 speaking | PM | 2026-05-16 |
| /mascot-3d/optimized/fuxie-placeholder-512.webp | placeholder asset — referenced via PLACEHOLDER_ASSET constant, not a registry map value | PM | 2026-05-16 |
| /mascot-3d/world/optimized/v1/fuxie-world-01-village-square-512.png | legacy v1 — superseded by v2 in registry | PM | 2026-05-16 |
| /mascot-3d/world/optimized/v1/fuxie-world-02-mission-board-512.png | legacy v1 — superseded by v2 in registry | PM | 2026-05-16 |
| /mascot-3d/world/optimized/v1/fuxie-world-03-course-signpost-512.png | legacy v1 — superseded by v2 in registry | PM | 2026-05-16 |
| /mascot-3d/world/optimized/v1/fuxie-world-04-market-stall-512.png | legacy v1 — superseded by v2 in registry | PM | 2026-05-16 |
| /mascot-3d/world/optimized/v1/fuxie-world-04-market-stall-512.webp | legacy v1 — superseded by v2 in registry | PM | 2026-05-16 |
| /mascot-3d/world/optimized/v1/fuxie-world-05-library-512.png | legacy v1 — superseded by v2 in registry | PM | 2026-05-16 |
| /mascot-3d/world/optimized/v1/fuxie-world-05-library-512.webp | legacy v1 — superseded by v2 in registry | PM | 2026-05-16 |
| /mascot-3d/world/optimized/v1/fuxie-world-06-radio-booth-512.png | legacy v1 — superseded by v2 in registry | PM | 2026-05-16 |
| /mascot-3d/world/optimized/v1/fuxie-world-06-radio-booth-512.webp | legacy v1 — superseded by v2 in registry | PM | 2026-05-16 |
| /mascot-3d/world/optimized/v1/fuxie-world-07-post-office-512.png | legacy v1 — superseded by v2 in registry | PM | 2026-05-16 |
| /mascot-3d/world/optimized/v1/fuxie-world-07-post-office-512.webp | legacy v1 — superseded by v2 in registry | PM | 2026-05-16 |
| /mascot-3d/world/optimized/v1/fuxie-world-08-town-hall-exam-512.png | legacy v1 — superseded by v2 in registry | PM | 2026-05-16 |
| /mascot-3d/world/optimized/v1/fuxie-world-08-town-hall-exam-512.webp | legacy v1 — superseded by v2 in registry | PM | 2026-05-16 |
| /mascot-3d/world/optimized/v1/fuxie-world-09-review-garden-512.png | legacy v1 — superseded by v2 in registry | PM | 2026-05-16 |
| /mascot-3d/world/optimized/v1/fuxie-world-09-review-garden-512.webp | legacy v1 — superseded by v2 in registry | PM | 2026-05-16 |
| /mascot-3d/world/optimized/v1/fuxie-world-10-chat-cafe-512.png | legacy v1 — superseded by v2 in registry | PM | 2026-05-16 |
| /mascot-3d/world/optimized/v1/fuxie-world-10-chat-cafe-512.webp | legacy v1 — superseded by v2 in registry | PM | 2026-05-16 |
| /mascot-3d/world/optimized/v1/fuxie-world-11-grammar-scroll-512.png | legacy v1 — superseded by v2 in registry | PM | 2026-05-16 |
| /mascot-3d/world/optimized/v1/fuxie-world-11-grammar-scroll-512.webp | legacy v1 — superseded by v2 in registry | PM | 2026-05-16 |
| /mascot-3d/world/optimized/v1/fuxie-world-12-speaking-stage-512.png | legacy v1 — superseded by v2 in registry | PM | 2026-05-16 |
| /mascot-3d/world/optimized/v1/fuxie-world-12-speaking-stage-512.webp | legacy v1 — superseded by v2 in registry | PM | 2026-05-16 |
| /mascot-3d/world/optimized/v1/fuxie-world-13-collection-book-512.png | legacy v1 — superseded by v2 in registry | PM | 2026-05-16 |
| /mascot-3d/world/optimized/v1/fuxie-world-13-collection-book-512.webp | legacy v1 — superseded by v2 in registry | PM | 2026-05-16 |
| /mascot-3d/world/optimized/v1/fuxie-world-14-phrase-stamp-512.png | legacy v1 — superseded by v2 in registry | PM | 2026-05-16 |
| /mascot-3d/world/optimized/v1/fuxie-world-15-postcard-fragment-512.png | legacy v1 — superseded by v2 in registry | PM | 2026-05-16 |
| /mascot-3d/world/optimized/v1/fuxie-world-16-badge-shelf-512.png | legacy v1 — superseded by v2 in registry | PM | 2026-05-16 |
| /mascot-3d/world/optimized/v2/fuxie-world-collection-book-table-512.webp | seed — v2 generated, registry wiring pending §I.3 vocabulary collection book | PM | 2026-05-16 |
| /mascot-3d/world/optimized/v2/fuxie-world-course-signpost-path-512.webp | seed — v2 generated, registry wiring pending §I.2 course path | PM | 2026-05-16 |
| /mascot-3d/world/optimized/v2/fuxie-world-market-backpack-stall-512.webp | seed — v2 generated, registry wiring pending §I.6 shop / inventory | PM | 2026-05-16 |
| /mascot-3d/world/optimized/v2/fuxie-world-post-office-counter-512.webp | seed — v2 generated, registry wiring pending §6.8 writing | PM | 2026-05-16 |
| /mascot-3d/world/optimized/v2/fuxie-world-radio-booth-console-512.webp | seed — v2 generated, registry wiring pending §6.5 listening | PM | 2026-05-16 |
| /mascot-3d/world/optimized/v2/fuxie-world-reading-library-desk-512.webp | seed — v2 generated, registry wiring pending §6.4 reading | PM | 2026-05-16 |
| /mascot-3d/world/optimized/v2/fuxie-world-speaking-stage-cafe-512.webp | seed — v2 generated, registry wiring pending §6.6 speaking | PM | 2026-05-16 |
| /mascot-3d/ui/optimized/v1/fuxie-ui-audio-broadcast-panel-512.webp | seed — generated for future surface, registry wiring pending §6.5 listening frame | PM | 2026-05-16 |
| /mascot-3d/ui/optimized/v1/fuxie-ui-collection-card-frame-512.webp | seed — generated for future surface, registry wiring pending §I.3 vocabulary mastered frame | PM | 2026-05-16 |
| /mascot-3d/ui/optimized/v1/fuxie-ui-course-checkpoint-node-512.webp | seed — generated for future surface, registry wiring pending §I.2 course path | PM | 2026-05-16 |
| /mascot-3d/ui/optimized/v1/fuxie-ui-empty-state-signpost-512.webp | seed — generated for future surface, registry wiring pending §11 empty states | PM | 2026-05-16 |
| /mascot-3d/ui/optimized/v1/fuxie-ui-letter-receipt-frame-512.webp | seed — generated for future surface, registry wiring pending §7 result reward loop | PM | 2026-05-16 |
| /mascot-3d/ui/optimized/v1/fuxie-ui-market-shelf-frame-512.webp | seed — generated for future surface, registry wiring pending §I.6 shop / inventory | PM | 2026-05-16 |
| /mascot-3d/ui/optimized/v1/fuxie-ui-notice-board-frame-512.webp | seed — generated for future surface, registry wiring pending §3 dashboard mission board | PM | 2026-05-16 |
| /mascot-3d/ui/optimized/v1/fuxie-ui-result-reveal-frame-512.webp | seed — generated for future surface, registry wiring pending §7 result reward loop | PM | 2026-05-16 |
| /reward-assets/optimized/fuxie-item-cefr-badge-a1-512.png | variant — png alongside webp/sprite, kept for rollback | PM | 2026-05-16 |
| /reward-assets/optimized/fuxie-item-cefr-badge-a2-512.png | variant — png alongside webp/sprite, kept for rollback | PM | 2026-05-16 |
| /reward-assets/optimized/fuxie-item-cefr-badge-b1-512.png | variant — png alongside webp/sprite, kept for rollback | PM | 2026-05-16 |
| /reward-assets/optimized/fuxie-item-cefr-badge-b2-512.png | variant — png alongside webp/sprite, kept for rollback | PM | 2026-05-16 |
| /reward-assets/optimized/fuxie-item-cefr-badges-512.png | variant — combined sprite, png-only, kept for rollback | PM | 2026-05-16 |
| /reward-assets/optimized/fuxie-item-fucoin-512.png | variant — png alongside webp, kept for rollback | PM | 2026-05-16 |
| /reward-assets/optimized/fuxie-item-fuxie-sky-outfit-512.png | variant — png alongside webp, kept for rollback | PM | 2026-05-16 |
| /reward-assets/optimized/fuxie-item-german-postcard-512.png | variant — png alongside webp, kept for rollback | PM | 2026-05-16 |
| /reward-assets/optimized/fuxie-item-hint-ticket-512.png | variant — png alongside webp, kept for rollback | PM | 2026-05-16 |
| /reward-assets/optimized/fuxie-item-inventory-market-prop-512.png | variant — png alongside webp, kept for rollback | PM | 2026-05-16 |
| /reward-assets/optimized/fuxie-item-streak-freeze-512.png | variant — png alongside webp, kept for rollback | PM | 2026-05-16 |
| /reward-assets/optimized/fuxie-item-unlock-key-512.png | variant — png alongside webp, kept for rollback | PM | 2026-05-16 |
| /reward-assets/optimized/fuxie-item-xp-star-512.png | variant — png alongside webp, kept for rollback | PM | 2026-05-16 |
