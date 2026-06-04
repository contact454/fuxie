'use client'

import dynamic from 'next/dynamic'
import type { ComponentProps } from 'react'
import { useTranslations } from 'next-intl'
import type SpeakingLessonPlayerComponent from './SpeakingLessonPlayer'

type SpeakingLessonPlayerProps = ComponentProps<typeof SpeakingLessonPlayerComponent>

function LoadingWidget() {
    const t = useTranslations('Speaking')
    return (
        <div className="flex min-h-[60vh] items-center justify-center">
            <div className="text-center">
                <div className="mx-auto h-12 w-12 rounded-full border-4 border-gray-200 border-t-[#60A8E4] animate-spin" />
                <p className="mt-3 text-sm text-gray-500">{t('loadingSpeaking')}</p>
            </div>
        </div>
    )
}

const SpeakingLessonPlayer = dynamic(() => import('./SpeakingLessonPlayer'), {
    ssr: false,
    loading: () => <LoadingWidget />,
})

export function SpeakingLessonPlayerDynamic(props: SpeakingLessonPlayerProps) {
    return <SpeakingLessonPlayer {...props} />
}
