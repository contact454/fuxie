'use client'

import dynamic from 'next/dynamic'

const LoginClient = dynamic(() => import('./LoginClient'), {
    ssr: false,
    loading: () => (
        <main className="flex min-h-[100dvh] items-center justify-center bg-gradient-to-br from-fuxie-primary/5 via-white to-fuxie-secondary/5">
            <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl animate-pulse">
                <div className="h-12 w-32 mx-auto bg-gray-200 rounded mb-8" />
                <div className="space-y-4">
                    <div className="h-10 bg-gray-200 rounded" />
                    <div className="h-10 bg-gray-200 rounded" />
                    <div className="h-10 bg-gray-200 rounded" />
                </div>
            </div>
        </main>
    ),
})

export function LoginClientDynamic() {
    return <LoginClient />
}
