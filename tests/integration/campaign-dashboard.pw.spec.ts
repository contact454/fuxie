import { expect, test, type Page } from '@playwright/test'
import * as fs from 'node:fs'
import * as path from 'node:path'
import dotenv from 'dotenv'

// Load environment variables from workspace root .env
dotenv.config({ path: path.resolve(__dirname, '..', '..', '.env') })

const OUT_DIR = process.env.FUXIE_QA_OUT_DIR
    ? path.resolve(process.env.FUXIE_QA_OUT_DIR)
    : path.resolve(__dirname, '..', '..', 'tmp', 'browser-qa', 'campaign-dashboard')

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

test.describe('Campaign Map and Dashboard Modules E2E & Visual Verification', () => {
    test.beforeAll(async () => {
        if (!fs.existsSync(OUT_DIR)) {
            fs.mkdirSync(OUT_DIR, { recursive: true })
        }
    })

    // Force Vietnamese locale using cookie
    test.beforeEach(async ({ context, page }) => {
        page.on('console', msg => {
            console.log(`[PAGE LOG] [${msg.type()}] ${msg.text()}`)
        })
        page.on('pageerror', err => {
            console.error(`[PAGE ERROR] ${err.stack || err.message}`)
        })

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
        // CAMPAIGN MAP TESTS
        // =====================================================================

        test(`Verify Campaign Map Default Fixture on ${vp.name}`, async ({ page }) => {
            await page.setViewportSize({ width: vp.width, height: vp.height })

            // Go to campaign page under visual-qa fixture default state
            await page.goto('/campaign?fixture=visual-qa&state=default')
            await page.waitForLoadState('networkidle')
            await hideDevOverlay(page)

            // Verify header title and description are visible
            await expect(page.locator('h1')).toContainText(/Di qua mot hanh trinh tieng Duc co node ro rang/i)
            
            // Progress should be 0/5
            await expect(page.locator('p', { hasText: '0/5' })).toBeVisible()

            // Verify no horizontal overflow
            await expectNoHorizontalOverflow(page)

            // Save screenshot
            const screenshotPath = path.join(OUT_DIR, `campaign-default-${vp.name}.png`)
            await page.screenshot({ path: screenshotPath })
            console.log(`Saved campaign default screenshot: ${screenshotPath}`)
        })

        test(`Verify Campaign Map In-Progress Fixture on ${vp.name}`, async ({ page }) => {
            await page.setViewportSize({ width: vp.width, height: vp.height })

            // Go to campaign page under visual-qa fixture in-progress state
            await page.goto('/campaign?fixture=visual-qa&state=in-progress')
            await page.waitForLoadState('networkidle')
            await hideDevOverlay(page)

            // Progress should be 2/5
            await expect(page.locator('p', { hasText: '2/5' })).toBeVisible()

            // Node 1 and Node 2 should be Cleared, Node 3 In progress, Node 4 and 5 Available
            const clearedBadges = page.locator('span', { hasText: 'Cleared' })
            await expect(clearedBadges).toHaveCount(2)

            const inProgressBadges = page.locator('span', { hasText: 'In progress' })
            await expect(inProgressBadges).toHaveCount(1)

            const availableBadges = page.locator('span', { hasText: 'Available' })
            await expect(availableBadges).toHaveCount(2)

            // Verify no horizontal overflow
            await expectNoHorizontalOverflow(page)

            // Save screenshot
            const screenshotPath = path.join(OUT_DIR, `campaign-inprogress-${vp.name}.png`)
            await page.screenshot({ path: screenshotPath })
            console.log(`Saved campaign in-progress screenshot: ${screenshotPath}`)
        })

        test(`Verify Campaign Map Completed Fixture on ${vp.name}`, async ({ page }) => {
            await page.setViewportSize({ width: vp.width, height: vp.height })

            // Go to campaign page under visual-qa fixture completed state
            await page.goto('/campaign?fixture=visual-qa&state=completed')
            await page.waitForLoadState('networkidle')
            await hideDevOverlay(page)

            // Progress should be 5/5
            await expect(page.locator('p', { hasText: '5/5' })).toBeVisible()

            // All 5 nodes should be Cleared
            const clearedBadges = page.locator('span', { hasText: 'Cleared' })
            await expect(clearedBadges).toHaveCount(5)

            // Verify no horizontal overflow
            await expectNoHorizontalOverflow(page)

            // Save screenshot
            const screenshotPath = path.join(OUT_DIR, `campaign-completed-${vp.name}.png`)
            await page.screenshot({ path: screenshotPath })
            console.log(`Saved campaign completed screenshot: ${screenshotPath}`)
        })

        // =====================================================================
        // DASHBOARD TESTS
        // =====================================================================

        test(`Verify Dashboard Default Fixture on ${vp.name}`, async ({ page }) => {
            await page.setViewportSize({ width: vp.width, height: vp.height })

            // Go to dashboard page under visual-qa fixture default state
            await page.goto('/dashboard?fixture=visual-qa')
            await page.waitForLoadState('networkidle')
            await hideDevOverlay(page)

            // Verify Backbone Hero is rendered and visible
            const backboneHero = page.locator('[data-role="dashboard-backbone-hero"]')
            await expect(backboneHero).toBeVisible()
            
            // Check that the greeting has user display name from visual qa data
            await expect(backboneHero.locator('[data-role="dashboard-greeting"]')).toContainText(/Lina Nguyen/i)

            // Verify no horizontal overflow
            await expectNoHorizontalOverflow(page)

            // Save screenshot
            const screenshotPath = path.join(OUT_DIR, `dashboard-default-${vp.name}.png`)
            await page.screenshot({ path: screenshotPath })
            console.log(`Saved dashboard default screenshot: ${screenshotPath}`)
        })

        test(`Verify Dashboard Empty Fixture on ${vp.name}`, async ({ page }) => {
            await page.setViewportSize({ width: vp.width, height: vp.height })

            // Go to dashboard page under visual-qa fixture empty state
            await page.goto('/dashboard?fixture=visual-qa&state=empty')
            await page.waitForLoadState('networkidle')
            await hideDevOverlay(page)

            // Verify Backbone Hero is rendered in empty state
            const backboneHero = page.locator('[data-role="dashboard-backbone-hero"]')
            await expect(backboneHero).toBeVisible()
            await expect(backboneHero).toHaveAttribute('data-surface-state', 'empty')

            // Verify empty state detail panel is visible
            const emptyStatePanel = page.locator('[data-role="dashboard-empty-state"]')
            await expect(emptyStatePanel).toBeVisible()

            // Verify no horizontal overflow
            await expectNoHorizontalOverflow(page)

            // Save screenshot
            const screenshotPath = path.join(OUT_DIR, `dashboard-empty-${vp.name}.png`)
            await page.screenshot({ path: screenshotPath })
            console.log(`Saved dashboard empty screenshot: ${screenshotPath}`)
        })
    }
})
