# Fuxie Global Village Visual QA Export Readout

Updated: 2026-05-15

## Summary

| Status | Count | Meaning |
| --- | ---: | --- |
| export-candidate | 88 | Clean enough for design acceptance and later runtime mapping. |
| review-tight-crop | 4 | Looks usable but has a tight crop margin; designer should inspect. |
| needs-manual-trim-edge-touch | 11 | Has edge-touching pixels or crop slivers; needs trim/repaint. |
| needs-alpha-cleanup-matte-residue | 7 | Has pale matte residue; needs alpha cleanup. |
| direction-board-exported | 10 | Scene/mockup board exported for direction, not a cutout runtime asset. |

## Output Files

- Clean WebP index: `docs/design/asset-generation/global-export/fuxie-global-village-webp-clean-export-index.json`
- Clean WebP folder: `docs/design/asset-generation/global-export/webp-clean-512/`
- Clean WebP contact sheet: `docs/design/asset-generation/global-export/fuxie-global-village-webp-clean-contact-sheet.png`
- Alpha clean folder: `docs/design/asset-generation/global-crops/alpha-clean-512/`

## Manual QA Queue

| # | Status | Item | Asset type | File |
| ---: | --- | --- | --- | --- |
| 15 | review-tight-crop | Analytics Observatory | world_location_plate | `docs/design/asset-generation/global-export/webp-clean-512/atlas-b-teacher-admin-auth-locations/analytics-observatory.webp` |
| 61 | needs-manual-trim-edge-touch | Pronunciation Mic Charm | reward_item_icon | `docs/design/asset-generation/global-export/webp-clean-512/atlas-g-reward-shop-items-b/pronunciation-mic-charm.webp` |
| 62 | review-tight-crop | Writing Stamp Seal | reward_item_icon | `docs/design/asset-generation/global-export/webp-clean-512/atlas-g-reward-shop-items-b/writing-stamp-seal.webp` |
| 63 | needs-manual-trim-edge-touch | Review Garden Seed | reward_item_icon | `docs/design/asset-generation/global-export/webp-clean-512/atlas-g-reward-shop-items-b/review-garden-seed.webp` |
| 71 | needs-manual-trim-edge-touch | Fuxie Grammar Mentor | mascot_state | `docs/design/asset-generation/global-export/webp-clean-512/atlas-h-mascot-poses-a/fuxie-grammar-mentor.webp` |
| 72 | needs-manual-trim-edge-touch | Fuxie Review Gardener | mascot_state | `docs/design/asset-generation/global-export/webp-clean-512/atlas-h-mascot-poses-a/fuxie-review-gardener.webp` |
| 73 | review-tight-crop | Fuxie Badge Curator | mascot_state | `docs/design/asset-generation/global-export/webp-clean-512/atlas-h-mascot-poses-a/fuxie-badge-curator.webp` |
| 74 | needs-manual-trim-edge-touch | Fuxie Campaign Host | mascot_state | `docs/design/asset-generation/global-export/webp-clean-512/atlas-h-mascot-poses-a/fuxie-campaign-host.webp` |
| 75 | needs-manual-trim-edge-touch | Fuxie Leaderboard Announcer | mascot_state | `docs/design/asset-generation/global-export/webp-clean-512/atlas-h-mascot-poses-a/fuxie-leaderboard-announcer.webp` |
| 91 | needs-manual-trim-edge-touch | Village Quest Card Frame | ui_frame | `docs/design/asset-generation/global-export/webp-clean-512/atlas-j-ui-frames-panels-a/village-quest-card-frame.webp` |
| 92 | needs-manual-trim-edge-touch | Skill Player Motivation Frame | ui_frame | `docs/design/asset-generation/global-export/webp-clean-512/atlas-j-ui-frames-panels-a/skill-player-motivation-frame.webp` |
| 93 | needs-manual-trim-edge-touch | CEFR Path Node Frame | ui_frame | `docs/design/asset-generation/global-export/webp-clean-512/atlas-j-ui-frames-panels-a/cefr-path-node-frame.webp` |
| 94 | needs-manual-trim-edge-touch | Result Reward Reveal Frame | ui_frame | `docs/design/asset-generation/global-export/webp-clean-512/atlas-j-ui-frames-panels-a/result-reward-reveal-frame.webp` |
| 95 | needs-manual-trim-edge-touch | Badge Receipt Frame | ui_frame | `docs/design/asset-generation/global-export/webp-clean-512/atlas-j-ui-frames-panels-a/badge-receipt-frame.webp` |
| 100 | needs-alpha-cleanup-matte-residue | Chat Bubble Village Frame | ui_frame | `docs/design/asset-generation/global-export/webp-clean-512/atlas-j-ui-frames-panels-a/chat-bubble-village-frame.webp` |
| 101 | needs-alpha-cleanup-matte-residue | Auth Welcome Panel | ui_frame | `docs/design/asset-generation/global-export/webp-clean-512/atlas-k-ui-frames-panels-b/auth-welcome-panel.webp` |
| 102 | needs-alpha-cleanup-matte-residue | Onboarding Path Panel | ui_frame | `docs/design/asset-generation/global-export/webp-clean-512/atlas-k-ui-frames-panels-b/onboarding-path-panel.webp` |
| 103 | review-tight-crop | Teacher Classroom Card | ui_frame | `docs/design/asset-generation/global-export/webp-clean-512/atlas-k-ui-frames-panels-b/teacher-classroom-card.webp` |
| 104 | needs-alpha-cleanup-matte-residue | Student Progress Panel | ui_frame | `docs/design/asset-generation/global-export/webp-clean-512/atlas-k-ui-frames-panels-b/student-progress-panel.webp` |
| 106 | needs-alpha-cleanup-matte-residue | Content QA Warning Panel | ui_frame | `docs/design/asset-generation/global-export/webp-clean-512/atlas-k-ui-frames-panels-b/content-qa-warning-panel.webp` |
| 108 | needs-alpha-cleanup-matte-residue | Reward Approval Receipt | ui_frame | `docs/design/asset-generation/global-export/webp-clean-512/atlas-k-ui-frames-panels-b/reward-approval-receipt.webp` |
| 109 | needs-alpha-cleanup-matte-residue | Live QA Checklist Panel | ui_frame | `docs/design/asset-generation/global-export/webp-clean-512/atlas-k-ui-frames-panels-b/live-qa-checklist-panel.webp` |

## Production Decision

- 98 assets are immediately useful for design direction: 88 export candidates plus 10 scene boards.
- 22 assets should stay in the manual QA queue before app runtime use.
- No app code integration has been performed in this pass.