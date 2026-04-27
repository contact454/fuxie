'use client'

import dynamic from 'next/dynamic'
import type { ComponentProps } from 'react'
import type { LessonPlayer as LessonPlayerComponent } from './lesson-player'

type LessonPlayerProps = ComponentProps<typeof LessonPlayerComponent>

const LessonPlayer = dynamic(() => import('./lesson-player').then(mod => mod.LessonPlayer), {
    ssr: false,
    loading: () => (
        <div className="flex min-h-[60vh] items-center justify-center">
            <div className="h-12 w-12 rounded-full border-4 border-[#004E89] border-t-transparent animate-spin" />
        </div>
    ),
})

export function LessonPlayerDynamic(props: LessonPlayerProps) {
    return <LessonPlayer {...props} />
}
