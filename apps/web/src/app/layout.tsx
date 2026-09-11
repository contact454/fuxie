import type { Metadata, Viewport } from 'next'
import { Nunito } from 'next/font/google'
import './globals.css'
import { PwaRegistration } from '@/components/shared/PwaRegistration'
import { cookies } from 'next/headers'
import { normalizeUiLocale } from '@/i18n/locales'

const nunito = Nunito({
    subsets: ['latin', 'vietnamese'],
    weight: 'variable',
    variable: '--font-nunito',
    display: 'swap',
})

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
    icons: {
        icon: '/fuxie-icon.svg',
        apple: '/fuxie-icon.svg',
    },
    formatDetection: {
        telephone: false,
    },
}

export const viewport: Viewport = {
    width: 'device-width',
    initialScale: 1,
    viewportFit: 'cover',
    themeColor: '#60A8E4',
}

export default async function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode
}>) {
    const cookieStore = await cookies()
    const locale = normalizeUiLocale(cookieStore.get('NEXT_LOCALE')?.value)

    return (
        <html lang={locale}>
            <body className={nunito.variable}>
                {children}
                <PwaRegistration />
            </body>
        </html>
    )
}
