import { expect, test, type Page } from '@playwright/test'
import * as fs from 'node:fs'
import * as path from 'node:path'

// Save screenshots inside FUXIE_QA_OUT_DIR or tmp folder
const OUT_DIR = process.env.FUXIE_QA_OUT_DIR
    ? path.resolve(process.env.FUXIE_QA_OUT_DIR)
    : path.resolve(__dirname, '..', '..', 'tmp', 'browser-qa', 'review')

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

const mockSrsCards = [
    {
        id: '11111111-1111-1111-1111-111111111111',
        interval: 1,
        repetitions: 1,
        easeFactor: 2.5,
        state: 1,
        lapseCount: 0,
        vocabularyItem: {
            word: 'sozialer Status',
            article: 'MASKULIN',
            plural: 'Status',
            wordType: 'NOMEN',
            translations: {
                vi: 'địa vị xã hội',
                de: 'sozialer Status'
            },
            exampleSentence1: 'Er hat einen hohen sozialen Status.',
            exampleTranslation1: 'Anh ấy có địa vị xã hội cao.',
            notes: 'Danh từ giống đực',
            audioUrl: null,
            imageUrl: null
        }
    },
    {
        id: '22222222-2222-2222-2222-222222222222',
        interval: 2,
        repetitions: 2,
        easeFactor: 2.6,
        state: 1,
        lapseCount: 0,
        vocabularyItem: {
            word: 'neuronales Netz',
            article: 'NEUTRUM',
            plural: 'Netze',
            wordType: 'NOMEN',
            translations: {
                vi: 'mạng nơ-ron',
                de: 'neuronales Netz'
            },
            exampleSentence1: 'Künstliche neuronale Netze sind mächtig.',
            exampleTranslation1: 'Mạng nơ-ron nhân tạo rất mạnh mẽ.',
            notes: 'Danh từ giống trung',
            audioUrl: null,
            imageUrl: null
        }
    }
]

test.describe('SRS Review Module E2E & Visual Verification', () => {
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
        test(`Verify SRS Review Empty Visual Fixture on ${vp.name}`, async ({ page }) => {
            await page.setViewportSize({ width: vp.width, height: vp.height })

            // Navigate to the visual QA route for empty state
            await page.goto('/review?state=empty&fixture=visual-qa')
            await page.waitForLoadState('networkidle')
            await hideDevOverlay(page)

            // Assert empty state role is visible
            const emptyState = page.locator('[data-role="review-empty-state"]')
            await expect(emptyState).toBeVisible()

            const hero = page.locator('[data-role="review-backbone-hero"]')
            await expect(hero).toHaveAttribute('data-surface-state', 'empty')

            // Verify counters are 0
            const counters = hero.locator('[data-role="review-counter-value"]')
            await expect(counters).toHaveCount(2)
            await expect(counters.first()).toHaveText('0')
            await expect(counters.nth(1)).toHaveText('0')

            // Verify no horizontal overflow
            await expectNoHorizontalOverflow(page)

            // Capture screenshot
            const screenshotPath = path.join(OUT_DIR, `srs-empty-${vp.name}.png`)
            await page.screenshot({ path: screenshotPath })
            console.log(`Saved visual fixture screenshot: ${screenshotPath}`)
        })

        test(`Verify Interactive SRS Review Flow on ${vp.name}`, async ({ page }) => {
            await page.setViewportSize({ width: vp.width, height: vp.height })

            // Mock due API call to return our mock cards
            await page.route('**/api/v1/srs/due**', async route => {
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify({
                        success: true,
                        data: mockSrsCards
                    })
                })
            })

            // Mock review API submit call
            await page.route('**/api/v1/srs/review', async route => {
                const req = route.request()
                if (req.method() === 'POST') {
                    const payload = req.postDataJSON()
                    await route.fulfill({
                        status: 200,
                        contentType: 'application/json',
                        body: JSON.stringify({
                            success: true,
                            data: {
                                cardId: payload.cardId,
                                newInterval: 5,
                                newState: 2,
                                nextReviewAt: new Date(Date.now() + 86400000 * 5).toISOString(),
                                xpEarned: 10,
                                streak: 3
                            }
                        })
                    })
                } else {
                    await route.continue()
                }
            })

            // Go to review main page
            await page.goto('/review')
            await page.waitForLoadState('networkidle')
            await hideDevOverlay(page)

            // Capture intro screen screenshot
            const introScreenshotBuffer = await page.screenshot()

            // Click review due cards button (starts the review session)
            // It could say "Ôn tập ngay" or "Ôn X thẻ đến hạn"
            const startBtn = page.locator('button', { hasText: /thẻ đến hạn/i }).first()
            await expect(startBtn).toBeVisible()
            await startBtn.click()
            await page.waitForTimeout(500)

            // ═══ Flashcard 1 (Front) ═══
            const frontWord1 = page.locator('span', { hasText: 'sozialer Status' }).first()
            await expect(frontWord1).toBeVisible()

            // Take active front screenshot
            const activeFrontScreenshotBuffer = await page.screenshot()

            // Flip the flashcard
            await frontWord1.click()
            await page.waitForTimeout(300)

            // ═══ Flashcard 1 (Back) ═══
            const meaning1 = page.locator('p', { hasText: 'địa vị xã hội' }).first()
            await expect(meaning1).toBeVisible()

            // Confirm rating buttons are visible
            const ratingButtons = page.locator('button', { hasText: 'Dễ' }).first()
            await expect(ratingButtons).toBeVisible()

            // Take active back screenshot
            const activeBackScreenshotBuffer = await page.screenshot()

            // Click "Dễ" rating button
            await page.locator('button', { hasText: 'Dễ' }).first().click()
            await page.waitForTimeout(800) // wait for mascot transition

            // ═══ Flashcard 2 (Front) ═══
            const frontWord2 = page.locator('span', { hasText: 'neuronales Netz' }).first()
            await expect(frontWord2).toBeVisible()

            // Flip second card
            await frontWord2.click()
            await page.waitForTimeout(300)

            // Click "Ổn" rating button
            await page.locator('button', { hasText: 'Ổn' }).first().click()
            await page.waitForTimeout(800) // wait for mascot transition and finish

            // ═══ Session Complete ═══
            const resultsTitle = page.locator('h2', { hasText: /không nợ thẻ|đã hoàn thành/i }).first()
            // In complete screen it might render accuracy or stats
            const summaryBackBtn = page.locator('button', { hasText: 'Tổng quan' }).first()
            await expect(summaryBackBtn).toBeVisible()

            // Verify no horizontal overflow
            await expectNoHorizontalOverflow(page)

            // Take results screenshot
            const resultsScreenshotBuffer = await page.screenshot()

            // Write all screenshots to disk
            fs.writeFileSync(path.join(OUT_DIR, `srs-intro-${vp.name}.png`), introScreenshotBuffer)
            fs.writeFileSync(path.join(OUT_DIR, `srs-active-front-${vp.name}.png`), activeFrontScreenshotBuffer)
            fs.writeFileSync(path.join(OUT_DIR, `srs-active-back-${vp.name}.png`), activeBackScreenshotBuffer)
            fs.writeFileSync(path.join(OUT_DIR, `srs-results-${vp.name}.png`), resultsScreenshotBuffer)
            console.log(`Saved interactive review flow screenshots on ${vp.name}`)
        })

        test(`Verify SRS Review Sync Error Fallback on ${vp.name}`, async ({ page }) => {
            await page.setViewportSize({ width: vp.width, height: vp.height })

            // Mock due API call to return our mock cards
            await page.route('**/api/v1/srs/due**', async route => {
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify({
                        success: true,
                        data: mockSrsCards
                    })
                })
            })

            // Mock review API submit call to fail with 500
            let shouldFail = true
            await page.route('**/api/v1/srs/review', async route => {
                const req = route.request()
                if (req.method() === 'POST') {
                    if (shouldFail) {
                        await route.fulfill({
                            status: 500,
                            contentType: 'application/json',
                            body: JSON.stringify({
                                success: false,
                                error: 'Failed to record progress'
                            })
                        })
                    } else {
                        const payload = req.postDataJSON()
                        await route.fulfill({
                            status: 200,
                            contentType: 'application/json',
                            body: JSON.stringify({
                                success: true,
                                data: {
                                    cardId: payload.cardId,
                                    newInterval: 1,
                                    newState: 1,
                                    nextReviewAt: new Date().toISOString(),
                                    xpEarned: 10,
                                    streak: 3
                                }
                            })
                        })
                    }
                } else {
                    await route.continue()
                }
            })

            // Go to review main page
            await page.goto('/review')
            await page.waitForLoadState('networkidle')
            await hideDevOverlay(page)

            // Start review
            const startBtn = page.locator('button', { hasText: /thẻ đến hạn/i }).first()
            await startBtn.click()
            await page.waitForTimeout(500)

            // Flip first card
            const frontWord1 = page.locator('span', { hasText: 'sozialer Status' }).first()
            await expect(frontWord1).toBeVisible()
            await frontWord1.click()
            await page.waitForTimeout(300)

            // Click "Dễ" button -> triggers API call that fails with 500
            await page.locator('button', { hasText: 'Dễ' }).first().click()
            await page.waitForTimeout(800) // wait for mascot transition

            // Second card front should load, and the AMBER banner should be visible
            const errorBanner = page.locator('h3', { hasText: /Đồng bộ tiến trình thất bại/i }).first()
            await expect(errorBanner).toBeVisible()

            // Take submit error screenshot
            const errorScreenshotBuffer = await page.screenshot()

            // Turn off failures for retry test
            shouldFail = false

            // Click retry button in amber banner
            const retryBtn = page.locator('button', { hasText: 'Thử lại' }).first()
            await expect(retryBtn).toBeVisible()
            await retryBtn.click()
            await page.waitForTimeout(500)

            // Verify error banner is cleared
            await expect(errorBanner).not.toBeVisible()

            // Flip second card
            const frontWord2 = page.locator('span', { hasText: 'neuronales Netz' }).first()
            await expect(frontWord2).toBeVisible()
            await frontWord2.click()
            await page.waitForTimeout(300)

            // Click "Ổn" button -> triggers API call that succeeds
            await page.locator('button', { hasText: 'Ổn' }).first().click()
            await page.waitForTimeout(800) // wait for transition

            // Complete screen: should show completion and the error banner is NOT present
            const summaryBackBtn = page.locator('button', { hasText: 'Tổng quan' }).first()
            await expect(summaryBackBtn).toBeVisible()

            // Verify no horizontal overflow
            await expectNoHorizontalOverflow(page)

            // Save screenshot
            fs.writeFileSync(path.join(OUT_DIR, `srs-submit-error-${vp.name}.png`), errorScreenshotBuffer)
            console.log(`Saved sync error screenshots on ${vp.name}`)
        })
    }
})
