# Slice B — Dashboard wow-gap: Fucoin wallet + claimable missions + reward reveal

Owner: Claude (spec/QC) → Antigravity (implement). Date: 2026-06-03.
Model: `.agents/workflows/three-agent-delivery-model.md`. Assets: none new (`docs/design/asset-reuse-map.md`).

## Context & Goal

The production dashboard (`components/dashboard/DashboardMockupClient.tsx`) looks like
Quest Worlds but is hollow at its motivational core: **no Fucoin wallet**, **read-only
missions** (no claim), and **no reward-reveal moment**. The full wallet + claim +
`RewardRevealMoment` logic already exists in the **dead** `dashboard-client.tsx` and
the data already flows to the mockup client. This slice is **re-wiring, not new design**:
surface the reward loop the vision requires ("explain why to learn next").

Key fact: all data is already fetched and passed. `page.tsx` (`DashboardDefaultBody`)
fetches via `getMissionBoard` and spreads into `data`; `DashboardClientDynamic.tsx:24-26`
forwards `{...props}` to `DashboardMockupClient`. **Do NOT change `page.tsx` or
`DashboardClientDynamic.tsx`. No new server fetch.**

Primary file: `apps/web/src/components/dashboard/DashboardMockupClient.tsx`.
Reuse from (read-only reference, the dead client): `apps/web/src/components/dashboard/dashboard-client.tsx:581-609` (claim handler) and `:937-990` (reveal celebration).

## Requirements (SHALL, testable)

- **R-1 — Fucoin wallet.** The dashboard header SHALL display the live Fucoin balance from `data.missionBoard.wallet.balance`, and it SHALL update after a successful claim. Desktop header stat cluster: `DashboardMockupClient.tsx:188-221` (insert after the level badge at `:196-198`); mirror in mobile chip row `:119-129` if feasible.
- **R-2 — Claimable missions.** In the MISSIONS board (`:418-446`), missions with `status === 'claimable'` SHALL render a Claim action that POSTs to `/api/v1/missions/{missionId}/claim` and, on success, swaps in the returned `data.missionBoard` (updating balance + statuses). Non-claimable rows keep the current progress display (`:437`).
- **R-3 — Reward reveal.** On a successful claim, a `RewardRevealMoment` (mode `"earned"`) SHALL appear showing the Fucoin + XP earned, reusing `components/gamification/quest-visuals.tsx` (`RewardRevealMoment` at `:356`; `RewardPreviewItem` at `:280`).
- **R-4 — Honest claim states.** Claiming SHALL show an in-flight state (spinner) and prevent double-submit; a failed claim SHALL surface a learner-facing message (not console-only).
- **R-5 — No data plumbing changes.** No edits to `page.tsx` or `DashboardClientDynamic.tsx`; no new fetch. Status flag must stop conflating claimed/claimable (`:425` currently `m.status === 'claimed' || m.status === 'claimable'`).
- **R-NF — No regressions.** Empty/first-run state (`isEmpty`, `:32`) unaffected; START CTA and village board unchanged; gates green.

## Tech Design (exact)

`DashboardMockupClient.tsx` is `'use client'` (`:1`). Steps:

1. **Imports.** Extend React import to `useState, useTransition` (`:3`). Add: `import { RewardRevealMoment, type RewardPreviewItem } from '@/components/gamification/quest-visuals'`; `import { REWARD_ASSETS } from '@/components/gamification/reward-assets'`; `import type { MissionBoardData, MissionBoardItem } from '@/lib/gamification/mission-types'`; add `Loader2, Gift` to the `lucide-react` import (`:7-18`).
2. **State** (after `:33`):
   `const [missionBoard, setMissionBoard] = useState<MissionBoardData | null>(data.missionBoard ?? null)`
   `const [claimingId, setClaimingId] = useState<string | null>(null)`
   `const [claimCelebration, setClaimCelebration] = useState<{ title: string; fucoinReward: number; xpReward: number } | null>(null)`
   `const [claimError, setClaimError] = useState<string | null>(null)`
   `const [, startTransition] = useTransition()`
3. **Claim handler** (port `dashboard-client.tsx:581-609`, adapted):
   guard `mission.status !== 'claimable' || claimingId` → return; set `claimingId`; in `startTransition(async () => { ... })` fetch `POST /api/v1/missions/${mission.id}/claim`; on `res.ok && json.success` → `setMissionBoard(json.data.missionBoard)` + `setClaimCelebration({title, fucoinReward, xpReward})`; else `setClaimError(json.error || 'Claim failed')`; finally clear `claimingId`.
4. **Wallet chip** at `:198` (after level badge), reusing the chip style at `:212-214` and `REWARD_ASSETS.fucoin`:
   render only `!isEmpty && missionBoard` → coin `<Image>` + `missionBoard.wallet.balance.toLocaleString('de-DE')`.
5. **Mission list** (`:423-440`): read from local `missionBoard` (not `data.missionBoard`). Split `:425` into `isClaimed = m.status==='claimed'` and `isClaimable = m.status==='claimable'`. In each `<li>`, when `isClaimable`, replace the `currentValue/targetValue` span (`:437`) with a Claim button (amber, `disabled={claimingId===m.id}`, spinner via `Loader2` while claiming, else `Gift` + "Claim").
6. **Reward reveal + error** just after the `</ul>` (`:444`): if `claimCelebration` → `<RewardRevealMoment mode="earned" title="Belohnung erhalten" detail={...} rewards={[{type:'fucoin',label:'+N Fucoin',detail:'Mission claim'},{type:'xp',label:'+M XP',detail:'Level progress'}]} />`; if `claimError` → a small learner-facing error line. Consider widening the board card from `w-52` (`:420`) to `w-64`.

Confirmed shapes: `MissionBoardData.wallet.balance`, `MissionBoardItem.status/xpReward/fucoinReward/currentValue/targetValue` (`lib/gamification/mission-types.ts:6-54`). Claim API: `app/api/v1/missions/[missionId]/claim/route.ts` returns `{ success, data: { mission, missionBoard, claimed } }`.

## Asset plan

**No new assets.** `REWARD_ASSETS.fucoin` and the reward-reveal visuals already exist and are used in vocab/listening/exam. Codex: none.

## Task List (Antigravity)

- **T-1** (R-5): Add imports + claim state + `useTransition`. 
- **T-2** (R-2,R-4): Port `claimMission` handler with in-flight + error handling.
- **T-3** (R-1): Add Fucoin wallet chip to desktop header (mobile mirror if easy), reading local `missionBoard`.
- **T-4** (R-2,R-5): Switch mission list to local `missionBoard`; split claimed/claimable; add Claim button on claimable rows.
- **T-5** (R-3,R-4): Mount `RewardRevealMoment` on claim success + learner-facing error line on failure.
- **T-6** (R-NF): Verify empty state, START, board unchanged; run gates.

## Acceptance / QC checklist (Claude verifies)

1. Header shows the real Fucoin balance; it increases after a successful claim.
2. A `claimable` mission shows a Claim button; clicking it calls the API, marks the mission claimed, and updates the balance.
3. A `RewardRevealMoment` ("earned") shows the Fucoin + XP after claim.
4. Claiming shows a spinner and blocks double-click; a forced API failure shows a visible error (not just console).
5. Empty/first-run dashboard, START CTA, and village board are unchanged.
6. `page.tsx` and `DashboardClientDynamic.tsx` are untouched; no new fetch added.
7. `pnpm check:quick`, `pnpm test:core`, `pnpm build` green.

## Antigravity prompt (copy-paste)

```
ROLE: You are the Frontend Engineer for Fuxie (Next.js App Router, TypeScript, Tailwind), executing a fixed spec. Do not make product/UX decisions; if ambiguous, stop and ask.

OBJECTIVE: Close the dashboard "wow gap" (Slice B) by wiring an existing reward loop into the live dashboard: Fucoin wallet display, claimable missions, and a reward-reveal moment. This is re-wiring of existing logic, not new design.

REPO CONTEXT: Repo root C:\Users\DMF Schule\9-Fuxie, app at apps/web. Read docs/delivery/slice-B-dashboard-wowgap.md and .agents/workflows/three-agent-delivery-model.md. ONLY edit apps/web/src/components/dashboard/DashboardMockupClient.tsx. Reuse (read-only reference) the dead apps/web/src/components/dashboard/dashboard-client.tsx:581-609 (claim handler) and :937-990 (reveal). Reuse components/gamification/quest-visuals.tsx (RewardRevealMoment, RewardPreviewItem) and components/gamification/reward-assets.ts (REWARD_ASSETS.fucoin). Types: lib/gamification/mission-types.ts. Claim API already exists at app/api/v1/missions/[missionId]/claim/route.ts. DO NOT edit page.tsx or DashboardClientDynamic.tsx, and add no new server fetch — data.missionBoard already flows in.

TASKS: Implement T-1..T-6 exactly as in the spec. Render no new assets.

ACCEPTANCE: All 7 QC items pass. pnpm check:quick, pnpm test:core, pnpm build all green. Only DashboardMockupClient.tsx changed.

REPORT FORMAT: (1) per-task done/blocked with diff hunks; (2) gate outputs; (3) the dev steps to reproduce a claim (seed/state with a claimable mission, or how you simulated it); (4) confirmation page.tsx/DashboardClientDynamic.tsx untouched and no new fetch; (5) screenshot of wallet chip + claim + reward reveal.
```

## Codex prompt

None — no new assets for this slice.
