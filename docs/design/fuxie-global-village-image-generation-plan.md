# Fuxie Global Village Image Generation Plan

Updated: 2026-05-15

## Scope

This pass expands Fuxie from learner-only village accents into a full German-learning village visual system across learner, teacher, admin, auth, landing, QA, rewards, and state screens. Code integration is intentionally out of scope for this pass. The output is a one-round image generation backlog and atlas set for Design/UI to crop, polish, and export later.

## Audit Count

| Area | Routes / files | Visual implication |
| --- | ---: | --- |
| Learner app | 29 routes | Core village experience, already has P0 assets but still needs secondary locations, microgame props, badges, campaign, leaderboard, session, review, and result variants. |
| Teacher app | 4 routes | Needs academy/classroom visual language so teacher surfaces do not feel outside the village. |
| Admin app | 10 routes | Needs restrained operations/analytics village motifs, not decorative fantasy art. |
| Auth | 3 routes | Needs welcome gate, register/onboarding path, and trust/safety entry frame. |
| Landing | 1 route | Needs whole-village hero/map art. |
| Live QA | 1 route | Needs QA booth/control-room visual. |

Current asset base:

| Asset family | Existing count | Notes |
| --- | ---: | --- |
| Mascot/3D public files | 326 | Includes PNG, WebP, GLB, JSON across states, modules, props, and optimized outputs. |
| Reward assets | 54 | Enough for first reward loop; needs wider shop/item catalog. |
| Vocabulary images | 12,923 | Content illustrations; do not treat these as village UI assets. |
| Listening audio | 268 | Audio content, useful for radio-booth metaphors. |
| Generated design source | 30 | Current source PNGs from the learner pass. |
| Mockup boards | 7 | Learner mockup boards already started. |

Code-visible Fuxie map:

| Map | Existing count |
| --- | ---: |
| `FUXIE_MASCOT_STATES` | 44 |
| `FUXIE_FOUNDATION_ASSETS` | 8 |
| `FUXIE_MODULE_MASCOTS` | 12 |
| `FUXIE_GAMIFICATION_MASCOTS` | 12 |
| `FUXIE_WORLD_PROPS` | 24 |
| `FUXIE_UI_FRAMES` | 8 |

## Quantity Decision

Existing generated learner production assets: 36.

New assets to generate in this global pass: 120.

Total Fuxie German Village production library after this pass: 156 visual concepts before crop/export.

The 120 new images should be generated as 12 atlas sheets, 10 assets per sheet. Atlas generation keeps the pass feasible in one round, avoids scattered one-off files, and gives Design a clean crop/export queue later.

## Current Production Status

As of 2026-05-15, this pass has been generated, cropped, alpha-cleaned, auto-polished, and exported into a design-ready draft pack:

| Output | Count | Location |
| --- | ---: | --- |
| Atlas sheets | 12 | `docs/design/asset-generation/global-atlas/` |
| Source crops | 120 | `docs/design/asset-generation/global-crops/source/` |
| Preview PNG 512 | 120 | `docs/design/asset-generation/global-crops/preview-512/` |
| Alpha clean PNG 512 | 110 | `docs/design/asset-generation/global-crops/alpha-clean-512/` |
| Auto-polished PNG 512 | 22 | `docs/design/asset-generation/global-crops/auto-polish-512/` |
| Polished WebP 512 | 120 | `docs/design/asset-generation/global-export/webp-polished-512/` |
| Accepted polished WebP | 120 | `docs/design/asset-generation/global-export/accepted-polished-webp/` |
| Manual QA blockers | 0 | `docs/design/asset-generation/global-export/manual-qa-polished-webp/` |
| Runtime draft public assets | 110 | `apps/web/public/` grouped by asset family |
| Design-only scene boards | 10 | `docs/design/asset-generation/global-scenes/` |

The recommended working set for the next UI/UX pass is `docs/design/asset-generation/global-export/accepted-polished-webp/`.

The recommended runtime draft manifest for the later implementation pass is `apps/web/public/fuxie-global-village-runtime-draft-manifest.json`.

## Generation Batches

| Batch | Count | Purpose |
| --- | ---: | --- |
| A. Learner secondary locations | 10 | Fill learner surfaces not covered deeply in P0. |
| B. Teacher/Admin/Auth locations | 10 | Bring non-learner surfaces into the same village world. |
| C. Village buildings set | 10 | Establish the architecture kit for maps, cards, and loading scenes. |
| D. Outdoor props set | 10 | Reusable small props for panels, empty states, and rewards. |
| E. Learning props set | 10 | Skill-specific objects for reading/listening/speaking/writing/grammar/vocab. |
| F. Reward/shop item icons A | 10 | Concrete shop/reward inventory visuals. |
| G. Reward/shop item icons B | 10 | More future-facing catalog and motivation items. |
| H. Mascot poses A | 10 | Learner-facing guidance, feedback, motivation, and result states. |
| I. Mascot poses B | 10 | Teacher/admin/support/trust states. |
| J. UI frames/panels A | 10 | Village-styled containers for learner and reward flows. |
| K. UI frames/panels B | 10 | Admin/teacher/auth/system frames with restrained styling. |
| L. Cinematic/mockup boards | 10 | Larger scene boards for direction, presentation, and design alignment. |

## Exact Atlas Contents

### A. Learner Secondary Locations

1. Grammar Workshop Interior
2. Review Garden Greenhouse
3. Badge Museum Shelf Room
4. Campaign Festival Board
5. Leaderboard Guild Hall
6. Session Focus Dojo
7. Vocabulary Microgame Booth
8. Speaking Roleplay Cafe Room
9. Exam Result Hall
10. CEFR Gate Plaza

### B. Teacher/Admin/Auth Locations

1. Teacher Academy Exterior
2. Teacher Classroom Interior
3. Student Progress Desk
4. Admin Command Center
5. Analytics Observatory
6. Content Quality Lab
7. Operations Server Room
8. Rewards Approval Desk
9. Auth Welcome Gate
10. Live QA Control Booth

### C. Village Buildings Set

1. Rathaus Exam Hall
2. Fuxie Schoolhouse
3. Reading Library
4. Writing Post Office
5. Fuxie Market Stall
6. Radio Listening Tower
7. Speaking Stage Cafe
8. Badge Museum
9. Review Greenhouse
10. Onboarding Welcome Inn

### D. Outdoor Props Set

1. Village Signpost Cluster
2. Blue Lantern Post
3. Cobblestone Path Tile
4. Fountain Reward Plinth
5. Wooden Bench
6. Notice Pins and Ribbons
7. Village Map Board
8. Bridge Checkpoint
9. Festival Bunting
10. Progress Lantern Trail

### E. Learning Props Set

1. Grammar Gear Scroll
2. Vocabulary Flashcard Box
3. Reading Bookmark Lamp
4. Listening Headphones Stand
5. Speaking Microphone Charm
6. Writing Envelope Stack
7. Exam Timer Bell
8. Review Seed Packet
9. Chat Phrase Cards
10. CEFR Compass

### F. Reward/Shop Item Icons A

1. Streak Freeze Crystal
2. Fucoin Pouch
3. XP Star Bundle
4. Coach Hint Ticket
5. Mocktest Unlock Key
6. Speaking Feedback Pass
7. Fuxie Sky Outfit Token
8. Learning Gift Voucher
9. Reward Chest Small
10. Daily Goal Stamp

### G. Reward/Shop Item Icons B

1. Pronunciation Mic Charm
2. Writing Stamp Seal
3. Review Garden Seed
4. Badge Polish Kit
5. CEFR Gate Key
6. Classroom Invite Card
7. Radio Replay Pass
8. Grammar Repair Token
9. Focus Shield
10. Comeback Candle

### H. Mascot Poses A

1. Fuxie Grammar Mentor
2. Fuxie Review Gardener
3. Fuxie Badge Curator
4. Fuxie Campaign Host
5. Fuxie Leaderboard Announcer
6. Fuxie Session Focus Coach
7. Fuxie Microgame Referee
8. Fuxie Roleplay Waiter
9. Fuxie Exam Proctor
10. Fuxie CEFR Gate Guide

### I. Mascot Poses B

1. Fuxie Teacher Coach
2. Fuxie Classroom Helper
3. Fuxie Admin Analyst
4. Fuxie Content Reviewer
5. Fuxie Ops Mechanic
6. Fuxie Reward Clerk
7. Fuxie Auth Welcomer
8. Fuxie Privacy Guardian
9. Fuxie QA Inspector
10. Fuxie Error Repair Helper

### J. UI Frames/Panels A

1. Village Quest Card Frame
2. Skill Player Motivation Frame
3. CEFR Path Node Frame
4. Result Reward Reveal Frame
5. Badge Receipt Frame
6. Shop Item Shelf Frame
7. Daily Goal Notice Frame
8. Empty State Sign Frame
9. Error Retry Repair Frame
10. Chat Bubble Village Frame

### K. UI Frames/Panels B

1. Auth Welcome Panel
2. Onboarding Path Panel
3. Teacher Classroom Card
4. Student Progress Panel
5. Admin Analytics Panel
6. Content QA Warning Panel
7. Ops Health Console Panel
8. Reward Approval Receipt
9. Live QA Checklist Panel
10. Privacy/Safety Notice Frame

### L. Cinematic/Mockup Boards

1. Whole Fuxie German Village Map
2. Learner Daily Loop Scene
3. Course Journey Scene
4. Skill Practice Player Scene
5. Shop and Inventory Scene
6. Exam Hall and Result Scene
7. Badge Museum Progress Scene
8. Teacher Classroom Overview Scene
9. Admin Operations Overview Scene
10. Auth Onboarding Welcome Scene

## Style Contract

- Medium: polished 3D clay-like mobile game asset, soft lighting, bright sky palette.
- World: original cozy German-learning village, not a full fantasy RPG map.
- Palette: Fuxie Bright Sky blue, teal, clean white, warm gold accents, light neutral shadows.
- Avoid: dark fantasy, beige/brown dominance, purple-heavy gradients, external game IP, leaf motifs, unreadable text, cluttered UI decoration.
- Runtime target later: 512 WebP for standalone assets, alpha-clean PNG/WebP source, readable at 24-96px for icons and 256-512px for plates.

## Production Rule

Every generated image must support at least one of these functions:

1. CTA orientation
2. Learning state feedback
3. Reward loop
4. Progress/level clarity
5. Empty/error/loading state
6. Surface identity

Decorative-only assets are rejected even if they look good.
