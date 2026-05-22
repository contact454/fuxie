'use client'

import { useState, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import {
    createPlacementState,
    getNextQuestion,
    processAnswer,
    calculateResult,
    type PlacementState,
} from '@/lib/placement/engine'
import type { PlacementLevel } from '@/data/placement-questions'
import { getFuxieMascotSrc } from '@/lib/mascot/fuxie-assets'

type Step = 'welcome' | 'goal' | 'daily-time' | 'placement' | 'result'

const EXAM_OPTIONS = [
    { value: 'GOETHE', label: 'Goethe-Zertifikat', emoji: '🏛️', desc: 'Viện Goethe' },
    { value: 'TELC', label: 'telc', emoji: '📋', desc: 'Tổ chức telc' },
    { value: 'OESD', label: 'ÖSD', emoji: '🇦🇹', desc: 'Chứng chỉ Áo' },
    { value: null, label: 'Chỉ muốn học', emoji: '🦊', desc: 'Không thi' },
] as const

const DAILY_TIME_OPTIONS = [
    { value: 5, label: '5 phút', desc: 'Một bước nhỏ mỗi ngày' },
    { value: 10, label: '10 phút', desc: 'Nhịp học gọn và đều' },
    { value: 20, label: '20 phút', desc: 'Tiến bộ rõ mỗi buổi' },
    { value: 30, label: '30 phút', desc: 'Tăng tốc nếu có thời gian' },
] as const

const LEVEL_INFO: Record<PlacementLevel, { color: string; label: string; desc: string }> = {
    A1: { color: 'var(--color-text-success)', label: 'A1 — Anfänger', desc: 'Chào hỏi, giới thiệu bản thân' },
    A2: { color: "var(--color-text-success)", label: 'A2 — Grundstufe', desc: 'Giao tiếp đơn giản hàng ngày' },
    B1: { color: "var(--color-text-brand)", label: 'B1 — Mittelstufe', desc: 'Tự tin giải quyết tình huống' },
    B2: { color: 'var(--color-cefr-b2)', label: 'B2 — Oberstufe', desc: 'Thảo luận chủ đề phức tạp' },
    C1: { color: 'var(--color-cefr-c1)', label: 'C1 — Fortgeschritten', desc: 'Sử dụng thành thạo linh hoạt' },
    C2: { color: 'var(--color-cefr-c1)', label: 'C2 — Meisterstufe', desc: 'Gần như bản ngữ' },
}

export function OnboardingWizard() {
    const router = useRouter()
    const [step, setStep] = useState<Step>('welcome')
    const [saving, setSaving] = useState(false)
    const [saveError, setSaveError] = useState<string | null>(null)

    // Goal state
    const [targetExam, setTargetExam] = useState<string | null>(null)
    const [targetLevel, setTargetLevel] = useState<PlacementLevel>('B1')
    const [dailyStudyMinutes, setDailyStudyMinutes] = useState<number>(10)

    // Placement state
    const [placementState, setPlacementState] = useState<PlacementState>(createPlacementState)
    const [currentQuestion, setCurrentQuestion] = useState(getNextQuestion(createPlacementState()))
    const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
    const [showFeedback, setShowFeedback] = useState(false)
    const [lastCorrect, setLastCorrect] = useState(false)

    // Result
    const [result, setResult] = useState<ReturnType<typeof calculateResult> | null>(null)

    const progress = useMemo(() => {
        const steps: Step[] = ['welcome', 'goal', 'daily-time', 'placement', 'result']
        return ((steps.indexOf(step) + 1) / steps.length) * 100
    }, [step])

    // ===== HANDLERS =====

    const handleDailyTimeNext = useCallback(() => {
        const state = createPlacementState()
        setPlacementState(state)
        setCurrentQuestion(getNextQuestion(state))
        setStep('placement')
    }, [])

    const handleAnswer = useCallback((index: number) => {
        if (showFeedback || !currentQuestion) return

        setSelectedAnswer(index)
        setShowFeedback(true)

        const { correct, newState } = processAnswer(placementState, currentQuestion, index)
        setLastCorrect(correct)

        // Wait for feedback animation, then advance
        setTimeout(() => {
            setPlacementState(newState)
            const next = getNextQuestion(newState)

            if (!next) {
                // Test complete
                setResult(calculateResult(newState))
                setStep('result')
            } else {
                setCurrentQuestion(next)
                setSelectedAnswer(null)
                setShowFeedback(false)
            }
        }, 1200)
    }, [showFeedback, currentQuestion, placementState])

    const handleComplete = useCallback(async () => {
        if (!result) return
        setSaving(true)
        setSaveError(null)

        try {
            const response = await fetch('/api/v1/auth/onboarding', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    estimatedLevel: result.estimatedLevel,
                    targetLevel,
                    targetExam,
                    targetExamDate: null,
                    studyGoalMinutes: dailyStudyMinutes,
                }),
            })
            if (!response.ok) {
                throw new Error('Failed to save onboarding')
            }
            router.push('/dashboard')
        } catch (err) {
            console.error('[Onboarding] Save error:', err)
            setSaveError('Không lưu được lộ trình. Kiểm tra kết nối và thử lại nhé.')
            setSaving(false)
            return
        }
    }, [result, targetLevel, targetExam, dailyStudyMinutes, router])

    // ===== RENDER =====

    return (
        <div className="min-h-[100dvh] bg-gradient-to-br from-[#F3FBFF] via-white to-blue-50 flex flex-col">
            {/* Progress Bar */}
            <div className="h-1.5 bg-gray-100">
                <div
                    className="h-full bg-gradient-to-r from-[#60A8E4] to-[#3C78A8] transition-all duration-500 ease-out"
                    style={{ width: `${progress}%` }}
                />
            </div>

            {/* Content */}
            <div className="flex-1 flex items-center justify-center p-4">
                {step === 'welcome' && (
                    <WelcomeStep onNext={() => setStep('goal')} />
                )}
                {step === 'goal' && (
                    <GoalStep
                        targetExam={targetExam}
                        targetLevel={targetLevel}
                        onExamChange={setTargetExam}
                        onLevelChange={setTargetLevel}
                        onNext={() => setStep('daily-time')}
                    />
                )}
                {step === 'daily-time' && (
                    <DailyTimeStep
                        dailyStudyMinutes={dailyStudyMinutes}
                        onDailyStudyMinutesChange={setDailyStudyMinutes}
                        onNext={handleDailyTimeNext}
                    />
                )}
                {step === 'placement' && currentQuestion && (
                    <PlacementStep
                        question={currentQuestion}
                        questionNumber={placementState.totalAnswered + 1}
                        totalQuestions={placementState.maxQuestions}
                        selectedAnswer={selectedAnswer}
                        showFeedback={showFeedback}
                        lastCorrect={lastCorrect}
                        onAnswer={handleAnswer}
                    />
                )}
                {step === 'result' && result && (
                    <ResultStep
                        result={result}
                        targetLevel={targetLevel}
                        targetExam={targetExam}
                        dailyStudyMinutes={dailyStudyMinutes}
                        saving={saving}
                        saveError={saveError}
                        onComplete={handleComplete}
                    />
                )}
            </div>
        </div>
    )
}

// ===== STEP COMPONENTS =====

function DailyTimeStep({
    dailyStudyMinutes,
    onDailyStudyMinutesChange,
    onNext,
}: {
    dailyStudyMinutes: number
    onDailyStudyMinutesChange: (value: number) => void
    onNext: () => void
}) {
    return (
        <div className="max-w-lg w-full animate-fade-in-up">
            <h2 className="text-2xl font-bold text-center mb-1">Thời gian học mỗi ngày</h2>
            <p className="text-gray-400 text-center text-sm mb-6">
                Chọn mục tiêu linh hoạt để Fuxie gợi ý quest vừa sức.
            </p>

            <div className="grid grid-cols-1 gap-3 mb-8 sm:grid-cols-2">
                {DAILY_TIME_OPTIONS.map((option) => (
                    <button
                        key={option.value}
                        type="button"
                        onClick={() => onDailyStudyMinutesChange(option.value)}
                        aria-pressed={dailyStudyMinutes === option.value}
                        className={`rounded-xl border-2 p-4 text-left transition-all ${
                            dailyStudyMinutes === option.value
                                ? 'border-[#60A8E4] bg-[#F3FBFF] shadow-sm'
                                : 'border-gray-200 hover:border-gray-300'
                        }`}
                    >
                        <div className="text-lg font-bold text-gray-900">{option.label}</div>
                        <div className="mt-1 text-sm text-gray-500">{option.desc}</div>
                    </button>
                ))}
            </div>

            <button
                onClick={onNext}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#60A8E4] to-[#3C78A8] text-white font-semibold hover:shadow-lg hover:shadow-sky-200 transition-all active:scale-[0.98]"
            >
                Tiếp theo: Kiểm tra trình độ →
            </button>
        </div>
    )
}

function WelcomeStep({ onNext }: { onNext: () => void }) {
    return (
        <div className="text-center max-w-md animate-fade-in-up">
            <div className="mb-6 relative">
                <Image
                    src={getFuxieMascotSrc('authWelcomer')}
                    alt="Fuxie"
                    width={140}
                    height={140}
                    className="mx-auto object-contain drop-shadow-lg animate-bounce-slow"
                />
            </div>
            <h1 className="text-3xl font-bold mb-2">
                Willkommen bei{' '}
                <span className="bg-gradient-to-r from-[#60A8E4] to-[#3C78A8] bg-clip-text text-transparent">
                    Fuxie
                </span>
                ! 🦊
            </h1>
            <p className="text-gray-500 mb-2 text-lg">
                Chào mừng bạn đến với hành trình học tiếng Đức!
            </p>
            <p className="text-gray-400 text-sm mb-8 leading-relaxed">
                Em là Fuxie — trợ lý AI giúp bạn học tiếng Đức theo chuẩn CEFR.
                <br />
                Hãy để em tìm hiểu trình độ của bạn nhé!
            </p>
            <button
                onClick={onNext}
                className="w-full max-w-xs mx-auto py-3.5 px-8 rounded-xl bg-gradient-to-r from-[#60A8E4] to-[#3C78A8] text-white font-semibold text-base hover:shadow-lg hover:shadow-sky-200 transition-all active:scale-[0.98]"
            >
                Bắt đầu nào! →
            </button>
        </div>
    )
}

function GoalStep({
    targetExam,
    targetLevel,
    onExamChange,
    onLevelChange,
    onNext,
}: {
    targetExam: string | null
    targetLevel: PlacementLevel
    onExamChange: (v: string | null) => void
    onLevelChange: (v: PlacementLevel) => void
    onNext: () => void
}) {
    return (
        <div className="max-w-lg w-full animate-fade-in-up">
            <h2 className="text-2xl font-bold text-center mb-1">🎯 Mục tiêu của bạn</h2>
            <p className="text-gray-400 text-center text-sm mb-6">
                Chọn kỳ thi và trình độ mong muốn
            </p>

            {/* Exam Type */}
            <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-600 mb-2">
                    Bạn muốn thi gì?
                </label>
                <div className="grid grid-cols-1 gap-2">
                    {EXAM_OPTIONS.map((opt) => (
                        <button
                            key={opt.label}
                            onClick={() => onExamChange(opt.value)}
                            className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${
                                targetExam === opt.value
                                    ? 'border-[#60A8E4] bg-[#F3FBFF] shadow-sm'
                                    : 'border-gray-200 hover:border-gray-300'
                            }`}
                        >
                            <span className="text-2xl">{opt.emoji}</span>
                            <div>
                                <div className="font-semibold text-sm text-gray-800">{opt.label}</div>
                                <div className="text-xs text-gray-400">{opt.desc}</div>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Target Level */}
            <div className="mb-8">
                <label className="block text-sm font-semibold text-gray-600 mb-2">
                    Trình độ mục tiêu
                </label>
                <div className="grid grid-cols-3 gap-2">
                    {(Object.keys(LEVEL_INFO) as PlacementLevel[]).map((level) => {
                        const info = LEVEL_INFO[level]
                        return (
                            <button
                                key={level}
                                onClick={() => onLevelChange(level)}
                                className={`p-3 rounded-xl border-2 transition-all text-center ${
                                    targetLevel === level
                                        ? 'border-[#60A8E4] bg-[#F3FBFF] shadow-sm'
                                        : 'border-gray-200 hover:border-gray-300'
                                }`}
                            >
                                <div
                                    className="text-lg font-bold"
                                    style={{ color: info.color }}
                                >
                                    {level}
                                </div>
                                <div className="text-xs text-gray-400 leading-tight mt-1">
                                    {info.desc}
                                </div>
                            </button>
                        )
                    })}
                </div>
            </div>

            <button
                onClick={onNext}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#60A8E4] to-[#3C78A8] text-white font-semibold hover:shadow-lg hover:shadow-sky-200 transition-all active:scale-[0.98]"
            >
                Tiếp theo: Kiểm tra trình độ →
            </button>
        </div>
    )
}

function PlacementStep({
    question,
    questionNumber,
    totalQuestions,
    selectedAnswer,
    showFeedback,
    lastCorrect,
    onAnswer,
}: {
    question: ReturnType<typeof getNextQuestion>
    questionNumber: number
    totalQuestions: number
    selectedAnswer: number | null
    showFeedback: boolean
    lastCorrect: boolean
    onAnswer: (index: number) => void
}) {
    if (!question) return null

    return (
        <div className="max-w-lg w-full animate-fade-in-up">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium text-gray-400">
                    Câu {questionNumber} / {totalQuestions}
                </span>
                <span
                    className="text-xs font-bold px-2 py-1 rounded-full"
                    style={{
                        background: LEVEL_INFO[question.difficulty].color + '20',
                        color: LEVEL_INFO[question.difficulty].color,
                    }}
                >
                    {question.difficulty}
                </span>
            </div>

            {/* Progress */}
            <div className="h-2 bg-gray-100 rounded-full mb-6 overflow-hidden">
                <div
                    className="h-full bg-gradient-to-r from-[#60A8E4] to-[#3C78A8] rounded-full transition-all duration-300"
                    style={{ width: `${(questionNumber / totalQuestions) * 100}%` }}
                />
            </div>

            {/* Question Card */}
            <div className="bg-white rounded-2xl shadow-lg p-6 mb-4">
                <p className="text-sm text-gray-400 mb-1">{question.questionNative}</p>
                <p className="text-xl font-semibold text-gray-900 mb-6 leading-relaxed">
                    {question.questionDe}
                </p>

                {/* Options */}
                <div className="space-y-3">
                    {question.options.map((option, idx) => {
                        let optClass = 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'

                        if (showFeedback) {
                            if (idx === question.correctIndex) {
                                optClass = 'border-emerald-400 bg-emerald-50 ring-2 ring-emerald-200'
                            } else if (idx === selectedAnswer && idx !== question.correctIndex) {
                                optClass = 'border-red-400 bg-red-50 ring-2 ring-red-200'
                            } else {
                                optClass = 'border-gray-200 opacity-50'
                            }
                        } else if (idx === selectedAnswer) {
                            optClass = 'border-[#60A8E4] bg-[#F3FBFF]'
                        }

                        return (
                            <button
                                key={idx}
                                onClick={() => onAnswer(idx)}
                                disabled={showFeedback}
                                className={`w-full text-left p-4 rounded-xl border-2 transition-all ${optClass}`}
                            >
                                <span className="font-medium text-gray-800">{option}</span>
                            </button>
                        )
                    })}
                </div>
            </div>

            {/* Feedback */}
            {showFeedback && (
                <div
                    className={`rounded-xl p-4 text-sm animate-fade-in-up ${
                        lastCorrect
                            ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                            : 'bg-red-50 border border-red-200 text-red-800'
                    }`}
                >
                    <div className="font-bold mb-1">
                        {lastCorrect ? '✅ Đúng!' : '❌ Chưa đúng'}
                    </div>
                    <div className="text-xs opacity-80">{question.explanationNative}</div>
                </div>
            )}
        </div>
    )
}

function ResultStep({
    result,
    targetLevel,
    targetExam,
    dailyStudyMinutes,
    saving,
    saveError,
    onComplete,
}: {
    result: ReturnType<typeof calculateResult>
    targetLevel: PlacementLevel
    targetExam: string | null
    dailyStudyMinutes: number
    saving: boolean
    saveError: string | null
    onComplete: () => void
}) {
    const levelInfo = LEVEL_INFO[result.estimatedLevel]
    const firstAction = targetExam
        ? `Luyện ${targetExam} ${targetLevel} sau một quest từ vựng ${result.estimatedLevel}`
        : `Bắt đầu bằng một quest từ vựng ${result.estimatedLevel}`

    return (
        <div className="max-w-md w-full text-center animate-fade-in-up">
            {/* Mascot */}
            <div className="mb-4">
                <Image
                    src={getFuxieMascotSrc('resultCelebration')}
                    alt="Fuxie celebrates"
                    width={120}
                    height={120}
                    className="mx-auto object-contain"
                />
            </div>

            <h2 className="text-2xl font-bold mb-1">Kết quả</h2>
            <p className="text-gray-400 text-sm mb-6">
                Trình độ ước tính của bạn:
            </p>

            {/* Level Badge - Large */}
            <div
                className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl mb-6"
                style={{ background: levelInfo.color + '15', border: `2px solid ${levelInfo.color}40` }}
            >
                <span className="text-5xl font-black" style={{ color: levelInfo.color }}>
                    {result.estimatedLevel}
                </span>
                <div className="text-left">
                    <div className="font-bold text-gray-800 text-sm">{levelInfo.label}</div>
                    <div className="text-xs text-gray-500">{levelInfo.desc}</div>
                </div>
            </div>

            {/* Level Breakdown */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
                <div className="flex gap-1 mb-3">
                    {(Object.keys(LEVEL_INFO) as PlacementLevel[]).map((level) => {
                        const breakdown = result.levelBreakdown[level]
                        const isEstimated = level === result.estimatedLevel
                        const pct = breakdown.total > 0 ? breakdown.pct : 0

                        return (
                            <div key={level} className="flex-1 text-center">
                                <div
                                    className={`text-xs font-bold mb-1 ${isEstimated ? '' : 'text-gray-400'}`}
                                    style={isEstimated ? { color: LEVEL_INFO[level].color } : undefined}
                                >
                                    {level}
                                </div>
                                <div className="h-8 bg-gray-100 rounded overflow-hidden relative">
                                    <div
                                        className="absolute bottom-0 left-0 right-0 rounded transition-all duration-700"
                                        style={{
                                            height: `${pct}%`,
                                            background: LEVEL_INFO[level].color,
                                            opacity: isEstimated ? 1 : 0.4,
                                        }}
                                    />
                                </div>
                                <div className="text-xs text-gray-400 mt-1">
                                    {breakdown.total > 0 ? `${pct}%` : '—'}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>

            <div className="bg-[#F3FBFF] rounded-xl border border-[#CCE4F0] p-4 mb-4 text-left">
                <div className="text-xs font-bold uppercase text-text-brand">
                    Bước đầu tiên
                </div>
                <div className="mt-1 font-semibold text-gray-900">{firstAction}</div>
                <div className="mt-1 text-sm text-gray-500">
                    Mục tiêu ngày: {dailyStudyMinutes} phút. Dashboard sẽ hiện một CTA chính để bắt đầu.
                </div>
            </div>

            {saveError && (
                <div
                    role="alert"
                    className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-left text-sm font-medium text-red-700"
                >
                    {saveError}
                </div>
            )}

            <button
                onClick={onComplete}
                disabled={saving}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#60A8E4] to-[#3C78A8] text-white font-semibold hover:shadow-lg hover:shadow-sky-200 transition-all active:scale-[0.98] disabled:opacity-50"
            >
                {saving ? 'Đang lưu...' : saveError ? 'Thử lại' : 'Bắt đầu học!'}
            </button>
        </div>
    )
}
