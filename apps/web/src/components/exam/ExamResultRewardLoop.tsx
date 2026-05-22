'use client'

/**
 * ExamResultRewardLoop — post-submit completion handler for the exam surface.
 *
 * Vai chinh: Frontend Engineer
 * Vai phoi hop: Gamification Designer (CTA copy + cheer rules)
 *
 * Spec source-of-truth:
 *   - Task 15.3 (gamified-ui-asset-rollout)
 *   - design.md §D (Result_Reward_Loop FSM)
 *   - requirements.md Req 7.1, 7.2, 7.3, 7.4, 10.5
 *
 * Why this exists:
 *   The exam in-progress chrome (Task 15.1 / 15.2) deliberately strips all
 *   reward visuals (Req 10.1, 10.4) so a learner cannot be distracted while
 *   answering. After server-confirmed submission the spec requires the
 *   `<ResultRewardLoop>` to mount within 2s and surface the earned phase
 *   (Req 10.5 — "Result_Reward_Loop activates within 2 seconds of submit
 *   confirm"). This component is the seam.
 *
 * Why we delegate to {@link CompletionFlow} (Task 12.1):
 *   The shared completion handler enforces the 1.2–2.0s earned window,
 *   the retry chain, and the canonical CTA labels in one place. The exam
 *   submit is `mode='alreadySaved'` because the server already persisted
 *   the result before this component mounts (the page only flips to
 *   the `'result'` phase after `data.success === true`). Vocabulary
 *   microgames + listening sessions reuse the same flow with
 *   `mode='save'`, keeping the surface contract identical across skills.
 *
 * Surface contract:
 *   - The receipt's Primary_CTA invokes the supplied `onContinue` handler
 *     so the page (which knows the routing target) can navigate to
 *     `/exam/{examId}/result/{attemptId}`.
 *   - The component does NOT auto-redirect — the redirect is the
 *     learner's tap, deliberate per design §I.5.
 */

import { useCallback } from 'react'

import { CompletionFlow } from '@/components/gamification/completion-flow'
import { type RewardPreviewItem } from '@/components/gamification/quest-visuals'

// Local mirror of the `data.data` shape returned by
// `POST /api/v1/exams/[examId]/submit` — kept narrow so this component
// does not depend on the route's internal type aliases.
export interface ExamSubmitResult {
    attemptId: string
    totalScore: number
    maxScore: number
    percentScore: number
    passed: boolean
    xpEarned: number
    streak?: {
        currentStreak: number
        freezesAvailable?: number
        freezesUsed?: number
        freezeUsed?: boolean
    } | null
    sectionScores?: Array<{ score: number; maxScore: number; skill: string }>
    answers?: unknown
}

interface ExamSummary {
    title: string
    cefrLevel: string
    examType: string
    totalMinutes: number
}

interface ExamResultRewardLoopProps {
    examId: string
    attemptId: string
    exam: ExamSummary
    result: ExamSubmitResult
    /**
     * Receipt Primary_CTA handler. The default tap target is "Học bài kế
     * tiếp" / "Tiếp tục" (resolved by {@link CompletionFlow}). The
     * navigation target is owned by the caller so the page can route to
     * the deep-dive `/exam/{examId}/result/{attemptId}` view.
     */
    onContinue: () => void
}

export function ExamResultRewardLoop({
    examId: _examId,
    attemptId: _attemptId,
    exam,
    result,
    onContinue,
}: ExamResultRewardLoopProps) {
    const passed = result.passed
    const xpEarned = Math.max(0, Math.round(result.xpEarned ?? 0))
    const accuracy = Math.max(0, Math.min(100, Math.round(result.percentScore)))

    // Reward preview matches the convention used by `exercise-results.tsx`:
    // `xp` always present, optional `badge` for a passing attempt, optional
    // `streak` chip when the streak is active.
    const rewardPreview: RewardPreviewItem[] = [
        {
            type: 'xp',
            label: `+${xpEarned} XP`,
            detail: passed
                ? 'Phần thưởng kỳ thi'
                : 'Phần thưởng tham dự',
        },
        ...(passed
            ? [
                  {
                      type: 'badge' as const,
                      label: `${exam.cefrLevel} Mock`,
                      detail: 'Đã vượt ải',
                  },
              ]
            : []),
        ...(result.streak && result.streak.currentStreak > 0
            ? [
                  {
                      type: 'streak' as const,
                      label: result.streak.freezeUsed
                          ? 'Khiên đã dùng'
                          : 'Streak',
                      detail: `${result.streak.currentStreak} ngày`,
                  },
              ]
            : []),
    ]

    const title = passed
        ? `Chinh phục ${exam.title}`
        : `Đã nộp ${exam.title}`
    const message = passed
        ? `Em đã đạt ${accuracy}% — sẵn sàng cho mocktest tiếp theo cùng cấp độ ${exam.cefrLevel}.`
        : `Đáp án đã được khoá. Cùng xem lại điểm yếu để chuẩn bị tốt hơn cho ${exam.cefrLevel}.`

    // The save already happened server-side. The completion-flow's
    // `alreadySaved` mode runs the FSM with `Promise.resolve()`, so the
    // earned phase is observable on the next microtask — well within
    // Req 10.5's 2s SLA from submit confirm.
    const confirmSave = useCallback(() => Promise.resolve(), [])

    return (
        <div
            className="mx-auto max-w-4xl px-4 py-8"
            data-surface-id="exam"
            data-exam-state="result"
        >
            <CompletionFlow
                mode="alreadySaved"
                confirmSave={confirmSave}
                skill="exam"
                title={title}
                message={message}
                scoreLabel={`${result.totalScore}/${result.maxScore}`}
                scoreDetail={passed ? 'Đã đạt' : 'Chưa đạt'}
                accuracy={accuracy}
                xpEarned={xpEarned}
                graded
                rewardPreview={rewardPreview}
                streakReceipt={
                    result.streak
                        ? {
                              freezeUsed: Boolean(result.streak.freezeUsed),
                              currentStreak: result.streak.currentStreak,
                              freezesAvailable:
                                  result.streak.freezesAvailable ?? 0,
                              freezesUsed: result.streak.freezesUsed ?? 0,
                          }
                        : undefined
                }
                // The exam result page is always the next step after a
                // submit — `hasNextStep=true` resolves the canonical
                // "Học bài kế tiếp" CTA per Req 7.4.
                hasNextStep
                primaryAction={{
                    label: 'Xem chi tiết',
                    onClick: onContinue,
                    ariaLabel: 'Xem chi tiết kết quả bài thi',
                }}
                secondaryAction={{
                    label: 'Thi lại',
                    onClick: onContinue,
                    ariaLabel: 'Thi lại bài thi',
                }}
                dashboardAction={{ label: 'Về Dashboard', href: '/dashboard' }}
            />
        </div>
    )
}
