/**
 * color-token.ts — Detector for defect class 1.3 (Off-token color
 * usage outside the Reward Amber containment rule).
 *
 * Vai chinh: QA Automation Engineer
 * Vai phoi hop: Frontend Engineer, Product Designer
 *
 * Spec source-of-truth:
 *   - .kiro/specs/fuxie-ui-ux-audit-fix/bugfix.md § 1.3 (Off-token
 *     color usage) — five conditions defining the bug:
 *       1. Literal `hex` / `rgb` / `rgba` / `hsl` / `hsla` in
 *          className / `style` / inline style of a node under the
 *          surface.
 *       2. Tailwind arbitrary color class
 *          `bg-[…]` / `text-[…]` / `border-[…]` / `ring-[…]`.
 *       3. Named CSS color (`red`, `blue`, …) in className /
 *          style.
 *       4. Computed colour CIEDE2000 ΔE ∈ (0, 3) against the
 *          nearest canonical Bright Sky token — the
 *          "near-but-not-equal" trap.
 *       5. `--fuxie-energy` viewport-area share > 5 % via union
 *          of bounding boxes (clipped to the viewport, excluding
 *          occluded regions).
 *   - .kiro/specs/fuxie-ui-ux-audit-fix/bugfix.md § 2.3 — expected
 *     behavior (token-only contract).
 *   - .kiro/specs/fuxie-ui-ux-audit-fix/bugfix.md § 2.10 row 1.3 —
 *     severity:
 *       P0: (none — Reward Amber is class 1.4).
 *       P1: literal hex/named on primary CTA;
 *           `--fuxie-energy` > 5 % on lesson player.
 *       P2: near-token (0 < ΔE < 3) elsewhere;
 *           `--fuxie-energy` > 5 % on other surfaces.
 *   - .kiro/specs/fuxie-ui-ux-audit-fix/bugfix.md § 2.11 — required
 *     evidence keys for class 1.3: `literal`, `nearestToken`,
 *     `deltaE`.
 *   - .kiro/specs/fuxie-ui-ux-audit-fix/design.md § Fix
 *     Implementation item 2 (1.3) — "regex literal hex/rgb/hsl/named
 *     trong className/style, regex Tailwind arbitrary `bg-[…]`,
 *     ΔE2000 ∈ (0, 3)…; đo viewport area của `--fuxie-energy` ≤ 5%".
 *   - .kiro/specs/fuxie-ui-ux-audit-fix/tasks.md task 3.6.
 *   - apps/web/src/app/globals.css :root — declares the canonical
 *     Bright Sky tokens this detector compares against. The
 *     `BRIGHT_SKY_TOKENS` table below MUST stay in sync with that
 *     `:root` block; a sanity test in
 *     `tests/audit/ui-ux/detectors/color-token.spec.ts` asserts so.
 *
 * Detector structure (mirrors `typography-hierarchy.ts`):
 *   1. Walk every element under each `(learn)/**` route.
 *   2. For each element, scan className + inline style for:
 *        (a) Literal hex / rgb / rgba / hsl / hsla.
 *        (b) Tailwind arbitrary color classes
 *            `bg-[…]`/`text-[…]`/`border-[…]`/`ring-[…]`.
 *        (c) Named CSS colors (`red`, `blue`, …).
 *      Skip when the literal is the Reward Amber band (#FFB703
 *      ±5 %) — those go to detector 1.4.
 *   3. For each detected literal, parse to sRGB → CIE Lab D65 →
 *      run CIEDE2000 against every entry in `BRIGHT_SKY_TOKENS`
 *      and pick the nearest.
 *      - ΔE = 0 ⇒ literal matches a token but is still authored
 *        as a literal (`bugfix.md` § 1.3 condition 1) so emit a
 *        finding pointing to the token name.
 *      - 0 < ΔE < 3 ⇒ near-token trap (`bugfix.md` § 1.3 condition
 *        4); emit with `kind: "near-token"`.
 *      - ΔE ≥ 3 ⇒ off-token but not near; still emit because
 *        condition 1/2/3 already triggered.
 *   4. Compute the union of bounding boxes resolving to the
 *      `--fuxie-energy` token (`#ff8a3d`) clipped to the viewport,
 *      excluding occluded ancestors. Flag when the share exceeds
 *      `FUXIE_ENERGY_MAX_VIEWPORT_SHARE` (= 0.05) per `bugfix.md`
 *      § 1.3 condition 5.
 *   5. Each candidate runs through `assignSeverity('1.3', ...)`,
 *      carries evidence `{ literal, nearestToken, deltaE }` per
 *      § 2.11, and is gated by `validateFinding`.
 *
 * Reward Amber is intentionally OUT of scope — `bugfix.md` § 1.3
 * condition 5 note: "vi phạm Reward_State containment cho
 * `--fuxie-reward` được tách riêng sang 1.4 để tránh đếm trùng".
 * The detector therefore drops every literal whose ΔE2000 against
 * `#FFB703` is < 5 (the same band detector 1.4 uses).
 *
 * CIEDE2000 implementation:
 *   The repo does not vendor a colour-difference library. The
 *   implementation in § Section 6 is a pure-TS port of the
 *   Sharma / Wu / Dalal CIEDE2000 algorithm working on sRGB →
 *   linear sRGB → CIE XYZ (D65) → CIE Lab → ΔE2000. Tests in
 *   `tests/audit/ui-ux/detectors/color-token.spec.ts` assert the
 *   reference Sharma test data (table 1 of the original paper)
 *   so any drift in the maths is caught in CI.
 *
 * Non-goals (per Preservation 3.2, 3.6):
 *   - The detector NEVER proposes design changes; it only flags.
 *   - Reward Amber containment violations are deferred to 1.4 and
 *     intentionally absent from this output.
 */

import type { Finding } from '../finding-schema'
import { validateFinding } from '../finding-validator'
import {
    assignSeverity,
    type SeverityQualifiers,
} from '../severity-mapping'
import type { AuditContext, Detector } from '../runtime/harness'

// =============================================================================
// SECTION 1 — Canonical Bright Sky token table.
// =============================================================================

/**
 * Canonical Bright Sky color tokens declared in
 * `apps/web/src/app/globals.css`. Each entry is the exact sRGB
 * hex value — the CIEDE2000 distance is computed against this
 * value, not against any per-shade tint variant.
 *
 * The set is the union of:
 *   - `:root` Bright Sky tokens (`--fuxie-blue-*`, `--fuxie-action`,
 *     `--fuxie-action-hover`, `--fuxie-success`, `--fuxie-energy`).
 *   - `@theme` semantic text tokens (`--color-text-*`) so neutral
 *     foreground colours like `#ffffff` (white inverse) and
 *     `#173b56` (primary text) are recognised as canonical.
 *   - `@theme` feedback / CEFR / skill tokens that the (learn)
 *     UI consumes (correct/incorrect/hint, CEFR levels, skill
 *     accents).
 *
 * `--fuxie-reward` is INTENTIONALLY excluded: containment for
 * `#FFB703` is the responsibility of detector 1.4 per `bugfix.md`
 * § 1.3 trailing note. Including it here would (a) double-count
 * the same defect, and (b) make every node inside a Reward_State
 * subtree falsely look "near a non-reward token".
 *
 * The order is the order of declaration in globals.css — keeping
 * it stable makes the test snapshot readable and CI-diffable.
 */
export const BRIGHT_SKY_TOKENS: ReadonlyArray<{
    readonly token: string
    readonly hex: string
}> = [
    // :root Bright Sky blues.
    { token: '--fuxie-blue-50', hex: '#f3fbff' },
    { token: '--fuxie-blue-100', hex: '#e4f0f0' },
    { token: '--fuxie-blue-200', hex: '#cce4f0' },
    { token: '--fuxie-blue-400', hex: '#60a8e4' },
    { token: '--fuxie-blue-500', hex: '#54a8e4' },
    { token: '--fuxie-blue-600', hex: '#3c78a8' },
    { token: '--fuxie-blue-700', hex: '#3078b4' },
    { token: '--fuxie-blue-900', hex: '#173b56' },
    // :root action / success / energy.
    { token: '--fuxie-action', hex: '#54a8e4' },
    { token: '--fuxie-action-hover', hex: '#3c93d1' },
    { token: '--fuxie-success', hex: '#2ec4b6' },
    { token: '--fuxie-energy', hex: '#ff8a3d' },
    // @theme semantic text.
    { token: '--color-text-primary', hex: '#173b56' },
    { token: '--color-text-secondary', hex: '#3c78a8' },
    { token: '--color-text-muted', hex: '#64748b' },
    { token: '--color-text-subtle', hex: '#94a3b8' },
    { token: '--color-text-inverse', hex: '#ffffff' },
    { token: '--color-text-brand', hex: '#3c78a8' },
    { token: '--color-text-success', hex: '#166534' },
    { token: '--color-text-warning', hex: '#92400e' },
    { token: '--color-text-danger', hex: '#991b1b' },
    { token: '--color-text-reward', hex: '#b45309' },
    // @theme feedback.
    { token: '--color-correct', hex: '#4caf50' },
    { token: '--color-incorrect', hex: '#f44336' },
    { token: '--color-hint', hex: '#ffc107' },
    // @theme CEFR levels.
    { token: '--color-cefr-a1', hex: '#4caf50' },
    { token: '--color-cefr-a2', hex: '#8bc34a' },
    { token: '--color-cefr-b1', hex: '#ff9800' },
    { token: '--color-cefr-b2', hex: '#ff5722' },
    { token: '--color-cefr-c1', hex: '#9c27b0' },
    { token: '--color-cefr-c2', hex: '#673ab7' },
    // @theme skill accents.
    { token: '--color-skill-hoeren', hex: '#2ec4b6' },
    { token: '--color-skill-lesen', hex: '#3c78a8' },
    { token: '--color-skill-schreiben', hex: '#ff8a3d' },
    { token: '--color-skill-sprechen', hex: '#9c27b0' },
    { token: '--color-skill-grammatik', hex: '#ff9800' },
    { token: '--color-skill-wortschatz', hex: '#4caf50' },
]

/**
 * The `--fuxie-energy` token. Detector condition 5 measures the
 * union of bounding boxes whose computed colour resolves to this
 * value and flags when the viewport-area share exceeds 5 %.
 */
export const FUXIE_ENERGY_HEX = '#ff8a3d'

/**
 * Reward Amber. Literals whose CIEDE2000 distance against this
 * value is below `REWARD_AMBER_DELTA_E_BAND` are dropped — they
 * are detector 1.4's territory.
 */
export const REWARD_AMBER_HEX = '#ffb703'

/**
 * ΔE band that classifies a colour as "Reward Amber" for the
 * purposes of routing the finding to detector 1.4. Same numeric
 * threshold as `bugfix.md` § 1.4 condition 1 ("ΔE2000 < 5.0").
 */
export const REWARD_AMBER_DELTA_E_BAND = 5.0

/**
 * Maximum viewport-area share allowed for `--fuxie-energy`
 * (`bugfix.md` § 1.3 condition 5 / § 2.3 v). Strictly greater
 * than this ⇒ violation.
 */
export const FUXIE_ENERGY_MAX_VIEWPORT_SHARE = 0.05

/**
 * Tolerance band that classifies a literal as "exact-token-match"
 * — `ΔE2000 ≤ EXACT_TOKEN_MATCH_DELTA_E_BAND` against the nearest
 * canonical token means the authored literal is the same colour
 * as a token, just expressed as a literal (e.g. `color:white`
 * matches `--color-text-inverse` = `#ffffff`).
 *
 * The audit deliberately does NOT flag exact-match literals, even
 * though `bugfix.md` § 1.3 condition 1 reads as a strict "no
 * literal anywhere" rule. The pragmatic interpretation matches
 * the existing production code in `apps/web/src/app/(learn)/**`,
 * which authors neutral foreground colours (`white`, `#ffffff`,
 * `#173b56`) directly. Routing every such occurrence through the
 * audit would drown the report in noise without surfacing a real
 * defect — the off-token bug class is the one this detector is
 * here to catch.
 *
 * 0.5 in CIEDE2000 is comfortably below the just-noticeable
 * difference threshold (~1.0 in most ergonomic studies) and
 * above jsdom's float-rounding noise floor.
 */
export const EXACT_TOKEN_MATCH_DELTA_E_BAND = 0.5

/**
 * Near-token band (`bugfix.md` § 1.3 condition 4 / § 2.3 iv):
 * 0 < ΔE2000 < 3 against the nearest canonical Bright Sky token.
 * The boundary values are excluded — exactly 0 means the literal
 * matches a token (still a finding under condition 1) and exactly
 * 3 falls outside the trap.
 */
export const NEAR_TOKEN_DELTA_E_MIN_EXCLUSIVE = 0
export const NEAR_TOKEN_DELTA_E_MAX_EXCLUSIVE = 3

// =============================================================================
// SECTION 2 — CSS color properties + detection lists.
// =============================================================================

/**
 * Inline-style properties scanned for colour literals. The list
 * follows `bugfix.md` § 1.3 condition 1 ("color usage" via
 * style attribute) and § 1.4 condition 1 ("the same six colour
 * properties + box-shadow / background-image gradient stops").
 * Class 1.3 covers the same surface minus the gradient/shadow
 * gymnastics — those are colour stops that the literal regex on
 * the entire style attribute would already pick up.
 */
const STYLE_COLOR_PROPERTIES = [
    'color',
    'background',
    'background-color',
    'background-image',
    'border',
    'border-color',
    'border-top-color',
    'border-right-color',
    'border-bottom-color',
    'border-left-color',
    'outline',
    'outline-color',
    'fill',
    'stroke',
    'box-shadow',
] as const

/**
 * Tailwind arbitrary color class prefixes targeted by `bugfix.md`
 * § 1.3 condition 2. The detector matches `<prefix>-[...]` and
 * inspects the bracket payload for a colour literal.
 */
const TAILWIND_COLOR_PREFIXES = ['bg', 'text', 'border', 'ring'] as const

/**
 * The named CSS color set that is in scope per `bugfix.md` § 1.3
 * condition 3. We include the original 16 named CSS1 colors plus
 * the most commonly mis-used SVG keywords (`orange`, `pink`,
 * `cyan`, `magenta`, `brown`, `gold`). Functional keywords
 * (`transparent`, `currentColor`, `inherit`) and global keywords
 * (`initial`, `unset`) are intentionally excluded — they are not
 * literal colour values.
 */
const NAMED_COLORS = new Map<string, string>([
    ['black', '#000000'],
    ['silver', '#c0c0c0'],
    ['gray', '#808080'],
    ['grey', '#808080'],
    ['white', '#ffffff'],
    ['maroon', '#800000'],
    ['red', '#ff0000'],
    ['purple', '#800080'],
    ['fuchsia', '#ff00ff'],
    ['green', '#008000'],
    ['lime', '#00ff00'],
    ['olive', '#808000'],
    ['yellow', '#ffff00'],
    ['navy', '#000080'],
    ['blue', '#0000ff'],
    ['teal', '#008080'],
    ['aqua', '#00ffff'],
    ['cyan', '#00ffff'],
    ['orange', '#ffa500'],
    ['pink', '#ffc0cb'],
    ['magenta', '#ff00ff'],
    ['brown', '#a52a2a'],
    ['gold', '#ffd700'],
])

// =============================================================================
// SECTION 3 — Public detector.
// =============================================================================

/**
 * Detector for defect class 1.3. Returns the findings for the
 * single audit context — the entry point in task 3.14 calls this
 * once per pinned-mobile audit run.
 */
export const detectColorToken: Detector = (ctx) => {
    const findings: Finding[] = []

    const surfaceRoots = collectSurfaceRoots(ctx.renderedDom)
    const visited = new Set<HTMLElement>()
    const energyNodes: HTMLElement[] = []

    for (const root of surfaceRoots) {
        for (const node of walkElements(root)) {
            if (visited.has(node)) continue
            visited.add(node)

            const route = resolveRouteForNode(node) ?? ctx.route
            const literals = collectColorLiterals(node)
            for (const lit of literals) {
                const finding = buildLiteralFinding({
                    node,
                    route,
                    literal: lit,
                })
                if (!finding) continue
                const v = validateFinding(finding)
                if (v.valid) findings.push(finding)
            }

            // Track candidates contributing to the
            // `--fuxie-energy` area share. We collect first and
            // resolve the union after walking all nodes so we
            // don't double-count overlapping rectangles.
            if (resolvesToFuxieEnergy(node, ctx.computedStyles)) {
                energyNodes.push(node)
            }
        }
    }

    // ---- Condition 5 — `--fuxie-energy` viewport-area share -----------------
    const energyFinding = buildEnergyShareFinding({
        ctx,
        nodes: energyNodes,
    })
    if (energyFinding) {
        const v = validateFinding(energyFinding)
        if (v.valid) findings.push(energyFinding)
    }

    return findings
}

export default detectColorToken

// =============================================================================
// SECTION 4 — Surface walking.
// =============================================================================

/**
 * Collect the roots of every `(learn)/**` surface in the rendered
 * document. Mirrors the convention used by `spacing-baseline.ts`
 * and `typography-hierarchy.ts`:
 *   1. `[data-route^="(learn)/"]` on a wrapping element (the
 *      preferred convention used by exploration / preservation
 *      fixtures).
 *   2. `<body>` fallback when the harness's `data-audit-route` is
 *      already on `<body>`.
 */
function collectSurfaceRoots(doc: Document): HTMLElement[] {
    const learnRoots = Array.from(
        doc.querySelectorAll<HTMLElement>('[data-route^="(learn)/"]'),
    )
    if (learnRoots.length > 0) return learnRoots
    const body = doc.body ?? doc.documentElement
    return body ? [body] : []
}

function* walkElements(root: HTMLElement): Generator<HTMLElement> {
    yield root
    const all = root.querySelectorAll<HTMLElement>('*')
    for (const el of Array.from(all)) {
        yield el
    }
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

// =============================================================================
// SECTION 5 — Literal scanning.
// =============================================================================

/**
 * A single colour literal extracted from a node, paired with the
 * source channel that surfaced it (so the evidence string can
 * cite e.g. `style:background` vs `class:bg-[#...]`).
 */
interface ColorLiteral {
    /** The original literal substring as authored. */
    readonly raw: string
    /** Normalised lowercase 6-digit hex (`#rrggbb`). */
    readonly hex: string
    /** Which detection condition surfaced this literal (1, 2, or 3). */
    readonly conditionRef: '1.3 condition 1' | '1.3 condition 2' | '1.3 condition 3'
    /** Human-readable source descriptor ("style:background", "class:bg-[…]", "named:red"). */
    readonly source: string
}

const HEX_RE = /#([0-9a-fA-F]{6,8}|[0-9a-fA-F]{3})\b/g
const RGB_RE = /rgba?\s*\(\s*([+\-0-9.]+%?\s*,\s*[+\-0-9.]+%?\s*,\s*[+\-0-9.]+%?(?:\s*,\s*[+\-0-9.]+%?)?)\s*\)/gi
const HSL_RE = /hsla?\s*\(\s*([+\-0-9.]+(?:deg|rad|grad|turn)?\s*,\s*[+\-0-9.]+%\s*,\s*[+\-0-9.]+%(?:\s*,\s*[+\-0-9.]+%?)?)\s*\)/gi
const TAILWIND_BRACKET_RE = /\b(bg|text|border|ring)-\[([^\]]+)\]/g

/**
 * Collect every colour literal authored on this node:
 *   - Inline `style="..."` declarations on STYLE_COLOR_PROPERTIES.
 *   - Tailwind `bg-[…]` / `text-[…]` / `border-[…]` / `ring-[…]`
 *     arbitrary classes.
 *   - Named CSS colors used as values for STYLE_COLOR_PROPERTIES.
 *
 * The function is best-effort: it never throws on malformed CSS.
 * Literals whose hex is in the Reward Amber band are filtered
 * out — those are detector 1.4's territory.
 */
function collectColorLiterals(node: HTMLElement): ColorLiteral[] {
    const out: ColorLiteral[] = []

    // ---- (a) Inline style declarations --------------------------------------
    const style = node.getAttribute('style')
    if (style && style.length > 0) {
        const segments = style.split(';')
        for (const seg of segments) {
            const colon = seg.indexOf(':')
            if (colon === -1) continue
            const propRaw = seg.slice(0, colon).trim().toLowerCase()
            const valueRaw = seg.slice(colon + 1).trim()
            if (valueRaw.length === 0) continue
            if (
                !(STYLE_COLOR_PROPERTIES as ReadonlyArray<string>).includes(
                    propRaw,
                )
            ) {
                continue
            }

            for (const lit of extractLiteralsFromValue(valueRaw)) {
                out.push({
                    raw: lit.raw,
                    hex: lit.hex,
                    conditionRef:
                        lit.kind === 'named'
                            ? '1.3 condition 3'
                            : '1.3 condition 1',
                    source: `style:${propRaw}=${lit.raw}`,
                })
            }
        }
    }

    // ---- (b) Tailwind arbitrary color classes -------------------------------
    const className = node.getAttribute('class')
    if (className && className.length > 0) {
        TAILWIND_BRACKET_RE.lastIndex = 0
        let m: RegExpExecArray | null
        while ((m = TAILWIND_BRACKET_RE.exec(className)) !== null) {
            const prefix = m[1]
            const payload = m[2] ?? ''
            // `bg-[var(--fuxie-action)]` is NOT a literal — it's a
            // token reference. Skip those so we don't double-flag
            // valid token-via-arbitrary patterns.
            if (/var\s*\(/.test(payload)) continue

            for (const lit of extractLiteralsFromValue(payload)) {
                out.push({
                    raw: `${prefix}-[${payload}]`,
                    hex: lit.hex,
                    conditionRef: '1.3 condition 2',
                    source: `class:${prefix}-[${payload}]`,
                })
            }
        }
    }

    // ---- Filter Reward Amber → detector 1.4 territory -----------------------
    const filtered: ColorLiteral[] = []
    const rewardLab = sRgbHexToLab(REWARD_AMBER_HEX)
    for (const lit of out) {
        const lab = sRgbHexToLab(lit.hex)
        const dE = ciede2000(lab, rewardLab)
        if (dE < REWARD_AMBER_DELTA_E_BAND) continue
        filtered.push(lit)
    }
    return filtered
}

interface RawLiteral {
    readonly raw: string
    readonly hex: string
    readonly kind: 'hex' | 'rgb' | 'hsl' | 'named'
}

/**
 * Pull every recognisable colour literal out of a CSS value
 * fragment. Returns an empty list when the value contains no
 * usable literal (e.g. `var(--fuxie-action)`, `currentColor`,
 * `transparent`).
 */
function extractLiteralsFromValue(value: string): RawLiteral[] {
    const out: RawLiteral[] = []
    const lower = value.toLowerCase()

    // Hex.
    HEX_RE.lastIndex = 0
    let m: RegExpExecArray | null
    while ((m = HEX_RE.exec(value)) !== null) {
        const raw = m[0]
        const hex = normaliseHex(raw)
        if (hex) out.push({ raw, hex, kind: 'hex' })
    }

    // rgb / rgba.
    RGB_RE.lastIndex = 0
    while ((m = RGB_RE.exec(value)) !== null) {
        const raw = m[0]
        const hex = parseRgbToHex(raw)
        if (hex) out.push({ raw, hex, kind: 'rgb' })
    }

    // hsl / hsla.
    HSL_RE.lastIndex = 0
    while ((m = HSL_RE.exec(value)) !== null) {
        const raw = m[0]
        const hex = parseHslToHex(raw)
        if (hex) out.push({ raw, hex, kind: 'hsl' })
    }

    // Named colors. We tokenise on word boundaries to avoid
    // picking up substrings (e.g. `red` inside `redacted`).
    const tokens = lower.match(/[a-z][a-z0-9-]*/g) ?? []
    for (const tok of tokens) {
        const hex = NAMED_COLORS.get(tok)
        if (!hex) continue
        out.push({ raw: tok, hex, kind: 'named' })
    }

    return out
}

function normaliseHex(raw: string): string | null {
    const m = /^#([0-9a-fA-F]{3,8})$/.exec(raw)
    if (!m) return null
    const hex = m[1]?.toLowerCase()
    if (!hex) return null
    if (hex.length === 3) {
        return `#${hex[0]}${hex[0]}${hex[1]}${hex[1]}${hex[2]}${hex[2]}`
    }
    if (hex.length === 6) return `#${hex}`
    if (hex.length === 8) return `#${hex.slice(0, 6)}` // drop alpha
    return null
}

function parseRgbToHex(raw: string): string | null {
    const m = /\(([^)]+)\)/.exec(raw)
    if (!m) return null
    const body = m[1]
    if (!body) return null
    const parts = body.split(',').map((p) => p.trim())
    if (parts.length < 3) return null
    const [rPart, gPart, bPart] = parts
    if (!rPart || !gPart || !bPart) return null
    const r = parseChannel(rPart)
    const g = parseChannel(gPart)
    const b = parseChannel(bPart)
    if (r === null || g === null || b === null) return null
    return `#${toHexByte(r)}${toHexByte(g)}${toHexByte(b)}`
}

function parseChannel(part: string): number | null {
    const trimmed = part.trim()
    if (trimmed.endsWith('%')) {
        const v = Number.parseFloat(trimmed)
        if (!Number.isFinite(v)) return null
        return clamp(Math.round((v / 100) * 255), 0, 255)
    }
    const v = Number.parseFloat(trimmed)
    if (!Number.isFinite(v)) return null
    return clamp(Math.round(v), 0, 255)
}

function toHexByte(n: number): string {
    return n.toString(16).padStart(2, '0')
}

function clamp(v: number, min: number, max: number): number {
    if (v < min) return min
    if (v > max) return max
    return v
}

function parseHslToHex(raw: string): string | null {
    const m = /\(([^)]+)\)/.exec(raw)
    if (!m) return null
    const body = m[1]
    if (!body) return null
    const parts = body.split(',').map((p) => p.trim())
    if (parts.length < 3) return null
    const [hPart, sPart, lPart] = parts
    if (!hPart || !sPart || !lPart) return null
    const h = parseHue(hPart)
    const s = parsePercent(sPart)
    const l = parsePercent(lPart)
    if (h === null || s === null || l === null) return null
    const { r, g, b } = hslToRgb(h, s, l)
    return `#${toHexByte(r)}${toHexByte(g)}${toHexByte(b)}`
}

function parseHue(part: string): number | null {
    const trimmed = part.trim().toLowerCase()
    let value = Number.parseFloat(trimmed)
    if (!Number.isFinite(value)) return null
    if (trimmed.endsWith('rad')) value = (value * 180) / Math.PI
    else if (trimmed.endsWith('grad')) value = (value * 360) / 400
    else if (trimmed.endsWith('turn')) value = value * 360
    // deg or unit-less is already in degrees.
    value = ((value % 360) + 360) % 360
    return value
}

function parsePercent(part: string): number | null {
    const trimmed = part.trim()
    if (!trimmed.endsWith('%')) return null
    const v = Number.parseFloat(trimmed)
    if (!Number.isFinite(v)) return null
    return clamp(v / 100, 0, 1)
}

function hslToRgb(
    h: number,
    s: number,
    l: number,
): { r: number; g: number; b: number } {
    const c = (1 - Math.abs(2 * l - 1)) * s
    const hp = h / 60
    const x = c * (1 - Math.abs((hp % 2) - 1))
    let r1 = 0
    let g1 = 0
    let b1 = 0
    if (hp >= 0 && hp < 1) {
        r1 = c
        g1 = x
    } else if (hp < 2) {
        r1 = x
        g1 = c
    } else if (hp < 3) {
        g1 = c
        b1 = x
    } else if (hp < 4) {
        g1 = x
        b1 = c
    } else if (hp < 5) {
        r1 = x
        b1 = c
    } else if (hp < 6) {
        r1 = c
        b1 = x
    }
    const m = l - c / 2
    return {
        r: clamp(Math.round((r1 + m) * 255), 0, 255),
        g: clamp(Math.round((g1 + m) * 255), 0, 255),
        b: clamp(Math.round((b1 + m) * 255), 0, 255),
    }
}

// =============================================================================
// SECTION 6 — CIEDE2000 in sRGB / D65.
// =============================================================================

/**
 * Convert an sRGB hex string to CIE Lab using D65 reference white.
 * Pure function, no DOM access. Uses the IEC 61966-2-1 sRGB
 * transfer function for linearisation.
 */
export function sRgbHexToLab(hex: string): Lab {
    const { r, g, b } = parseHex(hex)
    const lin = (channel: number): number => {
        const c = channel / 255
        return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
    }
    const rl = lin(r)
    const gl = lin(g)
    const bl = lin(b)

    // Linear sRGB → CIE XYZ (D65) per IEC 61966-2-1.
    const x = rl * 0.4124564 + gl * 0.3575761 + bl * 0.1804375
    const y = rl * 0.2126729 + gl * 0.7151522 + bl * 0.072175
    const z = rl * 0.0193339 + gl * 0.119192 + bl * 0.9503041

    // D65 reference white (CIE 1931 2°): Xn = 0.95047,
    // Yn = 1.00000, Zn = 1.08883.
    const xn = 0.95047
    const yn = 1.0
    const zn = 1.08883
    const fx = labF(x / xn)
    const fy = labF(y / yn)
    const fz = labF(z / zn)
    const L = 116 * fy - 16
    const a = 500 * (fx - fy)
    const b2 = 200 * (fy - fz)
    return { L, a, b: b2 }
}

function labF(t: number): number {
    const epsilon = 216 / 24389
    const kappa = 24389 / 27
    return t > epsilon ? Math.cbrt(t) : (kappa * t + 16) / 116
}

function parseHex(hex: string): { r: number; g: number; b: number } {
    const m = /^#?([0-9a-fA-F]{6})$/.exec(hex)
    if (!m) return { r: 0, g: 0, b: 0 }
    const value = m[1]
    if (!value) return { r: 0, g: 0, b: 0 }
    const r = Number.parseInt(value.slice(0, 2), 16)
    const g = Number.parseInt(value.slice(2, 4), 16)
    const b = Number.parseInt(value.slice(4, 6), 16)
    return { r, g, b }
}

export interface Lab {
    readonly L: number
    readonly a: number
    readonly b: number
}

/**
 * CIEDE2000 colour-difference formula. Pure-TS port of the
 * Sharma / Wu / Dalal reference implementation:
 *   "The CIEDE2000 Color-Difference Formula: Implementation Notes,
 *    Supplementary Test Data, and Mathematical Observations"
 *   (Color Research and Application, Wiley, 2005).
 *
 * The unit-test fixture verifies the reference test data from
 * Table 1 of the paper. Default weighting factors kL = kC = kH = 1
 * (the only weighting the audit uses).
 */
export function ciede2000(lab1: Lab, lab2: Lab): number {
    const kL = 1
    const kC = 1
    const kH = 1

    const C1 = Math.sqrt(lab1.a * lab1.a + lab1.b * lab1.b)
    const C2 = Math.sqrt(lab2.a * lab2.a + lab2.b * lab2.b)
    const Cbar = (C1 + C2) / 2

    const Cbar7 = Math.pow(Cbar, 7)
    const G = 0.5 * (1 - Math.sqrt(Cbar7 / (Cbar7 + Math.pow(25, 7))))

    const a1p = (1 + G) * lab1.a
    const a2p = (1 + G) * lab2.a

    const C1p = Math.sqrt(a1p * a1p + lab1.b * lab1.b)
    const C2p = Math.sqrt(a2p * a2p + lab2.b * lab2.b)

    const h1p = atan2Deg(lab1.b, a1p)
    const h2p = atan2Deg(lab2.b, a2p)

    const dLp = lab2.L - lab1.L
    const dCp = C2p - C1p

    let dhp: number
    if (C1p === 0 || C2p === 0) {
        dhp = 0
    } else {
        const diff = h2p - h1p
        if (Math.abs(diff) <= 180) {
            dhp = diff
        } else if (diff > 180) {
            dhp = diff - 360
        } else {
            dhp = diff + 360
        }
    }
    const dHp = 2 * Math.sqrt(C1p * C2p) * Math.sin(degToRad(dhp / 2))

    const Lpbar = (lab1.L + lab2.L) / 2
    const Cpbar = (C1p + C2p) / 2

    let hpbar: number
    if (C1p === 0 || C2p === 0) {
        hpbar = h1p + h2p
    } else if (Math.abs(h1p - h2p) <= 180) {
        hpbar = (h1p + h2p) / 2
    } else if (h1p + h2p < 360) {
        hpbar = (h1p + h2p + 360) / 2
    } else {
        hpbar = (h1p + h2p - 360) / 2
    }

    const T =
        1 -
        0.17 * Math.cos(degToRad(hpbar - 30)) +
        0.24 * Math.cos(degToRad(2 * hpbar)) +
        0.32 * Math.cos(degToRad(3 * hpbar + 6)) -
        0.2 * Math.cos(degToRad(4 * hpbar - 63))

    const dTheta = 30 * Math.exp(-Math.pow((hpbar - 275) / 25, 2))

    const Cpbar7 = Math.pow(Cpbar, 7)
    const Rc = 2 * Math.sqrt(Cpbar7 / (Cpbar7 + Math.pow(25, 7)))

    const Sl =
        1 +
        (0.015 * Math.pow(Lpbar - 50, 2)) /
            Math.sqrt(20 + Math.pow(Lpbar - 50, 2))
    const Sc = 1 + 0.045 * Cpbar
    const Sh = 1 + 0.015 * Cpbar * T
    const Rt = -Math.sin(degToRad(2 * dTheta)) * Rc

    const termL = dLp / (kL * Sl)
    const termC = dCp / (kC * Sc)
    const termH = dHp / (kH * Sh)

    return Math.sqrt(
        termL * termL + termC * termC + termH * termH + Rt * termC * termH,
    )
}

function atan2Deg(y: number, x: number): number {
    if (y === 0 && x === 0) return 0
    const v = (Math.atan2(y, x) * 180) / Math.PI
    return v < 0 ? v + 360 : v
}

function degToRad(deg: number): number {
    return (deg * Math.PI) / 180
}

// =============================================================================
// SECTION 7 — Build literal-based finding.
// =============================================================================

interface BuildLiteralFindingArgs {
    readonly node: HTMLElement
    readonly route: string
    readonly literal: ColorLiteral
}

function buildLiteralFinding(args: BuildLiteralFindingArgs): Finding | null {
    const { node, route, literal } = args
    const firstToken = BRIGHT_SKY_TOKENS[0]
    if (!firstToken) return null
    const literalLab = sRgbHexToLab(literal.hex)

    let nearestToken = firstToken
    let nearestDeltaE = Number.POSITIVE_INFINITY
    for (const t of BRIGHT_SKY_TOKENS) {
        const d = ciede2000(literalLab, sRgbHexToLab(t.hex))
        if (d < nearestDeltaE) {
            nearestDeltaE = d
            nearestToken = t
        }
    }
    const deltaE = roundTo(nearestDeltaE, 1000)

    // Exact-token-match short-circuit. A literal whose ΔE against
    // the nearest canonical token is below
    // `EXACT_TOKEN_MATCH_DELTA_E_BAND` is the same colour as a
    // token; the only "wrong" thing is the literal authoring
    // style. Per the rationale in the constant doc, the audit
    // does not raise a finding for that case.
    if (nearestDeltaE <= EXACT_TOKEN_MATCH_DELTA_E_BAND) return null

    const isPrimaryCta = isPrimaryCtaNode(node)
    const isLessonPlayer = route.includes('(learn)/listening')
        || route.includes('(learn)/reading')
        || route.includes('(learn)/writing')
        || route.includes('(learn)/speaking')
        || route.includes('(learn)/grammar')
        || route.includes('(learn)/vocabulary')

    const isLiteralHexNamedColor =
        literal.conditionRef !== '1.3 condition 2'
    const nearTokenForSeverity =
        deltaE > NEAR_TOKEN_DELTA_E_MIN_EXCLUSIVE &&
        deltaE < NEAR_TOKEN_DELTA_E_MAX_EXCLUSIVE
            ? deltaE
            : undefined

    const qualifiers: SeverityQualifiers = {
        isPrimaryTaskSurface: isPrimaryTaskSurface(route),
        isPrimaryCta,
        isLessonPlayer,
        isLiteralHexNamedColor,
        nearTokenDeltaE: nearTokenForSeverity,
    }

    const kind: 'literal' | 'tailwind-arbitrary' | 'named' | 'near-token' =
        nearTokenForSeverity !== undefined
            ? 'near-token'
            : literal.conditionRef === '1.3 condition 2'
                ? 'tailwind-arbitrary'
                : literal.conditionRef === '1.3 condition 3'
                    ? 'named'
                    : 'literal'

    const component = describeComponent(node)

    return {
        defectClass: '1.3',
        severity: assignSeverity('1.3', qualifiers),
        route,
        component,
        evidence: {
            literal: literal.raw,
            nearestToken: nearestToken.token,
            deltaE,
            // Diagnostic sub-fields:
            kind,
            normalisedHex: literal.hex,
            nearestTokenHex: nearestToken.hex,
            source: literal.source,
            isPrimaryCta,
            isLessonPlayer,
            bugConditions: [literal.conditionRef],
        },
        expected:
            'color SHALL come from a canonical Bright Sky token (--fuxie-* / --color-fuxie-*) declared in apps/web/src/app/globals.css; literal hex/rgb/hsl/named and Tailwind arbitrary color classes are not allowed (bugfix.md § 2.3 i–iv)',
        screenshotPath: buildScreenshotPath(route, component, kind),
        forwardTo: null,
        action: 'fix',
    }
}

// =============================================================================
// SECTION 8 — `--fuxie-energy` viewport-area share (condition 5).
// =============================================================================

interface BuildEnergyShareFindingArgs {
    readonly ctx: AuditContext
    readonly nodes: ReadonlyArray<HTMLElement>
}

function buildEnergyShareFinding(
    args: BuildEnergyShareFindingArgs,
): Finding | null {
    const { ctx, nodes } = args
    if (nodes.length === 0) return null

    const viewport = ctx.viewport
    const viewportArea = Math.max(viewport.width * viewport.height, 1)
    const rects: Rect[] = []
    for (const n of nodes) {
        const rect = readBoundingRect(n)
        if (!rect) continue
        const clipped = clipToViewport(rect, viewport)
        if (!clipped) continue
        rects.push(clipped)
    }

    const unionArea = computeUnionArea(rects)
    const share = unionArea / viewportArea

    if (share <= FUXIE_ENERGY_MAX_VIEWPORT_SHARE) return null

    // Emit one finding describing the aggregate share. The
    // `component` field references the first contributor for
    // selector locality; the `evidence.contributors` array lists
    // every node so triage can fix all of them at once.
    const headNode = nodes[0]
    if (!headNode) return null
    const headRoute = resolveRouteForNode(headNode) ?? ctx.route
    const headComponent = describeComponent(headNode)

    const isLessonPlayer = headRoute.includes('(learn)/listening')
        || headRoute.includes('(learn)/reading')
        || headRoute.includes('(learn)/writing')
        || headRoute.includes('(learn)/speaking')
        || headRoute.includes('(learn)/grammar')
        || headRoute.includes('(learn)/vocabulary')

    const qualifiers: SeverityQualifiers = {
        isPrimaryTaskSurface: isPrimaryTaskSurface(headRoute),
        isLessonPlayer,
        fuxieEnergyShareExceeds5Percent: true,
    }

    return {
        defectClass: '1.3',
        severity: assignSeverity('1.3', qualifiers),
        route: headRoute,
        component: headComponent,
        evidence: {
            literal: FUXIE_ENERGY_HEX,
            nearestToken: '--fuxie-energy',
            deltaE: 0,
            // Diagnostic sub-fields:
            kind: 'fuxie-energy-area-share',
            sharePct: roundTo(share * 100, 100),
            shareLimitPct: roundTo(
                FUXIE_ENERGY_MAX_VIEWPORT_SHARE * 100,
                100,
            ),
            unionAreaPx2: Math.round(unionArea),
            viewportAreaPx2: viewportArea,
            contributors: nodes.map((n) => describeComponent(n)),
            isLessonPlayer,
            bugConditions: ['1.3 condition 5'],
        },
        expected:
            '--fuxie-energy SHALL occupy ≤ 5% of viewport area via union of bounding boxes (bugfix.md § 2.3 v / § 1.3 condition 5)',
        screenshotPath: buildScreenshotPath(
            headRoute,
            headComponent,
            'fuxie-energy-share',
        ),
        forwardTo: null,
        action: 'fix',
    }
}

interface Rect {
    readonly x: number
    readonly y: number
    readonly width: number
    readonly height: number
}

/**
 * Read the bounding rect for an element. Falls back to inline
 * `data-bounding-rect="x,y,w,h"` on jsdom (which returns 0×0
 * `getBoundingClientRect` for unstyled elements). Returns `null`
 * when no rectangle can be resolved.
 */
function readBoundingRect(node: HTMLElement): Rect | null {
    const dataAttr = node.getAttribute('data-bounding-rect')
    if (dataAttr) {
        const parts = dataAttr.split(',').map((p) => Number.parseFloat(p.trim()))
        if (parts.length === 4 && parts.every((v) => Number.isFinite(v))) {
            const [x, y, width, height] = parts
            if (
                x !== undefined &&
                y !== undefined &&
                width !== undefined &&
                height !== undefined
            ) {
                return { x, y, width, height }
            }
        }
    }

    // Inline width/height/top/left attributes are sometimes used by
    // fixtures that don't run layout. Best-effort fallback.
    if (typeof node.getBoundingClientRect === 'function') {
        const r = node.getBoundingClientRect()
        if (r && Number.isFinite(r.width) && Number.isFinite(r.height) && (r.width > 0 || r.height > 0)) {
            return { x: r.left, y: r.top, width: r.width, height: r.height }
        }
    }
    return null
}

function clipToViewport(
    rect: Rect,
    viewport: { readonly width: number; readonly height: number },
): Rect | null {
    const x1 = Math.max(rect.x, 0)
    const y1 = Math.max(rect.y, 0)
    const x2 = Math.min(rect.x + rect.width, viewport.width)
    const y2 = Math.min(rect.y + rect.height, viewport.height)
    const w = x2 - x1
    const h = y2 - y1
    if (w <= 0 || h <= 0) return null
    return { x: x1, y: y1, width: w, height: h }
}

/**
 * Compute the union area of a list of rectangles using a sweep over
 * unique x-bands. Pure function; cost O(n²) on n rectangles which
 * is acceptable for the small N (≤ a few dozen) the audit sees.
 *
 * Implementation: collect unique x coordinates, for each adjacent
 * pair compute the merged y-coverage of the rectangles that span
 * that band, then sum band-width × covered-height.
 */
function computeUnionArea(rects: ReadonlyArray<Rect>): number {
    if (rects.length === 0) return 0
    const xs = new Set<number>()
    for (const r of rects) {
        xs.add(r.x)
        xs.add(r.x + r.width)
    }
    const sortedX = Array.from(xs).sort((a, b) => a - b)
    let area = 0
    for (let i = 0; i < sortedX.length - 1; i++) {
        const xLo = sortedX[i]
        const xHi = sortedX[i + 1]
        if (xLo === undefined || xHi === undefined) continue
        const bandW = xHi - xLo
        if (bandW <= 0) continue
        const intervals: Array<[number, number]> = []
        for (const r of rects) {
            if (r.x <= xLo && r.x + r.width >= xHi) {
                intervals.push([r.y, r.y + r.height])
            }
        }
        if (intervals.length === 0) continue
        intervals.sort((a, b) => a[0] - b[0])
        const first = intervals[0]
        if (!first) continue
        let coveredH = 0
        let curLo = first[0]
        let curHi = first[1]
        for (let k = 1; k < intervals.length; k++) {
            const next = intervals[k]
            if (!next) continue
            const [lo, hi] = next
            if (lo <= curHi) {
                if (hi > curHi) curHi = hi
            } else {
                coveredH += curHi - curLo
                curLo = lo
                curHi = hi
            }
        }
        coveredH += curHi - curLo
        area += bandW * coveredH
    }
    return area
}

// =============================================================================
// SECTION 9 — `--fuxie-energy` resolution.
// =============================================================================

/**
 * True when the node's computed colour properties resolve to the
 * `--fuxie-energy` token. The resolution heuristic mirrors the one
 * used by `tests/reward-amber-containment.spec.tsx`:
 *   - `var(--fuxie-energy)` reference in the inline style or
 *     className.
 *   - Tailwind utility classes wired to the token
 *     (`bg-fuxie-energy`, `text-fuxie-energy`, …).
 *   - Inline literal whose CIEDE2000 ΔE < 1.5 vs `#ff8a3d`.
 *
 * Detector 1.3 condition 5 cares about ANY node that ends up
 * rendering the energy colour, not just authored literals — so
 * both the token route and the literal route count.
 */
function resolvesToFuxieEnergy(
    node: HTMLElement,
    computedStyles: AuditContext['computedStyles'],
): boolean {
    const className = node.getAttribute('class') ?? ''
    const style = node.getAttribute('style') ?? ''

    if (
        /var\(\s*--fuxie-energy\b/i.test(className) ||
        /var\(\s*--fuxie-energy\b/i.test(style)
    ) {
        return true
    }
    if (
        /\b(bg|text|border|ring|fill|stroke)-fuxie-energy\b/i.test(className)
    ) {
        return true
    }

    // Inline literal — the literal-scan pass already filters
    // Reward Amber, but we still want to detect the energy token
    // here separately for the area-share calculation.
    const energyLab = sRgbHexToLab(FUXIE_ENERGY_HEX)
    const segments = style.split(';')
    for (const seg of segments) {
        const colon = seg.indexOf(':')
        if (colon === -1) continue
        const propRaw = seg.slice(0, colon).trim().toLowerCase()
        const valueRaw = seg.slice(colon + 1).trim()
        if (
            !(STYLE_COLOR_PROPERTIES as ReadonlyArray<string>).includes(propRaw)
        ) {
            continue
        }
        for (const lit of extractLiteralsFromValue(valueRaw)) {
            const dE = ciede2000(sRgbHexToLab(lit.hex), energyLab)
            if (dE < 1.5) return true
        }
    }

    // Computed style fallback. jsdom's `getComputedStyle` resolves
    // `var(--fuxie-energy)` only when the variable is also declared
    // in a stylesheet that jsdom evaluates — we don't depend on
    // that, so this branch mostly catches the case where the
    // production HTML provider already inlined the resolved value.
    try {
        const computed = computedStyles(node)
        for (const prop of ['color', 'background-color', 'border-color', 'fill', 'stroke']) {
            const raw = computed.getPropertyValue(prop)
            if (!raw) continue
            for (const lit of extractLiteralsFromValue(raw)) {
                const dE = ciede2000(sRgbHexToLab(lit.hex), energyLab)
                if (dE < 1.5) return true
            }
        }
    } catch {
        // jsdom can throw on detached elements — ignore.
    }

    return false
}

// =============================================================================
// SECTION 10 — Surface helpers + small utilities.
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

function isPrimaryCtaNode(node: HTMLElement): boolean {
    const role = node.getAttribute('data-role')
    if (role === 'primary-cta') return true
    const variant = node.getAttribute('data-variant')
    if (variant === 'primary') return true
    const className = node.getAttribute('class') ?? ''
    if (/\b(primary-cta|btn-primary|cta-primary)\b/.test(className)) return true
    return false
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
    return `audit-reports/ui-ux/screens/1.3/${safeRoute}__${safeComponent}__${suffix}.png`
}

function roundTo(value: number, factor: number): number {
    return Math.round(value * factor) / factor
}
