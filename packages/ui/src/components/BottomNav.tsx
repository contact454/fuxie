import * as React from 'react'

export type BottomNavTab = 'world' | 'review' | 'profile'

export interface BottomNavProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'> {
    activeTab: BottomNavTab
    onChange: (tab: BottomNavTab) => void
}

export function BottomNav({ activeTab, onChange, className = '', ...props }: BottomNavProps) {
    const tabs = [
        {
            id: 'world' as const,
            label: 'Thế giới',
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
                </svg>
            ),
        },
        {
            id: 'review' as const,
            label: 'Ôn tập',
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                    <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-2 10H7v-2h10v2zm0-4H7V7h10v2zm0 8H7v-2h10v2z" />
                </svg>
            ),
        },
        {
            id: 'profile' as const,
            label: 'Hồ sơ',
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                </svg>
            ),
        },
    ]

    return (
        <nav
            className={`w-full flex items-center justify-around px-[var(--fuxie-space-2)] bg-white/95 backdrop-blur-md border-t border-[var(--fuxie-blue-200)] shadow-lg pb-[calc(var(--fuxie-space-2)+env(safe-area-inset-bottom,0px))] min-h-[calc(64px+env(safe-area-inset-bottom,0px))] ${className}`.trim()}
            {...props}
        >
            {tabs.map((tab) => {
                const isActive = activeTab === tab.id

                return (
                    <button
                        key={tab.id}
                        type="button"
                        onClick={() => onChange(tab.id)}
                        className={`flex flex-col items-center justify-center gap-0.5 min-h-[var(--fuxie-tap-min)] flex-1 text-center transition-all duration-[var(--fuxie-dur-tap)] ease-[var(--fuxie-ease-tactile)] outline-none focus-visible:bg-[var(--fuxie-blue-50)] touch-action-manipulation ${
                            isActive
                                ? 'text-[var(--fuxie-blue-600)] scale-105 font-black'
                                : 'text-[var(--fuxie-blue-400)] hover:text-[var(--fuxie-blue-600)]'
                        }`.trim()}
                        aria-label={`Tab ${tab.label}`}
                    >
                        <span className="shrink-0">{tab.icon}</span>
                        <span className="text-[var(--fuxie-text-caption)] font-semibold whitespace-nowrap">
                            {tab.label}
                        </span>
                    </button>
                )
            })}
        </nav>
    )
}
