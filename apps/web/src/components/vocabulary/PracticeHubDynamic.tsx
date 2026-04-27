'use client'

import dynamic from 'next/dynamic'
import type { ComponentProps } from 'react'
import type { PracticeHub as PracticeHubComponent } from './practice-hub'

type PracticeHubProps = ComponentProps<typeof PracticeHubComponent>

const PracticeHub = dynamic(() => import('./practice-hub').then(mod => mod.PracticeHub), {
    ssr: false,
    loading: () => (
        <div className="max-w-2xl mx-auto mb-20">
            <div className="h-36 rounded-3xl bg-gray-50 border border-gray-100 animate-pulse mb-10" />
            <div className="space-y-10">
                {Array.from({ length: 4 }).map((_, index) => (
                    <div key={index} className="flex flex-col items-center gap-4">
                        <div className="w-24 h-24 rounded-full bg-gray-100 animate-pulse" />
                        <div className="h-14 w-44 rounded-2xl bg-gray-100 animate-pulse" />
                    </div>
                ))}
            </div>
        </div>
    ),
})

export function PracticeHubDynamic(props: PracticeHubProps) {
    return <PracticeHub {...props} />
}
