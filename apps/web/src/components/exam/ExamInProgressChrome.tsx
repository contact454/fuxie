'use client'

/**
 * ExamInProgressChrome — formal, no-game-overlay shell for the exam
 * `in-progress` state.
 *
 * Vai chinh: Frontend Engineer
 * Vai phoi hop: Design System Designer (neutral palette enforcement),
 *               Gamification Designer (sign-off on no-mascot/no-reward)
 *
 * Spec source-of-truth:
 *   - Task 15.1 (gamified-ui-asset-rollout)
 *   - design.md §I.8 (Exam — formal credibility)
 *   - requirements.md Req 10.1, 10.2, 10.4
 *
 * Contract (machine-checkable):
 *   1. Renders a fixed-top bar with:
 *        - timer formatted `mm:ss` (`data-role="exam-timer"`,
 *          `^\d{2}:\d{2}$`),
 *        - counter `{done}/{total}` (`data-role="exam-counter"`,
 *          `^\d+/\d+$`, `done ≤ total`).
 *   2. Renders a fixed-bottom Primary_CTA via {@link PrimaryCta}
 *      (`data-role="primary-cta"`) with default label `"Nộp bài"`
 *      (Req 10.2).
 *   3. Root element carries `data-surface-id="exam"` and
 *      `data-exam-state="in-progress"` so cross-surface property tests
 *      (Property 7, 8, 9, 22) can target the chrome deterministically.
 *   4. Palette is restricted to neutral (`white`, `--fuxie-blue-50`,
 *      `--fuxie-blue-100`, `--fuxie-blue-900`) and Bright Sky deep blue
 *      tokens (`--fuxie-blue-600..900`, `--fuxie-action`). NEVER uses
 *      `--fuxie-reward`, `--fuxie-energy`, `--fuxie-success`
 *      (Req 10.4 + Property 9 zero-amber invariant).
 *   5. Mounts no mascot, no reward animation, no streak chip, and no
 *      XP/coin badge inside its tree (Req 10.1).
 *   6. While mounted, sets `data-exam-in-progress="true"` on
 *      `document.body` so the (learn) `MobileShell` chrome
 *      (XP badge, Fuxie header logo, bottom nav) is hidden by the
 *      companion CSS rules in `globals.css` (Req 10.1 — "no mascot
 *      animation, no streak, no XP/coin badge").
 *
 * Out of scope (deferred to task 15.2 / 15.3):
 *   - Timer 00:00 auto-submit (Req 10.3).
 *   - Disconnect pause/resume + 60-min recovery (Req 10.6, 10.7).
 *   - Post-submit Result_Reward_Loop trigger (Req 10.5).
 *
 * The component is presentational: timer countdown, answer state, and
 * submission flow are owned by the host (`ExamSessionClient`).
 */

import { useEffect, type ReactNode } from 'react'

import { PrimaryCta } from '@/components/ui/primary-cta'
import { fx } from '@/components/ui/fuxie-ui'

// -----------------------------------------------------------------------------
// Public types
// -----------------------------------------------------------------------------

export interface ExamInProgressChromeProps {
    /**
     * Remaining time in whole seconds. Floored, clamped to ≥ 0; rendered as
     * `mm:ss` with `mm` padded to 2 digits and capped at 99 (Req 7.3 mirror;
     * exam max practical mm ≤ 99).
     */
    remainingSeconds: number
    /** Number of questions answered so far (`done ≤ total`, integer ≥ 0). */
    done: number
    /** Total questions in the exam (integer ≥ 0, ≥ `done`). */
    total: number
    /** Submit handler — invoked when the learner taps Primary_CTA. */
    onSubmit: () => void
    /**
     * Disable the Primary_CTA (e.g. while a submit request is in flight or
     * during a network disconnect — owned by 15.2). Default `false`.
     */
    submitDisabled?: boolean
    /** Override the Primary_CTA label. Default `'Nộp bài'`. */
    submitLabel?: string
    /** Question content area (rendered between the fixed top and bottom). */
    children: ReactNode
    /** Optional className on the root section. */
    className?: string
}

// -----------------------------------------------------------------------------
// Pure formatting helpers (exported for unit tests)
// -----------------------------------------------------------------------------

/**
 * Format a non-negative second count as `mm:ss`.
 *
 * - Negative or NaN inputs are clamped to 0.
 * - Minutes are padded to 2 digits and saturated at 99 so the timer is
 *   guaranteed to match `^\d{2}:\d{2}$` (Req 10.2).
 *
 * Validates: Requirement 10.2
 */
export function formatExamTimer(seconds: number): string {
    const safe = Number.isFinite(seconds) && seconds > 0 ? Math.floor(seconds) : 0
    const mm = Math.min(99, Math.floor(safe / 60))
    const ss = safe % 60
    return `${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`
}

/**
 * Format the answered/total counter as `{done}/{total}`.
 *
 * - Both values clamped to non-negative integers.
 * - `done` clamped to `≤ total` so the counter always satisfies
 *   `^\d+/\d+$` with `done ≤ total` (Req 10.2 + Property 13 mirror).
 *
 * Validates: Requirement 10.2
 */
export function formatExamCounter(done: number, total: number): string {
    const safeTotal = Number.isFinite(total) && total > 0 ? Math.floor(total) : 0
    const safeDoneRaw =
        Number.isFinite(done) && done > 0 ? Math.floor(done) : 0
    const safeDone = Math.min(safeDoneRaw, safeTotal)
    return `${safeDone}/${safeTotal}`
}

// -----------------------------------------------------------------------------
// Body data-attribute toggle (suppresses the MobileShell game chrome)
// -----------------------------------------------------------------------------

/**
 * While mounted, sets `data-exam-in-progress="true"` on `document.body`.
 * Companion CSS in `globals.css` hides:
 *   - `.mobile-header` (Fuxie logo + XP badge)
 *   - `.bottom-nav`   (emoji nav)
 *
 * Removed on unmount so the gamified shell returns for the result page.
 *
 * SSR-safe: skips the side-effect if `document` is not available.
 *
 * Validates: Requirement 10.1
 */
function useSuppressLearnerGameChrome(): void {
    useEffect(() => {
        if (typeof document === 'undefined') return
        const previous = document.body.dataset.examInProgress
        document.body.dataset.examInProgress = 'true'
        return () => {
            if (previous === undefined) {
                delete document.body.dataset.examInProgress
            } else {
                document.body.dataset.examInProgress = previous
            }
        }
    }, [])
}

// -----------------------------------------------------------------------------
// Component
// -----------------------------------------------------------------------------

const FIXED_TOP_BAR_HEIGHT_PX = 56
const FIXED_BOTTOM_BAR_HEIGHT_PX = 88

/**
 * Formal exam chrome — fixed top (timer + counter), scrollable body
 * (question content), fixed bottom (Primary_CTA "Nộp bài").
 *
 * Validates: Requirements 10.1, 10.2, 10.4
 */
export function ExamInProgressChrome({
    remainingSeconds,
    done,
    total,
    onSubmit,
    submitDisabled = false,
    submitLabel = 'Nộp bài',
    children,
    className,
}: ExamInProgressChromeProps) {
    useSuppressLearnerGameChrome()

    const timer = formatExamTimer(remainingSeconds)
    const counter = formatExamCounter(done, total)

    return (
        <section
            data-surface-id="exam"
            data-exam-state="in-progress"
            className={fx(
                // Neutral page background only — no reward amber, no energy
                // orange, no success teal (Req 10.4).
                'relative min-h-[100dvh] w-full bg-[var(--fuxie-blue-50)]',
                'text-[color:var(--fuxie-blue-900)]',
                className,
            )}
        >
            {/* Fixed top: timer + counter (Req 10.2). */}
            <header
                data-role="exam-top-bar"
                className={fx(
                    'fixed inset-x-0 top-0 z-40',
                    'flex items-center justify-between gap-4',
                    'border-b border-[var(--fuxie-blue-200)]',
                    'bg-white/95 px-4 py-3 backdrop-blur',
                    // Subtle deep-blue ring keeps formal credibility.
                    'shadow-[0_1px_0_0_var(--fuxie-blue-100)]',
                )}
                style={{ height: `${FIXED_TOP_BAR_HEIGHT_PX}px` }}
            >
                <span
                    data-role="exam-timer"
                    aria-label={`Thời gian còn lại ${timer}`}
                    className={fx(
                        'inline-flex items-center justify-center',
                        'rounded-md px-3 py-1.5',
                        'font-mono text-base font-bold tabular-nums',
                        'bg-[var(--fuxie-blue-100)]',
                        'text-[var(--fuxie-blue-900)]',
                    )}
                >
                    {timer}
                </span>
                <span
                    data-role="exam-counter"
                    aria-label={`Đã trả lời ${done} trên ${total} câu`}
                    className={fx(
                        'font-mono text-sm font-semibold tabular-nums',
                        'text-[var(--fuxie-blue-700)]',
                    )}
                >
                    {counter}
                </span>
            </header>

            {/* Question content area — host-supplied. Padding makes room
                for the fixed top bar and fixed bottom CTA so content is
                never occluded. */}
            <div
                data-role="exam-content"
                className="mx-auto w-full max-w-3xl px-4"
                style={{
                    paddingTop: `${FIXED_TOP_BAR_HEIGHT_PX + 16}px`,
                    paddingBottom: `${FIXED_BOTTOM_BAR_HEIGHT_PX + 16}px`,
                }}
            >
                {children}
            </div>

            {/* Fixed bottom: single Primary_CTA "Nộp bài" (Req 10.2). */}
            <div
                data-role="exam-bottom-bar"
                className={fx(
                    'fixed inset-x-0 bottom-0 z-40',
                    'flex items-center justify-center gap-3',
                    'border-t border-[var(--fuxie-blue-200)]',
                    'bg-white/95 px-4 py-3 backdrop-blur',
                )}
                style={{ minHeight: `${FIXED_BOTTOM_BAR_HEIGHT_PX}px` }}
            >
                <PrimaryCta
                    variant="primary"
                    onClick={onSubmit}
                    disabled={submitDisabled}
                    aria-disabled={submitDisabled || undefined}
                    className="w-full max-w-md"
                >
                    {submitLabel}
                </PrimaryCta>
            </div>
        </section>
    )
}
