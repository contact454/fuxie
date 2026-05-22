'use client'

import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
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
import { FuxieBadge, FuxieProgressBar, fuxieButtonClass } from '@/components/ui/fuxie-ui'
import { getCefrTheme } from '@/lib/constants/cefr'

// ─── Types ──────────────────────────────────────────
interface Question {
    id: string
    questionNumber: number
    questionType: string
    questionText: string
    questionTextNative: string | null
    options: string[]
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
}

// ─── Constants ──────────────────────────────────────


const DEFAULT_SPEEDS: Record<string, number> = {
    A1: 0.75, A2: 0.85, B1: 1.0, B2: 1.15, C1: 1.25, C2: 1.5,
}

const SPEED_OPTIONS = [0.5, 0.75, 1.0, 1.25, 1.5]

type Phase = 'intro' | 'listening' | 'review' | 'results'

const BACKGROUND_SCENE_LABELS: Record<string, string> = {
    cafe: 'Quán cà phê',
    station: 'Nhà ga',
    store: 'Cửa hàng',
    clinic: 'Phòng khám',
    home: 'Ở nhà',
}

// ─── Lesson Player Component ────────────────────────
export function LessonPlayer({
    lessonId, title: _title, topic, cefrLevel, teil, teilName, taskType,
    audioUrl, audioDuration, backgroundScene, questions, transcript, maxPlays,
}: LessonPlayerProps) {
    const router = useRouter()
    const audioRef = useRef<HTMLAudioElement>(null)
    const autoPlayTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const [phase, setPhase] = useState<Phase>('intro')
    const [isPlaying, setIsPlaying] = useState(false)
    const [currentTime, setCurrentTime] = useState(0)
    const [duration, setDuration] = useState(audioDuration || 0)
    const [playCount, setPlayCount] = useState(0)
    const [playbackSpeed, setPlaybackSpeed] = useState(DEFAULT_SPEEDS[cefrLevel] || 1.0)
    const [currentQuestion, setCurrentQuestion] = useState(0)
    const [answers, setAnswers] = useState<Record<string, string>>({})
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [results, setResults] = useState<{
        score: number; totalQuestions: number; percentage: number;
        xpEarned: number; fucoinEarned?: number; walletBalance?: number; fucoinDuplicate?: boolean; fucoinIntended?: number; fucoinDailyCap?: number; fucoinDailyEarned?: number; fucoinDailyRemaining?: number; fucoinCapReached?: boolean; streak?: { currentStreak: number; isNewDay: boolean; freezeUsed?: boolean; freezesAvailable?: number; freezesUsed?: number }; rewardPreview?: RewardPreviewItem[]; questEpisodeReceipt?: ListeningQuestEpisodeReceipt; nextEpisodeHref?: string; timeTaken: number; listenCount: number; questionResults: QuestionResult[]
    } | null>(null)
    const [showTranscript, setShowTranscript] = useState(false)
    const [audioError, setAudioError] = useState(false)
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
        return () => {
            if (autoPlayTimeoutRef.current) {
                clearTimeout(autoPlayTimeoutRef.current)
            }
        }
    }, [])

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

    const seekTo = (e: React.MouseEvent<HTMLDivElement>) => {
        const audio = audioRef.current
        if (!audio || !duration) return
        const rect = e.currentTarget.getBoundingClientRect()
        const pos = (e.clientX - rect.left) / rect.width
        audio.currentTime = pos * duration
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
        setAnswers(prev => ({ ...prev, [questionId]: answer }))
    }

    const submitAnswers = async () => {
        setIsSubmitting(true)
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
            const data = await res.json()
            if (data.success) {
                setResults({
                    ...data.data,
                    timeTaken,
                    listenCount: submittedListenCount,
                })
                setPhase('results')
            }
        } catch (err) {
            console.error(err)
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
    const allAnswered = questions.every(q => answers[q.id])

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
        if (autoPlayTimeoutRef.current) {
            clearTimeout(autoPlayTimeoutRef.current)
        }
        autoPlayTimeoutRef.current = setTimeout(() => {
            audioRef.current?.play().catch(() => {})
        }, 300)
    }

    const resetLesson = () => {
        const audio = audioRef.current
        if (audio) {
            audio.pause()
            audio.currentTime = 0
        }
        if (autoPlayTimeoutRef.current) {
            clearTimeout(autoPlayTimeoutRef.current)
            autoPlayTimeoutRef.current = null
        }
        setIsPlaying(false)
        setCurrentTime(0)
        setPlayCount(0)
        setCurrentQuestion(0)
        setAnswers({})
        setResults(null)
        setShowTranscript(false)
        setStartTime(Date.now())
        setPhase('intro')
        setAudioError(false)
        trackedCheckpoints.current = new Set()
        completionTracked.current = false
    }

    const retryAudio = () => {
        setAudioError(false)
        if (audioRef.current) {
            audioRef.current.load()
            audioRef.current.play().catch(() => {})
        }
    }

    const resultMessage = (percentage: number) => {
        if (percentage >= 90) return 'Xuất sắc!'
        if (percentage >= 70) return 'Rất tốt!'
        if (percentage >= 50) return 'Ổn rồi, luyện thêm chút nữa nhé!'
        return 'Cần nghe lại thêm một vòng'
    }

    // All phases share a single <audio> element at top-level to avoid
    // unmount/remount (and re-download) when changing phases.
    const audioElement = <audio ref={audioRef} src={audioUrl} preload="metadata" />

    // ═══════════════════════════════════════════
    // INTRO PHASE
    // ═══════════════════════════════════════════
    if (phase === 'intro') {
        return (
            <div className="max-w-lg mx-auto px-4 py-8">
                {audioElement}

                {/* Back button */}
                <button onClick={() => router.push('/listening')} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                    </svg>
                    Về danh sách
                </button>

                {/* Lesson Info */}
                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm text-center">
                    <FuxieLive3D state="wave" fallbackSrc={FUXIE_3D_ASSETS.radioHost} alt="Fuxie listening coach" size={112} priority />
                    <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                        <FuxieBadge tone="brand" className="normal-case tracking-normal">
                            Listening Episode
                        </FuxieBadge>
                        <FuxieBadge tone="neutral" className="normal-case tracking-normal">
                            {cefrLevel} · {taskType}
                        </FuxieBadge>
                    </div>
                    <p className="mt-4 text-xs font-black uppercase tracking-wide text-text-brand">Quest briefing</p>
                    <h1 className="text-xl font-bold text-gray-900 mt-4">{topic}</h1>
                    <p className="text-sm text-gray-500 mt-1">Phần {teil} - {teilName}</p>

                    <div className="flex items-center justify-center gap-3 mt-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r ${cefrColor.gradient} text-white`}>
                            {cefrLevel}
                        </span>
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">{taskType}</span>
                        {backgroundScene && (
                            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-600">
                                {BACKGROUND_SCENE_LABELS[backgroundScene] ?? backgroundScene}
                            </span>
                        )}
                    </div>

                    <div className="mt-6 p-4 bg-[#F3FBFF] rounded-xl text-sm text-gray-700 ring-1 ring-[#60A8E4]/15">
                        <p className="font-semibold text-text-brand mb-2">Hướng dẫn</p>
                        <p>Em sẽ nghe đoạn audio tối đa <strong>{maxPlays} lần</strong>, sau đó trả lời <strong>{questions.length} câu hỏi</strong>.</p>
                        <p className="mt-1 text-gray-500">Tốc độ gợi ý: {DEFAULT_SPEEDS[cefrLevel]}x - Thời lượng: khoảng {formatTime(duration || 180)}</p>
                    </div>

                    <p className="mt-4 text-sm font-semibold leading-relaxed text-text-brand">
                        {questEpisode.objective} Phần thưởng chỉ được trao khi em thực sự hoàn thành thử thách nghe.
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
                        eyebrow="Episode v1"
                        title="Nghe theo tung checkpoint"
                        message="Khong co Fucoin cho play audio hay checkpoint. XP/Fucoin chi den sau submit."
                        className="mt-4 bg-[#F3FBFF]"
                    />

                    {audioError && (
                        <div className="mt-4 p-4 bg-red-50 border border-red-100 rounded-xl flex items-center justify-between text-sm text-red-600">
                            <div className="flex items-center gap-2">
                                <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span>Fuxie không tải được file âm thanh. Em kiểm tra lại mạng nhé!</span>
                            </div>
                            <button onClick={retryAudio} className="font-bold underline hover:text-red-700">
                                Thử lại
                            </button>
                        </div>
                    )}

                    <button
                        onClick={startEpisode}
                        disabled={audioError}
                        className={fuxieButtonClass('primary', 'lg', `mt-6 w-full ${audioError ? 'opacity-50 cursor-not-allowed' : ''}`)}
                    >
                        Bắt đầu nghe
                    </button>
                </div>
            </div>
        )
    }

    // ═══════════════════════════════════════════
    // LISTENING + QUESTIONS PHASE
    // ═══════════════════════════════════════════
    if (phase === 'listening') {
        const q = questions[currentQuestion]
        return (
            <div className="max-w-5xl mx-auto px-4 py-6">
                {audioElement}

                {/* Top bar */}
                <div className="flex items-center justify-between mb-5">
                    <button onClick={() => router.push('/listening')} className="text-gray-500 hover:text-gray-700">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <span className="text-sm font-semibold text-gray-700">
                        Bài nghe - Phần {teil}
                    </span>
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-bold bg-gradient-to-r ${cefrColor.gradient} text-white`}>
                        {cefrLevel}
                    </span>
                </div>

                <div className="mb-5 rounded-2xl bg-[#F3FBFF] px-4 py-3 ring-1 ring-[#CCE4F0]/70">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0">
                            <p className="text-xs font-black uppercase tracking-wide text-text-brand">
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

                <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
                    <div className="min-w-0">
                {/* Audio Player Card */}
                <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm mb-5">
                    {/* Play button + progress */}
                    <div className="flex items-center gap-4">
                        <button
                            onClick={togglePlay}
                            disabled={!canPlayAgain && !isPlaying}
                            className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 transition-all ${isPlaying ? 'bg-[#60A8E4] text-white scale-105' :
                                canPlayAgain ? 'bg-[#60A8E4] text-white hover:opacity-90' :
                                    'bg-gray-200 text-gray-400 cursor-not-allowed'
                                }`}
                        >
                            {isPlaying ? (
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                                </svg>
                            ) : (
                                <svg className="w-5 h-5 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M8 5v14l11-7z" />
                                </svg>
                            )}
                        </button>

                        <div className="flex-1">
                            {/* Progress bar */}
                            <div className="h-2 bg-gray-100 rounded-full cursor-pointer" onClick={seekTo}>
                                <div
                                    className="h-full bg-gradient-to-r from-[#60A8E4] to-[#2EC4B6] rounded-full transition-all"
                                    style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
                                />
                            </div>
                            {/* Time */}
                            <div className="flex justify-between mt-1.5 text-xs text-gray-400">
                                <span>{formatTime(currentTime)}</span>
                                <span>{formatTime(duration)}</span>
                            </div>
                        </div>
                    </div>

                    {audioError && (
                        <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-xl flex items-center justify-between text-sm text-red-600">
                            <span>Lỗi tải âm thanh.</span>
                            <button onClick={retryAudio} className="font-bold underline">Thử tải lại</button>
                        </div>
                    )}

                    {/* Controls row */}
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
                        <button
                            onClick={cycleSpeed}
                            className="px-3 py-1.5 rounded-lg bg-gray-100 text-xs font-bold text-gray-600 hover:bg-gray-200 transition-colors"
                        >
                            {playbackSpeed}x
                        </button>

                        <button
                            onClick={replayAudio}
                            disabled={!canPlayAgain}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${canPlayAgain ? 'bg-blue-50 text-blue-600 hover:bg-blue-100' : 'bg-gray-50 text-gray-300 cursor-not-allowed'
                                }`}
                        >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            Nghe lại {playCount}/{maxPlays}
                        </button>
                    </div>
                </div>

                {/* Question Area */}
                {q && (
                    <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                        {/* Progress dots */}
                        <div className="flex items-center gap-1.5 mb-4">
                            <span className="text-xs text-gray-500 font-semibold mr-2">
                                Câu {currentQuestion + 1}/{questions.length}
                            </span>
                            {questions.map((_, i) => (
                                <div
                                    key={i}
                                    className={`w-2 h-2 rounded-full transition-all ${i === currentQuestion ? 'bg-[#60A8E4] scale-125' :
                                        answers[questions[i]?.id ?? ''] ? 'bg-green-400' : 'bg-gray-200'
                                        }`}
                                />
                            ))}
                        </div>

                        {/* Question text */}
                        <p className="text-base font-bold text-gray-900 mb-4">{q.questionText}</p>
                        {q.questionTextNative && (
                            <p className="text-sm text-gray-400 mb-4 -mt-2">{q.questionTextNative}</p>
                        )}

                        {/* Options */}
                        <div className="space-y-2.5">
                            {(q.options as string[]).map((opt, i) => {
                                const optionKey = String.fromCharCode(97 + i) // a, b, c
                                const isSelected = answers[q.id] === optionKey
                                return (
                                    <button
                                        key={i}
                                        onClick={() => selectAnswer(q.id, optionKey)}
                                        className={`w-full flex items-center gap-3 p-3.5 rounded-xl text-left transition-all ${isSelected
                                            ? 'border-2 border-[#60A8E4] bg-[#F3FBFF]'
                                            : 'border-2 border-gray-100 bg-white hover:border-gray-200'
                                            }`}
                                    >
                                        <div className={`w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center ${isSelected ? 'border-[#60A8E4]' : 'border-gray-300'
                                            }`}>
                                            {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-[#60A8E4]" />}
                                        </div>
                                        <span className={`text-sm ${isSelected ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
                                            {opt}
                                        </span>
                                    </button>
                                )
                            })}
                        </div>

                        {/* Navigation */}
                        <div className="flex gap-3 mt-5">
                            {currentQuestion > 0 && (
                                <button
                                    onClick={() => setCurrentQuestion(c => c - 1)}
                                    className="flex-1 py-3 rounded-xl border-2 border-gray-200 text-sm font-semibold text-gray-600 hover:border-gray-300 transition-all"
                                >
                                    Câu trước
                                </button>
                            )}
                            {currentQuestion < questions.length - 1 ? (
                                <button
                                    onClick={() => setCurrentQuestion(c => c + 1)}
                                    className="flex-1 py-3 rounded-xl bg-gradient-to-r from-[#60A8E4] to-[#3C78A8] text-white font-bold text-sm hover:opacity-90 transition-all shadow-sm"
                                >
                                    Câu tiếp theo
                                </button>
                            ) : (
                                <button
                                    onClick={submitAnswers}
                                    disabled={!allAnswered || isSubmitting}
                                    className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all shadow-sm ${allAnswered && !isSubmitting
                                        ? 'bg-gradient-to-r from-emerald-500 to-green-600 text-white hover:opacity-90'
                                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                        }`}
                                >
                                    {isSubmitting ? 'Đang chấm...' : `Nộp bài (${Object.keys(answers).length}/${questions.length})`}
                                </button>
                            )}
                        </div>
                    </div>
                )}
                    </div>

                    <SkillMotivationRail
                        skill="listening"
                        phaseLabel={`Câu ${currentQuestion + 1}/${questions.length}`}
                        title={isPlaying ? 'Bắt tín hiệu chính trong audio' : 'Nghe lại có chiến lược'}
                        message="Fuxie giữ phần thưởng và tiến độ ở cạnh màn hình để em tập trung vào âm thanh, câu hỏi và lựa chọn."
                        progressLabel="Listening progress"
                        progressPercent={questions.length > 0 ? ((currentQuestion + 1) / questions.length) * 100 : 0}
                        metrics={[
                            { label: 'Answered', value: `${Object.keys(answers).length}/${questions.length}` },
                            { label: 'Plays', value: `${playCount}/${maxPlays}` },
                            { label: 'Speed', value: `${playbackSpeed}x` },
                            { label: 'Audio', value: `${formatTime(currentTime)}` },
                        ]}
                        rewards={[
                            { type: 'xp', label: `+${Math.max(10, questions.length * 3)} XP`, detail: 'Hoàn thành bài nghe' },
                            { type: 'badge', label: 'Good ear', detail: 'Bắt ý chính' },
                            { type: 'streak', label: 'Daily rhythm', detail: 'Giữ nhịp nghe' },
                        ]}
                    />
                </div>
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
        const mascotVariant = percentage >= 70 ? 'celebrate' : percentage >= 50 ? 'encourage' : 'studying'
        const { Clock3, Headphones: HeadphonesIcon, Target } = resultRewardIcons
        const resultCopy = percentage >= 90
            ? {
                title: 'Nghe rất sắc, quest hoàn thành!',
                coachTitle: 'Fuxie đánh dấu một lượt nghe mạnh',
                coachMessage: 'Độ chính xác cao cho thấy em đang bắt được ý chính. Đây là lúc tốt để sang bài nghe mới.',
                unlockLabel: 'Next',
                unlockDetail: 'Đi tiếp',
            }
            : percentage >= 70
                ? {
                    title: 'Rất tốt, tai nghe đang vào nhịp',
                    coachTitle: 'Fuxie đề xuất đi tiếp',
                    coachMessage: 'Em đã nắm phần lớn tín hiệu trong audio. Có thể học tiếp hoặc nghe lại để chắc chi tiết.',
                    unlockLabel: 'Good ear',
                    unlockDetail: 'Đi tiếp',
                }
                : percentage >= 50
                    ? {
                        title: 'Có tín hiệu tốt, cần nghe lại',
                        coachTitle: 'Fuxie giữ focus ở điểm yếu',
                        coachMessage: 'Kết quả này cho biết em đã bắt được một phần nội dung. Nghe lại ngay sẽ giúp khóa các câu còn lẫn.',
                        unlockLabel: 'Focus replay',
                        unlockDetail: 'Câu sai',
                    }
                    : {
                        title: 'Mình luyện lại từng tín hiệu',
                        coachTitle: 'Fuxie đề xuất nghe lại',
                        coachMessage: 'Đừng đổi bài vội. Một lượt nghe lại chậm hơn sẽ giúp em nhận ra từ khóa và nhịp câu hỏi.',
                        unlockLabel: 'Replay quest',
                        unlockDetail: 'Ý chính',
                    }
        const attemptMeta = [
            {
                icon: <Clock3 className="h-4 w-4" />,
                label: 'Thời gian',
                value: formatTime(results.timeTaken),
                detail: 'Hoàn thành bài nghe',
            },
            {
                icon: <HeadphonesIcon className="h-4 w-4" />,
                label: 'Lượt nghe',
                value: `${results.listenCount}x`,
                detail: `${maxPlays} lượt tối đa`,
            },
            {
                icon: <Target className="h-4 w-4" />,
                label: 'Độ chính xác',
                value: `${percentage}%`,
                detail: `${score}/${totalQuestions} câu đúng`,
            },
        ]
        const fucoinLabel = fucoinEarned > 0
            ? `+${fucoinEarned} Fucoin`
            : fucoinDuplicate
                ? 'Đã nhận Fucoin'
                : fucoinCapReached
                    ? 'Đủ Fucoin hôm nay'
                    : '+0 Fucoin'
        const fucoinDetail = fucoinEarned > 0
            ? walletBalance !== undefined
                ? `${walletBalance} trong ví`
                : 'Đã cộng vào ví'
            : fucoinDuplicate
                ? 'Bài này đã thưởng trước đó'
                : fucoinCapReached && fucoinDailyCap !== undefined
                    ? `${fucoinDailyCap}/${fucoinDailyCap} daily cap`
                    : fucoinDailyCap !== undefined && fucoinDailyEarned !== undefined
                        ? `${fucoinDailyEarned}/${fucoinDailyCap} hôm nay`
                        : 'Không có thưởng mới'
        const rewardPreview = [
            {
                type: 'xp' as const,
                label: `+${xpEarned} XP`,
                detail: 'Kinh nghiệm bài nghe',
            },
            {
                type: 'fucoin' as const,
                label: fucoinLabel,
                detail: fucoinDetail,
            },
            {
                type: 'streak' as const,
                label: streak?.freezeUsed ? 'Freeze saved' : 'Rhythm',
                detail: streak?.freezeUsed ? `${streak.currentStreak} ngay` : 'Giữ nhịp',
            },
        ]
        const displayRewardPreview = results.rewardPreview && results.rewardPreview.length > 0
            ? results.rewardPreview
            : rewardPreview
        const episodeReceipt = results.questEpisodeReceipt

        return (
            <div className="max-w-4xl mx-auto px-4 py-6">
                {audioElement}

                <CompletionFlow
                    mode="alreadySaved"
                    skill="listening"
                    title={resultCopy.title}
                    message={`Em trả lời đúng ${score}/${totalQuestions} câu. ${message}`}
                    scoreLabel={`${score}/${totalQuestions}`}
                    scoreDetail="Câu đúng"
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
                    primaryAction={{ label: 'Bài nghe tiếp theo', href: '/listening' }}
                    secondaryAction={{ label: 'Nghe lại', onClick: resetLesson }}
                    dashboardAction={{ label: 'Về Dashboard', href: '/dashboard' }}
                    coachTitle={resultCopy.coachTitle}
                    coachMessage={resultCopy.coachMessage}
                    className="mb-5"
                />

                {episodeReceipt ? (
                    <div className="mb-5 rounded-2xl bg-[#F3FBFF] p-4 ring-1 ring-[#CCE4F0]/70">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div className="min-w-0">
                                <p className="text-xs font-black uppercase tracking-wide text-text-brand">
                                    Episode receipt
                                </p>
                                <h3 className="mt-1 text-lg font-black text-slate-950">
                                    {episodeReceipt.completedCheckpoints}/{episodeReceipt.checkpointCount} checkpoint · {episodeReceipt.accuracyBand.replaceAll('_', ' ')}
                                </h3>
                                <p className="mt-1 text-sm font-semibold leading-relaxed text-text-brand">
                                    {episodeReceipt.masteryContribution}
                                </p>
                            </div>
                            <a
                                href={episodeReceipt.recommendedAction === 'next_episode' ? episodeReceipt.nextEpisodeHref : undefined}
                                onClick={(event) => {
                                    if (episodeReceipt.recommendedAction !== 'next_episode') {
                                        event.preventDefault()
                                        resetLesson()
                                    }
                                }}
                                className={fuxieButtonClass(episodeReceipt.recommendedAction === 'next_episode' ? 'primary' : 'reward', 'md', 'shrink-0')}
                            >
                                {episodeReceipt.recommendedAction === 'next_episode' ? 'Di tiep' : 'Nghe lai'}
                            </a>
                        </div>
                        <FuxieProgressBar
                            value={Math.round((episodeReceipt.completedCheckpoints / Math.max(1, episodeReceipt.checkpointCount)) * 100)}
                            className="mt-4"
                        />
                    </div>
                ) : null}

                {/* Celebration */}
                <div className="hidden">
                    <Mascot variant={mascotVariant} size={80} className="mx-auto" />

                    {/* Score Ring */}
                    <div className="relative w-28 h-28 mx-auto mt-4">
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
                    <p className="text-sm text-gray-500 mt-1">
                        Em trả lời đúng {score}/{totalQuestions} câu.
                    </p>

                    {/* Stats */}
                    <div className="flex justify-center gap-4 mt-5">
                        <div className="px-4 py-2 bg-gray-50 rounded-xl text-center">
                            <p className="text-lg font-bold text-gray-900">⏱️ {formatTime(results.timeTaken)}</p>
                            <p className="text-xs text-gray-500">Thời gian</p>
                        </div>
                        <div className="px-4 py-2 bg-gray-50 rounded-xl text-center">
                            <p className="text-lg font-bold text-gray-900">🔊 {results.listenCount}x</p>
                            <p className="text-xs text-gray-500">Lượt nghe</p>
                        </div>
                        <div className="px-4 py-2 bg-gray-50 rounded-xl text-center">
                            <p className="text-lg font-bold text-gray-900">📊 {percentage}%</p>
                            <p className="text-xs text-gray-500">Kết quả</p>
                        </div>
                    </div>
                </div>

                {/* Answer Review */}
                <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm mb-5">
                    <h3 className="text-sm font-bold text-gray-700 mb-3">Tổng kết câu trả lời</h3>
                    <div className="space-y-2.5">
                        {questionResults.map((qr) => (
                            <div
                                key={qr.questionId}
                                className={`p-3.5 rounded-xl border-l-4 ${qr.isCorrect ? 'bg-green-50/50 border-green-400' : 'bg-red-50/50 border-red-400'
                                    }`}
                            >
                                <div className="flex items-start gap-2">
                                    <span className="text-base mt-0.5">{qr.isCorrect ? '✅' : '❌'}</span>
                                    <div className="flex-1">
                                        <p className="text-sm font-semibold text-gray-900">{qr.questionText}</p>
                                        {qr.isCorrect ? (
                                            <p className="text-sm text-green-600 mt-1">
                                                {(qr.options as string[])[qr.correctAnswer.charCodeAt(0) - 97] || qr.correctAnswer}
                                            </p>
                                        ) : (
                                            <>
                                                <p className="text-sm text-red-500 mt-1">
                                                    Câu em chọn: {(qr.options as string[])[qr.userAnswer.charCodeAt(0) - 97] || qr.userAnswer}
                                                </p>
                                                <p className="text-sm text-green-600 mt-0.5">
                                                    Đáp án đúng: {(qr.options as string[])[qr.correctAnswer.charCodeAt(0) - 97] || qr.correctAnswer}
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

                {/* Transcript toggle */}
                {transcript && (
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm mb-5 overflow-hidden">
                        <button
                            onClick={() => setShowTranscript(!showTranscript)}
                            className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                        >
                            <span className="text-sm font-semibold text-gray-700">{showTranscript ? 'Ẩn transcript' : 'Xem transcript'}</span>
                            <svg
                                className={`w-4 h-4 text-gray-400 transition-transform ${showTranscript ? 'rotate-180' : ''}`}
                                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>
                        {showTranscript && (
                            <div className="px-4 pb-4 space-y-2 animate-fade-in-up">
                                {(transcript.lines || []).map((line: TranscriptLine, i: number) => (
                                    <div key={i} className="flex gap-2 text-sm">
                                        <span className={`font-semibold shrink-0 ${line.speaker_role === 'exam_narrator' ? 'text-purple-600' : 'text-blue-600'
                                            }`}>
                                            {line.speaker}:
                                        </span>
                                        <span className="text-gray-700">{line.text}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Action buttons */}
                <div className="flex gap-3">
                    <button
                        onClick={() => router.push('/listening')}
                        className="flex-1 py-3 rounded-xl border-2 border-gray-200 text-sm font-semibold text-gray-600 hover:border-gray-300 transition-all"
                    >
                        Về danh sách
                    </button>
                    <button
                        onClick={resetLesson}
                        className="flex-1 py-3 rounded-xl bg-gradient-to-r from-[#60A8E4] to-[#3C78A8] text-white font-bold text-sm hover:opacity-90 transition-all shadow-sm"
                    >
                        Luyện lại
                    </button>
                </div>
            </div>
        )
    }

    return null
}
