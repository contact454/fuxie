'use client'

import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { MeasuredLink } from '@/components/performance/measured-link'
import { FUXIE_GAMIFICATION_MASCOTS, FUXIE_MASCOT_STATES, FUXIE_MODULE_MASCOTS } from '@/lib/mascot/fuxie-assets'
import { LanguageSwitcher } from './LanguageSwitcher'

const navItems = [
    { href: '/dashboard', labelKey: 'dashboard', icon: FUXIE_MODULE_MASCOTS.dashboard },
    { href: '/course', labelKey: 'course', icon: FUXIE_MODULE_MASCOTS.course },
    { href: '/vocabulary', labelKey: 'vocabulary', icon: FUXIE_MODULE_MASCOTS.vocabulary },
    { href: '/grammar', labelKey: 'grammar', icon: FUXIE_MODULE_MASCOTS.grammar },
    { href: '/reading', labelKey: 'reading', icon: FUXIE_MODULE_MASCOTS.reading },
    { href: '/listening', labelKey: 'listening', icon: FUXIE_MODULE_MASCOTS.listening },
    { href: '/writing', labelKey: 'writing', icon: FUXIE_MODULE_MASCOTS.writing },
    { href: '/speaking', labelKey: 'speaking', icon: FUXIE_MODULE_MASCOTS.speaking },
    { href: '/chat', labelKey: 'chat', icon: FUXIE_MODULE_MASCOTS.chat },
    { href: '/leaderboard', labelKey: 'leaderboard', icon: FUXIE_GAMIFICATION_MASCOTS['rank-up'] },
    { href: '/exam', labelKey: 'exam', icon: FUXIE_MODULE_MASCOTS.exam },
    { href: '/review', labelKey: 'review', icon: FUXIE_MODULE_MASCOTS.review },
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
        <aside className="flex h-[100dvh] w-64 flex-col border-r border-[#8bd3ff]/30 bg-[#064987] text-white">
            {/* Logo — Fuxie mascot */}
            <div className="flex items-center gap-2.5 border-b border-[#8bd3ff]/30 px-6 py-5">
                <Image
                    src={FUXIE_MASCOT_STATES.wave}
                    alt="Fuxie"
                    width={36}
                    height={36}
                    className="object-contain"
                    style={{ width: 'auto', height: 'auto' }}
                />
                <span className="text-xl font-black tracking-normal text-white">
                    Fuxie
                </span>
            </div>
            
            <div className="flex justify-center border-b border-[#8bd3ff]/30 px-6 py-2">
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
                                    className={`flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm transition-all duration-200 focus-visible:outline-[var(--fuxie-blue-200)]
                                        ${isActive
                                            ? 'bg-[#2EC4B6] text-[var(--fuxie-blue-900)] shadow-sm font-semibold'
                                            : 'text-white/80 hover:bg-white/10 hover:text-white'
                                        }`}
                                >
                                    <Image
                                        src={item.icon}
                                        alt={item.labelKey}
                                        width={28}
                                        height={28}
                                        className="object-contain shrink-0"
                                        style={{ width: 'auto', height: 'auto' }}
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
            <div className="border-t border-[#8bd3ff]/30 px-4 py-4">
                <div className="rounded-2xl border border-[#8bd3ff]/20 bg-[#0b67b8] p-3 shadow-md shadow-sky-950/20">
                    <div className="flex items-center justify-between mb-1.5">
                        <p className="text-xs font-semibold text-white">
                            {goalReached ? '✅ ' + t('dailyGoalReached') : t('dailyGoal')}
                        </p>
                        {dailyGoal && (
                            <p className="text-xs font-bold text-[#FFB703]" data-reward-context="true">
                                +{dailyGoal.xpEarned} XP
                            </p>
                        )}
                    </div>
                    <div className="h-2 w-full rounded-full bg-[#064987]">
                        <div
                            className="h-2 rounded-full transition-all duration-700 bg-[#2ec4b6]"
                            style={{ width: `${goalPercent}%` }}
                        />
                    </div>
                    <p className="mt-1 text-xs text-white/85">
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
