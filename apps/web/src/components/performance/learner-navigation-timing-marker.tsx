'use client'

import { useEffect } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { markLearnerContentReady, markLearnerRouteVisible } from '@/lib/performance/learner-navigation'

export function LearnerNavigationTimingMarker({ label = 'learn-route' }: { label?: string }) {
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const routeKey = `${pathname}?${searchParams.toString()}`

    useEffect(() => {
        if (process.env.NODE_ENV === 'production') return

        const path = `${window.location.pathname}${window.location.search}`
        markLearnerRouteVisible({ path, label })

        let contentReadyFrame = 0
        let settleFrame = 0
        let fallbackTimer = 0
        let observer: MutationObserver | null = null
        let markedReady = false

        const cleanup = () => {
            if (contentReadyFrame) window.cancelAnimationFrame(contentReadyFrame)
            if (settleFrame) window.cancelAnimationFrame(settleFrame)
            if (fallbackTimer) window.clearTimeout(fallbackTimer)
            observer?.disconnect()
        }

        const markReady = () => {
            if (markedReady) return
            markedReady = true
            cleanup()
            contentReadyFrame = window.requestAnimationFrame(() => {
                markLearnerContentReady({ path, label })
            })
        }

        const isMainStillLoading = () => {
            const main = document.querySelector('main')
            if (!main) return true

            const text = (main.textContent?.toLowerCase() ?? '')
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .replace(/\u0111/g, 'd')
            const hasLoadingCopy = [
                'dang tai',
                'loading',
                'wird geladen',
                'ladt',
            ].some((copy) => text.includes(copy))

            if (hasLoadingCopy) return true

            return Boolean(main.querySelector('[aria-busy="true"], [data-loading="true"], .skeleton, .animate-spin'))
        }

        const checkSettled = () => {
            if (!isMainStillLoading()) {
                markReady()
                return
            }

            if (!observer) {
                const target = document.querySelector('main') ?? document.body
                observer = new MutationObserver(() => {
                    if (settleFrame) window.cancelAnimationFrame(settleFrame)
                    settleFrame = window.requestAnimationFrame(checkSettled)
                })
                observer.observe(target, {
                    attributes: true,
                    childList: true,
                    characterData: true,
                    subtree: true,
                })
            }
        }

        settleFrame = window.requestAnimationFrame(checkSettled)
        fallbackTimer = window.setTimeout(markReady, 5000)

        return () => {
            markedReady = true
            cleanup()
        }
    }, [label, routeKey])

    return null
}
