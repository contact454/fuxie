'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { useTranslations } from 'next-intl'

import { Flashcard } from './flashcard'
import { RatingButtons } from './rating-buttons'
import { Mascot } from '@/components/ui/mascot'
import { PrimaryCta } from '@/components/ui/primary-cta'
import { useSuppressLearnerMainChrome } from '@/hooks/use-suppress-chrome'
import {
    FuxiePanel,
    FuxieProgressBar,
    FuxieRewardList,
} from '@/components/ui/fuxie-ui'

interface CardData {
    id: string
    interval: number
    easeFactor: number
    state: number
    vocabularyItem: {
        word: string
        article: string | null
        plural: string | null
        wordType: string
        translations: Record<string, string> | null
        exampleSentence1: string | null
        exampleTranslation1: string | null
        exampleSentence2: string | null
        exampleTranslation2: string | null
        notes: string | null
        conjugation: Record<string, unknown> | null
        audioUrl?: string | null
        imageUrl?: string | null
    }
}

interface ReviewSessionProps {
    initialCards: CardData[]
    totalDue: number
}

type Rating = 'AGAIN' | 'HARD' | 'GOOD' | 'EASY'

interface SessionStats {
    totalReviewed: number
    correct: number
    again: number
    xpEarned: number
}

export function ReviewSession({ initialCards, totalDue: _totalDue }: ReviewSessionProps) {
    const t = useTranslations('SRS')
    const [cards] = useState(initialCards)
    const [currentIndex, setCurrentIndex] = useState(0)
    const [isFlipped, setIsFlipped] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [sessionComplete, setSessionComplete] = useState(false)
    const [lastRating, setLastRating] = useState<Rating | null>(null)
    const [stats, setStats] = useState<SessionStats>({
        totalReviewed: 0,
        correct: 0,
        again: 0,
        xpEarned: 0,
    })
    const advanceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    const currentCard = cards[currentIndex]
    const progress = cards.length > 0 ? ((currentIndex) / cards.length) * 100 : 0

    // Suppress chrome for the full session (loading / empty / active cards).
    // Restore only on complete or unmount.
    useSuppressLearnerMainChrome(!sessionComplete)

    useEffect(() => {
        return () => {
            if (advanceTimeoutRef.current) clearTimeout(advanceTimeoutRef.current)
        }
    }, [])

    const handleFlip = useCallback(() => {
        setIsFlipped((prev) => !prev)
    }, [])

    const handleRate = useCallback(async (rating: Rating) => {
        if (!currentCard || isSubmitting) return
        setIsSubmitting(true)
        setLastRating(rating)

        try {
            const res = await fetch('/api/v1/srs/review', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    cardId: currentCard.id,
                    rating,
                }),
            })

            if (!res.ok) {
                console.error('Review submission failed')
                setIsSubmitting(false)
                return
            }

            const data = await res.json()
            const xp = data.data?.xpEarned ?? 0

            setStats((prev) => ({
                totalReviewed: prev.totalReviewed + 1,
                correct: rating !== 'AGAIN' ? prev.correct + 1 : prev.correct,
                again: rating === 'AGAIN' ? prev.again + 1 : prev.again,
                xpEarned: prev.xpEarned + xp,
            }))

            // Brief delay for mascot reaction, then move to next
            if (advanceTimeoutRef.current) clearTimeout(advanceTimeoutRef.current)
            advanceTimeoutRef.current = setTimeout(() => {
                if (currentIndex + 1 < cards.length) {
                    setCurrentIndex((prev) => prev + 1)
                    setIsFlipped(false)
                    setLastRating(null)
                } else {
                    setSessionComplete(true)
                }
            }, 600)
        } catch (err) {
            console.error('Review error:', err)
        } finally {
            setIsSubmitting(false)
        }
    }, [currentCard, currentIndex, cards.length, isSubmitting])

    // Mascot reaction based on last rating
    const getMascotReaction = (): { variant: 'correct' | 'encourage' | 'thinking'; message: string } | null => {
        if (!lastRating) return null
        switch (lastRating) {
            case 'EASY': return { variant: 'correct', message: t('speechBubbleEasy') }
            case 'GOOD': return { variant: 'correct', message: t('speechBubbleGoodReaction') }
            case 'HARD': return { variant: 'thinking', message: t('speechBubbleHard') }
            case 'AGAIN': return { variant: 'encourage', message: t('speechBubbleAgain') }
        }
    }

    // ===== SESSION COMPLETE SCREEN =====
    if (sessionComplete) {
        const accuracy = stats.totalReviewed > 0
            ? Math.round((stats.correct / stats.totalReviewed) * 100)
            : 0

        const mascotVariant = accuracy >= 80 ? 'celebrate' : accuracy >= 50 ? 'correct' : 'encourage'
        const celebrationMessage = accuracy >= 80
            ? t('speechBubbleExcellent')
            : accuracy >= 50
                ? t('speechBubbleGood')
                : t('speechBubbleTryAgain')

        return (
            <div className="min-h-screen w-full fuxie-learn-bg relative flex flex-col items-center justify-between pb-8 pt-4 overflow-x-hidden overflow-y-auto animate-fade-in-up">
                <div className="relative z-10 w-full max-w-md px-4 flex flex-col items-center flex-1 justify-center my-auto animate-fade-in-up">
                    {/* Mascot celebration */}
                    <Mascot
                        variant={mascotVariant}
                        size={120}
                        speechBubble={celebrationMessage}
                    />

                    <div className="mt-6 w-full bg-white/95 backdrop-blur-md border-2 border-[var(--fuxie-blue-200)] p-5 rounded-[24px] shadow-[var(--fuxie-shadow-card)]">
                        {/* Stats grid */}
                        <div className="grid grid-cols-3 gap-3 mb-4">
                            <FuxiePanel variant="soft" className="p-3 text-center">
                                <p className="text-[10px] text-gray-500 mb-1">{t('correct')}</p>
                                <p className="text-xl font-black text-emerald-600">{stats.correct}</p>
                            </FuxiePanel>
                            <FuxiePanel variant="default" className="p-3 text-center ring-1 ring-red-100 bg-white">
                                <p className="text-[10px] text-gray-500 mb-1">{t('notCorrect')}</p>
                                <p className="text-xl font-black text-red-500">{stats.again}</p>
                            </FuxiePanel>
                            <FuxiePanel variant="soft" className="p-3 text-center">
                                <p className="text-[10px] text-gray-500 mb-1">{t('accuracy')}</p>
                                <p className="text-xl font-black text-fuxie-primary">{accuracy}%</p>
                            </FuxiePanel>
                        </div>

                        {/* XP badge */}
                        <FuxieRewardList
                            className="mb-4"
                            items={[
                                {
                                    icon: '★',
                                    label: `+${stats.xpEarned} XP`,
                                    detail: t('xpReceivedDetail'),
                                    tone: 'reward',
                                },
                            ]}
                        />

                        {/* Actions */}
                        <div className="flex gap-3 justify-center">
                            <PrimaryCta asChild variant="secondary" className="flex-1">
                                <a href="/vocabulary">{t('backToVocabulary')}</a>
                            </PrimaryCta>
                            <PrimaryCta asChild variant="primary" className="flex-1">
                                <a href="/review">{t('nextBtn')} →</a>
                            </PrimaryCta>
                        </div>

                        {/* Next review hint */}
                        <p className="text-[10px] text-gray-400 text-center mt-3">
                            {t('nextReviewAutoScheduled')}
                        </p>
                    </div>
                </div>
            </div>
        )
    }

    // ===== EMPTY STATE =====
    if (!currentCard) {
        return (
            <div className="fixed inset-0 z-50 flex flex-col fuxie-gameplay-bg text-slate-950 overflow-y-auto">
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center max-w-lg mx-auto">
                    <Mascot
                        variant="empty"
                        size={120}
                        speechBubble={t('speechBubbleAddWords')}
                    />
                    <h2 className="text-xl font-black text-slate-900 mt-6 mb-2">{t('noCardsToReview')}</h2>
                    <p className="text-sm font-medium text-slate-500 mb-6 leading-relaxed">{t('exploreAndAddWords')}</p>

                    <PrimaryCta asChild variant="primary" className="w-full">
                        <a href="/vocabulary">
                            {t('exploreVocabulary')}
                        </a>
                    </PrimaryCta>
                </div>
            </div>
        )
    }

    // ===== ACTIVE REVIEW =====
    const mascotReaction = getMascotReaction()

    return (
        <div className="fixed inset-0 z-50 flex flex-col fuxie-gameplay-bg text-slate-950 overflow-y-auto">
            {/* Header progress bar */}
            <div className="w-full max-w-2xl mx-auto px-5 py-4 sm:px-6 flex items-center gap-3">
                <a
                    href="/review"
                    aria-label={t('closeReviewSession')}
                    className="flex h-11 w-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-xl text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--fuxie-blue-700)]"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </a>
                <div className="flex-1">
                    <FuxieProgressBar
                        value={progress}
                        className="h-1.5 bg-[var(--fuxie-blue-100)] rounded-full overflow-hidden"
                        barClassName="bg-[var(--fuxie-success)] bg-none rounded-full"
                    />
                </div>
                <span className="whitespace-nowrap text-sm font-black text-slate-500">
                    {t('cardProgress', { current: currentIndex + 1, total: cards.length })}
                </span>
                <span className="whitespace-nowrap text-sm font-black text-text-brand shrink-0">
                    {t('xpEarnedLabel', { xp: stats.xpEarned })}
                </span>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center p-4">
                {/* Flashcard + Mascot area */}
                <div className="relative w-full max-w-lg">
                    <Flashcard
                        vocabulary={currentCard.vocabularyItem}
                        isFlipped={isFlipped}
                        onFlip={handleFlip}
                    />

                    {/* Mascot reaction — bottom right */}
                    {mascotReaction && (
                        <div className="absolute -bottom-2 -right-4 animate-fade-in z-10">
                            <Mascot
                                variant={mascotReaction.variant}
                                size={64}
                                speechBubble={mascotReaction.message}
                            />
                        </div>
                    )}
                </div>

                {/* Rating buttons — only show when flipped */}
                {isFlipped && (
                    <div className="w-full mt-6 animate-fade-in-up">
                        <RatingButtons
                            onRate={handleRate}
                            disabled={isSubmitting}
                            currentInterval={currentCard.interval}
                            easeFactor={currentCard.easeFactor}
                        />
                    </div>
                )}

                {/* Flip hint when not flipped */}
                {!isFlipped && !lastRating && (
                    <p className="text-sm text-gray-400 animate-pulse mt-6 font-bold">
                        {t('tapToSeeAnswer')}
                    </p>
                )}
            </div>
        </div>
    )
}
