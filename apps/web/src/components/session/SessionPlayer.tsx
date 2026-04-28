'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import Image from 'next/image'
import type { SessionItem } from '@/lib/session/builder'
import type { ExerciseResult, ExerciseData } from '@/lib/session/types'
import { IntroCard } from './exercises/IntroCard'
import { MultipleChoice } from './exercises/MultipleChoice'
import { TypingExercise } from './exercises/TypingExercise'
import { SessionResultScreen } from './SessionResultScreen'

export function SessionPlayer({ level, initialItems }: { level: string; initialItems?: SessionItem[] }) {
    const router = useRouter()
    const t = useTranslations('UI')
    
    const [loading, setLoading] = useState(!initialItems)
    const [saving, setSaving] = useState(false)
    const [items, setItems] = useState<SessionItem[]>(initialItems ?? [])
    const [currentIndex, setCurrentIndex] = useState(0)
    
    // Gamification state
    const [hearts, setHearts] = useState(5)
    const [score, setScore] = useState(0)
    const [results, setResults] = useState<ExerciseResult[]>([])

    const [isFinished, setIsFinished] = useState(false)

    useEffect(() => {
        if (initialItems) {
            setItems(initialItems)
            setLoading(false)
            return
        }

        // Fetch session
        fetch(`/api/v1/session/start?level=${level}`)
            .then(res => res.json())
            .then(data => {
                if (data.success && data.data.items) {
                    setItems(data.data.items)
                }
            })
            .catch(err => console.error(err))
            .finally(() => setLoading(false))
    }, [level, initialItems])

    const handleNext = useCallback((isCorrect?: boolean, itemData?: ExerciseData) => {
        const item = items[currentIndex]
        if (!item) return

        let newHearts = hearts
        let newScore = score
        
        // If the question requires evaluation
        if (isCorrect !== undefined) {
             if (isCorrect) {
                 newScore += item.points
             } else {
                 newHearts = Math.max(0, hearts - 1)
             }
             
             setResults(prev => [...prev, {
                 id: item.id,
                 type: item.type,
                 data: itemData || item.data,
                 correct: isCorrect
             }])
        } else {
            // e.g. INTRO Card, just proceed
            setResults(prev => [...prev, {
                 id: item.id,
                 type: item.type,
                 data: itemData || item.data,
                 correct: true // Always count intro as successful exposure
            }])
        }

        setHearts(newHearts)
        setScore(newScore)

        if (newHearts === 0) {
            // Ran out of hearts! End early.
            setIsFinished(true)
            return
        }

        if (currentIndex < items.length - 1) {
            setCurrentIndex(prev => prev + 1)
        } else {
            // Done
            setIsFinished(true)
        }
    }, [currentIndex, items, hearts, score])

    const handleComplete = useCallback(async () => {
        setSaving(true)
        try {
            await fetch('/api/v1/session/complete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    results,
                    totalXp: score,
                    heartsRemaining: hearts,
                    level
                })
            })
            router.push('/dashboard')
        } catch (err) {
            console.error('[Session] Save error:', err)
            router.push('/dashboard')
        }
    }, [results, score, hearts, level, router])

    if (loading) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center">
                <div className="w-12 h-12 border-4 border-fuxie-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
        )
    }

    if (!items.length) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-gray-500">
                <Image src="/mascot/core/fuxie-core-sad.png" alt="No items" width={120} height={120} className="mb-4 opacity-50" />
                <h3 className="text-xl font-bold text-gray-700">Chúc mừng!</h3>
                <p>{t('lessonsCompleted')}</p>
                <button onClick={() => router.push('/dashboard')} className="mt-6 px-6 py-2 bg-blue-500 text-white rounded-xl">Quay lại Dashboard</button>
            </div>
        )
    }

    if (isFinished) {
        return <SessionResultScreen score={score} hearts={hearts} total={items.length} saving={saving} onFinish={handleComplete} />
    }

    const currentItem = items[currentIndex]!
    const progressPct = ((currentIndex) / items.length) * 100

    return (
        <div className="max-w-2xl mx-auto w-full flex-1 flex flex-col p-4">
            {/* Header: Progress & Hearts */}
            <div className="flex items-center gap-4 mb-8 pt-4">
                <button onClick={() => router.push('/dashboard')} className="p-2 -ml-2 text-gray-400 hover:text-gray-700 transition">
                    <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                </button>
                <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-fuxie-primary transition-all duration-300" style={{ width: `${progressPct}%` }} />
                </div>
                <div className="flex items-center gap-1.5 text-red-500 font-bold">
                    ❤️ {hearts}
                </div>
            </div>

            {/* Exercise Content Area */}
            <div className="flex-1 overflow-y-auto w-full pb-32">
                {currentItem.format === 'INTRO' && (
                     <IntroCard item={currentItem} onNext={() => handleNext(true)} />
                )}
                {currentItem.format === 'MULTIPLE_CHOICE' && (
                     <MultipleChoice item={currentItem} onNext={(correct) => handleNext(correct)} />
                )}
                {currentItem.format === 'TYPING' && (
                     <TypingExercise item={currentItem} onNext={(correct) => handleNext(correct)} />
                )}
            </div>
        </div>
    )
}
