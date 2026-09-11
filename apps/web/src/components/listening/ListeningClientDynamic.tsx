'use client'

import dynamic from 'next/dynamic'
import type { ComponentProps } from 'react'
import type { ListeningClient as ListeningClientComponent } from './listening-client'

type ListeningClientProps = ComponentProps<typeof ListeningClientComponent>

/** Exported for unit tests — same shell used by next/dynamic loading. */
export function ListeningClientLoading() {
    return (
        <div
            className="max-w-5xl mx-auto px-4 py-8"
            aria-busy="true"
            aria-live="polite"
            data-role="listening-client-loading"
        >
            <div className="mb-8 h-32 rounded-2xl border border-gray-100 bg-gray-50 animate-pulse motion-reduce:animate-none" />
            <div className="space-y-5">
                {Array.from({ length: 3 }).map((_, index) => (
                    <div
                        key={index}
                        className="h-48 rounded-2xl border border-gray-100 bg-gray-50 animate-pulse motion-reduce:animate-none"
                    />
                ))}
            </div>
        </div>
    )
}

const ListeningClient = dynamic(
    () => import('./listening-client').then((mod) => mod.ListeningClient),
    {
        ssr: false,
        loading: () => <ListeningClientLoading />,
    },
)

export function ListeningClientDynamic(props: ListeningClientProps) {
    return <ListeningClient {...props} />
}
