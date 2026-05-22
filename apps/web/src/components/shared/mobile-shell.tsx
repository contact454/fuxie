'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Sidebar } from './sidebar'
import { MeasuredLink } from '@/components/performance/measured-link'
import { LearnerNavigationTimingMarker } from '@/components/performance/learner-navigation-timing-marker'
import { getFuxieMascotSrc } from '@/lib/mascot/fuxie-assets'

// Bottom nav items — max 5 for mobile UX
const bottomNavItems = [
    { href: '/dashboard', labelKey: 'dashboard', icon: '🏠' },
    { href: '/vocabulary', labelKey: 'vocabulary', icon: '📚' },
    { href: '/grammar', labelKey: 'grammar', icon: '📝' },
    { href: '/listening', labelKey: 'listening', icon: '🎧' },
    { href: '/review', labelKey: 'review', icon: '🔄' },
]

interface MobileShellProps {
    dailyGoal?: {
        currentMinutes: number
        goalMinutes: number
        xpEarned: number
    }
    children: React.ReactNode
}

export function MobileShell({ dailyGoal: initialDailyGoal, children }: MobileShellProps) {
    const pathname = usePathname()
    const [drawerOpen, setDrawerOpen] = useState(false)
    const [dailyGoal, setDailyGoal] = useState(initialDailyGoal)
    const t = useTranslations('Navigation')

    // Fetch daily goal client-side if not provided by server
    useEffect(() => {
        if (!initialDailyGoal) {
            fetch('/api/v1/daily-goal')
                .then(r => r.ok ? r.json() : null)
                .then(data => { if (data) setDailyGoal(data) })
                .catch(() => {})
        }
    }, [initialDailyGoal])

    // Close drawer on route change
    useEffect(() => {
        setDrawerOpen(false)
    }, [pathname])

    // Prevent body scroll when drawer is open
    useEffect(() => {
        if (drawerOpen) {
            document.body.style.overflow = 'hidden'
        } else {
            document.body.style.overflow = ''
        }
        return () => {
            document.body.style.overflow = ''
        }
    }, [drawerOpen])

    const closeDrawer = useCallback(() => setDrawerOpen(false), [])
    const toggleDrawer = useCallback(() => setDrawerOpen((prev) => !prev), [])

    const isMockupAlignedRoute = pathname === '/dashboard' || pathname.startsWith('/session')

    if (isMockupAlignedRoute) {
        return (
            <main className="flex-1 w-full min-h-screen overflow-x-hidden bg-[#F3FBFF]">
                {children}
                <LearnerNavigationTimingMarker />
            </main>
        )
    }

    return (
        <>
            {/* ===== MOBILE HEADER (< md) ===== */}
            <header className="mobile-header md:hidden">
                <button
                    onClick={toggleDrawer}
                    className="mobile-header-hamburger"
                    aria-label="Menü öffnen"
                >
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <line x1="3" y1="6" x2="21" y2="6" />
                        <line x1="3" y1="12" x2="21" y2="12" />
                        <line x1="3" y1="18" x2="21" y2="18" />
                    </svg>
                </button>

                <MeasuredLink href="/dashboard" flow="nav.mobile.logo" source="dashboard" className="mobile-header-logo">
                    <Image
                        src={getFuxieMascotSrc('authWelcomer')}
                        alt="Fuxie"
                        width={28}
                        height={28}
                        className="object-contain"
                        style={{ width: 'auto', height: 'auto' }}
                    />
                    <span className="text-lg font-bold bg-gradient-to-r from-[#60A8E4] to-[#3C78A8] bg-clip-text text-transparent">
                        Fuxie
                    </span>
                </MeasuredLink>

                {dailyGoal && (
                    <div className="mobile-header-xp">
                        <span className="text-xs">⭐</span>
                        <span className="text-xs font-semibold text-gray-600">
                            {dailyGoal.xpEarned}
                        </span>
                    </div>
                )}
            </header>

            {/* ===== SIDEBAR DRAWER (mobile overlay) ===== */}
            {/* Backdrop */}
            {drawerOpen && (
                <div
                    className="sidebar-backdrop md:hidden"
                    onClick={closeDrawer}
                    aria-hidden="true"
                />
            )}

            {/* Desktop: normal fixed sidebar */}
            <div className="hidden md:block fixed left-0 top-0 z-30">
                <Sidebar dailyGoal={dailyGoal} />
            </div>

            {/* Mobile: drawer sidebar */}
            <div className={`sidebar-drawer md:hidden ${drawerOpen ? 'sidebar-drawer-open' : ''}`}>
                <div className="sidebar-drawer-close-row">
                    <button
                        onClick={closeDrawer}
                        className="sidebar-drawer-close"
                        aria-label="Menü schließen"
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </div>
                <Sidebar dailyGoal={dailyGoal} />
            </div>

            {/* ===== MAIN CONTENT ===== */}
            <main className="mobile-main md:ml-64">
                {children}
                <LearnerNavigationTimingMarker />
            </main>

            {/* ===== BOTTOM NAV (< md) ===== */}
            <nav className="bottom-nav md:hidden">
                {bottomNavItems.map((item) => {
                    const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                    return (
                        <MeasuredLink
                            key={item.href}
                            href={item.href}
                            flow="nav.mobile.bottom"
                            source={item.labelKey}
                            className={`bottom-nav-item ${isActive ? 'bottom-nav-item-active' : ''}`}
                        >
                            <span className="bottom-nav-icon">{item.icon}</span>
                            <span className="bottom-nav-label">{t(item.labelKey as any)}</span>
                        </MeasuredLink>
                    )
                })}
            </nav>
        </>
    )
}
