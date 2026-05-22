import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'

import {
    CourseModuleClusterHeader,
    COURSE_MODULE_ASSET_LOAD_TIMEOUT_MS,
    COURSE_MODULE_DEFAULT_MASCOT_KEY,
    resolveModuleMascotSrc,
} from './course-module-cluster'
import {
    FUXIE_MODULE_MASCOTS,
    PLACEHOLDER_ASSET,
} from '@/lib/mascot/fuxie-assets'
import {
    REWARD_ASSETS,
    getCefrBadgeAssetSrc,
} from '@/components/gamification/reward-assets'

/**
 * Static-contract tests for {@link CourseModuleClusterHeader} (task 9.2).
 *
 * vitest runs in `node` here (no jsdom — see `apps/web/vitest.config.ts`),
 * so we cannot fire `<Image>`’s `onLoad`/`onError` or advance real timers
 * to observe the 3s fallback. Instead, the component exposes
 * `initialMascotStatus` / `initialBadgeStatus` test escape hatches that
 * mirror the same pattern used in `vocabulary-card.tsx`. We use them to
 * render the placeholder branch directly and assert the contract.
 *
 * Validates: Requirements 4.6, 4.7, 4.9, 4.10
 */

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

function countMatches(html: string, pattern: RegExp): number {
    return (html.match(pattern) ?? []).length
}

// -----------------------------------------------------------------------------
// Public constants
// -----------------------------------------------------------------------------

describe('CourseModuleClusterHeader — public constants', () => {
    it('pins the 3s load timeout from Requirement 4.10', () => {
        expect(COURSE_MODULE_ASSET_LOAD_TIMEOUT_MS).toBe(3000)
    })

    it('defaults the cluster mascot to FUXIE_MODULE_MASCOTS.course (design §I.2)', () => {
        expect(COURSE_MODULE_DEFAULT_MASCOT_KEY).toBe('course')
        expect(resolveModuleMascotSrc(undefined)).toBe(FUXIE_MODULE_MASCOTS.course)
    })

    it('resolves a known module mascot key through the registry', () => {
        expect(resolveModuleMascotSrc('reading')).toBe(FUXIE_MODULE_MASCOTS.reading)
        expect(resolveModuleMascotSrc('vocabulary')).toBe(
            FUXIE_MODULE_MASCOTS.vocabulary,
        )
    })

    it('falls through to PLACEHOLDER_ASSET for an unknown key (Req 1.6)', () => {
        expect(resolveModuleMascotSrc('not-a-real-key')).toBe(PLACEHOLDER_ASSET)
    })
})

// -----------------------------------------------------------------------------
// Property 23 — Module Mascot Singleton
// -----------------------------------------------------------------------------

describe('CourseModuleClusterHeader — Property 23 / Requirement 4.9: one mascot per cluster', () => {
    it('emits exactly one `data-cluster-id` on the cluster wrapper', () => {
        const html = renderToStaticMarkup(
            <CourseModuleClusterHeader clusterId="a1-mod-1" label="Begrüßungen" />,
        )
        // Wrapper carries the cluster id; the inner mascot also tags itself
        // with data-cluster-id so DOM queries can pin Property 23. Count
        // the wrapper attribute exactly.
        const matches = html.match(
            /data-role="course-module-cluster"[^>]*data-cluster-id="([^"]+)"/,
        )
        expect(matches, 'cluster wrapper must carry data-cluster-id').not.toBeNull()
        expect(matches![1]).toBe('a1-mod-1')
    })

    it('emits exactly one mascot element (mascot OR placeholder, never both)', () => {
        // Default render — mascot in `loading` state.
        const loadingHtml = renderToStaticMarkup(
            <CourseModuleClusterHeader clusterId="cluster-x" label="Module" />,
        )
        expect(countMatches(loadingHtml, /data-role="course-module-mascot"/g)).toBe(1)
        expect(
            countMatches(loadingHtml, /data-role="course-module-mascot-placeholder"/g),
        ).toBe(0)

        // Forced placeholder branch — same one-element invariant.
        const placeholderHtml = renderToStaticMarkup(
            <CourseModuleClusterHeader
                clusterId="cluster-x"
                label="Module"
                initialMascotStatus="placeholder"
            />,
        )
        expect(
            countMatches(placeholderHtml, /data-role="course-module-mascot"/g),
        ).toBe(0)
        expect(
            countMatches(
                placeholderHtml,
                /data-role="course-module-mascot-placeholder"/g,
            ),
        ).toBe(1)
    })

    it('renders the registry-resolved mascot src for the configured module key', () => {
        const html = renderToStaticMarkup(
            <CourseModuleClusterHeader
                clusterId="reading-cluster"
                label="Reading module"
                mascotKey="reading"
            />,
        )
        const src = FUXIE_MODULE_MASCOTS.reading
        const encoded = encodeURIComponent(src)
        expect(
            html.includes(src) || html.includes(encoded),
            `expected mascot src ${src} (or its encoded form) in markup`,
        ).toBe(true)
    })

    it('does not hardcode a mascot path when the mascot key is unknown — uses PLACEHOLDER_ASSET', () => {
        const html = renderToStaticMarkup(
            <CourseModuleClusterHeader
                clusterId="unknown-cluster"
                label="Unknown module"
                mascotKey="not-a-real-key"
            />,
        )
        const src = PLACEHOLDER_ASSET
        const encoded = encodeURIComponent(src)
        expect(html.includes(src) || html.includes(encoded)).toBe(true)
    })
})

// -----------------------------------------------------------------------------
// Requirement 4.10 — placeholder fallback after 3s / onError
// -----------------------------------------------------------------------------

describe('CourseModuleClusterHeader — Requirement 4.10: placeholder fallback', () => {
    it('renders a neutral placeholder when status flips to "placeholder"', () => {
        const html = renderToStaticMarkup(
            <CourseModuleClusterHeader
                clusterId="cluster-fail"
                label="Module that fails"
                initialMascotStatus="placeholder"
            />,
        )

        expect(html).toContain('data-role="course-module-mascot-placeholder"')
        expect(html).toContain('data-mascot-status="placeholder"')
        // Placeholder tags itself with the same cluster id so DOM queries
        // for "the cluster's mascot slot" still resolve.
        expect(html).toContain('data-cluster-id="cluster-fail"')
    })

    it('does NOT block the rest of the cluster header when the mascot falls back', () => {
        const html = renderToStaticMarkup(
            <CourseModuleClusterHeader
                clusterId="cluster-fail"
                label="Module that fails"
                subtitle="Modul 3"
                showCefrBadge
                cefrLevel="A1"
                initialMascotStatus="placeholder"
            >
                <p data-testid="child">child content</p>
            </CourseModuleClusterHeader>,
        )

        // Cluster label, subtitle, child content, AND the CEFR badge must
        // still render even though the mascot itself is in fallback mode
        // (Req 4.10 — “không block render của node”).
        expect(html).toContain('Module that fails')
        expect(html).toContain('Modul 3')
        expect(html).toContain('child content')
        expect(html).toContain('data-role="course-module-cefr-badge"')
    })

    it('falls back the CEFR badge slot independently of the mascot slot', () => {
        const html = renderToStaticMarkup(
            <CourseModuleClusterHeader
                clusterId="cluster-mixed"
                label="Mixed"
                showCefrBadge
                cefrLevel="A1"
                initialMascotStatus="loaded"
                initialBadgeStatus="placeholder"
            />,
        )

        // Mascot slot stays live ...
        expect(html).toContain('data-role="course-module-mascot"')
        expect(html).toContain('data-mascot-status="loaded"')
        // ... while the badge slot independently shows its placeholder.
        expect(html).toContain('data-role="course-module-cefr-badge-placeholder"')
        expect(html).toContain('data-badge-status="placeholder"')
        expect(html).not.toContain('data-role="course-module-cefr-badge"')
    })
})

// -----------------------------------------------------------------------------
// Requirements 4.6, 4.7 — CEFR badge from getCefrBadgeAssetSrc
// -----------------------------------------------------------------------------

describe('CourseModuleClusterHeader — Requirements 4.6, 4.7: CEFR badge', () => {
    it('renders the CEFR receipt badge from getCefrBadgeAssetSrc when showCefrBadge is true', () => {
        const html = renderToStaticMarkup(
            <CourseModuleClusterHeader
                clusterId="done-cluster"
                label="Done module"
                showCefrBadge
                cefrLevel="A1"
            />,
        )
        expect(html).toContain('data-role="course-module-cefr-badge"')

        const src = getCefrBadgeAssetSrc('A1')
        expect(src).toBe(REWARD_ASSETS.cefrBadgeA1)
        const encoded = encodeURIComponent(src)
        expect(
            html.includes(src) || html.includes(encoded),
            `expected CEFR badge src ${src} (or encoded form) in markup`,
        ).toBe(true)
    })

    it('does NOT render the CEFR badge slot when showCefrBadge is false', () => {
        const html = renderToStaticMarkup(
            <CourseModuleClusterHeader
                clusterId="active-cluster"
                label="Active module"
            />,
        )
        expect(html).not.toContain('data-role="course-module-cefr-badge"')
        expect(html).not.toContain('data-role="course-module-cefr-badge-placeholder"')
    })
})
