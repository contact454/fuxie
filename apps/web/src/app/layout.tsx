import type { Metadata, Viewport } from 'next'
import './globals.css'
import { PwaRegistration } from '@/components/shared/PwaRegistration'
import { InstallPrompt } from '@/components/shared/InstallPrompt'
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getLocale } from 'next-intl/server';

export const metadata: Metadata = {
    title: 'Fuxie 🦊 — Học tiếng Đức thông minh',
    description:
        'Nền tảng học tiếng Đức Agent-First, tập trung thi chứng chỉ Goethe, Telc, ÖSD từ A1 đến C2.',
    keywords: ['tiếng Đức', 'Deutsch lernen', 'Goethe', 'Telc', 'ÖSD', 'CEFR', 'A1', 'B1'],
    manifest: '/manifest.json',
    appleWebApp: {
        capable: true,
        statusBarStyle: 'default',
        title: 'Fuxie',
    },
    formatDetection: {
        telephone: false,
    },
}

export const viewport: Viewport = {
    width: 'device-width',
    initialScale: 1,
    viewportFit: 'cover',
    themeColor: '#FF6B35',
}

export default async function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode
}>) {
    const locale = await getLocale();
    const messages = await getMessages();

    return (
        <html lang={locale}>
            <body>
                <NextIntlClientProvider locale={locale} messages={messages}>
                    {children}
                    <PwaRegistration />
                    <InstallPrompt />
                </NextIntlClientProvider>
            </body>
        </html>
    )
}
