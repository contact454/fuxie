'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
    Home,
    BookOpen,
    Target,
    Headphones,
    Pencil,
    MessageSquare,
    Trophy,
    Settings,
    Bell,
    Plus,
} from 'lucide-react'
import type { DashboardData } from './dashboard-client'
import { FUXIE_WORLD_PROPS, FUXIE_MASCOT_STATES } from '@/lib/mascot/fuxie-assets'
import { PrimaryCta } from '@/components/ui/primary-cta'

export interface DashboardMockupClientProps {
    section?: string
    data: DashboardData
    forceEmpty?: boolean
}

export function DashboardMockupClient({ data, forceEmpty = false }: DashboardMockupClientProps) {
    const router = useRouter()

    const isEmpty = forceEmpty || !data.profile.targetLevel || data.profile.totalLessonsCompleted === 0
    const [activeTab, setActiveTab] = useState('home')

    const displayName = data.profile.displayName
    const currentStreak = data.streak.currentStreak
    const xpEarned = data.todayActivity?.xpEarned ?? 0
    const xpGoal = Math.max(50, data.profile.studyGoalMinutes * 3)
    const progressPercent = isEmpty ? 0 : Math.min(100, Math.round((xpEarned / xpGoal) * 100))
    const totalXp = data.profile.totalXp

    const handleStartSession = () => router.push('/session')

    return (
        <div
            data-role="dashboard-slice-1-surface"
            data-slice="slice-1"
            data-module="01-dashboard"
            data-visual-state={isEmpty ? 'empty' : 'default'}
            className="min-h-screen bg-[#5BB8F5] font-sans antialiased text-[#173b56] flex flex-col lg:flex-row overflow-hidden"
        >

            {/* ═══════════════════════════════════════════════
                DESKTOP LAYOUT
            ═══════════════════════════════════════════════ */}

            {/* Left Vertical Icon Rail (Desktop only) */}
            <aside className="hidden lg:flex w-[88px] flex-col items-center justify-between py-6 bg-[#2E7EC4] shrink-0 h-screen sticky top-0 z-20 rounded-r-[24px] shadow-2xl">
                <div className="flex flex-col items-center gap-2 w-full">
                    {/* Logo mark */}
                    <div className="w-11 h-11 bg-white rounded-xl flex items-center justify-center shadow-md mb-4">
                        <Image
                            src={FUXIE_MASCOT_STATES.avatar}
                            alt="Fuxie logo"
                            width={32}
                            height={32}
                            className="object-contain"
                        />
                    </div>

                    {[
                        { icon: <Home className="w-5 h-5" />, label: 'Übersicht', key: 'home', active: true },
                        { icon: <BookOpen className="w-5 h-5" />, label: 'Lernen', key: 'learn' },
                        { icon: <Target className="w-5 h-5" />, label: 'Ziele', key: 'goals' },
                        { icon: <Headphones className="w-5 h-5" />, label: 'Hören', key: 'listen' },
                        { icon: <Pencil className="w-5 h-5" />, label: 'Schreiben', key: 'write' },
                        { icon: <MessageSquare className="w-5 h-5" />, label: 'Chat', key: 'chat' },
                        { icon: <Trophy className="w-5 h-5" />, label: 'Belohnungen', key: 'rewards' },
                    ].map(({ icon, label, key }) => (
                        <button
                            key={key}
                            onClick={() => {
                                setActiveTab(key)
                                if (key === 'learn') router.push('/course')
                            }}
                            title={label}
                            className={`flex flex-col items-center gap-1 w-full py-2 px-1 rounded-xl transition-all duration-200 ${
                                activeTab === key
                                    ? 'bg-white text-[#2E7EC4]'
                                    : 'text-white/75 hover:bg-white/15 hover:text-white'
                            }`}
                        >
                            {icon}
                            <span className="text-[8px] font-bold leading-none">{label}</span>
                        </button>
                    ))}
                </div>

                {/* Streak chip */}
                <div className="flex flex-col items-center gap-1 bg-white/20 rounded-2xl px-2 py-3 mx-2">
                    <span className="text-base">📅</span>
                    <span className="text-[9px] font-black text-white text-center leading-tight">
                        {currentStreak}<br />DAY STREAK
                    </span>
                </div>
            </aside>

            {/* ───────── LEFT CONTENT AREA ───────── */}
            <div className="flex-1 flex flex-col lg:flex-row min-h-screen">

                {/* ── LEFT PANEL: White card (desktop) / full scroll (mobile) ── */}
                <div className="lg:w-[460px] xl:w-[520px] flex-shrink-0 flex flex-col bg-white/0 lg:bg-transparent z-10">

                    {/* MOBILE HEADER */}
                    <header className="flex lg:hidden items-center justify-between px-4 pt-4 pb-2 bg-transparent">
                        <span className="text-[26px] font-black tracking-wider text-white drop-shadow">
                            <span className="text-[#FFD700]">FU</span><span className="text-white">XiE</span>
                        </span>
                        <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1.5 bg-white/90 px-3 py-1.5 rounded-full shadow text-xs font-black text-[#173b56]">
                                <span>🔥</span><span>{currentStreak}</span>
                            </div>
                            <div className="flex items-center gap-1.5 bg-white/90 px-3 py-1.5 rounded-full shadow text-xs font-black text-[#173b56]">
                                <span>📅</span><span>{data.streak.freezesAvailable ?? 0}</span>
                            </div>
                            <button className="p-2 bg-white/90 rounded-full shadow text-[#2E7EC4]">
                                <Bell className="w-4 h-4" />
                            </button>
                        </div>
                    </header>

                    {/* MOBILE HERO: village image with mascot + greeting overlay */}
                    <div className="lg:hidden relative w-full h-[240px] sm:h-[280px] overflow-hidden mt-2 mx-0 flex-shrink-0">
                        <Image
                            src={FUXIE_WORLD_PROPS.villageSquare}
                            alt="Fuxie village"
                            fill
                            className="object-cover"
                            priority
                        />
                        {/* Sky gradient overlay at top */}
                        <div className="absolute inset-0 bg-gradient-to-b from-[#5BB8F5]/40 via-transparent to-white/10 pointer-events-none" />

                        {/* Mascot + greeting callout */}
                        <div className="absolute top-4 left-4 right-4 flex items-start gap-3">
                            <div className="w-20 h-20 relative flex-shrink-0 drop-shadow-xl">
                                <Image
                                    src={FUXIE_MASCOT_STATES.wave}
                                    alt="Fuxie mascot"
                                    fill
                                    className="object-contain"
                                    priority
                                />
                            </div>
                            <div className="bg-white/95 backdrop-blur-sm px-3 py-2 rounded-2xl shadow-lg border border-white/60 max-w-[200px]">
                                <div className="flex items-center gap-1 mb-0.5">
                                    <span className="text-sm">☀️</span>
                                    <p className="text-sm font-black text-[#173b56]">Guten Morgen!</p>
                                </div>
                                <p className="text-[10px] font-semibold text-[#3C78A8] leading-snug">
                                    Bereit für einen großartigen Lerntag?
                                </p>
                            </div>
                        </div>

                        {/* Building labels */}
                        <div className="absolute top-[45%] left-[8%] bg-[#7F56D9] text-white text-[9px] font-black px-2 py-0.5 rounded-full shadow border border-white">LESEN</div>
                        <div className="absolute top-[20%] left-[30%] bg-[#FFB703] text-white text-[9px] font-black px-2 py-0.5 rounded-full shadow border border-white">WÖRTER</div>
                        <div className="absolute top-[15%] right-[28%] bg-[#2EC4B6] text-white text-[9px] font-black px-2 py-0.5 rounded-full shadow border border-white">LEARN</div>
                        <div className="absolute top-[20%] right-[8%] bg-[#FFB703] text-white text-[9px] font-black px-2 py-0.5 rounded-full shadow border border-white">ÜBEN</div>
                        <div className="absolute bottom-[30%] right-[20%] bg-[#2EC4B6] text-white text-[9px] font-black px-2 py-0.5 rounded-full shadow border border-white">CHAT</div>
                    </div>

                    {/* DESKTOP TOP HEADER BAR */}
                    <header className="hidden lg:flex items-center justify-between bg-white px-6 py-4 rounded-b-none rounded-t-none border-b border-[#CCE4F0]/60 flex-shrink-0 mx-4 mt-4 rounded-t-[28px] shadow-md">
                        <div className="flex items-center gap-3">
                            {/* Chunky game-style FUXIE logo */}
                            <div className="bg-[#2E7EC4] text-white rounded-2xl px-4 py-2 shadow-lg flex items-center gap-2 -rotate-1">
                                <span className="text-[22px] font-black tracking-widest leading-none">
                                    <span className="text-[#FFD700]">FU</span><span>XiE</span>
                                </span>
                                <span className="text-[#FFD700] text-lg">⭐</span>
                            </div>
                            <div className="h-8 w-px bg-[#CCE4F0]" />
                            <h1 className="text-[22px] font-black tracking-wider text-[#173b56]">DASHBOARD</h1>
                        </div>

                        <div className="flex items-center gap-3">
                            {/* Avatar + level */}
                            <div className="flex items-center gap-2 bg-[#F3FBFF] px-3 py-1.5 rounded-full border border-[#CCE4F0] shadow-sm">
                                <div className="w-7 h-7 rounded-full overflow-hidden bg-white border-2 border-[#2EC4B6]">
                                    <Image src={FUXIE_MASCOT_STATES.avatar} alt="avatar" width={28} height={28} className="object-contain" />
                                </div>
                                <span className="text-xs font-black text-[#173b56]">{displayName}</span>
                            </div>
                            <span className="bg-[#2EC4B6] text-white text-xs font-black px-3 py-1.5 rounded-full shadow">
                                {data.profile.currentLevel}
                            </span>
                            {/* XP bar */}
                            <div className="flex flex-col gap-1 w-36">
                                <div className="flex justify-between text-[9px] font-bold text-[#3C78A8]">
                                    <span>{totalXp} XP</span>
                                    <span>Level {data.profile.fuxieLevel}</span>
                                </div>
                                <div className="h-2 bg-[#CCE4F0]/60 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-[#2EC4B6] to-[#60A8E4] rounded-full"
                                        style={{ width: `${Math.min(100, (totalXp % 1000) / 10)}%` }}
                                    />
                                </div>
                            </div>
                            <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-full border border-[#CCE4F0] shadow-sm text-xs font-black">
                                <span>🔥</span><span>{currentStreak}</span>
                            </div>
                            <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-full border border-[#CCE4F0] shadow-sm text-xs font-black">
                                <span>📅</span><span>{data.streak.freezesAvailable ?? 0}</span>
                            </div>
                            <button className="p-2 bg-white rounded-full border border-[#CCE4F0] shadow-sm text-[#3C78A8] hover:bg-gray-50">
                                <Settings className="w-4 h-4" />
                            </button>
                        </div>
                    </header>

                    {/* ── LEFT MAIN CONTENT CARD (desktop: white card; mobile: white bg) ── */}
                    <div className="flex-1 bg-white lg:rounded-b-[28px] mx-4 mb-4 shadow-xl border border-[#CCE4F0]/40 lg:border-t-0 flex flex-col overflow-hidden">
                        <div className="flex-1 flex flex-col p-5 gap-5 overflow-y-auto pb-28 lg:pb-5">

                            {/* TODAY section */}
                            <section data-role="dashboard-primary-task">
                                <h2 className="text-[11px] font-black uppercase tracking-widest text-[#3C78A8] flex items-center gap-2 mb-3">
                                    <span className="w-2 h-2 rounded-full bg-[#2EC4B6]" />
                                    {isEmpty ? 'HEUTE' : 'TODAY'}
                                </h2>

                                {isEmpty ? (
                                    <div className="flex flex-col gap-4" data-role="dashboard-empty-state">
                                        <h3 className="text-xl font-black text-[#173b56]">Keine Session geplant.</h3>
                                        <p className="text-sm text-[#3C78A8] font-semibold">Jeder Tag ist eine neue Chance! Plane morgen und bleib dran.</p>

                                        {/* Empty: progress + mascot side-by-side */}
                                        <div className="flex items-center gap-5 bg-[#F3FBFF] rounded-2xl p-4 border border-[#CCE4F0]/30">
                                            <div className="relative flex-shrink-0">
                                                <ProgressRing progress={0} size={100} strokeWidth={10} />
                                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                                    <span className="text-xl font-black text-[#3C78A8]">0%</span>
                                                    <span className="text-[8px] font-black text-[#3C78A8] uppercase tracking-wider">FORTSCHRITT<br/>HEUTE</span>
                                                </div>
                                            </div>
                                            <div className="flex-1 flex items-center gap-3">
                                                <div className="w-20 h-20 relative flex-shrink-0">
                                                    <Image src={FUXIE_MASCOT_STATES.calmEmpty} alt="Fuxie" fill className="object-contain" />
                                                </div>
                                                <div>
                                                    <div className="bg-white border border-[#CCE4F0] rounded-xl px-3 py-2 shadow-sm inline-flex items-center gap-1.5">
                                                        <span className="text-base">📅</span>
                                                        <span className="text-xs font-black text-[#173b56]">Plane morgen!</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <PrimaryCta
                                            onClick={() => router.push('/onboarding')}
                                            className="w-full rounded-2xl text-base font-black"
                                        >
                                            Plan tomorrow →
                                        </PrimaryCta>
                                    </div>
                                ) : (
                                    <div className="flex flex-col gap-4">
                                        {/* Greeting */}
                                        <div className="flex items-center gap-1.5">
                                            <span>☀️</span>
                                            <p className="text-sm font-bold text-[#3C78A8]">Guten Morgen, Fuxie Explorer!</p>
                                        </div>

                                        {/* Progress ring + NEXT lesson */}
                                        <div className="flex items-start gap-4">
                                            {/* Large ring */}
                                            <div className="relative flex-shrink-0">
                                                <ProgressRing progress={progressPercent} size={140} strokeWidth={13} />
                                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                                    <span className="text-4xl font-black text-[#173b56]">{progressPercent}%</span>
                                                    <span className="text-[9px] font-black text-[#3C78A8] uppercase tracking-widest">TODAY</span>
                                                </div>
                                            </div>

                                            {/* Right: next lesson card */}
                                            <div className="flex-1 flex flex-col gap-3 justify-center pt-1">
                                                <div className="bg-[#F3FBFF] rounded-2xl p-4 border border-[#CCE4F0]/40 flex items-center gap-3">
                                                    <div>
                                                        <span className="inline-block bg-[#2E7EC4] text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">NEXT</span>
                                                        <h4 className="font-black text-sm text-[#173b56] mt-1 leading-tight">
                                                            {data.todayPlan?.actions?.[0]?.title || 'Wörtersession A1'}
                                                        </h4>
                                                        <p className="text-[11px] text-[#3C78A8] font-semibold mt-0.5">
                                                            {data.todayPlan?.actions?.[0]?.reason || 'Basics · 15 min'}
                                                        </p>
                                                    </div>
                                                    <div className="w-12 h-12 relative flex-shrink-0 ml-auto">
                                                        <Image src={FUXIE_WORLD_PROPS.marketStall} alt="lesson" fill className="object-contain" />
                                                    </div>
                                                </div>

                                                {/* START button */}
                                                <PrimaryCta
                                                    onClick={handleStartSession}
                                                    className="group w-full rounded-2xl py-4 text-xl font-black"
                                                >
                                                    <span>START</span>
                                                    <span className="group-hover:translate-x-1 transition-transform">→</span>
                                                </PrimaryCta>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </section>

                            {/* Stats row: XP / STREAK / GOAL */}
                            <div className="grid grid-cols-3 gap-3">
                                {isEmpty ? (
                                    <>
                                        <StatCard emoji="⭐" value="0" label="XP HEUTE" color="#FFB703" note="Los geht's!" />
                                        <StatCard emoji="🔥" value={String(currentStreak)} label="TAGE STREAK" color="#FF6B35" note="Großartig!" />
                                        <StatCard emoji="🎯" value="ZIEL" label="BEREIT" color="#2EC4B6" note="Wähle eine Lektion!" />
                                    </>
                                ) : (
                                    <>
                                        <StatCard emoji="⭐" value={String(totalXp)} label="XP" color="#FFB703" barFill={`${Math.min(100, (totalXp % 1000) / 10)}%`} />
                                        <StatCard emoji="🔥" value={String(currentStreak)} label="STREAK" color="#FF6B35" barFill={`${Math.min(100, Math.round((currentStreak / Math.max(1, data.streak.longestStreak)) * 100))}%`} />
                                        <StatCard emoji="🎯" value={`${xpEarned}/${xpGoal}`} label="GOAL" color="#2EC4B6" barFill={`${progressPercent}%`} />
                                    </>
                                )}
                            </div>

                            {/* Mascot encouragement strip */}
                            <section className="bg-[#EAF6FF] rounded-2xl p-4 border border-[#CCE4F0]/40 flex items-center gap-3 relative overflow-hidden">
                                <div className="w-14 h-14 relative flex-shrink-0">
                                    <Image src={FUXIE_MASCOT_STATES.wave} alt="Fuxie mascot" fill className="object-contain" />
                                </div>
                                {isEmpty ? (
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-black text-[#173b56]">Tipp des Tages</p>
                                        <p className="text-[11px] font-semibold text-[#3C78A8] mt-0.5 leading-snug">
                                            Schon 10 Minuten Lernen machen einen großen Unterschied. Du schaffst das! 💙
                                        </p>
                                        <div className="flex gap-2 mt-2">
                                            <button className="px-2.5 py-1 bg-white border border-[#CCE4F0] rounded-lg text-[9px] font-black text-[#2E7EC4]">Wörter</button>
                                            <button className="px-2.5 py-1 bg-white border border-[#CCE4F0] rounded-lg text-[9px] font-black text-[#2E7EC4]">Hören</button>
                                            <button className="px-2.5 py-1 bg-white border border-[#CCE4F0] rounded-lg text-[9px] font-black text-[#2E7EC4]">Sprechen</button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-black text-[#173b56]">Keep it up!</p>
                                        <p className="text-[11px] font-semibold text-[#3C78A8] mt-0.5 leading-snug">
                                            Consistency today, fluency tomorrow.
                                        </p>
                                    </div>
                                )}
                                <div className="w-10 h-10 bg-white rounded-full shadow-inner border border-[#CCE4F0]/30 flex items-center justify-center text-lg flex-shrink-0">⭐</div>
                            </section>
                        </div>
                    </div>
                </div>

                {/* ═══════════════════════════════════════════════
                    RIGHT SIDE: FULL-BLEED ISOMETRIC GAME BOARD
                    (Desktop only — fills remaining space)
                ═══════════════════════════════════════════════ */}
                <div className="hidden lg:flex flex-1 relative overflow-hidden">
                    {/* Sky gradient background */}
                    <div className="absolute inset-0 bg-gradient-to-b from-[#87CEEB] via-[#5BB8F5] to-[#3E9FD4]" />

                    {/* Full-bleed village image */}
                    <div className="absolute inset-0">
                        <Image
                            src={FUXIE_WORLD_PROPS.villageSquare}
                            alt="Fuxie interactive village"
                            fill
                            className="object-cover object-bottom"
                            priority
                        />
                    </div>

                    {/* Soft gradient at left edge to blend with the white left panel */}
                    <div className="absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-white/20 to-transparent pointer-events-none" />

                    {/* Top overlay to show sky */}
                    <div className="absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-[#87CEEB]/60 to-transparent pointer-events-none" />

                    {/* YOUR PATH overlay card */}
                    <div className="absolute top-6 left-8 bg-white/90 backdrop-blur-md rounded-2xl px-4 py-3 shadow-xl border border-white/50 z-10">
                        <p className="text-[9px] font-black uppercase text-[#3C78A8] tracking-widest mb-1">YOUR PATH</p>
                        <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-[#2EC4B6] text-white text-[9px] font-black flex items-center justify-center shadow">{data.profile.currentLevel}</span>
                            <div className="flex items-center gap-1">
                                <div className="w-5 h-1 bg-[#2EC4B6] rounded-full" />
                                <div className="w-3 h-3 rounded-full bg-[#2E7EC4] border-2 border-white shadow" />
                                <div className="w-5 h-1 bg-[#CCE4F0]/60 rounded-full" />
                                <div className="w-2.5 h-2.5 rounded-full bg-white/60 border border-white/40" />
                                <div className="w-5 h-1 bg-[#CCE4F0]/60 rounded-full" />
                            </div>
                            <span className="text-base">🏁</span>
                        </div>
                    </div>

                    {/* COURSES hotspot */}
                    <div className="absolute top-[18%] right-[14%] z-10">
                        <Link href="/course" className="flex flex-col items-center gap-1 group">
                            <div className="bg-[#2EC4B6] text-white text-[10px] font-black px-3 py-1 rounded-full shadow-xl border-2 border-white group-hover:-translate-y-0.5 transition-transform">
                                COURSES
                            </div>
                            <div className="w-10 h-10 rounded-full bg-white/25 border-2 border-white/50 backdrop-blur-sm animate-pulse" />
                        </Link>
                    </div>

                    {/* MISSIONS board */}
                    <div className="absolute top-[38%] right-[3%] z-10">
                        <div className="bg-white/95 backdrop-blur-md rounded-2xl p-4 shadow-2xl border border-[#CCE4F0] w-52">
                            <p className="text-[9px] font-black uppercase text-[#3C78A8] tracking-widest border-b border-[#CCE4F0]/50 pb-1.5 mb-2">MISSIONS</p>
                            <ul className="flex flex-col gap-1.5">
                                {data.missionBoard?.missions && data.missionBoard.missions.length > 0 ? (
                                    data.missionBoard.missions.slice(0, 3).map((m) => {
                                        const isCompleted = m.status === 'claimed' || m.status === 'claimable'
                                        const isHalf = !isCompleted && m.currentValue > 0
                                        return (
                                            <li key={m.id} className="flex items-center gap-2 text-[10px] font-bold text-[#173b56]">
                                                {isCompleted ? (
                                                    <span className="w-4 h-4 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-[8px] shrink-0">✓</span>
                                                ) : isHalf ? (
                                                    <span className="w-4 h-4 rounded-full bg-[#FFF9E6] border border-[#FFB703]/30 flex items-center justify-center text-[8px] text-[#FFB703] shrink-0">◐</span>
                                                ) : (
                                                    <span className="w-4 h-4 rounded-full bg-[#F3FBFF] border border-[#CCE4F0] flex items-center justify-center text-[7px] text-gray-400 shrink-0">○</span>
                                                )}
                                                <span className="truncate flex-1" title={m.title}>{m.title}</span>
                                                <span className="ml-auto text-[#3C78A8] shrink-0">{m.currentValue}/{m.targetValue}</span>
                                            </li>
                                        )
                                    })
                                ) : (
                                    <li className="text-[10px] text-gray-400 font-bold text-center py-2">Noch keine Missionen</li>
                                )}
                            </ul>
                        </div>
                    </div>

                    {/* REVIEW hotspot */}
                    <div className="absolute bottom-[28%] right-[22%] z-10 flex flex-col items-center gap-1">
                        <div className="bg-[#7F56D9] text-white text-[10px] font-black px-3 py-1 rounded-full shadow-xl border-2 border-white">REVIEW</div>
                        <div className="w-8 h-8 rounded-full bg-white/25 border-2 border-white/50 backdrop-blur-sm" />
                    </div>

                    {/* REWARDS hotspot */}
                    <div className="absolute bottom-[8%] right-[10%] z-10 flex flex-col items-center gap-1">
                        <Link href="/shop" className="flex flex-col items-center gap-1 group">
                            <div className="bg-[#FFB703] text-white text-[10px] font-black px-3 py-1 rounded-full shadow-xl border-2 border-white group-hover:-translate-y-0.5 transition-transform">REWARDS</div>
                            <div className="w-8 h-8 rounded-full bg-white/25 border-2 border-white/50 backdrop-blur-sm" />
                        </Link>
                    </div>

                    {/* CHAT hotspot */}
                    <div className="absolute bottom-[22%] left-[18%] z-10 flex flex-col items-center gap-1">
                        <div className="bg-[#2EC4B6] text-white text-[10px] font-black px-3 py-1 rounded-full shadow-xl border-2 border-white">CHAT</div>
                        <div className="w-10 h-10 rounded-full bg-white/25 border-2 border-white/50 backdrop-blur-sm" />
                    </div>

                    {/* Center bouncing mascot */}
                    <div className="absolute top-[48%] left-[40%] -translate-x-1/2 z-10 pointer-events-none">
                        <div className="w-14 h-14 relative animate-bounce" style={{ animationDuration: '3s' }}>
                            <Image src={FUXIE_MASCOT_STATES.wave} alt="Fuxie" fill className="object-contain drop-shadow-xl" />
                        </div>
                    </div>

                    {/* Bottom tabs strip */}
                    <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-10 bg-white/90 backdrop-blur-md px-6 py-2.5 rounded-full border border-white/50 shadow-2xl flex items-center gap-5 whitespace-nowrap">
                        {[
                            { emoji: '💙', label: 'Learn', sub: 'Build knowledge' },
                            { emoji: '👁️', label: 'Play', sub: 'Enjoy the journey' },
                            { emoji: '⭐', label: 'Grow', sub: 'Become fluent' },
                        ].map(({ emoji, label, sub }, i) => (
                            <React.Fragment key={label}>
                                {i > 0 && <div className="w-px h-5 bg-gray-200" />}
                                <div className="flex items-center gap-1.5 cursor-pointer hover:opacity-80 transition-opacity">
                                    <span className="text-sm">{emoji}</span>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black text-[#173b56]">{label}</span>
                                        <span className="text-[8px] text-[#3C78A8]">{sub}</span>
                                    </div>
                                </div>
                            </React.Fragment>
                        ))}
                    </div>
                </div>
            </div>

            {/* MOBILE BOTTOM NAV */}
            <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-[#CCE4F0]/60 flex items-center justify-around px-2 z-50 shadow-lg">
                <button onClick={() => setActiveTab('home')} className={`flex flex-col items-center gap-0.5 min-w-[44px] ${activeTab === 'home' ? 'text-[#2E7EC4]' : 'text-gray-400'}`}>
                    <Home className="w-5 h-5" />
                    <span className="text-[8px] font-black">Home</span>
                </button>
                <button onClick={() => router.push('/course')} className="flex flex-col items-center gap-0.5 text-gray-400 min-w-[44px]">
                    <BookOpen className="w-5 h-5" />
                    <span className="text-[8px] font-black">Kurse</span>
                </button>
                <button className="w-12 h-12 bg-[#2E7EC4] text-white rounded-full flex items-center justify-center shadow-lg -translate-y-3 border-4 border-white hover:scale-105 active:scale-95 transition-transform">
                    <Plus className="w-6 h-6" />
                </button>
                <button className="flex flex-col items-center gap-0.5 text-gray-400 min-w-[44px]">
                    <Trophy className="w-5 h-5" />
                    <span className="text-[8px] font-black">Ranking</span>
                </button>
                <button className="flex flex-col items-center gap-0.5 text-gray-400 min-w-[44px]">
                    <Settings className="w-5 h-5" />
                    <span className="text-[8px] font-black">Profil</span>
                </button>
            </nav>
        </div>
    )
}

// ─────────────────────────────────────────────────────────
// Subcomponents
// ─────────────────────────────────────────────────────────

function StatCard({
    emoji, value, label, color, barFill, note,
}: {
    emoji: string
    value: string
    label: string
    color: string
    barFill?: string
    note?: string
}) {
    return (
        <div className="bg-white rounded-2xl p-4 border border-[#CCE4F0]/40 shadow-sm flex flex-col items-center text-center justify-center gap-1 hover:scale-[1.02] transition-transform">
            <span className="text-2xl">{emoji}</span>
            <span className="text-base font-black text-[#173b56] leading-none">{value}</span>
            <span className="text-[9px] font-black text-[#3C78A8] uppercase tracking-wider">{label}</span>
            {barFill && (
                <div className="w-10 h-1 bg-[#CCE4F0]/50 rounded-full mt-1 overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: barFill, backgroundColor: color }} />
                </div>
            )}
            {note && <span className="text-[9px] font-bold mt-0.5" style={{ color }}>{note}</span>}
        </div>
    )
}

function ProgressRing({ progress, size = 64, strokeWidth = 6 }: { progress: number; size?: number; strokeWidth?: number }) {
    const radius = (size - strokeWidth) / 2
    const circumference = radius * 2 * Math.PI
    const offset = circumference - (Math.min(100, Math.max(0, progress)) / 100) * circumference

    return (
        <svg width={size} height={size} className="transform -rotate-90">
            <circle cx={size / 2} cy={size / 2} r={radius} stroke="#CCE4F0" strokeWidth={strokeWidth} fill="none" />
            <circle
                cx={size / 2} cy={size / 2} r={radius}
                stroke="url(#progressGrad)"
                strokeWidth={strokeWidth} fill="none"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                strokeLinecap="round"
                className="transition-all duration-700 ease-out"
            />
            <defs>
                <linearGradient id="progressGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#2EC4B6" />
                    <stop offset="100%" stopColor="#60A8E4" />
                </linearGradient>
            </defs>
        </svg>
    )
}
