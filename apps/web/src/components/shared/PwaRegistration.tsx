'use client'

import { useEffect } from 'react'

export function PwaRegistration() {
    useEffect(() => {
        if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('/sw.js').then(
                    () => {
                        // Service Worker registered successfully
                    },
                    (err) => {
                        console.error('[PWA] Service Worker registration failed:', err)
                    }
                )
            })
        }
    }, [])

    return null
}
