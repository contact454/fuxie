// Helper to convert base64 VAPID key to Uint8Array
function urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4)
    const base64 = (base64String + padding)
        .replace(/\-/g, '+')
        .replace(/_/g, '/')

    const rawData = window.atob(base64)
    const outputArray = new Uint8Array(rawData.length)

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i)
    }
    return outputArray
}

export async function subscribeToPushNotifications() {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window)) {
        return false
    }

    try {
        const registration = await navigator.serviceWorker.ready

        // Wait for user permission
        const permission = await Notification.requestPermission()
        if (permission !== 'granted') {
            console.log('[Push] Permission not granted')
            return false
        }

        // Get existing subscription
        let subscription = await registration.pushManager.getSubscription()

        // If no subscription exists, create one
        if (!subscription) {
            // NOTE: In a real app, this vapidKey should come from environment variables.
            // This is just a public key half of the VAPID keypair.
            const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY 
            if (!vapidKey) {
                console.warn('[Push] VAPID key not configured.')
                return false
            }

            subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(vapidKey)
            })
        }

        // Send to our API
        const res = await fetch('/api/v1/push/subscribe', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(subscription)
        })

        if (!res.ok) {
            throw new Error(`Failed to save subscription: ${res.statusText}`)
        }

        return true
    } catch (err) {
        console.error('[Push] Subscription failed:', err)
        return false
    }
}
