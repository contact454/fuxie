import { expect, test, type Page } from '@playwright/test'
import * as fs from 'node:fs'
import * as path from 'node:path'

type ViewportCase = {
    name: 'desktop' | 'mobile'
    width: number
    height: number
}

type Slice3FixtureCase = {
    name: string
    route: string
    routeName: 'badges' | 'dashboard' | 'chat' | 'profile'
    module: '12-rewards' | '13-missions' | '14-chat' | '15-profile'
    visualState: 'success' | 'empty' | 'loading'
    stateSelector: string
    expectedPrimaryCtas: number
    extraCheck?: (page: Page) => Promise<void>
}

const VIEWPORTS: ViewportCase[] = [
    { name: 'desktop', width: 1440, height: 900 },
    { name: 'mobile', width: 390, height: 844 },
]

const SCREENSHOT_DIR = path.resolve(
    __dirname,
    '..',
    '..',
    'tmp',
    'browser-qa',
    'slice-3-motivation-fixtures',
)

const FIXTURES: Slice3FixtureCase[] = [
    {
        name: 'rewards badge unlock',
        route: '/badges?state=success&fixture=visual-qa',
        routeName: 'badges',
        module: '12-rewards',
        visualState: 'success',
        stateSelector: '[data-role="rewards-badge-unlock-state"]',
        expectedPrimaryCtas: 1,
        extraCheck: async (page) => {
            await expect(page.locator('[data-role="badge-unlock-reveal"]')).toContainText('+1')
        },
    },
    {
        name: 'missions complete',
        route: '/dashboard?state=empty&fixture=visual-qa&module=missions',
        routeName: 'dashboard',
        module: '13-missions',
        visualState: 'empty',
        stateSelector: '[data-role="missions-complete-empty-state"]',
        expectedPrimaryCtas: 1,
        extraCheck: async (page) => {
            await expect(page.locator('[data-role="mission-board-complete"]')).toContainText('3/3')
        },
    },
    {
        name: 'chat typing',
        route: '/chat?state=loading&fixture=visual-qa',
        routeName: 'chat',
        module: '14-chat',
        visualState: 'loading',
        stateSelector: '[data-role="chat-typing-loading-state"]',
        expectedPrimaryCtas: 1,
        extraCheck: async (page) => {
            await expect(page.locator('[data-role="tutor-typing-indicator"]')).toBeVisible()
            await expect(page.locator('[data-role="tutor-typing-indicator"]')).toHaveAttribute('aria-live', 'polite')
        },
    },
    {
        name: 'profile goal updated',
        route: '/profile?state=success&fixture=visual-qa',
        routeName: 'profile',
        module: '15-profile',
        visualState: 'success',
        stateSelector: '[data-role="profile-goal-updated-state"]',
        expectedPrimaryCtas: 1,
        extraCheck: async (page) => {
            await expect(page.locator('[data-role="profile-avatar-goal-card"]')).toContainText('Lina Nguyen')
        },
    },
]

test.use({ deviceScaleFactor: 1 })

test.describe('Slice 3 motivation visual QA fixtures', () => {
    test.beforeAll(() => {
        fs.mkdirSync(SCREENSHOT_DIR, { recursive: true })
    })

    for (const fixture of FIXTURES) {
        for (const viewport of VIEWPORTS) {
            test(`${fixture.name} @ ${viewport.name}`, async ({ page }) => {
                await page.setViewportSize({
                    width: viewport.width,
                    height: viewport.height,
                })

                await page.goto(fixture.route, { waitUntil: 'networkidle' })
                await hideDevOverlay(page)

                const route = page.locator(`[data-route="${fixture.routeName}"]`)
                await expect(route).toBeVisible()
                await expect(route).toHaveAttribute('data-slice', 'slice-3')
                await expect(route).toHaveAttribute('data-module', fixture.module)
                await expect(route).toHaveAttribute('data-visual-state', fixture.visualState)
                await expect(page.locator(fixture.stateSelector)).toBeVisible()

                await expect(route.locator('[data-role="primary-cta"]')).toHaveCount(fixture.expectedPrimaryCtas)
                await expectNoHorizontalOverflow(page)

                if (viewport.name === 'mobile') {
                    await expectVisibleHeaderAtMost(page, 64)
                }

                await fixture.extraCheck?.(page)

                await page.screenshot({
                    path: path.join(SCREENSHOT_DIR, `${fixture.module}-${fixture.visualState}-${viewport.name}.png`),
                })
            })
        }
    }
})

async function hideDevOverlay(page: Page) {
    await page.addStyleTag({
        content: `
            nextjs-portal,
            [data-nextjs-portal],
            .nextjs-toast-errors-parent,
            #react-devtools-anchor,
            next-route-announcer,
            #__next-prerender-indicator {
                display: none !important;
                visibility: hidden !important;
                opacity: 0 !important;
                pointer-events: none !important;
            }
        `,
    })
}

async function expectNoHorizontalOverflow(page: Page) {
    const overflow = await page.evaluate(() => ({
        html: document.documentElement.scrollWidth > window.innerWidth,
        body: document.body.scrollWidth > window.innerWidth,
        htmlScrollWidth: document.documentElement.scrollWidth,
        bodyScrollWidth: document.body.scrollWidth,
        viewportWidth: window.innerWidth,
    }))

    expect(overflow, JSON.stringify(overflow)).toMatchObject({
        html: false,
        body: false,
    })
}

async function expectVisibleHeaderAtMost(page: Page, maxHeight: number) {
    const height = await page.evaluate(() => {
        const visibleHeaders = [...document.querySelectorAll('header')]
            .map((header) => header.getBoundingClientRect())
            .filter((box) => box.width > 0 && box.height > 0)
            .map((box) => Math.round(box.height))

        return visibleHeaders.length ? Math.max(...visibleHeaders) : 0
    })

    expect(height).toBeLessThanOrEqual(maxHeight)
}
