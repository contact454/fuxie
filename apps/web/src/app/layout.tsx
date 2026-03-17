import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
    title: 'Fuxie 🦊 — Học tiếng Đức thông minh',
    description:
        'Nền tảng học tiếng Đức Agent-First, tập trung thi chứng chỉ Goethe, Telc, ÖSD từ A1 đến C2.',
    keywords: ['tiếng Đức', 'Deutsch lernen', 'Goethe', 'Telc', 'ÖSD', 'CEFR', 'A1', 'B1'],
}

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode
}>) {
    return (
        <html lang="vi">
            <body>{children}</body>
        </html>
    )
}
