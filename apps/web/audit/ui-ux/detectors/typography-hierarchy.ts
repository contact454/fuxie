/**
 * typography-hierarchy.ts — Detector for defect class 1.2 (Unclear
 * typography hierarchy).
 *
 * Vai chinh: QA Automation Engineer
 * Vai phoi hop: Frontend Engineer, Product Designer
 *
 * Spec source-of-truth:
 *   - .kiro/specs/fuxie-ui-ux-audit-fix/bugfix.md § 1.2 — three
 *     bug conditions for unclear typography hierarchy:
 *       (a) Two text nodes adjacent in semantic rank (heading ↔
 *           body, body ↔ caption) inside the SAME semantic block
 *           differ by `font-size` ratio < 1.125x AND by
 *           `font-weight` < 200 units.
 *       (b) The block contains > 3 distinct (font-size,
 *           font-weight) combos — excluding inline emphasis
 *           (`<strong>`, `<em>`) nested in body sentences, and
 *           excluding icon/badge.
 *       (c) A heading uses a `font-size` outside the canonical
 *           `--text-*-size` token set, OR uses the same token as
 *           the block's body.
 *   - .kiro/specs/fuxie-ui-ux-audit-fix/bugfix.md § 2.2 — expected
 *     behavior (token-or-ratio contract).
 *   - .kiro/specs/fuxie-ui-ux-audit-fix/bugfix.md § 2.10 row 1.2 —
 *     severity mapping (encoded by `severity-mapping.ts`):
 *       P0: heading↔body indistinguishable on primary task surface.
 *       P1: body↔caption on primary task surface; size off-token at
 *           any surface; > 3 combos on primary task surface.
 *       P2: violation only inside a secondary block (footer, meta).
 *   - .kiro/specs/fuxie-ui-ux-audit-fix/bugfix.md § 2.11 — required
 *     evidence keys for class 1.2: `fontSize`, `fontWeight`,
 *     `expectedTokenSet`.
 *   - .kiro/specs/fuxie-ui-ux-audit-fix/design.md § Fix
 *     Implementation item 2 (1.2) — "enforce token --text-*-size,
 *     check ratio ≥ 1.125x hoặc weight delta ≥ 200, đếm tổ hợp ≤ 3
 *     mỗi semantic block".
 *   - .kiro/specs/fuxie-ui-ux-audit-fix/tasks.md task 3.5.
 *   - apps/web/src/app/globals.css §§ 117–130 — declares
 *     `--text-2xs-size` … `--text-8xl-size`. The token set in this
 *     file MUST stay in sync with that declaration.
 *
 * Detector structure (mirrors `spacing-baseline.ts`):
 *   1. Walk every semantic block under the `(learn)/**` route.
 *   2. Within each block, classify text nodes into ranks
 *      {heading, body, caption} and read their `(font-size,
 *      font-weight)` pair, skipping inline emphasis / icon / badge.
 *   3. Emit findings for:
 *      (a) Adjacent-rank collapse (condition 1.2(a)).
 *      (b) > 3 distinct combos in the block (condition 1.2(b)).
 *      (c) Heading off-token OR sharing the body's token
 *          (condition 1.2(c)).
 *   4. Each candidate runs through `assignSeverity('1.2', ...)` for
 *      severity assignment, carries evidence `{ fontSize,
 *      fontWeight, expectedTokenSet }` per § 2.11, and is gated by
 *      `validateFinding` before being returned.
 *
 * Tolerance + token policy:
 *   - The `--text-*-size` token set is read declaratively from the
 *     constants in this module rather than parsed live from
 *     `globals.css`. Tests in `tests/audit/ui-ux/detectors/
 *     typography-hierarchy.spec.ts` assert these values match the
 *     globals.css declarations, so any drift between the CSS source
 *     and the audit's view of the token set is caught at CI time
 *     (not silently absorbed at runtime).
 *   - Computed `font-size` is rounded to the nearest 0.01px before
 *     comparison; this absorbs jsdom's float arithmetic on rem ↔
 *     px conversions without widening the contract.
 *
 * Non-goals (per Preservation 3.1):
 *   - The detector NEVER proposes copy / wording changes; it only
 *     flags typography hierarchy. Wording is owned by
 *     `learner-copy-localization-backfill`.
 *   - Inline emphasis (`<strong>`, `<em>`) and icon / badge nodes
 *     are filtered out before counting distinct combos so they do
 *     not inflate the (a)/(b) counts (`bugfix.md` § 1.2 (b)).
 */

import type { Finding } from '../finding-schema'
import { validateFinding } from '../finding-validator'
import {
    assignSeverity,
    type SeverityQualifiers,
} from '../severity-mapping'
import type { AuditContext, Detector } from '../runtime/harness'

// =============================================================================
// SECTION 1 — Token set + numeric thresholds.
// =============================================================================

/**
 * Default root font-size used to convert `rem` token values to
 * px. `apps/web/src/app/globals.css` does not redefine the root
 * font-size, so the browser default of 16px applies. Tests
 * assert this value against the actual `:root` declaration so a
 * future change there is caught.
 */
export const ROOT_FONT_SIZE_PX = 16

/**
 * The canonical `--text-*-size` token set from
 * `apps/web/src/app/globals.css` §§ 117–130. Each entry is the
 * resolved px value at the default root font-size. Order matches
 * the small → large progression in the CSS source so finding
 * output is deterministic.
 *
 * The detector accepts ANY of these px values (within tolerance)
 * as compliant. A heading or body that lands outside the set is
 * flagged under condition 1.2(c).
 */
export const TEXT_SIZE_TOKEN_PX: ReadonlyArray<{
    readonly token: string
    readonly px: number
}> = [
    { token: '--text-2xs-size', px: 0.6875 * ROOT_FONT_SIZE_PX },
    { token: '--text-xs-size', px: 0.75 * ROOT_FONT_SIZE_PX },
    { token: '--text-sm-size', px: 0.875 * ROOT_FONT_SIZE_PX },
    { token: '--text-base-size', px: 1 * ROOT_FONT_SIZE_PX },
    { token: '--text-lg-size', px: 1.125 * ROOT_FONT_SIZE_PX },
    { token: '--text-xl-size', px: 1.25 * ROOT_FONT_SIZE_PX },
    { token: '--text-2xl-size', px: 1.5 * ROOT_FONT_SIZE_PX },
    { token: '--text-3xl-size', px: 1.875 * ROOT_FONT_SIZE_PX },
    { token: '--text-4xl-size', px: 2.25 * ROOT_FONT_SIZE_PX },
    { token: '--text-5xl-size', px: 3 * ROOT_FONT_SIZE_PX },
    { token: '--text-6xl-size', px: 3.5 * ROOT_FONT_SIZE_PX },
    { token: '--text-7xl-size', px: 4 * ROOT_FONT_SIZE_PX },
    { token: '--text-8xl-size', px: 4.5 * ROOT_FONT_SIZE_PX },
]

/**
 * Tolerance applied when comparing a computed font-size in px
 * against a token value. jsdom's float arithmetic on rem → px
 * conversions can produce 0.000…1 drift; 0.5px is comfortably
 * larger than that yet smaller than the smallest gap between
 * tokens (11 → 12 → 14 px).
 */
export const TOKEN_PX_TOLERANCE = 0.5

/**
 * Minimum font-size ratio that distinguishes adjacent semantic
 * ranks per `bugfix.md` § 2.2 (ii): heading ↔ body / body ↔
 * caption SHALL differ by ≥ 1.125x in size OR ≥ 200 in weight.
 */
export const FONT_SIZE_RATIO_MIN = 1.125

/**
 * Minimum font-weight delta that distinguishes adjacent semantic
 * ranks per `bugfix.md` § 2.2 (ii). 200 is enough to step from
 * regular (400) to extra-bold (600+) without false positives on
 * 100-step micro-tweaks.
 */
export const FONT_WEIGHT_DELTA_MIN = 200

/**
 * Maximum distinct (font-size, font-weight) combos allowed inside
 * a single semantic block per `bugfix.md` § 2.2 (iii) — heading +
 * body + caption. Inline emphasis inside body sentences does not
 * count as its own rank.
 */
export const MAX_DISTINCT_COMBOS_PER_BLOCK = 3

/**
 * Default font-weight assumed when neither `style="font-weight:..."`
 * nor `<b>` / `<strong>` synthesises one. Browsers and jsdom
 * resolve unstyled text to `normal` (= 400). Mirrors the W3C
 * default so unit tests that omit weight stay at 400.
 */
export const DEFAULT_FONT_WEIGHT = 400

// =============================================================================
// SECTION 2 — Semantic rank + block selectors.
// =============================================================================

type SemanticRank = 'heading' | 'body' | 'caption'

/**
 * HTML tags that are inherently semantic headings. Matches the
 * native flow-level heading tags. `[role="heading"]` is also
 * recognised below to cover ARIA-styled headings used by some
 * primitive components.
 */
const HEADING_TAGS = new Set(['h1', 'h2', 'h3', 'h4', 'h5', 'h6'])

/**
 * HTML tags that are inherently semantic captions / meta. Members
 * here render as the "caption" rank for adjacent-rank comparison.
 */
const CAPTION_TAGS = new Set(['figcaption', 'caption', 'small'])

/**
 * Body-level paragraph and label tags. Anything inside a semantic
 * block that is not classified as heading / caption / inline
 * emphasis / icon / badge falls back to the body rank.
 */
const BODY_TAGS = new Set(['p', 'span', 'label', 'div', 'li', 'dd', 'dt'])

/**
 * Inline-emphasis tags excluded from counting per `bugfix.md`
 * § 1.2 condition (b): `<strong>` and `<em>` nested inside a body
 * sentence are NOT counted as a distinct rank or distinct combo.
 * `<b>` and `<i>` are visual-only synonyms and are excluded too.
 */
const INLINE_EMPHASIS_TAGS = new Set(['strong', 'em', 'b', 'i', 'mark'])

/**
 * Tags commonly used for icon / badge containers that the spec
 * excludes from the typography count. SVG icons are excluded
 * regardless of role; explicit `[data-role="icon"|"badge"]`
 * markers are also honoured so primitives can opt-in.
 */
const ICON_BADGE_TAGS = new Set(['svg', 'img', 'picture'])

/**
 * Selectors used to pick semantic blocks per `bugfix.md` § 1.2
 * "section/card/list-item/dialog body":
 *   - `section`, `article`, `aside`, `dialog`.
 *   - `li` (list-item).
 *   - `[role="dialog"]`, `[role="region"]`, `[role="listitem"]`
 *     for ARIA-styled equivalents.
 *   - `[data-semantic-block]` opt-in for primitives that prefer
 *     to mark their root explicitly.
 *
 * `<main>` is intentionally NOT a semantic block here — it is the
 * page container, and lumping its children together would make
 * heading-vs-body comparison meaningless. Each block under main
 * is evaluated independently.
 */
const SEMANTIC_BLOCK_SELECTORS = [
    'section',
    'article',
    'aside',
    'dialog',
    'li',
    '[role="dialog"]',
    '[role="region"]',
    '[role="listitem"]',
    '[data-semantic-block]',
]

// =============================================================================
// SECTION 3 — Public detector.
// =============================================================================

/**
 * Detector for defect class 1.2. Returns the findings for the
 * single audit context — the entry point in task 3.14 calls this
 * once per pinned-mobile audit run.
 */
export const detectTypographyHierarchy: Detector = (ctx) => {
    const findings: Finding[] = []

    const blocks = collectSemanticBlocks(ctx.renderedDom)
    for (const block of blocks) {
        const route = resolveRouteForNode(block) ?? ctx.route
        const nodes = collectTextNodesForBlock(block, ctx.computedStyles)
        if (nodes.length === 0) continue

        // ---- (a) Adjacent-rank collapse (condition 1.2 a) ------------------
        for (const finding of detectAdjacentRankCollapse(nodes, block, route)) {
            const v = validateFinding(finding)
            if (v.valid) findings.push(finding)
        }

        // ---- (b) > 3 distinct combos (condition 1.2 b) ---------------------
        const combosFinding = detectExcessCombos(nodes, block, route)
        if (combosFinding) {
            const v = validateFinding(combosFinding)
            if (v.valid) findings.push(combosFinding)
        }

        // ---- (c) Heading off-token / shares body token (condition 1.2 c) ---
        for (const finding of detectHeadingTokenViolations(nodes, block, route)) {
            const v = validateFinding(finding)
            if (v.valid) findings.push(finding)
        }
    }

    return findings
}

export default detectTypographyHierarchy

// =============================================================================
// SECTION 4 — DOM walking.
// =============================================================================

/**
 * Collect every semantic block under each `(learn)/**` route. The
 * detector accepts the same two route-marker conventions as
 * `spacing-baseline.ts`:
 *   1. `[data-route^="(learn)/"]` on a wrapping element.
 *   2. The harness's `<body data-audit-route="...">` fallback.
 */
function collectSemanticBlocks(doc: Document): HTMLElement[] {
    const result: HTMLElement[] = []
    const learnRoots = Array.from(
        doc.querySelectorAll<HTMLElement>('[data-route^="(learn)/"]'),
    )
    const roots: HTMLElement[] =
        learnRoots.length > 0
            ? learnRoots
            : [doc.body ?? doc.documentElement].filter(
                  (n): n is HTMLElement => n !== null,
              )

    const seen = new Set<HTMLElement>()
    for (const root of roots) {
        // Include the root itself when it is a semantic block.
        if (matchesSemanticBlock(root) && !seen.has(root)) {
            seen.add(root)
            result.push(root)
        }
        const matches = root.querySelectorAll<HTMLElement>(
            SEMANTIC_BLOCK_SELECTORS.join(','),
        )
        for (const el of Array.from(matches)) {
            if (seen.has(el)) continue
            seen.add(el)
            result.push(el)
        }
    }
    return result
}

function matchesSemanticBlock(el: HTMLElement): boolean {
    const tag = el.tagName.toLowerCase()
    if (tag === 'section' || tag === 'article' || tag === 'aside' || tag === 'dialog' || tag === 'li') {
        return true
    }
    const role = el.getAttribute('role')
    if (role === 'dialog' || role === 'region' || role === 'listitem') return true
    if (el.hasAttribute('data-semantic-block')) return true
    return false
}

interface ClassifiedTextNode {
    readonly node: HTMLElement
    readonly rank: SemanticRank
    readonly fontSizePx: number
    readonly fontWeight: number
    /** Token name when the size matches a `--text-*-size`; null otherwise. */
    readonly tokenName: string | null
}

/**
 * Walk a semantic block and classify each text-bearing element
 * into one of {heading, body, caption}, dropping inline emphasis
 * and icon/badge per `bugfix.md` § 1.2 condition (b). Nested
 * semantic blocks are skipped — those are processed in their own
 * iteration of `detectTypographyHierarchy` so nested blocks do not
 * leak ranks into the parent's count.
 */
function collectTextNodesForBlock(
    block: HTMLElement,
    computedStyles: (el: Element, pseudoElt?: string | null) => CSSStyleDeclaration,
): ClassifiedTextNode[] {
    const result: ClassifiedTextNode[] = []
    const allDescendants = block.querySelectorAll<HTMLElement>('*')

    for (const el of Array.from(allDescendants)) {
        // Skip text inside a NESTED semantic block — that block has
        // its own scope and will be evaluated separately.
        if (el !== block && isInsideOtherSemanticBlock(el, block)) continue

        if (isExcludedFromCount(el)) continue

        const rank = classifyRank(el)
        if (!rank) continue

        // Empty containers (no text content of their own) are not
        // ranks. We only count nodes that contribute meaningful
        // text. `textContent` includes descendants' text too, so
        // we also require a direct text child to avoid flagging
        // wrapper <div>s.
        if (!hasOwnTextContent(el)) continue

        const computed = computedStyles(el)
        const fontSizePx = readFontSizePx(el, computed)
        if (fontSizePx === null) continue
        const fontWeight = readFontWeight(el, computed)
        const tokenName = matchTokenName(fontSizePx)
        result.push({ node: el, rank, fontSizePx, fontWeight, tokenName })
    }
    return result
}

function isInsideOtherSemanticBlock(
    el: HTMLElement,
    block: HTMLElement,
): boolean {
    let cursor: HTMLElement | null = el.parentElement
    while (cursor && cursor !== block) {
        if (matchesSemanticBlock(cursor)) return true
        cursor = cursor.parentElement
    }
    return false
}

function isExcludedFromCount(el: HTMLElement): boolean {
    const tag = el.tagName.toLowerCase()
    if (INLINE_EMPHASIS_TAGS.has(tag)) return true
    if (ICON_BADGE_TAGS.has(tag)) return true
    const role = el.getAttribute('role')
    if (role === 'img' || role === 'presentation') return true
    const dataRole = el.getAttribute('data-role')
    if (dataRole === 'icon' || dataRole === 'badge') return true
    if (el.hasAttribute('data-icon')) return true
    if (el.hasAttribute('data-badge')) return true
    // Tailwind-style class hooks frequently used for icon / badge:
    const className = el.getAttribute('class') ?? ''
    if (/(^|\s)(icon|badge)(\s|$|-)/.test(className)) return true
    return false
}

function classifyRank(el: HTMLElement): SemanticRank | null {
    const tag = el.tagName.toLowerCase()
    if (HEADING_TAGS.has(tag)) return 'heading'
    if (el.getAttribute('role') === 'heading') return 'heading'
    if (CAPTION_TAGS.has(tag)) return 'caption'
    const dataRank = el.getAttribute('data-rank')
    if (dataRank === 'heading') return 'heading'
    if (dataRank === 'caption') return 'caption'
    if (dataRank === 'body') return 'body'
    if (BODY_TAGS.has(tag)) return 'body'
    return null
}

/**
 * Returns true when the element has a non-whitespace text node as
 * a direct child. Pure container nodes (`<div><p>...</p></div>`)
 * return false, so the wrapper `<div>` does not get classified
 * twice (once for itself, once via the inner `<p>`).
 */
function hasOwnTextContent(el: HTMLElement): boolean {
    for (const child of Array.from(el.childNodes)) {
        if (child.nodeType === 3 /* TEXT_NODE */) {
            const text = (child.nodeValue ?? '').replace(/\s+/g, '')
            if (text.length > 0) return true
        }
    }
    return false
}

// =============================================================================
// SECTION 5 — Computed-style helpers.
// =============================================================================

/**
 * Read font-size in px. Prefers inline `style="font-size:..."` for
 * jsdom-rendered fixtures where `getComputedStyle` returns the
 * empty string for unstyled elements. Falls back to the computed
 * value (parsed as px / rem / em). Returns null when the value
 * cannot be resolved.
 */
function readFontSizePx(
    el: HTMLElement,
    computed: CSSStyleDeclaration,
): number | null {
    const inline = parseFontSize(el.style.fontSize)
    if (inline !== null) return roundTo(inline, 100)
    const fromComputed = parseFontSize(computed.fontSize)
    if (fromComputed !== null) return roundTo(fromComputed, 100)
    return null
}

function parseFontSize(raw: string | undefined | null): number | null {
    if (typeof raw !== 'string' || raw.length === 0) return null
    const trimmed = raw.trim()
    const numeric = Number.parseFloat(trimmed)
    if (!Number.isFinite(numeric)) return null
    if (trimmed.endsWith('px')) return numeric
    if (trimmed.endsWith('rem')) return numeric * ROOT_FONT_SIZE_PX
    if (trimmed.endsWith('em')) return numeric * ROOT_FONT_SIZE_PX
    if (trimmed.endsWith('%')) return (numeric / 100) * ROOT_FONT_SIZE_PX
    return null
}

/**
 * Read font-weight as a numeric value. Inline `style="font-weight:600"`
 * wins; computed value is the fallback. `<b>` / `<strong>` are
 * filtered out of the count entirely (they are inline emphasis),
 * so we don't synthesise a weight from them. Default is 400.
 */
function readFontWeight(
    el: HTMLElement,
    computed: CSSStyleDeclaration,
): number {
    const inline = parseFontWeight(el.style.fontWeight)
    if (inline !== null) return inline
    const fromComputed = parseFontWeight(computed.fontWeight)
    if (fromComputed !== null) return fromComputed
    return DEFAULT_FONT_WEIGHT
}

function parseFontWeight(raw: string | undefined | null): number | null {
    if (typeof raw !== 'string' || raw.length === 0) return null
    const trimmed = raw.trim().toLowerCase()
    if (trimmed === 'normal') return 400
    if (trimmed === 'bold') return 700
    if (trimmed === 'lighter') return 300
    if (trimmed === 'bolder') return 700
    const numeric = Number.parseFloat(trimmed)
    if (!Number.isFinite(numeric)) return null
    return numeric
}

function roundTo(value: number, factor: number): number {
    return Math.round(value * factor) / factor
}

/**
 * Match a px value to a `--text-*-size` token name within the
 * `TOKEN_PX_TOLERANCE` band. Returns the token name on hit,
 * `null` on miss.
 */
function matchTokenName(px: number): string | null {
    let bestToken: string | null = null
    let bestDelta = Number.POSITIVE_INFINITY
    for (const entry of TEXT_SIZE_TOKEN_PX) {
        const delta = Math.abs(entry.px - px)
        if (delta <= TOKEN_PX_TOLERANCE && delta < bestDelta) {
            bestToken = entry.token
            bestDelta = delta
        }
    }
    return bestToken
}

// =============================================================================
// SECTION 6 — Detection: (a) adjacent-rank collapse.
// =============================================================================

/**
 * Detect violations of `bugfix.md` § 1.2 condition (a) inside a
 * single semantic block. Compares every (heading, body) and (body,
 * caption) pair. Emits at most one finding per offending pair so
 * one collapsed block does not produce a flood of duplicates.
 */
function detectAdjacentRankCollapse(
    nodes: ReadonlyArray<ClassifiedTextNode>,
    block: HTMLElement,
    route: string,
): Finding[] {
    const findings: Finding[] = []

    const headings = nodes.filter((n) => n.rank === 'heading')
    const bodies = nodes.filter((n) => n.rank === 'body')
    const captions = nodes.filter((n) => n.rank === 'caption')

    for (const heading of headings) {
        for (const body of bodies) {
            const pair = checkPair(heading, body)
            if (pair.collapsed) {
                findings.push(
                    buildAdjacentRankFinding({
                        block,
                        route,
                        higher: heading,
                        lower: body,
                        rankPair: 'heading↔body',
                    }),
                )
            }
        }
    }
    for (const body of bodies) {
        for (const caption of captions) {
            const pair = checkPair(body, caption)
            if (pair.collapsed) {
                findings.push(
                    buildAdjacentRankFinding({
                        block,
                        route,
                        higher: body,
                        lower: caption,
                        rankPair: 'body↔caption',
                    }),
                )
            }
        }
    }
    return findings
}

function checkPair(
    higher: ClassifiedTextNode,
    lower: ClassifiedTextNode,
): { collapsed: boolean } {
    const sizeRatio =
        higher.fontSizePx >= lower.fontSizePx
            ? higher.fontSizePx / Math.max(lower.fontSizePx, 0.0001)
            : lower.fontSizePx / Math.max(higher.fontSizePx, 0.0001)
    const weightDelta = Math.abs(higher.fontWeight - lower.fontWeight)
    const collapsed =
        sizeRatio < FONT_SIZE_RATIO_MIN && weightDelta < FONT_WEIGHT_DELTA_MIN
    return { collapsed }
}

function buildAdjacentRankFinding(args: {
    block: HTMLElement
    route: string
    higher: ClassifiedTextNode
    lower: ClassifiedTextNode
    rankPair: 'heading↔body' | 'body↔caption'
}): Finding {
    const { block, route, higher, lower, rankPair } = args
    const isHeadingVsBody = rankPair === 'heading↔body'
    const isBodyVsCaption = rankPair === 'body↔caption'
    const isPrimary = isPrimaryTaskSurface(route)
    const isSecondary = isSecondaryBlock(block)

    // § 2.10 row 1.2 P2: violation confined to a secondary block
    // (footer, meta) downgrades to P2 regardless of rank pair. We
    // express that by suppressing the `isHeadingVsBody` /
    // `is1_2_BodyVsCaption` qualifiers in the secondary case so the
    // mapping table reaches the secondary-only P2 branch first.
    const qualifiers: SeverityQualifiers = {
        isPrimaryTaskSurface: isPrimary,
        isHeadingVsBody: !isSecondary && isHeadingVsBody && isPrimary,
        is1_2_BodyVsCaption: !isSecondary && isBodyVsCaption,
        is1_2_SecondaryBlockOnly: isSecondary,
    }

    const component = describeComponent(higher.node)
    const expectedTokenSet = TEXT_SIZE_TOKEN_PX.map((t) => t.token).join(', ')

    return {
        defectClass: '1.2',
        severity: assignSeverity('1.2', qualifiers),
        route,
        component,
        evidence: {
            fontSize: `${higher.fontSizePx}px / ${lower.fontSizePx}px`,
            fontWeight: `${higher.fontWeight} / ${lower.fontWeight}`,
            expectedTokenSet,
            // Diagnostic sub-fields:
            kind: 'adjacent-rank-collapse',
            rankPair,
            higher: {
                rank: higher.rank,
                fontSizePx: higher.fontSizePx,
                fontWeight: higher.fontWeight,
                tokenName: higher.tokenName,
                selector: describeComponent(higher.node),
            },
            lower: {
                rank: lower.rank,
                fontSizePx: lower.fontSizePx,
                fontWeight: lower.fontWeight,
                tokenName: lower.tokenName,
                selector: describeComponent(lower.node),
            },
            blockSelector: describeComponent(block),
            bugConditions: ['1.2 condition a'],
        },
        expected:
            'adjacent semantic ranks SHALL differ by font-size ratio ≥ 1.125x OR font-weight ≥ 200 (bugfix.md § 2.2 ii)',
        screenshotPath: buildScreenshotPath(route, component, 'adjacent-rank'),
        forwardTo: null,
        action: 'fix',
    }
}

// =============================================================================
// SECTION 7 — Detection: (b) > 3 distinct combos per block.
// =============================================================================

function detectExcessCombos(
    nodes: ReadonlyArray<ClassifiedTextNode>,
    block: HTMLElement,
    route: string,
): Finding | null {
    const combos = new Set<string>()
    for (const n of nodes) {
        combos.add(`${n.fontSizePx}|${n.fontWeight}`)
    }
    if (combos.size <= MAX_DISTINCT_COMBOS_PER_BLOCK) return null

    const isPrimary = isPrimaryTaskSurface(route)
    const isSecondary = isSecondaryBlock(block)

    const qualifiers: SeverityQualifiers = {
        isPrimaryTaskSurface: isPrimary,
        is1_2_SecondaryBlockOnly: isSecondary,
    }

    const expectedTokenSet = TEXT_SIZE_TOKEN_PX.map((t) => t.token).join(', ')
    const component = describeComponent(block)

    return {
        defectClass: '1.2',
        severity: assignSeverity('1.2', qualifiers),
        route,
        component,
        evidence: {
            fontSize: nodes.map((n) => `${n.fontSizePx}px`).join(', '),
            fontWeight: nodes.map((n) => String(n.fontWeight)).join(', '),
            expectedTokenSet,
            // Diagnostic sub-fields:
            kind: 'excess-combos',
            distinctCombosCount: combos.size,
            maxAllowed: MAX_DISTINCT_COMBOS_PER_BLOCK,
            distinctCombos: Array.from(combos),
            blockSelector: component,
            bugConditions: ['1.2 condition b'],
        },
        expected:
            'a semantic block SHALL contain ≤ 3 distinct (font-size, font-weight) combos excluding inline emphasis (bugfix.md § 2.2 iii)',
        screenshotPath: buildScreenshotPath(route, component, 'excess-combos'),
        forwardTo: null,
        action: 'fix',
    }
}

// =============================================================================
// SECTION 8 — Detection: (c) heading off-token / shares body token.
// =============================================================================

function detectHeadingTokenViolations(
    nodes: ReadonlyArray<ClassifiedTextNode>,
    block: HTMLElement,
    route: string,
): Finding[] {
    const findings: Finding[] = []

    const headings = nodes.filter((n) => n.rank === 'heading')
    if (headings.length === 0) return findings

    const bodies = nodes.filter((n) => n.rank === 'body')
    const bodyTokens = new Set(
        bodies.map((b) => b.tokenName).filter((t): t is string => !!t),
    )
    const expectedTokenSet = TEXT_SIZE_TOKEN_PX.map((t) => t.token).join(', ')

    const isPrimary = isPrimaryTaskSurface(route)
    const isSecondary = isSecondaryBlock(block)

    for (const heading of headings) {
        const offToken = heading.tokenName === null
        const sharesBodyToken =
            heading.tokenName !== null && bodyTokens.has(heading.tokenName)
        if (!offToken && !sharesBodyToken) continue

        // The "shares-body-token" case overlaps with adjacent-rank
        // collapse (a). Only emit (c) when (a) would NOT — i.e.
        // when the heading is heavier or sized differently enough
        // that (a) does not flag, but the heading nevertheless
        // shares the body's exact token. Without this guard we
        // would double-count the "heading 16px / body 16px" trap.
        if (sharesBodyToken && bodies.some((b) => checkPair(heading, b).collapsed)) {
            continue
        }

        const qualifiers: SeverityQualifiers = {
            isPrimaryTaskSurface: isPrimary,
            isHeadingVsBody: false,
            is1_2_SecondaryBlockOnly: isSecondary,
        }

        findings.push({
            defectClass: '1.2',
            severity: assignSeverity('1.2', qualifiers),
            route,
            component: describeComponent(heading.node),
            evidence: {
                fontSize: `${heading.fontSizePx}px`,
                fontWeight: String(heading.fontWeight),
                expectedTokenSet,
                // Diagnostic sub-fields:
                kind: offToken ? 'heading-off-token' : 'heading-shares-body-token',
                tokenName: heading.tokenName,
                offToken,
                sharesBodyToken,
                bodyTokens: Array.from(bodyTokens),
                blockSelector: describeComponent(block),
                bugConditions: ['1.2 condition c'],
            },
            expected:
                'a heading SHALL use a font-size from the --text-*-size token set AND a different token from the body of its block (bugfix.md § 2.2 i, § 1.2 c)',
            screenshotPath: buildScreenshotPath(
                route,
                describeComponent(heading.node),
                'heading-token',
            ),
            forwardTo: null,
            action: 'fix',
        })
    }
    return findings
}

// =============================================================================
// SECTION 9 — Surface helpers (mirrors spacing-baseline.ts).
// =============================================================================

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
    for (const prefix of PRIMARY_TASK_SURFACE_PREFIXES) {
        if (route.includes(prefix)) return true
    }
    return false
}

/**
 * `bugfix.md` § 2.10 row 1.2 P2: violations confined to a
 * "secondary block (footer, meta)" downgrade to P2. We recognise
 * blocks marked semantically (`<footer>`-derived, `aside` tagged
 * meta) or by explicit `data-block-role`.
 */
function isSecondaryBlock(block: HTMLElement): boolean {
    const tag = block.tagName.toLowerCase()
    if (tag === 'footer') return true
    const role = block.getAttribute('role')
    if (role === 'contentinfo') return true
    const blockRole = block.getAttribute('data-block-role')
    if (blockRole === 'secondary' || blockRole === 'footer' || blockRole === 'meta') {
        return true
    }
    // Ancestor footer wrapping the block also marks it secondary.
    let cursor: HTMLElement | null = block.parentElement
    while (cursor) {
        if (cursor.tagName.toLowerCase() === 'footer') return true
        if (cursor.getAttribute('role') === 'contentinfo') return true
        cursor = cursor.parentElement
    }
    return false
}

function resolveRouteForNode(node: HTMLElement): string | null {
    let cursor: HTMLElement | null = node
    while (cursor) {
        const route = cursor.getAttribute('data-route')
        if (route && route.startsWith('(learn)/')) return route
        cursor = cursor.parentElement
    }
    return null
}

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

function buildScreenshotPath(
    route: string,
    component: string,
    suffix: string,
): string {
    const safeRoute = route
        .replace(/[^a-z0-9_-]+/gi, '_')
        .replace(/^_+|_+$/g, '')
    const safeComponent = component
        .replace(/[^a-z0-9_-]+/gi, '_')
        .replace(/^_+|_+$/g, '')
    return `audit-reports/ui-ux/screens/1.2/${safeRoute}__${safeComponent}__${suffix}.png`
}
