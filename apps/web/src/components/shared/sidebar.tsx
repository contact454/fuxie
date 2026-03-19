'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'

const navItems = [
    { href: '/dashboard', label: 'Dashboard', labelDe: 'Übersicht', icon: '/mascot/state/fuxie-state-welcome.png' },
    { href: '/course', label: 'Khóa học', labelDe: 'Kurs', icon: '/mascot/learn/fuxie-learn-studying.png' },
    { href: '/vocabulary', label: 'Từ vựng', labelDe: 'Wortschatz', icon: '/mascot/skill/fuxie-skill-wortschatz.png' },
    { href: '/grammar', label: 'Ngữ pháp', labelDe: 'Grammatik', icon: '/mascot/skill/fuxie-skill-grammatik.png' },
    { href: '/reading', label: 'Đọc', labelDe: 'Lesen', icon: '/mascot/skill/fuxie-skill-lesen.png' },
    { href: '/listening', label: 'Nghe', labelDe: 'Hören', icon: '/mascot/skill/fuxie-skill-hoeren.png' },
    { href: '/writing', label: 'Viết', labelDe: 'Schreiben', icon: '/mascot/skill/fuxie-skill-schreiben.png' },
    { href: '/speaking', label: 'Nói', labelDe: 'Sprechen', icon: '/mascot/skill/fuxie-skill-sprechen.png' },
    { href: '/exam', label: 'Thi thử', labelDe: 'Prüfung', icon: '/mascot/learn/fuxie-learn-graduation.png' },
    { href: '/review', label: 'Ôn tập SRS', labelDe: 'Wiederholen', icon: '/mascot/learn/fuxie-learn-studying.png' },
]

interface SidebarProps {
    dailyGoal?: {
        currentMinutes: number
        goalMinutes: number
        xpEarned: number
    }
}

export function Sidebar({ dailyGoal }: SidebarProps) {
    const pathname = usePathname()

    const goalPercent = dailyGoal && dailyGoal.goalMinutes > 0
        ? Math.min(100, Math.round((dailyGoal.currentMinutes / dailyGoal.goalMinutes) * 100))
        : 0
    const goalReached = goalPercent >= 100

    return (
        <aside className="flex h-screen w-64 flex-col border-r border-gray-200/80 bg-white/95 backdrop-blur-sm">
            {/* Logo — Fuxie mascot */}
            <div className="flex items-center gap-2.5 border-b border-gray-100 px-6 py-5">
                <Image
                    src="/mascot/core/fuxie-core-happy-wave.png"
                    alt="Fuxie"
                    width={36}
                    height={36}
                    className="object-contain"
                />
                <span className="text-xl font-bold bg-gradient-to-r from-[#FF6B35] to-[#004E89] bg-clip-text text-transparent">
                    Fuxie
                </span>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto px-3 py-4">
                <ul className="space-y-0.5">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href
                        return (
                            <li key={item.href}>
                                <Link
                                    href={item.href}
                                    className={`flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200
                                        ${isActive
                                            ? 'bg-gradient-to-r from-[#FF6B35]/10 to-[#FF6B35]/5 text-[#FF6B35] shadow-sm'
                                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                        }`}
                                >
                                    <Image
                                        src={item.icon}
                                        alt={item.labelDe}
                                        width={28}
                                        height={28}
                                        className="object-contain shrink-0"
                                    />
                                    <div className="flex flex-col">
                                        <span>{item.labelDe}</span>
                                        <span className={`text-[10px] ${isActive ? 'text-[#FF6B35]/60' : 'text-gray-400'}`}>
                                            {item.label}
                                        </span>
                                    </div>
                                </Link>
                            </li>
                        )
                    })}
                </ul>
            </nav>

            {/* Daily Goal Progress */}
            <div className="border-t border-gray-100 px-4 py-4">
                <div className={`rounded-xl p-3 transition-all ${goalReached
                    ? 'bg-gradient-to-r from-green-50 to-emerald-50 ring-1 ring-green-200/50'
                    : 'bg-gradient-to-r from-[#FF6B35]/5 to-[#2EC4B6]/5'
                    }`}>
                    <div className="flex items-center justify-between mb-1.5">
                        <p className="text-xs font-semibold text-gray-600">
                            {goalReached ? '✅ Tagesziel erreicht!' : 'Tagesziel'}
                        </p>
                        {dailyGoal && (
                            <p className="text-[10px] font-medium text-gray-400">
                                +{dailyGoal.xpEarned} XP
                            </p>
                        )}
                    </div>
                    <div className="h-2 w-full rounded-full bg-gray-200/60">
                        <div
                            className={`h-2 rounded-full transition-all duration-700 ${goalReached ? 'bg-green-500' : 'bg-gradient-to-r from-[#FF6B35] to-[#2EC4B6]'
                                }`}
                            style={{ width: `${goalPercent}%` }}
                        />
                    </div>
                    <p className="mt-1 text-[10px] text-gray-400">
                        {dailyGoal
                            ? `${dailyGoal.currentMinutes} / ${dailyGoal.goalMinutes} Minuten`
                            : '0 / 15 Minuten'
                        }
                    </p>
                </div>
            </div>
        </aside>
    )
}
