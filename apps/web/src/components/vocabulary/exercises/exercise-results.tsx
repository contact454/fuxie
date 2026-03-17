'use client'

import { Mascot } from '@/components/ui/mascot'

interface ResultItem {
    questionId: string
    isCorrect: boolean
    userAnswer: string
    correctAnswer: string
}

interface ExerciseResultsProps {
    totalQuestions: number
    correctCount: number
    accuracy: number
    xpEarned: number
    timeTaken?: number
    results: ResultItem[]
    onRetry: () => void
    onNewTheme: () => void
}

function ScoreRing({ score, total, size = 140 }: { score: number; total: number; size?: number }) {
    const percentage = total > 0 ? (score / total) * 100 : 0
    const radius = (size - 12) / 2
    const circumference = radius * 2 * Math.PI
    const offset = circumference - (percentage / 100) * circumference
    const color = percentage >= 80 ? '#10B981' : percentage >= 50 ? '#F59E0B' : '#EF4444'

    return (
        <div className="relative" style={{ width: size, height: size }}>
            <svg width={size} height={size} className="transform -rotate-90">
                <circle
                    cx={size / 2} cy={size / 2} r={radius}
                    stroke="#E5E7EB" strokeWidth={10} fill="none"
                />
                <circle
                    cx={size / 2} cy={size / 2} r={radius}
                    stroke={color} strokeWidth={10} fill="none"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-out"
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-black text-gray-900">{score}/{total}</span>
                <span className="text-sm text-gray-500">{Math.round(percentage)}%</span>
            </div>
        </div>
    )
}

export function ExerciseResults({
    totalQuestions,
    correctCount,
    accuracy,
    xpEarned,
    timeTaken,
    results,
    onRetry,
    onNewTheme,
}: ExerciseResultsProps) {
    const getMessage = () => {
        if (accuracy >= 90) return { text: 'Ausgezeichnet! 🏆', emoji: '🎉' }
        if (accuracy >= 70) return { text: 'Sehr gut! 🎉', emoji: '👏' }
        if (accuracy >= 50) return { text: 'Gut gemacht! 👍', emoji: '💪' }
        return { text: 'Weiter üben! 📖', emoji: '🔄' }
    }

    const msg = getMessage()
    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60)
        const s = seconds % 60
        return `${m}:${s.toString().padStart(2, '0')}`
    }

    return (
        <div className="max-w-lg mx-auto px-4 py-8 animate-fade-in-up">
            {/* Confetti effect */}
            {accuracy >= 70 && (
                <div className="text-center text-4xl mb-2 animate-bounce">
                    {msg.emoji}
                </div>
            )}

            {/* Score Ring */}
            <div className="flex justify-center mb-4">
                <ScoreRing score={correctCount} total={totalQuestions} />
            </div>

            {/* Message */}
            <h2 className="text-2xl font-bold text-gray-900 text-center mb-6">{msg.text}</h2>

            {/* Stats Row */}
            <div className="flex justify-center gap-3 mb-8">
                {timeTaken !== undefined && (
                    <div className="flex flex-col items-center bg-gray-50 rounded-xl px-4 py-3 border border-gray-100">
                        <span className="text-lg font-bold text-gray-700">⏱ {formatTime(timeTaken)}</span>
                        <span className="text-xs text-gray-400">Zeit</span>
                    </div>
                )}
                <div className="flex flex-col items-center bg-orange-50 rounded-xl px-4 py-3 border border-orange-100">
                    <span className="text-lg font-bold text-[#FF6B35]">+{xpEarned} XP</span>
                    <span className="text-xs text-gray-400">Erfahrung</span>
                </div>
                <div className="flex flex-col items-center bg-blue-50 rounded-xl px-4 py-3 border border-blue-100">
                    <span className="text-lg font-bold text-[#004E89]">{Math.round(accuracy)}%</span>
                    <span className="text-xs text-gray-400">Genauigkeit</span>
                </div>
            </div>

            {/* Mascot */}
            <div className="flex justify-center mb-6">
                <Mascot variant={accuracy >= 70 ? 'celebrate' : 'encouragement'} size={64} />
            </div>

            {/* Answer Breakdown */}
            <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-6">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                    Antworten ({correctCount}/{totalQuestions})
                </h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                    {results.map((r, i) => (
                        <div
                            key={r.questionId}
                            className={`flex items-center gap-3 p-2.5 rounded-xl text-sm ${
                                r.isCorrect
                                    ? 'bg-emerald-50 border border-emerald-100'
                                    : 'bg-red-50 border border-red-100'
                            }`}
                        >
                            <span className="text-base">
                                {r.isCorrect ? '✅' : '❌'}
                            </span>
                            <span className="flex-1 font-medium text-gray-800">
                                {i + 1}. {r.correctAnswer}
                            </span>
                            {!r.isCorrect && (
                                <span className="text-xs text-red-500">
                                    Deine: {r.userAnswer}
                                </span>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
                <button
                    onClick={onRetry}
                    className="flex-1 py-3 px-6 rounded-xl border-2 border-[#004E89] text-[#004E89] font-bold text-sm hover:bg-[#004E89]/5 transition-all"
                >
                    🔄 Nochmal üben
                </button>
                <button
                    onClick={onNewTheme}
                    className="flex-1 py-3 px-6 rounded-xl bg-gradient-to-r from-[#004E89] to-blue-600 text-white font-bold text-sm hover:opacity-90 transition-all shadow-lg shadow-blue-200"
                >
                    📚 Neues Thema
                </button>
            </div>
        </div>
    )
}
