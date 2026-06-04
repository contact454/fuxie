'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { useTranslations } from 'next-intl'

import { Flashcard } from './flashcard'
import { RatingButtons } from './rating-buttons'
import { Mascot } from '@/components/ui/mascot'
import {
    FuxiePanel,
    FuxieProgressBar,
    FuxieRewardList,
    fuxieButtonClass,
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
            <div className="flex flex-col items-center justify-center min-h-[500px] animate-fade-in-up">
                {/* Progress bar — complete */}
                <div className="w-full max-w-lg mb-8">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-emerald-600">
                            {stats.totalReviewed} / {stats.totalReviewed} ✓
                        </span>
                        <span className="text-sm font-bold text-fuxie-primary">
                            +{stats.xpEarned} XP
                        </span>
                    </div>
                    <FuxieProgressBar value={100} tone="success" />
                </div>

                {/* Mascot celebration */}
                <Mascot
                    variant={mascotVariant}
                    size={140}
                    speechBubble={celebrationMessage}
                />

                <div className="mt-8 w-full max-w-md">
                    {/* Stats grid */}
                    <div className="grid grid-cols-3 gap-3 mb-6">
                        <FuxiePanel variant="soft" className="p-4 text-center">
                            <p className="text-xs text-gray-500 mb-1">{t('correct')}</p>
                            <p className="text-2xl font-bold text-emerald-600">{stats.correct}</p>
                        </FuxiePanel>
                        <FuxiePanel variant="default" className="p-4 text-center ring-1 ring-red-100">
                            <p className="text-xs text-gray-500 mb-1">{t('notCorrect')}</p>
                            <p className="text-2xl font-bold text-red-500">{stats.again}</p>
                        </FuxiePanel>
                        <FuxiePanel variant="soft" className="p-4 text-center">
                            <p className="text-xs text-gray-500 mb-1">{t('accuracy')}</p>
                            <p className="text-2xl font-bold text-fuxie-primary">{accuracy}%</p>
                        </FuxiePanel>
                    </div>

                    {/* XP badge */}
                    <FuxieRewardList
                        className="mb-6"
                        items={[
                            {
                                icon: '★',
                                label: `+${stats.xpEarned} XP`,
                                detail: 'XP nhận được',
                                tone: 'reward',
                            },
                        ]}
                    />

                    {/* Actions */}
                    <div className="flex gap-3 justify-center">
                        <a
                            href="/vocabulary"
                            className={fuxieButtonClass('ghost', 'lg')}
                        >
                            {t('backToVocabulary')}
                        </a>
                        <a
                            href="/review"
                            className={fuxieButtonClass('primary', 'lg')}
                        >
                            {t('nextBtn')} →
                        </a>
                    </div>

                    {/* Next review hint */}
                    <p className="text-xs text-gray-400 text-center mt-4">
                        {t('nextReviewAutoScheduled')}
                    </p>
                </div>
            </div>
        )
    }

    // ===== EMPTY STATE =====
    if (!currentCard) {
        return (
            <FuxiePanel variant="soft" className="flex min-h-[400px] flex-col items-center justify-center p-8 text-center animate-fade-in">
                <Mascot
                    variant="empty"
                    size={120}
                    speechBubble={t('speechBubbleAddWords')}
                />
                <h2 className="text-xl font-bold text-gray-900 mt-6 mb-2">{t('noCardsToReview')}</h2>
                <p className="text-gray-500 mb-6">{t('exploreAndAddWords')}</p>
                <a
                    href="/vocabulary"
                    className={fuxieButtonClass('primary', 'lg')}
                >
                    {t('exploreVocabulary')}
                </a>
            </FuxiePanel>
        )
    }

    // ===== ACTIVE REVIEW =====
    const mascotReaction = getMascotReaction()

    return (
        <div className="flex flex-col items-center gap-6 py-4">
            {/* Progress bar */}
            <div className="w-full max-w-lg">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-500">
                        {currentIndex + 1} / {cards.length}
                    </span>
                    <span className="text-sm font-medium text-fuxie-primary">
                        +{stats.xpEarned} XP
                    </span>
                </div>
                <FuxieProgressBar value={progress} />
            </div>

            {/* Flashcard + Mascot area */}
            <div className="relative w-full">
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
                <div className="w-full animate-fade-in-up">
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
                <p className="text-sm text-gray-400 animate-pulse">
                    {t('tapToSeeAnswer')}
                </p>
            )}
        </div>
    )
}
