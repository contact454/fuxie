'use client'

import Link from 'next/link'
import type { ComponentProps, MouseEvent } from 'react'
import type { ClientAnalyticsEventInput } from '@/lib/analytics/client-events'
import { trackClientAnalyticsEvent } from '@/lib/analytics/client-events'
import { startLearnerNavigationTiming } from '@/lib/performance/learner-navigation'

type MeasuredLinkProps = Omit<ComponentProps<typeof Link>, 'href'> & {
    href: string
    flow: string
    source?: string
    analytics?: ClientAnalyticsEventInput
}

const measuredLinkFocusClass =
    'outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--fuxie-blue-700)]'

export function MeasuredLink({ href, flow, source, analytics, onClick, className, ...props }: MeasuredLinkProps) {
    const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
        onClick?.(event)
        if (
            event.defaultPrevented ||
            event.button !== 0 ||
            event.metaKey ||
            event.ctrlKey ||
            event.shiftKey ||
            event.altKey
        ) {
            return
        }

        startLearnerNavigationTiming({ flow, href, source })
        if (analytics) {
            trackClientAnalyticsEvent(analytics)
        }
    }

    return (
        <Link
            href={href}
            onClick={handleClick}
            className={[measuredLinkFocusClass, className].filter(Boolean).join(' ')}
            {...props}
        />
    )
}
