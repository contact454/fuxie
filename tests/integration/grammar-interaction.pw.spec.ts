import { expect, test, type Page } from '@playwright/test'
import * as fs from 'node:fs'
import * as path from 'node:path'

const OUT_DIR = path.resolve(__dirname, '..', '..', 'tmp', 'browser-qa', 'grammar')

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

test.describe('Grammar Module E2E & Visual Verification', () => {
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

    const viewports = [
        { name: 'desktop', width: 1440, height: 900 },
        { name: 'mobile', width: 390, height: 844 }
    ]

    for (const vp of viewports) {
        test(`Verify Grammar Error Visual Fixture on ${vp.name}`, async ({ page }) => {
            await page.setViewportSize({ width: vp.width, height: vp.height })

            // Navigate to the visual QA route for grammar error state
            await page.goto('/grammar/akkusativ-dativ/visual-lesson?state=error&fixture=visual-qa')
            await page.waitForLoadState('networkidle')
            await hideDevOverlay(page)

            // Assert exact container/state roles are visible
            const errorState = page.locator('[data-role="grammar-error-state"]')
            await expect(errorState).toBeVisible()

            const diagram = page.locator('[data-role="grammar-diagram"]')
            await expect(diagram).toBeVisible()

            const feedback = page.locator('[data-role="grammar-error-feedback"]')
            await expect(feedback).toBeVisible()

            // Verify no horizontal overflow
            await expectNoHorizontalOverflow(page)

            // Capture screenshot
            const screenshotPath = path.join(OUT_DIR, `grammar-error-${vp.name}.png`)
            await page.screenshot({ path: screenshotPath })
            console.log(`Saved visual fixture screenshot: ${screenshotPath}`)
        })

        test(`Verify Interactive Grammar Lesson Flow on ${vp.name}`, async ({ page }) => {
            await page.setViewportSize({ width: vp.width, height: vp.height })

            // Go to seeded developer grammar lesson
            await page.goto('/grammar/dev-praesens/dev-a1-praesens-01')
            await page.waitForLoadState('networkidle')
            await hideDevOverlay(page)

            // 1. Hero page: click "Bắt đầu học →"
            const startBtn = page.locator('button').filter({ hasText: /Bắt đầu học/i })
            await expect(startBtn).toBeVisible()
            await startBtn.click()
            await page.waitForTimeout(500)

            // 2. Exercise 1: Multiple choice
            const mcOption = page.locator('span').filter({ hasText: 'Ich lerne Deutsch.' }).first()
            await expect(mcOption).toBeVisible()
            await mcOption.click()

            const checkBtn1 = page.getByRole('button', { name: 'Kiểm tra' })
            await expect(checkBtn1).toBeVisible()
            await checkBtn1.click()

            const feedbackToast1 = page.locator('div').filter({ hasText: /Chính xác!/i }).first()
            await expect(feedbackToast1).toBeVisible()

            const nextBtn1 = page.locator('button').filter({ hasText: /Thử thách tiếp theo|Đã hiểu/i })
            await expect(nextBtn1).toBeVisible()
            await nextBtn1.click()
            await page.waitForTimeout(500)

            // 3. Exercise 2: Gap Fill Type
            const input = page.getByPlaceholder('Nhập đáp án...')
            await expect(input).toBeVisible()
            await input.fill('lerne')

            const checkBtn2 = page.getByRole('button', { name: 'Kiểm tra' })
            await expect(checkBtn2).toBeVisible()
            await checkBtn2.click()

            const feedbackToast2 = page.locator('div').filter({ hasText: /Chính xác!/i }).first()
            await expect(feedbackToast2).toBeVisible()

            const nextBtn2 = page.locator('button').filter({ hasText: /Thử thách tiếp theo|Đã hiểu/i })
            await expect(nextBtn2).toBeVisible()
            await nextBtn2.click()
            await page.waitForTimeout(500)

            // 4. Exercise 3: Sentence Reorder
            const chipIch = page.locator('div').filter({ hasText: /^Ich$/ }).first()
            const chipLerne = page.locator('div').filter({ hasText: /^lerne$/ }).first()
            const chipDeutsch = page.locator('div').filter({ hasText: /^Deutsch\.$/ }).first()

            await expect(chipIch).toBeVisible()
            await chipIch.click()
            await chipLerne.click()
            await chipDeutsch.click()

            const checkBtn3 = page.getByRole('button', { name: 'Kiểm tra' })
            await expect(checkBtn3).toBeVisible()
            await checkBtn3.click()

            const feedbackToast3 = page.locator('div').filter({ hasText: /Chính xác!/i }).first()
            await expect(feedbackToast3).toBeVisible()

            const nextBtn3 = page.locator('button').filter({ hasText: /Thử thách tiếp theo|Đã hiểu/i })
            await expect(nextBtn3).toBeVisible()
            await nextBtn3.click()
            await page.waitForTimeout(1000)

            // 5. Results Screen
            const resultTitle = page.locator('h1').filter({ hasText: /Hoàn thành!/i })
            await expect(resultTitle).toBeVisible()

            // Verify score 3/3
            const scoreText = page.locator('div').filter({ hasText: '3/3' }).first()
            await expect(scoreText).toBeVisible()

            // Confirm no sync errors are displayed on results
            const syncErrorTitle = page.locator('h3').filter({ hasText: /Đồng bộ tiến trình thất bại/i })
            await expect(syncErrorTitle).not.toBeVisible()

            // Verify no horizontal overflow
            await expectNoHorizontalOverflow(page)

            // Take results page screenshot
            const screenshotPath = path.join(OUT_DIR, `grammar-results-${vp.name}.png`)
            await page.screenshot({ path: screenshotPath })
            console.log(`Saved interactive flow results screenshot: ${screenshotPath}`)
        })

        test(`Verify Grading Unavailable Fallback on ${vp.name}`, async ({ page }) => {
            await page.setViewportSize({ width: vp.width, height: vp.height })

            // Mock grading API call to fail with 500 status code
            await page.route('**/api/v1/grade', async route => {
                await route.fulfill({
                    status: 500,
                    contentType: 'application/json',
                    body: JSON.stringify({ success: false, error: 'Internal Server Error' }),
                })
            })

            // Navigate to the visual QA route with state=grading-unavailable
            await page.goto('/grammar/akkusativ-dativ/visual-lesson?fixture=visual-qa&state=grading-unavailable')
            await page.waitForLoadState('networkidle')
            await hideDevOverlay(page)

            // Click start button to launch the exercise
            const startBtn = page.locator('button').filter({ hasText: /Bắt đầu học/i })
            await expect(startBtn).toBeVisible()
            await startBtn.click()
            await page.waitForTimeout(500)

            // Locate input and type an incorrect answer (e.g. "den") to trigger the grading API
            const input = page.getByPlaceholder('Nhập đáp án...')
            await expect(input).toBeVisible()
            await input.fill('den')

            // Click check button to submit answer and trigger the mocked failed API call
            const checkBtn = page.getByRole('button', { name: 'Kiểm tra' })
            await expect(checkBtn).toBeVisible()
            await checkBtn.click()
            await page.waitForTimeout(1000)

            // Verify that the status panel displays grading unavailable warning in Vietnamese
            const warningTitle = page.locator('div').filter({ hasText: 'Chưa chấm được bài này' }).first()
            await expect(warningTitle).toBeVisible()

            const warningDetail = page.locator('p').filter({ hasText: 'Có thể mạng hoặc AI đang chậm. Câu trả lời của em chưa bị tính sai, hãy thử lại nhé.' }).first()
            await expect(warningDetail).toBeVisible()

            // Verify that the check button text has changed to "Thử chấm lại"
            const retryBtn = page.getByRole('button', { name: 'Thử chấm lại' })
            await expect(retryBtn).toBeVisible()

            // Verify no horizontal overflow
            await expectNoHorizontalOverflow(page)

            // Capture screenshot of the fallback warning panel
            const screenshotPath = path.join(OUT_DIR, `grading-unavailable-${vp.name}.png`)
            await page.screenshot({ path: screenshotPath })
            console.log(`Saved grading fallback screenshot: ${screenshotPath}`)
        })
    }
})
