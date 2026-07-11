'use client'

import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { resultRewardIcons } from '@/components/gamification/result-reward-loop'
import { CompletionFlow } from '@/components/gamification/completion-flow'
import { FuxieLive3D } from '@/components/gamification/fuxie-live-3d'
import { FUXIE_3D_ASSETS, FuxieCoach, RewardPreview, SkillMotivationRail, type RewardPreviewItem } from '@/components/gamification/quest-visuals'
import { trackClientAnalyticsEvent } from '@/lib/analytics/client-events'
import {
    buildListeningQuestEpisode,
    getListeningQuestCheckpoint,
    type ListeningQuestEpisodeReceipt,
} from '@/lib/gamification/listening-quest-episode'
import { Mascot } from '@/components/ui/mascot'
import { FuxieBadge, FuxieProgressBar } from '@/components/ui/fuxie-ui'
import { getCefrTheme } from '@/lib/constants/cefr'
import { useSuppressLearnerMainChrome } from '@/hooks/use-suppress-chrome'
import { useReducedMotion } from '@/hooks/use-reduced-motion'
import { OptionTile, AudioButton, PrimaryCta } from '@fuxie/ui/components'
import { BottomFeedback } from '@/components/vocabulary/exercises/bottom-feedback'

// ─── Types ──────────────────────────────────────────
interface Question {
    id: string
    questionNumber: number
    questionType: string
    questionText: string
    questionTextNative: string | null
    options: string[]
    correctAnswer: string
    sortOrder: number
}

interface QuestionResult {
    questionId: string
    questionNumber: number
    questionText: string
    options: string[]
    userAnswer: string
    correctAnswer: string
    isCorrect: boolean
    explanation: string | null
    explanationNative: string | null
}

interface TranscriptLine {
    speaker?: string
    speaker_role?: string
    text: string
}

interface TranscriptData {
    lines?: TranscriptLine[]
}

interface LessonPlayerProps {
    lessonId: string
    title: string
    topic: string
    cefrLevel: string
    teil: number
    teilName: string
    taskType: string
    audioUrl: string
    audioDuration: number | null
    backgroundScene: string | null
    questions: Question[]
    transcript: TranscriptData | null
    maxPlays: number // Goethe rule: A1/A2 = 2, B2+ = 1 or 2
    mockState?: string
    isVisualQa?: boolean
}

// ─── Constants ──────────────────────────────────────


const DEFAULT_SPEEDS: Record<string, number> = {
    A1: 0.75, A2: 0.85, B1: 1.0, B2: 1.15, C1: 1.25, C2: 1.5,
}

const SPEED_OPTIONS = [0.5, 0.75, 1.0, 1.25, 1.5]

type Phase = 'intro' | 'listening' | 'review' | 'results'

const SCENE_I18N_KEYS: Record<string, 'sceneCafe' | 'sceneStation' | 'sceneStore' | 'sceneClinic' | 'sceneHome'> = {
    cafe: 'sceneCafe',
    station: 'sceneStation',
    store: 'sceneStore',
    clinic: 'sceneClinic',
    home: 'sceneHome',
}

// ─── Lesson Player Component ────────────────────────
export function LessonPlayer({
    lessonId, title: _title, topic, cefrLevel, teil, teilName, taskType,
    audioUrl, audioDuration, backgroundScene, questions, transcript, maxPlays,
    mockState,
    isVisualQa,
}: LessonPlayerProps) {
    const router = useRouter()
    const t = useTranslations('Listening')
    const tVoc = useTranslations('Vocabulary')
    const reducedMotion = useReducedMotion()
    const defaultPlaybackSpeed = DEFAULT_SPEEDS[cefrLevel] ?? 1.0
    const audioRef = useRef<HTMLAudioElement>(null)
    const [phase, setPhase] = useState<Phase>('intro')
    const [isPlaying, setIsPlaying] = useState(false)
    const [currentTime, setCurrentTime] = useState(0)
    const [duration, setDuration] = useState(audioDuration || 0)
    const [playCount, setPlayCount] = useState(0)
    const [playbackSpeed, setPlaybackSpeed] = useState(defaultPlaybackSpeed)
    const [currentQuestion, setCurrentQuestion] = useState(0)
    const [answers, setAnswers] = useState<Record<string, string>>({})
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [results, setResults] = useState<{
        score: number; totalQuestions: number; percentage: number;
        xpEarned: number; fucoinEarned?: number; walletBalance?: number; fucoinDuplicate?: boolean; fucoinIntended?: number; fucoinDailyCap?: number; fucoinDailyEarned?: number; fucoinDailyRemaining?: number; fucoinCapReached?: boolean; streak?: { currentStreak: number; isNewDay: boolean; freezeUsed?: boolean; freezesAvailable?: number; freezesUsed?: number }; rewardPreview?: RewardPreviewItem[]; questEpisodeReceipt?: ListeningQuestEpisodeReceipt; nextEpisodeHref?: string; timeTaken: number; listenCount: number; questionResults: QuestionResult[]
    } | null>(null)
    const [showTranscript, setShowTranscript] = useState(false)
    const [audioError, setAudioError] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [startTime, setStartTime] = useState(Date.now())
    const cefrColor = getCefrTheme(cefrLevel)
    const trackedCheckpoints = useRef<Set<string>>(new Set())
    const completionTracked = useRef(false)
    const questEpisode = useMemo(() => buildListeningQuestEpisode({
        lessonId,
        topic,
        cefrLevel,
        questionCount: questions.length,
        nextEpisodeHref: '/listening',
    }), [lessonId, topic, cefrLevel, questions.length])
    const activeCheckpoint = getListeningQuestCheckpoint({
        episode: questEpisode,
        currentIndex: currentQuestion,
    })

    // Immersive fullscreen chrome suppression for all active gameplay
    // (question / selected / correct / wrong live in phase === 'listening').
    // Intro + results restore learner chrome (like Review/SRS).
    useSuppressLearnerMainChrome(phase === 'listening')

    // Gameplay answering states
    const [selectedOption, setSelectedOption] = useState<string | null>(null)
    const [isChecked, setIsChecked] = useState(false)
    const [isCurrentAnswerCorrect, setIsCurrentAnswerCorrect] = useState(false)

    // Visual QA mock states
    useEffect(() => {
        if (isVisualQa) {
            if (mockState === 'selected') {
                setSelectedOption('a')
                setIsChecked(false)
                setPhase('listening')
            } else if (mockState === 'correct') {
                setSelectedOption('a')
                setIsChecked(true)
                setIsCurrentAnswerCorrect(true)
                setPhase('listening')
            } else if (mockState === 'wrong') {
                setSelectedOption('b')
                setIsChecked(true)
                setIsCurrentAnswerCorrect(false)
                setPhase('listening')
            } else if (mockState === 'results') {
                setResults({
                    score: 1,
                    totalQuestions: 1,
                    percentage: 100,
                    xpEarned: 25,
                    fucoinEarned: 10,
                    walletBalance: 100,
                    fucoinDuplicate: false,
                    fucoinDailyCap: 100,
                    fucoinDailyEarned: 10,
                    fucoinDailyRemaining: 90,
                    fucoinCapReached: false,
                    streak: { currentStreak: 5, isNewDay: true },
                    timeTaken: 120,
                    listenCount: 1,
                    questionResults: [
                        {
                            questionId: 'q1',
                            questionNumber: 1,
                            questionText: 'Wer ist Herr Land?',
                            options: [
                                'Der neue Kollege aus Berlin',
                                'Der Chef der Marketingabteilung',
                                'Ein Kunde aus Hamburg'
                            ],
                            userAnswer: 'a',
                            correctAnswer: 'a',
                            isCorrect: true,
                            explanation: null,
                            explanationNative: null,
                        }
                    ],
                    questEpisodeReceipt: {
                        episodeId: 'mock-episode',
                        skill: 'listening',
                        sourceId: 'L-A1-GOETHE-001-T1',
                        lessonId: 'L-A1-GOETHE-001-T1',
                        cefrLevel: 'A1',
                        accuracyBand: 'mastered',
                        completedCheckpoints: 1,
                        checkpointCount: 1,
                        recommendedAction: 'next_episode',
                        nextEpisodeHref: '/listening',
                        masteryContribution: t('completedCheckpoints'),
                    },
                })
                setPhase('results')
            } else {
                setPhase('listening')
            }
        }
    }, [mockState, isVisualQa, t])

    // Audio event handlers
    useEffect(() => {
        const audio = audioRef.current
        if (!audio) return

        const onTime = () => setCurrentTime(audio.currentTime)
        const onDuration = () => setDuration(audio.duration)
        const onEnded = () => { setIsPlaying(false); setPlayCount(c => c + 1) }
        const onPlay = () => setIsPlaying(true)
        const onPause = () => setIsPlaying(false)
        const onError = () => {
            console.error('Audio loading error:', audio.error)
            if (isVisualQa) return
            setAudioError(true)
            setIsPlaying(false)
        }

        audio.addEventListener('timeupdate', onTime)
        audio.addEventListener('loadedmetadata', onDuration)
        audio.addEventListener('ended', onEnded)
        audio.addEventListener('play', onPlay)
        audio.addEventListener('pause', onPause)
        audio.addEventListener('error', onError)

        return () => {
            audio.removeEventListener('timeupdate', onTime)
            audio.removeEventListener('loadedmetadata', onDuration)
            audio.removeEventListener('ended', onEnded)
            audio.removeEventListener('play', onPlay)
            audio.removeEventListener('pause', onPause)
            audio.removeEventListener('error', onError)
        }
    }, [phase, audioUrl])

    // Speed change
    useEffect(() => {
        if (audioRef.current) audioRef.current.playbackRate = playbackSpeed
    }, [playbackSpeed, phase])

    useEffect(() => {
        if (phase !== 'listening') return
        if (trackedCheckpoints.current.has(activeCheckpoint.id)) return
        trackedCheckpoints.current.add(activeCheckpoint.id)
        trackClientAnalyticsEvent({
            eventName: 'quest_episode_checkpoint_reached',
            source: 'listening.quest_episode.checkpoint',
            actionId: questEpisode.episodeId,
            actionType: 'listening_task',
            level: cefrLevel,
            skill: 'listening',
            metadata: {
                episodeId: questEpisode.episodeId,
                skill: 'listening',
                lessonId,
                cefrLevel,
                checkpointId: activeCheckpoint.id,
                questionCount: questions.length,
            },
        })
    }, [activeCheckpoint.id, cefrLevel, lessonId, phase, questEpisode.episodeId, questions.length])

    useEffect(() => {
        if (phase !== 'results' || !results?.questEpisodeReceipt || completionTracked.current) return
        completionTracked.current = true
        trackClientAnalyticsEvent({
            eventName: 'quest_episode_completed',
            source: 'listening.quest_episode.completed',
            actionId: questEpisode.episodeId,
            actionType: 'listening_task',
            level: cefrLevel,
            skill: 'listening',
            metadata: {
                episodeId: questEpisode.episodeId,
                skill: 'listening',
                lessonId,
                cefrLevel,
                checkpointId: 'details',
                questionCount: results.totalQuestions,
                accuracyBand: results.questEpisodeReceipt.accuracyBand,
            },
        })
    }, [cefrLevel, lessonId, phase, questEpisode.episodeId, results])

    const togglePlay = useCallback(() => {
        const audio = audioRef.current
        if (!audio) return
        if (isPlaying) {
            audio.pause()
        } else {
            if (playCount >= maxPlays && audio.currentTime >= duration - 0.5) return
            audio.play()
        }
    }, [isPlaying, playCount, maxPlays, duration])

    const seekTo = (value: number) => {
        const audio = audioRef.current
        if (!audio || !duration) return
        const clamped = Math.max(0, Math.min(duration, value))
        audio.currentTime = clamped
        setCurrentTime(clamped)
    }

    const handleSeekInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        seekTo(Number(e.target.value))
    }

    const handleSeekKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (!duration) return
        const step = e.shiftKey ? 5 : 1
        if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
            e.preventDefault()
            seekTo(currentTime - step)
        } else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
            e.preventDefault()
            seekTo(currentTime + step)
        } else if (e.key === 'Home') {
            e.preventDefault()
            seekTo(0)
        } else if (e.key === 'End') {
            e.preventDefault()
            seekTo(duration)
        }
    }

    const cycleSpeed = () => {
        const idx = SPEED_OPTIONS.indexOf(playbackSpeed)
        const next = SPEED_OPTIONS[(idx + 1) % SPEED_OPTIONS.length] ?? 1.0
        setPlaybackSpeed(next)
    }

    const replayAudio = () => {
        const audio = audioRef.current
        if (!audio) return
        if (playCount >= maxPlays) return
        audio.currentTime = 0
        audio.play()
    }

    const selectAnswer = (questionId: string, answer: string) => {
        if (!isChecked) {
            setSelectedOption(answer)
        }
    }

    const handleCheck = () => {
        if (!selectedOption) return
        const q = questions[currentQuestion]
        if (!q) return

        const correct = selectedOption.toLowerCase() === q.correctAnswer.toLowerCase()
        setIsCurrentAnswerCorrect(correct)
        setIsChecked(true)

        // Accumulate user answer in state
        setAnswers(prev => ({ ...prev, [q.id]: selectedOption }))
    }

    const handleContinue = async () => {
        if (currentQuestion < questions.length - 1) {
            setSelectedOption(null)
            setIsChecked(false)
            setIsCurrentAnswerCorrect(false)
            setCurrentQuestion(c => c + 1)
        } else {
            await submitAnswers()
        }
    }

    const submitAnswers = async () => {
        setIsSubmitting(true)
        setError(null)
        try {
            const timeTaken = Math.round((Date.now() - startTime) / 1000)
            const submittedListenCount = Math.max(1, playCount)
            const res = await fetch(`/api/v1/listening/${lessonId}/submit`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    answers,
                    timeTaken,
                    listenCount: submittedListenCount,
                    questEpisode: {
                        episodeId: questEpisode.episodeId,
                        skill: questEpisode.skill,
                        sourceId: questEpisode.sourceId,
                        cefrLevel: questEpisode.cefrLevel,
                        checkpointCount: questEpisode.checkpoints.length,
                        nextEpisodeHref: questEpisode.nextEpisodeHref,
                    },
                }),
            })
            if (!res.ok) {
                throw new Error(t('errorSubmit'))
            }
            const data = await res.json()
            if (data.success) {
                setResults({
                    ...data.data,
                    timeTaken,
                    listenCount: submittedListenCount,
                })
                setPhase('results')
            } else {
                throw new Error(data.error || t('errorSubmit'))
            }
        } catch (err: unknown) {
            console.error(err)
            const message = err instanceof Error ? err.message : t('errorConnection')
            setError(message || t('errorConnection'))
        } finally {
            setIsSubmitting(false)
        }
    }

    const formatTime = (s: number) => {
        const m = Math.floor(s / 60)
        const sec = Math.floor(s % 60)
        return `${m}:${sec.toString().padStart(2, '0')}`
    }

    const canPlayAgain = playCount < maxPlays

    const startEpisode = () => {
        trackedCheckpoints.current = new Set()
        completionTracked.current = false
        setStartTime(Date.now())
        setPhase('listening')
        trackClientAnalyticsEvent({
            eventName: 'quest_episode_started',
            source: 'listening.quest_episode.started',
            actionId: questEpisode.episodeId,
            actionType: 'listening_task',
            level: cefrLevel,
            skill: 'listening',
            metadata: {
                episodeId: questEpisode.episodeId,
                skill: 'listening',
                lessonId,
                cefrLevel,
                checkpointId: 'preview',
                questionCount: questions.length,
            },
        })
        // Play only from the Start gesture — never for visual QA fixtures
        // (no real audio), and never as unsolicited autoplay.
        if (!isVisualQa) {
            void audioRef.current?.play().catch(() => {})
        }
    }

    const sceneLabel = backgroundScene
        ? (SCENE_I18N_KEYS[backgroundScene]
            ? t(SCENE_I18N_KEYS[backgroundScene])
            : backgroundScene)
        : null

    const resetLesson = () => {
        const audio = audioRef.current
        if (audio) {
            audio.pause()
            audio.currentTime = 0
        }
        setIsPlaying(false)
        setCurrentTime(0)
        setPlayCount(0)
        setCurrentQuestion(0)
        setAnswers({})
        setResults(null)
        setShowTranscript(false)
        setError(null)
        setStartTime(Date.now())
        setPhase('intro')
        setAudioError(false)
        trackedCheckpoints.current = new Set()
        completionTracked.current = false

        // Reset gameplay states
        setSelectedOption(null)
        setIsChecked(false)
        setIsCurrentAnswerCorrect(false)
    }

    const retryAudio = () => {
        setAudioError(false)
        if (audioRef.current) {
            audioRef.current.load()
            if (!isVisualQa) {
                void audioRef.current.play().catch(() => {})
            }
        }
    }

    const resultMessage = (percentage: number) => {
        if (percentage >= 90) return t('excellent')
        if (percentage >= 70) return t('veryGood')
        if (percentage >= 50) return t('goodEffort')
        return t('needReplay')
    }

    // All phases share a single <audio> element at top-level to avoid
    // unmount/remount (and re-download) when changing phases.
    const audioElement = <audio ref={audioRef} src={audioUrl} preload="metadata" />

    // ═══════════════════════════════════════════
    // INTRO PHASE
    // ═══════════════════════════════════════════
    if (phase === 'intro') {
        return (
            <div className="max-w-lg mx-auto px-4 py-8" data-listening-phase="intro">
                {audioElement}

                {/* Back control ≥44px + focus-visible; secondary only (Start is sole primary) */}
                <button
                    type="button"
                    onClick={() => router.push('/listening')}
                    className="mb-6 inline-flex min-h-[44px] min-w-[44px] items-center gap-2 rounded-xl px-3 text-sm font-semibold text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--fuxie-blue-700)]"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                    </svg>
                    {t('backToList')}
                </button>

                {/* Lesson Info */}
                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm text-center">
                    <FuxieLive3D state="wave" fallbackSrc={FUXIE_3D_ASSETS.radioHost} alt={t('altListeningCoach')} size={112} priority />
                    <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                        <FuxieBadge tone="brand" className="normal-case tracking-normal">
                            {t('listeningEpisode')}
                        </FuxieBadge>
                        <FuxieBadge tone="neutral" className="normal-case tracking-normal">
                            {cefrLevel} · {taskType}
                        </FuxieBadge>
                    </div>
                    <p className="mt-4 text-xs font-black uppercase tracking-wide text-text-brand">{t('questBriefing')}</p>
                    <h1 className="text-xl font-bold text-gray-900 mt-4">{topic}</h1>
                    <p className="text-sm text-gray-500 mt-1">{t('part', { num: teil, name: teilName })}</p>

                    <div className="flex items-center justify-center gap-3 mt-4 flex-wrap">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r ${cefrColor.gradient} text-white`}>
                            {cefrLevel}
                        </span>
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">{taskType}</span>
                        {sceneLabel && (
                            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-600">
                                {sceneLabel}
                            </span>
                        )}
                    </div>

                    <div className="mt-6 p-4 bg-[#F3FBFF] rounded-xl text-sm text-gray-700 ring-1 ring-[#60A8E4]/15">
                        <p className="font-semibold text-text-brand mb-2">{t('instructions')}</p>
                        <p>{t('instructionDetail', { maxPlays, questionCount: questions.length })}</p>
                        <p className="mt-1 text-gray-500">{t('speedDuration', { speed: defaultPlaybackSpeed, time: formatTime(duration || 180) })}</p>
                    </div>

                    <p className="mt-4 text-sm font-semibold leading-relaxed text-text-brand">
                        {questEpisode.objective} {t('rewardNote')}
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

                    <FuxieCoach
                        role="coach"
                        eyebrow={t('episodeV1')}
                        title={t('checkpointCoachTitle')}
                        message={t('coachNoFucoinMessage')}
                        className="mt-4 bg-[#F3FBFF]"
                    />

                    {audioError && (
                        <div className="mt-4 p-4 bg-red-50 border border-red-100 rounded-xl flex items-center justify-between gap-3 text-sm text-red-600">
                            <div className="flex items-center gap-2 min-w-0">
                                <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span>{t('audioLoadError')}</span>
                            </div>
                            <button
                                type="button"
                                onClick={retryAudio}
                                className="inline-flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-xl px-3 font-bold underline hover:text-red-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--fuxie-blue-700)]"
                            >
                                {t('tryAgain')}
                            </button>
                        </div>
                    )}

                    <PrimaryCta
                        onClick={startEpisode}
                        disabled={audioError}
                        className="mt-6 w-full"
                    >
                        {t('startListening')}
                    </PrimaryCta>
                </div>
            </div>
        )
    }

    if (phase === 'listening') {
        const q = questions[currentQuestion]
        if (!q) return null
        const progressPct = duration > 0 ? (currentTime / duration) * 100 : 0
        const playDisabled = !canPlayAgain && !isPlaying
        const mascotVariant = isCurrentAnswerCorrect ? 'celebrate' : 'encourage'

        return (
            <div
                className="fixed inset-0 z-50 flex flex-col fuxie-gameplay-bg text-slate-950 overflow-y-auto pb-24"
                data-listening-phase="listening"
                data-gameplay-overlay="true"
            >
                {audioElement}

                {/* Immersive header bar: close ≥44×44 + progress */}
                <header className="px-4 sm:px-6 py-4 flex items-center justify-between gap-4 border-b border-gray-200 bg-white/95 backdrop-blur-sm">
                    <button
                        type="button"
                        onClick={() => router.push('/listening')}
                        className="inline-flex h-11 w-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-xl text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--fuxie-blue-700)]"
                        aria-label={t('closeSession')}
                    >
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                    <div className="flex-1 max-w-xl">
                        <FuxieProgressBar
                            value={Math.round(((currentQuestion + 1) / Math.max(1, questions.length)) * 100)}
                            className={`h-4 bg-gray-200 rounded-full ${reducedMotion ? '' : ''}`}
                        />
                    </div>
                    <span className="text-sm font-bold text-gray-500 min-w-[60px] text-right" aria-live="polite">
                        {t('questionProgress', { current: currentQuestion + 1, total: questions.length })}
                    </span>
                </header>

                <div className="flex-1 max-w-5xl w-full mx-auto px-4 py-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
                    <div className="min-w-0 space-y-6">
                        {/* Audio Player Card — audio is the primary action */}
                        <div className="bg-white rounded-2xl p-6 border border-[var(--fuxie-blue-200)]/70 shadow-[var(--fuxie-shadow-card)] flex flex-col items-center justify-center text-center">
                            <AudioButton
                                state={isPlaying ? 'playing' : 'idle'}
                                size="lg"
                                ariaLabel={isPlaying ? t('pauseAudio') : t('playAudio')}
                                onClick={togglePlay}
                                disabled={playDisabled}
                                aria-disabled={playDisabled || undefined}
                                title={playDisabled ? t('playCountLimit', { count: maxPlays }) : undefined}
                                className={`w-16 h-16 min-w-[64px] min-h-[64px] ${reducedMotion ? 'motion-reduce:animate-none' : ''}`}
                            />

                            <div className="mt-4 w-full max-w-md">
                                {/* Native range seek — keyboard operable, labeled */}
                                <label className="sr-only" htmlFor="listening-audio-seek">
                                    {t('seekSliderAria')}
                                </label>
                                <div className="relative h-2 w-full">
                                    <div
                                        className="pointer-events-none absolute inset-0 overflow-hidden rounded-full bg-gray-100"
                                        aria-hidden="true"
                                    >
                                        <div
                                            className={`h-full rounded-full bg-gradient-to-r from-[#60A8E4] to-[#2EC4B6] ${reducedMotion ? '' : 'transition-[width] duration-150'}`}
                                            style={{ width: `${progressPct}%` }}
                                        />
                                    </div>
                                    <input
                                        id="listening-audio-seek"
                                        type="range"
                                        min={0}
                                        max={duration > 0 ? duration : 0}
                                        step={0.1}
                                        value={currentTime}
                                        onChange={handleSeekInput}
                                        onKeyDown={handleSeekKeyDown}
                                        aria-label={t('seekSliderAria')}
                                        aria-valuemin={0}
                                        aria-valuemax={duration > 0 ? duration : 0}
                                        aria-valuenow={currentTime}
                                        aria-valuetext={`${formatTime(currentTime)} / ${formatTime(duration)}`}
                                        className="relative z-10 h-2 w-full cursor-pointer appearance-none bg-transparent accent-[var(--fuxie-blue-600)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--fuxie-blue-700)]"
                                    />
                                </div>
                                <div className="flex items-center justify-between mt-2.5 text-xs text-gray-400">
                                    <span>{formatTime(currentTime)}</span>
                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={cycleSpeed}
                                            aria-label={t('speedControlAria', { speed: playbackSpeed })}
                                            className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl bg-gray-100 px-3 text-xs font-bold text-gray-600 transition-colors hover:bg-gray-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--fuxie-blue-700)]"
                                        >
                                            {playbackSpeed}x
                                        </button>
                                        <button
                                            type="button"
                                            onClick={replayAudio}
                                            disabled={!canPlayAgain}
                                            aria-label={t('replayAria')}
                                            aria-disabled={!canPlayAgain || undefined}
                                            className={`inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl px-3 font-semibold underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--fuxie-blue-700)] ${canPlayAgain ? 'text-[#60A8E4]' : 'text-gray-300 cursor-not-allowed no-underline'}`}
                                        >
                                            {t('listenAgain', { count: playCount, max: maxPlays })}
                                        </button>
                                    </div>
                                    <span>{formatTime(duration)}</span>
                                </div>
                            </div>

                            {audioError && (
                                <div className="mt-4 p-3 w-full max-w-md bg-red-50 border border-red-100 rounded-xl flex items-center justify-between gap-3 text-xs text-red-600">
                                    <span>{t('audioErrorShort')}</span>
                                    <button
                                        type="button"
                                        onClick={retryAudio}
                                        className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl px-3 font-bold underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--fuxie-blue-700)]"
                                    >
                                        {t('tryAgain')}
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Question Area */}
                        {q && (
                            <div className="bg-white rounded-2xl p-6 border border-[var(--fuxie-blue-200)]/70 shadow-[var(--fuxie-shadow-card)]">
                                <div className="mb-4 flex items-start justify-between gap-3">
                                    <div className="min-w-0 flex-1">
                                        <h2 className="text-xl font-black text-gray-900 mb-2 leading-snug">{q.questionText}</h2>
                                        {q.questionTextNative && (
                                            <p className="text-sm font-semibold text-gray-400">{q.questionTextNative}</p>
                                        )}
                                    </div>
                                    {/* Mascot reacts after Check (correct / wrong) */}
                                    {isChecked && (
                                        <div className="shrink-0" data-role="listening-mascot-reaction" aria-hidden="true">
                                            <Mascot variant={mascotVariant} size={56} />
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-3 mt-4">
                                    {q.options.map((opt, i) => {
                                        const optionKey = String.fromCharCode(97 + i)
                                        const isSelected = selectedOption === optionKey
                                        let status: 'idle' | 'selected' | 'correct' | 'incorrect' = 'idle'
                                        if (isSelected) {
                                            status = 'selected'
                                        }
                                        if (isChecked) {
                                            const isCorrectOpt = optionKey === q.correctAnswer
                                            if (isCorrectOpt) {
                                                status = 'correct'
                                            } else if (isSelected) {
                                                status = 'incorrect'
                                            }
                                        }

                                        return (
                                            <OptionTile
                                                key={i}
                                                text={opt}
                                                status={status}
                                                onClick={() => selectAnswer(q.id, optionKey)}
                                                disabled={isChecked}
                                            />
                                        )
                                    })}
                                </div>

                                {error && (
                                    <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600" role="alert">
                                        {error}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <SkillMotivationRail
                        skill="listening"
                        phaseLabel={t('phaseLabel', { current: currentQuestion + 1, total: questions.length })}
                        title={isPlaying ? t('motivationListening') : t('motivationReplay')}
                        message={t('motivationMessage')}
                        progressLabel={t('progressLabel')}
                        progressPercent={questions.length > 0 ? ((currentQuestion + 1) / questions.length) * 100 : 0}
                        metrics={[
                            { label: t('metricSpeed'), value: `${playbackSpeed}x` },
                            { label: t('metricAudio'), value: `${formatTime(currentTime)}` },
                        ]}
                        rewards={[
                            { type: 'xp', label: `+${Math.max(10, questions.length * 3)} XP`, detail: t('rewardCompleteDetail') },
                            { type: 'badge', label: t('rewardGoodEar'), detail: t('rewardGoodEarDetail') },
                            { type: 'streak', label: t('rewardDailyRhythm'), detail: t('rewardDailyRhythmDetail') },
                        ]}
                    />
                </div>

                {/* Footer: Check → BottomFeedback Continue (single primary path) */}
                {!isChecked ? (
                    <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 p-5 shadow-lg">
                        <div className="max-w-5xl mx-auto flex justify-end px-4">
                            <PrimaryCta
                                disabled={!selectedOption || isSubmitting}
                                onClick={handleCheck}
                                className="w-full sm:w-auto min-w-[160px]"
                            >
                                {tVoc('checkBtn')}
                            </PrimaryCta>
                        </div>
                    </div>
                ) : (
                    <BottomFeedback
                        isCorrect={isCurrentAnswerCorrect}
                        correctAnswer={
                            isCurrentAnswerCorrect
                                ? null
                                : q.options[q.correctAnswer.charCodeAt(0) - 97] || q.correctAnswer
                        }
                        onContinue={handleContinue}
                    />
                )}
            </div>
        )
    }

    // ═══════════════════════════════════════════
    // RESULTS PHASE
    // ═══════════════════════════════════════════
    if (phase === 'results' && results) {
        const {
            score,
            totalQuestions,
            percentage,
            xpEarned,
            fucoinEarned = 0,
            walletBalance,
            fucoinDuplicate = false,
            fucoinDailyCap,
            fucoinDailyEarned,
            fucoinCapReached = false,
            streak,
            questionResults,
        } = results
        const message = resultMessage(percentage)
        const { Clock3, Headphones: HeadphonesIcon, Target } = resultRewardIcons
        const resultCopy = percentage >= 90
            ? {
                title: t('res90Title'),
                coachTitle: t('res90CoachTitle'),
                coachMessage: t('res90CoachMsg'),
                unlockLabel: t('unlockLabelNext'),
                unlockDetail: t('unlockDetailGo'),
            }
            : percentage >= 70
                ? {
                    title: t('res70Title'),
                    coachTitle: t('res70CoachTitle'),
                    coachMessage: t('res70CoachMsg'),
                    unlockLabel: t('unlockLabelGood'),
                    unlockDetail: t('unlockDetailGo'),
                }
                : percentage >= 50
                    ? {
                        title: t('res50Title'),
                        coachTitle: t('res50CoachTitle'),
                        coachMessage: t('res50CoachMsg'),
                        unlockLabel: t('unlockLabelFocus'),
                        unlockDetail: t('unlockDetailWrong'),
                    }
                    : {
                        title: t('res0Title'),
                        coachTitle: t('res0CoachTitle'),
                        coachMessage: t('res0CoachMsg'),
                        unlockLabel: t('unlockLabelReplay'),
                        unlockDetail: t('unlockDetailMain'),
                    }
        const attemptMeta = [
            {
                icon: <Clock3 className="h-4 w-4" />,
                label: t('time'),
                value: formatTime(results.timeTaken),
                detail: t('timeDetail'),
            },
            {
                icon: <HeadphonesIcon className="h-4 w-4" />,
                label: t('plays'),
                value: `${results.listenCount}x`,
                detail: t('playsDetail', { max: maxPlays }),
            },
            {
                icon: <Target className="h-4 w-4" />,
                label: t('result'),
                value: `${percentage}%`,
                detail: t('resultDetail', { score, total: totalQuestions }),
            },
        ]
        const fucoinLabel = fucoinEarned > 0
            ? t('fucoinEarnedLabel', { amount: fucoinEarned })
            : fucoinDuplicate
                ? t('fucoinAlreadyReceived')
                : fucoinCapReached
                    ? t('fucoinDailyCapReached')
                    : t('fucoinZeroLabel')
        const fucoinDetail = fucoinEarned > 0
            ? walletBalance !== undefined
                ? t('fucoinWalletBalance', { balance: walletBalance })
                : t('fucoinAddedToWallet')
            : fucoinDuplicate
                ? t('fucoinAlreadyRewarded')
                : fucoinCapReached && fucoinDailyCap !== undefined
                    ? t('fucoinDailyCapDetail', { cap: fucoinDailyCap })
                    : fucoinDailyCap !== undefined && fucoinDailyEarned !== undefined
                        ? t('fucoinDailyProgress', { earned: fucoinDailyEarned, cap: fucoinDailyCap })
                        : t('fucoinNoNewReward')
        const rewardPreview = [
            {
                type: 'xp' as const,
                label: `+${xpEarned} XP`,
                detail: t('rewardXpListeningDetail'),
            },
            {
                type: 'fucoin' as const,
                label: fucoinLabel,
                detail: fucoinDetail,
            },
            {
                type: 'streak' as const,
                label: streak?.freezeUsed ? t('rewardStreakFreeze') : t('rewardStreakRhythm'),
                detail: streak?.freezeUsed
                    ? t('rewardStreakFreezeDetail', { days: streak.currentStreak })
                    : t('rewardStreakKeep'),
            },
        ]
        const displayRewardPreview = results.rewardPreview && results.rewardPreview.length > 0
            ? results.rewardPreview
            : rewardPreview
        const episodeReceipt = results.questEpisodeReceipt

        return (
            <div className="max-w-4xl mx-auto px-4 py-6" data-listening-phase="results">
                {audioElement}

                {/* Single primary action surface via CompletionFlow — no duplicate bottom CTAs */}
                <CompletionFlow
                    mode="alreadySaved"
                    skill="listening"
                    title={resultCopy.title}
                    message={t('resultSummaryText', { score, total: totalQuestions, msg: message })}
                    scoreLabel={`${score}/${totalQuestions}`}
                    scoreDetail={t('correctAnswerDetail')}
                    accuracy={percentage}
                    xpEarned={xpEarned}
                    attemptMeta={attemptMeta}
                    rewardPreview={displayRewardPreview}
                    streakReceipt={streak
                        ? {
                            freezeUsed: Boolean(streak.freezeUsed),
                            currentStreak: streak.currentStreak,
                            freezesAvailable: streak.freezesAvailable ?? 0,
                            freezesUsed: streak.freezesUsed ?? 0,
                        }
                        : undefined}
                    hasNextStep={Boolean(results.nextEpisodeHref ?? episodeReceipt?.nextEpisodeHref)}
                    primaryAction={{ label: t('nextEpisode'), href: '/listening' }}
                    secondaryAction={{ label: t('replay'), onClick: resetLesson }}
                    dashboardAction={{ label: t('backToDashboard'), href: '/dashboard' }}
                    coachTitle={resultCopy.coachTitle}
                    coachMessage={resultCopy.coachMessage}
                    className="mb-5"
                />

                {episodeReceipt ? (
                    <div className="mb-5 rounded-2xl bg-[#F3FBFF] p-4 ring-1 ring-[#CCE4F0]/70" data-role="episode-receipt">
                        <div className="min-w-0">
                            <p className="text-xs font-black uppercase tracking-wide text-text-brand">
                                {t('episodeReceipt')}
                            </p>
                            <h3 className="mt-1 text-lg font-black text-slate-950">
                                {t('completedCheckpoints')}
                            </h3>
                            <p className="mt-1 text-sm font-semibold leading-relaxed text-text-brand">
                                {episodeReceipt.masteryContribution}
                            </p>
                        </div>
                        <FuxieProgressBar
                            value={Math.round((episodeReceipt.completedCheckpoints / Math.max(1, episodeReceipt.checkpointCount)) * 100)}
                            className="mt-4"
                        />
                    </div>
                ) : null}

                {/* Compact answer review */}
                <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm mb-5">
                    <h3 className="text-sm font-bold text-gray-700 mb-3">{t('summary')}</h3>
                    <div className="space-y-2.5">
                        {questionResults.map((qr) => (
                            <div
                                key={qr.questionId}
                                className={`p-3.5 rounded-xl border-l-4 ${qr.isCorrect ? 'bg-green-50/50 border-green-400' : 'bg-red-50/50 border-red-400'}`}
                            >
                                <div className="flex items-start gap-2">
                                    <span className="text-base mt-0.5" aria-hidden="true">{qr.isCorrect ? '✅' : '❌'}</span>
                                    <div className="flex-1">
                                        <p className="text-sm font-semibold text-gray-900">{qr.questionText}</p>
                                        {qr.isCorrect ? (
                                            <p className="text-sm text-green-600 mt-1">
                                                {qr.options[qr.correctAnswer.charCodeAt(0) - 97] || qr.correctAnswer}
                                            </p>
                                        ) : (
                                            <>
                                                <p className="text-sm text-red-500 mt-1">
                                                    {t('yourChoice')} {qr.options[qr.userAnswer.charCodeAt(0) - 97] || qr.userAnswer}
                                                </p>
                                                <p className="text-sm text-green-600 mt-0.5">
                                                    {t('correctAnswer')} {qr.options[qr.correctAnswer.charCodeAt(0) - 97] || qr.correctAnswer}
                                                </p>
                                                {qr.explanationNative && (
                                                    <p className="text-xs text-gray-500 mt-1 italic">{qr.explanationNative}</p>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Transcript toggle — stable IDs + expanded/controls relationships */}
                {transcript && (
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm mb-5 overflow-hidden">
                        <button
                            id="listening-transcript-trigger"
                            type="button"
                            onClick={() => setShowTranscript(!showTranscript)}
                            aria-expanded={showTranscript}
                            aria-controls="listening-transcript-panel"
                            className="w-full flex min-h-[44px] items-center justify-between p-4 hover:bg-gray-50 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--fuxie-blue-700)]"
                        >
                            <span className="text-sm font-semibold text-gray-700">{showTranscript ? t('hideTranscript') : t('showTranscript')}</span>
                            <svg
                                className={`w-4 h-4 text-gray-400 ${reducedMotion ? '' : 'transition-transform'} ${showTranscript ? 'rotate-180' : ''}`}
                                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                                aria-hidden="true"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>
                        {showTranscript ? (
                            <div
                                id="listening-transcript-panel"
                                role="region"
                                aria-labelledby="listening-transcript-trigger"
                                className={`px-4 pb-4 space-y-2 ${reducedMotion ? '' : 'animate-fade-in-up'}`}
                                data-role="listening-transcript-panel"
                            >
                                {(transcript.lines || []).map((line: TranscriptLine, i: number) => (
                                    <div key={i} className="flex gap-2 text-sm">
                                        <span className={`font-semibold shrink-0 ${line.speaker_role === 'exam_narrator' ? 'text-purple-600' : 'text-blue-600'}`}>
                                            {line.speaker}:
                                        </span>
                                        <span className="text-gray-700">{line.text}</span>
                                    </div>
                                ))}
                            </div>
                        ) : null}
                    </div>
                )}
            </div>
        )
    }

    return null
}
