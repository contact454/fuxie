/// <reference no-default-lib="true" />
/// <reference lib="esnext" />
/// <reference lib="webworker" />
import { defaultCache } from '@serwist/next/worker'
import type { PrecacheEntry, SerwistGlobalConfig } from 'serwist'
import { Serwist } from 'serwist'

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined
  }
}

declare const self: ServiceWorkerGlobalScope

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: defaultCache,
})

serwist.addEventListeners()

import { getOfflineDB } from '@/lib/offline/indexed-db'

self.addEventListener('sync', (event: any) => {
    if (event.tag === 'sync-reviews') {
        console.log('[SW] Background sync triggered for sync-reviews')
        event.waitUntil(
            (async () => {
                const db = getOfflineDB()
                if (!db) return
                
                const dbInst = await db
                const reviews = await dbInst.getAll('pending_reviews')
                
                if (!reviews || reviews.length === 0) return

                console.log(`[SW] Found ${reviews.length} pending reviews, syncing...`)
                
                try {
                    // Send to API
                    for (const review of reviews) {
                        const res = await fetch('/api/v1/srs/review', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                cardId: review.cardId,
                                rating: review.rating,
                            })
                        })
                        if (!res.ok) {
                            console.error('[SW] Failed to sync review for card', review.cardId)
                        }
                    }
                    
                    // Clear the pending queue
                    await dbInst.clear('pending_reviews')
                    console.log('[SW] Sync successful')
                } catch (error) {
                    console.error('[SW] Sync failed', error)
                    throw error // Throw to tell the browser to retry later
                }
            })()
        )
    }
})
