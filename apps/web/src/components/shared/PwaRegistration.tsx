'use client'

import { useEffect } from 'react'

export function PwaRegistration() {
    useEffect(() => {
        if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
            return
        }

        if (process.env.NODE_ENV !== 'production') {
            navigator.serviceWorker.getRegistrations()
                .then((registrations) => {
                    registrations
                        .filter((registration) => registration.scope === `${window.location.origin}/`)
                        .forEach((registration) => {
                            void registration.unregister()
                        })
                })
                .catch((err) => {
                    console.warn('[PWA] Development Service Worker cleanup failed:', err)
                })
            return
        }

        const registerServiceWorker = () => {
            navigator.serviceWorker.register('/sw.js').catch((err) => {
                console.error('[PWA] Service Worker registration failed:', err)
            })
        }

        if (document.readyState === 'complete') {
            registerServiceWorker()
            return
        }

        window.addEventListener('load', registerServiceWorker, { once: true })

        return () => {
            window.removeEventListener('load', registerServiceWorker)
        }
    }, [])

    return null
}
