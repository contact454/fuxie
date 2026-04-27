'use client'

import dynamic from 'next/dynamic'
import type { ComponentProps } from 'react'
import type { GrammarClient as GrammarClientComponent } from './GrammarClient'

type GrammarClientProps = ComponentProps<typeof GrammarClientComponent>

const GrammarClient = dynamic(() => import('./GrammarClient').then(mod => mod.GrammarClient), {
    ssr: false,
    loading: () => (
        <div className="max-w-5xl mx-auto px-4 py-8">
            <div className="mb-8 h-32 rounded-2xl border border-gray-100 bg-gray-50 animate-pulse" />
            <div className="grid gap-4 md:grid-cols-2">
                {Array.from({ length: 4 }).map((_, index) => (
                    <div key={index} className="h-44 rounded-2xl border border-gray-100 bg-gray-50 animate-pulse" />
                ))}
            </div>
        </div>
    ),
})

export function GrammarClientDynamic(props: GrammarClientProps) {
    return <GrammarClient {...props} />
}
