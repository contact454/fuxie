import type { Metadata } from 'next'
import { MobileShell } from '@/components/shared/mobile-shell'

export const metadata: Metadata = {
    title: 'Fuxie 🦊 — Lernen',
}

export default function LearnLayout({ children }: { children: React.ReactNode }) {
    // Daily goal data is now fetched client-side by MobileShell via /api/v1/daily-goal
    // This eliminates 2 sequential DB queries that blocked EVERY page navigation
    return (
        <div className="flex min-h-screen bg-gray-50">
            <MobileShell>
                {children}
            </MobileShell>
        </div>
    )
}
