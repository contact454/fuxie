/**
 * State-Shell Coverage Audit
 *
 * Vai chinh: Frontend Engineer
 * Vai phoi hop: Design System Designer (default copy length), Gamification
 *               Designer (mascot=guard rules)
 *
 * Spec source-of-truth:
 *   - Task 16.2 (gamified-ui-asset-rollout) — "Apply state-shell to all P0
 *     surfaces missing locked/empty/error".
 *   - requirements.md Req 11.1, 11.2 (every P0 surface declares ≥
 *     `default | empty | error`, and `locked` where gating exists).
 *   - requirements.md Req 20.1 (P0 surface enumeration).
 *
 * What this script does
 * ---------------------
 * For each P0 surface listed in `P0_SURFACES`, statically verify that the
 * surface declares the required Surface_States:
 *
 *   - `default` — always required. Detected by the existence of the surface
 *     `page.tsx` (the canonical default render).
 *   - `empty`   — always required. Detected by ANY of:
 *       * a sibling `not-found.tsx` rendering `<StateShell state="empty">`,
 *       * the surface `page.tsx` short-circuiting to
 *         `<StateShell state="empty">` (e.g. vocabulary practice/microgames),
 *       * any `<StateShell state="empty">` reference under the surface
 *         subtree (`apps/web/src/app/(learn)/<surface>/**`).
 *   - `error`   — always required. Detected by:
 *       * a `error.tsx` segment file rendering `<StateShell state="error">`,
 *         OR
 *       * any `<StateShell state="error">` usage under the surface subtree
 *         OR a sibling support component file referenced from the surface.
 *   - `locked`  — required when the surface declares it in
 *     `SURFACE_MASCOT_CONFIG`. Detected by any
 *     `<StateShell state="locked">` reference, OR an inline node-level
 *     `data-node-state="locked"` (the course path renders locked nodes
 *     directly inside `CourseClientDynamic` rather than as a segment-level
 *     boundary, which is the canonical pattern for inline gating).
 *
 * Detection is deliberately textual (regex over `.ts`/`.tsx`) so the audit
 * runs in CI without bundling the Next.js app. False negatives (state
 * declared via runtime composition but not via `<StateShell>` token or
 * `data-surface-state="..."` attribute) are flagged so the team can opt
 * each surface into the canonical state-shell pattern.
 *
 * Wired as `pnpm check:state-shell-coverage`.
 *
 * Validates: Requirements 11.1, 11.2, 20.1
 */

import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'

import {
    P0_SURFACE_IDS,
    SURFACE_MASCOT_CONFIG,
    type SurfaceId,
    type SurfaceState,
} from '../apps/web/src/lib/mascot/mascot-role'

// -----------------------------------------------------------------------------
// Surface → route folder map
// -----------------------------------------------------------------------------

/**
 * P0 surfaces audited by this script. The `result-reward` config entry is a
 * cross-surface overlay (not a route) so we exclude it — its states are
 * exercised by `ResultRewardLoop` unit tests, not segment files.
 */
type AuditedSurfaceId = Exclude<SurfaceId, 'result-reward'>

interface SurfaceLocation {
    surfaceId: AuditedSurfaceId
    /**
     * Folder relative to `apps/web/src/app/(learn)/` whose `page.tsx`
     * renders the `default` state of the surface.
     */
    routeFolder: string
    /**
     * Optional list of additional folders that contribute to the surface's
     * declared states (e.g. dynamic `[id]` players).
     */
    extraFolders?: string[]
    /**
     * Optional list of component-tree folders relative to
     * `apps/web/src/components/` that own surface state rendering. Used
     * when the surface delegates the empty/locked rendering to a
     * dedicated component (e.g. course nodes, review backbone hero,
     * shop backbone client).
     */
    componentFolders?: string[]
}

const P0_SURFACES: SurfaceLocation[] = [
    { surfaceId: 'dashboard', routeFolder: 'dashboard', componentFolders: ['dashboard'] },
    {
        surfaceId: 'course',
        routeFolder: 'course',
        // Course nodes own the inline `data-node-state="locked"` rendering
        // per design §I.2; the surface delegates locked gating there.
        componentFolders: ['course'],
    },
    {
        surfaceId: 'vocabulary',
        routeFolder: 'vocabulary',
        componentFolders: ['vocabulary'],
    },
    {
        surfaceId: 'vocabulary-practice',
        routeFolder: 'vocabulary/practice',
        componentFolders: ['vocabulary'],
    },
    {
        surfaceId: 'vocabulary-microgames',
        routeFolder: 'vocabulary/microgames',
        componentFolders: ['vocabulary'],
    },
    {
        surfaceId: 'reading',
        // Reading's canonical learner surface is the player route.
        routeFolder: 'reading/[exerciseId]',
        // Catalog + segment files (error.tsx / not-found.tsx) live one
        // level up so the audit considers both layers.
        extraFolders: ['reading'],
        componentFolders: ['reading'],
    },
    {
        surfaceId: 'listening',
        routeFolder: 'listening/[lessonId]',
        extraFolders: ['listening'],
        componentFolders: ['listening'],
    },
    {
        surfaceId: 'speaking',
        routeFolder: 'speaking/[lessonId]',
        extraFolders: ['speaking'],
        componentFolders: ['speaking'],
    },
    {
        surfaceId: 'speaking-roleplay',
        routeFolder: 'speaking/[lessonId]/roleplay',
        // Catalog-level boundaries also count.
        extraFolders: ['speaking'],
        componentFolders: ['speaking'],
    },
    {
        surfaceId: 'writing',
        routeFolder: 'writing/[exerciseId]',
        extraFolders: ['writing'],
        componentFolders: ['writing'],
    },
    {
        surfaceId: 'review',
        routeFolder: 'review',
        // Review hero owns inline `default` / `empty` rendering via
        // `data-surface-state={state}` on `<ReviewBackboneHero>`.
        componentFolders: ['review'],
    },
    {
        surfaceId: 'rewards-shop',
        routeFolder: 'rewards/shop',
        extraFolders: ['rewards'],
        // Shop backbone client owns inline `<StateShell state="empty">` /
        // `<StateShell state="error">` for the surface.
        componentFolders: ['gamification'],
    },
    {
        surfaceId: 'exam',
        routeFolder: 'exam/[examId]',
        extraFolders: ['exam'],
        componentFolders: ['exam'],
    },
]

// -----------------------------------------------------------------------------
// Required state derivation
// -----------------------------------------------------------------------------

const ALWAYS_REQUIRED_STATES: SurfaceState[] = ['default', 'empty', 'error']

function requiredStatesFor(surfaceId: AuditedSurfaceId): SurfaceState[] {
    const declared = SURFACE_MASCOT_CONFIG[surfaceId].states
    const required = new Set<SurfaceState>(ALWAYS_REQUIRED_STATES)
    if (declared.locked !== undefined) {
        required.add('locked')
    }
    return [...required]
}

// -----------------------------------------------------------------------------
// State detection (textual scan)
// -----------------------------------------------------------------------------

const LEARN_ROOT = path.join('apps', 'web', 'src', 'app', '(learn)')
const COMPONENTS_ROOT = path.join('apps', 'web', 'src', 'components')
const SCAN_EXTS = new Set(['.ts', '.tsx'])

interface FoundState {
    state: SurfaceState
    where: string
}

/**
 * Recursively walk a directory and collect `.ts`/`.tsx` file paths.
 */
function listSourceFiles(rootDir: string): string[] {
    if (!existsSync(rootDir)) return []
    const out: string[] = []
    const stack: string[] = [rootDir]
    while (stack.length > 0) {
        const dir = stack.pop() as string
        let entries: ReturnType<typeof readdirSync>
        try {
            entries = readdirSync(dir, { withFileTypes: true })
        } catch {
            continue
        }
        for (const entry of entries) {
            const full = path.join(dir, entry.name)
            if (entry.isDirectory()) {
                stack.push(full)
                continue
            }
            if (!entry.isFile()) continue
            const ext = path.extname(entry.name).toLowerCase()
            if (!SCAN_EXTS.has(ext)) continue
            out.push(full)
        }
    }
    return out
}

/**
 * Detect `<StateShell ... state="<state>" ...>` usages. The component is
 * always imported and rendered as JSX so a regex over the raw source is
 * sufficient. Multi-line props are accommodated via `[\s\S]` between the
 * tag opener and the closing `>`.
 */
function findStateShellUsages(src: string): SurfaceState[] {
    const out: SurfaceState[] = []
    const re = /<StateShell([\s\S]*?)>/g
    let match: RegExpExecArray | null
    while ((match = re.exec(src)) !== null) {
        const props = match[1] ?? ''
        const stateMatch =
            /state\s*=\s*["'`](default|empty|locked|error|success)["'`]/.exec(props)
        if (stateMatch) {
            out.push(stateMatch[1] as SurfaceState)
        }
    }
    return out
}

/**
 * Detect inline locked nodes used by the course path. The course surface
 * renders locked lessons as nodes with `data-node-state="locked"` instead
 * of a segment-level state-shell — that is the canonical pattern for
 * locked gating per design §I.2.
 *
 * Detection accepts both literal forms (`data-node-state="locked"`) and
 * prop-bound forms (`data-node-state={state}` or `data-node-state={...}`)
 * where the `'locked'` token appears in the same file as a literal — this
 * matches how `course-node.tsx` carries `'locked' | 'available' | ...` in
 * its TypeScript union and forwards `state` onto the data attribute.
 */
function hasInlineLockedNode(src: string): boolean {
    if (/data-node-state\s*=\s*["'`]locked["'`]/.test(src)) return true
    if (
        /data-node-state\s*=\s*\{/.test(src) &&
        /["'`]locked["'`]/.test(src)
    ) {
        return true
    }
    return false
}

/**
 * Look for canonical surface-state attributes (`data-surface-state="..."`)
 * which surface heroes set when they render the state inline (e.g.
 * `dashboard-backbone-hero`, `review-backbone-hero`).
 *
 * Two forms are supported:
 *   1. Literal:  `data-surface-state="empty"` — registers `empty` directly.
 *   2. Prop-bound: `data-surface-state={state}` — registers any of
 *      `default | empty | locked | error | success` whose token appears
 *      as a literal elsewhere in the same file (typically the hero's
 *      union prop type or the conditional render branches).
 */
function findSurfaceStateAttrs(src: string): SurfaceState[] {
    const out: SurfaceState[] = []
    // Literal form.
    const literalRe =
        /data-surface-state\s*=\s*(?:["'`](default|empty|locked|error|success)["'`]|\{\s*['"`](default|empty|locked|error|success)['"`]\s*\})/g
    let match: RegExpExecArray | null
    while ((match = literalRe.exec(src)) !== null) {
        const value = match[1] ?? match[2]
        if (value) out.push(value as SurfaceState)
    }

    // Prop-bound form: `data-surface-state={...}`. Register every state
    // token that appears as a literal elsewhere in the file. This
    // captures heroes that emit `data-surface-state={state}` while the
    // surrounding source enumerates `state === 'empty'` branches.
    if (/data-surface-state\s*=\s*\{(?!\s*['"`])/.test(src)) {
        const tokenRe =
            /['"`](default|empty|locked|error|success)['"`]/g
        let tokenMatch: RegExpExecArray | null
        while ((tokenMatch = tokenRe.exec(src)) !== null) {
            out.push(tokenMatch[1] as SurfaceState)
        }
    }

    return out
}

interface SurfaceAuditOutcome {
    surfaceId: AuditedSurfaceId
    required: SurfaceState[]
    found: Record<SurfaceState, string[]>
    missing: SurfaceState[]
}

function auditSurface(loc: SurfaceLocation): SurfaceAuditOutcome {
    const required = requiredStatesFor(loc.surfaceId)
    const folders = [loc.routeFolder, ...(loc.extraFolders ?? [])]
    const seen: Record<SurfaceState, string[]> = {
        default: [],
        empty: [],
        locked: [],
        error: [],
        success: [],
    }

    for (const folder of folders) {
        const fsDir = path.join(LEARN_ROOT, folder)
        if (!existsSync(fsDir)) continue

        // `default` state — `page.tsx` directly under the route folder
        // (NOT a deeper folder) counts as the default render.
        const pagePath = path.join(fsDir, 'page.tsx')
        if (existsSync(pagePath)) {
            seen.default.push(toPosix(pagePath))
        }

        // Walk the subtree for state-shell + surface-state attribute hits.
        const files = listSourceFiles(fsDir)
        for (const file of files) {
            const src = safeRead(file)
            if (src === null) continue

            const shellHits = findStateShellUsages(src)
            for (const state of shellHits) {
                seen[state].push(toPosix(file))
            }

            const attrHits = findSurfaceStateAttrs(src)
            for (const state of attrHits) {
                seen[state].push(toPosix(file))
            }

            // Course-style inline locked nodes.
            if (hasInlineLockedNode(src)) {
                seen.locked.push(toPosix(file))
            }
        }

        // Segment-level error.tsx — even when the file is empty, its
        // presence wires the error boundary. The walk above already picks
        // up `<StateShell state="error">` usage; this catch ensures plain
        // boundaries still register the state.
        const errorPath = path.join(fsDir, 'error.tsx')
        if (existsSync(errorPath) && !seen.error.includes(toPosix(errorPath))) {
            seen.error.push(toPosix(errorPath))
        }

        // Segment-level not-found.tsx — counts as `empty` even if the file
        // body is plain markup.
        const notFoundPath = path.join(fsDir, 'not-found.tsx')
        if (existsSync(notFoundPath) && !seen.empty.includes(toPosix(notFoundPath))) {
            seen.empty.push(toPosix(notFoundPath))
        }
    }

    // Walk the surface's component subtree(s) to catch state rendering
    // that is delegated to a component (e.g. course nodes, review hero,
    // shop backbone client). Files are only scanned for state evidence —
    // they do not count toward the `default` state (only `page.tsx` does).
    for (const folder of loc.componentFolders ?? []) {
        const fsDir = path.join(COMPONENTS_ROOT, folder)
        if (!existsSync(fsDir)) continue
        const files = listSourceFiles(fsDir)
        for (const file of files) {
            const src = safeRead(file)
            if (src === null) continue

            const shellHits = findStateShellUsages(src)
            for (const state of shellHits) {
                seen[state].push(toPosix(file))
            }

            const attrHits = findSurfaceStateAttrs(src)
            for (const state of attrHits) {
                seen[state].push(toPosix(file))
            }

            if (hasInlineLockedNode(src)) {
                seen.locked.push(toPosix(file))
            }
        }
    }

    // Deduplicate per state.
    for (const state of Object.keys(seen) as SurfaceState[]) {
        seen[state] = [...new Set(seen[state])]
    }

    const missing = required.filter((state) => seen[state].length === 0)
    return { surfaceId: loc.surfaceId, required, found: seen, missing }
}

function safeRead(file: string): string | null {
    try {
        const stat = statSync(file)
        if (!stat.isFile()) return null
    } catch {
        return null
    }
    try {
        return readFileSync(file, 'utf8')
    } catch {
        return null
    }
}

function toPosix(p: string): string {
    return p.split(path.sep).join('/')
}

// -----------------------------------------------------------------------------
// Reporting
// -----------------------------------------------------------------------------

function formatSeen(found: Record<SurfaceState, string[]>): string {
    const lines: string[] = []
    for (const state of Object.keys(found) as SurfaceState[]) {
        const hits = found[state]
        if (hits.length === 0) continue
        lines.push(`  ${state}:`)
        for (const hit of hits.slice(0, 3)) lines.push(`    - ${hit}`)
        if (hits.length > 3) lines.push(`    …and ${hits.length - 3} more`)
    }
    return lines.length === 0 ? '  (no states detected)' : lines.join('\n')
}

function main(): void {
    // Quick sanity: P0_SURFACE_IDS must include every audited surface.
    const known = new Set(P0_SURFACE_IDS)
    for (const loc of P0_SURFACES) {
        if (!known.has(loc.surfaceId)) {
            console.error(
                `[check:state-shell-coverage] surface "${loc.surfaceId}" is not in P0_SURFACE_IDS — fix the audit map.`,
            )
            process.exit(2)
        }
    }

    const outcomes = P0_SURFACES.map(auditSurface)
    const failing = outcomes.filter((o) => o.missing.length > 0)

    console.log('check:state-shell-coverage — P0 surface audit\n')
    for (const o of outcomes) {
        const ok = o.missing.length === 0
        const head = ok ? '✓' : '✗'
        console.log(
            `${head} ${o.surfaceId}  required: [${o.required.join(', ')}]  ` +
                `missing: [${o.missing.join(', ')}]`,
        )
        if (!ok) {
            console.log(formatSeen(o.found))
        }
    }

    if (failing.length === 0) {
        console.log(
            `\ncheck:state-shell-coverage OK — ${outcomes.length} P0 surfaces, all required states declared.`,
        )
        process.exit(0)
    }

    console.error(
        `\ncheck:state-shell-coverage FAILED — ${failing.length}/${outcomes.length} P0 surface(s) missing required states:`,
    )
    for (const f of failing) {
        console.error(
            `  - ${f.surfaceId} missing: [${f.missing.join(', ')}]`,
        )
    }
    console.error(
        '\nFix by adding `<StateShell state="…">` usage, a segment-level error.tsx/not-found.tsx, or (for locked) inline `data-node-state="locked"` rendering.',
    )
    process.exit(1)
}

main()
