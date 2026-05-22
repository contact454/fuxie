'use client'

import { useState, useCallback, useMemo, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { FUXIE_3D_ASSETS, FuxieRoleMascot, RewardPreview, SkillMotivationRail } from '@/components/gamification/quest-visuals'
import { Mascot } from '@/components/ui/mascot'
import { FuxieBadge, FuxieProgressBar, fuxieButtonClass } from '@/components/ui/fuxie-ui'
import styles from './reading.module.css'
import {
    type Question, type ExplanationData, type QuestionResult, type ReadingPlayerProps,
    type Phase, type LookedUpWord, type TooltipState, type TextHighlight,
    TEIL_DESCRIPTIONS, DIFFICULTY, WARMUP_QUESTIONS, POST_READING_TIPS,
    extractKeyWords, getImageUrl, getHeroImage,
} from './reading-types'
import { getCefrTheme } from '@/lib/constants/cefr'
import { trackClientAnalyticsEvent } from '@/lib/analytics/client-events'
import {
    buildReadingQuestEpisode,
    getReadingQuestCheckpoint,
    type ReadingQuestEpisodeReceipt,
} from '@/lib/gamification/reading-quest-episode'
import { renderTexts, renderSchilderCards, renderAnzeigenCards, renderImages } from './reading-text-renderers'
import { useReadingTranslate } from './use-reading-translate'

// Types, constants, helpers, and renderers extracted to:
// - ./reading-types.ts
// - ./reading-text-renderers.tsx
// - ./use-reading-translate.ts

/**
 * Decorative confetti palette for the celebration header rendered after a
 * Reading exercise is submitted (results / cloze-results phase).
 *
 * Reward-amber containment (Req 6.9, 16.1, 16.2 of `gamified-ui-asset-rollout`,
 * Property 9 in design.md §E): the celebration card lives outside the
 * Skill_Motivation_Layer's reward-preview subtree and does NOT carry
 * `data-reward-state="preview"`/`"earned"`/`"receipt"` or
 * `data-reward-context="true"`. To satisfy Property 9 the palette omits the
 * reward-amber band `rgb(255, 183, 3) ± 5%` (`#FFB703` and visual
 * equivalents). The remaining colors are Bright Sky blue, success teal,
 * accent purple, and a neutral light yellow (`#FFD166`, well outside the
 * ±5% band on the green and blue channels) so the celebration still reads
 * as joyful without leaking reward signal.
 */
const CELEBRATION_CONFETTI_PALETTE = [
    '#60A8E4', // Bright Sky blue 400
    '#4CAF50', // success green
    '#2EC4B6', // teal
    '#9C27B0', // accent purple
    '#FFD166', // light yellow — outside reward-amber ±5% band
    '#3C78A8', // deep blue
] as const

// ─── Main Component ─────────────────────────────────
export function ReadingPlayer({
    exerciseId, cefrLevel, teil, teilName, topic,
    textsJson, imagesJson, questions,
}: ReadingPlayerProps) {
    const router = useRouter()
    const [phase, setPhase] = useState<Phase>('intro')
    const [warmupStep, setWarmupStep] = useState(0)
    const [currentQuestion, setCurrentQuestion] = useState(0)
    const [answers, setAnswers] = useState<Record<string, string>>({})
    const [clozeAnswers, setClozeAnswers] = useState<Record<string, string>>({})
    const [clozeResults, setClozeResults] = useState<{
        score: number; total: number; percentage: number; timeTaken: number;
        gaps: { pos: string; userAnswer: string; correctAnswer: string; isCorrect: boolean }[]
    } | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [results, setResults] = useState<{
        score: number; totalQuestions: number; percentage: number;
        xpEarned?: number; fucoinEarned?: number; rewardPreview?: Array<{ type: 'xp' | 'fucoin' | 'streak' | 'badge' | 'unlock'; label: string; detail: string }>;
        questEpisodeReceipt?: ReadingQuestEpisodeReceipt; nextEpisodeHref?: string;
        timeTaken: number; questionResults: QuestionResult[]
    } | null>(null)
    const [expandedResult, setExpandedResult] = useState<string | null>(null)
    const [startTime, setStartTime] = useState(Date.now())
    const cefrColor = getCefrTheme(cefrLevel)
    const isBeginner = ['A1', 'A2'].includes(cefrLevel)
    const diff = DIFFICULTY[cefrLevel] ?? DIFFICULTY.A1!
    const teilInfo = isBeginner
        ? TEIL_DESCRIPTIONS.beginner?.[teil]
        : TEIL_DESCRIPTIONS.advanced?.[teil]
    const heroImage = useMemo(() => getHeroImage(imagesJson, cefrLevel), [imagesJson, cefrLevel])

    // ─── Cloze exercise detection ─────────
    const clozeData = useMemo(() => {
        if (questions.length > 0) return null
        const texts = Array.isArray(textsJson) ? textsJson : [textsJson]
        const txt = texts[0]
        if (!txt) return null
        if (txt.text && txt.gaps && Array.isArray(txt.gaps)) return { type: 'word' as const, data: txt }
        if (txt.text && txt.sentences && txt.answers) return { type: 'sentence' as const, data: txt }
        if (txt.text && txt.sections && txt.answers) return { type: 'section' as const, data: txt }
        return null
    }, [textsJson, questions.length])

    const isClozeExercise = clozeData !== null
    const clozeGapCount = useMemo(() => {
        if (!clozeData) return 0
        if (clozeData.type === 'word') return clozeData.data.gaps.length
        return Object.keys(clozeData.data.answers || {}).length
    }, [clozeData])

    const estimatedMinutes = useMemo(() => {
        if (isClozeExercise) return Math.max(5, Math.ceil(clozeGapCount * 1.2))
        return Math.max(3, Math.ceil(questions.length * 1.5))
    }, [questions.length, isClozeExercise, clozeGapCount])
    const keyWords = useMemo(() => extractKeyWords(textsJson, cefrLevel), [textsJson, cefrLevel])
    const warmupQuestions = WARMUP_QUESTIONS[cefrLevel] ?? WARMUP_QUESTIONS.A1!
    const questEpisode = useMemo(() => buildReadingQuestEpisode({
        exerciseId,
        topic,
        cefrLevel,
        teil,
        questionCount: Math.max(1, questions.length),
        nextEpisodeHref: '/reading',
    }), [exerciseId, topic, cefrLevel, teil, questions.length])
    const canUseQuestEpisode = !isClozeExercise && questions.length > 0
    const activeCheckpoint = getReadingQuestCheckpoint({
        episode: questEpisode,
        currentIndex: currentQuestion,
    })
    const trackedCheckpoints = useRef<Set<string>>(new Set())
    const completionTracked = useRef(false)

    // ─── Click-to-translate (extracted to hook) ─────────
    const {
        tooltip, setTooltip, vocabList,
        showVocabPanel, setShowVocabPanel,
        tooltipRef, handleTextClick,
    } = useReadingTranslate()

    useEffect(() => {
        if (!canUseQuestEpisode || phase !== 'exercise') return
        if (trackedCheckpoints.current.has(activeCheckpoint.id)) return
        trackedCheckpoints.current.add(activeCheckpoint.id)
        trackClientAnalyticsEvent({
            eventName: 'quest_episode_checkpoint_reached',
            source: 'reading.quest_episode.checkpoint',
            actionId: questEpisode.episodeId,
            actionType: 'reading_task',
            level: cefrLevel,
            skill: 'reading',
            metadata: {
                episodeId: questEpisode.episodeId,
                skill: 'reading',
                exerciseId,
                cefrLevel,
                checkpointId: activeCheckpoint.id,
                questionCount: questions.length,
            },
        })
    }, [activeCheckpoint.id, canUseQuestEpisode, cefrLevel, exerciseId, phase, questEpisode.episodeId, questions.length])

    useEffect(() => {
        if (!canUseQuestEpisode || phase !== 'results' || !results?.questEpisodeReceipt || completionTracked.current) return
        completionTracked.current = true
        trackClientAnalyticsEvent({
            eventName: 'quest_episode_completed',
            source: 'reading.quest_episode.completed',
            actionId: questEpisode.episodeId,
            actionType: 'reading_task',
            level: cefrLevel,
            skill: 'reading',
            metadata: {
                episodeId: questEpisode.episodeId,
                skill: 'reading',
                exerciseId,
                cefrLevel,
                checkpointId: 'prove',
                questionCount: results.totalQuestions,
                accuracyBand: results.questEpisodeReceipt.accuracyBand,
            },
        })
    }, [canUseQuestEpisode, cefrLevel, exerciseId, phase, questEpisode.episodeId, results])

    const startReadingQuestEpisode = () => {
        setStartTime(Date.now())
        setPhase('warmup')
        if (!canUseQuestEpisode) return
        trackedCheckpoints.current = new Set()
        completionTracked.current = false
        trackClientAnalyticsEvent({
            eventName: 'quest_episode_started',
            source: 'reading.quest_episode.started',
            actionId: questEpisode.episodeId,
            actionType: 'reading_task',
            level: cefrLevel,
            skill: 'reading',
            metadata: {
                episodeId: questEpisode.episodeId,
                skill: 'reading',
                exerciseId,
                cefrLevel,
                checkpointId: 'scan',
                questionCount: questions.length,
            },
        })
    }

    const selectAnswer = (questionId: string, answer: string) => {
        setAnswers(prev => ({ ...prev, [questionId]: answer }))
    }

    const submitAnswers = useCallback(async () => {
        setIsSubmitting(true)
        try {
            const timeTaken = Math.round((Date.now() - startTime) / 1000)
            const res = await fetch(`/api/v1/reading/${exerciseId}/submit`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    answers,
                    timeTaken,
                    ...(canUseQuestEpisode ? {
                        questEpisode: {
                            episodeId: questEpisode.episodeId,
                            skill: questEpisode.skill,
                            sourceId: questEpisode.sourceId,
                            cefrLevel: questEpisode.cefrLevel,
                            checkpointCount: questEpisode.checkpoints.length,
                            nextEpisodeHref: questEpisode.nextEpisodeHref,
                        },
                    } : {}),
                }),
            })
            const data = await res.json()
            if (data.success) {
                setResults({ ...data.data, timeTaken })
                setPhase('results')
            }
        } catch (err) {
            console.error(err)
        } finally {
            setIsSubmitting(false)
        }
    }, [answers, canUseQuestEpisode, exerciseId, questEpisode, startTime])

    // Cloze answer handler
    const selectClozeAnswer = useCallback((gapId: string, answer: string) => {
        setClozeAnswers(prev => ({ ...prev, [gapId]: answer }))
    }, [])

    // Cloze submit — evaluate locally from JSON data
    const submitCloze = useCallback(() => {
        if (!clozeData) return
        setIsSubmitting(true)
        const timeTaken = Math.round((Date.now() - startTime) / 1000)

        let correctAnswers: Record<string, string> = {}
        if (clozeData.type === 'word') {
            for (const gap of clozeData.data.gaps) {
                correctAnswers[String(gap.pos)] = gap.answer
            }
        } else {
            correctAnswers = { ...clozeData.data.answers }
        }

        const gaps = Object.keys(correctAnswers).map(pos => ({
            pos,
            userAnswer: clozeAnswers[pos] || '',
            correctAnswer: correctAnswers[pos] || '',
            isCorrect: (clozeAnswers[pos] || '').toLowerCase() === (correctAnswers[pos] || '').toLowerCase(),
        }))

        const score = gaps.filter(g => g.isCorrect).length
        const total = gaps.length
        setClozeResults({ score, total, percentage: Math.round((score / total) * 100), timeTaken, gaps })
        setPhase('results')
        setIsSubmitting(false)
    }, [clozeData, clozeAnswers, startTime])

    const allAnswered = isClozeExercise
        ? Object.keys(clozeAnswers).length >= clozeGapCount
        : questions.every(q => answers[q.id])
    const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`

    const resultMessage = (percentage: number) => {
        if (percentage >= 90) return 'Xuất sắc!'
        if (percentage >= 70) return 'Rất tốt!'
        if (percentage >= 50) return 'Ổn rồi, luyện thêm chút nữa nhé!'
        return 'Cần đọc lại thêm một vòng'
    }

    const resetExercise = () => {
        setPhase('intro')
        setWarmupStep(0)
        setCurrentQuestion(0)
        setAnswers({})
        setClozeAnswers({})
        setClozeResults(null)
        setResults(null)
        setExpandedResult(null)
        setShowVocabPanel(false)
        setStartTime(Date.now())
        trackedCheckpoints.current = new Set()
        completionTracked.current = false
    }

    // ═══════════════════════════════════════════
    // INTRO PHASE — Level-Adaptive Premium Design
    // ═══════════════════════════════════════════
    if (phase === 'intro') {
        return (
            <div className={`max-w-lg mx-auto ${styles.fadeInUp}`}>
                <button onClick={() => router.push('/reading')} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6 transition-colors">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                    </svg>
                    Về danh sách
                </button>

                <div
                    className={styles.introCard}
                    style={{ '--level-gradient': cefrColor.css, '--level-shadow': cefrColor.shadow } as React.CSSProperties}
                >
                    {/* Mascot */}
                    <FuxieRoleMascot src={FUXIE_3D_ASSETS.librarian} alt="Fuxie reading coach" size={96} motion="coach" />

                    {canUseQuestEpisode && (
                        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                            <FuxieBadge tone="brand" className="normal-case tracking-normal">
                                Reading Episode
                            </FuxieBadge>
                            <FuxieBadge tone="neutral" className="normal-case tracking-normal">
                                {cefrLevel} · Teil {teil}
                            </FuxieBadge>
                        </div>
                    )}

                    {/* Title */}
                    <h1 className="text-2xl font-bold text-gray-900 mt-4">{topic}</h1>
                    {canUseQuestEpisode && (
                        <p className="mt-2 text-xs font-black uppercase text-text-brand">
                            Quest briefing
                        </p>
                    )}
                    <p className="text-sm text-gray-500 mt-1">
                        {teilInfo?.icon || '📖'} Phần {teil} - {teilName}
                    </p>

                    {/* Hero Image — only for A1/A2 or when available */}
                    {heroImage && isBeginner && (
                        <div className={styles.introImage}>
                            <Image src={heroImage} alt={topic} width={0} height={0} sizes="100vw" className="w-full h-auto" priority />
                        </div>
                    )}

                    {/* Exercise Info Pills */}
                    <div className={styles.exerciseInfo}>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold text-white`}
                            style={{ background: cefrColor.css }}>
                            {cefrLevel}
                        </span>
                        <span className={styles.infoPill}>
                            {isClozeExercise ? `${clozeGapCount} chỗ trống` : `${questions.length} câu hỏi`}
                        </span>
                        <span className={styles.infoPill}>
                            ~{estimatedMinutes} phút
                        </span>
                        <span className={styles.infoPill}>
                            {Array.from({ length: 5 }, (_, i) => (
                                <span key={i} style={{
                                    width: 6, height: 6, borderRadius: '50%',
                                    background: i < diff.dots ? diff.color : '#e5e7eb',
                                    display: 'inline-block', marginRight: 2
                                }} />
                            ))}
                            <span style={{ marginLeft: 4 }}>{diff.label}</span>
                        </span>
                    </div>

                    {/* Genre badge for B1+ */}
                    {!isBeginner && teilInfo?.genre && (
                        <div className={styles.topicBadge} style={{ background: cefrColor.bg, color: cefrColor.text }}>
                            {teilInfo.icon} {teilInfo.genre}
                        </div>
                    )}

                    {/* Reading Strategy Tip */}
                    {teilInfo?.strategy && (
                        <div className={styles.strategyTip}>
                            <p className={styles.tipIcon}>Chiến lược đọc</p>
                            <p className={styles.tipText}>{teilInfo.strategy}</p>
                        </div>
                    )}

                    {canUseQuestEpisode && (
                        <>
                            <p className="mt-4 text-sm font-semibold leading-relaxed text-text-brand">
                                {questEpisode.objective} Phần thưởng chỉ được trao khi em thực sự hoàn thành thử thách đọc.
                            </p>

                            <div className="mt-4 rounded-2xl bg-[#F3FBFF] p-4 ring-1 ring-[#CCE4F0]/70">
                                <RewardPreview rewards={questEpisode.rewardPreview} />
                            </div>

                            <div className="mt-4 grid gap-3 sm:grid-cols-3">
                                {questEpisode.checkpoints.map((checkpoint, index) => (
                                    <div key={checkpoint.id} className="rounded-2xl bg-white p-4 text-left ring-1 ring-slate-100">
                                        <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-xl bg-[#EAFBF8] text-sm font-black text-text-success">
                                            {index + 1}
                                        </div>
                                        <p className="text-sm font-black text-slate-950">{checkpoint.title}</p>
                                        <p className="mt-1 text-xs font-semibold leading-relaxed text-slate-500">{checkpoint.objective}</p>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}

                    {/* Start Button — goes to warm-up */}
                    <button
                        onClick={startReadingQuestEpisode}
                        className={styles.startButton}
                        style={{ '--level-gradient': cefrColor.css, '--level-shadow': cefrColor.shadow } as React.CSSProperties}
                    >
                        Bắt đầu bài đọc
                    </button>
                </div>
            </div>
        )
    }

    // ═══════════════════════════════════════════
    // WARM-UP PHASE — Pre-reading activation
    // ═══════════════════════════════════════════
    if (phase === 'warmup') {
        const totalSteps = 3 // vocab → activation → focus
        const warmupProgress = ((warmupStep + 1) / totalSteps) * 100

        return (
            <div className={`max-w-lg mx-auto ${styles.fadeInUp}`}>
                {/* Top bar */}
                <div className="flex items-center gap-4 mb-5">
                    <button onClick={() => setPhase('intro')} className="text-gray-400 hover:text-gray-600 shrink-0 transition-colors">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <div className="flex-1">
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full rounded-full transition-all duration-500 ease-out"
                                style={{ width: `${warmupProgress}%`, background: cefrColor.css }} />
                        </div>
                    </div>
                    <span className="text-xs font-semibold text-gray-500">Chuẩn bị {warmupStep + 1}/{totalSteps}</span>
                </div>

                {/* Step 0: Vocabulary Preview */}
                {warmupStep === 0 && (
                    <div className={`${styles.introCard} ${styles.slideInRight}`}
                        style={{ '--level-gradient': cefrColor.css, '--level-shadow': cefrColor.shadow } as React.CSSProperties}>
                        <div className="text-3xl mb-3">📚</div>
                        <h2 className="text-lg font-bold text-gray-900 mb-1">
                            {isBeginner ? 'Từ vựng theo chủ đề' : 'Từ khóa quan trọng'}
                        </h2>
                        <p className="text-sm text-gray-500 mb-4">
                            {isBeginner
                                ? 'Em đã biết những từ này chưa? Chúng sẽ xuất hiện trong bài.'
                                : 'Các thuật ngữ này sẽ giúp em đọc bài dễ hơn.'}
                        </p>

                        {keyWords.length > 0 ? (
                            <div className={styles.vocabPreview}>
                                {keyWords.map((word, i) => (
                                    <span key={i} className={styles.vocabChip}
                                        style={{ animationDelay: `${i * 0.05}s` }}>
                                        {word}
                                    </span>
                                ))}
                            </div>
                        ) : (
                            <div className={styles.strategyTip}>
                                <p className={styles.tipIcon}>💡 Tipp</p>
                                <p className={styles.tipText}>Đọc lại tiêu đề và nghĩ nhanh các từ em đã biết về chủ đề này.</p>
                            </div>
                        )}

                        <div className="flex gap-3 mt-6">
                            <button onClick={() => setPhase('exercise')}
                                className={`${styles.navButton} text-xs`}>Bỏ qua</button>
                            <button onClick={() => setWarmupStep(1)}
                                className={`${styles.navButton} ${styles.primary}`}>Tiếp Bước</button>
                        </div>
                    </div>
                )}

                {/* Step 1: Activation Question */}
                {warmupStep === 1 && (
                    <div className={`${styles.introCard} ${styles.slideInRight}`}
                        style={{ '--level-gradient': cefrColor.css, '--level-shadow': cefrColor.shadow } as React.CSSProperties}>
                        <div className="text-3xl mb-3">🤔</div>
                        <h2 className="text-lg font-bold text-gray-900 mb-1">
                            {isBeginner ? 'Nghĩ nhanh trước khi đọc' : 'Trước khi đọc'}
                        </h2>
                        <p className="text-sm text-gray-500 mb-5">
                            {isBeginner
                                ? `Chủ đề là "${topic}". Em tự trả lời nhanh các câu này trong đầu.`
                                : `Với chủ đề "${topic}", hãy suy nghĩ ngắn trước khi đọc:`}
                        </p>

                        <div className="space-y-3">
                            {warmupQuestions.map((q, i) => (
                                <div key={i} className={styles.warmupQuestion}>
                                    <span className="text-sm">💬</span>
                                    <span className="text-sm text-gray-700">{q}</span>
                                </div>
                            ))}
                        </div>

                        {/* Hero image for A1/A2 */}
                        {heroImage && isBeginner && (
                            <div className={styles.introImage}>
                                <Image src={heroImage} alt={topic} width={0} height={0} sizes="100vw" className="w-full h-auto" priority />
                            </div>
                        )}

                        <div className="flex gap-3 mt-6">
                            <button onClick={() => setWarmupStep(0)}
                                className={styles.navButton}>Quay lại</button>
                            <button onClick={() => setWarmupStep(2)}
                                className={`${styles.navButton} ${styles.primary}`}>Tiếp Bước</button>
                        </div>
                    </div>
                )}

                {/* Step 2: Reading Focus */}
                {warmupStep === 2 && (
                    <div className={`${styles.introCard} ${styles.slideInRight}`}
                        style={{ '--level-gradient': cefrColor.css, '--level-shadow': cefrColor.shadow } as React.CSSProperties}>
                        <div className="text-3xl mb-3">🎯</div>
                        <h2 className="text-lg font-bold text-gray-900 mb-1">
                            {isBeginner ? 'Điểm cần chú ý' : 'Trọng tâm khi đọc'}
                        </h2>
                        <p className="text-sm text-gray-500 mb-5">
                            {isBeginner
                                ? 'Đọc theo các bước này:'
                                : 'Khi đọc, hãy đặc biệt chú ý:'}
                        </p>

                        {/* Strategy tip */}
                        {teilInfo?.strategy && (
                            <div className={styles.strategyTip}>
                                <p className={styles.tipIcon}>Chiến lược đọc</p>
                                <p className={styles.tipText}>{teilInfo.strategy}</p>
                            </div>
                        )}

                        {/* Reading checklist */}
                        <div className="mt-4 space-y-2">
                            {isBeginner ? (
                                <>
                                    <div className={styles.warmupChecklist}>
                                        <span>✓</span><span>Đọc chậm và tập trung.</span>
                                    </div>
                                    <div className={styles.warmupChecklist}>
                                        <span>✓</span><span>Gặp từ lạ thì đọc lại cả câu để đoán nghĩa.</span>
                                    </div>
                                    <div className={styles.warmupChecklist}>
                                        <span>✓</span><span>Bài có {questions.length} câu hỏi, cứ làm chậm mà chắc.</span>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className={styles.warmupChecklist}>
                                        <span>✓</span><span>Đọc lướt toàn bài trước để nắm cấu trúc.</span>
                                    </div>
                                    <div className={styles.warmupChecklist}>
                                        <span>✓</span><span>Để ý từ tín hiệu và câu chứa ý chính.</span>
                                    </div>
                                    <div className={styles.warmupChecklist}>
                                        <span>✓</span><span>Đọc câu hỏi trước khi đọc chi tiết.</span>
                                    </div>
                                    <div className={styles.warmupChecklist}>
                                        <span>✓</span><span>{questions.length} câu hỏi, thời gian gợi ý khoảng {estimatedMinutes} phút.</span>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Exercise info */}
                        <div className={styles.exerciseInfo} style={{ marginTop: 20 }}>
                            <span className="px-3 py-1 rounded-full text-xs font-bold text-white"
                                style={{ background: cefrColor.css }}>
                                {cefrLevel}
                            </span>
                            <span className={styles.infoPill}>{isClozeExercise ? `${clozeGapCount} chỗ trống` : `${questions.length} câu hỏi`}</span>
                            <span className={styles.infoPill}>~{estimatedMinutes} phút</span>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button onClick={() => setWarmupStep(1)}
                                className={styles.navButton}>Quay lại</button>
                            <button onClick={() => {
                                setStartTime(Date.now())
                                setPhase('exercise')
                            }}
                                className={styles.startButton}
                                style={{ '--level-gradient': cefrColor.css, '--level-shadow': cefrColor.shadow } as React.CSSProperties}>
                                Vào bài đọc
                            </button>
                        </div>
                    </div>
                )}
            </div>
        )
    }

    // ═══════════════════════════════════════════
    // EXERCISE PHASE — Adaptive layout per level
    // ═══════════════════════════════════════════
    if (phase === 'exercise') {
        const isAdvanced = ['C1', 'C2'].includes(cefrLevel)

        // ═══════════════════════════════════════════
        // CLOZE EXERCISE MODE — all gaps on one page
        // ═══════════════════════════════════════════
        if (isClozeExercise && clozeData) {
            const clozeProgress = clozeGapCount > 0 ? (Object.keys(clozeAnswers).length / clozeGapCount) * 100 : 0
            const clozeTypeLabel = clozeData.type === 'word' ? 'Điền từ'
                : clozeData.type === 'sentence' ? 'Điền câu' : 'Điền đoạn'

            // Render word cloze: text with inline dropdown selectors
            const renderWordClozeInteractive = () => {
                const d = clozeData.data
                const parts = d.text.split(/(\{\d+\})/)
                return (
                    <div className={`${styles.textCard} ${styles.fadeInUp}`}>
                        <div className={styles.textHeader}>
                            <span className={styles.label}>{d.title || 'Bài điền khuyết'}</span>
                            <span className={styles.badge}>{clozeTypeLabel}</span>
                        </div>
                        <div className={`${styles.textBody} ${styles.readingText}`} style={{ lineHeight: 2.2 }}>
                            {parts.map((part: string, i: number) => {
                                const match = part.match(/^\{(\d+)\}$/)
                                if (!match) return <span key={i}>{part}</span>
                                const gapNum = match[1]!
                                const gap = d.gaps.find((g: any) => String(g.pos) === gapNum)
                                if (!gap) return <span key={i} style={{ color: 'red' }}>[?]</span>
                                const selected = clozeAnswers[gapNum]
                                return (
                                    <span key={i} className={styles.clozeGapInline}>
                                        <span className={styles.clozeGapNumber}>{gapNum}</span>
                                        <span className={styles.clozeGapOptions}>
                                            {Object.entries(gap.options).map(([key, val]: [string, any]) => (
                                                <button
                                                    key={key}
                                                    onClick={() => selectClozeAnswer(gapNum!, key)}
                                                    className={`${styles.clozeOptionBtn} ${selected === key ? styles.clozeOptionSelected : ''}`}
                                                >
                                                    <span className={styles.clozeOptionKey}>{key}</span> {val}
                                                </button>
                                            ))}
                                        </span>
                                    </span>
                                )
                            })}
                        </div>
                    </div>
                )
            }

            // Render sentence cloze: text with numbered slots + sentence bank
            const renderSentenceClozeInteractive = () => {
                const d = clozeData.data
                const parts = d.text.split(/(\{\d+\})/)
                const usedSentences = new Set(Object.values(clozeAnswers))
                return (
                    <div className="space-y-5">
                        <div className={`${styles.textCard} ${styles.fadeInUp}`}>
                            <div className={styles.textHeader}>
                                <span className={styles.label}>{d.title || 'Bài điền khuyết'}</span>
                                <span className={styles.badge}>{clozeTypeLabel}</span>
                            </div>
                            <div className={`${styles.textBody} ${styles.readingText}`} style={{ lineHeight: 2 }}>
                                {parts.map((part: string, i: number) => {
                                    const match = part.match(/^\{(\d+)\}$/)
                                    if (!match) return <span key={i}>{part}</span>
                                    const gapNum = match[1]!
                                    const selectedId = clozeAnswers[gapNum]
                                    const selectedSentence = selectedId
                                        ? d.sentences.find((s: any) => s.id === selectedId)
                                        : null
                                    return (
                                        <span key={i} className={styles.clozeSlot}>
                                            <span className={styles.clozeSlotNumber}>{gapNum}</span>
                                            {selectedSentence ? (
                                                <span className={styles.clozeSlotFilled}>
                                                    <span className={styles.clozeSlotId}>{selectedId}</span>
                                                    {selectedSentence.text.slice(0, 60)}…
                                                    <button onClick={() => selectClozeAnswer(gapNum, '')} className={styles.clozeSlotClear}>×</button>
                                                </span>
                                            ) : (
                                                <span className={styles.clozeSlotEmpty}>Chọn câu</span>
                                            )}
                                        </span>
                                    )
                                })}
                            </div>
                        </div>
                        {/* Sentence bank */}
                        <div className={`${styles.textCard} ${styles.fadeInUp}`} style={{ animationDelay: '0.1s' }}>
                            <div className={styles.textHeader}>
                                <span className={styles.label}>Ngân hàng câu</span>
                                <span className={styles.badge}>{d.sentences.length} câu</span>
                            </div>
                            <div className={styles.textBody}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    {d.sentences.map((s: any) => {
                                        const isUsed = usedSentences.has(s.id)
                                        // Find which gap this sentence is assigned to
                                        const assignedGap = Object.entries(clozeAnswers).find(([, v]) => v === s.id)?.[0]
                                        return (
                                            <div key={s.id}
                                                className={`${styles.clozeBankItem} ${isUsed ? styles.clozeBankUsed : ''}`}
                                                style={{ opacity: isUsed ? 0.5 : 1 }}
                                            >
                                                <span className={styles.clozeBankId}>{s.id}</span>
                                                <span className={styles.clozeBankText}>{s.text}</span>
                                                {isUsed && assignedGap && (
                                                    <span className={styles.clozeBankAssigned}>→ Chỗ {assignedGap}</span>
                                                )}
                                                {!isUsed && (
                                                    <div className={styles.clozeBankActions}>
                                                        {Array.from({ length: Object.keys(clozeData.data.answers).length }, (_, i) => String(i + 1))
                                                            .filter(g => !clozeAnswers[g])
                                                            .map(g => (
                                                                <button key={g} onClick={() => selectClozeAnswer(g, s.id)}
                                                                    className={styles.clozeBankAssignBtn}
                                                                >→ {g}</button>
                                                            ))
                                                        }
                                                    </div>
                                                )}
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }

            // Render section cloze: text with paragraph slots + section bank
            const renderSectionClozeInteractive = () => {
                const d = clozeData.data
                const parts = d.text.split(/(\{\d+\})/)
                const usedSections = new Set(Object.values(clozeAnswers))
                return (
                    <div className="space-y-5">
                        <div className={`${styles.textCard} ${styles.fadeInUp}`}>
                            <div className={styles.textHeader}>
                                <span className={styles.label}>{d.title || 'Bài điền khuyết'}</span>
                                <span className={styles.badge}>{clozeTypeLabel}</span>
                            </div>
                            <div className={`${styles.textBody} ${styles.readingText}`} style={{ lineHeight: 1.9 }}>
                                {parts.map((part: string, i: number) => {
                                    const match = part.match(/^\{(\d+)\}$/)
                                    if (!match) return <span key={i}>{part}</span>
                                    const gapNum = match[1]!
                                    const selectedId = clozeAnswers[gapNum]
                                    const selectedSection = selectedId
                                        ? d.sections.find((s: any) => s.id === selectedId)
                                        : null
                                    return (
                                        <div key={i} className={styles.clozeSectionSlot}>
                                            <span className={styles.clozeSlotNumber} style={{ fontSize: '14px' }}>{gapNum}</span>
                                            {selectedSection ? (
                                                <div className={styles.clozeSectionFilled}>
                                                    <span className={styles.clozeSlotId}>{selectedId}</span>
                                                    <span>{selectedSection.text.slice(0, 120)}…</span>
                                                    <button onClick={() => selectClozeAnswer(gapNum, '')} className={styles.clozeSlotClear}>×</button>
                                                </div>
                                            ) : (
                                                <div className={styles.clozeSectionEmpty}>Chọn đoạn</div>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                        {/* Section bank */}
                        <div className={`${styles.textCard} ${styles.fadeInUp}`} style={{ animationDelay: '0.1s' }}>
                            <div className={styles.textHeader}>
                                <span className={styles.label}>Ngân hàng đoạn</span>
                                <span className={styles.badge}>{d.sections.length} đoạn</span>
                            </div>
                            <div className={styles.textBody}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    {d.sections.map((s: any) => {
                                        const isUsed = usedSections.has(s.id)
                                        const assignedGap = Object.entries(clozeAnswers).find(([, v]) => v === s.id)?.[0]
                                        return (
                                            <div key={s.id}
                                                className={`${styles.clozeBankItem} ${isUsed ? styles.clozeBankUsed : ''}`}
                                                style={{ opacity: isUsed ? 0.45 : 1 }}
                                            >
                                                <span className={styles.clozeBankId}>{s.id}</span>
                                                <span className={styles.clozeBankText} style={{ fontSize: '12px' }}>{s.text}</span>
                                                {isUsed && assignedGap && (
                                                    <span className={styles.clozeBankAssigned}>→ Chỗ {assignedGap}</span>
                                                )}
                                                {!isUsed && (
                                                    <div className={styles.clozeBankActions}>
                                                        {Array.from({ length: Object.keys(clozeData.data.answers).length }, (_, i) => String(i + 1))
                                                            .filter(g => !clozeAnswers[g])
                                                            .map(g => (
                                                                <button key={g} onClick={() => selectClozeAnswer(g, s.id)}
                                                                    className={styles.clozeBankAssignBtn}
                                                                >→ {g}</button>
                                                            ))
                                                        }
                                                    </div>
                                                )}
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }

            return (
                <div className="relative">
                    {/* Top bar */}
                    <div className="flex items-center gap-4 mb-5">
                        <button onClick={() => router.push('/reading')} className="text-gray-400 hover:text-gray-600 shrink-0 transition-colors">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                        <div className="flex-1">
                            <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                                <div className="h-full rounded-full transition-all duration-700 ease-out"
                                    style={{ width: `${clozeProgress}%`, background: cefrColor.css }} />
                            </div>
                        </div>
                        <span className="text-sm font-semibold text-gray-600 shrink-0">
                            {Object.keys(clozeAnswers).length}/{clozeGapCount} chỗ
                        </span>
                        <span className="px-2.5 py-1 rounded-lg text-xs font-bold text-white shrink-0"
                            style={{ background: cefrColor.css }}>
                            {cefrLevel}
                        </span>
                    </div>

                    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
                        <div className="min-w-0">
                            {/* Timer + info */}
                            <div className="flex items-center justify-between mb-3">
                                <div className={styles.translateHint}>
                                    Điền đủ {clozeGapCount} chỗ trống
                                </div>
                                <div className={styles.readingTimer}>
                                    ⏱️ {formatTime(Math.round((Date.now() - startTime) / 1000))}
                                </div>
                            </div>

                            {/* Cloze content */}
                            <div className="space-y-5" onClick={handleTextClick} style={{ cursor: 'text' }}>
                                {renderImages(imagesJson, cefrLevel, 'header')}
                                {clozeData.type === 'word' && renderWordClozeInteractive()}
                                {clozeData.type === 'sentence' && renderSentenceClozeInteractive()}
                                {clozeData.type === 'section' && renderSectionClozeInteractive()}
                            </div>

                            {/* Submit button */}
                            <div className="flex justify-center mt-8">
                                <button
                                    onClick={submitCloze}
                                    disabled={!allAnswered || isSubmitting}
                                    className={`${styles.navButton} ${styles.submit}`}
                                    style={{ minWidth: 250, padding: '14px 32px', fontSize: '15px' }}
                                >
                                    {isSubmitting ? 'Đang chấm...' : `Nộp bài (${Object.keys(clozeAnswers).length}/${clozeGapCount})`}
                                </button>
                            </div>
                        </div>

                        <SkillMotivationRail
                            skill="reading"
                            phaseLabel={`Điền khuyết ${cefrLevel}`}
                            title="Giữ mắt ở manh mối chính"
                            message="Hoàn thành từng chỗ trống theo ngữ cảnh. Fuxie chỉ nhắc nhịp, phần đọc vẫn là trung tâm."
                            progressLabel="Cloze progress"
                            progressPercent={clozeProgress}
                            metrics={[
                                { label: 'Gaps', value: `${Object.keys(clozeAnswers).length}/${clozeGapCount}` },
                                { label: 'Time', value: formatTime(Math.round((Date.now() - startTime) / 1000)) },
                                { label: 'Level', value: cefrLevel },
                                { label: 'Mode', value: 'Reading' },
                            ]}
                            rewards={[
                                { type: 'xp', label: `+${Math.max(10, clozeGapCount * 2)} XP`, detail: 'Hoàn thành bài đọc' },
                                { type: 'badge', label: 'Context clue', detail: 'Đọc theo ngữ cảnh' },
                                { type: 'unlock', label: 'Next text', detail: 'Mở bài tiếp theo' },
                            ]}
                        />
                    </div>
                </div>
            )
        }

        // ═══════════════════════════════════════════
        // NORMAL EXERCISE MODE — per-question navigation
        // ═══════════════════════════════════════════
        const q = questions[currentQuestion]
        const progress = questions.length > 0 ? ((currentQuestion + 1) / questions.length) * 100 : 0
        const elapsed = Math.round((Date.now() - startTime) / 1000)


        // Shared question panel JSX
        const questionPanel = q && (
            <div className={styles.questionPanel}>
                {/* Progress dots */}
                <div className={styles.progressDots}>
                    <span className="text-xs text-gray-500 font-semibold mr-2">
                        Câu {currentQuestion + 1}/{questions.length}
                    </span>
                    {questions.map((_, i) => (
                        <div
                            key={i}
                            className={`${styles.dot} ${i === currentQuestion ? styles.active : answers[questions[i]?.id ?? ''] ? styles.answered : ''}`}
                        />
                    ))}
                </div>

                {/* Linked text label */}
                {q.linkedText && (
                    <div className={styles.linkedBadge}>
                        → {q.linkedText}
                    </div>
                )}

                {/* Question statement */}
                <p className="text-base font-bold text-gray-900 mb-5 leading-relaxed">{q.statement}</p>

                {/* Answer buttons */}
                {q.questionType === 'true_false' || q.questionType === 'richtig_falsch' ? (
                    /* ── Richtig/Falsch ── */
                    <div className="flex gap-3">
                        <button
                            onClick={() => selectAnswer(q.id, 'richtig')}
                            className={`${styles.rfButton} ${styles.richtig} ${answers[q.id] === 'richtig' ? styles.selected : ''}`}
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                            Đúng
                        </button>
                        <button
                            onClick={() => selectAnswer(q.id, 'falsch')}
                            className={`${styles.rfButton} ${styles.falsch} ${answers[q.id] === 'falsch' ? styles.selected : ''}`}
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            Sai
                        </button>
                    </div>

                ) : q.questionType === 'matching_ab' || q.questionType === 'matching' ? (
                    /* ── Matching: assign to Text A / B / C... ── */
                    (() => {
                        const texts = Array.isArray(textsJson) ? textsJson : [textsJson]
                        const labels = texts.map((t: any, i: number) =>
                            t.label || t.title || `Text ${String.fromCharCode(65 + i)}`
                        )
                        return (
                            <div className="flex gap-2 flex-wrap">
                                {labels.map((label: string, i: number) => {
                                    const key = String.fromCharCode(65 + i) // A, B, C...
                                    const isSelected = answers[q.id]?.toUpperCase() === key
                                    return (
                                        <button
                                            key={key}
                                            onClick={() => selectAnswer(q.id, key)}
                                            className={`${styles.matchingButton} ${isSelected ? styles.selected : ''}`}
                                        >
                                            <span className={styles.matchingLetter}>{key}</span>
                                            <span className="text-xs truncate max-w-[140px]">{label}</span>
                                        </button>
                                    )
                                })}
                            </div>
                        )
                    })()

                ) : q.questionType === 'ja_nein' ? (
                    /* ── Ja / Nein / Nicht im Text ── */
                    <div className="flex gap-2 flex-wrap">
                        {[
                            { value: 'ja', label: 'Có', icon: '✓' },
                            { value: 'nein', label: 'Không', icon: '×' },
                            { value: 'nicht_im_text', label: 'Không có trong bài', icon: '-' },
                        ].map((opt) => (
                            <button
                                key={opt.value}
                                onClick={() => selectAnswer(q.id, opt.value)}
                                className={`${styles.janeinButton} ${answers[q.id] === opt.value ? styles.selected : ''}`}
                            >
                                <span className="text-base">{opt.icon}</span>
                                <span className="text-sm font-medium">{opt.label}</span>
                            </button>
                        ))}
                    </div>

                ) : q.options && q.options.length > 0 ? (
                    /* ── Multiple Choice / Detail Extraction ── */
                    <div className="space-y-2.5">
                        {q.options.map((opt, i) => {
                            const optionKey = String.fromCharCode(97 + i)
                            const isSelected = answers[q.id] === optionKey
                            return (
                                <button
                                    key={i}
                                    onClick={() => selectAnswer(q.id, optionKey)}
                                    className={`${styles.answerOption} ${isSelected ? styles.selected : ''}`}
                                >
                                    <div className={`w-7 h-7 rounded-lg border-2 shrink-0 flex items-center justify-center text-xs font-bold transition-all ${isSelected ? 'border-[#60A8E4] bg-[#60A8E4] text-white' : 'border-gray-300 text-gray-500'
                                        }`}>
                                        {String.fromCharCode(65 + i)}
                                    </div>
                                    <span className={`text-sm ${isSelected ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
                                        {opt}
                                    </span>
                                </button>
                            )
                        })}
                    </div>
                ) : (
                    /* ── Fallback: text input ── */
                    <input
                        type="text"
                        value={answers[q.id] || ''}
                        onChange={(e) => selectAnswer(q.id, e.target.value)}
                        placeholder="Nhập câu trả lời..."
                        className="w-full p-3.5 rounded-xl border-2 border-gray-200 text-sm focus:border-[#60A8E4] focus:ring-2 focus:ring-[#60A8E4]/20 outline-none transition-all"
                    />
                )}

                {/* Navigation */}
                <div className="flex gap-3 mt-6">
                    {currentQuestion > 0 && (
                        <button
                            onClick={() => setCurrentQuestion(c => c - 1)}
                            className={styles.navButton}
                        >
                            Câu trước
                        </button>
                    )}
                    {currentQuestion < questions.length - 1 ? (
                        <button
                            onClick={() => setCurrentQuestion(c => c + 1)}
                            className={`${styles.navButton} ${styles.primary}`}
                        >
                            Câu tiếp theo
                        </button>
                    ) : (
                        <button
                            onClick={submitAnswers}
                            disabled={!allAnswered || isSubmitting}
                            className={`${styles.navButton} ${styles.submit}`}
                        >
                            {isSubmitting ? 'Đang chấm...' : `Nộp bài (${Object.keys(answers).length}/${questions.length})`}
                        </button>
                    )}
                </div>

                {/* Mascot peek */}
                <div className="flex justify-center mt-4 opacity-60">
                    <Mascot variant="thinking" size={40} />
                </div>
            </div>
        )

        return (
            <div className="relative">
                {/* ── Top Progress Bar ── */}
                <div className="flex items-center gap-4 mb-5">
                    <button onClick={() => router.push('/reading')} className="text-gray-400 hover:text-gray-600 shrink-0 transition-colors">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                    <div className="flex-1">
                        <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                                className="h-full rounded-full transition-all duration-700 ease-out"
                                style={{ width: `${progress}%`, background: cefrColor.css }}
                            />
                        </div>
                    </div>
                    <span className="text-sm font-semibold text-gray-600 shrink-0">
                        {currentQuestion + 1}/{questions.length}
                    </span>
                    {/* Vocab panel toggle */}
                    <button
                        onClick={() => setShowVocabPanel(v => !v)}
                        className={styles.vocabToggle}
                        title="Từ đã tra"
                    >
                        📖 {vocabList.length > 0 && <span className={styles.vocabBadge}>{vocabList.length}</span>}
                    </button>
                    <span className="px-2.5 py-1 rounded-lg text-xs font-bold text-white shrink-0"
                        style={{ background: cefrColor.css }}>
                        {cefrLevel}
                    </span>
                </div>

                {canUseQuestEpisode && (
                    <div className="mb-5 rounded-2xl bg-[#F3FBFF] px-4 py-3 ring-1 ring-[#CCE4F0]/70">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <div className="min-w-0">
                                <p className="text-xs font-black uppercase text-text-brand">
                                    {activeCheckpoint.title}
                                </p>
                                <p className="truncate text-xs font-semibold text-slate-500">
                                    {activeCheckpoint.objective}
                                </p>
                            </div>
                            <div className="flex min-w-[180px] items-center gap-2 text-xs font-black text-text-brand">
                                <span>{Math.max(0, questions.length - currentQuestion - 1)} con lai</span>
                                <FuxieProgressBar
                                    value={Math.round(((currentQuestion + 1) / Math.max(1, questions.length)) * 100)}
                                    className="h-2 flex-1"
                                />
                            </div>
                        </div>
                    </div>
                )}

                <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
                    <div className="min-w-0">
                {/* Click-to-translate hint + reading timer */}
                <div className="flex items-center justify-between mb-3">
                    {vocabList.length === 0 ? (
                        <div className={styles.translateHint}>
                            Bấm vào từ trong bài để xem nghĩa
                        </div>
                    ) : <div />}
                    <div className={styles.readingTimer}>
                        ⏱️ {formatTime(Math.round((Date.now() - startTime) / 1000))}
                    </div>
                </div>

                <div onClick={handleTextClick} style={{ cursor: 'text' }}>
                    {isAdvanced ? (
                        /* \u2550\u2550\u2550 C1/C2: Full-width reader mode \u2550\u2550\u2550 */
                        <div className="space-y-6">
                            <div className="space-y-4">
                                {renderAnzeigenCards(textsJson, imagesJson, cefrLevel)}
                                {renderSchilderCards(textsJson, imagesJson, cefrLevel)}
                                {renderTexts(textsJson, cefrLevel)}
                                {renderImages(imagesJson, cefrLevel, 'header')}
                            </div>
                            <div className="max-w-2xl mx-auto">
                                {questionPanel}
                            </div>
                        </div>
                    ) : (
                        /* \u2550\u2550\u2550 A1-B2: Two-column layout \u2550\u2550\u2550 */
                        <div className="flex flex-col lg:flex-row gap-5">
                            <div className="lg:w-3/5 space-y-4">
                                {renderAnzeigenCards(textsJson, imagesJson, cefrLevel)}
                                {renderSchilderCards(textsJson, imagesJson, cefrLevel)}
                                {renderTexts(textsJson, cefrLevel)}
                            </div>
                            <div className="lg:w-2/5 lg:sticky lg:top-6 lg:self-start">
                                {questionPanel}
                                {renderImages(imagesJson, cefrLevel, 'header')}
                            </div>
                        </div>
                    )}
                </div>

                    </div>

                    <SkillMotivationRail
                        skill="reading"
                        phaseLabel={`Câu ${currentQuestion + 1}/${questions.length}`}
                        title="Đọc theo manh mối, không đoán vội"
                        message="Tập trung vào câu hỏi hiện tại, dùng dịch nhanh khi cần và giữ nhịp đọc đều đến cuối bài."
                        progressLabel="Question progress"
                        progressPercent={progress}
                        metrics={[
                            { label: 'Answered', value: `${Object.keys(answers).length}/${questions.length}` },
                            { label: 'Time', value: formatTime(elapsed) },
                            { label: 'Level', value: cefrLevel },
                            { label: 'Vocab', value: `${vocabList.length}` },
                        ]}
                        rewards={[
                            { type: 'xp', label: `+${Math.max(10, questions.length * 3)} XP`, detail: 'Hoàn thành bài đọc' },
                            { type: 'badge', label: 'Focus reader', detail: 'Giữ mạch đọc' },
                            { type: 'unlock', label: 'Next text', detail: 'Mở bài tiếp theo' },
                        ]}
                    />
                </div>

                {/* ── Translation Tooltip ── */}
                {tooltip && (
                    <div
                        ref={tooltipRef}
                        className={styles.translateTooltip}
                        style={{
                            left: Math.min(tooltip.x, window.innerWidth - 220),
                            top: tooltip.y - 70,
                            position: 'fixed',
                        }}
                    >
                        <div className="font-bold text-sm text-gray-900">{tooltip.word}</div>
                        {tooltip.loading ? (
                            <div className="text-xs text-gray-400 animate-pulse">Übersetzen...</div>
                        ) : (
                            <div className="text-xs text-gray-600">{tooltip.translation}</div>
                        )}
                    </div>
                )}

                {/* ── Vocab Panel Sidebar ── */}
                {showVocabPanel && (
                    <div className={styles.vocabPanel}>
                        <div className={styles.vocabPanelHeader}>
                            <h3 className="text-sm font-bold text-gray-900">Từ đã tra</h3>
                            <button onClick={() => setShowVocabPanel(false)} className="text-gray-400 hover:text-gray-600">
                                ✕
                            </button>
                        </div>
                        {vocabList.length === 0 ? (
                            <p className="text-xs text-gray-400 p-4 text-center">
                                Bấm vào từ trong bài để lưu nghĩa ở đây.
                            </p>
                        ) : (
                            <div className={styles.vocabPanelList}>
                                {vocabList.map((v, i) => (
                                    <div key={i} className={styles.vocabPanelItem}>
                                        <span className="font-semibold text-gray-800">{v.word}</span>
                                        <span className="text-gray-500">{v.translation}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        )
    }

    // ═══════════════════════════════════════════
    // RESULTS PHASE — Cloze exercises
    // ═══════════════════════════════════════════
    if (phase === 'results' && clozeResults) {
        const { score, total, percentage, timeTaken, gaps } = clozeResults
        const message = resultMessage(percentage)
        const mascotVariant = percentage >= 70 ? 'celebrate' : percentage >= 50 ? 'encourage' : 'studying'
        const tips = POST_READING_TIPS[cefrLevel] || POST_READING_TIPS.A1!

        // Get display label for a cloze answer
        const getAnswerLabel = (gap: typeof gaps[0]) => {
            if (clozeData?.type === 'word') {
                const gapInfo = clozeData.data.gaps?.find((g: any) => String(g.pos) === gap.pos)
                const userLabel = gapInfo?.options?.[gap.userAnswer] || gap.userAnswer
                const correctLabel = gapInfo?.options?.[gap.correctAnswer] || gap.correctAnswer
                return { userLabel: `${gap.userAnswer}) ${userLabel}`, correctLabel: `${gap.correctAnswer}) ${correctLabel}` }
            }
            if (clozeData?.type === 'sentence') {
                const userSentence = clozeData.data.sentences?.find((s: any) => s.id === gap.userAnswer)
                const correctSentence = clozeData.data.sentences?.find((s: any) => s.id === gap.correctAnswer)
                return {
                    userLabel: `${gap.userAnswer}: ${(userSentence?.text || '?').slice(0, 60)}…`,
                    correctLabel: `${gap.correctAnswer}: ${(correctSentence?.text || '?').slice(0, 60)}…`,
                }
            }
            // section cloze
            const userSection = clozeData?.data.sections?.find((s: any) => s.id === gap.userAnswer)
            const correctSection = clozeData?.data.sections?.find((s: any) => s.id === gap.correctAnswer)
            return {
                userLabel: `${gap.userAnswer}: ${(userSection?.text || '?').slice(0, 50)}…`,
                correctLabel: `${gap.correctAnswer}: ${(correctSection?.text || '?').slice(0, 50)}…`,
            }
        }

        return (
            <div className="max-w-3xl mx-auto">
                {/* Celebration Header */}
                <div className={styles.introCard} style={{ '--level-gradient': cefrColor.css, '--level-shadow': cefrColor.shadow } as React.CSSProperties}>
                    {percentage >= 60 && (
                        <div className="absolute inset-0 pointer-events-none">
                            {[...Array(20)].map((_, i) => (
                                <div key={i} className="absolute w-2 h-2 rounded-full"
                                    style={{
                                        left: `${Math.random() * 100}%`,
                                        top: `${Math.random() * 60}%`,
                                        backgroundColor: CELEBRATION_CONFETTI_PALETTE[i % CELEBRATION_CONFETTI_PALETTE.length],
                                        opacity: 0.3 + Math.random() * 0.4,
                                    }}
                                />
                            ))}
                        </div>
                    )}
                    <Mascot variant={mascotVariant} size={80} className="mx-auto relative z-10" />

                    {/* Score Ring */}
                    <div className={`relative w-28 h-28 mx-auto mt-4 ${styles.scoreRing}`}
                        style={{ '--ring-color': cefrColor.shadow } as React.CSSProperties}>
                        <svg className="w-28 h-28 transform -rotate-90" viewBox="0 0 112 112">
                            <circle cx="56" cy="56" r="48" stroke="#E5E7EB" strokeWidth="8" fill="none" />
                            <circle cx="56" cy="56" r="48"
                                stroke={percentage >= 70 ? '#10B981' : percentage >= 50 ? '#FF8A3D' : '#EF4444'}
                                strokeWidth="8" fill="none"
                                strokeDasharray={`${2 * Math.PI * 48}`}
                                strokeDashoffset={`${2 * Math.PI * 48 * (1 - percentage / 100)}`}
                                strokeLinecap="round"
                                className="transition-all duration-1000"
                            />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-3xl font-black text-gray-900">{percentage}%</span>
                            <span className="text-xs text-gray-500">{score}/{total}</span>
                        </div>
                    </div>

                    <p className="text-xl font-bold text-gray-900 text-center mt-3">{message}</p>
                    <p className="text-sm text-gray-500 text-center mt-1">
                        Bài điền khuyết - {formatTime(timeTaken)}
                    </p>
                </div>

                {/* Gap-by-gap feedback */}
                <div className="mt-6 space-y-3">
                    <h3 className="text-base font-bold text-gray-800 mb-3">Tổng kết chỗ trống</h3>
                    {gaps.map((gap) => {
                        const { userLabel, correctLabel } = getAnswerLabel(gap)
                        return (
                            <div key={gap.pos}
                                className={`${styles.clozeResultCard} ${gap.isCorrect ? styles.clozeResultCorrect : styles.clozeResultWrong}`}>
                                <div className={styles.clozeResultGapNum}>{gap.pos}</div>
                                <div className={styles.clozeResultContent}>
                                    {gap.isCorrect ? (
                                        <div>
                                            <span className="font-semibold text-green-800">Đúng: {userLabel}</span>
                                        </div>
                                    ) : (
                                        <div>
                                            <div><span className="font-semibold text-red-700">Câu em chọn:</span> {userLabel || '(trống)'}</div>
                                            <div className="mt-1"><span className="font-semibold text-green-700">Đáp án đúng:</span> {correctLabel}</div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>

                {/* Tips */}
                <div className={`mt-6 ${styles.introCard}`}>
                    <h3 className="text-sm font-bold text-gray-800 mb-3">Bước tiếp theo</h3>
                    <ul className="space-y-2">
                        {tips.map((tip, i) => (
                            <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                                <span>•</span><span>{tip}</span>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Action buttons */}
                <div className="flex gap-3 mt-6 justify-center">
                    <button onClick={() => router.push('/reading')} className={styles.navButton}>
                        Về danh sách
                    </button>
                    <button onClick={() => {
                        setClozeAnswers({})
                        setClozeResults(null)
                        setStartTime(Date.now())
                        setPhase('exercise')
                    }} className={`${styles.navButton} ${styles.primary}`}>
                        Luyện lại
                    </button>
                </div>
            </div>
        )
    }

    // ═══════════════════════════════════════════
    // RESULTS PHASE — Normal exercises
    // ═══════════════════════════════════════════
    if (phase === 'results' && results) {
        const { score, totalQuestions, percentage, questionResults } = results
        const message = resultMessage(percentage)
        const mascotVariant = percentage >= 70 ? 'celebrate' : percentage >= 50 ? 'encourage' : 'studying'
        const episodeReceipt = results.questEpisodeReceipt

        return (
            <div className="max-w-3xl mx-auto">
                {/* ── Celebration Header ── */}
                <div className={styles.introCard} style={{ '--level-gradient': cefrColor.css, '--level-shadow': cefrColor.shadow } as React.CSSProperties}>
                    {/* Confetti background */}
                    {percentage >= 60 && (
                        <div className="absolute inset-0 pointer-events-none">
                            {[...Array(20)].map((_, i) => (
                                <div
                                    key={i}
                                    className="absolute w-2 h-2 rounded-full"
                                    style={{
                                        left: `${Math.random() * 100}%`,
                                        top: `${Math.random() * 60}%`,
                                        backgroundColor: CELEBRATION_CONFETTI_PALETTE[i % CELEBRATION_CONFETTI_PALETTE.length],
                                        opacity: 0.3 + Math.random() * 0.4,
                                    }}
                                />
                            ))}
                        </div>
                    )}

                    <Mascot variant={mascotVariant} size={80} className="mx-auto relative z-10" />

                    {/* Score Ring — level-colored */}
                    <div className={`relative w-28 h-28 mx-auto mt-4 ${styles.scoreRing}`}
                        style={{ '--ring-color': cefrColor.shadow } as React.CSSProperties}>
                        <svg className="w-28 h-28 transform -rotate-90" viewBox="0 0 112 112">
                            <circle cx="56" cy="56" r="48" stroke="#E5E7EB" strokeWidth="8" fill="none" />
                            <circle
                                cx="56" cy="56" r="48"
                                stroke={percentage >= 70 ? '#10B981' : percentage >= 50 ? '#FF8A3D' : '#EF4444'}
                                strokeWidth="8" fill="none"
                                strokeDasharray={`${2 * Math.PI * 48}`}
                                strokeDashoffset={`${2 * Math.PI * 48 * (1 - percentage / 100)}`}
                                strokeLinecap="round"
                                className="transition-all duration-1000"
                            />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-2xl font-bold text-gray-900">{score}/{totalQuestions}</span>
                            <span className="text-sm text-gray-500">{percentage}%</span>
                        </div>
                    </div>

                    <h2 className="text-xl font-bold text-gray-900 mt-4">{message}</h2>

                    {/* Badges — level-colored */}
                    <div className="flex items-center justify-center gap-2 mt-3 flex-wrap">
                        <span className="px-3 py-1 rounded-full text-xs font-bold text-white"
                            style={{ background: cefrColor.css }}>
                            {cefrLevel} - Đọc - Phần {teil}
                        </span>
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">
                            {topic}
                        </span>
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#FFF4D6] text-text-reward">
                            +{Math.round(score * 4)} XP
                        </span>
                    </div>

                    {/* Stats */}
                    <div className="flex justify-center gap-4 mt-5">
                        <div className="px-4 py-2.5 bg-gray-50 rounded-xl text-center">
                            <p className="text-lg font-bold text-gray-900">⏱️ {formatTime(results.timeTaken)}</p>
                            <p className="text-xs text-gray-500">Thời gian</p>
                        </div>
                        <div className="px-4 py-2.5 bg-gray-50 rounded-xl text-center">
                            <p className="text-lg font-bold text-gray-900">📊 {percentage}%</p>
                            <p className="text-xs text-gray-500">Kết quả</p>
                        </div>
                        <div className="px-4 py-2.5 bg-gray-50 rounded-xl text-center">
                            <p className="text-lg font-bold text-gray-900">✅ {score}</p>
                            <p className="text-xs text-gray-500">Đúng</p>
                        </div>
                    </div>
                </div>

                {episodeReceipt ? (
                    <div className="mt-5 rounded-2xl bg-[#F3FBFF] p-4 ring-1 ring-[#CCE4F0]/70">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div className="min-w-0">
                                <p className="text-xs font-black uppercase text-text-brand">
                                    Episode receipt
                                </p>
                                <h3 className="mt-1 text-lg font-black text-slate-950">
                                    {episodeReceipt.completedCheckpoints}/{episodeReceipt.checkpointCount} checkpoint · {episodeReceipt.accuracyBand.replaceAll('_', ' ')}
                                </h3>
                                <p className="mt-1 text-sm font-semibold leading-relaxed text-text-brand">
                                    {episodeReceipt.masteryContribution}
                                </p>
                                {results.xpEarned !== undefined ? (
                                    <p className="mt-2 text-xs font-bold text-slate-500">
                                        +{results.xpEarned} XP{results.fucoinEarned ? ` / +${results.fucoinEarned} Fucoin` : ''}
                                    </p>
                                ) : null}
                            </div>
                            <button
                                onClick={() => {
                                    if (episodeReceipt.recommendedAction === 'next_episode') {
                                        router.push(episodeReceipt.nextEpisodeHref)
                                    } else {
                                        resetExercise()
                                    }
                                }}
                                className={fuxieButtonClass(episodeReceipt.recommendedAction === 'next_episode' ? 'primary' : 'reward', 'md', 'shrink-0')}
                            >
                                {episodeReceipt.recommendedAction === 'next_episode' ? 'Di tiep' : 'Doc lai'}
                            </button>
                        </div>
                        <FuxieProgressBar
                            value={Math.round((episodeReceipt.completedCheckpoints / Math.max(1, episodeReceipt.checkpointCount)) * 100)}
                            className="mt-4"
                        />
                    </div>
                ) : null}

                {/* ── Question Breakdown ── */}
                <div className="mt-5">
                    <div className={styles.questionPanel}>
                        <h3 className="text-sm font-bold text-gray-700 mb-3">Tổng kết câu trả lời</h3>
                        <div className="space-y-2.5">
                            {questionResults.map((qr) => (
                                <button
                                    key={qr.questionId}
                                    onClick={() => setExpandedResult(expandedResult === qr.questionId ? null : qr.questionId)}
                                    className={`${styles.resultCard} ${qr.isCorrect ? styles.correct : styles.incorrect}`}
                                >
                                    <div className="flex items-start gap-2">
                                        <span className="text-base mt-0.5">{qr.isCorrect ? '✅' : '❌'}</span>
                                        <div className="flex-1">
                                            <p className="text-sm font-semibold text-gray-900">
                                                Q{qr.questionNumber} — {qr.statement}
                                            </p>
                                            {qr.isCorrect ? (
                                                <p className="text-xs text-green-600 mt-1 font-medium">
                                                    {qr.correctAnswer}
                                                </p>
                                            ) : (
                                                <>
                                                    <p className="text-xs text-red-500 mt-1">
                                                        Câu em chọn: <span className="font-medium">{qr.userAnswer}</span>
                                                    </p>
                                                    <p className="text-xs text-green-600 mt-0.5">
                                                        Đáp án đúng: <span className="font-medium">{qr.correctAnswer}</span>
                                                    </p>
                                                </>
                                            )}

                                            {/* Expanded explanation */}
                                            {expandedResult === qr.questionId && qr.explanation && (
                                                <div className={styles.explanation}>
                                                    <p className="font-bold text-yellow-700 mb-1">Giải thích</p>
                                                    {typeof qr.explanation === 'object' && qr.explanation !== null ? (
                                                        <>
                                                            {(qr.explanation as ExplanationData).key_evidence && (
                                                                <p className="mt-1">
                                                                     <span className="font-semibold">Dẫn chứng chính:</span>{' '}
                                                                    <span className={styles.evidenceHighlight}>{(qr.explanation as ExplanationData).key_evidence}</span>
                                                                </p>
                                                            )}
                                                            {(qr.explanation as ExplanationData).reasoning && (
                                                                <p className="mt-1">{(qr.explanation as ExplanationData).reasoning}</p>
                                                            )}
                                                            {(qr.explanation as ExplanationData).vocabulary_help && (
                                                                <div className="mt-2 pt-2 border-t border-yellow-200">
                                                                    <p className="font-semibold text-yellow-700">Từ vựng</p>
                                                                    {Object.entries((qr.explanation as ExplanationData).vocabulary_help!).map(([word, meaning]) => (
                                                                        <p key={word} className="mt-0.5">
                                                                            <span className="font-medium">{word}</span> — {meaning}
                                                                        </p>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </>
                                                    ) : (
                                                        <p>{String(qr.explanation)}</p>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                        <svg
                                            className={`w-4 h-4 text-gray-400 transition-transform shrink-0 mt-1 ${expandedResult === qr.questionId ? 'rotate-180' : ''}`}
                                            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* ── Post-Reading Review: Vocab Summary ── */}
                {vocabList.length > 0 && (
                    <div className="mt-5">
                        <div className={styles.questionPanel}>
                            <h3 className="text-sm font-bold text-gray-700 mb-3">Từ đã tra</h3>
                            <p className="text-xs text-gray-500 mb-3">
                                Em đã tra {vocabList.length} từ trong lúc đọc. Hãy ôn lại để nhớ lâu hơn.
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {vocabList.map((v, i) => (
                                    <div key={i} className={styles.vocabReviewCard}>
                                        <span className="font-bold text-gray-800 text-sm">{v.word}</span>
                                        <span className="text-gray-500 text-xs">{v.translation}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* ── Post-Reading Review: Performance Insights ── */}
                <div className="mt-5">
                    <div className={styles.questionPanel}>
                        <h3 className="text-sm font-bold text-gray-700 mb-3">Phân tích bài đọc</h3>
                        <div className="space-y-3">
                            {/* Strengths */}
                            {percentage >= 60 && (
                                <div className={styles.insightCard} style={{ borderLeftColor: 'var(--color-text-success)' }}>
                                    <span className="text-sm">💪</span>
                                    <div>
                                        <p className="text-xs font-bold text-green-700">Điểm mạnh</p>
                                        <p className="text-xs text-gray-600">
                                            {percentage >= 90
                                                ? 'Em nắm ý chính rất tốt.'
                                                : percentage >= 70
                                                    ? 'Em hiểu phần lớn thông tin quan trọng.'
                                                    : 'Em đã có nền hiểu bài, cố gắng luyện thêm nhé.'}
                                        </p>
                                    </div>
                                </div>
                            )}
                            {/* Areas for improvement */}
                            {percentage < 90 && (
                                <div className={styles.insightCard} style={{ borderLeftColor: 'var(--color-fuxie-energy)' }}>
                                    <span className="text-sm">🎯</span>
                                    <div>
                                        <p className="text-xs font-bold text-orange-700">Cần cải thiện</p>
                                        <p className="text-xs text-gray-600">
                                            {percentage < 50
                                                ? 'Đọc lại chậm hơn và chú ý từ khóa.'
                                                : percentage < 70
                                                    ? 'Tập trung thêm vào chi tiết và mệnh đề phụ.'
                                                    : 'Để đạt điểm cao hơn, kiểm tra cả thông tin ngụ ý.'}
                                        </p>
                                    </div>
                                </div>
                            )}
                            {/* Vocab insight */}
                            {vocabList.length > 0 && (
                                <div className={styles.insightCard} style={{ borderLeftColor: 'var(--color-cefr-b2)' }}>
                                    <span className="text-sm">📚</span>
                                    <div>
                                        <p className="text-xs font-bold text-indigo-700">Từ vựng</p>
                                        <p className="text-xs text-gray-600">
                                            {vocabList.length <= 3
                                                ? `Em chỉ cần tra ${vocabList.length} từ, vốn từ đang ổn.`
                                                : `Em đã tra ${vocabList.length} từ. Nên ôn lại đều để đọc nhanh hơn.`}
                                        </p>
                                    </div>
                                </div>
                            )}
                            {/* Time insight */}
                            <div className={styles.insightCard} style={{ borderLeftColor: 'var(--color-cefr-c1)' }}>
                                <span className="text-sm">⏱️</span>
                                <div>
                                        <p className="text-xs font-bold text-purple-700">Tốc độ</p>
                                    <p className="text-xs text-gray-600">
                                        {results.timeTaken < estimatedMinutes * 45
                                            ? 'Em đọc khá nhanh. Lần sau hãy dành thêm thời gian cho chi tiết.'
                                            : results.timeTaken < estimatedMinutes * 90
                                                ? 'Tốc độ ổn, đủ thời gian để xử lý bài.'
                                                : 'Em dành nhiều thời gian hơn, điều này hoàn toàn ổn khi đang luyện.'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Post-Reading Review: Reading Tip ── */}
                <div className="mt-5">
                    <div className={styles.readingTipCard} style={{ '--level-gradient': cefrColor.css } as React.CSSProperties}>
                        <div className="flex items-start gap-3">
                            <span className="text-2xl">💡</span>
                            <div>
                                <p className="text-sm font-bold text-gray-900 mb-1">
                                    {isBeginner ? 'Gợi ý học tiếp' : 'Khuyến nghị'}
                                </p>
                                <p className="text-sm text-gray-700">
                                    {(POST_READING_TIPS[cefrLevel] ?? POST_READING_TIPS.A1!)[Math.floor(Math.random() * 3)]}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Action buttons — level-colored ── */}
                <div className="flex gap-3 mt-5">
                    <button
                        onClick={() => router.push('/reading')}
                        className={styles.navButton}
                    >
                        Về danh sách
                    </button>
                    <button
                        onClick={resetExercise}
                        className={`${styles.navButton} ${styles.primary}`}
                    >
                        Luyện lại
                    </button>
                </div>
            </div>
        )
    }

    return null
}
