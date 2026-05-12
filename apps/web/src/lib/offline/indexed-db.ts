import { DBSchema, openDB, IDBPDatabase } from 'idb'

type SyncRegistration = {
    register(tag: string): Promise<void>
}

declare global {
    interface Window {
        SyncManager?: unknown
    }

    interface ServiceWorkerRegistration {
        sync?: SyncRegistration
    }
}

interface FuxieOfflineDB extends DBSchema {
    due_cards: {
        key: string // card id
        value: {
            id: string
            term: string
            meaning: string
            // add other fields you need for review
        }
        indexes: { 'by-level': string }
    }
    pending_reviews: {
        key: number // auto-increment
        value: {
            cardId: string
            rating: 'AGAIN' | 'HARD' | 'GOOD' | 'EASY'
            timestamp: number
        }
    }
}

let dbPromise: Promise<IDBPDatabase<FuxieOfflineDB>> | null = null

export function getOfflineDB() {
    if (typeof indexedDB === 'undefined') return null
    if (!dbPromise) {
        dbPromise = openDB<FuxieOfflineDB>('fuxie-offline-db', 1, {
            upgrade(db) {
                if (!db.objectStoreNames.contains('due_cards')) {
                    const cardStore = db.createObjectStore('due_cards', { keyPath: 'id' })
                    cardStore.createIndex('by-level', 'level')
                }
                if (!db.objectStoreNames.contains('pending_reviews')) {
                    db.createObjectStore('pending_reviews', { autoIncrement: true })
                }
            },
        })
    }
    return dbPromise
}

export async function saveCardsOffline(cards: any[]) {
    const db = await getOfflineDB()
    if (!db) return
    const tx = db.transaction('due_cards', 'readwrite')
    for (const card of cards) {
        // Just cache them all
        tx.store.put(card)
    }
    await tx.done
}

export async function queuePendingReview(cardId: string, rating: 'AGAIN' | 'HARD' | 'GOOD' | 'EASY') {
    const db = await getOfflineDB()
    if (!db) return
    await db.add('pending_reviews', {
        cardId,
        rating,
        timestamp: Date.now(),
    })
    
    // Optionally trigger a background sync if Service Worker supports it
    if ('serviceWorker' in navigator && typeof window !== 'undefined' && 'SyncManager' in window) {
        try {
            const swRegistration = await navigator.serviceWorker.ready
            // Attempt to register a sync tag.
            await swRegistration.sync?.register('sync-reviews')
        } catch (err) {
           console.log('[Sync] Background sync could not be registered', err) 
        }
    }
}

export async function getPendingReviews() {
    const db = await getOfflineDB()
    if (!db) return []
    return db.getAll('pending_reviews')
}

export async function clearPendingReviews() {
    const db = await getOfflineDB()
    if (!db) return
    await db.clear('pending_reviews')
}

// Basic online detector hook for components
export function isOnline(): boolean {
    if (typeof navigator === 'undefined') return true
    return navigator.onLine
}
