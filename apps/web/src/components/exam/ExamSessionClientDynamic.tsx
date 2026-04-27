'use client'

import dynamic from 'next/dynamic'
import type { ComponentProps } from 'react'
import type { ExamSessionClient as ExamSessionClientComponent } from './ExamSessionClient'

type ExamSessionClientProps = ComponentProps<typeof ExamSessionClientComponent>

const ExamSessionClient = dynamic(() => import('./ExamSessionClient').then(mod => mod.ExamSessionClient), {
    ssr: false,
    loading: () => (
        <div className="flex min-h-[60vh] items-center justify-center">
            <div className="h-12 w-12 rounded-full border-4 border-[#004E89] border-t-transparent animate-spin" />
        </div>
    ),
})

export function ExamSessionClientDynamic(props: ExamSessionClientProps) {
    return <ExamSessionClient {...props} />
}
