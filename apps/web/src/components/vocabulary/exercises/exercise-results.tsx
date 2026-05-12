'use client'

import {
    ResultRewardLoop,
    resultRewardIcons,
} from '@/components/gamification/result-reward-loop'
import {
    FuxiePanel,
    fx,
} from '@/components/ui/fuxie-ui'

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
}: ExerciseResultsProps) {
    const getResultCopy = () => {
        if (!graded) {
            return {
                title: 'Đã lưu lượt luyện',
                message: 'Fuxie đã giữ câu trả lời của em. Khi máy chủ sẵn sàng, kết quả sẽ được đồng bộ lại.',
                coachTitle: 'Tiến độ chưa bị mất',
                coachMessage: 'Em có thể luyện tiếp chủ đề khác hoặc làm lại lượt này để giữ nhịp học trong ngày.',
                unlockLabel: 'Chờ đồng bộ',
                unlockDetail: 'Điểm sẽ cập nhật sau',
            }
        }

        if (accuracy >= 90) {
            return {
                title: 'Xuất sắc, quest hoàn thành!',
                message: `Em trả lời đúng ${correctCount}/${totalQuestions} câu. Đây là lượt luyện rất sạch để mở nhiệm vụ tiếp theo.`,
                coachTitle: 'Fuxie chốt một chiến thắng đẹp',
                coachMessage: 'Độ chính xác cao là tín hiệu tốt để chuyển sang chủ đề mới khi động lực còn mạnh.',
                unlockLabel: 'Mở tiếp',
                unlockDetail: 'Tăng độ khó',
            }
        }

        if (accuracy >= 70) {
            return {
                title: 'Rất tốt, em đang lên nhịp',
                message: `Em trả lời đúng ${correctCount}/${totalQuestions} câu. Chỉ cần thêm một vòng nữa là phần từ vựng này vững hơn rõ.`,
                coachTitle: 'Fuxie đề xuất đi tiếp',
                coachMessage: 'Kết quả đủ tốt để học chủ đề mới, nhưng luyện lại vẫn hữu ích nếu em muốn chắc hơn.',
                unlockLabel: 'Next',
                unlockDetail: 'Đi tiếp',
            }
        }

        if (accuracy >= 50) {
            return {
                title: 'Có tiến bộ, cần thêm một vòng',
                message: `Em đã đúng ${correctCount}/${totalQuestions} câu. Hãy luyện lại ngay để biến các từ còn lẫn thành điểm mạnh.`,
                coachTitle: 'Fuxie giữ focus cho em',
                coachMessage: 'Lượt này đã cho thấy điểm yếu cụ thể; luyện lại bây giờ sẽ tiết kiệm thời gian hơn để mai ôn.',
                unlockLabel: 'Focus list',
                unlockDetail: 'Ưu tiên từ còn sai',
            }
        }

        return {
            title: 'Chưa sao, mình sửa từng điểm yếu',
            message: `Em đúng ${correctCount}/${totalQuestions} câu. Result này giúp Fuxie biết nên kéo em về phần luyện trọng tâm.`,
            coachTitle: 'Fuxie đề xuất luyện lại',
            coachMessage: 'Đừng đổi chủ đề vội. Một lượt luyện lại ngắn sẽ giúp não nhận ra mẫu sai nhanh hơn.',
            unlockLabel: 'Luyện lại',
            unlockDetail: 'Khóa điểm yếu trước',
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
        ? 'Fucoin'
        : fucoinEarned > 0
            ? `+${fucoinEarned} Fucoin`
            : fucoinDuplicate
                ? 'Đã nhận Fucoin'
                : fucoinCapReached
                    ? 'Đủ Fucoin hôm nay'
                    : '+0 Fucoin'
    const fucoinDetail = !graded
        ? 'Đổi quà sau'
        : fucoinEarned > 0
            ? walletBalance !== undefined
                ? `${walletBalance} trong ví`
                : 'Đã cộng vào ví'
            : fucoinDuplicate
                ? 'Lượt này đã thưởng trước đó'
                : fucoinCapReached && fucoinDailyCap !== undefined
                    ? `${fucoinDailyCap}/${fucoinDailyCap} daily cap`
                    : fucoinDailyCap !== undefined && fucoinDailyEarned !== undefined
                        ? `${fucoinDailyEarned}/${fucoinDailyCap} hôm nay`
                        : 'Không có thưởng mới'
    const attemptMeta = [
        ...(timeTaken !== undefined
            ? [{
                icon: <Clock3 className="h-4 w-4" />,
                label: 'Thời gian',
                value: formatTime(timeTaken),
                detail: 'Thời gian luyện',
            }]
            : []),
        ...(graded
            ? [{
                icon: <Target className="h-4 w-4" />,
                value: `${Math.round(accuracy)}%`,
                label: 'Độ chính xác',
                detail: `${correctCount}/${totalQuestions} câu đúng`,
            }]
            : []),
    ]
    const rewardPreview = [
        {
            type: 'xp' as const,
            label: graded ? `+${xpEarned} XP` : 'Đang chờ XP',
            detail: graded ? 'Kinh nghiệm lượt luyện' : 'Đồng bộ khi có điểm',
        },
        {
            type: 'fucoin' as const,
            label: fucoinLabel,
            detail: fucoinDetail,
        },
        {
            type: 'streak' as const,
            label: streak?.freezeUsed ? 'Freeze saved' : 'Streak',
            detail: streak?.freezeUsed ? `${streak.currentStreak} ngay` : 'Giữ nhịp',
        },
    ]

    return (
        <div className="mx-auto max-w-4xl px-4 py-8 animate-fade-in-up">
            <ResultRewardLoop
                skill="vocabulary"
                title={copy.title}
                message={copy.message}
                scoreLabel={graded ? `${correctCount}/${totalQuestions}` : 'Đã lưu'}
                scoreDetail={graded ? 'Câu đúng' : 'Chờ chấm điểm'}
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
                primaryAction={{ label: 'Chủ đề mới', onClick: onNewTheme }}
                secondaryAction={{ label: 'Luyện lại', onClick: onRetry }}
                dashboardAction={{ label: 'Về Dashboard', href: '/dashboard' }}
                coachTitle={copy.coachTitle}
                coachMessage={copy.coachMessage}
                className="mb-6"
            />

            {/* Answer Breakdown */}
            <FuxiePanel variant="default" className="mb-6 p-4">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                    {graded ? `Câu trả lời (${correctCount}/${totalQuestions})` : 'Đã lưu câu trả lời'}
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
                                <span className="text-xs text-gray-500">Đang chấm</span>
                            ) : !r.isCorrect ? (
                                <span className="text-xs text-red-500">
                                    Em chọn: {r.userAnswer}
                                </span>
                            ) : null}
                        </div>
                    ))}
                </div>
            </FuxiePanel>
        </div>
    )
}
