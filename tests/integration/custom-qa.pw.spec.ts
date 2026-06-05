import { expect, test } from '@playwright/test'
import * as path from 'node:path'
import * as fs from 'node:fs'

const OUT_DIR = path.resolve(__dirname, '..', '..', 'tmp', 'browser-qa', 'dashboard-session-implementation-pass-9')

// Force deviceScaleFactor to 1 globally to match the physical mockup resolutions exactly
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

async function verifyViewportAndDPR(page: any, expectedWidth: number, expectedHeight: number) {
    const size = page.viewportSize()
    const dpr = await page.evaluate(() => window.devicePixelRatio)
    console.log(`[Viewport/DPR Verification] Size: ${size?.width}x${size?.height}, DPR: ${dpr}`)
    expect(size?.width).toBe(expectedWidth)
    expect(size?.height).toBe(expectedHeight)
    expect(dpr).toBe(1)
}

test.describe('Visual QA Custom Screenshot Capture', () => {
    test.beforeAll(() => {
        if (fs.existsSync(OUT_DIR)) {
            console.log(`Cleaning old screenshots in ${OUT_DIR}...`)
            fs.rmSync(OUT_DIR, { recursive: true, force: true })
        }
        fs.mkdirSync(OUT_DIR, { recursive: true })
    })

    // 1. Dashboard Desktop
    test('Dashboard Desktop', async ({ page }) => {
        await page.setViewportSize({ width: 1440, height: 900 })
        await page.goto('/dashboard')
        await page.waitForLoadState('networkidle')
        await page.waitForTimeout(1000)
        await hideDevOverlay(page)
        await verifyViewportAndDPR(page, 1440, 900)
        
        const destPath = path.join(OUT_DIR, 'dashboard-desktop.png')
        await page.screenshot({
            path: destPath,
            fullPage: false,
        })
        const stats = fs.statSync(destPath)
        console.log(`Saved dashboard-desktop.png (${stats.size} bytes)`)
    })

    // 2. Dashboard Mobile
    test('Dashboard Mobile', async ({ page }) => {
        await page.setViewportSize({ width: 390, height: 844 })
        await page.goto('/dashboard')
        await page.waitForLoadState('networkidle')
        await page.waitForTimeout(1000)
        await hideDevOverlay(page)
        await verifyViewportAndDPR(page, 390, 844)

        const destPath = path.join(OUT_DIR, 'dashboard-mobile.png')
        await page.screenshot({
            path: destPath,
            fullPage: false,
        })
        const stats = fs.statSync(destPath)
        console.log(`Saved dashboard-mobile.png (${stats.size} bytes)`)
    })

    // 3. Dashboard Empty State Desktop
    test('Dashboard Empty State Desktop', async ({ page }) => {
        await page.setViewportSize({ width: 1440, height: 900 })
        // Intercept dashboard API
        await page.route('**/api/learner/dashboard', async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({ streak: 0, xp: 0, quests: [] }),
            })
        })
        await page.goto('/dashboard?state=empty')
        await page.waitForLoadState('networkidle')
        await page.waitForTimeout(1000)
        await hideDevOverlay(page)
        await verifyViewportAndDPR(page, 1440, 900)

        const destPath = path.join(OUT_DIR, 'dashboard-empty-desktop.png')
        await page.screenshot({
            path: destPath,
            fullPage: false,
        })
        const stats = fs.statSync(destPath)
        console.log(`Saved dashboard-empty-desktop.png (${stats.size} bytes)`)
    })

    // 4. Dashboard Empty State Mobile
    test('Dashboard Empty State Mobile', async ({ page }) => {
        await page.setViewportSize({ width: 390, height: 844 })
        await page.route('**/api/learner/dashboard', async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({ streak: 0, xp: 0, quests: [] }),
            })
        })
        await page.goto('/dashboard?state=empty')
        await page.waitForLoadState('networkidle')
        await page.waitForTimeout(1000)
        await hideDevOverlay(page)
        await verifyViewportAndDPR(page, 390, 844)

        const destPath = path.join(OUT_DIR, 'dashboard-empty-mobile.png')
        await page.screenshot({
            path: destPath,
            fullPage: false,
        })
        const stats = fs.statSync(destPath)
        console.log(`Saved dashboard-empty-mobile.png (${stats.size} bytes)`)
    })
    // 5. Session Desktop & Clickthrough to Success
    test('Session Desktop and Success Screen', async ({ page }) => {
        await page.setViewportSize({ width: 1440, height: 900 })
        await page.goto('/session?mockAudio=true')
        await page.waitForLoadState('networkidle')
        await page.waitForTimeout(1000)

        // Navigate past intro cards until we reach the multiple choice exercise
        console.log('Navigating to multiple-choice exercise...')
        for (let i = 0; i < 10; i++) {
            const heading = page.locator('h1, h2, h3').filter({ hasText: /Höre und wähle das richtige Wort|Nghĩa của từ/i })
            const choiceBtnCount = await page.locator('button[data-choice-btn]').count()
            if (choiceBtnCount >= 4) {
                console.log(`Reached multiple-choice exercise at step ${i}`)
                break
            }
            
            const introBtn = page.locator('button:has-text("Đã hiểu")')
            if (await introBtn.isVisible()) {
                await introBtn.click()
                await page.waitForTimeout(500)
            } else {
                await page.waitForTimeout(200)
            }
        }

        // Assert we are actually on the multiple choice exercise before taking screenshot
        await expect(page.locator('h1, h2, h3').filter({ hasText: /Höre und wähle das richtige Wort|Nghĩa của từ/i }).first()).toBeVisible()
        await expect(page.locator('button[data-choice-btn]')).toHaveCount(4)

        // Capture session desktop (active listening multiple-choice exercise)
        await hideDevOverlay(page)
        await verifyViewportAndDPR(page, 1440, 900)
        const sDeskPath = path.join(OUT_DIR, 'session-desktop.png')
        await page.screenshot({
            path: sDeskPath,
            fullPage: false,
        })
        console.log(`Saved session-desktop.png (${fs.statSync(sDeskPath).size} bytes)`)

        // Click through the session to reach success screen (maximum 20 steps)
        let isSuccessVisible = false
        console.log('Starting session clickthrough loop...')
        for (let i = 0; i < 20; i++) {
            // Check if we are on success screen
            const resultHeader = page.locator('h1, h2, h3').filter({ hasText: /Lektion geschafft!|Hoàn thành bài học!|Lesson completed!/i }).first()
            if (await resultHeader.isVisible()) {
                console.log(`Success screen detected at loop step ${i}!`)
                isSuccessVisible = true
                break
            }

            // Click "Đã hiểu" (IntroCard) if visible
            const introBtnCurrent = page.locator('button:has-text("Đã hiểu")')
            if (await introBtnCurrent.isVisible()) {
                console.log(`[Step ${i}] Intro card "Đã hiểu" is visible. Clicking...`)
                await introBtnCurrent.click()
                await page.waitForTimeout(500)
                continue
            }

            // If we are in MultipleChoice, click first option
            const firstOption = page.locator('button[data-choice-btn]').first()
            if (await firstOption.isVisible()) {
                console.log(`[Step ${i}] Multiple choice option is visible. Clicking first choice...`)
                await firstOption.click()
                await page.waitForTimeout(200)

                const checkBtn = page.locator('button:has-text("Kiểm tra")')
                if (await checkBtn.isVisible()) {
                    await checkBtn.click()
                    await page.waitForTimeout(300)
                }

                const continueBtn = page.locator('button:has-text("Weiter"), button:has-text("Tiếp Bước"), button:has-text("Học tiếp")')
                if (await continueBtn.isVisible()) {
                    await continueBtn.click()
                    await page.waitForTimeout(500)
                }
                continue
            }

            // If we are in TypingExercise, type the term and click check/continue
            const inputField = page.locator('input[placeholder="Nhập tiếng Đức..."]')
            if (await inputField.isVisible()) {
                console.log(`[Step ${i}] Typing input is visible. Filling and continuing...`)
                await inputField.fill('test')
                await page.waitForTimeout(200)

                const checkBtn = page.locator('button:has-text("Kiểm tra")')
                if (await checkBtn.isVisible()) {
                    await checkBtn.click()
                    await page.waitForTimeout(300)
                }

                const continueBtn = page.locator('button:has-text("Weiter"), button:has-text("Tiếp Bước"), button:has-text("Học tiếp")')
                if (await continueBtn.isVisible()) {
                    await continueBtn.click()
                    await page.waitForTimeout(500)
                }
                continue
            }

            console.log(`[Step ${i}] No standard interactive elements found. Waiting...`)
            await page.waitForTimeout(500)
        }

        expect(isSuccessVisible).toBe(true)

        // Capture session success desktop
        await page.waitForTimeout(1000)
        await hideDevOverlay(page)
        await verifyViewportAndDPR(page, 1440, 900)
        const sSuccDeskPath = path.join(OUT_DIR, 'session-success-desktop.png')
        await page.screenshot({
            path: sSuccDeskPath,
            fullPage: false,
        })
        console.log(`Saved session-success-desktop.png (${fs.statSync(sSuccDeskPath).size} bytes)`)

        // Capture mobile success version by resizing viewport
        await page.setViewportSize({ width: 390, height: 844 })
        await page.waitForTimeout(1000)
        await hideDevOverlay(page)
        await verifyViewportAndDPR(page, 390, 844)
        const sSuccMobPath = path.join(OUT_DIR, 'session-success-mobile.png')
        await page.screenshot({
            path: sSuccMobPath,
            fullPage: false,
        })
        console.log(`Saved session-success-mobile.png (${fs.statSync(sSuccMobPath).size} bytes)`)
    })

    // 6. Session Mobile (multiple choice exercise)
    test('Session Mobile', async ({ page }) => {
        await page.setViewportSize({ width: 390, height: 844 })
        await page.goto('/session?mockAudio=true')
        await page.waitForLoadState('networkidle')
        await page.waitForTimeout(1000)
        
        // Navigate past intro cards until we reach the multiple choice exercise
        console.log('Navigating to multiple-choice exercise (mobile)...')
        for (let i = 0; i < 10; i++) {
            const heading = page.locator('h1, h2, h3').filter({ hasText: /Höre und wähle das richtige Wort|Nghĩa của từ/i })
            const choiceBtnCount = await page.locator('button[data-choice-btn]').count()
            if (choiceBtnCount >= 4) {
                console.log(`Reached multiple-choice exercise at step ${i} (mobile)`)
                break
            }
            
            const introBtn = page.locator('button:has-text("Đã hiểu")')
            if (await introBtn.isVisible()) {
                await introBtn.click()
                await page.waitForTimeout(500)
            } else {
                await page.waitForTimeout(200)
            }
        }

        // Assert we are actually on the multiple choice exercise before taking screenshot
        await expect(page.locator('h1, h2, h3').filter({ hasText: /Höre und wähle das richtige Wort|Nghĩa của từ/i }).first()).toBeVisible()
        await expect(page.locator('button[data-choice-btn]')).toHaveCount(4)

        await hideDevOverlay(page)
        await verifyViewportAndDPR(page, 390, 844)
        const sMobPath = path.join(OUT_DIR, 'session-mobile.png')
        await page.screenshot({
            path: sMobPath,
            fullPage: false,
        })
        console.log(`Saved session-mobile.png (${fs.statSync(sMobPath).size} bytes)`)
    })
})
