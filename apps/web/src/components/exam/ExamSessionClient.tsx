'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'

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

/* ── Renderers (lazy-loaded inline) ── */
import { MCRenderer } from './renderers/MCRenderer'
import { TFRenderer } from './renderers/TFRenderer'
import { MatchingRenderer } from './renderers/MatchingRenderer'
import { GapFillRenderer } from './renderers/GapFillRenderer'
import { ExamAudioPlayer } from './ExamAudioPlayer'

const SKILL_EMOJI: Record<string, string> = {
    LESEN: '📖', HOEREN: '🎧', SCHREIBEN: '✍️', SPRECHEN: '🗣️',
}

export function ExamSessionClient({ examId }: { examId: string }) {
    const router = useRouter()
    const [phase, setPhase] = useState<'loading' | 'ready' | 'active' | 'submitting' | 'error'>('loading')
    const [exam, setExam] = useState<ExamData | null>(null)
    const [attemptId, setAttemptId] = useState('')
    const [currentSectionIdx, setCurrentSectionIdx] = useState(0)
    const [currentTaskIdx, setCurrentTaskIdx] = useState(0)
    const [answers, setAnswers] = useState<Record<string, Record<string, unknown>>>({})
    const [timeLeft, setTimeLeft] = useState(0)
    const [showSubmitModal, setShowSubmitModal] = useState(false)
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

    // Start exam
    const startExam = useCallback(async () => {
        try {
            const res = await fetch(`/api/v1/exams/${examId}/start`, { method: 'POST' })
            const data = await res.json()
            if (!data.success) throw new Error(data.error)

            setExam(data.data.exam)
            setAttemptId(data.data.attemptId)
            setTimeLeft(data.data.exam.totalMinutes * 60)
            setPhase('active')
        } catch (err) {
            console.error('Start exam error:', err)
            setPhase('error')
        }
    }, [examId])

    useEffect(() => {
        startExam()
    }, [startExam])

    // Timer
    useEffect(() => {
        if (phase !== 'active') return
        timerRef.current = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    handleSubmit()
                    return 0
                }
                return prev - 1
            })
        }, 1000)
        return () => { if (timerRef.current) clearInterval(timerRef.current) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [phase])

    const handleSubmit = async () => {
        if (phase === 'submitting') return
        setPhase('submitting')
        if (timerRef.current) clearInterval(timerRef.current)

        try {
            const allTasks = exam?.sections.flatMap(s => s.tasks) ?? []
            const answerPayload = allTasks.map(task => ({
                taskId: task.id,
                answerJson: answers[task.id] ?? {},
            }))

            const res = await fetch(`/api/v1/exams/${examId}/submit`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ attemptId, answers: answerPayload }),
            })
            const data = await res.json()
            if (data.success) {
                router.push(`/exam/${examId}/result/${attemptId}`)
            }
        } catch (err) {
            console.error('Submit error:', err)
            setPhase('active')
        }
    }

    const updateAnswer = (taskId: string, answer: Record<string, unknown>) => {
        setAnswers(prev => ({ ...prev, [taskId]: answer }))
    }

    if (phase === 'loading') {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-[#FF6B35]/30 border-t-[#FF6B35] rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-gray-500">Prüfung wird geladen...</p>
                </div>
            </div>
        )
    }

    if (phase === 'error' || !exam) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <div className="text-center">
                    <p className="text-red-500 mb-2">Fehler beim Laden der Prüfung</p>
                    <button onClick={() => router.push('/exam')} className="text-sm text-blue-500 underline">Zurück</button>
                </div>
            </div>
        )
    }

    const section = exam.sections[currentSectionIdx]
    const task = section?.tasks[currentTaskIdx]
    const totalTasks = exam.sections.reduce((s, sec) => s + sec.tasks.length, 0)
    const currentGlobalIdx = exam.sections.slice(0, currentSectionIdx).reduce((s, sec) => s + sec.tasks.length, 0) + currentTaskIdx

    const minutes = Math.floor(timeLeft / 60)
    const seconds = timeLeft % 60
    const isWarning = timeLeft <= 300
    const isCritical = timeLeft <= 60

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

    const isLast = currentSectionIdx === exam.sections.length - 1 && section && currentTaskIdx === section.tasks.length - 1

    return (
        <div className="max-w-5xl mx-auto px-4 py-4">
            {/* Top bar: Timer + Progress */}
            <div className="flex items-center justify-between mb-4 bg-white rounded-xl ring-1 ring-gray-100 px-4 py-3">
                <div className="flex items-center gap-3">
                    <span className="text-xs font-medium text-gray-400">{exam.examType} {exam.cefrLevel}</span>
                    <span className="text-xs text-gray-300">|</span>
                    <span className="text-xs text-gray-500">{currentGlobalIdx + 1} / {totalTasks}</span>
                </div>

                {/* Timer */}
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full font-mono text-sm font-bold transition-all
                    ${isCritical ? 'bg-red-100 text-red-600 animate-pulse'
                        : isWarning ? 'bg-amber-100 text-amber-600'
                        : 'bg-gray-100 text-gray-700'}`}
                >
                    ⏱ {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
                </div>

                <button
                    onClick={() => setShowSubmitModal(true)}
                    className="px-3 py-1.5 text-xs font-medium text-white bg-gradient-to-r from-[#FF6B35] to-[#2EC4B6] rounded-lg hover:shadow-md transition-all"
                >
                    Abgeben
                </button>
            </div>

            {/* Section tabs */}
            <div className="flex gap-1.5 mb-4">
                {exam.sections.map((sec, idx) => (
                    <button
                        key={sec.id}
                        onClick={() => { setCurrentSectionIdx(idx); setCurrentTaskIdx(0) }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all
                            ${idx === currentSectionIdx
                                ? 'bg-[#FF6B35]/10 text-[#FF6B35] ring-1 ring-[#FF6B35]/30'
                                : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                            }`}
                    >
                        {SKILL_EMOJI[sec.skill] ?? '📋'} {sec.title}
                    </button>
                ))}
            </div>

            {/* Task dots */}
            {section && (
                <div className="flex gap-1.5 mb-6">
                    {section.tasks.map((t, idx) => (
                        <button
                            key={t.id}
                            onClick={() => setCurrentTaskIdx(idx)}
                            className={`w-8 h-8 rounded-lg text-xs font-medium transition-all
                                ${idx === currentTaskIdx
                                    ? 'bg-[#FF6B35] text-white shadow-sm'
                                    : answers[t.id] ? 'bg-green-100 text-green-600 ring-1 ring-green-200' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                }`}
                        >
                            {idx + 1}
                        </button>
                    ))}
                </div>
            )}

            {/* Task renderer */}
            {task && (
                <div className="bg-white rounded-2xl ring-1 ring-gray-100 p-6 mb-6 min-h-[400px]">
                    {/* Audio player for Hören tasks */}
                    {!!(task.audioUrl || (task.contentJson as Record<string, unknown>).audioTranscript) && (
                        <ExamAudioPlayer
                            src={task.audioUrl}
                            transcript={(task.contentJson as Record<string, unknown>).audioTranscript as string}
                            maxPlays={2}
                            label={section?.skill === 'HOEREN' ? 'Hörtext' : undefined}
                        />
                    )}
                    <h3 className="text-sm font-semibold text-gray-600 mb-4">{task.title}</h3>

                    {task.exerciseType === 'MULTIPLE_CHOICE' && (
                        <MCRenderer
                            content={task.contentJson}
                            answer={answers[task.id] ?? {}}
                            onChange={(a) => updateAnswer(task.id, a)}
                        />
                    )}
                    {task.exerciseType === 'TRUE_FALSE' && (
                        <TFRenderer
                            content={task.contentJson}
                            answer={answers[task.id] ?? {}}
                            onChange={(a) => updateAnswer(task.id, a)}
                        />
                    )}
                    {task.exerciseType === 'MATCHING' && (
                        <MatchingRenderer
                            content={task.contentJson}
                            answer={answers[task.id] ?? {}}
                            onChange={(a) => updateAnswer(task.id, a)}
                        />
                    )}
                    {task.exerciseType === 'FILL_IN_BLANK' && (
                        <GapFillRenderer
                            content={task.contentJson}
                            answer={answers[task.id] ?? {}}
                            onChange={(a) => updateAnswer(task.id, a)}
                        />
                    )}
                </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between">
                <button
                    onClick={goPrev}
                    disabled={currentSectionIdx === 0 && currentTaskIdx === 0}
                    className="px-4 py-2 text-sm font-medium text-gray-500 bg-gray-100 rounded-xl hover:bg-gray-200 transition-all disabled:opacity-30"
                >
                    ← Zurück
                </button>
                {isLast ? (
                    <button
                        onClick={() => setShowSubmitModal(true)}
                        className="px-6 py-2 text-sm font-medium text-white bg-gradient-to-r from-[#FF6B35] to-[#2EC4B6] rounded-xl shadow-sm hover:shadow-md transition-all"
                    >
                        Prüfung abgeben ✓
                    </button>
                ) : (
                    <button
                        onClick={goNext}
                        className="px-4 py-2 text-sm font-medium text-white bg-[#FF6B35] rounded-xl hover:bg-[#e55a28] transition-all"
                    >
                        Weiter →
                    </button>
                )}
            </div>

            {/* Submit confirmation modal */}
            {showSubmitModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl p-6 max-w-sm w-full mx-4 shadow-xl">
                        <h3 className="text-lg font-bold text-gray-800 mb-2">Prüfung abgeben?</h3>
                        <p className="text-sm text-gray-500 mb-1">
                            Beantwortet: {Object.keys(answers).length} / {totalTasks}
                        </p>
                        <p className="text-xs text-gray-400 mb-4">
                            Verbleibende Zeit: {minutes}:{String(seconds).padStart(2, '0')}
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowSubmitModal(false)}
                                className="flex-1 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200"
                            >
                                Weitermachen
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={phase === 'submitting'}
                                className="flex-1 py-2 text-sm font-medium text-white bg-gradient-to-r from-[#FF6B35] to-[#2EC4B6] rounded-xl shadow-sm disabled:opacity-50"
                            >
                                {phase === 'submitting' ? 'Wird geprüft...' : 'Ja, abgeben'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
