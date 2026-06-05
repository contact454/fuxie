/**
 * Original Fuxie code (no Mykonos lift). Server Component entry point for
 * the internal `/fuxie-world-lab` route.
 *
 * Validates: Requirements 1.1, 1.2, 1.7, 4.1, 4.2.
 *
 * Responsibilities:
 * - Build the demo `WorldScene` via the pure `buildLabScene()` helper at
 *   request time (Requirement 1.2: scene composition is server-side).
 * - Render exactly one `<LearningWorldCanvas scene={scene} />`. The
 *   canvas component owns `<HotspotList>`; this page MUST NOT render an
 *   additional copy (Requirement 4.1).
 * - Emit an inline `<noscript>` block describing the route purpose and
 *   listing scene destinations so non-JS clients (Requirement 4.2) and
 *   accessibility tooling see the same destinations the canvas will
 *   surface after hydration.
 *
 * Routing:
 * - Reachable unauthenticated by direct URL `/fuxie-world-lab`
 *   (Requirement 1.1). The route is not gated by any feature flag; the
 *   parent `layout.tsx` already attaches `robots: { index: false }` so
 *   the page stays out of search indexes (Requirement 1.7).
 *
 * Owner: Frontend Engineer.
 * Co-author: QA Automation Engineer (no-JS verification).
 */

import { LearningWorldCanvas } from '@/components/learning-world/LearningWorldCanvas'

import { buildLabAssetSrcMap, buildLabScene } from './lab-scene'

/**
 * Server-rendered page. No `'use client'` directive — Next.js App Router
 * defaults this file to a Server Component, so `buildLabScene()` runs on
 * the server and the resulting `WorldScene` is serialized into the props
 * of the (Client) `LearningWorldCanvas`.
 */
export default function FuxieWorldLabPage(): React.ReactElement {
    const scene = buildLabScene()
    // Resolve all asset URLs server-side. Plain `Record<string, string>`
    // crosses the Server Component → Client Component boundary cleanly;
    // a function reference would not (Next.js App Router boundary rule).
    const imageSrcMap = buildLabAssetSrcMap(scene)

    // Stable list of accessible destinations the canvas will expose via
    // `<HotspotList>` after hydration. We compute it server-side so the
    // `<noscript>` fallback enumerates the exact same `WorldObject`s.
    const destinations = scene.objects.filter(
        (o) => typeof o.ariaLabel === 'string' && o.ariaLabel.length > 0,
    )

    return (
        <main>
            <LearningWorldCanvas scene={scene} imageSrcMap={imageSrcMap} />
            <noscript>
                <h1>{"Fuxie Learning World preview scene" /* // locale-allow */}</h1>
                <p>
                    This route is an internal engineering proof of the
                    Fuxie Learning World canvas. JavaScript is required
                    to interact with the isometric scene, but the
                    destinations below are always reachable.
                </p>
                <p>Scene destinations:</p>
                <ul>
                    {destinations.map((o) => (
                        <li key={o.id}>
                            {typeof o.href === 'string' && o.href.length > 0 ? (
                                <a href={o.href}>{o.ariaLabel}</a>
                            ) : (
                                o.ariaLabel
                            )}
                        </li>
                    ))}
                </ul>
            </noscript>
        </main>
    )
}
