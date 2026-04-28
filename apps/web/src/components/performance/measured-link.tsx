'use client'

import Link from 'next/link'
import type { ComponentProps, MouseEvent } from 'react'
import { startLearnerNavigationTiming } from '@/lib/performance/learner-navigation'

type MeasuredLinkProps = Omit<ComponentProps<typeof Link>, 'href'> & {
    href: string
    flow: string
    source?: string
}

export function MeasuredLink({ href, flow, source, onClick, ...props }: MeasuredLinkProps) {
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
    }

    return <Link href={href} onClick={handleClick} {...props} />
}
