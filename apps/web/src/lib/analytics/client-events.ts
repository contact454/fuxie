'use client'

import type { AnalyticsActionType, AnalyticsEventName } from './events'

export interface ClientAnalyticsEventInput {
    eventName: AnalyticsEventName
    source?: string
    sessionId?: string
    route?: string
    actionId?: string
    actionType?: AnalyticsActionType
    level?: string
    skill?: string
    metadata?: Record<string, unknown>
}

export function trackClientAnalyticsEvent(input: ClientAnalyticsEventInput) {
    const payload = {
        ...input,
        route: input.route ?? currentRoute(),
    }

    fetch('/api/v1/analytics/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        keepalive: true,
    }).catch(() => {
        // Analytics must never block learner navigation.
    })
}

function currentRoute() {
    if (typeof window === 'undefined') return undefined
    return `${window.location.pathname}${window.location.search}`
}
