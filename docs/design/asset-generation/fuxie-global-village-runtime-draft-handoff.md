# Fuxie Global Village Runtime Draft Handoff

Updated: 2026-05-15

## Status

The global village asset pack has been copied into the app public tree as a runtime draft. The first runtime registry pass is now wired into learner-facing mascot, world prop, UI frame, course, onboarding, auth, and shop reward paths.

## Counts

| Output | Count | Location |
| --- | ---: | --- |
| Runtime draft assets | 110 | `apps/web/public/` grouped by asset family |
| Design-only scene boards | 10 | `docs/design/asset-generation/global-scenes/` |
| Public runtime manifest | 1 | `apps/web/public/fuxie-global-village-runtime-draft-manifest.json` |
| Docs runtime copy manifest | 1 | `docs/design/asset-generation/fuxie-global-village-runtime-draft-copy-manifest.json` |
| Surface public map | 1 | `docs/design/asset-generation/fuxie-global-village-public-surface-map.json` |

## Runtime Draft Groups

| Asset type | Count | Public folder |
| --- | ---: | --- |
| World location plates | 20 | `apps/web/public/mascot-3d/world/global/` |
| Building cutouts | 10 | `apps/web/public/mascot-3d/world/buildings/` |
| Outdoor props | 10 | `apps/web/public/mascot-3d/world/props/` |
| Learning props | 10 | `apps/web/public/mascot-3d/world/learning-props/` |
| Reward/shop icons | 20 | `apps/web/public/reward-assets/global/` |
| Mascot states | 20 | `apps/web/public/mascot-3d/states/global/` |
| UI frames | 20 | `apps/web/public/mascot-3d/ui/global/` |

## Recommended Source Of Truth

Use these files in this order:

1. `docs/design/asset-generation/fuxie-global-village-public-surface-map.json` for surface-level asset selection.
2. `apps/web/public/fuxie-global-village-runtime-draft-manifest.json` for public paths and hashes.
3. `docs/design/asset-generation/fuxie-global-village-production-asset-map.json` for full generation-to-runtime traceability.

## Integration Guardrails For Later

- Runtime cutouts must use transparent WebP assets from the registry. Do not paste atlas crops, scene boards, or pale-background previews directly into UI components.
- Before a new asset is allowed into `apps/web/public`, run `node scripts/verify-fuxie-global-assets-alpha.cjs` or `pnpm qa:fuxie-assets` in an environment where `pnpm` is available.
- The alpha QA script scans both the 110-asset manifest and runtime source references in `apps/web/src`; reference sheets, 3D rig posters, GLB metadata, and imagegen construction files are excluded because they are not UI cutouts.
- Do not hard-code legacy `/mascot-3d/states/v1`, `/mascot-3d/modules/v1`, or `/mascot-3d/gamification/v1` PNGs in UI. Route those keys through `apps/web/src/lib/mascot/fuxie-assets.ts` or the global registry instead.
- Use one anchor visual per surface first; do not flood a screen with multiple village props.
- Use scene boards only for design reference. They are not runtime cutouts.
- Teacher/admin screens should use restrained visual treatment: one location plate or frame plus one mascot state at most.
- Learner reward and result loops can use richer visuals because the art reinforces motivation and feedback.
- Do not use assets only as decoration. Each asset must support CTA, feedback, reward, progress, empty/error state, or surface identity.
- Human visual review should still happen before final app integration, even though automated QA has no blockers.
