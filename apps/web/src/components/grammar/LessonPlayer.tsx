'use client'

import React, { useState, useCallback, useMemo, useEffect } from 'react'
import { TheoryRenderer } from '@/components/grammar/TheoryRenderer'
import { ExerciseRenderer, FeedbackToast } from '@/components/grammar/ExerciseRenderer'
import type { TheoryBlock, GrammarExercise } from '@/components/grammar/types'
import s from '@/components/grammar/grammar.module.css'

// ─── Confetti ────────────────────────────────────────
function Confetti() {
    const pieces = useMemo(() =>
        Array.from({ length: 40 }, (_, i) => ({
            id: i,
            left: Math.random() * 100,
            delay: Math.random() * 0.8,
            color: ['#3B82F6', '#22C55E', '#EAB308', '#EF4444', '#8B5CF6', '#EC4899'][i % 6],
            size: 6 + Math.random() * 8,
            duration: 1.5 + Math.random() * 1,
        })),
        []
    )
    return (
        <div className={s.confettiContainer}>
            {pieces.map(p => (
                <div
                    key={p.id}
                    className={s.confetti}
                    style={{
                        left: `${p.left}%`,
                        width: p.size,
                        height: p.size,
                        background: p.color,
                        animationDelay: `${p.delay}s`,
                        animationDuration: `${p.duration}s`,
                    }}
                />
            ))}
        </div>
    )
}

// ─── Score Ring SVG ───────────────────────────────────
function ScoreRing({ correct, total }: { correct: number; total: number }) {
    const pct = total === 0 ? 0 : correct / total
    const r = 65
    const c = 2 * Math.PI * r
    const offset = c * (1 - pct)

    return (
        <div className={s.scoreRingWrap}>
            <svg className={s.scoreRingSvg} viewBox="0 0 160 160">
                <defs>
                    <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#3B82F6" />
                        <stop offset="100%" stopColor="#8B5CF6" />
                    </linearGradient>
                </defs>
                <circle className={s.ringBg} cx="80" cy="80" r={r} />
                <circle
                    className={s.ringFill}
                    cx="80" cy="80" r={r}
                    strokeDasharray={c}
                    strokeDashoffset={offset}
                />
            </svg>
            <div className={s.scoreValue}>
                <span className={s.scoreNumber}>{correct}/{total}</span>
                <span className={s.scorePercent}>{Math.round(pct * 100)}%</span>
            </div>
        </div>
    )
}

// ─── Step Types ──────────────────────────────────────
type Step =
    | { type: 'hero' }
    | { type: 'theory'; blockIndex: number }
    | { type: 'exercise'; exerciseIndex: number }
    | { type: 'results' }

// ─── Props ───────────────────────────────────────────
interface LessonPlayerProps {
    lessonId: string
    titleDe: string
    titleVi: string
    level: string
    lessonType: string
    estimatedMin: number
    theoryBlocks: TheoryBlock[]
    exercises: GrammarExercise[]
    topicSlug: string
}

export function LessonPlayer({
    lessonId, titleDe, titleVi, level, lessonType, estimatedMin,
    theoryBlocks, exercises, topicSlug,
}: LessonPlayerProps) {
    const [steps] = useState<Step[]>(() => {
        const all: Step[] = [{ type: 'hero' }]
        theoryBlocks.forEach((_, i) => all.push({ type: 'theory', blockIndex: i }))
        exercises.forEach((_, i) => all.push({ type: 'exercise', exerciseIndex: i }))
        all.push({ type: 'results' })
        return all
    })

    const [currentStepIdx, setCurrentStepIdx] = useState(0)
    const [answers, setAnswers] = useState<{ correct: boolean; tags: string[] }[]>([])
    const [feedbackState, setFeedbackState] = useState<{
        isCorrect: boolean; correctAnswer: string; explanation: string
    } | null>(null)
    const [showConfetti, setShowConfetti] = useState(false)
    const [startTime] = useState(Date.now())
    const [elapsedTime, setElapsedTime] = useState(0)
    const [progressSaved, setProgressSaved] = useState(false)

    const currentStep = steps[currentStepIdx]
    const totalSteps = steps.length
    const progress = ((currentStepIdx) / (totalSteps - 1)) * 100
    const totalExercises = exercises.length

    useEffect(() => {
        if (currentStep.type === 'results') {
            setElapsedTime(Math.floor((Date.now() - startTime) / 1000))
        }
    }, [currentStep, startTime])

    // Save progress when reaching results
    const correctCount = answers.filter(a => a.correct).length
    const stars = correctCount === totalExercises ? 3
        : correctCount >= totalExercises * 0.7 ? 2
        : correctCount >= totalExercises * 0.4 ? 1 : 0
    const xp = correctCount * 10

    useEffect(() => {
        if (currentStep.type === 'results' && !progressSaved && totalExercises > 0) {
            setProgressSaved(true)
            fetch('/api/v1/grammar/progress', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    lessonId,
                    score: correctCount,
                    maxScore: totalExercises,
                    stars,
                }),
            }).catch(console.error)
        }
    }, [currentStep, progressSaved, lessonId, correctCount, totalExercises, stars])

    const goNext = useCallback(() => {
        setCurrentStepIdx(prev => Math.min(prev + 1, totalSteps - 1))
    }, [totalSteps])

    const handleExerciseAnswer = useCallback((correct: boolean, correctAnswer: string) => {
        const step = steps[currentStepIdx]
        if (step.type !== 'exercise') return
        const ex = exercises[step.exerciseIndex]
        setAnswers(prev => [...prev, { correct, tags: ex.tags || [] }])
        if (correct) {
            setShowConfetti(true)
            setTimeout(() => setShowConfetti(false), 2000)
        }
        setFeedbackState({
            isCorrect: correct,
            correctAnswer,
            explanation: ex.explanation_vi || '',
        })
    }, [currentStepIdx, steps, exercises])

    const handleFeedbackContinue = useCallback(() => {
        setFeedbackState(null)
        goNext()
    }, [goNext])

    const handleRestart = useCallback(() => {
        setCurrentStepIdx(0)
        setAnswers([])
        setFeedbackState(null)
        setProgressSaved(false)
    }, [])

    // Tag-based analysis
    const tagResults = useMemo(() => {
        const map: Record<string, { correct: number; total: number }> = {}
        answers.forEach(a => {
            a.tags.forEach(tag => {
                if (!map[tag]) map[tag] = { correct: 0, total: 0 }
                map[tag].total++
                if (a.correct) map[tag].correct++
            })
        })
        return map
    }, [answers])

    const strengths = Object.entries(tagResults).filter(([, v]) => v.correct === v.total).map(([k]) => k)
    const weaknesses = Object.entries(tagResults).filter(([, v]) => v.correct < v.total).map(([k]) => k)

    const formatTime = (secs: number) => {
        const m = Math.floor(secs / 60)
        const s2 = secs % 60
        return `${m} phút ${s2 < 10 ? '0' : ''}${s2} giây`
    }

    const lessonTypeLabel = lessonType === 'E' ? 'Giới thiệu' : lessonType === 'V' ? 'Luyện sâu' : 'Ứng dụng'
    const lessonTypeEmoji = lessonType === 'E' ? '📖' : lessonType === 'V' ? '🔬' : '🎯'

    return (
        <div className={s.lessonPlayer} style={{ background: '#F8FAFC' }}>
            {/* Progress Bar */}
            {currentStep.type !== 'hero' && currentStep.type !== 'results' && (
                <div className={s.progressBarWrap}>
                    <div className={s.progressBarInner}>
                        <button className={s.progressBarClose} onClick={() => window.location.href = `/grammar/${topicSlug}`}>✕</button>
                        <div className={s.progressBarTrack}>
                            <div className={s.progressBarFill} style={{ width: `${progress}%` }} />
                        </div>
                        <span className={s.progressBarStep}>
                            {currentStep.type === 'theory'
                                ? `${currentStep.blockIndex + 1}/${theoryBlocks.length}`
                                : `Câu ${currentStep.exerciseIndex + 1}/${totalExercises}`
                            }
                        </span>
                    </div>
                </div>
            )}

            {/* HERO */}
            {currentStep.type === 'hero' && (
                <div className={s.heroCard}>
                    <div className={s.heroGradient}>
                        <span className={s.heroEmoji}>{lessonTypeEmoji}</span>
                        <h1 className={s.heroTitle}>{titleVi}</h1>
                        <p className={s.heroSubtitle}>{titleDe} · {level} · {lessonTypeLabel}</p>
                        <div className={s.heroChips}>
                            {theoryBlocks.length > 0 && <span className={s.heroChip}>📝 {theoryBlocks.length} phần lý thuyết</span>}
                            <span className={s.heroChip}>🎯 {totalExercises} bài tập</span>
                            <span className={s.heroChip}>⏱️ ~{estimatedMin} phút</span>
                        </div>
                    </div>
                    <button className={s.heroStartBtn} onClick={goNext}>
                        Bắt đầu học →
                    </button>
                </div>
            )}

            {/* THEORY */}
            {currentStep.type === 'theory' && (
                <div className={s.stepContainer} key={`theory-${currentStep.blockIndex}`}>
                    <div className={s.stepContent}>
                        <TheoryRenderer blocks={[theoryBlocks[currentStep.blockIndex]]} topicSlug={topicSlug} />
                    </div>
                    <div className={s.stepFooter}>
                        <div className={s.stepFooterInner}>
                            <button className={`${s.btnPrimary} ${s.btnBlue}`} onClick={goNext}>
                                {currentStep.blockIndex === theoryBlocks.length - 1 ? '🎯 Bắt đầu luyện tập' : 'Tiếp tục →'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* EXERCISE */}
            {currentStep.type === 'exercise' && (
                <div className={s.stepContainer} key={`ex-${currentStep.exerciseIndex}`}>
                    <div className={s.stepContent}>
                        <ExerciseRenderer
                            exercise={exercises[currentStep.exerciseIndex]}
                            onAnswer={handleExerciseAnswer}
                        />
                    </div>
                </div>
            )}

            {/* RESULTS */}
            {currentStep.type === 'results' && (
                <div className={s.resultsScreen}>
                    <h1 className={s.resultsTitle}>🎉 Hoàn thành!</h1>
                    <ScoreRing correct={correctCount} total={totalExercises} />
                    <div className={s.starsRow}>
                        {[1, 2, 3].map(i => (
                            <span key={i} className={`${s.star} ${i <= stars ? s.starActive : s.starDim}`}
                                style={i <= stars ? { animationDelay: `${(i - 1) * 0.2}s` } : undefined}
                            >⭐</span>
                        ))}
                    </div>
                    <div className={s.statsRow}>
                        <span className={s.statItem}>⏱️ {formatTime(elapsedTime)}</span>
                        <span className={`${s.statItem} ${s.xpStat}`}>⚡ +{xp} XP</span>
                    </div>
                    {strengths.length > 0 && (
                        <div className={s.strengthSection}>
                            <div className={`${s.strengthHeader} ${s.strengthGood}`}>✅ Làm tốt</div>
                            {strengths.map(t => <div key={t} className={s.strengthItem}>{t}</div>)}
                        </div>
                    )}
                    {weaknesses.length > 0 && (
                        <div className={s.strengthSection}>
                            <div className={`${s.strengthHeader} ${s.strengthWeak}`}>⚠️ Cần ôn</div>
                            {weaknesses.map(t => <div key={t} className={s.strengthItem}>{t}</div>)}
                        </div>
                    )}
                    <div className={s.resultsBtns}>
                        <button className={`${s.btnPrimary} ${s.btnBlue}`} onClick={handleRestart}>🔄 Làm lại</button>
                        <button className={`${s.btnPrimary} ${s.btnOutline}`}
                            onClick={() => window.location.href = `/grammar/${topicSlug}`}>
                            → Quay lại
                        </button>
                    </div>
                </div>
            )}

            {feedbackState && (
                <FeedbackToast
                    isCorrect={feedbackState.isCorrect}
                    correctAnswer={feedbackState.isCorrect ? undefined : feedbackState.correctAnswer}
                    explanation={feedbackState.explanation}
                    onContinue={handleFeedbackContinue}
                />
            )}

            {showConfetti && <Confetti />}
        </div>
    )
}
