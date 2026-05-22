'use client'

import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import { TheoryRenderer } from '@/components/grammar/TheoryRenderer'
import { ExerciseRenderer, FeedbackToast } from '@/components/grammar/ExerciseRenderer'
import type { TheoryBlock, GrammarExercise } from '@/components/grammar/types'
import { RewardPreview, type RewardPreviewItem } from '@/components/gamification/quest-visuals'
import { FuxieBadge, FuxieProgressBar, fuxieButtonClass } from '@/components/ui/fuxie-ui'
import { trackClientAnalyticsEvent } from '@/lib/analytics/client-events'
import {
    buildGrammarQuestEpisode,
    getGrammarQuestCheckpoint,
    type GrammarQuestEpisodeReceipt,
} from '@/lib/gamification/grammar-quest-episode'
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
    titleNative: string
    level: string
    lessonType: string
    estimatedMin: number
    theoryBlocks: TheoryBlock[]
    exercises: GrammarExercise[]
    topicSlug: string
}

interface GrammarProgressResponse {
    xpEarned?: number
    fucoinEarned?: number
    rewardPreview?: RewardPreviewItem[]
    questEpisodeReceipt?: GrammarQuestEpisodeReceipt
    nextEpisodeHref?: string
    episodeRouting?: {
        reason: string
        routedSkill: string
    }
}

export function LessonPlayer({
    lessonId, titleDe, titleNative, level, lessonType, estimatedMin,
    theoryBlocks, exercises, topicSlug,
}: LessonPlayerProps) {
    const confettiTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
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
    const [progressResult, setProgressResult] = useState<GrammarProgressResponse | null>(null)
    const trackedCheckpoints = useRef<Set<string>>(new Set())
    const completionTracked = useRef(false)

    const currentStep = steps[currentStepIdx] ?? steps[0]!
    const totalSteps = steps.length
    const progress = ((currentStepIdx) / (totalSteps - 1)) * 100
    const totalExercises = exercises.length
    const questEpisode = useMemo(() => buildGrammarQuestEpisode({
        lessonId,
        topicSlug,
        title: titleNative || titleDe,
        cefrLevel: level,
        questionCount: Math.max(1, totalExercises),
        nextEpisodeHref: `/grammar/${topicSlug}`,
    }), [lessonId, level, titleDe, titleNative, topicSlug, totalExercises])
    const checkpointIndex = currentStep.type === 'exercise'
        ? currentStep.exerciseIndex
        : currentStep.type === 'results'
            ? Math.max(0, totalExercises - 1)
            : 0
    const activeCheckpoint = getGrammarQuestCheckpoint({ episode: questEpisode, currentIndex: checkpointIndex })

    useEffect(() => {
        if (currentStep.type === 'results') {
            setElapsedTime(Math.floor((Date.now() - startTime) / 1000))
        }
    }, [currentStep, startTime])

    useEffect(() => {
        return () => {
            if (confettiTimeoutRef.current) clearTimeout(confettiTimeoutRef.current)
        }
    }, [])

    // Save progress when reaching results
    const correctCount = answers.filter(a => a.correct).length
    const stars = correctCount === totalExercises ? 3
        : correctCount >= totalExercises * 0.7 ? 2
        : correctCount >= totalExercises * 0.4 ? 1 : 0
    const xp = correctCount * 10

    useEffect(() => {
        if (currentStep.type === 'hero' || currentStep.type === 'results') return
        if (trackedCheckpoints.current.has(activeCheckpoint.id)) return
        trackedCheckpoints.current.add(activeCheckpoint.id)
        trackClientAnalyticsEvent({
            eventName: 'quest_episode_checkpoint_reached',
            source: 'grammar.quest_episode.checkpoint',
            actionId: questEpisode.episodeId,
            actionType: 'lesson_session',
            level,
            skill: 'grammar',
            metadata: {
                episodeId: questEpisode.episodeId,
                skill: 'grammar',
                lessonId,
                cefrLevel: level,
                checkpointId: activeCheckpoint.id,
                questionCount: totalExercises,
            },
        })
    }, [activeCheckpoint.id, currentStep.type, lessonId, level, questEpisode.episodeId, totalExercises])

    useEffect(() => {
        if (currentStep.type !== 'results' || !progressResult?.questEpisodeReceipt || completionTracked.current) return
        completionTracked.current = true
        trackClientAnalyticsEvent({
            eventName: 'quest_episode_completed',
            source: 'grammar.quest_episode.completed',
            actionId: questEpisode.episodeId,
            actionType: 'lesson_session',
            level,
            skill: 'grammar',
            metadata: {
                episodeId: questEpisode.episodeId,
                skill: 'grammar',
                lessonId,
                cefrLevel: level,
                checkpointId: 'explain',
                questionCount: totalExercises,
                accuracyBand: progressResult.questEpisodeReceipt.accuracyBand,
            },
        })
    }, [currentStep.type, lessonId, level, progressResult, questEpisode.episodeId, totalExercises])

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
                    questEpisode: {
                        episodeId: questEpisode.episodeId,
                        skill: questEpisode.skill,
                        sourceId: questEpisode.sourceId,
                        cefrLevel: questEpisode.cefrLevel,
                        checkpointCount: questEpisode.checkpoints.length,
                        nextEpisodeHref: questEpisode.nextEpisodeHref,
                        currentEpisodeHref: `/grammar/${topicSlug}/${lessonId}`,
                    },
                }),
            })
                .then((response) => response.json())
                .then((data) => setProgressResult(data))
                .catch(console.error)
        }
    }, [currentStep, progressSaved, lessonId, correctCount, totalExercises, stars, questEpisode, topicSlug])

    const goNext = useCallback(() => {
        setCurrentStepIdx(prev => Math.min(prev + 1, totalSteps - 1))
    }, [totalSteps])

    const startGrammarQuestEpisode = useCallback(() => {
        trackedCheckpoints.current = new Set()
        completionTracked.current = false
        setProgressResult(null)
        trackClientAnalyticsEvent({
            eventName: 'quest_episode_started',
            source: 'grammar.quest_episode.started',
            actionId: questEpisode.episodeId,
            actionType: 'lesson_session',
            level,
            skill: 'grammar',
            metadata: {
                episodeId: questEpisode.episodeId,
                skill: 'grammar',
                lessonId,
                cefrLevel: level,
                checkpointId: 'notice',
                questionCount: totalExercises,
            },
        })
        goNext()
    }, [goNext, lessonId, level, questEpisode.episodeId, totalExercises])

    const handleExerciseAnswer = useCallback((correct: boolean, correctAnswer: string) => {
        const step = steps[currentStepIdx]!
        if (step.type !== 'exercise') return
        const ex = exercises[(step as { type: 'exercise'; exerciseIndex: number }).exerciseIndex]!
        setAnswers(prev => [...prev, { correct, tags: ex.tags || [] }])
        if (correct) {
            setShowConfetti(true)
            if (confettiTimeoutRef.current) clearTimeout(confettiTimeoutRef.current)
            confettiTimeoutRef.current = setTimeout(() => setShowConfetti(false), 2000)
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
        setProgressResult(null)
        trackedCheckpoints.current = new Set()
        completionTracked.current = false
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
                    <div className={s.episodeProgressRail}>
                        {questEpisode.checkpoints.map((checkpoint) => (
                            <span
                                key={checkpoint.id}
                                className={`${s.episodeProgressPill} ${checkpoint.id === activeCheckpoint.id ? s.episodeProgressPillActive : ''}`}
                            >
                                {checkpoint.title}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* HERO */}
            {currentStep.type === 'hero' && (
                <div className={s.heroCard}>
                    <div className={s.heroGradient}>
                        <span className={s.heroEmoji}>{lessonTypeEmoji}</span>
                        <div className={s.episodeBadges}>
                            <FuxieBadge tone="brand" className="normal-case tracking-normal">Grammar Episode</FuxieBadge>
                            <FuxieBadge tone="neutral" className="normal-case tracking-normal">{level}</FuxieBadge>
                        </div>
                        <h1 className={s.heroTitle}>{titleNative}</h1>
                        <p className={s.episodeEyebrow}>Quest briefing</p>
                        <p className={s.heroSubtitle}>{titleDe} · {level} · {lessonTypeLabel}</p>
                        <div className={s.heroChips}>
                            {theoryBlocks.length > 0 && <span className={s.heroChip}>📝 {theoryBlocks.length} phần lý thuyết</span>}
                            <span className={s.heroChip}>🎯 {totalExercises} thử thách</span>
                            <span className={s.heroChip}>⏱️ ~{estimatedMin} phút</span>
                        </div>
                        <p className={s.episodeObjective}>
                            {questEpisode.objective} Phần thưởng chỉ được trao khi em thực sự hoàn thành thử thách ngữ pháp.
                        </p>
                    </div>
                    <div className={s.episodePreview}>
                        <RewardPreview rewards={questEpisode.rewardPreview} />
                    </div>
                    <div className={s.episodeCheckpointGrid}>
                        {questEpisode.checkpoints.map((checkpoint, index) => (
                            <div key={checkpoint.id} className={s.episodeCheckpointCard}>
                                <span className={s.episodeCheckpointNumber}>{index + 1}</span>
                                <strong>{checkpoint.title}</strong>
                                <span>{checkpoint.objective}</span>
                            </div>
                        ))}
                    </div>
                    <button className={s.heroStartBtn} onClick={startGrammarQuestEpisode}>
                        Bắt đầu học →
                    </button>
                </div>
            )}

            {/* THEORY */}
            {currentStep.type === 'theory' && (
                <div className={s.stepContainer} key={`theory-${currentStep.blockIndex}`}>
                    <div className={s.stepContent}>
                        <TheoryRenderer blocks={[theoryBlocks[currentStep.blockIndex]!]} topicSlug={topicSlug} />
                    </div>
                    <div className={s.stepFooter}>
                        <div className={s.stepFooterInner}>
                            <button className={`${s.btnPrimary} ${s.btnBlue}`} onClick={goNext}>
                                {currentStep.blockIndex === theoryBlocks.length - 1 ? '🎯 Bắt đầu thử thách' : 'Tiếp bước →'}
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
                            exercise={exercises[currentStep.exerciseIndex]!}
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
                    {progressResult?.questEpisodeReceipt && (
                        <div className={s.episodeReceiptCard}>
                            <div className={s.episodeReceiptHeader}>
                                <div>
                                    <p className={s.episodeEyebrow}>Episode receipt</p>
                                    <h2>
                                        {progressResult.questEpisodeReceipt.completedCheckpoints}/{progressResult.questEpisodeReceipt.checkpointCount} checkpoint · {progressResult.questEpisodeReceipt.accuracyBand.replaceAll('_', ' ')}
                                    </h2>
                                    <p>{progressResult.questEpisodeReceipt.masteryContribution}</p>
                                    {progressResult.episodeRouting?.reason && (
                                        <span className={s.episodeRoutingNote}>
                                            Next route: {progressResult.episodeRouting.reason.replaceAll('_', ' ')}
                                        </span>
                                    )}
                                </div>
                                <button
                                    className={fuxieButtonClass(progressResult.questEpisodeReceipt.recommendedAction === 'next_episode' ? 'primary' : 'reward', 'md', 'shrink-0')}
                                    onClick={() => {
                                        if (progressResult.questEpisodeReceipt?.recommendedAction === 'next_episode') {
                                            window.location.href = progressResult.questEpisodeReceipt.nextEpisodeHref
                                        } else {
                                            handleRestart()
                                        }
                                    }}
                                >
                                    {progressResult.questEpisodeReceipt.recommendedAction === 'next_episode' ? 'Di tiep' : 'Luyen lai'}
                                </button>
                            </div>
                            <FuxieProgressBar
                                value={Math.round((progressResult.questEpisodeReceipt.completedCheckpoints / Math.max(1, progressResult.questEpisodeReceipt.checkpointCount)) * 100)}
                                className="mt-4"
                            />
                            {progressResult.rewardPreview && progressResult.rewardPreview.length > 0 && (
                                <div className={s.episodeReceiptRewards}>
                                    <RewardPreview rewards={progressResult.rewardPreview} />
                                </div>
                            )}
                        </div>
                    )}
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
