'use client'

import dynamic from 'next/dynamic'

export const UserAnalyticsClientDynamic = dynamic<any>(
  () => import('./UserAnalyticsClient'),
  {
    ssr: false,
    loading: () => <div className="mx-auto max-w-7xl p-6 text-sm text-slate-500 md:p-8">Loading users...</div>,
  }
)
