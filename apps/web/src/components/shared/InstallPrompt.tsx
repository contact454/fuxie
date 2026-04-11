'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'

interface BeforeInstallPromptEvent extends Event {
    readonly platforms: Array<string>
    readonly userChoice: Promise<{
        outcome: 'accepted' | 'dismissed'
        platform: string
    }>
    prompt(): Promise<void>
}

export function InstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
    const [showBanner, setShowBanner] = useState(false)

    useEffect(() => {
        // Detect if app is already installed
        if (window.matchMedia('(display-mode: standalone)').matches) {
            return
        }

        // Check localStorage if user has dismissed it recently (e.g. in the last 7 days)
        const dismissedAt = localStorage.getItem('fuxie_install_dismissed')
        if (dismissedAt) {
            const daysSince = (Date.now() - parseInt(dismissedAt, 10)) / (1000 * 60 * 60 * 24)
            if (daysSince < 7) return
        }

        const handleBeforeInstallPrompt = (e: Event) => {
            // Prevent Chrome 67 and earlier from automatically showing the prompt
            e.preventDefault()
            // Stash the event so it can be triggered later.
            setDeferredPrompt(e as BeforeInstallPromptEvent)
            // Show the banner
            setShowBanner(true)
        }

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
        }
    }, [])

    const handleInstall = async () => {
        if (!deferredPrompt) return

        // Show the prompt
        deferredPrompt.prompt()

        // Wait for the user to respond to the prompt
        const { outcome } = await deferredPrompt.userChoice
        
        if (outcome === 'accepted') {
            setShowBanner(false)
        }

        // We've used the prompt, and can't use it again, drop it
        setDeferredPrompt(null)
    }

    const handleDismiss = () => {
        setShowBanner(false)
        localStorage.setItem('fuxie_install_dismissed', Date.now().toString())
    }

    if (!showBanner) return null

    return (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-8 md:w-96 bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] p-4 z-50 animate-fade-in-up border border-gray-100 flex items-center gap-4">
            <div className="shrink-0 relative w-12 h-12 bg-orange-50 rounded-full flex items-center justify-center">
                <Image
                    src="/mascot/core/fuxie-core-happy.png"
                    alt="Fuxie"
                    width={32}
                    height={32}
                    className="object-contain"
                />
            </div>
            
            <div className="flex-1 min-w-0">
                <h3 className="font-bold text-gray-900 text-sm mb-0.5">Cài đặt Fuxie APP!</h3>
                <p className="text-xs text-gray-500 line-clamp-2 leading-snug">
                    Học tiếng Đức mượt mà hơn, không bị gián đoạn và nhận nhắc nhở học tập mỗi ngày.
                </p>
            </div>

            <div className="shrink-0 flex flex-col gap-2">
                <button
                    onClick={handleInstall}
                    className="bg-[#FF6B35] text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-[#e55a25] transition-colors"
                >
                    Cài đặt
                </button>
                <button
                    onClick={handleDismiss}
                    className="text-gray-400 text-[10px] font-medium hover:text-gray-600 transition-colors"
                >
                    Để sau
                </button>
            </div>
        </div>
    )
}
