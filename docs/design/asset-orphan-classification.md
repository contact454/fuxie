# Asset Orphan Classification — 80 archived files

**Spec:** `asset-registry-cleanup` (Phase 3, Task 4.1)
**Vai chinh:** Frontend Engineer
**Vai phoi hop:** Design System Designer (Task 4.2 review)
**Date:** 2026-05-16
**Status:** DRAFT — ready for DSD review (Task 4.2)
**Source list:** `docs/design/asset-archive.md` (80 entries, 4-column table)

## Purpose

This document is FE's draft classification of every archived file under
`apps/web/public/mascot-3d/optimized/`,
`apps/web/public/mascot-3d/world/optimized/`,
`apps/web/public/mascot-3d/ui/optimized/`, and
`apps/web/public/reward-assets/optimized/` that the audit script flags
as either an orphan or a registry gap. It feeds Tasks 4.3–4.5 of
`asset-registry-cleanup`, which apply the verdicts.

This file does NOT modify any registry. It does NOT modify
`docs/design/asset-archive.md`. It is review material only.

Validates: Requirements 4.1, 4.2, 4.5 of the cleanup spec.

## Method

Each row in the archive doc was classified using the heuristic from
`design.md` Decision 4:

1. **`wire-into-registry`** — file has a documented integration target
   in `docs/design/visual-audit/fuxie-german-village-image-generation-manifest.json`
   or in `docs/design/learner-ui-design-production-plan.md` (i.e. the
   asset is the canonical art for an existing or imminent registry key,
   and the registry currently points elsewhere).
2. **`keep-archived`** — file has no documented integration target in
   the production plan, and the existing archive reason ("legacy v1 —
   superseded by v2", "variant — png alongside webp, kept for
   rollback", "seed — generated for future surface, registry wiring
   pending §X") is still accurate. No change to the archive doc; the
   audit already excludes these via `parseArchiveEntries` so they do
   NOT count as orphans. They DO still count toward the coverage
   denominator.
3. **`delete`** — file is a true duplicate (binary equivalent or
   superseded variant) with zero rollback value. Per Decision 4,
   "default thiên về archive khi không chắc chắn"; FE uses `delete`
   sparingly so DSD has a small, defensible delete set to sign off on.

For every `wire-into-registry` row, the proposed registry target and
camelCase key match the design manifest's `integrationTarget` field
exactly so Task 4.3 has zero naming ambiguity.

## Verdict summary

| Verdict | Count | Notes |
| --- | --- | --- |
| `wire-into-registry` | 27 | 7 v2 world plates (Block C), 8 UI v1 frames (Block D), 11 core/role/game `.webp` seeds (Block A), 1 placeholder (Block A row 24). Tasks 4.3 to add/rewire keys. |
| `keep-archived` (no change) | 51 | Legacy v1 (paired with already-wired `.webp`), v1 webp+png pairs superseded by v2 plan, png-only reward rollback variants, contact sheet for QA. |
| `delete` | 2 | v1 `.webp` files whose registry key has been redirected to a global path AND have no v2 plate planned. DSD to confirm in Task 4.2. |
| **Total** | **80** | Matches archive.md row count. |

## Per-file table

Columns: `#`, `Path`, `Verdict`, `Asset_Key (if wire)`, `Target map (if
wire)`, `Reason / Notes`. Path is the public path (under
`apps/web/public/`) starting with `/`.

### Block A — `mascot-3d/optimized/` (24 entries)

| # | Path | Verdict | Asset_Key | Target map | Reason / Notes |
| --- | --- | --- | --- | --- | --- |
| 1 | /mascot-3d/optimized/fuxie-3d-core-celebration-512.png | keep-archived | – | – | png alongside webp; .webp variant is the wire candidate (row 2). Keep for rollback. |
| 2 | /mascot-3d/optimized/fuxie-3d-core-celebration-512.webp | wire-into-registry | `coreCelebration` | `FUXIE_MASCOT_STATES` | Result-loop celebration pose, manifest §6 result loop. Adds a non-v2 alias so legacy callers can phase in. |
| 3 | /mascot-3d/optimized/fuxie-3d-core-daily-mission-512.png | keep-archived | – | – | png alongside webp. |
| 4 | /mascot-3d/optimized/fuxie-3d-core-daily-mission-512.webp | wire-into-registry | `coreDailyMission` | `FUXIE_MASCOT_STATES` | Dashboard daily-mission greeting, manifest §3 dashboard. |
| 5 | /mascot-3d/optimized/fuxie-3d-core-happy-wave-512.png | keep-archived | – | – | png alongside webp. |
| 6 | /mascot-3d/optimized/fuxie-3d-core-happy-wave-512.webp | wire-into-registry | `coreHappyWave` | `FUXIE_MASCOT_STATES` | Dashboard greeting wave, manifest §3 dashboard greeting. |
| 7 | /mascot-3d/optimized/fuxie-3d-game-fucoin-reward-512.png | keep-archived | – | – | png alongside webp. |
| 8 | /mascot-3d/optimized/fuxie-3d-game-fucoin-reward-512.webp | wire-into-registry | `gameFucoinReward` | `FUXIE_MASCOT_STATES` | Result reward loop §7 (mascot pose paired with the fucoin reward asset). |
| 9 | /mascot-3d/optimized/fuxie-3d-game-streak-freeze-saved-512.png | keep-archived | – | – | png alongside webp. |
| 10 | /mascot-3d/optimized/fuxie-3d-game-streak-freeze-saved-512.webp | wire-into-registry | `gameStreakFreezeSaved` | `FUXIE_MASCOT_STATES` | Streak save flow (mascot reaction when streak freeze prevents a break). |
| 11 | /mascot-3d/optimized/fuxie-3d-role-exam-guide-512.png | keep-archived | – | – | png alongside webp. |
| 12 | /mascot-3d/optimized/fuxie-3d-role-exam-guide-512.webp | wire-into-registry | `roleExamGuide` | `FUXIE_MASCOT_STATES` | §10 exam role surface; complements existing `examProctor`. |
| 13 | /mascot-3d/optimized/fuxie-3d-role-librarian-512.png | keep-archived | – | – | png alongside webp. |
| 14 | /mascot-3d/optimized/fuxie-3d-role-librarian-512.webp | wire-into-registry | `roleLibrarian` | `FUXIE_MASCOT_STATES` | §6.4 reading role surface; complements `sessionFocusCoach` for reading. |
| 15 | /mascot-3d/optimized/fuxie-3d-role-pack-contact-sheet.png | keep-archived | – | – | DSD QA contact sheet; not a learner-facing asset. Reason already canonical. |
| 16 | /mascot-3d/optimized/fuxie-3d-role-post-office-512.png | keep-archived | – | – | png alongside webp. |
| 17 | /mascot-3d/optimized/fuxie-3d-role-post-office-512.webp | wire-into-registry | `rolePostOffice` | `FUXIE_MASCOT_STATES` | §6.8 writing role surface. |
| 18 | /mascot-3d/optimized/fuxie-3d-role-radio-host-512.png | keep-archived | – | – | png alongside webp. |
| 19 | /mascot-3d/optimized/fuxie-3d-role-radio-host-512.webp | wire-into-registry | `roleRadioHost` | `FUXIE_MASCOT_STATES` | §6.5 listening role surface. |
| 20 | /mascot-3d/optimized/fuxie-3d-role-shopkeeper-512.png | keep-archived | – | – | png alongside webp. |
| 21 | /mascot-3d/optimized/fuxie-3d-role-shopkeeper-512.webp | wire-into-registry | `roleShopkeeper` | `FUXIE_MASCOT_STATES` | §8 shop role surface; complements existing `rewardClerk`. |
| 22 | /mascot-3d/optimized/fuxie-3d-role-speaking-coach-512.png | keep-archived | – | – | png alongside webp. |
| 23 | /mascot-3d/optimized/fuxie-3d-role-speaking-coach-512.webp | wire-into-registry | `roleSpeakingCoach` | `FUXIE_MASCOT_STATES` | §6.6 speaking role surface. |
| 24 | /mascot-3d/optimized/fuxie-placeholder-512.webp | wire-into-registry | `placeholder` | `FUXIE_MASCOT_STATES` | Already referenced via `PLACEHOLDER_ASSET` constant; adding a registry key makes it a first-class fallback that audit can count. |

### Block B — `mascot-3d/world/optimized/v1/` (23 entries)

| # | Path | Verdict | Asset_Key | Target map | Reason / Notes |
| --- | --- | --- | --- | --- | --- |
| 25 | /mascot-3d/world/optimized/v1/fuxie-world-01-village-square-512.png | keep-archived | – | – | .webp wired via `FUXIE_WORLD_PROPS.villageSquare`; png is rollback variant. |
| 26 | /mascot-3d/world/optimized/v1/fuxie-world-02-mission-board-512.png | keep-archived | – | – | .webp wired via `FUXIE_WORLD_PROPS.missionBoard`; png is rollback variant. |
| 27 | /mascot-3d/world/optimized/v1/fuxie-world-03-course-signpost-512.png | keep-archived | – | – | v1 superseded; current `courseSignpost` redirects to `villageSignpostCluster`. v2 plate (row 56) is the wire target. |
| 28 | /mascot-3d/world/optimized/v1/fuxie-world-03-course-signpost-512.webp | delete | – | – | v1 webp NOT wired (key remapped to global) AND v2 wire candidate exists (row 56). Keeping both v1.png + v1.webp + v2.webp triples disk usage with no rollback need beyond the .png. **DSD to confirm.** |
| 29 | /mascot-3d/world/optimized/v1/fuxie-world-04-market-stall-512.png | keep-archived | – | – | v1 superseded; current `marketStall` redirects to global. |
| 30 | /mascot-3d/world/optimized/v1/fuxie-world-04-market-stall-512.webp | keep-archived | – | – | v1 superseded; v2 wire candidate `marketBackpackStall` (row 58). Keep webp for rollback (more conservative than row 28; flagged for DSD discussion). |
| 31 | /mascot-3d/world/optimized/v1/fuxie-world-05-library-512.png | keep-archived | – | – | v1 superseded; current `library` redirects to `readingLibrary` global. |
| 32 | /mascot-3d/world/optimized/v1/fuxie-world-05-library-512.webp | keep-archived | – | – | v1 superseded; v2 wire candidate `readingLibraryDesk` (row 60). |
| 33 | /mascot-3d/world/optimized/v1/fuxie-world-06-radio-booth-512.png | keep-archived | – | – | v1 superseded; current `radioBooth` redirects to `radioListeningTower`. |
| 34 | /mascot-3d/world/optimized/v1/fuxie-world-06-radio-booth-512.webp | keep-archived | – | – | v1 superseded; v2 wire candidate `radioBoothConsole` (row 59). |
| 35 | /mascot-3d/world/optimized/v1/fuxie-world-07-post-office-512.png | keep-archived | – | – | v1 superseded; current `postOffice` redirects to `writingPostOffice`. |
| 36 | /mascot-3d/world/optimized/v1/fuxie-world-07-post-office-512.webp | keep-archived | – | – | v1 superseded; v2 wire candidate `postOfficeCounter` (row 57). |
| 37 | /mascot-3d/world/optimized/v1/fuxie-world-08-town-hall-exam-512.png | keep-archived | – | – | v1 superseded; current `townHallExam` redirects to `rathausExamHall`. |
| 38 | /mascot-3d/world/optimized/v1/fuxie-world-08-town-hall-exam-512.webp | keep-archived | – | – | v1 superseded; no v2 plate planned (exam location uses global). |
| 39 | /mascot-3d/world/optimized/v1/fuxie-world-09-review-garden-512.png | keep-archived | – | – | v1 superseded; current `reviewGarden` redirects to `reviewGardenGreenhouse`. |
| 40 | /mascot-3d/world/optimized/v1/fuxie-world-09-review-garden-512.webp | keep-archived | – | – | v1 superseded; no v2 plate planned. |
| 41 | /mascot-3d/world/optimized/v1/fuxie-world-10-chat-cafe-512.png | keep-archived | – | – | v1 superseded; current `chatCafe` redirects to global cafe room. |
| 42 | /mascot-3d/world/optimized/v1/fuxie-world-10-chat-cafe-512.webp | keep-archived | – | – | v1 superseded; v2 wire candidate `speakingStageCafe` (row 61) covers same surface. |
| 43 | /mascot-3d/world/optimized/v1/fuxie-world-11-grammar-scroll-512.png | keep-archived | – | – | v1 superseded; current `grammarScroll` redirects to global learning prop. |
| 44 | /mascot-3d/world/optimized/v1/fuxie-world-11-grammar-scroll-512.webp | keep-archived | – | – | v1 superseded; no v2 plate planned. |
| 45 | /mascot-3d/world/optimized/v1/fuxie-world-12-speaking-stage-512.png | keep-archived | – | – | v1 superseded; v2 wire candidate `speakingStageCafe` (row 61). |
| 46 | /mascot-3d/world/optimized/v1/fuxie-world-12-speaking-stage-512.webp | keep-archived | – | – | v1 superseded; v2 wire candidate exists. |
| 47 | /mascot-3d/world/optimized/v1/fuxie-world-13-collection-book-512.png | keep-archived | – | – | v1 superseded; v2 wire candidate `collectionBookTable` (row 55). |
| 48 | /mascot-3d/world/optimized/v1/fuxie-world-13-collection-book-512.webp | keep-archived | – | – | v1 superseded; v2 wire candidate exists. |
| 49 | /mascot-3d/world/optimized/v1/fuxie-world-14-phrase-stamp-512.png | keep-archived | – | – | .webp wired via `FUXIE_WORLD_PROPS.phraseStamp`; png is rollback variant. |
| 50 | /mascot-3d/world/optimized/v1/fuxie-world-15-postcard-fragment-512.png | keep-archived | – | – | .webp wired via `FUXIE_WORLD_PROPS.postcardFragment`; png is rollback variant. |
| 51 | /mascot-3d/world/optimized/v1/fuxie-world-16-badge-shelf-512.png | keep-archived | – | – | v1 superseded; current `badgeShelf` redirects to `badgeMuseumShelfRoom`. |
| 52 | /mascot-3d/world/optimized/v1/fuxie-world-16-badge-shelf-512.webp | delete | – | – | v1 webp NOT wired AND no v2 plate planned (badge shelf uses global). **DSD to confirm.** Keeping the .png (row 51) covers any visual rollback. |

> Note on v1 world block: rows 28 and 52 are FE's two `delete` proposals. Both share the same shape: v1 `.webp` not wired, no v2 candidate, png sibling already archived as rollback. Every other v1 webp is `keep-archived` because either the .webp itself is still wired, or a v2 plate planned for the same surface keeps the v1 valuable as a swap-back fallback while the v2 rollout settles.

### Block C — `mascot-3d/world/optimized/v2/` (7 entries)

These 7 plates are the canonical v2 world art per `docs/design/visual-audit/fuxie-german-village-image-generation-manifest.json`. The corresponding `FUXIE_WORLD_PROPS` keys (`courseSignpostPath`, `collectionBookTable`, `readingLibraryDesk`, `radioBoothConsole`, `speakingStageCafe`, `postOfficeCounter`, `marketBackpackStall`) currently redirect to `/world/global/` paths, leaving the v2 plates orphan-on-disk. Wiring repoints those keys to the v2 paths matching the manifest's `runtimeTarget` and `integrationTarget` fields exactly.

| # | Path | Verdict | Asset_Key | Target map | Reason / Notes |
| --- | --- | --- | --- | --- | --- |
| 53 | /mascot-3d/world/optimized/v2/fuxie-world-collection-book-table-512.webp | wire-into-registry | `collectionBookTable` | `FUXIE_WORLD_PROPS` | Manifest `integrationTarget` matches existing key; rewire from global to v2 plate. |
| 54 | /mascot-3d/world/optimized/v2/fuxie-world-course-signpost-path-512.webp | wire-into-registry | `courseSignpostPath` | `FUXIE_WORLD_PROPS` | Manifest `integrationTarget` matches existing key; rewire from `cefrGatePlaza` global to v2 plate. |
| 55 | /mascot-3d/world/optimized/v2/fuxie-world-market-backpack-stall-512.webp | wire-into-registry | `marketBackpackStall` | `FUXIE_WORLD_PROPS` | Manifest `integrationTarget` matches existing key; rewire from `marketStall` global to v2 plate. |
| 56 | /mascot-3d/world/optimized/v2/fuxie-world-post-office-counter-512.webp | wire-into-registry | `postOfficeCounter` | `FUXIE_WORLD_PROPS` | Manifest `integrationTarget` matches existing key; rewire from `writingPostOffice` global to v2 plate. |
| 57 | /mascot-3d/world/optimized/v2/fuxie-world-radio-booth-console-512.webp | wire-into-registry | `radioBoothConsole` | `FUXIE_WORLD_PROPS` | Manifest `integrationTarget` matches existing key; rewire from `radioListeningTower` global to v2 plate. |
| 58 | /mascot-3d/world/optimized/v2/fuxie-world-reading-library-desk-512.webp | wire-into-registry | `readingLibraryDesk` | `FUXIE_WORLD_PROPS` | Manifest `integrationTarget` matches existing key; rewire from `readingLibrary` global to v2 plate. |
| 59 | /mascot-3d/world/optimized/v2/fuxie-world-speaking-stage-cafe-512.webp | wire-into-registry | `speakingStageCafe` | `FUXIE_WORLD_PROPS` | Manifest `integrationTarget` matches existing key; rewire from `speakingStageCafe` global to v2 plate. |

### Block D — `mascot-3d/ui/optimized/v1/` (8 entries)

8 frame plates with explicit `runtimeTarget` paths in the design manifest. `FUXIE_UI_FRAMES` already exposes matching keys (`noticeBoard`, `courseCheckpointNode`, `collectionCardFrame`, `audioBroadcastPanel`, `letterReceiptFrame`, `resultRevealFrame`, `marketShelfFrame`, `emptyStateSignpost`) all currently redirected to `FUXIE_GLOBAL_UI_FRAMES.*`. Wiring repoints them to the v1 frame plates.

| # | Path | Verdict | Asset_Key | Target map | Reason / Notes |
| --- | --- | --- | --- | --- | --- |
| 60 | /mascot-3d/ui/optimized/v1/fuxie-ui-audio-broadcast-panel-512.webp | wire-into-registry | `audioBroadcastPanel` | `FUXIE_UI_FRAMES` | Manifest §6.5 listening; rewire from `skillPlayerMotivation` global. |
| 61 | /mascot-3d/ui/optimized/v1/fuxie-ui-collection-card-frame-512.webp | wire-into-registry | `collectionCardFrame` | `FUXIE_UI_FRAMES` | Manifest §I.3 vocabulary mastered; rewire from `villageQuestCard`. |
| 62 | /mascot-3d/ui/optimized/v1/fuxie-ui-course-checkpoint-node-512.webp | wire-into-registry | `courseCheckpointNode` | `FUXIE_UI_FRAMES` | Manifest §I.2 course path; rewire from `cefrPathNode`. |
| 63 | /mascot-3d/ui/optimized/v1/fuxie-ui-empty-state-signpost-512.webp | wire-into-registry | `emptyStateSignpost` | `FUXIE_UI_FRAMES` | Manifest §11 empty states; rewire from `emptyStateSign`. |
| 64 | /mascot-3d/ui/optimized/v1/fuxie-ui-letter-receipt-frame-512.webp | wire-into-registry | `letterReceiptFrame` | `FUXIE_UI_FRAMES` | Manifest §7 result reward; rewire from `rewardApprovalReceipt`. |
| 65 | /mascot-3d/ui/optimized/v1/fuxie-ui-market-shelf-frame-512.webp | wire-into-registry | `marketShelfFrame` | `FUXIE_UI_FRAMES` | Manifest §I.6 shop; rewire from `shopItemShelf`. |
| 66 | /mascot-3d/ui/optimized/v1/fuxie-ui-notice-board-frame-512.webp | wire-into-registry | `noticeBoard` | `FUXIE_UI_FRAMES` | Manifest §3 dashboard mission board; rewire from `villageQuestCard`. |
| 67 | /mascot-3d/ui/optimized/v1/fuxie-ui-result-reveal-frame-512.webp | wire-into-registry | `resultRevealFrame` | `FUXIE_UI_FRAMES` | Manifest §7 result reward; rewire from `resultRewardReveal`. |

### Block E — `reward-assets/optimized/` (13 entries)

All 13 reward archive entries are `.png` rollback variants alongside an already-wired `.webp` (or sprite). FE keeps every one as `keep-archived`; the existing reason in `archive.md` is canonical and accurate. None of these need to wire — the wired counterpart is already in `REWARD_ASSETS`.

| # | Path | Verdict | Asset_Key | Target map | Reason / Notes |
| --- | --- | --- | --- | --- | --- |
| 68 | /reward-assets/optimized/fuxie-item-cefr-badge-a1-512.png | keep-archived | – | – | `REWARD_ASSETS.cefrBadgeA1` resolves the .webp; png kept for rollback. |
| 69 | /reward-assets/optimized/fuxie-item-cefr-badge-a2-512.png | keep-archived | – | – | `REWARD_ASSETS.cefrBadgeA2` resolves the .webp. |
| 70 | /reward-assets/optimized/fuxie-item-cefr-badge-b1-512.png | keep-archived | – | – | `REWARD_ASSETS.cefrBadgeB1` resolves the .webp. |
| 71 | /reward-assets/optimized/fuxie-item-cefr-badge-b2-512.png | keep-archived | – | – | `REWARD_ASSETS.cefrBadgeB2` resolves the .webp. |
| 72 | /reward-assets/optimized/fuxie-item-cefr-badges-512.png | keep-archived | – | – | `REWARD_ASSETS.cefrBadges` resolves the .webp sprite. |
| 73 | /reward-assets/optimized/fuxie-item-fucoin-512.png | keep-archived | – | – | `REWARD_ASSETS.fucoin` resolves the .webp. |
| 74 | /reward-assets/optimized/fuxie-item-fuxie-sky-outfit-512.png | keep-archived | – | – | `REWARD_ASSETS.fuxieSkyOutfit` resolves the .webp; reason "seed — outfit reward" should change to "variant — png alongside webp" since the webp IS wired. **DSD to confirm reason update.** |
| 75 | /reward-assets/optimized/fuxie-item-german-postcard-512.png | keep-archived | – | – | `REWARD_ASSETS.germanPostcard` resolves the .webp; same reason update flagged. **DSD to confirm.** |
| 76 | /reward-assets/optimized/fuxie-item-hint-ticket-512.png | keep-archived | – | – | `REWARD_ASSETS.hintTicket` resolves the .webp. |
| 77 | /reward-assets/optimized/fuxie-item-inventory-market-prop-512.png | keep-archived | – | – | `REWARD_ASSETS.inventoryMarketProp` resolves the .webp. |
| 78 | /reward-assets/optimized/fuxie-item-streak-freeze-512.png | keep-archived | – | – | `REWARD_ASSETS.streakFreeze` resolves the .webp. |
| 79 | /reward-assets/optimized/fuxie-item-unlock-key-512.png | keep-archived | – | – | `REWARD_ASSETS.unlockKey` resolves the .webp. |
| 80 | /reward-assets/optimized/fuxie-item-xp-star-512.png | keep-archived | – | – | `REWARD_ASSETS.xpStar` resolves the .webp. |

## Coverage projection

Baseline (from `docs/design/asset-cleanup-baseline.md`):

- Files on disk in 4 Optimized_Folder: **104**
- Currently referenced by Asset Registry: **24**
- Coverage: **23.08%** (24 / 104) — fails 0.95 threshold

After applying FE's draft verdicts:

- New unique referenced paths added by `wire-into-registry`: **+27** (rows 2, 4, 6, 8, 10, 12, 14, 17, 19, 21, 23, 24, 53–67)
  - 7 of these (rows 53–59) **rewire** existing keys from `/world/global/` paths to v2 plates. Net change to `registryValues` set: +7 new paths added, 7 old global paths potentially removed from registry values. Whether the 7 old global paths remain referenced depends on whether other keys still point at them.
  - 8 of these (rows 60–67) similarly rewire `FUXIE_UI_FRAMES` keys from global frames to v1 frame plates. Same caveat.
  - 11 of these (rows 2, 4, 6, 8, 10, 12, 14, 17, 19, 21, 23) add NEW keys for `.webp` core/role/game seeds — pure additions to `FUXIE_MASCOT_STATES`.
  - 1 (row 24) adds `placeholder` key — pure addition for `fuxie-placeholder-512.webp`.
- Files removed by `delete`: **2** (rows 28, 52). Denominator 104 → 102.
- New unique paths in registry after wiring: estimate **24 + 27 = 51** (assuming the 15 rewires don't double-count when their previous target is no longer reachable from any key).
- Coverage projection: **51 / 102 ≈ 50.0%**.

**This is below the 0.95 threshold required by Phase 3 (Task 4.6).**

That is intentional. Per Decision 4 of `design.md`, FE drafts a
conservative verdict set ("default thiên về archive khi không chắc
chắn") and DSD review (Task 4.2) is responsible for locking in either
(a) more aggressive `delete` calls on the 51 keep-archived rows that
have no v2 plan, or (b) an extended wire pass that the manifest does
not yet cover but that DSD signs off on. FE is NOT comfortable
unilaterally promoting "keep-archived" rows to `delete` without DSD
sign-off because doing so removes rollback options that PM owns.

Two paths to 95% that DSD can choose from in Task 4.2:

- **Path A — aggressive delete, conservative wire (shrink denominator):**
  delete rows 30, 32, 34, 36, 38, 40, 42, 44, 46, 48 (10 v1 webp's
  whose surface either has a v2 plate or is now served by a global
  asset). Denominator drops to 102 − 10 = 92. With wire = 27, coverage
  = 51 / 92 ≈ 55.4%. Still under 0.95. Need to also delete the 13 v1
  png siblings (rows 25–27, 29, 31, 33, 35, 37, 39, 41, 43, 45, 47,
  49, 51) and the 13 reward `.png` variants (rows 68–80). Denominator
  drops further. This is the realistic path; FE flags it explicitly
  for DSD.
- **Path B — wire everything that physically exists (grow numerator):**
  add NEW keys for every `.webp` not currently wired, which would
  cover most v1 webp's and would push coverage above 0.95 without any
  delete. Cleaner from a "preserve rollback" angle but inflates
  `FUXIE_MASCOT_STATES` / `FUXIE_WORLD_PROPS` with keys nobody calls
  yet. DSD owns whether that registry bloat is acceptable.

Recommended hybrid (FE non-binding suggestion for DSD):

1. Apply all 27 `wire-into-registry` rows in this draft (Tasks 4.3).
2. After DSD sign-off, **delete every `.png` rollback variant whose
   `.webp` is wired** (rows 25, 26, 49, 50, 68–80 = 17 deletes).
   These have a known canonical webp in the registry; rollback to png
   is unlikely and easy to redo from source if needed.
3. After DSD sign-off, **delete v1 webp orphans whose surface is
   covered by a v2 plate** (rows 30, 32, 34, 36, 38(*), 40(*), 42, 44(*),
   46, 48 — 7 to 10 deletes depending on DSD; rows marked (*) have no
   v2 plate and DSD may still archive). Combined with steps 1+2, the
   denominator drops by ~26, numerator climbs by 27, projection lands
   near 51 / 78 ≈ 65% — still short. **DSD needs to either approve
   ~30 more deletes (everything legacy v1 disk-side) or wire ~40 more
   keys.**

FE recommends DSD pick **Path B + selective Path A**: wire everything
in this draft, delete the ~17 png rollback siblings of an already-wired
webp (low risk, easy to recover), and let DSD decide the long tail
(~50 v1 webp/png + UI/world rollbacks) over the next milestone rather
than rushing the whole 80 in this PR.

If DSD approves a large enough delete pass in Task 4.2, Tasks 4.3–4.6
can drive coverage ≥ 0.95 in this PR. If DSD prefers a slower glide
path, the cleanup spec may need a follow-on milestone — flagged for PM.

## Notes for DSD review (Task 4.2)

### Reason taxonomy used

FE used only canonical reasons from the existing
`docs/design/asset-archive.md` ownership convention:

- `legacy v1 — superseded by v2 in registry`
- `variant — png alongside webp, kept for rollback`
- `seed — generated for future surface, registry wiring pending §X`
- `variant — contact sheet for QA review, not a learner-facing asset`
- `placeholder asset — referenced via PLACEHOLDER_ASSET constant, not a registry map value`

No new reasons were introduced. Two existing rows have a stale reason
that DSD can update during Task 4.2:

- Row 74 (`fuxie-item-fuxie-sky-outfit-512.png`) currently reads
  `seed — outfit reward, registry wiring pending §I.6 shop inventory`
  but the `.webp` IS already wired via `REWARD_ASSETS.fuxieSkyOutfit`.
  Update to `variant — png alongside webp, kept for rollback`.
- Row 75 (`fuxie-item-german-postcard-512.png`) — same pattern.
  Update to `variant — png alongside webp, kept for rollback`.

### Borderline cases

- Row 28 (`fuxie-world-03-course-signpost-512.webp`) and row 52
  (`fuxie-world-16-badge-shelf-512.webp`) are FE's only two `delete`
  proposals. Both are v1 `.webp` files that are NOT currently wired in
  the registry AND have no v2 plate planned for the same surface (or
  the surface uses a global asset instead). DSD may prefer
  `keep-archived` if rollback to v1 is conceivable.
- Rows 24 (`fuxie-placeholder-512.webp`) is a meta wire — adding the
  placeholder file as a registry key just so the audit counts it. DSD
  may prefer `keep-archived` (with a reason update from `placeholder
  asset — referenced via PLACEHOLDER_ASSET constant…` to `placeholder
  asset — referenced as registry fallback only`) instead of growing
  `FUXIE_MASCOT_STATES`. Either choice is fine; FE leans toward wire
  because it keeps the registry self-describing.

### Wire candidates pending consumer/UX confirmation

The 11 mascot-state `.webp` seeds (rows 2, 4, 6, 8, 10, 12, 14, 17, 19,
21, 23) wire to `FUXIE_MASCOT_STATES` to satisfy registry membership
per Task 4.3 + Req 4.1, but **no consumer call site is being added in
this PR** (Task 4.3 explicitly says "registry membership alone is
sufficient to clear the orphan"). Product Designer / Gamification
Designer may want to confirm naming (`coreCelebration` vs `coreResult`
etc.) before Task 4.3 commits the keys. FE used the manifest's
descriptive nouns where possible.

The 7 v2 world plates (rows 53–59) and 8 UI v1 frames (rows 60–67) are
**rewires** of existing keys, not new keys. Rewiring changes the
visual surface from a global asset to a v2/v1 plate, which is a UX
shift. DSD/Product Designer should confirm before Task 4.3 commits
the value swaps. If a rewire is rejected, the affected v2/v1 file
should be reclassified to `keep-archived`.

### What this draft does NOT do

- It does NOT modify any registry file (`fuxie-assets.ts`,
  `reward-assets.ts`). Tasks 4.3–4.5 do that.
- It does NOT modify `docs/design/asset-archive.md`. Task 4.4
  appends rows for any new `archive` decisions; this draft only
  proposes `keep-archived` for rows that are already in the doc.
- It does NOT delete any file. Task 4.5 does deletes.
- It does NOT touch `FUXIE_FOUNDATION_ASSETS` or
  `scripts/foundation-assets.ts` — Phase 1 already handled FOUNDATION.

## Sign-off (Task 4.2)

- [ ] **Frontend Engineer** — _draft author_ — table below reflects FE's
      proposed verdicts, ready for DSD challenge.
- [ ] **Design System Designer** — locks reason taxonomy, signs off on
      delete calls (rows 28, 52), reviews wire-rewires in Block C and
      Block D, finalises coverage strategy (Path A / Path B / hybrid).
- [ ] **Product Manager / Delivery Manager** — reviews delete impact
      on rollout schedule (rollback paths), sign-off only required if
      DSD elects Path A (aggressive delete).

## Cross-references

- Spec home: `.kiro/specs/asset-registry-cleanup/`
- Design doc: `.kiro/specs/asset-registry-cleanup/design.md` (Decision 4)
- Source list: `docs/design/asset-archive.md` (80 entries)
- Audit baseline: `docs/design/asset-cleanup-baseline.md`
- Image generation manifest:
  `docs/design/visual-audit/fuxie-german-village-image-generation-manifest.json`
- Production plan (UI/World naming):
  `docs/design/learner-ui-design-production-plan.md`
