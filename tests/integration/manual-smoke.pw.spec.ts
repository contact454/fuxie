import { expect, test } from '@playwright/test'
import * as path from 'node:path'
import * as fs from 'node:fs'

const OUT_DIR = path.resolve(__dirname, '..', '..', 'tmp', 'manual-smoke-check')

test.use({ deviceScaleFactor: 1 })

async function hideDevOverlay(page: any) {
    try {
        await page.evaluate(() => {
            const style = document.createElement('style')
            style.id = 'hide-dev-overlay-style'
            style.innerHTML = `
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
            `
            document.head.appendChild(style)
        })
    } catch (e) {
        console.warn('Could not inject hideDevOverlay style:', e)
    }
}

test.describe('Sprint 1 P0 Remediation Manual Smoke Check', () => {
    test.beforeAll(() => {
        if (fs.existsSync(OUT_DIR)) {
            fs.rmSync(OUT_DIR, { recursive: true, force: true })
        }
        fs.mkdirSync(OUT_DIR, { recursive: true })
    })

    // Force Vietnamese locale using cookie so translations are deterministic
    test.beforeEach(async ({ context }) => {
        await context.addCookies([{
            name: 'NEXT_LOCALE',
            value: 'vi',
            url: 'http://localhost:3005',
        }])
    })

    // --- 1. Dashboard & Navigation Visual States ---
    test('1.1 Dashboard Desktop (1440x900)', async ({ page }) => {
        await page.setViewportSize({ width: 1440, height: 900 })
        await page.goto('/dashboard?fixture=visual-qa')
        await page.waitForLoadState('networkidle')
        await page.waitForTimeout(1000)
        await hideDevOverlay(page)

        // Verify CEFR badge style
        // Specifically look for a badge containing exactly "A2"
        const badge = page.locator('header span').filter({ hasText: /^A2$/ }).first()
        await expect(badge).toBeVisible()
        const badgeBg = await badge.evaluate((el) => window.getComputedStyle(el).backgroundColor)
        const badgeColor = await badge.evaluate((el) => window.getComputedStyle(el).color)
        console.log(`[Dashboard CEFR Badge] BG: ${badgeBg}, Text Color: ${badgeColor}`)

        // Verify active nav style on sidebar - we navigate to /vocabulary where sidebar is rendered
        await page.goto('/vocabulary?fixture=visual-qa')
        await page.waitForLoadState('networkidle')
        await page.waitForTimeout(500)

        // "Từ vựng" (Vocabulary) is active
        const activeNav = page.locator('aside a:has-text("Từ vựng")').first()
        await expect(activeNav).toBeVisible()
        const activeNavBg = await activeNav.evaluate((el) => window.getComputedStyle(el).backgroundColor)
        const activeNavColor = await activeNav.evaluate((el) => window.getComputedStyle(el).color)
        console.log(`[Sidebar Active Nav] BG: ${activeNavBg}, Text Color: ${activeNavColor}`)

        // Take screenshot
        const screenshotPath = path.join(OUT_DIR, 'dashboard-desktop.png')
        await page.screenshot({ path: screenshotPath })
        console.log(`Saved screenshot: ${screenshotPath}`)
    })

    test('1.2 Dashboard Mobile (390x844)', async ({ page }) => {
        await page.setViewportSize({ width: 390, height: 844 })
        // Navigate to /vocabulary where mobile bottom nav is rendered
        await page.goto('/vocabulary?fixture=visual-qa')
        await page.waitForLoadState('networkidle')
        await page.waitForTimeout(1000)
        await hideDevOverlay(page)

        // Verify Mobile Bottom Nav active styling
        const activeNav = page.locator('nav.bottom-nav a:has-text("Từ vựng")')
        await expect(activeNav).toBeVisible()
        const activeNavBg = await activeNav.evaluate((el) => window.getComputedStyle(el).backgroundColor)
        const activeNavColor = await activeNav.evaluate((el) => window.getComputedStyle(el).color)
        console.log(`[Bottom Nav Active Nav] BG: ${activeNavBg}, Text Color: ${activeNavColor}`)

        // Take screenshot
        const screenshotPath = path.join(OUT_DIR, 'dashboard-mobile.png')
        await page.screenshot({ path: screenshotPath })
        console.log(`Saved screenshot: ${screenshotPath}`)
    })

    test('1.3 Dashboard Empty State (390x844)', async ({ page }) => {
        await page.setViewportSize({ width: 390, height: 844 })
        await page.goto('/dashboard?state=empty&fixture=visual-qa')
        await page.waitForLoadState('networkidle')
        await page.waitForTimeout(1000)
        await hideDevOverlay(page)

        // Take screenshot
        const screenshotPath = path.join(OUT_DIR, 'dashboard-empty-mobile.png')
        await page.screenshot({ path: screenshotPath })
        console.log(`Saved screenshot: ${screenshotPath}`)
    })

    // --- 2. Vocabulary & Grammar Overflow Layouts ---
    test('2.1 Vocabulary theme card titles & text clamp', async ({ page }) => {
        await page.setViewportSize({ width: 390, height: 844 })
        await page.goto('/vocabulary?fixture=visual-qa')
        await page.waitForLoadState('networkidle')
        await page.waitForTimeout(1000)
        await hideDevOverlay(page)

        // Verify theme titles clamp / wrap
        const screenshotPath = path.join(OUT_DIR, 'vocabulary-themes-mobile.png')
        await page.screenshot({ path: screenshotPath })
        console.log(`Saved screenshot: ${screenshotPath}`)
    })

    test('2.2 Grammar lesson error visual layout (Slice 2 fixture)', async ({ page }) => {
        // This renders Slice2GrammarErrorFixture bypass page
        await page.setViewportSize({ width: 360, height: 800 })
        await page.goto('/grammar/akkusativ-dativ/visual-lesson?fixture=visual-qa&state=error')
        await page.waitForLoadState('networkidle')
        await page.waitForTimeout(1000)
        await hideDevOverlay(page)

        // Take screenshot
        const screenshotPath = path.join(OUT_DIR, 'grammar-fixture-error-mobile.png')
        await page.screenshot({ path: screenshotPath })
        console.log(`Saved screenshot: ${screenshotPath}`)
    })

    // --- 3. Confirm-Exit Dialogs ---
    test('3.1 Confirm Exit Dialog Mobile Narrow (360x800)', async ({ page }) => {
        await page.setViewportSize({ width: 360, height: 800 })
        await page.goto('/session?fixture=visual-qa&mockAudio=true')
        await page.waitForLoadState('networkidle')
        await page.waitForTimeout(1000)

        // Find log-out icon button to trigger exit dialog
        const closeBtn = page.locator('button:has(svg.lucide-log-out)')
        await expect(closeBtn).toBeVisible()
        await closeBtn.click()
        await page.waitForTimeout(500)

        // Verify dialog is visible
        const dialog = page.locator('[role="dialog"]')
        await expect(dialog).toBeVisible()

        // Verify "Stay" button receives initial focus
        const stayBtn = dialog.locator('button').first()
        const isStayFocused = await stayBtn.evaluate((el) => document.activeElement === el)
        console.log(`[Confirm Exit Dialog] Stay button initially focused: ${isStayFocused}`)

        // Take screenshot showing stacked layout on 360px viewport
        const screenshotPath = path.join(OUT_DIR, 'confirm-exit-dialog-mobile-narrow.png')
        await page.screenshot({ path: screenshotPath })
        console.log(`Saved screenshot: ${screenshotPath}`)

        // Press Escape to dismiss the dialog and verify it closes
        await page.keyboard.press('Escape')
        await page.waitForTimeout(500)
        await expect(dialog).not.toBeVisible()
        console.log('[Confirm Exit Dialog] Dialog successfully dismissed with Escape key.')
    })

    test('3.2 Confirm Exit Dialog Desktop (1440x900)', async ({ page }) => {
        await page.setViewportSize({ width: 1440, height: 900 })
        await page.goto('/session?fixture=visual-qa&mockAudio=true')
        await page.waitForLoadState('networkidle')
        await page.waitForTimeout(1000)

        // Click close
        const closeBtn = page.locator('button:has(svg.lucide-log-out)')
        await closeBtn.click()
        await page.waitForTimeout(500)

        const dialog = page.locator('[role="dialog"]')
        await expect(dialog).toBeVisible()

        // Take screenshot showing side-by-side buttons on desktop
        const screenshotPath = path.join(OUT_DIR, 'confirm-exit-dialog-desktop.png')
        await page.screenshot({ path: screenshotPath })
        console.log(`Saved screenshot: ${screenshotPath}`)
    })

    // --- 4. AI Grading Unavailable Fallback ---
    test('4.1 AI Grading Fail-Open and Retry', async ({ page }) => {
        await page.setViewportSize({ width: 390, height: 844 })
        
        // Mock the grading endpoint to return a 500 server error
        await page.route('**/api/v1/grade', async (route) => {
            console.log('[Mock Server API] Intercepted /api/v1/grade, returning 500 Error')
            await route.fulfill({
                status: 500,
                contentType: 'application/json',
                body: JSON.stringify({ error: 'Grading service offline' }),
            })
        })

        await page.goto('/grammar/akkusativ-dativ/visual-lesson?fixture=visual-qa&state=grading-unavailable')
        await page.waitForLoadState('networkidle')
        await page.waitForTimeout(1000)
        await hideDevOverlay(page)

        // Click start lesson button "Bắt đầu học"
        const startBtn = page.locator('button:has-text("Bắt đầu học")')
        try {
            await expect(startBtn).toBeVisible({ timeout: 5000 })
        } catch (err) {
            console.log("CURRENT URL:", await page.url())
            console.log("PAGE HTML:", await page.content())
            throw err
        }
        await startBtn.click()
        await page.waitForTimeout(500)

        // Locate input field inside gap fill grammar exercise
        const inputField = page.locator('input[placeholder="Nhập đáp án..."]')
        await expect(inputField).toBeVisible()
        
        // Fill a wrong answer (not heuristically 'dem') to trigger AI grading request
        await inputField.fill('wrong-answer')
        await page.waitForTimeout(200)

        // Click "Kiểm tra" button to trigger grading
        const checkBtn = page.locator('button:has-text("Kiểm tra")')
        await expect(checkBtn).toBeVisible()
        await checkBtn.click()
        await page.waitForTimeout(1000)

        // Hard assert that the localized grading unavailable fallback banner is shown
        // "Chưa chấm được bài này" (gradingUnavailableTitle)
        const errorBanner = page.locator('div:has-text("Chưa chấm được bài này")').first()
        await expect(errorBanner).toBeVisible()
        console.log('[AI Grading Fallback] Verified: Localized grading unavailable banner is visible.')

        // Take screenshot of grading error state
        const screenshotPath = path.join(OUT_DIR, 'ai-grading-unavailable-mobile.png')
        await page.screenshot({ path: screenshotPath })
        console.log(`Saved screenshot: ${screenshotPath}`)
    })

    // --- 5. Video-Call Feedback Unavailable State ---
    test('5.1 Video Call Feedback Unavailable summary state', async ({ page }) => {
        await page.setViewportSize({ width: 390, height: 844 })
        await page.goto('/chat?fixture=visual-qa')
        await page.waitForLoadState('networkidle')
        await page.waitForTimeout(1000)
        await hideDevOverlay(page)

        // Take screenshot
        const screenshotPath = path.join(OUT_DIR, 'chat-video-unavailable-mobile.png')
        await page.screenshot({ path: screenshotPath })
        console.log(`Saved screenshot: ${screenshotPath}`)
    })
})
