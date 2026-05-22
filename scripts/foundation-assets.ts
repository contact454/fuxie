// Tooling-only registry. Not bundled into apps/web. See .kiro/specs/asset-registry-cleanup/design.md Decision 2.
//
// Why this file lives in `scripts/`:
//   `scripts/asset-audit.ts` only imports production registry maps from
//   `apps/web/src/lib/mascot/fuxie-assets.ts` and
//   `apps/web/src/components/gamification/reward-assets.ts`. By keeping the
//   FOUNDATION map (DSD reference sheets such as turnaround / expressions /
//   material-palette) here, `findForbiddenRefs` no longer flags the eight
//   `/mascot-3d/foundation/v1/...` paths as production violations while
//   tooling and DSD scripts can still resolve them.
//
// Why PLACEHOLDER_ASSET is inlined (Bug B fix from Task 2.4 verification):
//   Importing `PLACEHOLDER_ASSET` from
//   `../apps/web/src/lib/mascot/fuxie-assets` introduces a circular module
//   load when `tests/asset-registry.spec.ts` runs under vitest: the spec
//   imports many symbols from `fuxie-assets` AND `FUXIE_FOUNDATION_ASSETS`
//   from this file. During the initial module-graph load the FOUNDATION
//   export resolves to `undefined`, which crashes
//   `Object.values(FUXIE_FOUNDATION_ASSETS)` inside `buildValidPathsUnion`.
//   Inlining the literal value avoids the cross-module dependency entirely.
//   The path is the canonical placeholder shipped in
//   `apps/web/public/mascot-3d/optimized/fuxie-placeholder-512.webp` and
//   matches `PLACEHOLDER_ASSET` in fuxie-assets.ts; if either one ever
//   changes, both must move together.
//
// Public API surface for `getFuxieFoundationAssetSrc` is preserved verbatim
// from the previous location: same key set, same fallback to the local
// `PLACEHOLDER_ASSET` constant, same total-function semantics for unknown
// keys.

const PLACEHOLDER_ASSET = '/mascot-3d/optimized/fuxie-placeholder-512.webp' as const

/**
 * DSD reference sheets used during mascot design work. Not learner-facing
 * and not bundled into the production app — consumers are tooling and
 * design-system scripts only.
 *
 * Validates: Requirements 2.1, 2.3
 */
export const FUXIE_FOUNDATION_ASSETS = {
    turnaround: '/mascot-3d/foundation/v1/fuxie-foundation-01-turnaround.png',
    expressions: '/mascot-3d/foundation/v1/fuxie-foundation-02-expressions.png',
    'material-palette': '/mascot-3d/foundation/v1/fuxie-foundation-03-material-palette.png',
    'badge-neckerchief': '/mascot-3d/foundation/v1/fuxie-foundation-04-badge-neckerchief.png',
    'tail-design': '/mascot-3d/foundation/v1/fuxie-foundation-05-tail-design.png',
    'scale-readability': '/mascot-3d/foundation/v1/fuxie-foundation-06-scale-readability.png',
    proportions: '/mascot-3d/foundation/v1/fuxie-foundation-07-proportions.png',
    'hero-reference': '/mascot-3d/foundation/v1/fuxie-foundation-08-hero-reference.png',
} as const

export type FuxieFoundationAsset = keyof typeof FUXIE_FOUNDATION_ASSETS

/**
 * Object membership check that ignores inherited prototype keys
 * (e.g. `__proto__`, `toString`, `hasOwnProperty`). Mirrors the totality
 * pattern used by `apps/web/src/lib/mascot/fuxie-assets.ts` so unknown
 * keys cannot accidentally surface a function or prototype value.
 */
function hasOwn<T extends object>(map: T, key: PropertyKey): key is keyof T {
    return Object.prototype.hasOwnProperty.call(map, key)
}

/**
 * Emit a console warning when a foundation lookup misses, but only in
 * development. Production stays quiet so an unknown key falls through
 * silently to {@link PLACEHOLDER_ASSET}.
 */
function warnFoundationMiss(key: string): void {
    if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.warn(
            `[asset-registry] miss: group="FUXIE_FOUNDATION_ASSETS" key="${key}" — falling back to PLACEHOLDER_ASSET`,
        )
    }
}

/**
 * Resolve a foundation asset key to a public path. Total: unknown keys fall
 * through to {@link PLACEHOLDER_ASSET} so callers can render a placeholder
 * without crashing.
 *
 * Validates: Requirements 2.1, 2.3
 */
export function getFuxieFoundationAssetSrc(key: string): string {
    if (hasOwn(FUXIE_FOUNDATION_ASSETS, key)) {
        return FUXIE_FOUNDATION_ASSETS[key as FuxieFoundationAsset]
    }
    warnFoundationMiss(key)
    return PLACEHOLDER_ASSET
}
