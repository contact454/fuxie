'use client'

import dynamic from 'next/dynamic'
import type { ComponentProps } from 'react'
import type { SessionPlayer as SessionPlayerComponent } from './SessionPlayer'

type SessionPlayerProps = ComponentProps<typeof SessionPlayerComponent>

const SessionPlayer = dynamic(() => import('./SessionPlayer').then(mod => mod.SessionPlayer), {
    ssr: false,
    loading: () => (
        <div className="flex-1 flex items-center justify-center">
            <div className="w-12 h-12 border-4 border-fuxie-primary border-t-transparent rounded-full animate-spin" />
        </div>
    ),
})

export function SessionPlayerDynamic(props: SessionPlayerProps) {
    return <SessionPlayer {...props} />
}
