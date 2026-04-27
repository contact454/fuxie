'use client'

import dynamic from 'next/dynamic'

const LeaderboardClient = dynamic(() => import('./LeaderboardClient').then(mod => mod.LeaderboardClient), {
    ssr: false,
    loading: () => (
        <div className="max-w-4xl mx-auto px-4 py-8">
            <div className="mb-6 h-28 rounded-2xl border border-gray-100 bg-gray-50 animate-pulse" />
            <div className="space-y-3">
                {Array.from({ length: 6 }).map((_, index) => (
                    <div key={index} className="h-20 rounded-2xl border border-gray-100 bg-gray-50 animate-pulse" />
                ))}
            </div>
        </div>
    ),
})

export function LeaderboardClientDynamic() {
    return <LeaderboardClient />
}
