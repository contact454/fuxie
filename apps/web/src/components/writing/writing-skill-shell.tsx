'use client'

/**
 * WritingSkillShell — client wrapper that composes `WritingPlayerDynamic`
 * inside the gamified `SkillPlayerShell` (task 11.3 of
 * `gamified-ui-asset-rollout`).
 *
 * Vai chinh: Frontend Engineer
 * Vai phoi hop: Design System Designer (world prop scrim),
 *               Gamification Designer (progress + reward copy)
 *
 * Composition contract:
 *  - Picks the world prop via `pickWorldProp(['desk', 'workshop'])`
 *    (Requirement 6.8) — handled inside `SkillMotivationLayer` via the
 *    shell's `worldPropTags`. The resolved key is one of
 *    `postOffice` / `postOfficeCounter` / `grammarWorkshopInterior`.
 *  - Treats the prompt + rubric metadata as "ready" the moment the
 *    client chunk hydrates: the data was resolved server-side by the
 *    Prisma query in `app/(learn)/writing/[exerciseId]/page.tsx`, so the
 *    only loading we need to gate on is the dynamic chunk mounting. We
 *    flip `assetLoaded` to `true` on the next paint frame via
 *    `requestAnimationFrame` so the shell never observes a "ready before
 *    mounted" race. This mirrors `ReadingSkillShell` (no audio probe is
 *    needed for the writing surface).
 *  - Provides a `retryNonce` to `WritingPlayerDynamic` so taps on
 *    "Thử lại" force a remount of the dynamic chunk (and therefore
 *    re-trigger the loading window). The shell stays mounted around it
 *    so the surface itself never tears down between transitions
 *    (Requirement 6.10).
 *  - Exposes the editor area via the `data-role="skill-content"` wrapper
 *    that `SkillPlayerShell` already renders, so Property 13 (bounding
 *    box disjoint from the motivation layer) is satisfied without any
 *    extra markup at this layer.
 *
 * Validates: Requirements 6.1, 6.2, 6.3, 6.8, 6.10, 6.11, 11.5
 */

import { useCallback, useEffect, useState } from 'react'

import { WritingPlayerDynamic } from '@/components/writing/WritingPlayerDynamic'
import {
    SkillPlayerShell,
    type SkillPlayerShellLabels,
} from '@/components/gamification/skill-player-shell'

type WritingPlayerProps = React.ComponentProps<typeof WritingPlayerDynamic>

export interface WritingSkillShellProps {
    player: WritingPlayerProps
    labels: SkillPlayerShellLabels
    primaryCtaHref?: string
    /**
     * Total checkpoints in the writing quest (plan / draft / revise …).
     * Surfaces this as the `total` value of the motivation layer's
     * progress text. The page resolves the count server-side from
     * `buildWritingQuestCheckpoints(minWords)` so the label renders the
     * same on first paint.
     */
    totalCheckpoints: number
}

export function WritingSkillShell({
    player,
    labels,
    primaryCtaHref,
    totalCheckpoints,
}: WritingSkillShellProps) {
    const [assetLoaded, setAssetLoaded] = useState(false)
    const [retryNonce, setRetryNonce] = useState(0)

    // Mark the surface ready on the first client tick after each mount /
    // remount. The exercise prompt + rubric is already in `player.*` props,
    // so the only thing we wait on is the dynamic chunk hydration (cheap).
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

    return (
        <SkillPlayerShell
            surfaceId="writing"
            worldPropTags={['desk', 'workshop']}
            done={0}
            total={totalCheckpoints}
            assetLoaded={assetLoaded}
            onRetry={handleRetry}
            labels={labels}
            primaryCtaHref={primaryCtaHref}
        >
            <WritingPlayerDynamic key={retryNonce} {...player} />
        </SkillPlayerShell>
    )
}
