'use client'

import dynamic from 'next/dynamic'
import type { ComponentProps } from 'react'
import type { ExercisePlayerWrapper as ExercisePlayerWrapperComponent } from './exercise-player-wrapper'

type ExercisePlayerWrapperProps = ComponentProps<typeof ExercisePlayerWrapperComponent>

const ExercisePlayerWrapper = dynamic(() => import('./exercise-player-wrapper').then(mod => mod.ExercisePlayerWrapper), {
    ssr: false,
    loading: () => (
        <div className="min-h-[100dvh] flex items-center justify-center bg-gray-50">
            <div className="h-12 w-12 rounded-full border-4 border-[#3C78A8] border-t-transparent animate-spin" />
        </div>
    ),
})

export function ExercisePlayerWrapperDynamic(props: ExercisePlayerWrapperProps) {
    return <ExercisePlayerWrapper {...props} />
}
