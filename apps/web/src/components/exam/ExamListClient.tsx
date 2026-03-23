'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'

interface ExamEntry {
    id: string
    slug: string
    title: string
    examType: string
    cefrLevel: string
    totalMinutes: number
    totalPoints: number
    passingScore: number
    description: string | null
    sections: Array<{ skill: string; totalMinutes: number; totalPoints: number }>
    bestAttempt: {
        totalScore: number | null
        maxScore: number | null
        passed: boolean | null
        percentScore: number | null
        completedAt: string | null
    } | null
}

const BOARD_COLORS: Record<string, string> = {
    GOETHE: '#2196F3',
    TELC: '#4CAF50',
    OESD: '#E91E63',
}
const SKILL_EMOJI: Record<string, string> = {
    LESEN: '📖', HOEREN: '🎧', SCHREIBEN: '✍️', SPRECHEN: '🗣️',
}
const LEVEL_COLORS: Record<string, string> = {
    A1: '#4CAF50', A2: '#26A69A', B1: '#2196F3', B2: '#5C6BC0', C1: '#9C27B0', C2: '#E91E63',
}

export function ExamListClient() {
    const [exams, setExams] = useState<ExamEntry[]>([])
    const [loading, setLoading] = useState(true)
    const [filterLevel, setFilterLevel] = useState<string>('')

    useEffect(() => {
        const q = filterLevel ? `?level=${filterLevel}` : ''
        fetch(`/api/v1/exams${q}`)
            .then(r => r.json())
            .then(d => { if (d.success) setExams(d.data) })
            .finally(() => setLoading(false))
    }, [filterLevel])

    return (
        <div className="max-w-4xl mx-auto px-4 py-6">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
                <Image src="/mascot/learn/fuxie-learn-graduation.png" alt="Fuxie" width={40} height={40} className="object-contain" />
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Prüfung üben</h1>
                    <p className="text-sm text-gray-500">Thi thử · Modellsätze nach Goethe / telc / ÖSD</p>
                </div>
            </div>

            {/* Level filter */}
            <div className="flex gap-1.5 mb-6 flex-wrap">
                <button
                    onClick={() => setFilterLevel('')}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all
                        ${!filterLevel ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                >
                    Alle
                </button>
                {['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].map(l => (
                    <button
                        key={l}
                        onClick={() => setFilterLevel(l)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all
                            ${filterLevel === l ? 'text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                        style={filterLevel === l ? { backgroundColor: LEVEL_COLORS[l] } : undefined}
                    >
                        {l}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="h-40 rounded-2xl bg-gray-100 animate-pulse" />
                    ))}
                </div>
            ) : exams.length === 0 ? (
                <div className="text-center py-16">
                    <Image src="/mascot/core/fuxie-core-happy-wave.png" alt="Fuxie" width={64} height={64} className="mx-auto mb-4 object-contain" />
                    <p className="text-gray-500">Noch keine Prüfungen verfügbar.</p>
                    <p className="text-xs text-gray-400 mt-1">Chưa có đề thi nào. Seed data trước nhé!</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {exams.map(exam => (
                        <div
                            key={exam.id}
                            className="bg-white rounded-2xl ring-1 ring-gray-100 hover:ring-gray-200 transition-all duration-200 overflow-hidden"
                        >
                            <div className="p-5">
                                {/* Top row: badges */}
                                <div className="flex items-center gap-2 mb-3">
                                    <span
                                        className="px-2 py-0.5 text-[10px] font-bold text-white rounded"
                                        style={{ backgroundColor: BOARD_COLORS[exam.examType] ?? '#9E9E9E' }}
                                    >
                                        {exam.examType}
                                    </span>
                                    <span
                                        className="px-2 py-0.5 text-[10px] font-bold text-white rounded"
                                        style={{ backgroundColor: LEVEL_COLORS[exam.cefrLevel] ?? '#9E9E9E' }}
                                    >
                                        {exam.cefrLevel}
                                    </span>
                                    <span className="text-[10px] text-gray-400 ml-auto">
                                        ⏱ {exam.totalMinutes} Min · {exam.totalPoints} Punkte
                                    </span>
                                </div>

                                {/* Title */}
                                <h3 className="text-lg font-semibold text-gray-800 mb-1">{exam.title}</h3>
                                {exam.description && (
                                    <p className="text-xs text-gray-400 mb-3">{exam.description}</p>
                                )}

                                {/* Sections pills */}
                                <div className="flex gap-2 mb-4">
                                    {exam.sections.map((sec, i) => (
                                        <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-50 rounded-lg text-[11px] text-gray-600">
                                            {SKILL_EMOJI[sec.skill] ?? '📋'} {sec.skill.charAt(0) + sec.skill.slice(1).toLowerCase()}
                                            <span className="text-gray-300">·</span>
                                            {sec.totalMinutes}′
                                        </span>
                                    ))}
                                </div>

                                {/* Bottom row: score + CTA */}
                                <div className="flex items-center justify-between">
                                    {exam.bestAttempt ? (
                                        <div className="flex items-center gap-2">
                                            <span className={`text-sm font-bold ${exam.bestAttempt.passed ? 'text-green-600' : 'text-red-500'}`}>
                                                {exam.bestAttempt.passed ? '✅ Bestanden' : '❌ Nicht bestanden'}
                                            </span>
                                            <span className="text-xs text-gray-400">
                                                {exam.bestAttempt.percentScore}% · {exam.bestAttempt.totalScore}/{exam.bestAttempt.maxScore}
                                            </span>
                                        </div>
                                    ) : (
                                        <span className="text-xs text-gray-400">Noch nicht versucht</span>
                                    )}
                                    <Link
                                        href={`/exam/${exam.id}`}
                                        className="px-4 py-2 bg-gradient-to-r from-[#FF6B35] to-[#2EC4B6] text-white text-sm font-medium rounded-xl shadow-sm hover:shadow-md transition-all duration-200"
                                    >
                                        {exam.bestAttempt ? 'Nochmal' : 'Starten'} →
                                    </Link>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
