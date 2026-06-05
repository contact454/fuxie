import { expect, test, type Page } from '@playwright/test'
import * as fs from 'node:fs'
import * as path from 'node:path'

// Save screenshots inside FUXIE_QA_OUT_DIR or tmp folder
const OUT_DIR = process.env.FUXIE_QA_OUT_DIR
    ? path.resolve(process.env.FUXIE_QA_OUT_DIR)
    : path.resolve(__dirname, '..', '..', 'tmp', 'browser-qa', 'exam')

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

const mockExamList = [
    {
        id: 'dev-a1-goethe-mini',
        slug: 'dev-a1-goethe-mini',
        title: 'Dev A1 Goethe Mini',
        examType: 'GOETHE',
        cefrLevel: 'A1',
        totalMinutes: 10,
        totalPoints: 10,
        passingScore: 6,
        description: 'Luyện tập bài thi thử',
        sections: [
            { skill: 'LESEN', totalMinutes: 10, totalPoints: 10 }
        ],
        bestAttempt: null
    }
]

const mockExamStart = {
    attemptId: 'mock-attempt-123',
    exam: {
        id: 'dev-a1-goethe-mini',
        slug: 'dev-a1-goethe-mini',
        title: 'Dev A1 Goethe Mini',
        examType: 'GOETHE',
        cefrLevel: 'A1',
        totalMinutes: 10,
        totalPoints: 10,
        passingScore: 6,
        sections: [
            {
                id: 'section-1',
                title: 'Lesen',
                skill: 'LESEN',
                totalMinutes: 10,
                totalPoints: 10,
                instructions: 'Đọc bài và trả lời Đúng hoặc Sai.',
                tasks: [
                    {
                        id: 'task-1',
                        title: 'Aufgabe 1',
                        exerciseType: 'TRUE_FALSE',
                        contentJson: {
                            passage: 'Lina lernt Deutsch. Deutsch lernen macht Spass.',
                            items: [
                                { id: 'item-1', statement: 'Lina lernt Deutsch.' }
                            ]
                        },
                        audioUrl: null,
                        imageUrl: null,
                        maxPoints: 10
                    }
                ]
            }
        ]
    }
}

test.describe('Exam Prep Module E2E & Visual Verification', () => {
    test.beforeAll(() => {
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
        test(`Verify Exam Timeout Visual Fixture on ${vp.name}`, async ({ page }) => {
            await page.setViewportSize({ width: vp.width, height: vp.height })

            // Navigate to the visual QA route for timeout state
            await page.goto('/exam/dev-a1-goethe-mini?fixture=visual-qa&state=timeout')
            await page.waitForLoadState('networkidle')
            await hideDevOverlay(page)

            // Assert timeout state is visible
            const timeoutState = page.locator('[data-role="exam-timeout-state"]')
            await expect(timeoutState).toBeVisible()

            const timeoutDialog = page.locator('[data-role="exam-timeout-dialog"]')
            await expect(timeoutDialog).toBeVisible()
            await expect(timeoutDialog).toHaveAttribute('role', 'alertdialog')

            // Verify no horizontal overflow
            await expectNoHorizontalOverflow(page)

            // Capture screenshot
            const screenshotPath = path.join(OUT_DIR, `exam-timeout-${vp.name}.png`)
            await page.screenshot({ path: screenshotPath })
            console.log(`Saved visual fixture screenshot: ${screenshotPath}`)
        })

        test(`Verify Interactive Exam Prep Flow on ${vp.name}`, async ({ page }) => {
            await page.setViewportSize({ width: vp.width, height: vp.height })

            // Mock exams list API call
            await page.route('**/api/v1/exams', async route => {
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify({
                        success: true,
                        data: mockExamList
                    })
                })
            })

            // Mock start exam API call
            await page.route('**/api/v1/exams/dev-a1-goethe-mini/start', async route => {
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify({
                        success: true,
                        data: mockExamStart
                    })
                })
            })

            // Mock submit exam API call (success path)
            await page.route('**/api/v1/exams/dev-a1-goethe-mini/submit', async route => {
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify({
                        success: true,
                        data: {
                            attemptId: 'mock-attempt-123',
                            totalScore: 10,
                            maxScore: 10,
                            percentScore: 100,
                            passed: true,
                            xpEarned: 80,
                            streak: {
                                currentStreak: 3,
                                freezesAvailable: 2,
                                freezesUsed: 0,
                                freezeUsed: false
                            },
                            sectionScores: [
                                { score: 10, maxScore: 10, skill: 'LESEN' }
                            ]
                        }
                    })
                })
            })

            // Go to exam list dashboard page
            await page.goto('/exam')
            await page.waitForLoadState('networkidle')
            await hideDevOverlay(page)

            // Find starting button CTA on listing
            const startCta = page.locator('a', { hasText: /Bắt đầu|Luyện lại/i }).first()
            await expect(startCta).toBeVisible()
            await startCta.click()
            await page.waitForLoadState('networkidle')
            await hideDevOverlay(page)

            // Verify countdown timer is visible and active
            const timer = page.locator('[data-role="exam-timer"]').first()
            await expect(timer).toBeVisible()
            await expect(timer).toHaveText(/^\d{2}:\d{2}$/)

            // Answer the True/False question: click "Đúng"
            const correctOptBtn = page.locator('button', { hasText: 'Đúng' }).first()
            await expect(correctOptBtn).toBeVisible()
            await correctOptBtn.click()
            await page.waitForTimeout(300)

            // Take active in-progress page screenshot
            const activeScreenshotBuffer = await page.screenshot()

            // Open submission confirmation modal
            const noptBtn = page.locator('button', { hasText: /Nộp bài/i }).first()
            await expect(noptBtn).toBeVisible()
            await noptBtn.click()
            await page.waitForTimeout(300)

            // Click confirm submit within modal
            const confirmBtn = page.locator('[data-role="primary-cta"]', { hasText: /Nộp bài/i }).first()
            await expect(confirmBtn).toBeVisible()
            await confirmBtn.click()
            await page.waitForTimeout(1000) // wait for Result Reward Loop transition

            // Verify success receipt page (CompletionFlow)
            const resultsTitle = page.locator('h2', { hasText: /Chinh phục Dev A1 Goethe Mini/i }).first()
            await expect(resultsTitle).toBeVisible()

            const accuracyText = page.locator('span', { hasText: '100%' }).first()
            await expect(accuracyText).toBeVisible()

            // Verify no horizontal overflow
            await expectNoHorizontalOverflow(page)

            // Take results page screenshot
            const resultsScreenshotBuffer = await page.screenshot()

            // Write interactive screenshots to disk
            fs.writeFileSync(path.join(OUT_DIR, `exam-active-${vp.name}.png`), activeScreenshotBuffer)
            fs.writeFileSync(path.join(OUT_DIR, `exam-results-${vp.name}.png`), resultsScreenshotBuffer)
            console.log(`Saved interactive flow screenshots on ${vp.name}`)
        })

        test(`Verify Exam Submit Error Fallback on ${vp.name}`, async ({ page }) => {
            await page.setViewportSize({ width: vp.width, height: vp.height })

            // Mock start exam API call
            await page.route('**/api/v1/exams/dev-a1-goethe-mini/start', async route => {
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify({
                        success: true,
                        data: mockExamStart
                    })
                })
            })

            // Mock submit exam API call to fail with 500 error
            await page.route('**/api/v1/exams/dev-a1-goethe-mini/submit', async route => {
                await route.fulfill({
                    status: 500,
                    contentType: 'application/json',
                    body: JSON.stringify({
                        success: false,
                        error: 'Lỗi hệ thống database khi lưu bài thi.'
                    })
                })
            })

            // Go directly to the active exam session
            await page.goto('/exam/dev-a1-goethe-mini')
            await page.waitForLoadState('networkidle')
            await hideDevOverlay(page)

            // Click answer "Đúng"
            const correctOptBtn = page.locator('button', { hasText: 'Đúng' }).first()
            await expect(correctOptBtn).toBeVisible()
            await correctOptBtn.click()
            await page.waitForTimeout(300)

            // Click Nộp bài to open confirmation modal
            const noptBtn = page.locator('button', { hasText: /Nộp bài/i }).first()
            await expect(noptBtn).toBeVisible()
            await noptBtn.click()
            await page.waitForTimeout(300)

            // Confirm submit
            const confirmBtn = page.locator('[data-role="primary-cta"]', { hasText: /Nộp bài/i }).first()
            await expect(confirmBtn).toBeVisible()
            await confirmBtn.click()
            await page.waitForTimeout(1000) // wait for failure fallback state

            // Confirm submit error is shown in Vietnamese/German (bilingual)
            const errorMsg = page.locator('[data-role="exam-submit-error"]').first()
            await expect(errorMsg).toBeVisible()
            await expect(errorMsg).toContainText(/Lỗi hệ thống database khi lưu bài thi|Lỗi kết nối|Nộp bài không thành công/i)

            // Verify option "Đúng" is still selected (state preservation)
            const activeCorrectOpt = page.locator('button', { hasText: 'Đúng' }).first()
            await expect(activeCorrectOpt).toHaveClass(/bg-green-500 text-white/)

            // Verify no horizontal overflow
            await expectNoHorizontalOverflow(page)

            // Take submit error screenshot
            const errorScreenshotBuffer = await page.screenshot()
            fs.writeFileSync(path.join(OUT_DIR, `exam-submit-error-${vp.name}.png`), errorScreenshotBuffer)
            console.log(`Saved submit error fallback screenshots on ${vp.name}`)
        })
    }
})
