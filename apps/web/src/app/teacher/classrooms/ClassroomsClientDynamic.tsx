'use client'

import dynamic from 'next/dynamic'

export const ClassroomsClientDynamic = dynamic<any>(
  () => import('./ClassroomsClient'),
  {
    ssr: false,
    loading: () => <div className="text-sm text-slate-400">Loading classrooms...</div>,
  }
)
