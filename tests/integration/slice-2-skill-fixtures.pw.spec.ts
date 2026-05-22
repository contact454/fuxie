import { expect, test, type Page } from '@playwright/test'
import * as fs from 'node:fs'
import * as path from 'node:path'

type ViewportCase = {
    name: 'desktop' | 'mobile'
    width: number
    height: number
}

type Slice2FixtureCase = {
    name: string
    route: string
    routeName:
        | 'vocabulary'
        | 'grammar'
        | 'listening'
        | 'speaking'
        | 'reading'
        | 'writing'
        | 'exam'
    module: string
    visualState: 'success' | 'error' | 'loading' | 'timeout'
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
    'slice-2-skill-fixtures',
)

const FIXTURES: Slice2FixtureCase[] = [
    {
        name: 'vocabulary success',
        route: '/vocabulary?state=success&fixture=visual-qa',
        routeName: 'vocabulary',
        module: '05-vocabulary',
        visualState: 'success',
        stateSelector: '[data-role="vocabulary-success-state"]',
        expectedPrimaryCtas: 1,
        extraCheck: async (page) => {
            await expect(page.locator('[data-role="vocabulary-mastery-counter"]')).toContainText('10')
        },
    },
    {
        name: 'grammar error',
        route: '/grammar/akkusativ-dativ/visual-lesson?state=error&fixture=visual-qa',
        routeName: 'grammar',
        module: '06-grammar',
        visualState: 'error',
        stateSelector: '[data-role="grammar-error-state"]',
        expectedPrimaryCtas: 1,
        extraCheck: async (page) => {
            await expect(page.locator('[data-role="grammar-diagram"]')).toBeVisible()
            await expect(page.locator('[data-role="grammar-error-feedback"]')).toBeVisible()
        },
    },
    {
        name: 'listening loading',
        route: '/listening/visual-audio-loading?state=loading&fixture=visual-qa',
        routeName: 'listening',
        module: '07-listening',
        visualState: 'loading',
        stateSelector: '[data-role="listening-loading-state"]',
        expectedPrimaryCtas: 1,
        extraCheck: async (page) => {
            await expect(page.locator('[data-role="waveform-player"]')).toHaveAttribute('aria-busy', 'true')
        },
    },
    {
        name: 'speaking error',
        route: '/speaking/visual-pronunciation?state=error&fixture=visual-qa',
        routeName: 'speaking',
        module: '08-speaking',
        visualState: 'error',
        stateSelector: '[data-role="speaking-error-state"]',
        expectedPrimaryCtas: 1,
        extraCheck: async (page) => {
            await expect(page.locator('[data-role="pronunciation-meter"]')).toContainText('42%')
        },
    },
    {
        name: 'reading success',
        route: '/reading/visual-comprehension?state=success&fixture=visual-qa',
        routeName: 'reading',
        module: '09-reading',
        visualState: 'success',
        stateSelector: '[data-role="reading-success-state"]',
        expectedPrimaryCtas: 1,
        extraCheck: async (page) => {
            await expect(page.locator('[data-role="reading-comprehension-success"]')).toContainText('86%')
        },
    },
    {
        name: 'writing error',
        route: '/writing/visual-structure?state=error&fixture=visual-qa',
        routeName: 'writing',
        module: '10-writing',
        visualState: 'error',
        stateSelector: '[data-role="writing-error-state"]',
        expectedPrimaryCtas: 1,
        extraCheck: async (page) => {
            await expect(page.locator('[data-role="editor-canvas"]')).toBeVisible()
            await expect(page.locator('[data-role="writing-structure-feedback"]')).toContainText('Closing sentence missing')
        },
    },
    {
        name: 'exam timeout',
        route: '/exam/visual-a2?state=timeout&fixture=visual-qa',
        routeName: 'exam',
        module: '11-exam',
        visualState: 'timeout',
        stateSelector: '[data-role="exam-timeout-state"]',
        expectedPrimaryCtas: 1,
        extraCheck: async (page) => {
            await expect(page.locator('[data-role="exam-timeout-dialog"]')).toBeVisible()
            await expect(page.locator('[data-role="exam-timeout-dialog"]')).toHaveAttribute('role', 'alertdialog')
        },
    },
]

test.use({ deviceScaleFactor: 1 })

test.describe('Slice 2 skill visual QA fixtures', () => {
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
                await expect(route).toHaveAttribute('data-slice', 'slice-2')
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
                    path: path.join(SCREENSHOT_DIR, `${fixture.routeName}-${fixture.visualState}-${viewport.name}.png`),
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
