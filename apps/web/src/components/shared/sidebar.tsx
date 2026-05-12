'use client'

import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { MeasuredLink } from '@/components/performance/measured-link'
import { LanguageSwitcher } from './LanguageSwitcher'

const navItems = [
    { href: '/dashboard', labelKey: 'dashboard', icon: '/mascot/state/fuxie-state-welcome.png' },
    { href: '/course', labelKey: 'course', icon: '/mascot/learn/fuxie-learn-studying.png' },
    { href: '/vocabulary', labelKey: 'vocabulary', icon: '/mascot/skill/fuxie-skill-wortschatz.png' },
    { href: '/grammar', labelKey: 'grammar', icon: '/mascot/skill/fuxie-skill-grammatik.png' },
    { href: '/reading', labelKey: 'reading', icon: '/mascot/skill/fuxie-skill-lesen.png' },
    { href: '/listening', labelKey: 'listening', icon: '/mascot/skill/fuxie-skill-hoeren.png' },
    { href: '/writing', labelKey: 'writing', icon: '/mascot/skill/fuxie-skill-schreiben.png' },
    { href: '/speaking', labelKey: 'speaking', icon: '/mascot/skill/fuxie-skill-sprechen.png' },
    { href: '/chat', labelKey: 'chat', icon: '/mascot/core/fuxie-core-happy-wave.png' },
    { href: '/leaderboard', labelKey: 'leaderboard', icon: '/mascot/learn/fuxie-learn-graduation.png' },
    { href: '/exam', labelKey: 'exam', icon: '/mascot/learn/fuxie-learn-graduation.png' },
    { href: '/review', labelKey: 'review', icon: '/mascot/learn/fuxie-learn-studying.png' },
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
    const t = useTranslations('Navigation')

    const goalPercent = dailyGoal && dailyGoal.goalMinutes > 0
        ? Math.min(100, Math.round((dailyGoal.currentMinutes / dailyGoal.goalMinutes) * 100))
        : 0
    const goalReached = goalPercent >= 100

    return (
        <aside className="flex h-[100dvh] w-64 flex-col border-r border-gray-200/80 bg-white/95 backdrop-blur-sm">
            {/* Logo — Fuxie mascot */}
            <div className="flex items-center gap-2.5 border-b border-gray-100 px-6 py-5">
                <Image
                    src="/mascot/core/fuxie-core-happy-wave.png"
                    alt="Fuxie"
                    width={36}
                    height={36}
                    className="object-contain"
                />
                <span className="text-xl font-bold bg-gradient-to-r from-[#60A8E4] to-[#3C78A8] bg-clip-text text-transparent">
                    Fuxie
                </span>
            </div>
            
            <div className="flex justify-center border-b border-gray-100 px-6 py-2">
                <LanguageSwitcher />
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto px-3 py-4">
                <ul className="space-y-0.5">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href
                        return (
                            <li key={item.href}>
                                <MeasuredLink
                                    href={item.href}
                                    flow="nav.sidebar"
                                    source={item.labelKey}
                                    className={`flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200
                                        ${isActive
                                            ? 'bg-gradient-to-r from-[#60A8E4]/15 to-[#CCE4F0]/50 text-[#3C78A8] shadow-sm'
                                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                        }`}
                                >
                                    <Image
                                        src={item.icon}
                                        alt={item.labelKey}
                                        width={28}
                                        height={28}
                                        className="object-contain shrink-0"
                                    />
                                    <div className="flex flex-col">
                                        <span>{t(item.labelKey as any)}</span>
                                    </div>
                                </MeasuredLink>
                            </li>
                        )
                    })}
                </ul>
            </nav>

            {/* Daily Goal Progress */}
            <div className="border-t border-gray-100 px-4 py-4">
                <div className={`rounded-xl p-3 transition-all ${goalReached
                    ? 'bg-gradient-to-r from-green-50 to-emerald-50 ring-1 ring-green-200/50'
                    : 'bg-gradient-to-r from-[#60A8E4]/10 to-[#2EC4B6]/10'
                    }`}>
                    <div className="flex items-center justify-between mb-1.5">
                        <p className="text-xs font-semibold text-gray-600">
                            {goalReached ? '✅ ' + t('dailyGoalReached') : t('dailyGoal')}
                        </p>
                        {dailyGoal && (
                            <p className="text-[10px] font-medium text-gray-400">
                                +{dailyGoal.xpEarned} XP
                            </p>
                        )}
                    </div>
                    <div className="h-2 w-full rounded-full bg-gray-200/60">
                        <div
                            className={`h-2 rounded-full transition-all duration-700 ${goalReached ? 'bg-green-500' : 'bg-gradient-to-r from-[#60A8E4] to-[#2EC4B6]'
                                }`}
                            style={{ width: `${goalPercent}%` }}
                        />
                    </div>
                    <p className="mt-1 text-[10px] text-gray-400">
                        {dailyGoal
                            ? `${dailyGoal.currentMinutes} / ${dailyGoal.goalMinutes} ${t('minutes')}`
                            : `0 / 15 ${t('minutes')}`
                        }
                    </p>
                </div>
            </div>
        </aside>
    )
}
