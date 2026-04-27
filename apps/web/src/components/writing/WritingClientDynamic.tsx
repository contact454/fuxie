'use client'

import dynamic from 'next/dynamic'
import type { ComponentProps } from 'react'
import type { WritingClient as WritingClientComponent } from './writing-client'

type WritingClientProps = ComponentProps<typeof WritingClientComponent>

const WritingClient = dynamic(() => import('./writing-client').then(mod => mod.WritingClient), {
    ssr: false,
    loading: () => (
        <div className="max-w-5xl mx-auto px-4 py-8">
            <div className="mb-8 h-32 rounded-2xl border border-gray-100 bg-gray-50 animate-pulse" />
            <div className="space-y-5">
                {Array.from({ length: 3 }).map((_, index) => (
                    <div key={index} className="h-48 rounded-2xl border border-gray-100 bg-gray-50 animate-pulse" />
                ))}
            </div>
        </div>
    ),
})

export function WritingClientDynamic(props: WritingClientProps) {
    return <WritingClient {...props} />
}
