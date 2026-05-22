# Fuxie Global Village Polished Export Readout

Updated: 2026-05-15

## Current Status

| Status | Count | Meaning |
| --- | ---: | --- |
| export-candidate | 110 | Cutout/location/frame assets passed automated crop and alpha QA. |
| direction-board-exported | 10 | Scene boards are ready for design direction, not runtime cutouts. |
| manual QA blocker | 0 | Remaining automated blockers after auto-polish. |

## Recommended Working Folder

- Use `docs/design/asset-generation/global-export/accepted-polished-webp/` for the next UI/UX layout and mockup pass.
- Use `docs/design/asset-generation/global-export/fuxie-global-village-webp-polished-contact-sheet.png` for quick review.
- Use `docs/design/asset-generation/fuxie-global-village-production-asset-map.json` for source/runtime traceability.
- Use `apps/web/public/fuxie-global-village-runtime-draft-manifest.json` for the later app integration pass.
- Runtime draft files have also been copied into `apps/web/public/` by asset family; scene boards remain design-only in `docs/design/asset-generation/global-scenes/`.

## What Changed From Clean Export

- The earlier clean export had 22 manual QA items.
- Auto-polish applied alpha bounding-box trim and transparent padding to those 22 assets.
- Polished export now has 120 accepted design-draft files and 0 automated QA blockers.

## Caution

This is a design-ready draft pack. Human visual approval is still required before copying assets into the runtime public asset tree, because automated QA can detect crop/alpha issues but cannot fully judge taste, semantic fit, or small artifact awkwardness.
