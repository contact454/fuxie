'use client'

import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { Home, BookOpen, Target, Headphones, Pencil, MessageSquare, Trophy, LogOut } from 'lucide-react'
import { FUXIE_WORLD_PROPS, FUXIE_MASCOT_STATES } from '@/lib/mascot/fuxie-assets'
import { PrimaryCta } from '@/components/ui/primary-cta'
import type { ExerciseResult } from '@/lib/session/types'

export function SessionResultScreen({
    score,
    hearts: _hearts,
    total,
    saving,
    onFinish,
    results = [],
}: {
    score: number
    hearts: number
    total: number
    saving: boolean
    onFinish: () => void
    results?: ExerciseResult[]
}) {
    const t = useTranslations('UI')
    const evaluatedResults = results.filter(r => r.correct !== undefined)
    const correctCount = evaluatedResults.filter(r => r.correct).length
    const totalEvaluated = evaluatedResults.length
    const accuracy = totalEvaluated > 0 ? Math.round((correctCount / totalEvaluated) * 100) : 100

    const isPerfect = accuracy >= 80
    const mascotImg = isPerfect ? FUXIE_MASCOT_STATES.resultCelebration : FUXIE_MASCOT_STATES.gentleCorrection

    const vocabResults = results.filter(r => r.type === 'VOCAB_NEW' || r.type === 'VOCAB_REVIEW')
    const words = vocabResults.length > 0 ? vocabResults.length : total

    return (
        <div
            data-role="session-success-state"
            data-slice="slice-1"
            data-module="03-session"
            data-visual-state="success"
            className="min-h-screen bg-[#5BB8F5] font-sans text-[#173b56] flex flex-col"
        >

            {/* ═══════════════════════════════════════════════
                TOP HEADER — matches mock-state: FUXIE DASHBOARD with full XP stats
            ═══════════════════════════════════════════════ */}
            <header className="bg-white border-b border-[#CCE4F0]/60 px-5 py-3 flex items-center justify-between sticky top-0 z-30 shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="bg-[#2E7EC4] text-white rounded-xl px-3 py-1.5 shadow flex items-center gap-1.5">
                        <span className="text-base font-black tracking-widest">
                            <span className="text-[#FFD700]">FU</span><span>XiE</span>
                        </span>
                        <span className="text-[#FFD700] text-sm">⭐</span>
                    </div>
                    <div className="hidden sm:block h-5 w-px bg-[#CCE4F0]" />
                    <div className="hidden sm:flex flex-col">
                        <span className="text-[10px] font-black text-[#3C78A8] uppercase tracking-widest">DASHBOARD</span>
                    </div>
                </div>

                <div className="hidden lg:flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full overflow-hidden bg-[#F3FBFF] border-2 border-[#2EC4B6]">
                        <Image src={FUXIE_MASCOT_STATES.avatar} alt="avatar" width={32} height={32} className="object-contain" />
                    </div>
                    <span className="bg-[#2EC4B6] text-white text-[10px] font-black px-2.5 py-1 rounded-full">A1</span>
                    <div className="flex flex-col w-36">
                        <div className="flex justify-between text-[8px] font-bold text-[#3C78A8]">
                            <span>Session abgeschlossen</span>
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

                <button
                    onClick={onFinish}
                    className="p-2 bg-white hover:bg-gray-50 rounded-full shadow-sm border border-[#CCE4F0]/60 text-gray-500 hover:text-gray-800 transition"
                    title="Back to dashboard"
                >
                    <LogOut className="w-4 h-4" />
                </button>
            </header>

            {/* ═══════════════════════════════════════════════
                MAIN CONTENT
            ═══════════════════════════════════════════════ */}
            <div className="flex-1 flex flex-col lg:flex-row bg-white overflow-hidden">

                {/* ── LEFT: VERTICAL NAV + SUCCESS CENTER ── */}
                <div className="hidden lg:flex flex-row flex-shrink-0">
                    {/* Vertical icon nav */}
                    <nav className="w-[72px] bg-[#2E7EC4] flex flex-col items-center gap-1 py-4 flex-shrink-0">
                        {[
                            { icon: <Home className="w-5 h-5" />, label: 'Übersicht' },
                            { icon: <BookOpen className="w-5 h-5" />, label: 'Lernen' },
                            { icon: <Target className="w-5 h-5" />, label: 'Ziele' },
                            { icon: <Headphones className="w-5 h-5" />, label: 'Hören' },
                            { icon: <Pencil className="w-5 h-5" />, label: 'Schreiben' },
                            { icon: <MessageSquare className="w-5 h-5" />, label: 'Sprechen' },
                            { icon: <Trophy className="w-5 h-5" />, label: 'Belohnungen' },
                        ].map(({ icon, label }) => (
                            <button key={label} title={label} className="flex flex-col items-center gap-0.5 w-full py-2 px-1 text-white/60 hover:bg-white/10 hover:text-white transition-all">
                                {icon}
                                <span className="text-[7px] font-bold">{label}</span>
                            </button>
                        ))}
                    </nav>
                </div>

                {/* ── CENTER: SUCCESS CONTENT ── */}
                <div className="flex-1 flex flex-col overflow-y-auto">
                    {/* Mobile village banner */}
                    <div className="lg:hidden relative w-full h-[180px] overflow-hidden flex-shrink-0">
                        <div className="absolute inset-0 bg-gradient-to-b from-[#87CEEB] to-[#5BB8F5]" />
                        <Image src={FUXIE_WORLD_PROPS.villageSquare} alt="village" fill className="object-cover object-bottom" priority />
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white/30 pointer-events-none" />
                        {/* Mascot on mobile */}
                        <div className="absolute bottom-0 right-4 w-20 h-20 relative">
                            <Image src={mascotImg} alt="Fuxie" fill className="object-contain drop-shadow-lg" />
                        </div>
                    </div>

                    <div className="flex-1 p-5 md:p-8 flex flex-col gap-5 max-w-2xl mx-auto w-full">
                        {/* Session context */}
                        <div>
                            <p className="text-[10px] font-black text-[#3C78A8] uppercase tracking-widest">03 · WÖRTERSESSION A1</p>
                            <h2 className="text-3xl lg:text-4xl font-black text-[#173b56] mt-1 leading-tight">
                                Lektion geschafft!
                            </h2>
                            <p className="text-sm font-semibold text-[#3C78A8] mt-1 leading-snug">
                                Großartig! Du hast deine Session erfolgreich abgeschlossen.<br />
                                Weiter so, du machst das super!
                            </p>
                        </div>

                        {/* Big checkmark badge + mascot side-by-side */}
                        <div className="flex items-center justify-center gap-4">
                            {/* Circular checkmark badge */}
                            <div className="relative flex-shrink-0">
                                {/* Confetti emojis */}
                                <span className="absolute -top-3 -left-4 text-2xl animate-bounce" style={{ animationDelay: '0.1s' }}>🎉</span>
                                <span className="absolute -top-3 right-0 text-xl animate-bounce" style={{ animationDelay: '0.4s' }}>✨</span>
                                <span className="absolute bottom-0 -left-3 text-xl animate-bounce" style={{ animationDelay: '0.7s' }}>⭐</span>
                                <span className="absolute -bottom-2 right-0 text-xl animate-bounce" style={{ animationDelay: '1.0s' }}>🎈</span>

                                {/* Circle badge */}
                                <div className="w-28 h-28 bg-[#2EC4B6] rounded-full flex flex-col items-center justify-center shadow-2xl shadow-[#2EC4B6]/40 border-4 border-white relative">
                                    <span className="text-5xl">✓</span>
                                    <div className="absolute -bottom-3 bg-[#2EC4B6] text-white text-[9px] font-black px-3 py-1 rounded-full border-2 border-white shadow-lg whitespace-nowrap">
                                        {total}/{total} Schritte abgeschlossen
                                    </div>
                                </div>
                            </div>

                            {/* Large mascot */}
                            <div className="w-36 h-36 relative drop-shadow-xl hidden sm:block">
                                <Image src={mascotImg} alt="Celebration mascot" fill className="object-contain" priority />
                            </div>
                        </div>

                        {/* 2×2 stat cards grid — matches mock */}
                        <div className="grid grid-cols-2 gap-3 mt-2">
                            {/* +XP */}
                            <div className="bg-white rounded-2xl p-4 border border-[#CCE4F0]/40 shadow-md flex flex-col gap-1">
                                <div className="flex items-center gap-2">
                                    <span className="text-2xl">⭐</span>
                                    <div>
                                        <span className="text-[10px] font-black text-[#3C78A8] uppercase tracking-wide block">VERDIENT</span>
                                        <span className="text-2xl font-black text-[#173b56]">+{score} XP</span>
                                    </div>
                                </div>
                                <div className="h-1.5 bg-[#CCE4F0]/40 rounded-full overflow-hidden mt-1">
                                    <div className="h-full bg-[#FFB703] rounded-full w-full" />
                                </div>
                                <span className="text-[9px] font-bold text-[#3C78A8]">Session abgeschlossen</span>
                            </div>

                            {/* Words */}
                            <div className="bg-white rounded-2xl p-4 border border-[#CCE4F0]/40 shadow-md flex flex-col gap-1">
                                <div className="flex items-center gap-2">
                                    <span className="text-2xl">📖</span>
                                    <div>
                                        <span className="text-[10px] font-black text-[#3C78A8] uppercase tracking-wide block">WÖRTER GEÜBT</span>
                                        <span className="text-2xl font-black text-[#173b56]">{words}</span>
                                    </div>
                                </div>
                                <div className="h-1.5 bg-[#CCE4F0]/40 rounded-full overflow-hidden mt-1">
                                    <div className="h-full bg-[#2EC4B6] rounded-full w-full" />
                                </div>
                                <span className="text-[9px] font-bold text-[#2EC4B6]">Prima Arbeit!</span>
                            </div>

                            {/* Accuracy */}
                            <div className="bg-white rounded-2xl p-4 border border-[#CCE4F0]/40 shadow-md flex flex-col gap-1">
                                <div className="flex items-center gap-2">
                                    <span className="text-2xl">🎯</span>
                                    <div>
                                        <span className="text-[10px] font-black text-[#3C78A8] uppercase tracking-wide block">GENAUIGKEIT</span>
                                        <span className="text-2xl font-black text-[#173b56]">{accuracy}%</span>
                                    </div>
                                </div>
                                <div className="h-1.5 bg-[#CCE4F0]/40 rounded-full overflow-hidden mt-1">
                                    <div className="h-full bg-[#2EC4B6] rounded-full" style={{ width: `${accuracy}%` }} />
                                </div>
                                <span className="text-[9px] font-bold text-[#2EC4B6]">Sehr gut!</span>
                            </div>

                            {/* Streak */}
                            <div className="bg-white rounded-2xl p-4 border border-[#CCE4F0]/40 shadow-md flex flex-col gap-1">
                                <div className="flex items-center gap-2">
                                    <span className="text-2xl">🔥</span>
                                    <div>
                                        <span className="text-[10px] font-black text-[#3C78A8] uppercase tracking-wide block">STREAK STATUS</span>
                                        <span className="text-base font-black text-[#173b56]">Heute bereit</span>
                                    </div>
                                </div>
                                <div className="h-1.5 bg-[#CCE4F0]/40 rounded-full overflow-hidden mt-1">
                                    <div className="h-full bg-[#FF6B35] rounded-full w-full" />
                                </div>
                                <div className="flex items-center gap-1">
                                    <span className="text-[9px] font-bold text-[#FF6B35]">Aktiv</span>
                                    <span className="text-[9px]">✓</span>
                                </div>
                            </div>
                        </div>

                        {/* Primary CTA */}
                        <PrimaryCta
                            onClick={onFinish}
                            disabled={saving}
                            className="w-full rounded-2xl bg-[#2EC4B6] py-4 text-xl font-black shadow-lg shadow-[#2EC4B6]/30 hover:bg-[#25b5a7]"
                        >
                            <span>{saving ? t('saving') : 'Ergebnisse ansehen'}</span>
                            <span>→</span>
                        </PrimaryCta>

                        {/* Back link */}
                        <button
                            onClick={onFinish}
                            className="text-center text-sm font-bold text-[#3C78A8] hover:text-[#2E7EC4] transition-colors"
                        >
                            ← Zurück zum Dashboard
                        </button>
                    </div>

                    {/* Bottom tip strip */}
                    <div className="flex-shrink-0 bg-[#EAF6FF] border-t border-[#CCE4F0]/40 px-5 py-3 flex items-center gap-4">
                        <div className="w-10 h-10 relative flex-shrink-0">
                            <Image src={FUXIE_MASCOT_STATES.wave} alt="Fuxie" fill className="object-contain" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 mb-0.5">
                                <span>💡</span>
                                <span className="text-[10px] font-black text-[#173b56]">Tipp von Fuxie</span>
                            </div>
                            <p className="text-[10px] font-semibold text-[#3C78A8] leading-snug">
                                Regelmäßiges Wiederholen hilft dir, neue Wörter langfristig zu behalten. Mach morgen weiter – jede kleine Session bringt dich voran! 💙
                            </p>
                        </div>
                        <div className="flex-shrink-0 bg-white rounded-xl px-3 py-2 border border-[#CCE4F0]/50 shadow-sm flex items-center gap-2">
                            <span className="text-lg">📅</span>
                            <div className="flex flex-col">
                                <span className="text-[9px] font-black text-[#173b56]">Nächste Session planen</span>
                                <span className="text-[8px] font-semibold text-[#3C78A8]">Morgen ist ein neuer Tag!</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── RIGHT: FULL-BLEED VILLAGE MAP ── */}
                <div className="hidden lg:flex w-[400px] xl:w-[480px] flex-shrink-0 relative overflow-hidden border-l border-[#CCE4F0]/30">
                    {/* Sky gradient */}
                    <div className="absolute inset-0 bg-gradient-to-b from-[#87CEEB] via-[#5BB8F5] to-[#3E9FD4]" />
                    <div className="absolute inset-0">
                        <Image
                            src={FUXIE_WORLD_PROPS.villageSquare}
                            alt="Village map"
                            fill
                            className="object-cover object-bottom"
                            priority
                        />
                    </div>

                    {/* DEIN WEG card (completed) */}
                    <div className="absolute top-4 left-4 right-4 bg-white/90 backdrop-blur-md rounded-2xl px-4 py-3 shadow-xl border border-white/50 z-10">
                        <p className="text-[9px] font-black uppercase text-[#3C78A8] tracking-widest mb-1.5">DEIN WEG</p>
                        <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-[#2EC4B6] text-white text-[9px] font-black flex items-center justify-center shadow">A1</span>
                            <div className="flex-1 h-1.5 bg-[#2EC4B6] rounded-full" />
                            <div className="w-3 h-3 rounded-full bg-[#2EC4B6] border-2 border-white shadow flex items-center justify-center">
                                <span className="text-[6px] text-white font-black">✓</span>
                            </div>
                            <div className="w-6 h-1.5 bg-[#2EC4B6] rounded-full" />
                            <span className="text-sm">🏁</span>
                        </div>
                    </div>

                    {/* Building labels */}
                    <div className="absolute top-[20%] left-[10%] z-10">
                        <div className="bg-[#FFB703] text-white text-[9px] font-black px-2.5 py-0.5 rounded-full shadow-lg border border-white">WÖRTER</div>
                    </div>
                    <div className="absolute top-[18%] right-[14%] z-10">
                        <div className="bg-[#2E7EC4] text-white text-[9px] font-black px-2.5 py-0.5 rounded-full shadow-lg border border-white">KURSE</div>
                    </div>
                    <div className="absolute top-[42%] right-[3%] z-10">
                        <div className="bg-white/95 backdrop-blur-md rounded-xl p-3 shadow-xl border border-[#CCE4F0] w-44">
                            <p className="text-[8px] font-black uppercase text-[#3C78A8] tracking-widest border-b border-[#CCE4F0]/50 pb-1 mb-1.5">SESSION STATISTIKEN</p>
                            <ul className="flex flex-col gap-1">
                                <li className="flex items-center gap-1.5 text-[9px] font-bold text-[#173b56]">
                                    <span className="w-3.5 h-3.5 bg-green-100 rounded-full text-green-600 flex items-center justify-center text-[7px] shrink-0">✓</span>
                                    <span>Session beendet</span> <span className="ml-auto">1/1</span>
                                </li>
                                <li className="flex items-center gap-1.5 text-[9px] font-bold text-[#173b56]">
                                    <span className="w-3.5 h-3.5 bg-green-100 rounded-full text-green-600 flex items-center justify-center text-[7px] shrink-0">✓</span>
                                    <span>Wörter geübt</span> <span className="ml-auto">{words}/{words}</span>
                                </li>
                                <li className="flex items-center gap-1.5 text-[9px] font-bold text-[#173b56]">
                                    <span className="w-3.5 h-3.5 bg-green-100 rounded-full text-green-600 flex items-center justify-center text-[7px] shrink-0">✓</span>
                                    <span>Richtig</span> <span className="ml-auto">{correctCount}/{totalEvaluated}</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                    <div className="absolute bottom-[28%] left-[10%] z-10">
                        <div className="bg-[#FFB703] text-white text-[9px] font-black px-2.5 py-0.5 rounded-full shadow-lg border border-white">VOKABELN</div>
                    </div>
                    <div className="absolute bottom-[10%] right-[12%] z-10">
                        <div className="bg-[#FFB703] text-white text-[9px] font-black px-2.5 py-0.5 rounded-full shadow-lg border border-white">REWARDS</div>
                    </div>
                </div>
            </div>
        </div>
    )
}
