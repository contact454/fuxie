'use client'

import Image from 'next/image'
import {
    useCallback,
    useEffect,
    useRef,
    useState,
    type ReactNode,
} from 'react'

import { AudioPlayer } from '@/components/ui/audio-player'
import {
    FUXIE_UI_FRAMES,
    getFuxieUiFrameSrc,
} from '@/lib/mascot/fuxie-assets'

import {
    ARTICLE_COLORS,
    ARTICLE_TEXT,
    type VocabItem,
    WORD_TYPE_LABELS,
} from './vocabulary-types'

/**
 * Vocabulary Collection card — task 10.1 of `gamified-ui-asset-rollout`.
 *
 * Vai chinh: Frontend Engineer.
 * Vai phoi hop: Gamification Designer (state semantics), Design System
 *               Designer (frame token).
 *
 * Spec source-of-truth:
 *   - Task 10.1 (gamified-ui-asset-rollout/tasks.md)
 *   - design.md §I.3 (Vocabulary Collection Book)
 *   - requirements.md Requirements 5.1, 5.2, 5.6
 *   - Property 12 (Vocabulary Card Visual State Discipline)
 *
 * Visual state contract (design §I.3):
 *
 *   ┌────────────────┬────────────────────────────────┬─────────────┐
 *   │ data-card-state│ image indicator                │ text label  │
 *   ├────────────────┼────────────────────────────────┼─────────────┤
 *   │ new            │ border `--fuxie-blue-200` +    │ "Mới"       │
 *   │                │ ✦ sparkle glyph                │             │
 *   │ learning       │ border `--fuxie-action` +      │ "Đang học"  │
 *   │                │ progress dot ●                 │             │
 *   │ mastered       │ FUXIE_UI_FRAMES.collectionCard │ "Đã thuộc"  │
 *   │                │ Frame overlay + ✓ stamp        │             │
 *   └────────────────┴────────────────────────────────┴─────────────┘
 *
 * Each state emits two stable test selectors so the visual state is
 * machine-checkable without reading code (Requirement 5.1; Property 12):
 *
 *   - `data-state-image-indicator` ∈ {"sparkle","progress-dot","frame-stamp"}
 *   - `data-state-text-indicator`  ∈ {"new","learning","mastered"}
 *
 * Mastered transition (Requirement 5.2):
 *   When `state` becomes `mastered`, the FUXIE_UI_FRAMES.collectionCardFrame
 *   image is rendered as a frame around the card synchronously on the same
 *   render. The transition is therefore well within the 1s budget — the
 *   component additionally exposes `data-mastered-frame-applied` ∈
 *   {"true","false","fallback"} so tests can assert the frame became live
 *   and was applied with a single render tick.
 *
 * Frame load fallback (Requirement 5.6):
 *   If the frame `<Image>` fires `onError`, the card swaps to the fallback
 *   visual: a `--fuxie-success` border (already the mastered border) plus a
 *   non-blocking toast. The mastered state itself is preserved — only the
 *   frame image is dropped. The toast is rendered locally via a
 *   `role="status"` live region (no global toast system in this workspace
 *   yet), and the card emits `data-mastered-frame-applied="fallback"` so
 *   tests can assert the fallback path.
 */

// -----------------------------------------------------------------------------
// Public types
// -----------------------------------------------------------------------------

export type VocabularyCardState = 'new' | 'learning' | 'mastered'

export type VocabularyCardImageIndicator =
    | 'sparkle'
    | 'progress-dot'
    | 'frame-stamp'

export type VocabularyCardTextIndicator = VocabularyCardState

export interface VocabularyCardProps {
    /** Vocabulary item to render. */
    word: VocabItem
    /**
     * Mastery state of the card (design §I.3). Must be one of
     * `'new' | 'learning' | 'mastered'`.
     */
    state: VocabularyCardState
    /**
     * Optional learning progress percentage (0–100). Rendered as an inline
     * label next to the progress dot when `state === 'learning'`. Ignored
     * for other states.
     */
    learningProgress?: number
    /**
     * Optional callback invoked when the mastered frame asset fails to
     * load. Useful for surface-level analytics; the card already handles
     * the fallback visual + toast itself.
     */
    onMasteredFrameError?: () => void
    /** Wrapper className. */
    className?: string
}

/**
 * Status emitted on `data-mastered-frame-applied` so property/timer tests
 * can assert the mastered transition outcome without DOM measurement.
 */
type MasteredFrameStatus = 'true' | 'false' | 'fallback'

// -----------------------------------------------------------------------------
// Constants
// -----------------------------------------------------------------------------

/**
 * Localized text labels per state. Vietnamese is the default learner locale
 * in this workspace; the design spec uses Vietnamese labels verbatim.
 */
const STATE_TEXT_LABELS: Record<VocabularyCardState, string> = {
    new: 'Mới',
    learning: 'Đang học',
    mastered: 'Đã thuộc',
}

/**
 * Stable mapping `state → data-state-image-indicator`. Distinct values
 * enforce Property 12 (image indicators differ per state).
 */
const STATE_IMAGE_INDICATORS: Record<
    VocabularyCardState,
    VocabularyCardImageIndicator
> = {
    new: 'sparkle',
    learning: 'progress-dot',
    mastered: 'frame-stamp',
}

/** Border-color per state, anchored to Bright Sky tokens (design §F). */
const STATE_BORDER_COLOR: Record<VocabularyCardState, string> = {
    new: 'var(--fuxie-blue-200)',
    learning: 'var(--fuxie-action)',
    mastered: 'var(--fuxie-success)',
}

/**
 * Toast message rendered when the mastered frame asset fails to load
 * (Requirement 5.6 — non-blocking message + preserved state).
 */
const MASTERED_FRAME_FALLBACK_TOAST_MESSAGE =
    'Khung "Đã thuộc" tạm thời không tải được — viền thành tích vẫn được giữ.'

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

function clampProgress(value: number | undefined): number | null {
    if (typeof value !== 'number' || !Number.isFinite(value)) return null
    if (value <= 0) return 0
    if (value >= 100) return 100
    return Math.round(value)
}

// -----------------------------------------------------------------------------
// Component
// -----------------------------------------------------------------------------

/**
 * Vocabulary Collection card with 3 visual states (`new`, `learning`,
 * `mastered`) and a mastered frame from `FUXIE_UI_FRAMES`. See module
 * docstring for the data-attribute contract and fallback behavior.
 *
 * Validates: Requirements 5.1, 5.2, 5.6
 */
export function VocabularyCard({
    word,
    state,
    learningProgress,
    onMasteredFrameError,
    className = '',
}: VocabularyCardProps) {
    const articleColor = word.article
        ? ARTICLE_COLORS[word.article] ?? '#6B7280'
        : '#6B7280'
    const articleText = word.article ? ARTICLE_TEXT[word.article] : null

    // Track frame load outcome for the mastered transition. Status is:
    //  - 'false'    until mastered & frame attempt mounted
    //  - 'true'     once the frame <Image> fires onLoad
    //  - 'fallback' if the frame <Image> fires onError (Req 5.6)
    const [frameStatus, setFrameStatus] = useState<MasteredFrameStatus>(
        state === 'mastered' ? 'false' : 'false',
    )
    const [showFallbackToast, setShowFallbackToast] = useState(false)
    const fallbackToastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
        null,
    )

    // Reset frame status whenever we transition INTO or OUT OF mastered so
    // a re-mount of the frame image always re-attempts the load.
    useEffect(() => {
        if (state === 'mastered') {
            // Default to 'false' until the image reports back (load/error).
            // The frame element is rendered synchronously below, so the
            // visual frame appears within the same render — well under the
            // 1s budget (Requirement 5.2).
            setFrameStatus((prev) => (prev === 'fallback' ? 'fallback' : 'false'))
        } else {
            setFrameStatus('false')
            setShowFallbackToast(false)
        }
    }, [state])

    // Cleanup any in-flight toast timer on unmount.
    useEffect(() => {
        return () => {
            if (fallbackToastTimerRef.current) {
                clearTimeout(fallbackToastTimerRef.current)
                fallbackToastTimerRef.current = null
            }
        }
    }, [])

    const handleFrameLoad = useCallback(() => {
        // Only flip to "true" if we're not already in fallback (a successful
        // late-load shouldn't suppress the user-visible toast/fallback).
        setFrameStatus((prev) => (prev === 'fallback' ? 'fallback' : 'true'))
    }, [])

    const handleFrameError = useCallback(() => {
        setFrameStatus('fallback')
        setShowFallbackToast(true)
        onMasteredFrameError?.()
        // Auto-dismiss the toast so it stays non-blocking (Req 5.6). 4500ms
        // is short enough to not interrupt the next state change while
        // still long enough to read.
        if (fallbackToastTimerRef.current) {
            clearTimeout(fallbackToastTimerRef.current)
        }
        fallbackToastTimerRef.current = setTimeout(() => {
            setShowFallbackToast(false)
            fallbackToastTimerRef.current = null
        }, 4500)
    }, [onMasteredFrameError])

    const isMastered = state === 'mastered'
    const masteredFrameApplied: MasteredFrameStatus = isMastered
        ? frameStatus
        : 'false'

    const borderColor = STATE_BORDER_COLOR[state]
    const stateImageIndicator = STATE_IMAGE_INDICATORS[state]
    const stateTextIndicator = state
    const stateLabel = STATE_TEXT_LABELS[state]
    const progressPct = state === 'learning' ? clampProgress(learningProgress) : null

    return (
        <article
            // ── Property 12 / Requirement 5.1 — exactly one card-state per
            //    card; image + text indicators differ per state.
            data-card-state={state}
            data-state-image-indicator={stateImageIndicator}
            data-state-text-indicator={stateTextIndicator}
            // ── Requirement 5.2 / 5.6 — mastered frame status, exposed for
            //    timer + fallback assertions.
            data-mastered-frame-applied={masteredFrameApplied}
            className={`relative flex items-center gap-3 rounded-2xl bg-white p-3 shadow-sm transition-[border-color,box-shadow] ${className}`}
            style={{
                border: `2px solid ${borderColor}`,
            }}
        >
            {/* ── State indicator chip (image + text — distinct per state) ── */}
            <span
                aria-hidden="true"
                data-zone="state-image-indicator"
                className="absolute -top-2 -right-2 inline-flex h-7 min-w-7 items-center justify-center rounded-full px-2 text-[11px] font-black text-white shadow"
                style={{ backgroundColor: borderColor }}
            >
                <StateIndicatorGlyph indicator={stateImageIndicator} />
            </span>

            {/* Word image or article-colored block */}
            {word.imageUrl ? (
                <Image
                    src={word.imageUrl}
                    alt={word.word}
                    width={48}
                    height={48}
                    className="shrink-0 rounded-lg object-cover"
                />
            ) : (
                <div
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg text-sm font-bold"
                    style={{
                        backgroundColor: `${articleColor}14`,
                        color: articleColor,
                    }}
                >
                    {articleText ?? word.word.charAt(0)}
                </div>
            )}

            {/* Word info */}
            <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline gap-1.5">
                    {articleText && (
                        <span
                            className="rounded px-1 py-0.5 text-xs font-bold"
                            style={{
                                color: articleColor,
                                backgroundColor: `${articleColor}15`,
                            }}
                        >
                            {articleText}
                        </span>
                    )}
                    <span className="text-sm font-bold text-gray-900">
                        {word.word}
                    </span>
                </div>
                <p className="mt-0.5 text-xs text-gray-600">
                    {word.meaningNative}
                </p>
                {word.meaningDe && (
                    <p className="mt-0.5 text-xs font-medium text-text-brand">
                        {word.meaningDe}
                    </p>
                )}
            </div>

            {/* Audio + state text label */}
            <div className="flex shrink-0 flex-col items-end gap-1.5">
                <span
                    data-zone="state-text-indicator"
                    className="rounded-full px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide"
                    style={{
                        color: borderColor,
                        backgroundColor: `${borderColor}1a`, /* ~10% alpha */
                    }}
                >
                    {stateLabel}
                </span>
                <div className="flex items-center gap-1.5">
                    {state === 'learning' && progressPct !== null && (
                        <span className="text-[11px] font-semibold text-[color:var(--color-text-brand)] tabular-nums">
                            {progressPct}%
                        </span>
                    )}
                    <span className="text-[11px] font-semibold text-gray-400">
                        {WORD_TYPE_LABELS[word.wordType] ?? word.wordType}
                    </span>
                    <AudioPlayer src={word.audioUrl} text={word.word} size="sm" />
                </div>
            </div>

            {/* ── Mastered frame overlay (Req 5.2) ──
              * Rendered synchronously when state===mastered so the frame
              * appears within the same render as the state transition (well
              * inside the 1s budget). On load failure (onError), we flip to
              * 'fallback' and rely on the existing `--fuxie-success` border
              * applied above (Req 5.6).
              */}
            {isMastered && frameStatus !== 'fallback' && (
                <Image
                    src={getFuxieUiFrameSrc('collectionCardFrame')}
                    alt=""
                    aria-hidden="true"
                    fill
                    sizes="(max-width: 480px) 100vw, 480px"
                    data-zone="mastered-frame"
                    data-frame-key="collectionCardFrame"
                    className="pointer-events-none absolute inset-0 select-none object-contain opacity-70"
                    onLoad={handleFrameLoad}
                    onError={handleFrameError}
                    // The frame asset is decorative and visual-only.
                    priority={false}
                />
            )}

            {/* ── Non-blocking fallback toast (Req 5.6) ── */}
            {showFallbackToast && (
                <FallbackFrameToast
                    message={MASTERED_FRAME_FALLBACK_TOAST_MESSAGE}
                />
            )}
        </article>
    )
}

// -----------------------------------------------------------------------------
// Internal sub-components
// -----------------------------------------------------------------------------

function StateIndicatorGlyph({
    indicator,
}: {
    indicator: VocabularyCardImageIndicator
}): ReactNode {
    if (indicator === 'sparkle') {
        return <span aria-hidden="true">✦</span>
    }
    if (indicator === 'progress-dot') {
        return (
            <span
                aria-hidden="true"
                className="inline-block h-2 w-2 rounded-full bg-white"
            />
        )
    }
    // 'frame-stamp' — checkmark inside the success-toned chip.
    return <span aria-hidden="true">✓</span>
}

/**
 * Lightweight non-blocking toast used when the mastered frame fails to
 * load. Implemented locally because the workspace does not yet ship a
 * shared toast primitive; the `role="status"` live region keeps the
 * message announced to screen readers without focus-stealing.
 *
 * Validates: Requirement 5.6
 */
function FallbackFrameToast({ message }: { message: string }) {
    return (
        <div
            role="status"
            aria-live="polite"
            data-role="vocabulary-card-frame-fallback-toast"
            className="pointer-events-none absolute inset-x-2 bottom-2 z-10 rounded-xl bg-[color:var(--fuxie-blue-900)]/90 px-3 py-2 text-xs font-semibold text-white shadow-lg"
        >
            {message}
        </div>
    )
}

// Re-export the frame map so consumers and tests can refer to the canonical
// asset key without re-declaring the import.
export { FUXIE_UI_FRAMES }
