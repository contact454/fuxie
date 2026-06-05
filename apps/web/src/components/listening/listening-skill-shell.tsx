'use client'

/**
 * ListeningSkillShell — client wrapper that composes
 * `LessonPlayerDynamic` inside the gamified `SkillPlayerShell` (task 11.1
 * of `gamified-ui-asset-rollout`).
 *
 * Vai chinh: Frontend Engineer
 * Vai phoi hop: Design System Designer (world prop scrim),
 *               Gamification Designer (progress + reward copy)
 *
 * Composition contract:
 *  - Picks the world prop via `pickWorldProp(['studio', 'radio'])`
 *    (Req 6.5) — handled inside `SkillMotivationLayer` through the shell's
 *    `worldPropTags`.
 *  - Mounts a hidden `<audio preload="metadata">` probe bound to the same
 *    `audioUrl` as the inner player so the shell can flip
 *    `assetLoaded` / `assetError` from real network events:
 *      - `loadedmetadata` ⇒ `assetLoaded = true`
 *      - `error`          ⇒ `assetError  = true` (short-circuits the timer)
 *    The probe lives next to the player; the inner `LessonPlayer` has its
 *    own `<audio ref={…}>` that drives playback. The two `<audio>` tags // locale-allow
 *    share the URL so the browser cache satisfies both with one request.
 *  - On retry, increments `retryNonce` so the dynamic chunk remounts AND
 *    the probe re-fires its load/error events. The shell stays mounted
 *    around it so progress that lives in the inner player (answers,
 *    question index) is preserved across the FSM transition (Req 6.10).
 *
 * Validates: Requirements 6.1, 6.2, 6.3, 6.5, 6.10, 6.11, 11.5
 */

import { useCallback, useEffect, useRef, useState } from 'react'

import { LessonPlayerDynamic } from '@/components/listening/LessonPlayerDynamic'
import {
    SkillPlayerShell,
    type SkillPlayerShellLabels,
} from '@/components/gamification/skill-player-shell'

type LessonPlayerProps = React.ComponentProps<typeof LessonPlayerDynamic>

export interface ListeningSkillShellProps {
    player: LessonPlayerProps
    labels: SkillPlayerShellLabels
    primaryCtaHref?: string
}

export function ListeningSkillShell({
    player,
    labels,
    primaryCtaHref,
}: ListeningSkillShellProps) {
    const probeRef = useRef<HTMLAudioElement | null>(null)
    const [assetLoaded, setAssetLoaded] = useState(false)
    const [assetError, setAssetError] = useState(false)
    const [retryNonce, setRetryNonce] = useState(0)

    // Reset signals every time the learner taps "Thử lại" so the FSM
    // starts a fresh 10-second window around the new probe load attempt.
    useEffect(() => {
        setAssetLoaded(false)
        setAssetError(false)

        const audio = probeRef.current
        if (!audio) return

        const onLoaded = () => {
            setAssetError(false)
            setAssetLoaded(true)
        }
        const onError = () => {
            setAssetError(true)
        }

        audio.addEventListener('loadedmetadata', onLoaded)
        audio.addEventListener('canplaythrough', onLoaded)
        audio.addEventListener('error', onError)

        // Force a fresh load attempt on retry (browser may have cached the
        // previous error). Calling load() is safe even on initial mount.
        try {
            audio.load()
        } catch {
            // Defensive: some browsers throw if the element was just torn
            // down. The loadedmetadata listener is still attached, so a
            // subsequent natural load will resolve the probe.
        }

        return () => {
            audio.removeEventListener('loadedmetadata', onLoaded)
            audio.removeEventListener('canplaythrough', onLoaded)
            audio.removeEventListener('error', onError)
        }
    }, [retryNonce, player.audioUrl])

    const handleRetry = useCallback(() => {
        setRetryNonce(n => n + 1)
    }, [])

    const total = player.questions?.length ?? 0

    return (
        <SkillPlayerShell
            surfaceId="listening"
            worldPropTags={['studio', 'radio']}
            done={0}
            total={total}
            assetLoaded={assetLoaded}
            assetError={assetError}
            onRetry={handleRetry}
            labels={labels}
            primaryCtaHref={primaryCtaHref}
        >
            {/*
              Hidden audio probe — drives the shell's assetLoaded / assetError
              FSM inputs from real network events without coupling the
              inner LessonPlayer's playback `<audio>`.
            */}
            <audio
                ref={probeRef}
                src={player.audioUrl}
                preload="metadata"
                aria-hidden="true"
                tabIndex={-1}
                style={{ display: 'none' }}
                data-role="listening-asset-probe"
            />
            <LessonPlayerDynamic key={retryNonce} {...player} />
        </SkillPlayerShell>
    )
}
