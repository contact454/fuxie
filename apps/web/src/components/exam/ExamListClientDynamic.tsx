'use client'

import dynamic from 'next/dynamic'

const ExamListClient = dynamic(() => import('./ExamListClient').then(mod => mod.ExamListClient), {
    ssr: false,
    loading: () => (
        <div className="max-w-5xl mx-auto px-4 py-8 pb-32">
            <div className="mb-12 flex flex-col items-center gap-6 border-b border-gray-100 pb-8 md:flex-row md:items-start">
                <div className="h-24 w-24 rounded-full bg-gray-100 animate-pulse" />
                <div className="w-full max-w-lg text-center md:text-left">
                    <div className="mx-auto md:mx-0 h-5 w-44 rounded bg-gray-100 animate-pulse" />
                    <div className="mx-auto md:mx-0 mt-3 h-10 w-64 rounded-xl bg-gray-100 animate-pulse" />
                    <div className="mx-auto md:mx-0 mt-3 h-5 w-full rounded bg-gray-100 animate-pulse" />
                </div>
            </div>
            <div className="mb-10 flex gap-2 overflow-hidden">
                {Array.from({ length: 5 }).map((_, index) => (
                    <div key={index} className="h-11 w-20 rounded-xl bg-gray-100 animate-pulse" />
                ))}
            </div>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {Array.from({ length: 4 }).map((_, index) => (
                    <div key={index} className="h-[280px] rounded-3xl border border-gray-100 bg-gray-100/60 animate-pulse" />
                ))}
            </div>
        </div>
    ),
})

export function ExamListClientDynamic() {
    return <ExamListClient />
}
