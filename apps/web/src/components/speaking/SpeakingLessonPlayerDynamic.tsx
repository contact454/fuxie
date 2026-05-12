'use client'

import dynamic from 'next/dynamic'
import type { ComponentProps } from 'react'
import type SpeakingLessonPlayerComponent from './SpeakingLessonPlayer'

type SpeakingLessonPlayerProps = ComponentProps<typeof SpeakingLessonPlayerComponent>

const SpeakingLessonPlayer = dynamic(() => import('./SpeakingLessonPlayer'), {
    ssr: false,
    loading: () => (
        <div className="flex min-h-[60vh] items-center justify-center">
            <div className="text-center">
                <div className="mx-auto h-12 w-12 rounded-full border-4 border-gray-200 border-t-[#60A8E4] animate-spin" />
                <p className="mt-3 text-sm text-gray-500">Đang tải bài nói...</p>
            </div>
        </div>
    ),
})

export function SpeakingLessonPlayerDynamic(props: SpeakingLessonPlayerProps) {
    return <SpeakingLessonPlayer {...props} />
}
