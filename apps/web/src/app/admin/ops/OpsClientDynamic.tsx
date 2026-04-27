'use client'

import dynamic from 'next/dynamic'

export const OpsClientDynamic = dynamic<any>(
  () => import('./OpsClient'),
  {
    ssr: false,
    loading: () => <div className="mx-auto max-w-7xl p-6 text-sm text-slate-500 md:p-8">Loading operations...</div>,
  }
)
