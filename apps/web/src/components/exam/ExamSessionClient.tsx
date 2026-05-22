'use client'

/**
 * ExamSessionClient — orchestrates the exam in-progress flow.
 *
 * Vai chinh: Frontend Engineer
 * Vai phoi hop: Design System Designer (neutral palette enforcement),
 *               Gamification Designer (sign-off on no-mascot/no-reward)
 *
 * Spec source-of-truth:
 *   - Task 15.1 + 15.2 (gamified-ui-asset-rollout)
 *   - design.md §I.8 (Exam — formal credibility)
 *   - requirements.md Req 10.1, 10.2, 10.3, 10.4, 10.6, 10.7
 *
 * Visual contract for the `'active'` (in-progress) phase:
 *   - Chrome supplied by {@link ExamInProgressChrome} (fixed-top timer
 *     mm:ss + counter `done/total`, fixed-bottom Primary_CTA "Nộp bài").
 *   - Palette restricted to neutral + Bright Sky deep blue (Req 10.4).
 *   - No mascot, no reward animation, no streak chip, no XP/coin badge,
 *     no game sound (Req 10.1).
 *
 * Timer + offline behaviour (Task 15.2):
 *   - Timer countdown + persistence + offline detection are owned by the
 *     {@link useExamProgress} hook (which delegates to the pure FSM in
 *     `lib/exam/exam-timer-controller.ts` and the storage helpers in
 *     `lib/exam/exam-progress-storage.ts`).
 *   - When the timer hits 00:00 the hook fires `onAutoSubmit` within the
 *     2s SLA (Req 10.3) — we route it through the same `handleSubmit`
 *     used by the explicit "Nộp bài" tap.
 *   - On disconnect the chrome's "Nộp bài" CTA is disabled and an
 *     offline overlay surfaces a disabled "Tiếp tục" CTA (Req 10.6 —
 *     "Tiếp tục disabled cho tới khi reconnect").
 *   - A 60-min recovery window restores `answers + remainingMs` from
 *     `localStorage` on reload (Req 10.7).
 *
 * Post-submit completion (Task 15.3):
 *   - On server-confirmed submit, the session does NOT redirect directly.
 *     It mounts {@link ExamResultRewardLoop} with the standard
 *     {@link ResultRewardLoop} FSM (saving → earned → receipt) so the
 *     receipt phase is observable within the 2s SLA (Req 10.5). The loop's
 *     Primary_CTA then navigates to the existing
 *     `/exam/{examId}/result/{attemptId}` deep-dive page.
 *   - The completion handler is intentionally co-located here so the same
 *     submit success path drives both the auto-submit (timer 00:00) and the
 *     explicit "Nộp bài" tap. When the shared completion handler from
 *     Task 12.1 (`apps/web/src/components/gamification/completion-flow.tsx`)
 *     lands, this wrapper can be lifted into it without changing the
 *     surface contract — the receipt CTA target stays the same.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

import { ExamInProgressChrome } from './ExamInProgressChrome'
import { ExamResultRewardLoop, type ExamSubmitResult } from './ExamResultRewardLoop'
import { useExamProgress } from '@/hooks/use-exam-progress'

/* ── Task types matching the DB schema ── */
interface ExamTask {
    id: string
    title: string
    exerciseType: string
    contentJson: Record<string, unknown>
    audioUrl: string | null
    imageUrl: string | null
    maxPoints: number
}

interface ExamSection {
    id: string
    title: string
    skill: string
    totalMinutes: number
    totalPoints: number
    instructions: string | null
    tasks: ExamTask[]
}

interface ExamData {
    id: string
    title: string
    examType: string
    cefrLevel: string
    totalMinutes: number
    totalPoints: number
    passingScore: number
    sections: ExamSection[]
}

/* ── Renderers ── */
import { MCRenderer } from './renderers/MCRenderer'
import { TFRenderer } from './renderers/TFRenderer'
import { MatchingRenderer } from './renderers/MatchingRenderer'
import { GapFillRenderer } from './renderers/GapFillRenderer'
import { ExamAudioPlayer } from './ExamAudioPlayer'

/* ── Skill labels (Vietnamese, neutral; no game iconography during in-progress) ── */
const SKILL_LABEL: Record<string, string> = {
    LESEN: 'Đọc',
    HOEREN: 'Nghe',
    SCHREIBEN: 'Viết',
    SPRECHEN: 'Nói',
}

type Phase = 'loading' | 'ready' | 'active' | 'submitting' | 'result' | 'error'

export function ExamSessionClient({ examId }: { examId: string }) {
    const router = useRouter()
    const [phase, setPhase] = useState<Phase>('loading')
    const [exam, setExam] = useState<ExamData | null>(null)
    const [attemptId, setAttemptId] = useState('')
    // Submit result captured from the server. Lifted to the page level so
    // the post-submit Result_Reward_Loop receives accurate XP / score /
    // pass data for the receipt phase (Req 7.3 / 10.5).
    const [submitResult, setSubmitResult] = useState<ExamSubmitResult | null>(
        null,
    )

    // Start exam
    const startExam = useCallback(async () => {
        try {
            const res = await fetch(`/api/v1/exams/${examId}/start`, {
                method: 'POST',
            })
            const data = await res.json()
            if (!data.success) throw new Error(data.error)

            setExam(data.data.exam)
            setAttemptId(data.data.attemptId)
            setPhase('active')
        } catch (err) {
            console.error('Start exam error:', err)
            setPhase('error')
        }
    }, [examId])

    useEffect(() => {
        startExam()
    }, [startExam])

    if (phase === 'loading') {
        return (
            <div className="flex h-[60vh] items-center justify-center">
                <div className="text-center">
                    <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-[var(--fuxie-blue-200)] border-t-[var(--fuxie-action)]" />
                    <p className="text-sm text-[var(--fuxie-blue-700)]">
                        Đang tải bài thi...
                    </p>
                </div>
            </div>
        )
    }

    if (phase === 'error' || !exam) {
        return (
            <div className="flex h-[60vh] items-center justify-center">
                <div className="text-center">
                    <p className="mb-2 text-sm text-[var(--fuxie-blue-900)]">
                        Không tải được bài thi
                    </p>
                    <button
                        onClick={() => router.push('/exam')}
                        className="text-sm text-[var(--fuxie-action)] underline"
                    >
                        Về danh sách
                    </button>
                </div>
            </div>
        )
    }

    // Task 15.3 — post-submit Result_Reward_Loop. Mounted as soon as the
    // server confirms the submission so the earned phase is observable
    // within 2s of the submit confirm (Req 10.5). The legacy redirect to
    // `/exam/{examId}/result/{attemptId}` is now driven by the loop's
    // receipt Primary_CTA instead of firing on `onSubmitSuccess`.
    if (phase === 'result' && submitResult) {
        return (
            <ExamResultRewardLoop
                examId={examId}
                attemptId={attemptId}
                exam={exam}
                result={submitResult}
                onContinue={() =>
                    router.push(`/exam/${examId}/result/${attemptId}`)
                }
            />
        )
    }

    return (
        <ExamActiveSession
            examId={examId}
            attemptId={attemptId}
            exam={exam}
            isSubmitting={phase === 'submitting'}
            onSubmitStart={() => setPhase('submitting')}
            onSubmitFail={() => setPhase('active')}
            onSubmitSuccess={(result) => {
                setSubmitResult(result)
                setPhase('result')
            }}
        />
    )
}

// -----------------------------------------------------------------------------
// Active session (mounted only once exam data is ready so the timer hook
// bootstraps with a valid `totalMs` seed).
// -----------------------------------------------------------------------------

interface ExamActiveSessionProps {
    examId: string
    attemptId: string
    exam: ExamData
    isSubmitting: boolean
    onSubmitStart: () => void
    onSubmitFail: () => void
    onSubmitSuccess: (result: ExamSubmitResult) => void
}

function ExamActiveSession({
    examId,
    attemptId,
    exam,
    isSubmitting,
    onSubmitStart,
    onSubmitFail,
    onSubmitSuccess,
}: ExamActiveSessionProps) {
    const [currentSectionIdx, setCurrentSectionIdx] = useState(0)
    const [currentTaskIdx, setCurrentTaskIdx] = useState(0)
    const [answers, setAnswers] = useState<
        Record<string, Record<string, unknown>>
    >({})
    const [showSubmitModal, setShowSubmitModal] = useState(false)

    const totalMs = exam.totalMinutes * 60 * 1000
    const totalTasks = exam.sections.reduce((s, sec) => s + sec.tasks.length, 0)
    const answeredCount = Object.keys(answers).length

    // Latest-answers ref so the 5s save interval reads the fresh payload.
    const answersRef = useRef(answers)
    useEffect(() => {
        answersRef.current = answers
    }, [answers])

    // Submit network call (factored out so it can be invoked by the
    // timer expiry path AND the explicit "Nộp bài" tap).
    const submitInFlightRef = useRef(false)
    // Forward-declared so handleSubmit can reach into the latest progress
    // API (markSubmitting / clear) without depending on the hook result
    // (depending on it would re-create handleSubmit on every tick).
    const progressApiRef = useRef<{
        markSubmitting: () => void
        clear: () => void
    } | null>(null)
    const handleSubmit = useCallback(async () => {
        if (submitInFlightRef.current) return
        submitInFlightRef.current = true
        onSubmitStart()
        progressApiRef.current?.markSubmitting()

        try {
            const allTasks = exam.sections.flatMap(s => s.tasks)
            const answerPayload = allTasks.map(task => ({
                taskId: task.id,
                answerJson: answersRef.current[task.id] ?? {},
            }))

            const res = await fetch(`/api/v1/exams/${examId}/submit`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ attemptId, answers: answerPayload }),
            })
            const data = await res.json()
            if (data.success) {
                progressApiRef.current?.clear()
                // Forward the server-confirmed result so the post-submit
                // Result_Reward_Loop (Task 15.3) can render an accurate
                // receipt phase. The shape mirrors the API response
                // documented in `app/api/v1/exams/[examId]/submit/route.ts`.
                onSubmitSuccess(data.data as ExamSubmitResult)
            } else {
                throw new Error(data.error ?? 'Submit failed')
            }
        } catch (err) {
            console.error('Submit error:', err)
            submitInFlightRef.current = false
            onSubmitFail()
        }
    }, [attemptId, exam, examId, onSubmitFail, onSubmitStart, onSubmitSuccess])

    // The hook needs a stable `onAutoSubmit` reference but we want to
    // invoke the latest `handleSubmit` — bridge through a ref.
    const handleSubmitRef = useRef(handleSubmit)
    useEffect(() => {
        handleSubmitRef.current = handleSubmit
    }, [handleSubmit])

    const onAutoSubmit = useCallback(() => {
        // Req 10.3 — "Timer 00:00 → auto-submit trong 2s". The hook
        // schedules this via setTimeout(0), well inside the SLA.
        handleSubmitRef.current()
    }, [])

    const progress = useExamProgress({
        examId,
        totalMs,
        enabled: true,
        onAutoSubmit,
        getAnswers: () => answersRef.current,
    })

    // Expose the hook's imperative API to handleSubmit via ref so the
    // useCallback above does not need to depend on the hook result
    // (which would re-create handleSubmit every tick).
    useEffect(() => {
        progressApiRef.current = progress
    }, [progress])

    const updateAnswer = (taskId: string, answer: Record<string, unknown>) => {
        setAnswers(prev => ({ ...prev, [taskId]: answer }))
    }

    const section = exam.sections[currentSectionIdx]
    const task = section?.tasks[currentTaskIdx]

    const goNext = () => {
        if (section && currentTaskIdx < section.tasks.length - 1) {
            setCurrentTaskIdx(currentTaskIdx + 1)
        } else if (currentSectionIdx < exam.sections.length - 1) {
            setCurrentSectionIdx(currentSectionIdx + 1)
            setCurrentTaskIdx(0)
        }
    }

    const goPrev = () => {
        if (currentTaskIdx > 0) {
            setCurrentTaskIdx(currentTaskIdx - 1)
        } else if (currentSectionIdx > 0) {
            const prevSection = exam.sections[currentSectionIdx - 1]
            setCurrentSectionIdx(currentSectionIdx - 1)
            setCurrentTaskIdx(prevSection ? prevSection.tasks.length - 1 : 0)
        }
    }

    const isLast =
        currentSectionIdx === exam.sections.length - 1 &&
        section &&
        currentTaskIdx === section.tasks.length - 1
    const isAtFirst = currentSectionIdx === 0 && currentTaskIdx === 0

    const remainingSeconds = Math.floor(progress.remainingMs / 1000)

    return (
        <ExamInProgressChrome
            remainingSeconds={remainingSeconds}
            done={answeredCount}
            total={totalTasks}
            onSubmit={() => setShowSubmitModal(true)}
            // Req 10.6 — disable the "Nộp bài" tap while offline so the
            // learner cannot trigger a submit that would race the
            // disconnect-pause. Submit also stays disabled while a request
            // is in-flight or while the confirm modal is open (Property 8
            // — exactly one Primary_CTA per state).
            submitDisabled={
                isSubmitting || showSubmitModal || progress.isPaused
            }
        >
            {/* Section tabs — neutral surface, deep blue active state. */}
            <div
                data-role="exam-section-tabs"
                className="mb-4 flex flex-wrap gap-1.5"
            >
                {exam.sections.map((sec, idx) => (
                    <button
                        key={sec.id}
                        type="button"
                        onClick={() => {
                            setCurrentSectionIdx(idx)
                            setCurrentTaskIdx(0)
                        }}
                        aria-current={idx === currentSectionIdx || undefined}
                        className={
                            idx === currentSectionIdx
                                ? 'rounded-lg border border-[var(--fuxie-blue-400)] bg-[var(--fuxie-blue-100)] px-3 py-1.5 text-xs font-semibold text-[var(--fuxie-blue-900)]'
                                : 'rounded-lg border border-transparent bg-[var(--fuxie-blue-50)] px-3 py-1.5 text-xs font-medium text-[var(--fuxie-blue-700)] hover:bg-[var(--fuxie-blue-100)]'
                        }
                    >
                        {SKILL_LABEL[sec.skill] ?? sec.title}
                    </button>
                ))}
            </div>

            {/* Task dots — neutral palette only. */}
            {section && (
                <div
                    data-role="exam-task-dots"
                    className="mb-6 flex flex-wrap gap-1.5"
                >
                    {section.tasks.map((t, idx) => {
                        const isCurrent = idx === currentTaskIdx
                        const isAnswered = Boolean(answers[t.id])
                        const cls = isCurrent
                            ? 'h-8 w-8 rounded-lg bg-[var(--fuxie-action)] text-xs font-semibold text-white shadow-sm'
                            : isAnswered
                              ? 'h-8 w-8 rounded-lg border border-[var(--fuxie-blue-400)] bg-[var(--fuxie-blue-100)] text-xs font-semibold text-[var(--fuxie-blue-900)]'
                              : 'h-8 w-8 rounded-lg bg-[var(--fuxie-blue-50)] text-xs font-medium text-[var(--fuxie-blue-700)] hover:bg-[var(--fuxie-blue-100)]'
                        return (
                            <button
                                key={t.id}
                                type="button"
                                onClick={() => setCurrentTaskIdx(idx)}
                                aria-current={isCurrent || undefined}
                                aria-label={`Câu ${idx + 1}${
                                    isAnswered ? ' — đã trả lời' : ''
                                }`}
                                className={cls}
                            >
                                {idx + 1}
                            </button>
                        )
                    })}
                </div>
            )}

            {/* Question content card */}
            {task && (
                <div
                    data-role="exam-question-card"
                    className="mb-6 min-h-[400px] rounded-2xl border border-[var(--fuxie-blue-200)] bg-white p-6"
                >
                    {!!(
                        task.audioUrl ||
                        (task.contentJson as Record<string, unknown>)
                            .audioTranscript
                    ) && (
                        <ExamAudioPlayer
                            src={task.audioUrl}
                            transcript={
                                (task.contentJson as Record<string, unknown>)
                                    .audioTranscript as string
                            }
                            maxPlays={2}
                            label={
                                section?.skill === 'HOEREN'
                                    ? 'Bài nghe'
                                    : undefined
                            }
                        />
                    )}
                    <h3 className="mb-4 text-sm font-semibold text-[var(--fuxie-blue-700)]">
                        {task.title}
                    </h3>

                    {task.exerciseType === 'MULTIPLE_CHOICE' && (
                        <MCRenderer
                            content={task.contentJson}
                            answer={answers[task.id] ?? {}}
                            onChange={a => updateAnswer(task.id, a)}
                        />
                    )}
                    {task.exerciseType === 'TRUE_FALSE' && (
                        <TFRenderer
                            content={task.contentJson}
                            answer={answers[task.id] ?? {}}
                            onChange={a => updateAnswer(task.id, a)}
                        />
                    )}
                    {task.exerciseType === 'MATCHING' && (
                        <MatchingRenderer
                            content={task.contentJson}
                            answer={answers[task.id] ?? {}}
                            onChange={a => updateAnswer(task.id, a)}
                        />
                    )}
                    {task.exerciseType === 'FILL_IN_BLANK' && (
                        <GapFillRenderer
                            content={task.contentJson}
                            answer={answers[task.id] ?? {}}
                            onChange={a => updateAnswer(task.id, a)}
                        />
                    )}
                </div>
            )}

            {/* Prev / Next navigation — neutral, deep blue only. */}
            <div
                data-role="exam-question-nav"
                className="mb-4 flex justify-between"
            >
                <button
                    type="button"
                    onClick={goPrev}
                    disabled={isAtFirst}
                    className="rounded-xl bg-[var(--fuxie-blue-100)] px-4 py-2 text-sm font-medium text-[var(--fuxie-blue-700)] transition-opacity hover:bg-[var(--fuxie-blue-200)] disabled:cursor-not-allowed disabled:opacity-40"
                >
                    Câu trước
                </button>
                {isLast ? (
                    <span
                        aria-hidden="true"
                        className="text-xs text-[var(--fuxie-blue-600)]"
                    />
                ) : (
                    <button
                        type="button"
                        onClick={goNext}
                        className="rounded-xl border border-[var(--fuxie-blue-400)] bg-white px-4 py-2 text-sm font-semibold text-[var(--fuxie-blue-700)] hover:bg-[var(--fuxie-blue-50)]"
                    >
                        Câu tiếp theo
                    </button>
                )}
            </div>

            {/* Submit confirmation modal — neutral + deep blue palette only. */}
            {showSubmitModal && (
                <div
                    role="dialog"
                    aria-modal="true"
                    aria-label="Xác nhận nộp bài"
                    className="fixed inset-0 z-50 flex items-center justify-center bg-[color:rgba(23,59,86,0.45)] px-4"
                >
                    <div className="w-full max-w-sm rounded-2xl border border-[var(--fuxie-blue-200)] bg-white p-6 shadow-xl">
                        <h3 className="mb-2 text-lg font-bold text-[var(--fuxie-blue-900)]">
                            Nộp bài thi?
                        </h3>
                        <p className="mb-1 text-sm text-[var(--fuxie-blue-700)]">
                            Đã trả lời: {answeredCount} / {totalTasks}
                        </p>
                        <p className="mb-4 font-mono text-xs tabular-nums text-[var(--fuxie-blue-600)]">
                            Còn lại{' '}
                            {String(Math.floor(remainingSeconds / 60)).padStart(
                                2,
                                '0',
                            )}
                            :
                            {String(remainingSeconds % 60).padStart(2, '0')}
                        </p>
                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={() => setShowSubmitModal(false)}
                                className="flex-1 rounded-xl border border-[var(--fuxie-blue-200)] bg-white py-2 text-sm font-medium text-[var(--fuxie-blue-700)] hover:bg-[var(--fuxie-blue-50)]"
                            >
                                Tiếp tục làm bài
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setShowSubmitModal(false)
                                    void handleSubmit()
                                }}
                                disabled={isSubmitting}
                                data-role="primary-cta"
                                className="flex-1 rounded-xl bg-[var(--fuxie-action)] py-2 text-sm font-semibold text-white shadow-sm hover:bg-[var(--fuxie-action-hover)] disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {isSubmitting ? 'Đang nộp...' : 'Nộp bài'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Disconnect overlay — Req 10.6. While the device is offline
                the timer is paused, "Tiếp tục" stays disabled, and the
                explicit "Nộp bài" CTA in the chrome is also disabled.
                Local progress keeps saving every 5 seconds while online,
                so a refresh inside the 60-min recovery window restores
                the latest snapshot (Req 10.7). */}
            {progress.isPaused && !showSubmitModal && (
                <div
                    role="alertdialog"
                    aria-modal="false"
                    aria-live="polite"
                    aria-label="Mất kết nối"
                    data-role="exam-offline-overlay"
                    className="fixed inset-x-0 bottom-24 z-40 mx-auto w-[min(420px,calc(100%-2rem))] rounded-2xl border border-[var(--fuxie-blue-200)] bg-white px-4 py-3 shadow-lg"
                >
                    <p className="mb-1 text-sm font-semibold text-[var(--fuxie-blue-900)]">
                        Mất kết nối
                    </p>
                    <p className="mb-3 text-xs text-[var(--fuxie-blue-700)]">
                        Bài thi đã tạm dừng. Câu trả lời được lưu cục bộ. Khi
                        kết nối trở lại, bấm "Tiếp tục" để làm tiếp.
                    </p>
                    <button
                        type="button"
                        disabled
                        aria-disabled="true"
                        data-role="exam-resume-cta"
                        className="w-full rounded-xl bg-[var(--fuxie-blue-100)] py-2 text-sm font-semibold text-[var(--fuxie-blue-600)] opacity-60 cursor-not-allowed"
                    >
                        Tiếp tục
                    </button>
                </div>
            )}
        </ExamInProgressChrome>
    )
}
