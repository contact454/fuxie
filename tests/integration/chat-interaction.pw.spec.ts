import { expect, test, type Page } from '@playwright/test'
import * as fs from 'node:fs'
import * as path from 'node:path'
import dotenv from 'dotenv'

// Load environment variables from workspace root .env
dotenv.config({ path: path.resolve(__dirname, '..', '..', '.env') })

const OUT_DIR = process.env.FUXIE_QA_OUT_DIR
    ? path.resolve(process.env.FUXIE_QA_OUT_DIR)
    : path.resolve(__dirname, '..', '..', 'tmp', 'browser-qa', 'chat')

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

test.describe('AI Chat / AI Tutor Module E2E & Visual Verification', () => {
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
        test(`Verify AI Chat Intro / Level Picker on ${vp.name}`, async ({ page }) => {
            await page.setViewportSize({ width: vp.width, height: vp.height })

            await page.goto('/chat?fixture=visual-qa&state=intro')
            await page.waitForLoadState('networkidle')
            await hideDevOverlay(page)

            // Assert Header
            await expect(page.locator('h1')).toContainText(/Trò chuyện với Fuxie/i)

            // Assert Level selection grid
            await expect(page.locator('button', { hasText: 'A1' }).first()).toBeVisible()
            await expect(page.locator('button', { hasText: 'C2' }).first()).toBeVisible()

            // Verify no horizontal overflow
            await expectNoHorizontalOverflow(page)

            // Save screenshot
            const screenshotPath = path.join(OUT_DIR, `chat-intro-${vp.name}.png`)
            await page.screenshot({ path: screenshotPath })
            console.log(`Saved chat intro screenshot: ${screenshotPath}`)
        })

        test(`Verify AI Chat Active Conversation on ${vp.name}`, async ({ page }) => {
            await page.setViewportSize({ width: vp.width, height: vp.height })

            await page.goto('/chat?fixture=visual-qa&state=chat')
            await page.waitForLoadState('networkidle')
            await hideDevOverlay(page)

            // Verify assistant message is visible
            const assistantMsg = page.locator('div', { hasText: 'Hallo! Ich bin Fuxie, dein KI-Sprachtutor.' }).first()
            await expect(assistantMsg).toBeVisible()

            // Verify user message is visible
            const userMsg = page.locator('div', { hasText: 'Mir geht es gut, danke.' }).first()
            await expect(userMsg).toBeVisible()

            // Verify Correction bubble is visible
            const correctionBubble = page.locator('div', { hasText: 'Grammatik des Deutschen' }).first()
            await expect(correctionBubble).toBeVisible()
            await expect(correctionBubble).toContainText(/Nomen-Nomen Komposita/i)

            // Verify suggested topics are visible
            const suggestions = page.locator('button', { hasText: 'Ich möchte Akkusativ vs Dativ üben.' }).first()
            await expect(suggestions).toBeVisible()

            // Verify no horizontal overflow
            await expectNoHorizontalOverflow(page)

            // Save screenshot
            const screenshotPath = path.join(OUT_DIR, `chat-active-${vp.name}.png`)
            await page.screenshot({ path: screenshotPath })
            console.log(`Saved chat active screenshot: ${screenshotPath}`)
        })

        test(`Verify AI Voice Call Speaking on ${vp.name}`, async ({ page }) => {
            await page.setViewportSize({ width: vp.width, height: vp.height })

            await page.goto('/chat?fixture=visual-qa&state=video-speaking')
            await page.waitForLoadState('networkidle')
            await hideDevOverlay(page)

            // Assert Fuxie mascot is speaking status badge
            await expect(page.locator('div', { hasText: /Fuxie đang nói/i }).first()).toBeVisible()

            // Assert transcripts are visible
            await expect(page.locator('p', { hasText: 'Hallo! Ich bin Fuxie' }).first()).toBeVisible()

            // Verify no horizontal overflow
            await expectNoHorizontalOverflow(page)

            // Save screenshot
            const screenshotPath = path.join(OUT_DIR, `chat-video-speaking-${vp.name}.png`)
            await page.screenshot({ path: screenshotPath })
            console.log(`Saved chat video speaking screenshot: ${screenshotPath}`)
        })

        test(`Verify AI Voice Call Listening on ${vp.name}`, async ({ page }) => {
            await page.setViewportSize({ width: vp.width, height: vp.height })

            await page.goto('/chat?fixture=visual-qa&state=video-listening')
            await page.waitForLoadState('networkidle')
            await hideDevOverlay(page)

            // Assert Fuxie mascot is listening status badge
            await expect(page.locator('div', { hasText: /Fuxie đang nghe/i }).first()).toBeVisible()

            // Assert transcripts are visible
            await expect(page.locator('p', { hasText: 'Ich lerne Deutsch mit Fuxie' }).first()).toBeVisible()

            // Verify no horizontal overflow
            await expectNoHorizontalOverflow(page)

            // Save screenshot
            const screenshotPath = path.join(OUT_DIR, `chat-video-listening-${vp.name}.png`)
            await page.screenshot({ path: screenshotPath })
            console.log(`Saved chat video listening screenshot: ${screenshotPath}`)
        })

        test(`Verify AI Voice Call Summary Feedback on ${vp.name}`, async ({ page }) => {
            await page.setViewportSize({ width: vp.width, height: vp.height })

            await page.goto('/chat?fixture=visual-qa&state=video-summary')
            await page.waitForLoadState('networkidle')
            await hideDevOverlay(page)

            // Assert pronunciation feedback header
            await expect(page.locator('h3', { hasText: /Phát âm cần lưu ý/i }).first()).toBeVisible()

            // Assert pronunciation errors are listed
            await expect(page.locator('span', { hasText: '"Deutsch"' }).first()).toBeVisible()
            await expect(page.locator('span', { hasText: '"ich"' }).first()).toBeVisible()

            // Verify no horizontal overflow
            await expectNoHorizontalOverflow(page)

            // Save screenshot
            const screenshotPath = path.join(OUT_DIR, `chat-video-summary-${vp.name}.png`)
            await page.screenshot({ path: screenshotPath })
            console.log(`Saved chat video summary screenshot: ${screenshotPath}`)
        })
    }
})
