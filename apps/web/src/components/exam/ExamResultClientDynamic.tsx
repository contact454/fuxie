'use client'

import dynamic from 'next/dynamic'
import type { ComponentProps } from 'react'
import type { ExamResultClient as ExamResultClientComponent } from './ExamResultClient'

type ExamResultClientProps = ComponentProps<typeof ExamResultClientComponent>

const ExamResultClient = dynamic(() => import('./ExamResultClient').then(mod => mod.ExamResultClient), {
    ssr: false,
    loading: () => (
        <div className="max-w-3xl mx-auto px-4 py-10">
            <div className="h-72 rounded-2xl border border-gray-100 bg-gray-50 animate-pulse" />
        </div>
    ),
})

export function ExamResultClientDynamic(props: ExamResultClientProps) {
    return <ExamResultClient {...props} />
}
