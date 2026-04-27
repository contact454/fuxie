'use client'

import dynamic from 'next/dynamic'

const GrammarMocktestClient = dynamic(() => import('./GrammarMocktestClient'), {
    ssr: false,
    loading: () => (
        <div className="min-h-[100dvh] bg-gray-50 flex items-center justify-center">
            <div className="h-12 w-12 rounded-full border-4 border-[#004E89] border-t-transparent animate-spin" />
        </div>
    ),
})

export function GrammarMocktestClientDynamic() {
    return <GrammarMocktestClient />
}
