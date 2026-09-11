'use client'

import dynamic from 'next/dynamic'
import type { ComponentProps } from 'react'
import type { LessonPlayer as LessonPlayerComponent } from './lesson-player'

type LessonPlayerProps = ComponentProps<typeof LessonPlayerComponent>

/**
 * Accessible loading shell for the dynamic LessonPlayer chunk.
 * Shared by next/dynamic `loading` and covered by focused unit tests.
 */
export function LessonPlayerLoading() {
    return (
        <div
            role="status"
            aria-busy="true"
            aria-live="polite"
            data-role="lesson-player-loading"
            className="flex min-h-[60vh] items-center justify-center"
        >
            <div
                className="h-12 w-12 rounded-full border-4 border-[#60A8E4] border-t-transparent animate-spin motion-reduce:animate-none"
                aria-hidden="true"
                data-role="lesson-player-loading-spinner"
            />
        </div>
    )
}

const LessonPlayer = dynamic(() => import('./lesson-player').then(mod => mod.LessonPlayer), {
    ssr: false,
    loading: () => <LessonPlayerLoading />,
})

export function LessonPlayerDynamic(props: LessonPlayerProps) {
    return <LessonPlayer {...props} />
}
