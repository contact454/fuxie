import { expect, test, type Page } from '@playwright/test'
import * as fs from 'node:fs'
import * as path from 'node:path'

// Save screenshots inside FUXIE_QA_OUT_DIR or tmp folder
const OUT_DIR = process.env.FUXIE_QA_OUT_DIR
    ? path.resolve(process.env.FUXIE_QA_OUT_DIR)
    : path.resolve(__dirname, '..', '..', 'tmp', 'browser-qa', 'reading')

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

test.describe('Reading Module E2E & Visual Verification', () => {
    test.beforeAll(() => {
        if (!fs.existsSync(OUT_DIR)) {
            fs.mkdirSync(OUT_DIR, { recursive: true })
        }
    })

    // Force Vietnamese locale using cookie
    test.beforeEach(async ({ context, page }) => {
        // Log console messages and errors from page
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
        test(`Verify Reading Success Visual Fixture on ${vp.name}`, async ({ page }) => {
            await page.setViewportSize({ width: vp.width, height: vp.height })

            // Navigate to the visual QA route for reading success state
            await page.goto('/reading/R-A1-DEV-001?state=success&fixture=visual-qa')
            await page.waitForLoadState('networkidle')
            await hideDevOverlay(page)

            // Assert success container is visible
            const successState = page.locator('[data-role="reading-success-state"]')
            await expect(successState).toBeVisible()

            const scoreText = successState.locator('[data-role="reading-comprehension-success"]').locator('p').filter({ hasText: '86%' })
            await expect(scoreText).toBeVisible()

            // Verify no horizontal overflow
            await expectNoHorizontalOverflow(page)

            // Capture screenshot
            const screenshotPath = path.join(OUT_DIR, `reading-success-state-${vp.name}.png`)
            await page.screenshot({ path: screenshotPath })
            console.log(`Saved visual fixture screenshot: ${screenshotPath}`)
        })

        test(`Verify Interactive Reading Flow on ${vp.name}`, async ({ page }) => {
            await page.setViewportSize({ width: vp.width, height: vp.height })

            // Mock submit API response
            await page.route('**/api/v1/reading/R-A1-DEV-001/submit', async route => {
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify({
                        success: true,
                        data: {
                            score: 1,
                            totalQuestions: 1,
                            percentage: 100,
                            xpEarned: 15,
                            fucoinEarned: 10,
                            timeTaken: 10,
                            questEpisodeReceipt: {
                                completedCheckpoints: 1,
                                checkpointCount: 1,
                                accuracyBand: 'EXCELLENT',
                                masteryContribution: 'Chúc mừng! Bạn đã hoàn thành xuất sắc phần đọc.',
                                recommendedAction: 'next_episode',
                                nextEpisodeHref: '/reading'
                            },
                            rewardPreview: [
                                { type: 'xp', label: '+15 XP', detail: 'Hoàn thành bài đọc' }
                            ],
                            questionResults: [
                                {
                                    questionId: 'q-1',
                                    questionNumber: 1,
                                    statement: 'Lina liest eine kurze Nachricht.',
                                    isCorrect: true,
                                    userAnswer: 'richtig',
                                    correctAnswer: 'richtig',
                                    explanation: 'Lina liest eine kurze Nachricht ueber einen Sprachkurs.'
                                }
                            ]
                        }
                    })
                })
            })

            // Go to seeded developer reading exercise
            await page.goto('/reading/R-A1-DEV-001')
            await page.waitForLoadState('networkidle')
            await hideDevOverlay(page)

            // ═══ Phase 1: Intro Screen ═══
            const startBtn = page.locator('button', { hasText: 'Bắt đầu bài đọc' }).first()
            await expect(startBtn).toBeVisible()

            // Take intro screenshot in-memory
            const introScreenshotBuffer = await page.screenshot()

            // Click start button to enter warmup
            await startBtn.click()
            await page.waitForTimeout(500)

            // ═══ Phase 2: Warmup Screen ═══
            // Warmup Step 0: Vocabulary Preview
            const nextStepBtn = page.locator('button', { hasText: 'Tiếp Bước' }).first()
            await expect(nextStepBtn).toBeVisible()
            await nextStepBtn.click()
            await page.waitForTimeout(300)

            // Warmup Step 1: Activation Question
            await expect(nextStepBtn).toBeVisible()
            await nextStepBtn.click()
            await page.waitForTimeout(300)

            // Warmup Step 2: Reading Focus
            const enterReadingBtn = page.locator('button', { hasText: 'Vào bài đọc' }).first()
            await expect(enterReadingBtn).toBeVisible()
            await enterReadingBtn.click()
            await page.waitForTimeout(500)

            // ═══ Phase 3: Active Exercise ═══
            // Click answer option "Đúng" (richtig)
            const correctOptBtn = page.locator('button', { hasText: 'Đúng' }).first()
            await expect(correctOptBtn).toBeVisible()
            await correctOptBtn.click()

            // Take screenshot of answer selected in-memory
            const activeScreenshotBuffer = await page.screenshot()

            // Click submit button (Nộp bài (1/1))
            const submitBtn = page.locator('button', { hasText: /Nộp bài/i }).first()
            await expect(submitBtn).toBeVisible()
            await submitBtn.click()
            await page.waitForTimeout(500)

            // ═══ Phase 4: Results Screen ═══
            const summaryTitle = page.locator('h2', { hasText: /Xuất sắc!|Rất tốt!/i }).first()
            await expect(summaryTitle).toBeVisible()

            const nextEpisodeBtn = page.locator('button', { hasText: /Di tiep/i }).first()
            await expect(nextEpisodeBtn).toBeVisible()

            // Verify no horizontal overflow
            await expectNoHorizontalOverflow(page)

            // Take summary screenshot in-memory
            const resultsScreenshotBuffer = await page.screenshot()

            // Write all screenshots to disk
            fs.writeFileSync(path.join(OUT_DIR, `reading-intro-${vp.name}.png`), introScreenshotBuffer)
            fs.writeFileSync(path.join(OUT_DIR, `reading-active-${vp.name}.png`), activeScreenshotBuffer)
            fs.writeFileSync(path.join(OUT_DIR, `reading-results-${vp.name}.png`), resultsScreenshotBuffer)
            console.log(`Saved screenshots for interactive reading flow on ${vp.name}`)
        })

        test(`Verify Reading Submit Error Fallback on ${vp.name}`, async ({ page }) => {
            await page.setViewportSize({ width: vp.width, height: vp.height })

            // Mock submit API to fail with 500 status code
            await page.route('**/api/v1/reading/R-A1-DEV-001/submit', async route => {
                await route.fulfill({
                    status: 500,
                    contentType: 'application/json',
                    body: JSON.stringify({ success: false, error: 'Database transaction aborted' })
                })
            })

            // Go to seeded developer reading exercise and skip to exercise phase
            await page.goto('/reading/R-A1-DEV-001')
            await page.waitForLoadState('networkidle')
            await hideDevOverlay(page)

            const startBtn = page.locator('button', { hasText: 'Bắt đầu bài đọc' }).first()
            await startBtn.click()
            await page.waitForTimeout(300)

            const nextStepBtn = page.locator('button', { hasText: 'Tiếp Bước' }).first()
            await nextStepBtn.click()
            await page.waitForTimeout(300)
            await nextStepBtn.click()
            await page.waitForTimeout(300)

            const enterReadingBtn = page.locator('button', { hasText: 'Vào bài đọc' }).first()
            await enterReadingBtn.click()
            await page.waitForTimeout(500)

            // Select answer "Đúng"
            const correctOptBtn = page.locator('button', { hasText: 'Đúng' }).first()
            await correctOptBtn.click()

            // Click submit button
            const submitBtn = page.locator('button', { hasText: /Nộp bài/i }).first()
            await submitBtn.click()

            // Verify error message is displayed and option remains selected
            const errorBox = page.locator('div', { hasText: /Nộp bài không thành công/i }).first()
            await expect(errorBox).toBeVisible()

            const correctOptSelected = page.locator('button[class*="selected"]', { hasText: 'Đúng' }).first()
            await expect(correctOptSelected).toBeVisible()

            // Verify no horizontal overflow
            await expectNoHorizontalOverflow(page)

            // Capture screenshot of submission error
            const screenshotPath = path.join(OUT_DIR, `reading-submit-error-${vp.name}.png`)
            await page.screenshot({ path: screenshotPath })
            console.log(`Saved submit error screenshot: ${screenshotPath}`)
        })
    }
})
