'use client'

import dynamic from 'next/dynamic'
import type { ComponentProps } from 'react'
import type { ReadingPlayer as ReadingPlayerComponent } from './reading-player'

type ReadingPlayerProps = ComponentProps<typeof ReadingPlayerComponent>

const ReadingPlayer = dynamic(() => import('./reading-player').then(mod => mod.ReadingPlayer), {
    ssr: false,
    loading: () => (
        <div className="min-h-[480px] rounded-2xl bg-gray-50 border border-gray-100 animate-pulse" />
    ),
})

export function ReadingPlayerDynamic(props: ReadingPlayerProps) {
    return <ReadingPlayer {...props} />
}
