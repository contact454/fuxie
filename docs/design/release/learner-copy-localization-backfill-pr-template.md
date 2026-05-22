# PR: Learner Copy Localization Backfill

**Spec:** [.kiro/specs/learner-copy-localization-backfill](../../../.kiro/specs/learner-copy-localization-backfill/)
**Closes Risk:** R-locale-parity (parent spec gamified-ui-asset-rollout)
**Date:** 2026-05-16

## Summary

Backfilled 5 hard-coded learner-facing strings in `apps/web/src/components/writing/writing-player.tsx` (lines 622, 658, 666, 722, 760) into the next-intl namespace `WritingPlayer` of `apps/web/messages/{vi,de}.json`. Achieves locale parity vi=185 ⇄ de=185 keys (180 baseline + 5 new), wraps each violation in `t()` via `useTranslations('WritingPlayer')`, with German values Translation_Review-signed by Vietnamese-German Localization Specialist.

## Files changed (3)

- `apps/web/src/components/writing/writing-player.tsx` — added `useTranslations` import + hook + 5 swap-sites
- `apps/web/messages/vi.json` — added namespace `WritingPlayer` (5 leaves verbatim from source)
- `apps/web/messages/de.json` — added namespace `WritingPlayer` (5 leaves Translation_Review-approved)

## Translation final values (verified A2-B1 CEFR)

| Key Path | Vietnamese (verbatim) | German (final) | CEFR |
|---|---|---|---|
| WritingPlayer.promptHeader | Đề bài | Aufgabenstellung | A2-B1 |
| WritingPlayer.grafikLabel | Biểu đồ | Grafik | A1 |
| WritingPlayer.contentPointsHeader | Ý cần viết: | Inhaltspunkte: | A2-B1 |
| WritingPlayer.draftPlaceholder | Viết bài của em tại đây... | Schreibe deinen Text hier... | A1-A2 |
| WritingPlayer.submitLabel | Nộp bài | Einreichen | B1 |

## Verification

### `pnpm check:locale-parity`
- Locale parity half: PASS (vi=185 ⇄ de=185 keys, set equality OK)
- t() discipline half: 5 spec-named violations ABSENT; total drops 419 → 414
- Script overall exit 1 driven by 414 unrelated workspace violations (Option A narrow criterion accepted)

### `pnpm test:property`
- 21 locale-parity property tests passed at numRuns=100
- 295 / 16 test files all green, exit 0

## Sign-off

| Role | Responsibility | Signed by | Date |
|---|---|---|---|
| Vietnamese-German Localization Specialist | Translation values approved | Fuxie Localization Specialist Agent | 2026-05-16 |
| Frontend Engineer | Code wiring + verification approved | Fuxie Frontend Engineer Agent | 2026-05-16 |
| Project Manager / Delivery Manager | Delivery and DoD update approved | Fuxie PM Agent | 2026-05-16 |

- [x] **Vietnamese-German Localization Specialist** (translation approved): Fuxie Localization Specialist Agent, 2026-05-16
- [x] **Frontend Engineer** (code wiring + verification approved): Fuxie Frontend Engineer Agent, 2026-05-16
- [x] **Project Manager / Delivery Manager** (delivery + DoD update approved): Fuxie PM Agent, 2026-05-16

## Out of scope (tracked elsewhere)

- 414 unrelated locale-parity violations (out of file `writing-player.tsx`) — tracked under R1 of parent spec; future locale-parity spec.
- Fuxie writing player has 6 additional pre-existing learner-string violations (lines 207, 221, 416, 423, 440, 504) — out of this spec's blast radius (Req 7.1).
