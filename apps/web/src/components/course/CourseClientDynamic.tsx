'use client'

import dynamic from 'next/dynamic'
import type { ComponentProps } from 'react'
import type { CourseClient as CourseClientComponent } from './CourseClient'

type CourseClientProps = ComponentProps<typeof CourseClientComponent>

const CourseClient = dynamic(() => import('./CourseClient').then(mod => mod.CourseClient), {
    ssr: false,
    loading: () => (
        <div className="max-w-5xl mx-auto px-4 py-8">
            <div className="mb-8 h-36 rounded-2xl border border-gray-100 bg-gray-50 animate-pulse" />
            <div className="space-y-5">
                {Array.from({ length: 4 }).map((_, index) => (
                    <div key={index} className="h-52 rounded-2xl border border-gray-100 bg-gray-50 animate-pulse" />
                ))}
            </div>
        </div>
    ),
})

export function CourseClientDynamic(props: CourseClientProps) {
    return <CourseClient {...props} />
}
