'use client'

import dynamic from 'next/dynamic'
import type { ComponentProps } from 'react'
import type { ReviewClient as ReviewClientComponent } from './review-client'

type ReviewClientProps = ComponentProps<typeof ReviewClientComponent>

const ReviewClient = dynamic(() => import('./review-client').then(mod => mod.ReviewClient), {
    ssr: false,
    loading: () => (
        <div className="max-w-5xl mx-auto px-4 py-8">
            <div className="mb-6 h-36 rounded-2xl border border-gray-100 bg-gray-50 animate-pulse" />
            <div className="grid gap-4 md:grid-cols-2">
                {Array.from({ length: 4 }).map((_, index) => (
                    <div key={index} className="h-40 rounded-2xl border border-gray-100 bg-gray-50 animate-pulse" />
                ))}
            </div>
        </div>
    ),
})

export function ReviewClientDynamic(props: ReviewClientProps) {
    return <ReviewClient {...props} />
}
