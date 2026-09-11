import type { ComponentProps, ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'

import { SkillPlayerShell } from './skill-player-shell'

/**
 * Component contract tests for {@link SkillPlayerShell}.
 * Pure FSM coverage stays in `skill-player-shell.test.ts`.
 *
 * Validates: hideDefaultPrimaryCta backward-compat + error Retry always on.
 */

vi.mock('next/link', () => ({
    default: ({
        children,
        href,
        ...rest
    }: {
        children: ReactNode
        href: string
        [key: string]: unknown
    }) => (
        <a href={href} {...rest}>
            {children}
        </a>
    ),
}))

vi.mock('@/components/gamification/skill-motivation-layer', () => ({
    SkillMotivationLayer: ({
        children,
    }: {
        children?: ReactNode
        [key: string]: unknown
    }) => <div data-role="skill-motivation-layer-stub">{children}</div>,
}))

const baseLabels = {
    primaryCtaLabel: 'Tiếp tục', // locale-allow — test fixture
    primaryCtaAriaLabel: 'Tiếp tục luyện nghe', // locale-allow — test fixture
    retryCtaLabel: 'Thử lại', // locale-allow — test fixture
    fallbackMessage: 'Kiểm tra mạng hoặc quay lại Dashboard.', // locale-allow — test fixture
}

function renderShell(
    props: Partial<ComponentProps<typeof SkillPlayerShell>> = {},
) {
    return renderToStaticMarkup(
        <SkillPlayerShell
            surfaceId="listening"
            worldPropTags={['studio', 'radio']}
            done={0}
            total={3}
            assetLoaded={true}
            labels={baseLabels}
            {...props}
        >
            <div data-role="player-child">player</div>
        </SkillPlayerShell>,
    )
}

describe('SkillPlayerShell — default bottom CTA', () => {
    it('renders the default primary CTA when hideDefaultPrimaryCta is omitted', () => {
        const html = renderShell({ initialPhase: 'ready', assetLoaded: true })
        expect(html).toContain('data-role="skill-player-bottom-cta"')
        expect(html).toContain('data-cta-context="default"')
        expect(html).toContain('Tiếp tục')
        expect(html).toContain('data-role="player-child"')
    })

    it('renders default CTA as Link when primaryCtaHref is provided', () => {
        const html = renderShell({
            initialPhase: 'ready',
            assetLoaded: true,
            primaryCtaHref: '/listening',
        })
        expect(html).toMatch(/href="\/listening"/)
        expect(html).toContain('Tiếp tục')
    })
})

describe('SkillPlayerShell — hideDefaultPrimaryCta', () => {
    it('does not render the default bottom CTA in the DOM when ready', () => {
        const html = renderShell({
            initialPhase: 'ready',
            assetLoaded: true,
            hideDefaultPrimaryCta: true,
            primaryCtaHref: '/listening',
        })
        expect(html).not.toContain('data-role="skill-player-bottom-cta"')
        expect(html).not.toContain('data-cta-context="default"')
        // Label must not appear as a rendered CTA (children stay mounted)
        expect(html).toContain('data-role="player-child"')
        // primary label should not be in a CTA button/link outside motivation
        expect(html).not.toMatch(/data-cta-context="default"[\s\S]*Tiếp tục/)
    })

    it('still renders Retry CTA on asset error even when hideDefaultPrimaryCta', () => {
        const html = renderShell({
            initialPhase: 'error',
            assetLoaded: false,
            assetError: true,
            hideDefaultPrimaryCta: true,
            initialFailureCount: 1,
        })
        expect(html).toContain('data-role="skill-player-bottom-cta"')
        expect(html).toContain('data-cta-context="error"')
        expect(html).toContain('Thử lại')
        expect(html).toContain('data-skill-player-phase="error"')
    })

    it('keeps blocked fallback message + secondary retry when hideDefaultPrimaryCta', () => {
        const html = renderShell({
            initialPhase: 'blocked',
            assetLoaded: false,
            hideDefaultPrimaryCta: true,
            initialFailureCount: 3,
        })
        expect(html).toContain('data-skill-player-phase="blocked"')
        expect(html).toContain('data-role="skill-player-fallback-message"')
        expect(html).toContain('Kiểm tra mạng hoặc quay lại Dashboard.')
        expect(html).toContain('data-role="skill-player-bottom-cta"')
        expect(html).toContain('Thử lại')
    })
})
