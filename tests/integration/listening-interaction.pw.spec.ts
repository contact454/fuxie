import { expect, test, type Page } from '@playwright/test'
import * as fs from 'node:fs'
import * as path from 'node:path'

const OUT_DIR = path.resolve(__dirname, '..', '..', 'tmp', 'browser-qa', 'listening')

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

test.describe('Listening Module E2E & Visual Verification', () => {
    test.beforeAll(() => {
        if (!fs.existsSync(OUT_DIR)) {
            fs.mkdirSync(OUT_DIR, { recursive: true })
        }
    })

    // Force Vietnamese locale using cookie and mock HTMLMediaElement prototype to prevent audio errors
    test.beforeEach(async ({ context, page }) => {
        await context.addCookies([{
            name: 'NEXT_LOCALE',
            value: 'vi',
            url: 'http://localhost:3005',
        }])

        // Intercept all mp3 audio fetches and fulfill with empty mock audio
        await page.route('**/*.mp3', async route => {
            await route.fulfill({
                status: 200,
                contentType: 'audio/mpeg',
                body: Buffer.alloc(0),
            })
        })

        // Inject HTMLMediaElement mocks before any script runs on the page
        await page.addInitScript(() => {
            const originalAddEventListener = HTMLMediaElement.prototype.addEventListener
            HTMLMediaElement.prototype.addEventListener = function(type, listener, options) {
                if (type === 'error') {
                    // Suppress error handler registration so React state never transitions to audioError
                    return
                }
                originalAddEventListener.call(this, type, listener, options)

                if (type === 'loadedmetadata') {
                    // Force duration and readyState values and dispatch metadata events
                    setTimeout(() => {
                        Object.defineProperty(this, 'readyState', { get: () => 4, configurable: true })
                        Object.defineProperty(this, 'duration', { get: () => 180, configurable: true })
                        this.dispatchEvent(new Event('loadstart'))
                        this.dispatchEvent(new Event('durationchange'))
                        this.dispatchEvent(new Event('loadedmetadata'))
                        this.dispatchEvent(new Event('loadeddata'))
                        this.dispatchEvent(new Event('canplay'))
                        this.dispatchEvent(new Event('canplaythrough'))
                    }, 50)
                }
            }

            HTMLMediaElement.prototype.load = function() {
                setTimeout(() => {
                    Object.defineProperty(this, 'readyState', { get: () => 4, configurable: true })
                    Object.defineProperty(this, 'duration', { get: () => 180, configurable: true })
                    this.dispatchEvent(new Event('loadstart'))
                    this.dispatchEvent(new Event('durationchange'))
                    this.dispatchEvent(new Event('loadedmetadata'))
                    this.dispatchEvent(new Event('loadeddata'))
                    this.dispatchEvent(new Event('canplay'))
                    this.dispatchEvent(new Event('canplaythrough'))
                }, 50)
            }

            HTMLMediaElement.prototype.play = async function() {
                Object.defineProperty(this, 'paused', { get: () => false, configurable: true })
                this.dispatchEvent(new Event('play'))
                this.dispatchEvent(new Event('playing'))
                return Promise.resolve()
            }

            HTMLMediaElement.prototype.pause = function() {
                Object.defineProperty(this, 'paused', { get: () => true, configurable: true })
                this.dispatchEvent(new Event('pause'))
            }
        })
    })

    const viewports = [
        { name: 'desktop', width: 1440, height: 900 },
        { name: 'mobile', width: 390, height: 844 }
    ]

    for (const vp of viewports) {
        test(`Verify Listening Loading Visual Fixture on ${vp.name}`, async ({ page }) => {
            await page.setViewportSize({ width: vp.width, height: vp.height })

            // Navigate to the visual QA route for listening loading state
            await page.goto('/listening/visual-audio-loading?state=loading&fixture=visual-qa')
            await page.waitForLoadState('networkidle')
            await hideDevOverlay(page)

            // Assert exact container/state roles are visible
            const loadingState = page.locator('[data-role="listening-loading-state"]')
            await expect(loadingState).toBeVisible()

            const player = page.locator('[data-role="waveform-player"]')
            await expect(player).toBeVisible()
            await expect(player).toHaveAttribute('aria-busy', 'true')

            // Verify no horizontal overflow
            await expectNoHorizontalOverflow(page)

            // Capture screenshot
            const screenshotPath = path.join(OUT_DIR, `listening-loading-${vp.name}.png`)
            await page.screenshot({ path: screenshotPath })
            console.log(`Saved visual fixture screenshot: ${screenshotPath}`)
        })

        test(`Verify Interactive Listening Lesson Flow on ${vp.name}`, async ({ page }) => {
            await page.setViewportSize({ width: vp.width, height: vp.height })

            // Go to seeded developer listening lesson
            await page.goto('/listening/L-A1-GOETHE-001-T1')
            await page.waitForLoadState('networkidle')
            await hideDevOverlay(page)

            // 1. Hero page: click "Bắt đầu nghe"
            const startBtn = page.locator('button').filter({ hasText: /Bắt đầu nghe/i })
            await expect(startBtn).toBeVisible()
            await startBtn.click()
            await page.waitForTimeout(500)

            // 2. Play / Pause toggle interaction
            const playerCard = page.locator('div.bg-white.rounded-2xl.p-5')
            const playBtn = playerCard.locator('button').first()
            await expect(playBtn).toBeVisible()
            // Click play and verify playing state or toggle
            await playBtn.click()
            await page.waitForTimeout(200)
            await playBtn.click()

            // 3. Select answer: c) In Berlin.
            const mcOption = page.locator('button').filter({ hasText: 'c) In Berlin.' }).first()
            await expect(mcOption).toBeVisible()
            await mcOption.click()

            // 4. Submit answer
            const submitBtn = page.locator('button').filter({ hasText: /Nộp bài/i }).first()
            await expect(submitBtn).toBeVisible()
            await expect(submitBtn).not.toBeDisabled()
            await submitBtn.click()
            await page.waitForTimeout(1000)

            // 5. Results Screen (CompletionFlow)
            // Assert success status is shown
            const successTitle = page.locator('h2').filter({ hasText: /Nghe rất sắc|Rất tốt/i }).first()
            await expect(successTitle).toBeVisible()

            const scoreText = page.locator('div').filter({ hasText: '1/1' }).first()
            await expect(scoreText).toBeVisible()

            // 6. Open and close Transcript responsive drawer (rendered in results view)
            const showTranscriptBtn = page.getByRole('button', { name: 'Xem transcript' })
            await expect(showTranscriptBtn).toBeVisible()
            await showTranscriptBtn.click()
            await page.waitForTimeout(300)

            // Assert transcript content is now shown
            const transcriptText = page.locator('span').filter({ hasText: 'Sie hören sechs kurze Gespräche' }).first()
            await expect(transcriptText).toBeVisible()

            // Close transcript drawer
            const hideTranscriptBtn = page.getByRole('button', { name: 'Ẩn transcript' })
            await expect(hideTranscriptBtn).toBeVisible()
            await hideTranscriptBtn.click()
            await page.waitForTimeout(300)
            await expect(transcriptText).not.toBeVisible()

            // Verify no horizontal overflow on results
            await expectNoHorizontalOverflow(page)

            // Take results page screenshot
            const screenshotPath = path.join(OUT_DIR, `listening-results-${vp.name}.png`)
            await page.screenshot({ path: screenshotPath })
            console.log(`Saved interactive flow results screenshot: ${screenshotPath}`)
        })

        test(`Verify Listening Max Plays Constraint on ${vp.name}`, async ({ page }) => {
            await page.setViewportSize({ width: vp.width, height: vp.height })

            // Go to seeded developer listening lesson
            await page.goto('/listening/L-A1-GOETHE-001-T1')
            await page.waitForLoadState('networkidle')
            await hideDevOverlay(page)

            // Start the lesson
            const startBtn = page.locator('button').filter({ hasText: /Bắt đầu nghe/i })
            await expect(startBtn).toBeVisible()
            await startBtn.click()
            await page.waitForTimeout(500)

            // Mock ended events on the audio element to simulate reaching play limit (2 plays for A1)
            await page.evaluate(() => {
                const audio = document.querySelector('audio:not([data-role="listening-asset-probe"])')
                if (audio) {
                    audio.dispatchEvent(new Event('ended'))
                    audio.dispatchEvent(new Event('ended'))
                }
            })
            await page.waitForTimeout(500)

            // Replay button should be disabled now
            const replayBtn = page.locator('button').filter({ hasText: /Nghe lại/i })
            await expect(replayBtn).toBeVisible()
            await expect(replayBtn).toBeDisabled()

            // Verify no horizontal overflow
            await expectNoHorizontalOverflow(page)
        })

        test(`Verify Listening Submit Error Fallback on ${vp.name}`, async ({ page }) => {
            await page.setViewportSize({ width: vp.width, height: vp.height })

            // Mock submission endpoint to fail with 500 status code
            await page.route('**/api/v1/listening/L-A1-GOETHE-001-T1/submit', async route => {
                await route.fulfill({
                    status: 500,
                    contentType: 'application/json',
                    body: JSON.stringify({ success: false, error: 'Internal Server Error' }),
                })
            })

            // Go to seeded developer listening lesson
            await page.goto('/listening/L-A1-GOETHE-001-T1')
            await page.waitForLoadState('networkidle')
            await hideDevOverlay(page)

            // Start the lesson
            const startBtn = page.locator('button').filter({ hasText: /Bắt đầu nghe/i })
            await expect(startBtn).toBeVisible()
            await startBtn.click()
            await page.waitForTimeout(500)

            // Select answer: c) In Berlin.
            const mcOption = page.locator('button').filter({ hasText: 'c) In Berlin.' }).first()
            await expect(mcOption).toBeVisible()
            await mcOption.click()

            // Submit answer to trigger mocked error
            const submitBtn = page.locator('button').filter({ hasText: /Nộp bài/i }).first()
            await expect(submitBtn).toBeVisible()
            await submitBtn.click()
            await page.waitForTimeout(1000)

            // Verify that the error message is correctly displayed in Vietnamese
            const errorBanner = page.locator('div').filter({ hasText: 'Không thể nộp bài. Em vui lòng thử lại nhé.' }).first()
            await expect(errorBanner).toBeVisible()

            // Verify no horizontal overflow
            await expectNoHorizontalOverflow(page)

            // Capture screenshot of submission error fallback
            const screenshotPath = path.join(OUT_DIR, `listening-submit-error-${vp.name}.png`)
            await page.screenshot({ path: screenshotPath })
            console.log(`Saved submit error screenshot: ${screenshotPath}`)
        })
    }
})
