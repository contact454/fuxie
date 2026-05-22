import { expect, test, type Page } from '@playwright/test'
import * as fs from 'node:fs'
import * as path from 'node:path'

type ViewportCase = {
    name: 'desktop' | 'mobile'
    width: number
    height: number
}

type SliceFixtureCase = {
    name: string
    route: string
    routeName: 'dashboard' | 'course' | 'session' | 'review'
    visualState: 'empty' | 'loading' | 'success'
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
    'slice-1-visual-fixtures',
)

const FIXTURES: SliceFixtureCase[] = [
    {
        name: 'dashboard empty',
        route: '/dashboard?state=empty&fixture=visual-qa',
        routeName: 'dashboard',
        visualState: 'empty',
        stateSelector: '[data-role="dashboard-empty-state"]',
        expectedPrimaryCtas: 1,
        extraCheck: async (page) => {
            await expect(page.locator('[data-role="dashboard-primary-task"]')).toBeVisible()
            await expect(page.locator('[data-role="dashboard-slice-1-surface"]')).toHaveAttribute('data-visual-state', 'empty')
        },
    },
    {
        name: 'course loading',
        route: '/course?state=loading&fixture=visual-qa&level=A2',
        routeName: 'course',
        visualState: 'loading',
        stateSelector: '[data-role="course-loading-state"]',
        expectedPrimaryCtas: 0,
        extraCheck: async (page) => {
            await expect(page.locator('[data-role="course-level-selector"] a')).toHaveCount(6)
            await expect(page.locator('[data-role="course-loading-card"]')).toHaveCount(6)
            await expect(page.locator('[data-role="course-loading-path"]')).toBeVisible()
        },
    },
    {
        name: 'session success',
        route: '/session?state=success&fixture=visual-qa&level=A1',
        routeName: 'session',
        visualState: 'success',
        stateSelector: '[data-role="session-success-state"]',
        expectedPrimaryCtas: 1,
        extraCheck: async (page) => {
            await expect(page.locator('[data-role="session-success-state"]')).toHaveAttribute('data-visual-state', 'success')
            await expect(page.getByRole('heading', { name: /Lektion geschafft/i })).toBeVisible()
        },
    },
    {
        name: 'review empty',
        route: '/review?state=empty&fixture=visual-qa',
        routeName: 'review',
        visualState: 'empty',
        stateSelector: '[data-role="review-empty-state"]',
        expectedPrimaryCtas: 1,
        extraCheck: async (page) => {
            await expect(page.locator('[data-role="review-backbone-hero"]')).toHaveAttribute('data-surface-state', 'empty')
            await expect(page.locator('[data-role="review-counter-value"]')).toHaveText(['0', '0'])
        },
    },
]

test.use({ deviceScaleFactor: 1 })

test.describe('Slice 1 visual QA fixtures', () => {
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
                await expect(route).toHaveAttribute('data-slice', 'slice-1')
                await expect(route).toHaveAttribute('data-visual-state', fixture.visualState)
                await expect(page.locator(fixture.stateSelector)).toBeVisible()

                await expect(route.locator('[data-role="primary-cta"]')).toHaveCount(fixture.expectedPrimaryCtas)
                await expectNoHorizontalOverflow(page)

                if (fixture.routeName === 'dashboard' && viewport.name === 'mobile') {
                    await expectVisibleHeaderAtMost(page, 64)
                }
                if (fixture.routeName === 'session' && viewport.name === 'mobile') {
                    await expectVisibleHeaderAtMost(page, 64)
                }

                await fixture.extraCheck?.(page)

                await page.screenshot({
                    path: path.join(SCREENSHOT_DIR, `${fixture.routeName}-${fixture.visualState}-${viewport.name}.png`),
                    fullPage: true,
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
