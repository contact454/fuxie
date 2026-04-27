'use client'

import dynamic from 'next/dynamic'
import type { ComponentProps } from 'react'
import type { LessonPlayer as LessonPlayerComponent } from './LessonPlayer'

type LessonPlayerProps = ComponentProps<typeof LessonPlayerComponent>

const LessonPlayer = dynamic(() => import('./LessonPlayer').then(mod => mod.LessonPlayer), {
    ssr: false,
    loading: () => (
        <div className="min-h-[100dvh] bg-[#F8FAFC] flex items-center justify-center">
            <div className="w-12 h-12 border-4 border-[#004E89] border-t-transparent rounded-full animate-spin" />
        </div>
    ),
})

export function LessonPlayerDynamic(props: LessonPlayerProps) {
    return <LessonPlayer {...props} />
}
