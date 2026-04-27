'use client'

import dynamic from 'next/dynamic'

const VocabClient = dynamic(() => import('./VocabClient'), {
  ssr: false,
  loading: () => (
    <div className="mx-auto max-w-4xl p-6 text-sm text-slate-500 md:p-8">
      Loading vocabulary tools...
    </div>
  ),
})

export default function VocabClientDynamic() {
  return <VocabClient />
}
