import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Fuxie Learning World Lab',
    robots: { index: false, follow: false },
}

export default function FuxieWorldLabLayout({
    children,
}: Readonly<{
    children: React.ReactNode
}>) {
    return <>{children}</>
}
