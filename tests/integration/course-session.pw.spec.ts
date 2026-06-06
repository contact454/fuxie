import { expect, test, type Page } from '@playwright/test'
import * as fs from 'node:fs'
import * as path from 'node:path'
import dotenv from 'dotenv'

// Load environment variables from workspace root .env
dotenv.config({ path: path.resolve(__dirname, '..', '..', '.env') })

const OUT_DIR = process.env.FUXIE_QA_OUT_DIR
    ? path.resolve(process.env.FUXIE_QA_OUT_DIR)
    : path.resolve(__dirname, '..', '..', 'tmp', 'browser-qa', 'course-session')

// Force deviceScaleFactor to 1 globally for visual screenshots matching physical resolution
test.use({ deviceScaleFactor: 1 })

async function hideDevOverlay(page: Page) {
    try {
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
    } catch (e) {
        console.warn('Could not inject hideDevOverlay style:', e)
    }
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

test.describe('Course (Syllabus) and Daily Session Modules E2E & Visual Verification', () => {
    test.beforeAll(async () => {
        if (!fs.existsSync(OUT_DIR)) {
            fs.mkdirSync(OUT_DIR, { recursive: true })
        }
    })

    // Force Vietnamese locale using cookie
    test.beforeEach(async ({ context }) => {
        await context.addCookies([{
            name: 'NEXT_LOCALE',
            value: 'vi',
            url: 'http://localhost:3005',
        }])
    })

    const viewports = [
        { name: 'desktop', width: 1440, height: 900 },
        { name: 'mobile', width: 390, height: 844 }
    ]

    for (const vp of viewports) {
        // =====================================================================
        // COURSE SYLLABUS TESTS
        // =====================================================================

        test(`Verify Course Default State on ${vp.name}`, async ({ page }) => {
            await page.setViewportSize({ width: vp.width, height: vp.height })

            // Go to course page under visual-qa fixture default state
            await page.goto('/course?fixture=visual-qa&state=default&level=A1')
            await page.waitForLoadState('networkidle')
            await hideDevOverlay(page)

            // Verify course title and main structure
            await expect(page.locator('h1')).toContainText('Deutsch A1 Kurs')
            await expect(page.locator('h2', { hasText: 'Thema 1 (A1)' }).first()).toBeVisible()

            // Verify level selector works and preserves fixture parameters
            const selector = page.locator('[data-role="course-level-selector"]')
            await expect(selector).toBeVisible()
            
            const a2Link = selector.locator('a', { hasText: 'A2' })
            const href = await a2Link.getAttribute('href')
            expect(href).toContain('fixture=visual-qa')
            expect(href).toContain('state=default')
            expect(href).toContain('level=A2')

            // Verify no horizontal overflow
            await expectNoHorizontalOverflow(page)

            // Save screenshot
            const screenshotPath = path.join(OUT_DIR, `course-default-${vp.name}.png`)
            await page.screenshot({ path: screenshotPath })
            console.log(`Saved course default screenshot: ${screenshotPath}`)
        })

        test(`Verify Course Loading State on ${vp.name}`, async ({ page }) => {
            await page.setViewportSize({ width: vp.width, height: vp.height })

            // Go to course page under visual-qa fixture loading state
            await page.goto('/course?fixture=visual-qa&state=loading&level=A1')
            await page.waitForLoadState('networkidle')
            await hideDevOverlay(page)

            // Verify loading skeleton role/data markers
            await expect(page.locator('[data-role="course-loading-state"]')).toBeVisible()

            // Verify no horizontal overflow
            await expectNoHorizontalOverflow(page)

            // Save screenshot
            const screenshotPath = path.join(OUT_DIR, `course-loading-${vp.name}.png`)
            await page.screenshot({ path: screenshotPath })
            console.log(`Saved course loading screenshot: ${screenshotPath}`)
        })

        test(`Verify Course Empty State on ${vp.name}`, async ({ page }) => {
            await page.setViewportSize({ width: vp.width, height: vp.height })

            // Go to course page under visual-qa fixture empty state
            await page.goto('/course?fixture=visual-qa&state=empty&level=A1')
            await page.waitForLoadState('networkidle')
            await hideDevOverlay(page)

            // Verify empty StateShell mascot and CTA
            const shell = page.locator('[data-role="state-shell"][data-surface-state="empty"]')
            await expect(shell).toBeVisible()
            
            // Check that the level pivot below is rendered and preserves visual-qa
            const selector = page.locator('[data-role="course-level-selector"]')
            await expect(selector).toBeVisible()
            const a2Link = selector.locator('a', { hasText: 'A2' })
            const href = await a2Link.getAttribute('href')
            expect(href).toContain('fixture=visual-qa')
            expect(href).toContain('state=empty')

            // Verify no horizontal overflow
            await expectNoHorizontalOverflow(page)

            // Save screenshot
            const screenshotPath = path.join(OUT_DIR, `course-empty-${vp.name}.png`)
            await page.screenshot({ path: screenshotPath })
            console.log(`Saved course empty screenshot: ${screenshotPath}`)
        })

        // =====================================================================
        // DAILY SESSION TESTS
        // =====================================================================

        test(`Verify Session Default State on ${vp.name}`, async ({ page }) => {
            await page.setViewportSize({ width: vp.width, height: vp.height })

            // Go to session page under visual-qa fixture default state
            await page.goto('/session?fixture=visual-qa')
            await page.waitForLoadState('networkidle')
            await hideDevOverlay(page)

            // Verify visual elements on the session screen (e.g. check for term or points)
            await expect(page.getByText('der Termin')).toBeVisible()

            // Verify no horizontal overflow
            await expectNoHorizontalOverflow(page)

            // Save screenshot
            const screenshotPath = path.join(OUT_DIR, `session-default-${vp.name}.png`)
            await page.screenshot({ path: screenshotPath })
            console.log(`Saved session default screenshot: ${screenshotPath}`)
        })

        test(`Verify Session Success State on ${vp.name}`, async ({ page }) => {
            await page.setViewportSize({ width: vp.width, height: vp.height })

            // Go to session page under visual-qa fixture success state
            await page.goto('/session?fixture=visual-qa&state=success')
            await page.waitForLoadState('networkidle')
            await hideDevOverlay(page)

            // Verify success screen congratulations content
            await expect(page.getByText('Hoàn thành bài học!')).toBeVisible()

            // Verify no horizontal overflow
            await expectNoHorizontalOverflow(page)

            // Save screenshot
            const screenshotPath = path.join(OUT_DIR, `session-success-${vp.name}.png`)
            await page.screenshot({ path: screenshotPath })
            console.log(`Saved session success screenshot: ${screenshotPath}`)
        })
    }
})
