/**
 * Asset Registry Integrity Check
 *
 * Iterates every Asset Registry map and asserts that each path value resolves
 * to an existing file under `apps/web/public/`. Also verifies every legacy
 * mascot alias points at a valid `FUXIE_MASCOT_STATES` key.
 *
 * Maps covered:
 *   - FUXIE_MASCOT_STATES
 *   - FUXIE_FOUNDATION_ASSETS
 *   - FUXIE_MODULE_MASCOTS
 *   - FUXIE_GAMIFICATION_MASCOTS
 *   - FUXIE_WORLD_PROPS
 *   - FUXIE_UI_FRAMES
 *   - FUXIE_3D_ASSETS
 *   - FUXIE_LIVING_3D_ASSETS  (`model`, `poster` strings + `frames` array)
 *   - REWARD_ASSETS
 *   - FUXIE_LEGACY_MASCOT_ALIASES (alias.target ∈ FUXIE_MASCOT_STATES)
 *
 * Usage: `pnpm check:asset-integrity`
 *
 * Exit code 0 on success; non-zero with one line per missing file:
 *   <group>.<key>: <path>
 *
 * Validates: Requirements 1.5
 */

import { existsSync, statSync } from 'node:fs'
import path from 'node:path'

import {
    FUXIE_3D_ASSETS,
    FUXIE_GAMIFICATION_MASCOTS,
    FUXIE_LEGACY_MASCOT_ALIASES,
    FUXIE_LIVING_3D_ASSETS,
    FUXIE_MASCOT_STATES,
    FUXIE_MODULE_MASCOTS,
    FUXIE_UI_FRAMES,
    FUXIE_WORLD_PROPS,
} from '../apps/web/src/lib/mascot/fuxie-assets'
import { REWARD_ASSETS } from '../apps/web/src/components/gamification/reward-assets'
// FOUNDATION map lives in `scripts/` (Decision 2 of asset-registry-cleanup):
// keeping it here means `findForbiddenRefs` no longer flags the eight
// `/mascot-3d/foundation/v1/...` reference-sheet paths as production violations,
// while tooling like this integrity check can still validate them on disk.
import { FUXIE_FOUNDATION_ASSETS } from './foundation-assets'

interface Violation {
    group: string
    key: string
    path: string
    reason: 'missing-file' | 'unknown-alias-target'
}

const PUBLIC_ROOT = path.join('apps', 'web', 'public')

function resolvePublicPath(value: string): string {
    // Registry values always start with `/` (web absolute path under public/).
    const stripped = value.startsWith('/') ? value.slice(1) : value
    return path.join(PUBLIC_ROOT, stripped)
}

function fileExists(value: string): boolean {
    const absolute = resolvePublicPath(value)
    if (!existsSync(absolute)) return false
    try {
        return statSync(absolute).isFile()
    } catch {
        return false
    }
}

function checkStringMap(
    group: string,
    map: Readonly<Record<string, string>>,
    violations: Violation[],
): void {
    for (const [key, value] of Object.entries(map)) {
        if (!fileExists(value)) {
            violations.push({ group, key, path: value, reason: 'missing-file' })
        }
    }
}

function checkLiving3dAssets(violations: Violation[]): void {
    const group = 'FUXIE_LIVING_3D_ASSETS'
    for (const [key, value] of Object.entries(FUXIE_LIVING_3D_ASSETS)) {
        if (Array.isArray(value)) {
            value.forEach((framePath, idx) => {
                if (!fileExists(framePath)) {
                    violations.push({
                        group,
                        key: `${key}[${idx}]`,
                        path: framePath,
                        reason: 'missing-file',
                    })
                }
            })
        } else if (typeof value === 'string') {
            if (!fileExists(value)) {
                violations.push({ group, key, path: value, reason: 'missing-file' })
            }
        }
    }
}

function checkLegacyAliases(violations: Violation[]): void {
    const group = 'FUXIE_LEGACY_MASCOT_ALIASES'
    const validTargets = new Set(Object.keys(FUXIE_MASCOT_STATES))
    for (const [alias, target] of Object.entries(FUXIE_LEGACY_MASCOT_ALIASES)) {
        if (!validTargets.has(target)) {
            violations.push({
                group,
                key: alias,
                path: `→ ${target} (not in FUXIE_MASCOT_STATES)`,
                reason: 'unknown-alias-target',
            })
        }
    }
}

function main(): void {
    const violations: Violation[] = []

    checkStringMap('FUXIE_MASCOT_STATES', FUXIE_MASCOT_STATES, violations)
    checkStringMap('FUXIE_FOUNDATION_ASSETS', FUXIE_FOUNDATION_ASSETS, violations)
    checkStringMap('FUXIE_MODULE_MASCOTS', FUXIE_MODULE_MASCOTS, violations)
    checkStringMap('FUXIE_GAMIFICATION_MASCOTS', FUXIE_GAMIFICATION_MASCOTS, violations)
    checkStringMap('FUXIE_WORLD_PROPS', FUXIE_WORLD_PROPS, violations)
    checkStringMap('FUXIE_UI_FRAMES', FUXIE_UI_FRAMES, violations)
    checkStringMap('FUXIE_3D_ASSETS', FUXIE_3D_ASSETS, violations)
    checkStringMap('REWARD_ASSETS', REWARD_ASSETS, violations)
    checkLiving3dAssets(violations)
    checkLegacyAliases(violations)

    const totalChecked =
        Object.keys(FUXIE_MASCOT_STATES).length +
        Object.keys(FUXIE_FOUNDATION_ASSETS).length +
        Object.keys(FUXIE_MODULE_MASCOTS).length +
        Object.keys(FUXIE_GAMIFICATION_MASCOTS).length +
        Object.keys(FUXIE_WORLD_PROPS).length +
        Object.keys(FUXIE_UI_FRAMES).length +
        Object.keys(FUXIE_3D_ASSETS).length +
        Object.keys(REWARD_ASSETS).length +
        Object.keys(FUXIE_LIVING_3D_ASSETS).length +
        Object.keys(FUXIE_LEGACY_MASCOT_ALIASES).length

    if (violations.length === 0) {
        console.log(
            `check:asset-integrity OK (verified ${totalChecked} entries across 10 maps)`,
        )
        process.exit(0)
    }

    console.error(
        `check:asset-integrity found ${violations.length} broken reference` +
            `${violations.length === 1 ? '' : 's'}:`,
    )
    for (const v of violations) {
        console.error(`${v.group}.${v.key}: ${v.path}`)
    }
    console.error(
        `\nResolve by restoring the missing file under \`${PUBLIC_ROOT}/\`, ` +
            `updating the registry value to a real path, or removing the entry ` +
            `(and adding it to docs/design/asset-archive.md if it was archived).`,
    )
    process.exit(1)
}

main()
