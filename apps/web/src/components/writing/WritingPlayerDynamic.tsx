'use client'

import dynamic from 'next/dynamic'
import type { ComponentProps } from 'react'
import type { WritingPlayer as WritingPlayerComponent } from './writing-player'

type WritingPlayerProps = ComponentProps<typeof WritingPlayerComponent>

const WritingPlayer = dynamic(() => import('./writing-player').then(mod => mod.WritingPlayer), {
    ssr: false,
    loading: () => (
        <div className="max-w-6xl mx-auto px-4 py-6">
            <div className="h-[520px] rounded-2xl border border-gray-100 bg-gray-50 animate-pulse" />
        </div>
    ),
})

export function WritingPlayerDynamic(props: WritingPlayerProps) {
    return <WritingPlayer {...props} />
}
