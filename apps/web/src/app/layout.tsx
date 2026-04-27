import type { Metadata, Viewport } from 'next'
import './globals.css'
import { PwaRegistration } from '@/components/shared/PwaRegistration'
import { InstallPrompt } from '@/components/shared/InstallPrompt'
import { cookies } from 'next/headers'

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
        apple: '/mascot/core/fuxie-core-happy.png',
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
    const cookieStore = await cookies()
    const locale = cookieStore.get('NEXT_LOCALE')?.value || 'vi'

    return (
        <html lang={locale}>
            <body>
                {children}
                <PwaRegistration />
                <InstallPrompt />
            </body>
        </html>
    )
}
