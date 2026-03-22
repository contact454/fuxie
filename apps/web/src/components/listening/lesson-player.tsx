'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Mascot } from '@/components/ui/mascot'

// ─── Types ──────────────────────────────────────────
interface Question {
    id: string
    questionNumber: number
    questionType: string
    questionText: string
    questionTextVi: string | null
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
    explanationVi: string | null
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
    transcript: any | null
    maxPlays: number // Goethe rule: A1/A2 = 2, B2+ = 1 or 2
}

// ─── Constants ──────────────────────────────────────
const CEFR_COLORS: Record<string, { gradient: string; bg: string; text: string }> = {
    A1: { gradient: 'from-green-500 to-emerald-600', bg: '#DCFCE7', text: '#166534' },
    A2: { gradient: 'from-lime-500 to-green-600', bg: '#D9F99D', text: '#3F6212' },
    B1: { gradient: 'from-orange-400 to-amber-600', bg: '#FED7AA', text: '#9A3412' },
    B2: { gradient: 'from-red-500 to-orange-600', bg: '#FECACA', text: '#991B1B' },
    C1: { gradient: 'from-purple-500 to-violet-600', bg: '#E9D5FF', text: '#6B21A8' },
    C2: { gradient: 'from-violet-600 to-purple-800', bg: '#DDD6FE', text: '#4C1D95' },
}

const DEFAULT_SPEEDS: Record<string, number> = {
    A1: 0.75, A2: 0.85, B1: 1.0, B2: 1.15, C1: 1.25, C2: 1.5,
}

const SPEED_OPTIONS = [0.5, 0.75, 1.0, 1.25, 1.5]

type Phase = 'intro' | 'listening' | 'review' | 'results'

// ─── Lesson Player Component ────────────────────────
export function LessonPlayer({
    lessonId, title, topic, cefrLevel, teil, teilName, taskType,
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
        timeTaken: number; listenCount: number; questionResults: QuestionResult[]
    } | null>(null)
    const [showTranscript, setShowTranscript] = useState(false)
    const [startTime] = useState(Date.now())
    const cefrColor = CEFR_COLORS[cefrLevel] ?? CEFR_COLORS.A1!

    // Audio event handlers
    useEffect(() => {
        const audio = audioRef.current
        if (!audio) return

        const onTime = () => setCurrentTime(audio.currentTime)
        const onDuration = () => setDuration(audio.duration)
        const onEnded = () => { setIsPlaying(false); setPlayCount(c => c + 1) }
        const onPlay = () => setIsPlaying(true)
        const onPause = () => setIsPlaying(false)

        audio.addEventListener('timeupdate', onTime)
        audio.addEventListener('loadedmetadata', onDuration)
        audio.addEventListener('ended', onEnded)
        audio.addEventListener('play', onPlay)
        audio.addEventListener('pause', onPause)

        return () => {
            audio.removeEventListener('timeupdate', onTime)
            audio.removeEventListener('loadedmetadata', onDuration)
            audio.removeEventListener('ended', onEnded)
            audio.removeEventListener('play', onPlay)
            audio.removeEventListener('pause', onPause)
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
            const res = await fetch(`/api/v1/listening/${lessonId}/submit`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ answers, timeTaken, listenCount: playCount }),
            })
            const data = await res.json()
            if (data.success) {
                setResults({
                    ...data.data,
                    timeTaken,
                    listenCount: playCount,
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

    // ═══════════════════════════════════════════
    // INTRO PHASE
    // ═══════════════════════════════════════════
    if (phase === 'intro') {
        return (
            <div className="max-w-lg mx-auto px-4 py-8">
                <audio ref={audioRef} src={audioUrl} preload="metadata" />

                {/* Back button */}
                <button onClick={() => router.push('/listening')} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                    </svg>
                    Zurück
                </button>

                {/* Lesson Info */}
                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm text-center">
                    <Mascot variant="hoeren" size={80} className="mx-auto" />
                    <h1 className="text-xl font-bold text-gray-900 mt-4">{topic}</h1>
                    <p className="text-sm text-gray-500 mt-1">Teil {teil} — {teilName}</p>

                    <div className="flex items-center justify-center gap-3 mt-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r ${cefrColor.gradient} text-white`}>
                            {cefrLevel}
                        </span>
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">{taskType}</span>
                        {backgroundScene && (
                            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-600">
                                {backgroundScene === 'cafe' ? '☕ Café' :
                                    backgroundScene === 'station' ? '🚉 Bahnhof' :
                                        backgroundScene === 'store' ? '🛒 Geschäft' :
                                            backgroundScene === 'clinic' ? '🏥 Arztpraxis' :
                                                `📍 ${backgroundScene}`}
                            </span>
                        )}
                    </div>

                    <div className="mt-6 p-4 bg-orange-50 rounded-xl text-sm text-gray-700">
                        <p className="font-semibold text-[#FF6B35] mb-2">📋 Anweisungen</p>
                        <p>Du hörst dieses Audio <strong>{maxPlays}×</strong>. Beantworte danach die <strong>{questions.length} Fragen</strong>.</p>
                        <p className="mt-1 text-gray-500">Geschwindigkeit: {DEFAULT_SPEEDS[cefrLevel]}× • Dauer: ~{formatTime(duration || 180)}</p>
                    </div>

                    <button
                        onClick={() => {
                            setPhase('listening')
                            if (autoPlayTimeoutRef.current) {
                                clearTimeout(autoPlayTimeoutRef.current)
                            }
                            autoPlayTimeoutRef.current = setTimeout(() => {
                                audioRef.current?.play().catch(() => {})
                            }, 300)
                        }}
                        className="mt-6 w-full py-3.5 rounded-xl bg-gradient-to-r from-[#FF6B35] to-orange-500 text-white font-bold text-base hover:opacity-90 transition-all shadow-lg shadow-orange-200"
                    >
                        🎧 Audio abspielen
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
            <div className="max-w-lg mx-auto px-4 py-6">
                <audio ref={audioRef} src={audioUrl} preload="metadata" />

                {/* Top bar */}
                <div className="flex items-center justify-between mb-5">
                    <button onClick={() => router.push('/listening')} className="text-gray-500 hover:text-gray-700">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <span className="text-sm font-semibold text-gray-700">
                        Lektion • Teil {teil}
                    </span>
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-bold bg-gradient-to-r ${cefrColor.gradient} text-white`}>
                        {cefrLevel}
                    </span>
                </div>

                {/* Audio Player Card */}
                <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm mb-5">
                    {/* Play button + progress */}
                    <div className="flex items-center gap-4">
                        <button
                            onClick={togglePlay}
                            disabled={!canPlayAgain && !isPlaying}
                            className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 transition-all ${isPlaying ? 'bg-[#FF6B35] text-white scale-105' :
                                canPlayAgain ? 'bg-[#FF6B35] text-white hover:opacity-90' :
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
                                    className="h-full bg-gradient-to-r from-[#FF6B35] to-orange-400 rounded-full transition-all"
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

                    {/* Controls row */}
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
                        <button
                            onClick={cycleSpeed}
                            className="px-3 py-1.5 rounded-lg bg-gray-100 text-xs font-bold text-gray-600 hover:bg-gray-200 transition-colors"
                        >
                            {playbackSpeed}×
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
                            Replay {playCount}/{maxPlays}
                        </button>
                    </div>
                </div>

                {/* Question Area */}
                {q && (
                    <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                        {/* Progress dots */}
                        <div className="flex items-center gap-1.5 mb-4">
                            <span className="text-xs text-gray-500 font-semibold mr-2">
                                Frage {currentQuestion + 1} von {questions.length}
                            </span>
                            {questions.map((_, i) => (
                                <div
                                    key={i}
                                    className={`w-2 h-2 rounded-full transition-all ${i === currentQuestion ? 'bg-[#FF6B35] scale-125' :
                                        answers[questions[i]?.id ?? ''] ? 'bg-green-400' : 'bg-gray-200'
                                        }`}
                                />
                            ))}
                        </div>

                        {/* Question text */}
                        <p className="text-base font-bold text-gray-900 mb-4">{q.questionText}</p>
                        {q.questionTextVi && (
                            <p className="text-sm text-gray-400 mb-4 -mt-2">{q.questionTextVi}</p>
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
                                            ? 'border-2 border-[#FF6B35] bg-orange-50'
                                            : 'border-2 border-gray-100 bg-white hover:border-gray-200'
                                            }`}
                                    >
                                        <div className={`w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center ${isSelected ? 'border-[#FF6B35]' : 'border-gray-300'
                                            }`}>
                                            {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-[#FF6B35]" />}
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
                                    Vorherige
                                </button>
                            )}
                            {currentQuestion < questions.length - 1 ? (
                                <button
                                    onClick={() => setCurrentQuestion(c => c + 1)}
                                    className="flex-1 py-3 rounded-xl bg-gradient-to-r from-[#FF6B35] to-orange-500 text-white font-bold text-sm hover:opacity-90 transition-all shadow-sm"
                                >
                                    Nächste Frage
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
                                    {isSubmitting ? 'Wird geprüft...' : `Antworten abgeben (${Object.keys(answers).length}/${questions.length})`}
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>
        )
    }

    // ═══════════════════════════════════════════
    // RESULTS PHASE
    // ═══════════════════════════════════════════
    if (phase === 'results' && results) {
        const { score, totalQuestions, percentage, questionResults } = results
        const message = percentage >= 90 ? 'Ausgezeichnet! 🌟' :
            percentage >= 70 ? 'Sehr gut! 👏' :
                percentage >= 50 ? 'Gut gemacht! 💪' :
                    'Weiter üben! 📚'
        const mascotVariant = percentage >= 70 ? 'celebrate' : percentage >= 50 ? 'encouragement' : 'studying'

        return (
            <div className="max-w-lg mx-auto px-4 py-6">
                <audio ref={audioRef} src={audioUrl} preload="metadata" />

                {/* Celebration */}
                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm text-center mb-5">
                    <Mascot variant={mascotVariant} size={80} className="mx-auto" />

                    {/* Score Ring */}
                    <div className="relative w-28 h-28 mx-auto mt-4">
                        <svg className="w-28 h-28 transform -rotate-90" viewBox="0 0 112 112">
                            <circle cx="56" cy="56" r="48" stroke="#E5E7EB" strokeWidth="8" fill="none" />
                            <circle
                                cx="56" cy="56" r="48"
                                stroke={percentage >= 70 ? '#10B981' : percentage >= 50 ? '#FF6B35' : '#EF4444'}
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
                        Du hast {score} von {totalQuestions} Fragen richtig beantwortet.
                    </p>

                    {/* Stats */}
                    <div className="flex justify-center gap-4 mt-5">
                        <div className="px-4 py-2 bg-gray-50 rounded-xl text-center">
                            <p className="text-lg font-bold text-gray-900">⏱️ {formatTime(results.timeTaken)}</p>
                            <p className="text-[10px] text-gray-500">Zeit</p>
                        </div>
                        <div className="px-4 py-2 bg-gray-50 rounded-xl text-center">
                            <p className="text-lg font-bold text-gray-900">🔊 {results.listenCount}×</p>
                            <p className="text-[10px] text-gray-500">Gehört</p>
                        </div>
                        <div className="px-4 py-2 bg-gray-50 rounded-xl text-center">
                            <p className="text-lg font-bold text-gray-900">📊 {percentage}%</p>
                            <p className="text-[10px] text-gray-500">Ergebnis</p>
                        </div>
                    </div>
                </div>

                {/* Answer Review */}
                <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm mb-5">
                    <h3 className="text-sm font-bold text-gray-700 mb-3">Antworten-Übersicht</h3>
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
                                                    Deine Antwort: {(qr.options as string[])[qr.userAnswer.charCodeAt(0) - 97] || qr.userAnswer}
                                                </p>
                                                <p className="text-sm text-green-600 mt-0.5">
                                                    Richtig: {(qr.options as string[])[qr.correctAnswer.charCodeAt(0) - 97] || qr.correctAnswer}
                                                </p>
                                                {qr.explanationVi && (
                                                    <p className="text-xs text-gray-500 mt-1 italic">{qr.explanationVi}</p>
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
                            <span className="text-sm font-semibold text-gray-700">📝 Transkript anzeigen</span>
                            <svg
                                className={`w-4 h-4 text-gray-400 transition-transform ${showTranscript ? 'rotate-180' : ''}`}
                                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>
                        {showTranscript && (
                            <div className="px-4 pb-4 space-y-2 animate-fade-in-up">
                                {(transcript.lines || []).map((line: any, i: number) => (
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
                        Übersicht
                    </button>
                    <button
                        onClick={() => router.push('/listening')}
                        className="flex-1 py-3 rounded-xl bg-gradient-to-r from-[#FF6B35] to-orange-500 text-white font-bold text-sm hover:opacity-90 transition-all shadow-sm"
                    >
                        Nächste Lektion →
                    </button>
                </div>
            </div>
        )
    }

    return null
}
