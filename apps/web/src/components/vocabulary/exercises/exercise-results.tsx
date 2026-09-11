'use client'

import * as React from 'react'
import { useTranslations } from 'next-intl'
import {
    FuxiePanel,
    fuxieButtonClass,
    fx,
} from '@/components/ui/fuxie-ui'
import { RewardBurst, StreakPill, ProgressRing, PrimaryCta, FrostedPanel } from '@fuxie/ui/components'
import { FuxiePose } from './fuxie-pose'
import { RewardObject, type RewardObjectType } from './reward-object'

interface ResultItem {
    questionId: string
    isCorrect: boolean | null
    userAnswer: string
    correctAnswer: string
}

interface ExerciseResultsProps {
    totalQuestions: number
    correctCount: number
    accuracy: number
    xpEarned: number
    fucoinEarned?: number
    walletBalance?: number
    fucoinDuplicate?: boolean
    fucoinIntended?: number
    fucoinDailyCap?: number
    fucoinDailyEarned?: number
    fucoinDailyRemaining?: number
    fucoinCapReached?: boolean
    streak?: {
        currentStreak: number
        isNewDay: boolean
        freezeUsed?: boolean
        freezesAvailable?: number
        freezesUsed?: number
    }
    timeTaken?: number
    graded?: boolean
    results: ResultItem[]
    onRetry: () => void
    onNewTheme: () => void
    gameplayNextStep?: { label: string; href: string; stepId: string; reason: string }
    questEpisodeReceipt?: any
    nextEpisodeHref?: string
    themeName?: string
    themeSlug?: string
}

export function ExerciseResults({
    totalQuestions,
    correctCount,
    accuracy,
    xpEarned,
    streak,
    graded = true,
    results,
    onRetry,
    themeName = 'Essen und Trinken',
    themeSlug = '06-essen-trinken',
}: ExerciseResultsProps) {
    const t = useTranslations('Vocabulary')

    React.useEffect(() => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search)
            if (params.get('mockState') === 'scrolled' || params.get('scrolled') === 'true') {
                const timer = setTimeout(() => {
                    window.scrollTo({ top: 350, behavior: 'auto' })
                }, 300)
                return () => clearTimeout(timer)
            }
        }
    }, [])

    const getResultCopy = () => {
        if (!graded) {
            return {
                title: t('results.ungraded.title'),
                message: t('results.ungraded.message'),
            }
        }

        if (accuracy >= 90) {
            return {
                title: t('results.excellent.title'),
                message: t('results.excellent.message', { correct: correctCount, total: totalQuestions }),
            }
        }

        if (accuracy >= 70) {
            return {
                title: t('results.good.title'),
                message: t('results.good.message', { correct: correctCount, total: totalQuestions }),
            }
        }

        if (accuracy >= 50) {
            return {
                title: t('results.improving.title'),
                message: t('results.improving.message', { correct: correctCount, total: totalQuestions }),
            }
        }

        return {
            title: t('results.tryAgain.title'),
            message: t('results.tryAgain.message', { correct: correctCount, total: totalQuestions }),
        }
    }

    const copy = getResultCopy()

    const getRewardObjectType = (): RewardObjectType => {
        const slug = themeSlug || ''
        if (slug.includes('essen') || slug.includes('trink')) {
            return 'trophy'
        }
        if (slug.includes('einkaufen') || slug.includes('markt') || slug.includes('alltag')) {
            return 'medal'
        }
        if (streak && streak.currentStreak > 0) {
            return 'lantern'
        }
        return 'flag'
    }

    const rewardObjectType = getRewardObjectType()

    return (
        <div data-reward-state="earned" className="min-h-screen w-full fuxie-learn-bg relative flex flex-col items-center justify-between pb-8 pt-4 overflow-x-hidden overflow-y-auto animate-fade-in-up">
            {/* Background village map segment */}
            <div 
                className="absolute top-0 left-0 right-0 h-[45dvh] bg-[url('/images/worldmap-styleframe-final.png')] bg-no-repeat bg-[center_35%] bg-[length:180%] pointer-events-none opacity-50 z-0"
                style={{
                    maskImage: 'linear-gradient(to bottom, black 50%, transparent 100%)',
                    WebkitMaskImage: 'linear-gradient(to bottom, black 50%, transparent 100%)'
                }}
            />

            {/* Scrollable content container */}
            <div className="w-full max-w-md px-4 flex flex-col items-center z-10 relative">
                
                {/* Top half: RewardBurst with reward object in center */}
                <div className="h-[28dvh] flex items-center justify-center relative w-full mb-4">
                    <RewardBurst active={true}>
                        <div className="w-28 h-28 flex items-center justify-center rounded-full bg-white/95 border-4 border-white shadow-[var(--fuxie-shadow-iso)]">
                            <RewardObject type={rewardObjectType} size={84} />
                        </div>
                    </RewardBurst>
                </div>

                {/* Card Receipt */}
                <FrostedPanel className="w-full p-6 flex flex-col gap-4">
                    
                    {/* Header context */}
                    <div className="text-center">
                        <h2 className="text-xl font-black text-[var(--fuxie-blue-900)]">
                            {copy.title}
                        </h2>
                        <p className="text-xs font-bold text-[#3C78A8] mt-1">
                            Chủ đề: {themeName}
                        </p>
                    </div>

                    <div className="w-full border-t border-slate-100 my-1" />

                    {/* Results rows - vertical stack like mockup */}
                    <div className="flex flex-col gap-3">
                        {/* XP Row */}
                        <div className="flex items-center gap-4 py-1">
                            <div className="w-12 h-12 rounded-2xl bg-[#E6F4FE] text-[#1E90FF] flex items-center justify-center text-xl shrink-0 shadow-sm">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#3B82F6" className="w-6 h-6">
                                    <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                                </svg>
                            </div>
                            <div className="flex flex-col text-left">
                                <span className="text-base font-black text-[var(--fuxie-blue-900)]">+{xpEarned} XP</span>
                                <span className="text-xs text-slate-500 font-bold">Kinh nghiệm tích luỹ {/* // locale-allow */}</span>
                            </div>
                        </div>

                        {/* Streak Row */}
                        {streak && streak.currentStreak > 0 && (
                            <>
                                <div className="w-full border-t border-slate-100" />
                                <div className="flex items-center gap-4 py-1">
                                    <div className="w-12 h-12 rounded-2xl bg-[#FFF0E6] text-[#FF8A3D] flex items-center justify-center text-xl shrink-0 shadow-sm">
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#FF8A3D" className="w-6 h-6">
                                            <path d="M12 2s.22 1.94-.4 3.7c-.52 1.48-1.5 2.72-2.06 4.2C8.75 12.02 9 14 10.5 15.5c1.88 1.88 4.5 1.5 6-.5 1.12-1.48.75-4.22-.5-5.5-1.12-1.12-2.15-1.48-2.5-3.5-.35-2.02 1-3.5 1-3.5s2.5 1.5 3 4.5c.38 2.27-.47 4.7-2 6.5-2.25 2.65-6.5 2.73-8.5.5-1.68-1.88-1.88-5.07-.5-7.5C7.9 7 9.8 4.9 12 2z"/>
                                        </svg>
                                    </div>
                                    <div className="flex flex-col text-left">
                                        <span className="text-base font-black text-[var(--fuxie-blue-900)]">{streak.currentStreak} ngày</span>
                                        <span className="text-xs text-slate-500 font-bold">Chuỗi ngày học liên tục {/* // locale-allow */}</span>
                                    </div>
                                </div>
                            </>
                        )}

                        {/* Accuracy/Words Row */}
                        <div className="w-full border-t border-slate-100" />
                        <div className="flex items-center gap-4 py-1">
                            <div className="w-12 h-12 rounded-2xl bg-[#EAFBF8] text-[#2EC4B6] flex items-center justify-center shrink-0 shadow-sm">
                                <ProgressRing value={accuracy} size={28} strokeWidth={3} />
                            </div>
                            <div className="flex flex-col text-left">
                                <span className="text-base font-black text-[var(--fuxie-blue-900)]">{correctCount}/{totalQuestions} từ</span>
                                <span className="text-xs text-slate-500 font-bold">Từ vựng đã thuộc {/* // locale-allow */}</span>
                            </div>
                        </div>
                    </div>
                </FrostedPanel>

                {/* Mascot presenter: level-up-jump */}
                <div className="my-3 flex justify-center">
                    <FuxiePose
                        pose="level-up-jump"
                        size={140}
                        className="transform hover:scale-105 transition-transform duration-300 drop-shadow-sm"
                    />
                </div>

                {/* Fuxie horizontal separator */}
                <div className="flex items-center gap-3 w-full max-w-xs mx-auto my-2 text-slate-300">
                    <div className="flex-1 border-t border-dashed border-[var(--fuxie-blue-200)]" />
                    <span className="text-base select-none">🦊</span>
                    <div className="flex-1 border-t border-dashed border-[var(--fuxie-blue-200)]" />
                </div>

                {/* Primary CTA */}
                <div className="w-full mb-3">
                    <PrimaryCta
                        onClick={() => {
                            window.location.href = '/dashboard'
                        }}
                        className="w-full py-4 text-base font-black tracking-wide rounded-2xl shadow-md min-h-[44px]"
                    >
                        Về làng
                    </PrimaryCta>
                </div>

                {/* Secondary action */}
                <div className="w-full flex gap-3">
                    <button
                        onClick={onRetry}
                        className={fuxieButtonClass('ghost', 'md', 'flex-1 py-3 text-sm font-bold border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-2xl transition-colors min-h-[44px]')}
                    >
                        Luyện lại
                    </button>
                </div>

                {/* Answer Breakdown - kept for educational feedback */}
                <FrostedPanel className="w-full mt-6 p-4">
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                        {graded ? t('results.breakdown.answersCount', { correct: correctCount, total: totalQuestions }) : t('results.breakdown.savedAnswers')}
                    </h3>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                        {results.map((r, i) => (
                            <div
                                key={r.questionId}
                                className={fx('flex items-center gap-3 rounded-xl p-2.5 text-sm ring-1',
                                    r.isCorrect === null
                                        ? 'bg-slate-50 ring-slate-200'
                                        : r.isCorrect
                                            ? 'bg-[#EAFBF8] ring-[#2EC4B6]/25'
                                            : 'bg-red-50 ring-red-200'
                                )}
                            >
                                <span className="text-base">
                                    {r.isCorrect === null ? '•' : r.isCorrect ? '✅' : '❌'}
                                </span>
                                <span className="flex-1 font-medium text-gray-800 text-left">
                                    {i + 1}. {r.isCorrect === null ? r.userAnswer : r.correctAnswer}
                                </span>
                                {r.isCorrect === null ? (
                                    <span className="text-xs text-gray-500">{t('grading')}</span>
                                ) : !r.isCorrect ? (
                                    <span className="text-xs text-red-500">
                                        {t('results.breakdown.userChoice', { choice: r.userAnswer })}
                                    </span>
                                ) : null}
                            </div>
                        ))}
                    </div>
                </FrostedPanel>
            </div>
        </div>
    )
}
