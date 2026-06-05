'use client'

import { useTranslations } from 'next-intl'
import { resultRewardIcons } from '@/components/gamification/result-reward-loop'
import { CompletionFlow } from '@/components/gamification/completion-flow'
import {
    FuxiePanel,
    fuxieButtonClass,
    fx,
} from '@/components/ui/fuxie-ui'
import { trackClientAnalyticsEvent } from '@/lib/analytics/client-events'

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
}

export function ExerciseResults({
    totalQuestions,
    correctCount,
    accuracy,
    xpEarned,
    fucoinEarned = 0,
    walletBalance,
    fucoinDuplicate = false,
    fucoinDailyCap,
    fucoinDailyEarned,
    fucoinCapReached = false,
    streak,
    timeTaken,
    graded = true,
    results,
    onRetry,
    onNewTheme,
    gameplayNextStep,
}: ExerciseResultsProps) {
    const t = useTranslations('Vocabulary')
    const getResultCopy = () => {
        if (!graded) {
            return {
                title: t('results.ungraded.title'),
                message: t('results.ungraded.message'),
                coachTitle: t('results.ungraded.coachTitle'),
                coachMessage: t('results.ungraded.coachMessage'),
                unlockLabel: t('results.ungraded.unlockLabel'),
                unlockDetail: t('results.ungraded.unlockDetail'),
            }
        }

        if (accuracy >= 90) {
            return {
                title: t('results.excellent.title'),
                message: t('results.excellent.message', { correct: correctCount, total: totalQuestions }),
                coachTitle: t('results.excellent.coachTitle'),
                coachMessage: t('results.excellent.coachMessage'),
                unlockLabel: t('results.excellent.unlockLabel'),
                unlockDetail: t('results.excellent.unlockDetail'),
            }
        }

        if (accuracy >= 70) {
            return {
                title: t('results.good.title'),
                message: t('results.good.message', { correct: correctCount, total: totalQuestions }),
                coachTitle: t('results.good.coachTitle'),
                coachMessage: t('results.good.coachMessage'),
                unlockLabel: t('results.good.unlockLabel'),
                unlockDetail: t('results.good.unlockDetail'),
            }
        }

        if (accuracy >= 50) {
            return {
                title: t('results.improving.title'),
                message: t('results.improving.message', { correct: correctCount, total: totalQuestions }),
                coachTitle: t('results.improving.coachTitle'),
                coachMessage: t('results.improving.coachMessage'),
                unlockLabel: t('results.improving.unlockLabel'),
                unlockDetail: t('results.improving.unlockDetail'),
            }
        }

        return {
            title: t('results.tryAgain.title'),
            message: t('results.tryAgain.message', { correct: correctCount, total: totalQuestions }),
            coachTitle: t('results.tryAgain.coachTitle'),
            coachMessage: t('results.tryAgain.coachMessage'),
            unlockLabel: t('results.tryAgain.unlockLabel'),
            unlockDetail: t('results.tryAgain.unlockDetail'),
        }
    }

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60)
        const s = seconds % 60
        return `${m}:${s.toString().padStart(2, '0')}`
    }
    const copy = getResultCopy()
    const { Clock3, Target } = resultRewardIcons
    const fucoinLabel = !graded
        ? t('results.fucoinLabel.pending')
        : fucoinEarned > 0
            ? t('results.fucoinLabel.earned', { count: fucoinEarned })
            : fucoinDuplicate
                ? t('results.fucoinLabel.duplicate')
                : fucoinCapReached
                    ? t('results.fucoinLabel.capReached')
                    : t('results.fucoinLabel.zero')
    const fucoinDetail = !graded
        ? t('results.fucoinDetail.pending')
        : fucoinEarned > 0
            ? walletBalance !== undefined
                ? t('results.fucoinDetail.earnedWallet', { balance: walletBalance })
                : t('results.fucoinDetail.earnedAdded')
            : fucoinDuplicate
                ? t('results.fucoinDetail.duplicate')
                : fucoinCapReached && fucoinDailyCap !== undefined
                    ? t('results.fucoinDetail.capDaily', { earned: fucoinDailyCap, cap: fucoinDailyCap })
                    : fucoinDailyCap !== undefined && fucoinDailyEarned !== undefined
                        ? t('results.fucoinDetail.today', { earned: fucoinDailyEarned, cap: fucoinDailyCap })
                        : t('results.fucoinDetail.noReward')
    const attemptMeta = [
        ...(timeTaken !== undefined
            ? [{
                icon: <Clock3 className="h-4 w-4" />,
                label: t('results.attemptMeta.timeLabel'),
                value: formatTime(timeTaken),
                detail: t('results.attemptMeta.timeDetail'),
            }]
            : []),
        ...(graded
            ? [{
                icon: <Target className="h-4 w-4" />,
                value: `${Math.round(accuracy)}%`,
                label: t('results.attemptMeta.accuracyLabel'),
                detail: t('results.attemptMeta.accuracyDetail', { correct: correctCount, total: totalQuestions }),
            }]
            : []),
    ]
    const rewardPreview = [
        {
            type: 'xp' as const,
            label: graded ? `+${xpEarned} XP` : t('results.attemptMeta.scorePending'),
            detail: graded ? t('results.attemptMeta.scoreDetail') : t('results.attemptMeta.scorePendingDetail'),
        },
        {
            type: 'fucoin' as const,
            label: fucoinLabel,
            detail: fucoinDetail,
        },
        {
            type: 'streak' as const,
            label: streak?.freezeUsed ? t('results.streakLabel.freezeSaved') : 'Streak',
            detail: streak?.freezeUsed ? t('results.streakLabel.days', { count: streak.currentStreak }) : t('results.streakLabel.keepPace'),
        },
    ]

    return (
        <div className="mx-auto max-w-4xl px-4 py-8 animate-fade-in-up">
            <CompletionFlow
                mode="alreadySaved"
                skill="vocabulary"
                title={copy.title}
                message={copy.message}
                scoreLabel={graded ? `${correctCount}/${totalQuestions}` : t('results.actions.saved')}
                scoreDetail={graded ? t('results.actions.completed') : t('results.actions.pendingGrading')}
                accuracy={accuracy}
                xpEarned={xpEarned}
                graded={graded}
                attemptMeta={attemptMeta}
                rewardPreview={rewardPreview}
                streakReceipt={streak && graded
                    ? {
                        freezeUsed: Boolean(streak.freezeUsed),
                        currentStreak: streak.currentStreak,
                        freezesAvailable: streak.freezesAvailable ?? 0,
                        freezesUsed: streak.freezesUsed ?? 0,
                    }
                    : undefined}
                hasNextStep={Boolean(gameplayNextStep)}
                primaryAction={gameplayNextStep ? {
                    label: gameplayNextStep.label,
                    href: gameplayNextStep.href,
                    onClick: () => {
                        trackClientAnalyticsEvent({
                            eventName: 'quest_cta_clicked',
                            actionType: 'first_session_path',
                            actionId: gameplayNextStep.stepId,
                            metadata: { reason: gameplayNextStep.reason, surface: 'exercise_result' }
                        })
                    }
                } : { label: t('results.actions.newTheme'), onClick: onNewTheme }}
                secondaryAction={{ label: t('results.actions.retry'), onClick: onRetry }}
                dashboardAction={{ label: t('results.actions.backToDashboard'), href: '/dashboard' }}
                coachTitle={copy.coachTitle}
                coachMessage={copy.coachMessage}
                className="mb-6"
            />

            {/* Answer Breakdown */}
            <FuxiePanel variant="default" className="mb-6 p-4">
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
                            <span className="flex-1 font-medium text-gray-800">
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
            </FuxiePanel>
        </div>
    )
}
