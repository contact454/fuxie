'use client'

import dynamic from 'next/dynamic'

export const ClassroomDetailClientDynamic = dynamic<any>(
  () => import('./ClassroomDetailClient'),
  {
    ssr: false,
    loading: () => <div className="text-sm text-slate-400">Loading classroom...</div>,
  }
)
