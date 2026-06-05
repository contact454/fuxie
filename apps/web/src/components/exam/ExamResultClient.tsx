'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { FUXIE_3D_ASSETS, type RewardPreviewItem } from '@/components/gamification/quest-visuals'
import { CompletionFlow } from '@/components/gamification/completion-flow'

interface ResultData {
    attemptId: string
    totalScore: number
    maxScore: number
    percentScore: number
    passed: boolean
    sectionScores: Array<{ score: number; maxScore: number; skill: string }>
    answers: Array<{
        taskId: string
        score: number
        maxScore: number
        isCorrect: boolean
        details: Record<string, unknown>
    }>
}

const SKILL_EMOJI: Record<string, string> = {
    LESEN: '📖', HOEREN: '🎧', SCHREIBEN: '✍️', SPRECHEN: '🗣️',
}

export function ExamResultClient({ examId, attemptId }: { examId: string; attemptId: string }) {
    const tExam = useTranslations('Exam')
    const [result, setResult] = useState<ResultData | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetch(`/api/v1/exams/${examId}/result/${attemptId}`)
            .then(r => r.json())
            .then(d => { if (d.success) setResult(d.data) })
            .finally(() => setLoading(false))
    }, [examId, attemptId])

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <div className="w-12 h-12 border-4 border-[#60A8E4]/30 border-t-[#60A8E4] rounded-full animate-spin" />
            </div>
        )
    }

    if (!result) {
        return (
            <div className="text-center py-16">
                <p className="text-gray-500">{tExam('result.notFound')}</p>
                <Link href="/exam" className="text-sm text-blue-500 underline mt-2 block">{tExam('result.backToList')}</Link>
            </div>
        )
    }

    const circumference = 2 * Math.PI * 60
    const strokeDashoffset = circumference - (result.percentScore / 100) * circumference

    // Req 10.5 — once the server-confirmed submission lands the
    // ResultRewardLoop must trigger within 2s. We mount the shared
    // CompletionFlow in `alreadySaved` mode so the FSM jumps from saving
    // to the earned phase inside the spec [1.2s, 2.0s] window. The
    // existing section breakdown stays below as supporting receipt detail.
    const examRewardPreview: RewardPreviewItem[] = [
        {
            type: 'xp',
            label: result.passed ? tExam('result.passedLabel') : tExam('result.savedLabel'),
            detail: tExam('result.pointsDetail', { score: result.totalScore, max: result.maxScore }),
        },
        {
            type: 'badge',
            label: `${result.percentScore}%`,
            detail: tExam('result.totalScoreDetail'),
        },
    ]

    return (
        <div className="max-w-2xl mx-auto px-4 py-8">
            <CompletionFlow
                mode="alreadySaved"
                skill="exam"
                title={result.passed ? tExam('result.passedTitle') : tExam('result.savedTitle')}
                message={result.passed
                    ? tExam('result.passedMsg', { percent: result.percentScore })
                    : tExam('result.savedMsg', { percent: result.percentScore })}
                scoreLabel={`${result.totalScore}/${result.maxScore}`}
                scoreDetail={tExam('result.totalScoreDetail')}
                accuracy={result.percentScore}
                xpEarned={0}
                graded
                rewardPreview={examRewardPreview}
                hasNextStep={false}
                primaryAction={{ label: tExam('result.continueBtn'), href: '/exam' }}
                secondaryAction={{ label: tExam('result.retryBtn'), href: `/exam/${examId}` }}
                dashboardAction={{ label: tExam('result.backToDashboardBtn'), href: '/dashboard' }}
                className="mb-6"
            />
            {/* Score circle */}
            <div className="text-center mb-8">
                <div className="relative w-40 h-40 mx-auto mb-4">
                    <svg className="w-40 h-40 transform -rotate-90" viewBox="0 0 130 130">
                        <circle cx="65" cy="65" r="60" stroke="#e5e7eb" strokeWidth="8" fill="none" />
                        <circle
                            cx="65" cy="65" r="60"
                            stroke={result.passed ? '#22c55e' : '#ef4444'}
                            strokeWidth="8"
                            fill="none"
                            strokeLinecap="round"
                            strokeDasharray={circumference}
                            strokeDashoffset={strokeDashoffset}
                            className="transition-all duration-1000 ease-out"
                        />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-3xl font-bold text-gray-800">{result.percentScore}%</span>
                        <span className="text-xs text-gray-400">{result.totalScore} / {result.maxScore}</span>
                    </div>
                </div>

                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold
                    ${result.passed
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-600'
                    }`}
                >
                    {result.passed ? (
                        <>
                            <Image src={FUXIE_3D_ASSETS.examGuide} alt={tExam('result.altGuide')} width={24} height={24} className="object-contain" />
                            {tExam('result.passed')}
                        </>
                    ) : (
                        <>❌ {tExam('result.failed')}</>
                    )}
                </div>
            </div>

            {/* Section breakdown */}
            <div className="bg-white rounded-2xl ring-1 ring-gray-100 p-5 mb-6">
                <h3 className="text-sm font-semibold text-gray-600 mb-4">{tExam('result.breakdown')}</h3>
                <div className="space-y-3">
                    {result.sectionScores.map((sec, idx) => {
                        const pct = sec.maxScore > 0 ? Math.round((sec.score / sec.maxScore) * 100) : 0
                        const passed = pct >= 60
                        return (
                            <div key={idx} className="flex items-center gap-3">
                                <span className="text-lg">{SKILL_EMOJI[sec.skill] ?? '📋'}</span>
                                <span className="text-sm font-medium text-gray-700 w-24">
                                    {tExam(`result.skillLabel.${sec.skill}` as any) ?? sec.skill}
                                </span>
                                <div className="flex-1">
                                    <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                                        <div
                                            className={`h-3 rounded-full transition-all duration-700 ${passed ? 'bg-green-500' : 'bg-red-400'}`}
                                            style={{ width: `${pct}%` }}
                                        />
                                    </div>
                                </div>
                                <span className={`text-sm font-bold ${passed ? 'text-green-600' : 'text-red-500'}`}>
                                    {sec.score}/{sec.maxScore}
                                </span>
                                <span className="text-xs text-gray-400 w-10 text-right">{pct}%</span>
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
                <Link
                    href="/exam"
                    className="flex-1 py-3 text-center text-sm font-medium text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-all"
                >
                    ← Về tổng quan
                </Link>
                <Link
                    href={`/exam/${examId}`}
                    className="flex-1 py-3 text-center text-sm font-medium text-white bg-gradient-to-r from-[#60A8E4] to-[#2EC4B6] rounded-xl shadow-sm hover:shadow-md transition-all"
                >
                    Thử lại →
                </Link>
            </div>
        </div>
    )
}
