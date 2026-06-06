import { expect, test, type Page } from '@playwright/test'
import * as fs from 'node:fs'
import * as path from 'node:path'
import dotenv from 'dotenv'

// Load environment variables from workspace root .env
dotenv.config({ path: path.resolve(__dirname, '..', '..', '.env') })

const OUT_DIR = process.env.FUXIE_QA_OUT_DIR
    ? path.resolve(process.env.FUXIE_QA_OUT_DIR)
    : path.resolve(__dirname, '..', '..', 'tmp', 'browser-qa', 'profile-onboarding')

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

test.describe('Profile and Onboarding Modules E2E & Visual Verification', () => {
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
        // PROFILE TESTS
        // =====================================================================

        test(`Verify Profile Default Fixture on ${vp.name}`, async ({ page }) => {
            await page.setViewportSize({ width: vp.width, height: vp.height })

            // Go to profile page under visual-qa fixture default state
            await page.goto('/profile?fixture=visual-qa&state=default')
            await page.waitForLoadState('networkidle')
            await hideDevOverlay(page)

            // Verify displayName and levels
            await expect(page.locator('h1')).toContainText('Lina Nguyen')
            await expect(page.locator('p', { hasText: 'A2 to B1 - GOETHE' })).toBeVisible()

            // Verify study goal duration
            await expect(page.locator('h2')).toContainText('20 minutes per day')

            // Verify no horizontal overflow
            await expectNoHorizontalOverflow(page)

            // Save screenshot
            const screenshotPath = path.join(OUT_DIR, `profile-default-${vp.name}.png`)
            await page.screenshot({ path: screenshotPath })
            console.log(`Saved profile default screenshot: ${screenshotPath}`)
        })

        test(`Verify Profile Success Fixture on ${vp.name}`, async ({ page }) => {
            await page.setViewportSize({ width: vp.width, height: vp.height })

            // Go to profile page under visual-qa fixture success state
            await page.goto('/profile?fixture=visual-qa&state=success')
            await page.waitForLoadState('networkidle')
            await hideDevOverlay(page)

            // Verify slice 3 motivational info is visible
            await expect(page.locator('p', { hasText: 'Lina Nguyen' })).toBeVisible()
            await expect(page.locator('h2')).toContainText('25 Minuten Lernen pro Tag.')

            // Verify no horizontal overflow
            await expectNoHorizontalOverflow(page)

            // Save screenshot
            const screenshotPath = path.join(OUT_DIR, `profile-success-${vp.name}.png`)
            await page.screenshot({ path: screenshotPath })
            console.log(`Saved profile success screenshot: ${screenshotPath}`)
        })

        // =====================================================================
        // ONBOARDING WIZARD TESTS
        // =====================================================================

        test(`Verify Onboarding Welcome Step on ${vp.name}`, async ({ page }) => {
            await page.setViewportSize({ width: vp.width, height: vp.height })

            // Go to onboarding page under visual-qa welcome step
            await page.goto('/onboarding?fixture=visual-qa&state=welcome')
            await page.waitForLoadState('networkidle')
            await hideDevOverlay(page)

            // Verify welcome title & description in Vietnamese
            await expect(page.locator('h1')).toContainText('Willkommen bei')
            await expect(page.getByText('Chào mừng bạn đến với hành trình học tiếng Đức!')).toBeVisible()
            
            // Verify button is present
            const startBtn = page.locator('button', { hasText: 'Bắt đầu nào! →' })
            await expect(startBtn).toBeVisible()

            // Verify no horizontal overflow
            await expectNoHorizontalOverflow(page)

            // Save screenshot
            const screenshotPath = path.join(OUT_DIR, `onboarding-welcome-${vp.name}.png`)
            await page.screenshot({ path: screenshotPath })
            console.log(`Saved onboarding welcome screenshot: ${screenshotPath}`)
        })

        test(`Verify Onboarding Goal Step on ${vp.name}`, async ({ page }) => {
            await page.setViewportSize({ width: vp.width, height: vp.height })

            // Go to onboarding page under visual-qa goal step
            await page.goto('/onboarding?fixture=visual-qa&state=goal')
            await page.waitForLoadState('networkidle')
            await hideDevOverlay(page)

            // Verify goal title
            await expect(page.locator('h2')).toContainText('Mục tiêu của bạn')
            await expect(page.locator('label', { hasText: 'Bạn muốn thi gì?' })).toBeVisible()
            await expect(page.locator('label', { hasText: 'Trình độ mục tiêu' })).toBeVisible()

            // Verify no horizontal overflow
            await expectNoHorizontalOverflow(page)

            // Save screenshot
            const screenshotPath = path.join(OUT_DIR, `onboarding-goal-${vp.name}.png`)
            await page.screenshot({ path: screenshotPath })
            console.log(`Saved onboarding goal screenshot: ${screenshotPath}`)
        })

        test(`Verify Onboarding Daily-Time Step on ${vp.name}`, async ({ page }) => {
            await page.setViewportSize({ width: vp.width, height: vp.height })

            // Go to onboarding page under visual-qa daily-time step
            await page.goto('/onboarding?fixture=visual-qa&state=daily-time')
            await page.waitForLoadState('networkidle')
            await hideDevOverlay(page)

            // Verify daily time title
            await expect(page.locator('h2')).toContainText('Thời gian học mỗi ngày')

            // Verify options
            await expect(page.locator('button', { hasText: '5 phút' })).toBeVisible()
            await expect(page.locator('button', { hasText: '10 phút' })).toBeVisible()
            await expect(page.locator('button', { hasText: '20 phút' })).toBeVisible()
            await expect(page.locator('button', { hasText: '30 phút' })).toBeVisible()

            // Verify no horizontal overflow
            await expectNoHorizontalOverflow(page)

            // Save screenshot
            const screenshotPath = path.join(OUT_DIR, `onboarding-dailytime-${vp.name}.png`)
            await page.screenshot({ path: screenshotPath })
            console.log(`Saved onboarding dailytime screenshot: ${screenshotPath}`)
        })

        test(`Verify Onboarding Placement Step on ${vp.name}`, async ({ page }) => {
            await page.setViewportSize({ width: vp.width, height: vp.height })

            // Go to onboarding page under visual-qa placement step
            await page.goto('/onboarding?fixture=visual-qa&state=placement')
            await page.waitForLoadState('networkidle')
            await hideDevOverlay(page)

            // Verify question index is visible (e.g. "Câu 1 / 18")
            await expect(page.locator('span', { hasText: 'Câu 1 / 18' })).toBeVisible()

            // Verify no horizontal overflow
            await expectNoHorizontalOverflow(page)

            // Save screenshot
            const screenshotPath = path.join(OUT_DIR, `onboarding-placement-${vp.name}.png`)
            await page.screenshot({ path: screenshotPath })
            console.log(`Saved onboarding placement screenshot: ${screenshotPath}`)
        })

        test(`Verify Onboarding Result Step on ${vp.name}`, async ({ page }) => {
            await page.setViewportSize({ width: vp.width, height: vp.height })

            // Go to onboarding page under visual-qa result step
            await page.goto('/onboarding?fixture=visual-qa&state=result')
            await page.waitForLoadState('networkidle')
            await hideDevOverlay(page)

            // Verify result title and estimated level (A2 in mock)
            await expect(page.locator('h2')).toContainText('Kết quả')
            await expect(page.locator('span', { hasText: 'A2' })).toBeVisible()

            // Verify level breakdown labels are rendered
            await expect(page.locator('.text-xs', { hasText: /^A1$/ })).toBeVisible()
            await expect(page.locator('.text-xs', { hasText: /^A2$/ })).toBeVisible()
            await expect(page.locator('.text-xs', { hasText: /^B1$/ })).toBeVisible()

            // Verify CTA
            const startLearningBtn = page.locator('button', { hasText: 'Bắt đầu học!' })
            await expect(startLearningBtn).toBeVisible()

            // Verify no horizontal overflow
            await expectNoHorizontalOverflow(page)

            // Save screenshot
            const screenshotPath = path.join(OUT_DIR, `onboarding-result-${vp.name}.png`)
            await page.screenshot({ path: screenshotPath })
            console.log(`Saved onboarding result screenshot: ${screenshotPath}`)
        })
    }
})
