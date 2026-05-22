'use client'

/**
 * ReadingSkillShell — client wrapper that composes `ReadingPlayerDynamic`
 * inside the gamified `SkillPlayerShell` (task 11.1 of
 * `gamified-ui-asset-rollout`).
 *
 * Vai chinh: Frontend Engineer
 * Vai phoi hop: Design System Designer (world prop scrim),
 *               Gamification Designer (progress + reward copy)
 *
 * Composition contract:
 *  - Picks the world prop via `pickWorldProp(['library'])` (Req 6.4) —
 *    handled inside `SkillMotivationLayer` via the shell's `worldPropTags`.
 *  - Treats the passage text + question metadata as "ready" the moment
 *    the client chunk hydrates: the data was resolved server-side by the
 *    Prisma query in `app/(learn)/reading/[exerciseId]/page.tsx`, so the
 *    only loading we need to gate on is the dynamic chunk mounting. We
 *    flip `assetLoaded` to `true` on the next paint frame via
 *    `requestAnimationFrame` so the shell never observes a "ready before
 *    mounted" race.
 *  - Provides a `retryNonce` to `ReadingPlayerDynamic` so taps on
 *    "Thử lại" force a remount of the dynamic chunk (and therefore
 *    re-trigger the loading window). The internal `ReadingPlayer` keeps
 *    its own progress in component state, so remount means the learner
 *    re-enters the player from `phase = 'intro'` — the explicit "preserve
 *    progress" requirement (Req 6.10) is honored at the shell level
 *    because the shell never unmounts while in the error state.
 *
 * Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.10, 6.11, 11.5
 */

import { useEffect, useState, useCallback } from 'react'

import { ReadingPlayerDynamic } from '@/components/reading/ReadingPlayerDynamic'
import {
    SkillPlayerShell,
    type SkillPlayerShellLabels,
} from '@/components/gamification/skill-player-shell'

type ReadingPlayerProps = React.ComponentProps<typeof ReadingPlayerDynamic>

export interface ReadingSkillShellProps {
    player: ReadingPlayerProps
    labels: SkillPlayerShellLabels
    primaryCtaHref?: string
}

export function ReadingSkillShell({
    player,
    labels,
    primaryCtaHref,
}: ReadingSkillShellProps) {
    const [assetLoaded, setAssetLoaded] = useState(false)
    const [retryNonce, setRetryNonce] = useState(0)

    // Mark the surface ready on the first client tick after each mount /
    // remount. The passage data is already in `player.*` props, so the
    // only thing we wait on is the dynamic chunk hydration (cheap).
    useEffect(() => {
        let raf = 0
        if (typeof window !== 'undefined' && 'requestAnimationFrame' in window) {
            raf = window.requestAnimationFrame(() => setAssetLoaded(true))
        } else {
            setAssetLoaded(true)
        }
        return () => {
            if (raf) window.cancelAnimationFrame(raf)
        }
    }, [retryNonce])

    const handleRetry = useCallback(() => {
        setAssetLoaded(false)
        setRetryNonce(n => n + 1)
    }, [])

    const total = player.questions?.length ?? 0

    return (
        <SkillPlayerShell
            surfaceId="reading"
            worldPropTags={['library']}
            done={0}
            total={total}
            assetLoaded={assetLoaded}
            onRetry={handleRetry}
            labels={labels}
            primaryCtaHref={primaryCtaHref}
        >
            <ReadingPlayerDynamic key={retryNonce} {...player} />
        </SkillPlayerShell>
    )
}
