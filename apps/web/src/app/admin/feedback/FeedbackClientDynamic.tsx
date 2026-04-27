'use client'

import dynamic from 'next/dynamic'

export const FeedbackClientDynamic = dynamic<any>(
  () => import('./FeedbackClient'),
  {
    ssr: false,
    loading: () => <div className="mx-auto max-w-7xl p-6 text-sm text-slate-500 md:p-8">Loading feedback...</div>,
  }
)
