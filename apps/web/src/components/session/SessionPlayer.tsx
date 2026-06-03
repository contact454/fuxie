'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import Image from 'next/image'
import {
    Home,
    BookOpen,
    Target,
    Headphones,
    Pencil,
    MessageSquare,
    Trophy,
    LogOut,
    Heart,
} from 'lucide-react'
import type { SessionItem } from '@/lib/session/builder'
import type { ExerciseResult, ExerciseData } from '@/lib/session/types'
import { FUXIE_WORLD_PROPS, FUXIE_MASCOT_STATES } from '@/lib/mascot/fuxie-assets'
import { IntroCard } from './exercises/IntroCard'
import { MultipleChoice } from './exercises/MultipleChoice'
import { TypingExercise } from './exercises/TypingExercise'
import { SessionResultScreen } from './SessionResultScreen'

function getSessionMascotPose(format: string): string {
    switch (format) {
        case 'INTRO': return 'wave'
        case 'MULTIPLE_CHOICE': return 'listening'
        case 'TYPING': return 'writing'
        default: return 'neutral'
    }
}

export function SessionPlayer({
    level,
    initialItems,
    initialFinished = false,
    initialResults = [],
    initialScore = 0,
    initialHearts = 5,
}: {
    level: string
    initialItems?: SessionItem[]
    initialFinished?: boolean
    initialResults?: ExerciseResult[]
    initialScore?: number
    initialHearts?: number
}) {
    const router = useRouter()
    const t = useTranslations('UI')

    const [loading, setLoading] = useState(!initialItems)
    const [saving, setSaving] = useState(false)
    const [items, setItems] = useState<SessionItem[]>(initialItems ?? [])
    const [currentIndex, setCurrentIndex] = useState(0)
    const [hearts, setHearts] = useState(initialHearts)
    const [score, setScore] = useState(initialScore)
    const [results, setResults] = useState<ExerciseResult[]>(initialResults)
    const [isFinished, setIsFinished] = useState(initialFinished)
    const [elapsed, setElapsed] = useState(0)

    useEffect(() => {
        if (isFinished || loading) return
        const interval = setInterval(() => {
            setElapsed(e => e + 1)
        }, 1000)
        return () => clearInterval(interval)
    }, [isFinished, loading])

    const formatElapsed = (seconds: number) => {
        const m = Math.floor(seconds / 60)
        const s = seconds % 60
        return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
    }

    useEffect(() => {
        if (initialItems) {
            setItems(initialItems)
            setLoading(false)
            return
        }

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

        if (isCorrect !== undefined) {
            if (isCorrect) {
                newScore += item.points
            } else {
                newHearts = Math.max(0, hearts - 1)
            }
            setResults(prev => [...prev, { id: item.id, type: item.type, data: itemData || item.data, correct: isCorrect }])
        } else {
            setResults(prev => [...prev, { id: item.id, type: item.type, data: itemData || item.data, correct: true }])
        }

        setHearts(newHearts)
        setScore(newScore)

        if (newHearts === 0) { setIsFinished(true); return }
        if (currentIndex < items.length - 1) {
            setCurrentIndex(prev => prev + 1)
        } else {
            setIsFinished(true)
        }
    }, [currentIndex, items, hearts, score])

    const handleComplete = useCallback(async () => {
        setSaving(true)
        try {
            await fetch('/api/v1/session/complete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ results, totalXp: score, heartsRemaining: hearts, level })
            })
            router.push('/dashboard')
        } catch (err) {
            console.error('[Session] Save error:', err)
            router.push('/dashboard')
        }
    }, [results, score, hearts, level, router])

    if (loading) {
        return (
            <div className="flex-1 min-h-screen bg-[#5BB8F5] flex flex-col items-center justify-center">
                <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin" />
            </div>
        )
    }

    if (!items.length) {
        return (
            <div className="flex-1 min-h-screen bg-[#F3FBFF] flex flex-col items-center justify-center p-8 text-center">
                <div className="w-24 h-24 relative mb-4">
                    <Image src={FUXIE_MASCOT_STATES.wave} alt="Success" fill className="object-contain" />
                </div>
                <h3 className="text-2xl font-black text-[#173b56] mb-2">{t('sessionCompleteSuccess')}</h3>
                <p className="text-sm text-[#3C78A8] font-bold">{t('lessonsCompleted')}</p>
                <button
                    onClick={() => router.push('/dashboard')}
                    className="mt-6 px-8 py-3 bg-[#2E7EC4] hover:bg-[#1e6bb0] text-white font-black rounded-2xl shadow-md transition-all active:scale-[0.97]"
                >
                    {t('backToDashboard')}
                </button>
            </div>
        )
    }

    if (isFinished) {
        return (
            <SessionResultScreen
                score={score}
                hearts={hearts}
                total={items.length}
                saving={saving}
                onFinish={handleComplete}
                results={results}
            />
        )
    }

    const currentItem = items[currentIndex]!
    const progressPct = (currentIndex / items.length) * 100
    const mascotPoseKey = getSessionMascotPose(currentItem.format)
    const mascotPoseSrc = FUXIE_MASCOT_STATES[mascotPoseKey as keyof typeof FUXIE_MASCOT_STATES] || FUXIE_MASCOT_STATES.neutral

    return (
        <div className="min-h-screen bg-[#5BB8F5] font-sans text-[#173b56] flex flex-col">

            {/* ═══════════════════════════════════════════════
                TOP HEADER BAR — matches mock: FUXIE ⭐ 03·SESSION subtitle
            ═══════════════════════════════════════════════ */}
            <header className="bg-white border-b border-[#CCE4F0]/60 px-5 py-3 flex items-center justify-between sticky top-0 z-30 shadow-sm">
                <div className="flex items-center gap-3">
                    {/* Game-style FUXIE logo */}
                    <div className="bg-[#2E7EC4] text-white rounded-xl px-3 py-1.5 shadow flex items-center gap-1.5">
                        <span className="text-base font-black tracking-widest">
                            <span className="text-[#FFD700]">FU</span><span>XiE</span>
                        </span>
                        <span className="text-[#FFD700] text-sm">⭐</span>
                    </div>
                    <div className="hidden sm:block h-5 w-px bg-[#CCE4F0]" />
                    <div className="hidden sm:flex flex-col">
                        <span className="text-[10px] font-black text-[#3C78A8] uppercase tracking-widest">{t('sessionTitle')}</span>
                        <span className="text-[10px] font-semibold text-[#3C78A8]">{t('sessionSubtitle')}</span>
                    </div>
                </div>

                {/* Progress bar — center */}
                <div className="hidden md:flex items-center gap-3 flex-1 max-w-xs mx-6">
                    <span className="text-[9px] font-black text-[#3C78A8] shrink-0">{t('stepOfTotal', {current: currentIndex + 1, total: items.length})}</span>
                    <div className="flex-1 h-2.5 bg-[#CCE4F0]/40 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-[#2EC4B6] to-[#60A8E4] rounded-full transition-all duration-300"
                            style={{ width: `${progressPct}%` }}
                        />
                    </div>
                    <button className="px-3 py-1.5 bg-[#2EC4B6] text-white text-[9px] font-black rounded-full shadow">
                        🎧 {t('hoeren')}
                    </button>
                </div>

                <div className="flex items-center gap-2.5">
                    {/* Stats strip — avatar/level/XP/streak/planned */}
                    <div className="hidden lg:flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full overflow-hidden bg-[#F3FBFF] border-2 border-[#2EC4B6]">
                            <Image src={FUXIE_MASCOT_STATES.avatar} alt="avatar" width={32} height={32} className="object-contain" />
                        </div>
                        <span className="bg-[#2EC4B6] text-white text-[10px] font-black px-2.5 py-1 rounded-full">{level}</span>
                        <div className="flex flex-col w-28">
                            <div className="flex justify-between text-[8px] font-bold text-[#3C78A8]">
                                <span>Session aktiv</span>
                                <span>+{score} XP</span>
                            </div>
                            <div className="h-1.5 bg-[#CCE4F0]/40 rounded-full overflow-hidden mt-0.5">
                                <div className="h-full bg-[#60A8E4] rounded-full w-full" />
                            </div>
                        </div>
                        <div className="flex items-center gap-1 text-xs font-black text-[#173b56]"><span>🔥</span><span className="text-[8px] font-bold text-[#3C78A8]">AKTIV</span></div>
                        <div className="flex items-center gap-1 text-xs font-black text-[#173b56]"><span>📅</span><span className="text-[8px] font-bold text-[#3C78A8]">HEUTE</span></div>
                        <button className="p-1.5 text-[#3C78A8] hover:bg-[#F3FBFF] rounded-full">⚙️</button>
                    </div>

                    {/* Hearts */}
                    <div className="flex items-center gap-1.5 bg-red-50 border border-red-100 text-red-500 px-3 py-1.5 rounded-full text-xs font-black shadow-sm">
                        <Heart className="w-3.5 h-3.5 fill-red-500" />
                        <span>{hearts}</span>
                    </div>

                    <button
                        onClick={() => router.push('/dashboard')}
                        className="p-2 bg-white hover:bg-gray-50 rounded-full shadow-sm border border-[#CCE4F0]/60 text-gray-500 hover:text-gray-800 transition"
                        title="Quit session"
                    >
                        <LogOut className="w-4 h-4" />
                    </button>
                </div>
            </header>

            {/* Mobile progress bar */}
            <div className="md:hidden w-full h-1.5 bg-[#CCE4F0]/30">
                <div
                    className="h-full bg-gradient-to-r from-[#2EC4B6] to-[#60A8E4] transition-all duration-300"
                    style={{ width: `${progressPct}%` }}
                />
            </div>

            {/* ═══════════════════════════════════════════════
                MAIN CONTENT AREA
            ═══════════════════════════════════════════════ */}
            <div className="flex-1 flex flex-col lg:flex-row bg-white overflow-hidden">

                {/* ── LEFT: VERTICAL NAV + COACH PANEL (Desktop only) ── */}
                <div className="hidden lg:flex flex-row flex-shrink-0">
                    {/* Vertical icon rail as non-interactive scenery */}
                    <div aria-hidden="true" className="w-[72px] bg-[#2E7EC4] flex flex-col items-center gap-1 py-4 flex-shrink-0 select-none">
                        {[
                            { icon: <Home className="w-5 h-5" />, label: 'Übersicht' },
                            { icon: <BookOpen className="w-5 h-5" />, label: 'Lernen', active: true },
                            { icon: <Target className="w-5 h-5" />, label: 'Ziele' },
                            { icon: <Headphones className="w-5 h-5" />, label: 'Hören' },
                            { icon: <Pencil className="w-5 h-5" />, label: 'Schreiben' },
                            { icon: <MessageSquare className="w-5 h-5" />, label: 'Sprechen' },
                            { icon: <Trophy className="w-5 h-5" />, label: 'Belohnungen' },
                        ].map(({ icon, label, active }) => (
                            <div
                                key={label}
                                className={`flex flex-col items-center gap-0.5 w-full py-2 px-1 ${
                                    active ? 'bg-white/20 text-white' : 'text-white/40'
                                }`}
                            >
                                {icon}
                                <span className="text-[7px] font-bold">{label}</span>
                            </div>
                        ))}
                    </div>

                    {/* Coach panel: full-bleed dojo background + large mascot */}
                    <div className="w-[220px] xl:w-[260px] relative overflow-hidden flex flex-col border-r border-[#CCE4F0]/30">
                        {/* Full-bleed dojo background */}
                        <div className="absolute inset-0">
                            <Image
                                src={FUXIE_WORLD_PROPS.sessionFocusDojo}
                                alt="Coach dojo"
                                fill
                                className="object-cover"
                                priority
                            />
                            <div className="absolute inset-0 bg-gradient-to-b from-[#1a4a7a]/30 via-transparent to-white/80" />
                        </div>

                        {/* Large mascot centered */}
                        <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 pt-6">
                            <div className="absolute w-40 h-40 bg-[#2E7EC4]/20 rounded-full blur-3xl" />
                            <div className="relative w-48 h-48 drop-shadow-2xl">
                                <Image
                                    src={mascotPoseSrc}
                                    alt="Coach mascot"
                                    fill
                                    className="object-contain"
                                    priority
                                />
                            </div>
                        </div>

                        {/* Coach speech bubble at bottom */}
                        <div className="relative z-10 m-3 mt-auto bg-white rounded-2xl p-4 shadow-xl border border-[#CCE4F0]/50">
                            {/* Triangle pointer up */}
                            <div className="absolute -top-2.5 left-8 w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-b-[10px] border-b-white" />
                            <p className="text-[11px] font-black text-[#173b56] mb-1">{t('coachMascotTitle')}</p>
                            <p className="text-[10px] font-semibold text-[#3C78A8] leading-snug">
                                {currentItem.format === 'INTRO' && t('introPoseDesc')}
                                {currentItem.format === 'MULTIPLE_CHOICE' && t('mcPoseDesc')}
                                {currentItem.format === 'TYPING' && t('typingPoseDesc')}
                            </p>
                        </div>
                    </div>
                </div>

                {/* MOBILE: compact village header + step counter */}
                <div className="lg:hidden flex-shrink-0">
                    <div className="relative w-full h-[200px] sm:h-[240px] overflow-hidden">
                        {/* Sky background */}
                        <div className="absolute inset-0 bg-gradient-to-b from-[#87CEEB] to-[#5BB8F5]" />
                        <Image
                            src={FUXIE_WORLD_PROPS.villageSquare}
                            alt="Fuxie village"
                            fill
                            className="object-cover object-bottom"
                            priority
                        />
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white/30 pointer-events-none" />

                        {/* Step counter overlay */}
                        <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm rounded-xl px-3 py-1.5 shadow border border-white/60">
                            <p className="text-[9px] font-black text-[#3C78A8]">Schritt {currentIndex + 1} von {items.length}</p>
                        </div>

                        {/* Mascot floating over village */}
                        <div className="absolute bottom-0 right-4 w-24 h-24 relative">
                            <Image src={mascotPoseSrc} alt="Fuxie coach" fill className="object-contain drop-shadow-lg" />
                        </div>
                    </div>
                </div>

                {/* ── CENTER: EXERCISE WORKSPACE ── */}
                <div className="flex-1 flex flex-col items-stretch overflow-y-auto">
                    <div className="flex-1 flex flex-col p-4 md:p-6 xl:p-8 max-w-2xl mx-auto w-full">
                        <div className="flex-1 flex flex-col">
                            {currentItem.format === 'INTRO' && (
                                <IntroCard item={currentItem} onNext={() => handleNext(true)} />
                            )}
                            {currentItem.format === 'MULTIPLE_CHOICE' && (
                                <MultipleChoice
                                    item={currentItem}
                                    onNext={(correct) => handleNext(correct)}
                                    stepIndex={currentIndex}
                                    totalSteps={items.length}
                                />
                            )}
                            {currentItem.format === 'TYPING' && (
                                <TypingExercise item={currentItem} onNext={(correct) => handleNext(correct)} />
                            )}
                        </div>

                        {/* Mobile bottom coach strip */}
                        <div className="lg:hidden mt-4 flex-shrink-0 bg-[#EAF6FF] rounded-2xl p-3 border border-[#CCE4F0]/50 flex items-center gap-3">
                            <div className="w-10 h-10 relative flex-shrink-0">
                                <Image src={mascotPoseSrc} alt="Fuxie" fill className="object-contain" />
                            </div>
                            <div className="flex-1">
                                <span className="text-[9px] font-black text-[#3C78A8] uppercase">Fuxie sagt:</span>
                                <p className="text-[10px] font-semibold text-[#173b56] leading-snug mt-0.5">
                                    Kleine Schritte heute, großer Erfolg morgen! 💙
                                </p>
                            </div>
                            <div className="w-10 h-10 bg-white rounded-xl shadow-sm border border-[#CCE4F0]/50 flex items-center justify-center text-lg flex-shrink-0">⭐</div>
                        </div>
                    </div>

                    {/* ── BOTTOM STATS BAR (Desktop only, matches mock) ── */}
                    <div className="hidden lg:flex border-t border-[#CCE4F0]/40 bg-white px-6 py-3 items-center gap-8 flex-shrink-0">
                        <div className="flex items-center gap-2">
                            <span className="text-base">🎯</span>
                            <div className="flex flex-col">
                                <span className="text-[9px] font-bold text-[#3C78A8]">Heute&apos;s Ziel</span>
                                <span className="text-[10px] font-black text-[#173b56]">Session-Fortschritt</span>
                            </div>
                            <div className="w-16 h-1.5 bg-[#CCE4F0]/40 rounded-full ml-1 overflow-hidden">
                                <div className="h-full bg-[#2E7EC4] rounded-full" style={{ width: `${progressPct}%` }} />
                            </div>
                        </div>
                        <div className="w-px h-6 bg-[#CCE4F0]/60" />
                        <div className="flex items-center gap-2">
                            <span className="text-base">📖</span>
                            <div className="flex flex-col">
                                <span className="text-[9px] font-bold text-[#3C78A8]">Lernfokus</span>
                                <span className="text-[10px] font-black text-[#173b56]">Wortschatz</span>
                            </div>
                            <div className="flex gap-1 ml-2">
                                {[0, 1, 2, 3, 4].map(i => (
                                    <div key={i} className={`w-2 h-2 rounded-full ${i <= 2 ? 'bg-[#2EC4B6]' : 'bg-[#CCE4F0]'}`} />
                                ))}
                            </div>
                        </div>
                        <div className="w-px h-6 bg-[#CCE4F0]/60" />
                        <div className="flex items-center gap-2">
                            <span className="text-base">⏱️</span>
                            <div className="flex flex-col">
                                <span className="text-[9px] font-bold text-[#3C78A8]">Session-Zeit</span>
                                <span className="text-[10px] font-black text-[#173b56]">{formatElapsed(elapsed)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── RIGHT: FULL-BLEED VILLAGE MAP (Desktop only) ── */}
                <div className="hidden lg:flex w-[340px] xl:w-[400px] flex-shrink-0 relative overflow-hidden border-l border-[#CCE4F0]/30">
                    {/* Sky gradient */}
                    <div className="absolute inset-0 bg-gradient-to-b from-[#87CEEB] via-[#5BB8F5] to-[#3E9FD4]" />
                    {/* Village image full bleed */}
                    <div className="absolute inset-0">
                        <Image
                            src={FUXIE_WORLD_PROPS.villageSquare}
                            alt={t('altVillageMap')}
                            fill
                            className="object-cover object-bottom"
                            priority
                        />
                    </div>

                    {/* DEIN WEG card */}
                    <div className="absolute top-4 left-4 right-4 bg-white/90 backdrop-blur-md rounded-2xl px-4 py-3 shadow-xl border border-white/50 z-10">
                        <p className="text-[9px] font-black uppercase text-[#3C78A8] tracking-widest mb-1.5">{t('deinWeg')}</p>
                        <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-[#2EC4B6] text-white text-[9px] font-black flex items-center justify-center shadow">{level}</span>
                            <div className="flex-1 flex items-center gap-1">
                                <div className="flex-1 h-1.5 bg-[#2EC4B6]/30 rounded-full overflow-hidden">
                                    <div className="h-full bg-[#2EC4B6] w-1/2 rounded-full" />
                                </div>
                                <div className="w-3 h-3 rounded-full bg-[#2E7EC4] border-2 border-white shadow" />
                                <div className="flex-1 h-1.5 bg-[#CCE4F0]/40 rounded-full" />
                            </div>
                            <span className="text-sm">🏁</span>
                        </div>
                    </div>

                    {/* Building hotspot labels */}
                    <div className="absolute top-[20%] left-[10%] z-10 flex flex-col items-center gap-1">
                        <div className="bg-[#2EC4B6] text-white text-[9px] font-black px-2 py-0.5 rounded-full shadow-lg border border-white">{t('woerter')}</div>
                        <div className="w-3 h-3 rounded-full bg-white/40 border border-white/60 backdrop-blur-sm animate-pulse" />
                    </div>

                    <div className="absolute top-[18%] right-[12%] z-10 flex flex-col items-center gap-1">
                        <div className="bg-[#2E7EC4] text-white text-[9px] font-black px-2 py-0.5 rounded-full shadow-lg border border-white">{t('kurse')}</div>
                        <div className="w-3 h-3 rounded-full bg-white/40 border border-white/60 backdrop-blur-sm animate-pulse" />
                    </div>

                    {/* MISSIONEN board */}
                    <div className="absolute top-[40%] right-[2%] z-10">
                        <div className="bg-white/95 backdrop-blur-md rounded-xl p-3 shadow-xl border border-[#CCE4F0] w-40">
                            <p className="text-[8px] font-black uppercase text-[#3C78A8] tracking-widest border-b border-[#CCE4F0]/50 pb-1 mb-1.5">{t('sessionDetails')}</p>
                            <ul className="flex flex-col gap-1">
                                <li className="flex items-center gap-1.5 text-[9px] font-bold text-[#173b56]">
                                    <span className="w-3.5 h-3.5 bg-[#FFF9E6] border border-[#FFB703]/30 rounded-full flex items-center justify-center text-[7px] text-[#FFB703] shrink-0">◐</span>
                                    <span>{t('exerciseRunning')}</span>
                                </li>
                                <li className="flex items-center gap-1.5 text-[9px] font-bold text-[#173b56]">
                                    <span className="w-3.5 h-3.5 bg-[#F3FBFF] border border-[#CCE4F0] rounded-full flex items-center justify-center text-[7px] text-gray-400 shrink-0">○</span>
                                    <span>{t('step')} {currentIndex + 1}/{items.length}</span>
                                </li>
                                <li className="flex items-center gap-1.5 text-[9px] font-bold text-[#173b56]">
                                    <span className="w-3.5 h-3.5 bg-green-100 rounded-full text-green-600 flex items-center justify-center text-[7px] shrink-0">✓</span>
                                    <span>XP: +{score}</span>
                                </li>
                            </ul>
                        </div>
                    </div>

                    {/* HÖREN hotspot (current active, glowing) */}
                    <div className="absolute bottom-[35%] left-[10%] z-10 flex flex-col items-center gap-1">
                        <div className="bg-[#2EC4B6] text-white text-[9px] font-black px-2 py-0.5 rounded-full shadow-lg border-2 border-white ring-2 ring-[#2EC4B6]/40 ring-offset-1">{t('hoeren')}</div>
                        <div className="w-5 h-5 rounded-full bg-[#2EC4B6]/30 border-2 border-[#2EC4B6] animate-pulse" />
                    </div>

                    {/* BELOHNUNGEN hotspot */}
                    <div className="absolute bottom-[12%] right-[15%] z-10 flex flex-col items-center gap-1">
                        <div className="bg-[#FFB703] text-white text-[9px] font-black px-2 py-0.5 rounded-full shadow-lg border border-white">{t('belohnungen')}</div>
                        <div className="w-3 h-3 rounded-full bg-white/40 border border-white/60 backdrop-blur-sm" />
                    </div>
                </div>
            </div>
        </div>
    )
}
