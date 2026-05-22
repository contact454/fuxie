# Fuxie Global Village Generation Readout

Updated: 2026-05-15

## Result

Generated and packaged the first global Fuxie German Village visual pass.

| Output | Count | Location |
| --- | ---: | --- |
| Global atlas sheets | 12 | `docs/design/asset-generation/global-atlas/` |
| New visual concepts | 120 | 10 concepts per atlas sheet |
| Source crops | 120 | `docs/design/asset-generation/global-crops/source/` |
| 512 preview crops | 120 | `docs/design/asset-generation/global-crops/preview-512/` |
| 512 alpha drafts | 110 | `docs/design/asset-generation/global-crops/alpha-draft-512/` |
| 512 alpha clean drafts | 110 | `docs/design/asset-generation/global-crops/alpha-clean-512/` |
| Clean WebP exports | 120 | `docs/design/asset-generation/global-export/webp-clean-512/` |
| Accepted draft WebP | 98 | `docs/design/asset-generation/global-export/accepted-draft-webp/` |
| Manual QA WebP | 22 | `docs/design/asset-generation/global-export/manual-qa-webp/` |
| Auto-polished PNG | 22 | `docs/design/asset-generation/global-crops/auto-polish-512/` |
| Polished WebP exports | 120 | `docs/design/asset-generation/global-export/webp-polished-512/` |
| Accepted polished WebP | 120 | `docs/design/asset-generation/global-export/accepted-polished-webp/` |
| Manual QA polished WebP | 0 | `docs/design/asset-generation/global-export/manual-qa-polished-webp/` |
| Crop index | 1 | `docs/design/asset-generation/global-crops/global-crop-index.json` |
| Production asset map | 1 | `docs/design/asset-generation/fuxie-global-village-production-asset-map.json` |
| Export split index | 1 | `docs/design/asset-generation/global-export/fuxie-global-village-export-split-index.json` |
| Polished split index | 1 | `docs/design/asset-generation/global-export/fuxie-global-village-polished-export-split-index.json` |
| Atlas overview | 1 | `docs/design/asset-generation/global-atlas/fuxie-global-village-atlas-overview.png` |
| Crop contact sheet | 1 | `docs/design/asset-generation/global-crops/fuxie-global-village-crops-contact-sheet.png` |
| Alpha contact sheet | 1 | `docs/design/asset-generation/global-crops/alpha-draft-512/fuxie-global-village-alpha-draft-contact-sheet.png` |
| Clean WebP contact sheet | 1 | `docs/design/asset-generation/global-export/fuxie-global-village-webp-clean-contact-sheet.png` |
| Polished WebP contact sheet | 1 | `docs/design/asset-generation/global-export/fuxie-global-village-webp-polished-contact-sheet.png` |

## Production Coverage

The generation pass covers the full Fuxie product surface, not only learner UI:

- Learner secondary locations: grammar, review, badges, campaign, leaderboard, session, microgames, roleplay, result, CEFR gates.
- Teacher/admin/auth locations: academy, classroom, progress desk, command center, analytics, content QA, ops, rewards, welcome gate, live QA.
- Village buildings: exam hall, schoolhouse, library, post office, market, radio tower, speaking cafe, badge museum, greenhouse, welcome inn.
- Props: outdoor navigation, village state props, learning props, reward/shop items.
- Mascot states: learner guidance poses plus teacher/admin/support/trust poses.
- UI frames: learner, reward, teacher, admin, auth, QA, safety, and system panels.
- Cinematic direction boards: whole village, learner loop, course path, skill player, shop, exam, badges, teacher, admin, auth.

## QA Notes

- `atlas-h-mascot-poses-a.png` was regenerated after the first pass because the original output shifted toward orange mascot coloring. The current file uses the Fuxie sky-blue mascot direction.
- The 120 crops are mechanical 5x2 atlas cell crops. They are suitable for design review and source handoff, but not final runtime alpha assets yet.
- The 110 alpha drafts use edge-connected flood-fill background removal. The later `alpha-clean-512` pass also removes small edge-touching components.
- The clean WebP export currently has 88 direct export candidates, 10 scene boards, and 22 assets in the manual QA queue.
- `accepted-draft-webp` contains 98 files that can be used for layout exploration now. `manual-qa-webp` contains 22 files that should not be used in runtime until trimmed or cleaned.
- The auto-polish pass resolved the 22 manual QA files by alpha-bbox trimming and transparent padding.
- The polished export has 110 export candidates plus 10 direction boards, with 0 automated QA blockers.
- `accepted-polished-webp` is the recommended folder for the next design/layout pass.
- Some cinematic/mockup board crops intentionally contain board-like UI placeholders and small generated marker artifacts. Treat these as direction boards, not final UI screenshots.
- Final runtime export should resolve the remaining manual QA queue before app integration.
- Keep the current atlas originals unchanged; use crop folders for cleanup and export work.

## Next Production Step

Before app integration, Design should run a cleanup/export pass:

1. Review `fuxie-global-village-crops-contact-sheet.png` for concept fit.
2. Review `fuxie-global-village-alpha-draft-contact-sheet.png` for alpha quality.
3. Use `accepted-polished-webp` for layout exploration and product mockups.
4. Keep cinematic boards as scene references, not runtime UI assets.
5. Run a human visual review before app runtime mapping, especially for edge artifacts that automated QA cannot judge by taste.
6. Export production assets into the runtime asset tree using `fuxie-global-village-production-asset-map.json`.
7. Update the app asset maps only after this visual QA pass is accepted.

## Acceptance Bar

An asset is ready for runtime only when it:

- Matches Fuxie sky-blue/teal identity.
- Reads clearly at 24, 48, 96, and 256 px according to its role.
- Has no external IP resemblance.
- Has predictable filename and source trace in `global-crop-index.json`.
- Supports a learning moment, CTA, reward loop, progress state, or system state.
