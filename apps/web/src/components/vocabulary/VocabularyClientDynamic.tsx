'use client'

import dynamic from 'next/dynamic'
import type { ComponentProps } from 'react'
import type { VocabularyClient as VocabularyClientComponent } from './vocabulary-client'

type VocabularyClientProps = ComponentProps<typeof VocabularyClientComponent>

const VocabularyClient = dynamic(() => import('./vocabulary-client').then(mod => mod.VocabularyClient), {
    ssr: false,
    loading: () => (
        <div className="max-w-5xl mx-auto px-4 py-6">
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm mb-6">
                <div className="flex items-center gap-4">
                    <div className="h-14 w-14 rounded-full bg-gray-100 animate-pulse" />
                    <div className="flex-1">
                        <div className="h-7 w-48 rounded-lg bg-gray-100 animate-pulse" />
                        <div className="mt-2 h-4 w-36 rounded bg-gray-100 animate-pulse" />
                    </div>
                    <div className="hidden sm:flex gap-2">
                        <div className="h-11 w-28 rounded-xl bg-gray-100 animate-pulse" />
                        <div className="h-11 w-32 rounded-xl bg-gray-100 animate-pulse" />
                    </div>
                </div>
                <div className="mt-4 h-2 rounded-full bg-gray-100 animate-pulse" />
            </div>
            <div className="mb-6 h-[138px] rounded-2xl bg-gray-50 border border-gray-100 animate-pulse" />
            <div className="h-64 rounded-2xl bg-gray-50 border border-gray-100 animate-pulse" />
        </div>
    ),
})

export function VocabularyClientDynamic(props: VocabularyClientProps) {
    return <VocabularyClient {...props} />
}
