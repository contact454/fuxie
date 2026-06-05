import { expect, test, type Page } from '@playwright/test'
import * as fs from 'node:fs'
import * as path from 'node:path'

const OUT_DIR = path.resolve(__dirname, '..', '..', 'tmp', 'browser-qa', 'adjective-declension')

// Force deviceScaleFactor to 1 globally to match physical mockup resolutions
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

test.describe('Vocabulary Adjective Declension E2E Tests', () => {
    test.beforeAll(() => {
        if (!fs.existsSync(OUT_DIR)) {
            fs.mkdirSync(OUT_DIR, { recursive: true })
        }
    })

    // Force Vietnamese locale using cookie so translations are deterministic
    test.beforeEach(async ({ context }) => {
        await context.addCookies([{
            name: 'NEXT_LOCALE',
            value: 'vi',
            url: 'http://localhost:3005',
        }])
    })

    // VIEWPORTS
    const viewports = [
        { name: 'desktop', width: 1440, height: 900 },
        { name: 'mobile', width: 390, height: 844 }
    ]

    for (const vp of viewports) {
        test(`Verify sozialer Status in Vocabulary page on ${vp.name}`, async ({ page }) => {
            await page.setViewportSize({ width: vp.width, height: vp.height })
            
            // Go to vocabulary page
            await page.goto('/vocabulary')
            await page.waitForLoadState('networkidle')
            await hideDevOverlay(page)

            // Switch to B2 level
            const b2Tab = page.locator('button[role="tab"]').filter({ hasText: /^B2$/ })
            await expect(b2Tab).toBeVisible()
            await b2Tab.click()
            await page.waitForTimeout(1500) // Wait for level to load and components to mount

            // Select theme Soziale Ungleichheit
            const themeBtn = page.locator('button[aria-label*="Soziale Ungleichheit"]')
            await expect(themeBtn).toBeVisible()
            await themeBtn.click()
            await page.waitForTimeout(500)

            // Click "Xem từ" to expand word list
            const xemTuBtn = page.getByRole('button', { name: /Xem từ/i })
            await expect(xemTuBtn).toBeVisible()
            await xemTuBtn.click()
            await page.waitForTimeout(500)

            // Assert "sozialer Status" is visible and has article "der"
            const wordContainer = page.locator('div.flex.items-center.gap-3').filter({ hasText: /^der\s*sozialer Status/ })
            await expect(wordContainer).toBeVisible()

            // Verify horizontal overflow
            await expectNoHorizontalOverflow(page)

            // Take screenshot
            const screenshotPath = path.join(OUT_DIR, `vocab-b2-status-${vp.name}.png`)
            await page.screenshot({ path: screenshotPath })
            console.log(`Saved screenshot: ${screenshotPath}`)
        })

        test(`Verify neuronales Netz in Vocabulary page on ${vp.name}`, async ({ page }) => {
            await page.setViewportSize({ width: vp.width, height: vp.height })
            
            // Go to vocabulary page
            await page.goto('/vocabulary')
            await page.waitForLoadState('networkidle')
            await hideDevOverlay(page)

            // Switch to C1 level
            const c1Tab = page.locator('button[role="tab"]').filter({ hasText: /^C1$/ })
            await expect(c1Tab).toBeVisible()
            await c1Tab.click()
            await page.waitForTimeout(1500) // Wait for level to load and components to mount

            // Select theme Künstliche Intelligenz
            const themeBtn = page.locator('button[aria-label*="Künstliche Intelligenz"]')
            await expect(themeBtn).toBeVisible()
            await themeBtn.click()
            await page.waitForTimeout(500)

            // Click "Xem từ" to expand word list
            const xemTuBtn = page.getByRole('button', { name: /Xem từ/i })
            await expect(xemTuBtn).toBeVisible()
            await xemTuBtn.click()
            await page.waitForTimeout(500)

            // Assert "neuronales Netz" is visible and has article "das"
            const wordContainer = page.locator('div.flex.items-center.gap-3').filter({ hasText: /^das\s*neuronales Netz/ })
            await expect(wordContainer).toBeVisible()

            // Verify horizontal overflow
            await expectNoHorizontalOverflow(page)

            // Take screenshot
            const screenshotPath = path.join(OUT_DIR, `vocab-c1-netz-${vp.name}.png`)
            await page.screenshot({ path: screenshotPath })
            console.log(`Saved screenshot: ${screenshotPath}`)
        })

        test(`Verify sozialer Status Flashcard in Review page on ${vp.name}`, async ({ page }) => {
            await page.setViewportSize({ width: vp.width, height: vp.height })
            
            // Go to review page
            await page.goto('/review')
            await page.waitForLoadState('networkidle')
            await hideDevOverlay(page)

            // Select B2 level
            const b2Tab = page.locator('button[role="tab"]').filter({ hasText: /^B2$/ })
            await expect(b2Tab).toBeVisible()
            await b2Tab.click()
            await page.waitForTimeout(1500)

            // Select theme Soziale Ungleichheit
            const themeBtn = page.locator('button:has-text("Soziale Ungleichheit")')
            await expect(themeBtn).toBeVisible()
            await themeBtn.click()
            await page.waitForTimeout(2000) // Wait for cards to load in study mode

            // We are in study mode. Let's find "sozialer Status" card by clicking "Sau" or "Next" button in loop
            let wordFound = false
            for (let i = 0; i < 20; i++) {
                const currentWordText = await page.locator('span.text-4xl.font-bold').innerText()
                if (currentWordText.trim() === 'sozialer Status') {
                    wordFound = true
                    break
                }
                const nextBtn = page.getByRole('button', { name: /Sau|Tiếp/i })
                if (await nextBtn.isVisible() && !(await nextBtn.isDisabled())) {
                    await nextBtn.click()
                    await page.waitForTimeout(400)
                } else {
                    break
                }
            }

            expect(wordFound).toBe(true)

            // Assert Front: shows "der" and "sozialer Status"
            const articleSpan = page.locator('span.text-2xl.font-medium')
            await expect(articleSpan).toBeVisible()
            await expect(articleSpan).toHaveText('der')

            // Assert spelling
            const wordSpan = page.locator('span.text-4xl.font-bold')
            await expect(wordSpan).toHaveText('sozialer Status')

            // Verify no horizontal overflow on front
            await expectNoHorizontalOverflow(page)

            // Take front screenshot
            const frontScreenshot = path.join(OUT_DIR, `flashcard-b2-status-front-${vp.name}.png`)
            await page.screenshot({ path: frontScreenshot })
            console.log(`Saved screenshot: ${frontScreenshot}`)

            // Click card to flip
            await page.locator('div.cursor-pointer').first().click()
            await page.waitForTimeout(500)

            // Assert Back: shows Vietnamese meaning
            const meaningText = page.locator('p.text-2xl.font-bold')
            await expect(meaningText).toHaveText('địa vị xã hội')

            // Verify no horizontal overflow on back
            await expectNoHorizontalOverflow(page)

            // Take back screenshot
            const backScreenshot = path.join(OUT_DIR, `flashcard-b2-status-back-${vp.name}.png`)
            await page.screenshot({ path: backScreenshot })
            console.log(`Saved screenshot: ${backScreenshot}`)
        })

        test(`Verify neuronales Netz Flashcard in Review page on ${vp.name}`, async ({ page }) => {
            await page.setViewportSize({ width: vp.width, height: vp.height })
            
            // Go to review page
            await page.goto('/review')
            await page.waitForLoadState('networkidle')
            await hideDevOverlay(page)

            // Select C1 level
            const c1Tab = page.locator('button[role="tab"]').filter({ hasText: /^C1$/ })
            await expect(c1Tab).toBeVisible()
            await c1Tab.click()
            await page.waitForTimeout(1500)

            // Select theme Künstliche Intelligenz
            const themeBtn = page.locator('button:has-text("Künstliche Intelligenz")')
            await expect(themeBtn).toBeVisible()
            await themeBtn.click()
            await page.waitForTimeout(2000)

            // We are in study mode. Let's find "neuronales Netz" card by clicking "Sau" or "Next" button in loop
            let wordFound = false
            for (let i = 0; i < 30; i++) {
                const currentWordText = await page.locator('span.text-4xl.font-bold').innerText()
                if (currentWordText.trim() === 'neuronales Netz') {
                    wordFound = true
                    break
                }
                const nextBtn = page.getByRole('button', { name: /Sau|Tiếp/i })
                if (await nextBtn.isVisible() && !(await nextBtn.isDisabled())) {
                    await nextBtn.click()
                    await page.waitForTimeout(400)
                } else {
                    break
                }
            }

            expect(wordFound).toBe(true)

            // Assert Front: shows "das" and "neuronales Netz"
            const articleSpan = page.locator('span.text-2xl.font-medium')
            await expect(articleSpan).toBeVisible()
            await expect(articleSpan).toHaveText('das')

            // Assert spelling
            const wordSpan = page.locator('span.text-4xl.font-bold')
            await expect(wordSpan).toHaveText('neuronales Netz')

            // Verify no horizontal overflow on front
            await expectNoHorizontalOverflow(page)

            // Take front screenshot
            const frontScreenshot = path.join(OUT_DIR, `flashcard-c1-netz-front-${vp.name}.png`)
            await page.screenshot({ path: frontScreenshot })
            console.log(`Saved screenshot: ${frontScreenshot}`)

            // Click card to flip
            await page.locator('div.cursor-pointer').first().click()
            await page.waitForTimeout(500)

            // Assert Back: shows Vietnamese meaning
            const meaningText = page.locator('p.text-2xl.font-bold')
            await expect(meaningText).toHaveText('mạng nơ-ron')

            // Verify no horizontal overflow on back
            await expectNoHorizontalOverflow(page)

            // Take back screenshot
            const backScreenshot = path.join(OUT_DIR, `flashcard-c1-netz-back-${vp.name}.png`)
            await page.screenshot({ path: backScreenshot })
            console.log(`Saved screenshot: ${backScreenshot}`)
        })
    }
})
