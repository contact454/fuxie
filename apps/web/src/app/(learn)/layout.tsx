import type { Metadata } from 'next'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages, getLocale } from 'next-intl/server'
import { MobileShell } from '@/components/shared/mobile-shell'

export const metadata: Metadata = {
    title: 'Fuxie 🦊 — Lernen',
}

export default async function LearnLayout({ children }: { children: React.ReactNode }) {
    // Daily goal data is now fetched client-side by MobileShell via /api/v1/daily-goal
    // This eliminates 2 sequential DB queries that blocked EVERY page navigation
    const locale = await getLocale()
    const messages = await getMessages()

    return (
        <div className="flex min-h-[100dvh] bg-gray-50">
            <NextIntlClientProvider locale={locale} messages={messages}>
                <MobileShell>
                    {children}
                </MobileShell>
            </NextIntlClientProvider>
        </div>
    )
}
