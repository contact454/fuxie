'use client'

import dynamic from 'next/dynamic'
import type { ComponentProps } from 'react'
import type { FuxieLive3D as FuxieLive3DComponent } from './fuxie-live-3d'

type FuxieLive3DProps = ComponentProps<typeof FuxieLive3DComponent>

const FuxieLive3D = dynamic(() => import('./fuxie-live-3d').then(mod => mod.FuxieLive3D), {
    ssr: false,
    loading: () => (
        <div className="grid h-[220px] w-[220px] place-items-center rounded-2xl bg-[#F0FCFF]">
            <div className="h-10 w-10 rounded-full border-4 border-[#3C78A8] border-t-transparent animate-spin" />
        </div>
    ),
})

export function FuxieLive3DDynamic(props: FuxieLive3DProps) {
    return <FuxieLive3D {...props} />
}
