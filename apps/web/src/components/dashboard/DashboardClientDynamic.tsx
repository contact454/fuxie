'use client'

import dynamic from 'next/dynamic'
import type { ComponentProps } from 'react'
import type { DashboardClient as DashboardClientComponent } from './dashboard-client'

type DashboardClientProps = ComponentProps<typeof DashboardClientComponent>

const DashboardClient = dynamic(() => import('./dashboard-client').then(mod => mod.DashboardClient), {
    ssr: false,
    loading: () => (
        <div className="px-4 sm:px-6 lg:px-8 py-3">
            <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
                <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-gray-100 animate-pulse" />
                    <div className="flex-1">
                        <div className="h-6 w-56 max-w-full rounded-lg bg-gray-100 animate-pulse" />
                        <div className="mt-2 h-4 w-36 rounded bg-gray-100 animate-pulse" />
                    </div>
                    <div className="hidden sm:block h-10 w-28 rounded-xl bg-gray-100 animate-pulse" />
                </div>
            </div>
        </div>
    ),
})

export function DashboardClientDynamic(props: DashboardClientProps) {
    return <DashboardClient {...props} />
}
