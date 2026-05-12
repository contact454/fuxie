'use client'

import dynamic from 'next/dynamic'
import type { ComponentProps } from 'react'
import type { ShopCatalogClient as ShopCatalogClientComponent } from './shop-catalog-client'

type ShopCatalogClientProps = ComponentProps<typeof ShopCatalogClientComponent>

const ShopCatalogClient = dynamic(() => import('./shop-catalog-client').then(mod => mod.ShopCatalogClient), {
    ssr: false,
    loading: () => (
        <div className="mx-auto w-full max-w-6xl px-4 py-8">
            <div className="mb-8 h-44 rounded-3xl border border-gray-100 bg-gray-50 animate-pulse" />
            <div className="grid gap-4 md:grid-cols-3">
                {Array.from({ length: 6 }).map((_, index) => (
                    <div key={index} className="h-64 rounded-3xl border border-gray-100 bg-gray-50 animate-pulse" />
                ))}
            </div>
        </div>
    ),
})

export function ShopCatalogClientDynamic(props: ShopCatalogClientProps) {
    return <ShopCatalogClient {...props} />
}
