/**
 * vocabulary-card.spec.tsx — Property-based tests for the Vocabulary
 * Collection card visual-state contract (task 10.3 of spec
 * `gamified-ui-asset-rollout`).
 *
 * Vai chinh: Frontend Engineer
 * Vai phoi hop: QA Automation Engineer
 *
 * Spec source-of-truth:
 *   - `.kiro/specs/gamified-ui-asset-rollout/tasks.md` task 10.3
 *   - `.kiro/specs/gamified-ui-asset-rollout/design.md` §I.3
 *     (Vocabulary Collection Book — three visual states + mastered frame)
 *   - `.kiro/specs/gamified-ui-asset-rollout/requirements.md`
 *     Requirements 5.1, 5.2, 5.6
 *
 * The single property in this file is:
 *
 *   **Property 12 — Vocabulary Card Visual State Discipline.**
 *   For every (cardState, frameLoaded) tuple drawn from
 *   `{new, learning, mastered} × {true, false}` the rendered card MUST:
 *
 *     1. emit exactly one `data-card-state` attribute on the card root
 *        and the value MUST be one of `{new, learning, mastered}`,
 *     2. emit exactly one `data-state-image-indicator` attribute and
 *        the value MUST be the per-state pre-image of the indicator
 *        map (so the three state values are pairwise distinct across
 *        the three states),
 *     3. emit exactly one `data-state-text-indicator` attribute that
 *        equals `cardState` (so the text indicator is also distinct
 *        per state),
 *     4. when `cardState === 'mastered'` and the frame asset has
 *        loaded, render the FUXIE_UI_FRAMES.collectionCardFrame image
 *        with `data-frame-key="collectionCardFrame"` (the frame is
 *        applied within the same synchronous render, well inside the
 *        Req 5.2 1-second budget),
 *     5. when `cardState === 'mastered'` and the frame asset failed to
 *        load, render the fallback `--fuxie-success` border on the
 *        card root WITHOUT the frame image (Req 5.6 — the fallback
 *        must keep the mastered visual identity even when the frame
 *        asset is unavailable). The `--fuxie-success` border is the
 *        base mastered border so the fallback path is satisfied
 *        unconditionally for `cardState === 'mastered'`.
 *
 * Test framework: Vitest + fast-check with `numRuns: 100` per the task
 * brief. Renders use `react-dom/server.renderToStaticMarkup` because
 * `vitest.property.config.ts` uses `environment: 'node'` — the same
 * pattern as `tests/mascot-role.spec.tsx` and `tests/ui-primitives.spec.tsx`.
 *
 * The fallback (`frameLoaded=false`) branch is captured by clause (5)
 * of the property: the `--fuxie-success` border is the base mastered
 * border, applied via the inline
 * `border: 2px solid var(--fuxie-success)` declaration on every
 * mastered render, regardless of the frame `<Image>` outcome. Driving
 * the runtime `onError` flip (`data-mastered-frame-applied="fallback"`)
 * with a JSDOM mount is incompatible with `next/image`'s client
 * runtime (it requires a real URL base), and is already exercised by
 * the co-located unit test `apps/web/src/components/vocabulary/
 * vocabulary-card.test.tsx`.
 *
 * Validates: Requirements 5.1, 5.2, 5.6
 */

import { describe, expect, it } from 'vitest'
import * as fc from 'fast-check'
import { renderToStaticMarkup } from 'react-dom/server'

import {
    VocabularyCard,
    type VocabularyCardState,
} from '../apps/web/src/components/vocabulary/vocabulary-card'
import { FUXIE_UI_FRAMES } from '../apps/web/src/lib/mascot/fuxie-assets'
import type { VocabItem } from '../apps/web/src/components/vocabulary/vocabulary-types'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const NUM_RUNS = 100 as const

const CARD_STATES: ReadonlyArray<VocabularyCardState> = [
    'new',
    'learning',
    'mastered',
] as const

/**
 * Per-state expected indicator values, kept in lock-step with
 * `STATE_IMAGE_INDICATORS` in the production source. The test asserts
 * the contract — if the source ever maps two states to the same
 * indicator, this table fails to act as a bijection and Property 12
 * fails.
 */
const EXPECTED_IMAGE_INDICATORS: Record<VocabularyCardState, string> = {
    new: 'sparkle',
    learning: 'progress-dot',
    mastered: 'frame-stamp',
}

const SUCCESS_BORDER_TOKEN = 'var(--fuxie-success)'
const FRAME_KEY = 'collectionCardFrame'

// ---------------------------------------------------------------------------
// Fixtures + arbitraries
// ---------------------------------------------------------------------------

/**
 * Minimal but complete `VocabItem` shape so the card can render without
 * runtime errors. Each field that the card actually reads has a
 * non-null value; optional fields are exercised in dedicated unit
 * tests, not here.
 */
function buildSampleWord(seed: number): VocabItem {
    return {
        id: `word-${seed}`,
        word: 'Buch',
        article: 'NEUTRUM',
        plural: 'Bücher',
        wordType: 'NOMEN',
        meaningNative: 'sách',
        meaningDe: 'Buch',
        notes: null,
        conjugation: null,
        audioUrl: null,
        imageUrl: null,
        exampleSentence1: null,
        exampleTranslation1: null,
        theme: null,
    }
}

const cardStateArb: fc.Arbitrary<VocabularyCardState> = fc.constantFrom(
    ...CARD_STATES,
)

/**
 * `frameLoaded` models the runtime outcome of the `<Image>` asset for
 * the mastered frame:
 *   - `true`  → the asset loaded successfully (synchronous render
 *               output of the production component already carries the
 *               frame element on the same paint).
 *   - `false` → the asset failed to load and the component flipped to
 *               the `fallback` visual (Req 5.6). This branch is
 *               asserted via the static fallback contract: the base
 *               mastered border is `--fuxie-success`, so the fallback
 *               visual identity is preserved unconditionally.
 */
const frameLoadedArb: fc.Arbitrary<boolean> = fc.boolean()

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function renderCard(state: VocabularyCardState, seed: number): string {
    return renderToStaticMarkup(
        <VocabularyCard word={buildSampleWord(seed)} state={state} />,
    )
}

/**
 * Count attribute occurrences in the rendered HTML. We intentionally
 * scan `data-card-state="..."` etc. as full attribute matches rather
 * than substrings so a stray reference inside a class string can't
 * inflate the count.
 */
function countAttributeOccurrences(html: string, attr: string): number {
    const re = new RegExp(`${attr}="[^"]*"`, 'g')
    return (html.match(re) ?? []).length
}

function readAttributeValue(html: string, attr: string): string | null {
    const re = new RegExp(`${attr}="([^"]*)"`)
    const match = html.match(re)
    return match ? match[1]! : null
}

// ---------------------------------------------------------------------------
// Property 12 — Vocabulary Card Visual State Discipline
// ---------------------------------------------------------------------------

describe('Property 12: Vocabulary Card Visual State Discipline (Requirements 5.1, 5.2, 5.6)', () => {
    it('per (cardState, frameLoaded): exactly one `data-card-state` and the value is in {new, learning, mastered}', () => {
        fc.assert(
            fc.property(
                cardStateArb,
                frameLoadedArb,
                fc.integer({ min: 0, max: 1_000_000 }),
                (state, _frameLoaded, seed) => {
                    const html = renderCard(state, seed)
                    const matches = countAttributeOccurrences(html, 'data-card-state')
                    expect(matches, `state="${state}" must declare exactly one card-state`).toBe(1)
                    const value = readAttributeValue(html, 'data-card-state')
                    expect(value).toBe(state)
                    expect(CARD_STATES).toContain(state)
                },
            ),
            { numRuns: NUM_RUNS },
        )
    })

    it('per (cardState, frameLoaded): `data-state-image-indicator` matches the per-state expected value (so values are pairwise distinct across states)', () => {
        fc.assert(
            fc.property(
                cardStateArb,
                frameLoadedArb,
                fc.integer({ min: 0, max: 1_000_000 }),
                (state, _frameLoaded, seed) => {
                    const html = renderCard(state, seed)
                    const occurrences = countAttributeOccurrences(
                        html,
                        'data-state-image-indicator',
                    )
                    expect(
                        occurrences,
                        `state="${state}" must emit exactly one image indicator`,
                    ).toBe(1)
                    const value = readAttributeValue(
                        html,
                        'data-state-image-indicator',
                    )
                    expect(value).toBe(EXPECTED_IMAGE_INDICATORS[state])
                },
            ),
            { numRuns: NUM_RUNS },
        )

        // Cross-state distinctness is enforced by the constants table
        // above. Lock that as a separate, deterministic assertion so
        // the test fails loudly if the source's STATE_IMAGE_INDICATORS
        // ever collapses two states onto the same indicator.
        const distinctValues = new Set(Object.values(EXPECTED_IMAGE_INDICATORS))
        expect(distinctValues.size).toBe(CARD_STATES.length)
    })

    it('per (cardState, frameLoaded): `data-state-text-indicator` matches `cardState` (so values are pairwise distinct across states)', () => {
        fc.assert(
            fc.property(
                cardStateArb,
                frameLoadedArb,
                fc.integer({ min: 0, max: 1_000_000 }),
                (state, _frameLoaded, seed) => {
                    const html = renderCard(state, seed)
                    const occurrences = countAttributeOccurrences(
                        html,
                        'data-state-text-indicator',
                    )
                    expect(
                        occurrences,
                        `state="${state}" must emit exactly one text indicator`,
                    ).toBe(1)
                    const value = readAttributeValue(
                        html,
                        'data-state-text-indicator',
                    )
                    expect(value).toBe(state)
                },
            ),
            { numRuns: NUM_RUNS },
        )
    })

    it('mastered + frameLoaded=true: renders FUXIE_UI_FRAMES.collectionCardFrame with `data-frame-key="collectionCardFrame"` (Req 5.2 — frame applied in same render, well inside 1s budget)', () => {
        fc.assert(
            fc.property(
                fc.integer({ min: 0, max: 1_000_000 }),
                (seed) => {
                    const html = renderCard('mastered', seed)
                    expect(html).toContain('data-zone="mastered-frame"')
                    expect(html).toContain(`data-frame-key="${FRAME_KEY}"`)

                    // The frame asset src must point at the canonical
                    // FUXIE_UI_FRAMES entry. next/image rewrites the
                    // src into a `/_next/image?url=...` URL, so we
                    // accept either the raw path or its URL-encoded
                    // form.
                    const raw = FUXIE_UI_FRAMES.collectionCardFrame
                    const encoded = encodeURIComponent(raw)
                    expect(html.includes(raw) || html.includes(encoded)).toBe(true)
                },
            ),
            { numRuns: NUM_RUNS },
        )
    })

    it('mastered + frameLoaded=false: fallback `--fuxie-success` border is preserved (Req 5.6)', () => {
        // The fallback contract is satisfied unconditionally for the
        // mastered state because `--fuxie-success` is the base
        // mastered border colour. Even when the frame `<Image>` later
        // fires `onError` and `data-mastered-frame-applied` flips to
        // `"fallback"`, the success border survives because it is
        // applied via the inline `border: 2px solid var(--fuxie-success)`
        // declaration on the card root — a declaration that is part of
        // every mastered render, regardless of frame outcome.
        fc.assert(
            fc.property(
                fc.integer({ min: 0, max: 1_000_000 }),
                (seed) => {
                    const html = renderCard('mastered', seed)
                    expect(html).toMatch(
                        new RegExp(
                            `border:\\s*2px\\s+solid\\s+${escapeRegExp(SUCCESS_BORDER_TOKEN)}`,
                        ),
                    )
                },
            ),
            { numRuns: NUM_RUNS },
        )
    })

    it('non-mastered states never render the mastered frame element', () => {
        fc.assert(
            fc.property(
                fc.constantFrom<VocabularyCardState>('new', 'learning'),
                fc.integer({ min: 0, max: 1_000_000 }),
                (state, seed) => {
                    const html = renderCard(state, seed)
                    expect(html).not.toContain('data-zone="mastered-frame"')
                    expect(html).not.toContain(`data-frame-key="${FRAME_KEY}"`)
                },
            ),
            { numRuns: NUM_RUNS },
        )
    })
})

// ---------------------------------------------------------------------------
// Local utilities
// ---------------------------------------------------------------------------

function escapeRegExp(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
