import { expect, test, type Page } from '@playwright/test'
import * as fs from 'node:fs'
import * as path from 'node:path'

type ViewportCase = {
    name: 'desktop' | 'mobile'
    width: number
    height: number
}

type Slice4FixtureCase = {
    name: string
    route: string
    routeName: 'teacher' | 'admin'
    module: '16-teacher' | '17-admin'
    visualState: 'error' | 'empty'
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
    'slice-4-staff-fixtures',
)

const FIXTURES: Slice4FixtureCase[] = [
    {
        name: 'teacher overdue assignment',
        route: '/teacher?state=error&fixture=visual-qa',
        routeName: 'teacher',
        module: '16-teacher',
        visualState: 'error',
        stateSelector: '[data-role="teacher-overdue-assignment-state"]',
        expectedPrimaryCtas: 1,
        extraCheck: async (page) => {
            await expect(page.locator('[data-role="teacher-overdue-dialog"]')).toHaveAttribute('role', 'alertdialog')
            await expect(page.locator('[data-role="teacher-roster-overdue-list"]')).toContainText('Mai Tran')
        },
    },
    {
        name: 'admin filtered empty',
        route: '/admin?state=empty&fixture=visual-qa',
        routeName: 'admin',
        module: '17-admin',
        visualState: 'empty',
        stateSelector: '[data-role="admin-filtered-empty-state"]',
        expectedPrimaryCtas: 1,
        extraCheck: async (page) => {
            await expect(page.locator('[data-role="admin-filter-rail"]')).toBeVisible()
            await expect(page.locator('[data-role="admin-user-table-empty"]')).toContainText('No matching users.')
        },
    },
]

test.use({ deviceScaleFactor: 1 })

test.describe('Slice 4 staff visual QA fixtures', () => {
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
                await expect(route).toHaveAttribute('data-slice', 'slice-4')
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
