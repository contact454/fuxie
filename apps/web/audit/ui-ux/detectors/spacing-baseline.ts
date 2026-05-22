/**
 * spacing-baseline.ts — Detector for defect class 1.1 (Inconsistent
 * spacing vs 4px/8px baseline).
 *
 * Vai chinh: QA Automation Engineer
 * Vai phoi hop: Frontend Engineer, Product Designer
 *
 * Spec source-of-truth:
 *   - .kiro/specs/fuxie-ui-ux-audit-fix/bugfix.md § 1.1 (Inconsistent
 *     spacing vs 4px/8px baseline) — three conditions defining the
 *     bug:
 *       1. Computed `padding-{top,right,bottom,left}`,
 *          `margin-{top,bottom}`, `gap`, `row-gap`, `column-gap` of a
 *          block-level container is NOT a 4px multiple within ±1px
 *          tolerance.
 *       2. Two instances of the same component role across two
 *          (learn)/* routes have spacing values that differ by > 1px
 *          without a state-attribute explaining the diff.
 *       3. A spacing property uses a literal Npx instead of a
 *          `--space-*` token or Tailwind `p-*` / `gap-*` class.
 *   - .kiro/specs/fuxie-ui-ux-audit-fix/bugfix.md § 2.1 — expected
 *     behavior (token-or-multiple-of-4 contract).
 *   - .kiro/specs/fuxie-ui-ux-audit-fix/bugfix.md § 2.10 — severity
 *     mapping per qualifier (encoded by `severity-mapping.ts`).
 *   - .kiro/specs/fuxie-ui-ux-audit-fix/bugfix.md § 2.11 — required
 *     evidence keys for class 1.1: `property`, `computedValue`,
 *     `expectedToken`.
 *   - .kiro/specs/fuxie-ui-ux-audit-fix/design.md § Fix Implementation
 *     item 2 (1.1) — "scan computed padding-*, margin-*, gap,
 *     row-gap, column-gap with tolerance ±1px so với bội số 4px hoặc
 *     token --space-*".
 *   - .kiro/specs/fuxie-ui-ux-audit-fix/tasks.md task 3.4.
 *
 * Contract:
 *   - The detector implements the `Detector` signature from
 *     `../runtime/harness.ts` — `(ctx) => Finding[]`.
 *   - It walks every block-level container under each `(learn)/**`
 *     route in the rendered DOM, reads the seven spacing properties
 *     listed above, and emits findings for:
 *       (a) Single-instance off-token drift (condition 1 + 3):
 *           computed value is non-zero, NOT within ±1px of a 4px
 *           multiple, and the inline `style="..."` (the only literal
 *           source jsdom preserves) carries the offending property
 *           with a literal Npx.
 *       (b) Cross-route inconsistency (condition 2): two nodes that
 *           share a component-role key (same React component import
 *           path / same className root / same semantic role +
 *           archetype, per the precedence table in `bugfix.md` § 1.6
 *           clause 2 — the closest signal jsdom can give us is the
 *           className root) under different `(learn)/*` routes have
 *           one of the seven properties differing by > 1px AND
 *           neither carries a state-attribute that explains the diff.
 *   - Findings carry `defectClass: "1.1"`, severity from
 *     `assignSeverity('1.1', qualifiers)`, evidence per § 2.11 keys
 *     (`property`, `computedValue`, `expectedToken`), and pass
 *     `validateFinding`. Invalid candidates are dropped (logged via
 *     `console.warn` in test mode is intentionally avoided so the
 *     test runner stays quiet).
 *
 * Tolerance + token policy:
 *   - The audit treats any computed value within ±`SPACING_TOLERANCE_PX`
 *     of a non-negative multiple of `SPACING_BASELINE_PX` as
 *     compliant. This implements the "±1px tolerance" the spec
 *     allows for jsdom rounding.
 *   - The `--space-*` token check is a future-compat hook: the
 *     current `apps/web/src/app/globals.css` does NOT declare any
 *     `--space-*` tokens (see grep evidence in task 3.4). When such
 *     tokens are added, they will be 4px multiples by construction,
 *     so the multiple-of-4 check already covers them. The
 *     `expectedToken` evidence string still cites the spec contract
 *     so downstream triage can reach for the canonical token name.
 *
 * Non-goals (per Preservation 3.1, 3.2):
 *   - The detector NEVER proposes copy changes; it only flags
 *     spacing.
 *   - Cross-route findings explicitly do NOT cross into the 1.6
 *     paired-evidence territory: they emit at `defectClass: "1.1"`
 *     using class-1.1 evidence keys. Task 3.9 owns the richer 1.6
 *     paired-evidence shape for component-pattern drift. The two
 *     detectors will therefore both fire on the canonical 1.6 paired
 *     KPI-card fixture; the audit entry point (task 3.14) is
 *     responsible for de-duplication if needed.
 */

import type { Finding } from '../finding-schema'
import { validateFinding } from '../finding-validator'
import {
    assignSeverity,
    type SeverityQualifiers,
} from '../severity-mapping'
import type { AuditContext, Detector } from '../runtime/harness'

// =============================================================================
// SECTION 1 — Constants.
// =============================================================================

/**
 * Baseline grid in CSS px. `bugfix.md` § 1.1 condition 1 fixes 4px
 * as the baseline; 8px (the "8-point grid") is a strict subset of
 * 4px multiples so checking against 4px is sufficient.
 */
export const SPACING_BASELINE_PX = 4

/**
 * Tolerance applied around the baseline. `bugfix.md` § 1.1
 * condition 1 explicitly allows ±1px; this absorbs jsdom's rounded
 * `getComputedStyle` output for fractional CSS values.
 */
export const SPACING_TOLERANCE_PX = 1

/**
 * Cross-route inconsistency threshold. § 1.1 condition 2 says "lệch
 * nhau > 1px" — strictly greater than 1px is the bug condition.
 */
export const CROSS_ROUTE_DIFF_THRESHOLD_PX = 1

/**
 * The seven spacing properties enumerated by `bugfix.md` § 1.1
 * condition 1. Order matters for deterministic finding output:
 * detectors emit in this order so the same DOM yields the same
 * sequence of findings across runs.
 */
const SPACING_PROPERTIES = [
    'padding-top',
    'padding-right',
    'padding-bottom',
    'padding-left',
    'margin-top',
    'margin-bottom',
    'gap',
    'row-gap',
    'column-gap',
] as const

type SpacingProperty = (typeof SPACING_PROPERTIES)[number]

/**
 * Map a spacing CSS property to the camelCase key used by
 * `CSSStyleDeclaration` (jsdom + browsers). Keeping this explicit
 * avoids relying on `getPropertyValue` (which sometimes returns ""
 * in jsdom for shorthand-derived values).
 */
const SPACING_PROPERTY_TO_DOM_KEY: Readonly<
    Record<SpacingProperty, keyof CSSStyleDeclaration>
> = {
    'padding-top': 'paddingTop',
    'padding-right': 'paddingRight',
    'padding-bottom': 'paddingBottom',
    'padding-left': 'paddingLeft',
    'margin-top': 'marginTop',
    'margin-bottom': 'marginBottom',
    gap: 'gap',
    'row-gap': 'rowGap',
    'column-gap': 'columnGap',
}

/**
 * State-attributes from `bugfix.md` § 1.6 clause 2 that legitimize
 * a spacing diff between two same-role instances. § 1.1 condition 2
 * cross-references the same set ("không có state-attribute hợp lệ
 * phân biệt (xem 2.6)").
 */
const STATE_ATTRIBUTES = [
    'data-variant',
    'aria-disabled',
    'data-loading',
    'data-selected',
] as const

/**
 * Block-level tag set used to bound the scan. `bugfix.md` § 1.1
 * targets "every block-level container"; jsdom does not synthesize
 * `display` for unstyled elements, so we use the canonical
 * block-level HTML tag set as the cheap signal. Inline elements
 * (span, em, strong, …) are intentionally excluded.
 */
const BLOCK_LEVEL_TAGS = new Set([
    'address',
    'article',
    'aside',
    'blockquote',
    'details',
    'dialog',
    'div',
    'dl',
    'dt',
    'dd',
    'fieldset',
    'figcaption',
    'figure',
    'footer',
    'form',
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
    'header',
    'hgroup',
    'hr',
    'li',
    'main',
    'nav',
    'ol',
    'p',
    'pre',
    'section',
    'table',
    'tbody',
    'td',
    'tfoot',
    'th',
    'thead',
    'tr',
    'ul',
    // Interactive containers that commonly carry padding/margin in
    // the (learn) UI:
    'button',
    'label',
])

// =============================================================================
// SECTION 2 — Public detector.
// =============================================================================

/**
 * Detector for defect class 1.1. Returns the findings for the
 * single audit context — the entry point in task 3.14 calls this
 * once per pinned-mobile audit run.
 */
export const detectSpacingBaseline: Detector = (ctx) => {
    const findings: Finding[] = []

    const containers = collectBlockLevelContainers(ctx.renderedDom)

    // ---- (a) Single-instance off-token drift ---------------------------------
    for (const node of containers) {
        const computed = ctx.computedStyles(node)
        for (const prop of SPACING_PROPERTIES) {
            const observed = readSpacingPx(computed, prop)
            if (observed === null) continue
            // Zero is always compliant — `0px` matches the baseline.
            if (observed === 0) continue

            const drift = driftFromBaseline(observed)
            if (drift <= SPACING_TOLERANCE_PX) continue

            // The literal `Npx` sniff is best-effort: jsdom preserves
            // what the inline `style="..."` declared, which is the
            // common authoring channel in the (learn) surfaces. When
            // a stylesheet rule is the source we still flag (the
            // computed value is the only ground truth), but the
            // evidence will note "computed-from-stylesheet".
            const literalSource = sniffInlineLiteralSource(node, prop)

            const route = resolveRouteForNode(node) ?? ctx.route
            const component = describeComponent(node)
            const expectedToken = formatExpectedToken(observed)

            const qualifiers: SeverityQualifiers = {
                isPrimaryTaskSurface: isPrimaryTaskSurface(route),
                spacingDriftPx: drift,
                isCrossRouteInconsistency: false,
            }

            const candidate: Finding = {
                defectClass: '1.1',
                severity: assignSeverity('1.1', qualifiers),
                route,
                component,
                evidence: {
                    property: prop,
                    computedValue: `${observed}px`,
                    expectedToken,
                    // Diagnostic sub-fields (validator allows extra
                    // keys; these aid downstream triage):
                    driftPx: drift,
                    literalSource,
                    bugConditions: literalSource
                        ? ['1.1 condition 1', '1.1 condition 3']
                        : ['1.1 condition 1'],
                },
                expected:
                    'padding-/margin-/gap- value is a 4px multiple within ±1px tolerance OR matches a --space-* token (bugfix.md § 2.1 i)',
                screenshotPath: buildScreenshotPath(route, component, prop),
                forwardTo: null,
                action: 'fix',
            }

            const validation = validateFinding(candidate)
            if (validation.valid) {
                findings.push(candidate)
            }
        }
    }

    // ---- (b) Cross-route inconsistency (condition 2) -------------------------
    const crossRouteFindings = collectCrossRouteFindings(ctx, containers)
    for (const finding of crossRouteFindings) {
        const validation = validateFinding(finding)
        if (validation.valid) {
            findings.push(finding)
        }
    }

    return findings
}

export default detectSpacingBaseline

// =============================================================================
// SECTION 3 — DOM walking helpers.
// =============================================================================

/**
 * Collect every block-level container that lives under a
 * `(learn)/**` route. The detector accepts two ways the route is
 * marked, both used by exploration / preservation fixtures and by
 * the production HTML provider:
 *   1. `[data-route^="(learn)/"]` on a wrapping element (the
 *      preferred convention used by `tests/audit/ui-ux/exploration.spec.ts`).
 *   2. `<body data-audit-route="...">` set by the JSDOM harness in
 *      `runtime/harness.ts` when the loader's route already matches
 *      the (learn) prefix.
 *
 * When neither marker is present, the detector falls back to
 * scanning the whole document. This keeps detector unit tests
 * uncluttered while still letting the harness pass the route via
 * `ctx.route`.
 */
function collectBlockLevelContainers(doc: Document): HTMLElement[] {
    const result: HTMLElement[] = []
    const learnRoots = Array.from(
        doc.querySelectorAll<HTMLElement>('[data-route^="(learn)/"]'),
    )

    if (learnRoots.length > 0) {
        for (const root of learnRoots) {
            collectBlockLevelDescendants(root, result)
        }
        return result
    }

    // Whole-document fallback — the harness applies
    // `data-audit-route` on <body>; the route guard at the outer
    // entry point (task 3.14) confirms `(learn)/` membership.
    const body = doc.body ?? doc.documentElement
    if (body) {
        collectBlockLevelDescendants(body, result)
    }
    return result
}

function collectBlockLevelDescendants(
    root: HTMLElement,
    sink: HTMLElement[],
): void {
    // Include the root itself when it is block-level.
    if (BLOCK_LEVEL_TAGS.has(root.tagName.toLowerCase())) {
        sink.push(root)
    }
    const all = root.querySelectorAll('*')
    for (const el of Array.from(all)) {
        if (!(el instanceof (root.ownerDocument!.defaultView!.HTMLElement))) {
            // Some jsdom builds expose Element but not HTMLElement
            // for SVG nodes. Filter via a duck-typed check too.
            if (typeof (el as HTMLElement).tagName !== 'string') continue
        }
        const tag = (el as HTMLElement).tagName.toLowerCase()
        if (BLOCK_LEVEL_TAGS.has(tag)) {
            sink.push(el as HTMLElement)
        }
    }
}

/**
 * Resolve the (learn)/* route that owns this node. We walk up to
 * the closest ancestor (or self) carrying a `data-route` attribute
 * starting with `(learn)/`. When nothing is found we return null
 * and the detector falls back to `ctx.route`.
 */
function resolveRouteForNode(node: HTMLElement): string | null {
    let cursor: HTMLElement | null = node
    while (cursor) {
        const route = cursor.getAttribute('data-route')
        if (route && route.startsWith('(learn)/')) {
            return route
        }
        cursor = cursor.parentElement
    }
    return null
}

/**
 * Describe the offending DOM node for the Finding's `component`
 * field. The selector is the smallest stable identifier we can
 * derive from jsdom-rendered DOM:
 *   - `[data-fixture="..."]` when present (the explicit anchor
 *     fixtures use).
 *   - `[data-testid="..."]` next.
 *   - `<tag class="...">` as a final fallback.
 */
function describeComponent(node: HTMLElement): string {
    const fixture = node.getAttribute('data-fixture')
    if (fixture) return `[data-fixture="${fixture}"]`
    const testid = node.getAttribute('data-testid')
    if (testid) return `[data-testid="${testid}"]`
    const tag = node.tagName.toLowerCase()
    const className = node.getAttribute('class')
    if (className && className.trim().length > 0) {
        const root = className.trim().split(/\s+/)[0]
        return `${tag}.${root}`
    }
    return tag
}

// =============================================================================
// SECTION 4 — Computed-style helpers.
// =============================================================================

/**
 * Read a single spacing property's computed value as a number of
 * CSS pixels. Returns `null` when the value is missing or non-px
 * (auto, normal, percentage, inherited keywords) — these are not in
 * scope for the 4px-multiple rule.
 */
function readSpacingPx(
    computed: CSSStyleDeclaration,
    prop: SpacingProperty,
): number | null {
    const domKey = SPACING_PROPERTY_TO_DOM_KEY[prop]
    const raw = (computed[domKey] as unknown) as string | undefined
    if (typeof raw !== 'string' || raw.length === 0) return null
    if (!raw.endsWith('px')) return null
    const numeric = Number.parseFloat(raw)
    if (!Number.isFinite(numeric)) return null
    return numeric
}

/**
 * Distance to the nearest non-negative 4px multiple. Returns 0 when
 * `value` is itself a 4px multiple, < 1 for sub-px drifts, etc.
 */
function driftFromBaseline(value: number): number {
    if (!Number.isFinite(value)) return Number.POSITIVE_INFINITY
    if (value < 0) return Math.abs(value % SPACING_BASELINE_PX)
    const remainder = value % SPACING_BASELINE_PX
    return Math.min(remainder, SPACING_BASELINE_PX - remainder)
}

/**
 * Best-effort inline-literal sniff for evidence purposes. Looks at
 * the `style="..."` attribute and returns the literal substring
 * matching the property, e.g. `padding: 14px`. Returns `null` when
 * the value is set via stylesheet (computed-style still flags it,
 * but condition 3's "literal Npx" hook isn't triggered).
 *
 * The match is intentionally loose — `padding: 14px`, `padding:14px`,
 * and `padding-top: 14px` all return the substring as it appears.
 * Shorthand expansions are checked too: when `padding-top` is the
 * tracked property and the inline style has `padding: 14px`, that
 * shorthand is reported as the literal source.
 */
function sniffInlineLiteralSource(
    node: HTMLElement,
    prop: SpacingProperty,
): string | null {
    const style = node.getAttribute('style')
    if (!style) return null

    const lower = style.toLowerCase()

    // First pass — exact property name.
    const direct = matchPropertyDeclaration(lower, prop)
    if (direct) return direct

    // Second pass — shorthand expansion fallback.
    const shorthand = shorthandFor(prop)
    if (shorthand) {
        const sh = matchPropertyDeclaration(lower, shorthand)
        if (sh) return sh
    }
    return null
}

function matchPropertyDeclaration(
    style: string,
    prop: string,
): string | null {
    // Look for `<prop>:<value>` segments separated by `;`. We split
    // rather than regex so unbalanced quotes / data: URIs in the
    // style do not throw.
    const segments = style.split(';')
    for (const seg of segments) {
        const colon = seg.indexOf(':')
        if (colon === -1) continue
        const name = seg.slice(0, colon).trim()
        if (name === prop) {
            return seg.trim()
        }
    }
    return null
}

function shorthandFor(prop: SpacingProperty): string | null {
    switch (prop) {
        case 'padding-top':
        case 'padding-right':
        case 'padding-bottom':
        case 'padding-left':
            return 'padding'
        case 'margin-top':
        case 'margin-bottom':
            return 'margin'
        case 'gap':
        case 'row-gap':
        case 'column-gap':
            return 'gap'
        default:
            return null
    }
}

/**
 * Format the `expectedToken` evidence string. The audit does not
 * dictate which token is correct — that is a downstream design
 * decision — so the string lists the two nearest 4px-multiples
 * (the floor and ceiling) and references `--space-*` for token
 * adoption.
 */
function formatExpectedToken(observedPx: number): string {
    const floor = Math.floor(observedPx / SPACING_BASELINE_PX) *
        SPACING_BASELINE_PX
    const ceil = floor + SPACING_BASELINE_PX
    return `${floor}px or ${ceil}px (4px multiple) or matching --space-* token`
}

/**
 * Build a deterministic screenshot path for the finding. The audit
 * pipeline (task 3.14) is responsible for materializing the actual
 * PNG; this string is the contract slot, and its determinism keeps
 * `Finding[]` JSON stable across runs.
 */
function buildScreenshotPath(
    route: string,
    component: string,
    prop: SpacingProperty,
): string {
    const safeRoute = route.replace(/[^a-z0-9_-]+/gi, '_').replace(/^_+|_+$/g, '')
    const safeComponent = component
        .replace(/[^a-z0-9_-]+/gi, '_')
        .replace(/^_+|_+$/g, '')
    return `audit-reports/ui-ux/screens/1.1/${safeRoute}__${safeComponent}__${prop}.png`
}

// =============================================================================
// SECTION 5 — Cross-route inconsistency (condition 2).
// =============================================================================

interface CrossRouteCandidate {
    readonly node: HTMLElement
    readonly route: string
    readonly roleKey: string
    readonly perProperty: ReadonlyMap<SpacingProperty, number>
    readonly hasStateAttribute: boolean
}

/**
 * Find pairs of nodes under different `(learn)/*` routes that
 * share a component-role key and disagree on at least one spacing
 * property by more than `CROSS_ROUTE_DIFF_THRESHOLD_PX`. Per § 1.6
 * clause 2, the role key follows the precedence order:
 *   (1) same React component import path — not knowable from jsdom,
 *   (2) same className root — first whitespace-separated class.
 *   (3) same semantic role + visual archetype — best-effort via
 *       (tagName, role attribute) when no className is set.
 */
function collectCrossRouteFindings(
    ctx: AuditContext,
    containers: ReadonlyArray<HTMLElement>,
): Finding[] {
    const candidates: CrossRouteCandidate[] = []
    for (const node of containers) {
        const route = resolveRouteForNode(node)
        if (!route) continue
        const roleKey = computeRoleKey(node)
        if (!roleKey) continue
        const computed = ctx.computedStyles(node)
        const perProperty = new Map<SpacingProperty, number>()
        for (const prop of SPACING_PROPERTIES) {
            const value = readSpacingPx(computed, prop)
            if (value !== null) {
                perProperty.set(prop, value)
            }
        }
        candidates.push({
            node,
            route,
            roleKey,
            perProperty,
            hasStateAttribute: hasStateAttribute(node),
        })
    }

    // Bucket by roleKey, then iterate route pairs.
    const byRole = new Map<string, CrossRouteCandidate[]>()
    for (const c of candidates) {
        const list = byRole.get(c.roleKey) ?? []
        list.push(c)
        byRole.set(c.roleKey, list)
    }

    const findings: Finding[] = []
    const reportedPairs = new Set<string>()

    for (const [roleKey, list] of byRole) {
        if (list.length < 2) continue
        // Compare every cross-route pair.
        for (let i = 0; i < list.length; i++) {
            for (let j = i + 1; j < list.length; j++) {
                const a = list[i]
                const b = list[j]
                if (a.route === b.route) continue
                if (a.hasStateAttribute || b.hasStateAttribute) continue

                const diffs: Array<{
                    prop: SpacingProperty
                    valueA: number
                    valueB: number
                    diff: number
                }> = []
                for (const prop of SPACING_PROPERTIES) {
                    const va = a.perProperty.get(prop)
                    const vb = b.perProperty.get(prop)
                    if (va === undefined || vb === undefined) continue
                    const diff = Math.abs(va - vb)
                    if (diff > CROSS_ROUTE_DIFF_THRESHOLD_PX) {
                        diffs.push({
                            prop,
                            valueA: va,
                            valueB: vb,
                            diff,
                        })
                    }
                }
                if (diffs.length === 0) continue

                // De-duplicate: emit one finding per role × route pair.
                const pairKey = `${roleKey}|${a.route}|${b.route}`
                if (reportedPairs.has(pairKey)) continue
                reportedPairs.add(pairKey)

                const headline = diffs[0]
                const isPrimary =
                    isPrimaryTaskSurface(a.route) ||
                    isPrimaryTaskSurface(b.route)
                const qualifiers: SeverityQualifiers = {
                    isPrimaryTaskSurface: isPrimary,
                    isCrossRouteInconsistency: true,
                    spacingDriftPx: headline.diff,
                }

                const componentDisplay = `${describeComponent(a.node)} (${a.route}) ↔ ${describeComponent(
                    b.node,
                )} (${b.route})`

                const candidate: Finding = {
                    defectClass: '1.1',
                    severity: assignSeverity('1.1', qualifiers),
                    route: `${a.route} + ${b.route}`,
                    component: componentDisplay,
                    evidence: {
                        property: headline.prop,
                        computedValue: `${a.route}=${headline.valueA}px; ${b.route}=${headline.valueB}px`,
                        expectedToken:
                            'identical 4px-multiple value across both routes (or a state-attribute that explains the diff per bugfix.md § 1.6 clause 2)',
                        // Diagnostic sub-fields:
                        kind: 'cross-route-inconsistency',
                        roleKey,
                        diffs: diffs.map((d) => ({
                            property: d.prop,
                            valueA: d.valueA,
                            valueB: d.valueB,
                            diffPx: d.diff,
                        })),
                        bugConditions: ['1.1 condition 2'],
                    },
                    expected:
                        'Two instances of the same component role across (learn)/* routes share the same spacing values, OR carry a state-attribute (data-variant / aria-disabled / data-loading / data-selected) that explains the diff (bugfix.md § 2.1 ii, § 1.6 clause 2)',
                    screenshotPath: buildScreenshotPath(
                        `${a.route}__vs__${b.route}`,
                        roleKey,
                        headline.prop,
                    ),
                    forwardTo: null,
                    action: 'fix',
                }
                findings.push(candidate)
            }
        }
    }
    return findings
}

function computeRoleKey(node: HTMLElement): string | null {
    const className = node.getAttribute('class')
    if (className && className.trim().length > 0) {
        // First whitespace-separated class is the BEM block / the
        // Tailwind component class root per § 1.6 clause 2 (2).
        return `class:${className.trim().split(/\s+/)[0]}`
    }
    const role = node.getAttribute('role')
    if (role) {
        return `role:${node.tagName.toLowerCase()}:${role}`
    }
    return null
}

function hasStateAttribute(node: HTMLElement): boolean {
    for (const attr of STATE_ATTRIBUTES) {
        if (node.hasAttribute(attr)) return true
    }
    return false
}

// =============================================================================
// SECTION 6 — Surface helpers.
// =============================================================================

/**
 * Primary task surfaces per design.md § Glossary entry "Primary
 * task surface": lesson player / exercise screens + dashboard.
 * Used to drive `assignSeverity`'s `isPrimaryTaskSurface` qualifier.
 */
const PRIMARY_TASK_SURFACE_PREFIXES: ReadonlyArray<string> = [
    '(learn)/listening',
    '(learn)/reading',
    '(learn)/writing',
    '(learn)/speaking',
    '(learn)/grammar',
    '(learn)/vocabulary',
    '(learn)/dashboard',
]

function isPrimaryTaskSurface(route: string): boolean {
    // Routes can come from `data-route` attributes ("(learn)/dashboard")
    // or from absolute file paths ("apps/web/src/app/(learn)/dashboard/page.tsx").
    // The prefix check tolerates both.
    for (const prefix of PRIMARY_TASK_SURFACE_PREFIXES) {
        if (route.includes(prefix)) return true
    }
    return false
}
