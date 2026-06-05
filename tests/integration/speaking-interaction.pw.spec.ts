import { expect, test, type Page } from '@playwright/test'
import * as fs from 'node:fs'
import * as path from 'node:path'

// Save screenshots inside node_modules/.cache which is recursively ignored by Next.js file watcher.
const OUT_DIR = process.env.FUXIE_QA_OUT_DIR
    ? path.resolve(process.env.FUXIE_QA_OUT_DIR)
    : path.resolve(__dirname, '..', '..', 'node_modules', '.cache', 'browser-qa', 'speaking')

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

test.describe('Speaking Module E2E & Visual Verification', () => {
    test.beforeAll(() => {
        if (!fs.existsSync(OUT_DIR)) {
            fs.mkdirSync(OUT_DIR, { recursive: true })
        }
    })

    // Force Vietnamese locale using cookie and mock navigator.mediaDevices.getUserMedia + AudioContext + MediaRecorder
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

        // Intercept all mp3 audio fetches and fulfill with empty mock audio
        await page.route('**/*.mp3', async route => {
            await route.fulfill({
                status: 200,
                contentType: 'audio/mpeg',
                body: Buffer.alloc(0),
            })
        })

        // Inject MediaRecorder, getUserMedia, and AudioContext mock definitions before page load
        await page.addInitScript(() => {
            // Mock getUserMedia
            if (navigator.mediaDevices) {
                navigator.mediaDevices.getUserMedia = async () => {
                    const mockTrack = {
                        kind: 'audio',
                        enabled: true,
                        id: 'mock-track-id',
                        label: 'Mock Audio Track',
                        readyState: 'live',
                        stop: () => {},
                        addEventListener: () => {},
                        removeEventListener: () => {},
                        dispatchEvent: () => true,
                    }
                    return {
                        getTracks: () => [mockTrack],
                        getAudioTracks: () => [mockTrack],
                        getVideoTracks: () => [],
                        addTrack: () => {},
                        removeTrack: () => {},
                        clone: () => this,
                        active: true,
                        id: 'mock-stream-id',
                        addEventListener: () => {},
                        removeEventListener: () => {},
                        dispatchEvent: () => true,
                    } as any
                }
            }

            // Mock MediaRecorder
            class MockMediaRecorder extends EventTarget {
                stream: any
                options: any
                state: 'inactive' | 'recording' | 'paused'
                intervalId: any
                
                static isTypeSupported(mimeType: string) {
                    return true
                }
                
                constructor(stream: any, options: any) {
                    super()
                    this.stream = stream
                    this.options = options
                    this.state = 'inactive'
                }

                dispatchEvent(event: Event): boolean {
                    const result = super.dispatchEvent(event)
                    const handlerName = 'on' + event.type
                    if (typeof (this as any)[handlerName] === 'function') {
                        try {
                            ;(this as any)[handlerName](event)
                        } catch (e) {
                            console.error('Error in MockMediaRecorder handler ' + handlerName + ':', e)
                        }
                    }
                    return result
                }
                
                start(timeslice?: number) {
                    this.state = 'recording'
                    this.dispatchEvent(new Event('start'))
                    this.intervalId = setInterval(() => {
                        const dummyBlob = new Blob([new Uint8Array(100)], { type: 'audio/webm' })
                        const event = new Event('dataavailable') as any
                        event.data = dummyBlob
                        this.dispatchEvent(event)
                    }, timeslice || 100)
                }
                
                stop() {
                    this.state = 'inactive'
                    if (this.intervalId) {
                        clearInterval(this.intervalId)
                    }
                    const dummyBlob = new Blob([new Uint8Array(100)], { type: 'audio/webm' })
                    const event = new Event('dataavailable') as any
                    event.data = dummyBlob
                    this.dispatchEvent(event)
                    this.dispatchEvent(new Event('stop'))
                }
            }

            (window as any).MediaRecorder = MockMediaRecorder

            // Mock AudioContext methods to avoid type checks and decoding failures
            const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
            if (AudioContextClass) {
                AudioContextClass.prototype.createMediaStreamSource = function(stream: any) {
                    return this.createGain()
                }
                AudioContextClass.prototype.decodeAudioData = async function() {
                    return this.createBuffer(1, 16000, 16000)
                }
                AudioContextClass.prototype.close = async function() {
                    return
                }
            }
        })
    })

    const viewports = [
        { name: 'desktop', width: 1440, height: 900 },
        { name: 'mobile', width: 390, height: 844 }
    ]

    for (const vp of viewports) {
        test(`Verify Speaking Error Visual Fixture on ${vp.name}`, async ({ page }) => {
            await page.setViewportSize({ width: vp.width, height: vp.height })

            // Navigate to the visual QA route for speaking error state
            await page.goto('/speaking/dev-a1-begruessung-01?state=error&fixture=visual-qa')
            await page.waitForLoadState('networkidle')
            await hideDevOverlay(page)

            // Assert exact container/state roles are visible
            const errorState = page.locator('[data-role="speaking-error-state"]')
            await expect(errorState).toBeVisible()

            const meter = page.locator('[data-role="pronunciation-meter"]')
            await expect(meter).toBeVisible()

            const scoreText = meter.locator('p').filter({ hasText: '42%' })
            await expect(scoreText).toBeVisible()

            // Verify no horizontal overflow
            await expectNoHorizontalOverflow(page)

            // Capture screenshot
            const screenshotPath = path.join(OUT_DIR, `speaking-error-state-${vp.name}.png`)
            await page.screenshot({ path: screenshotPath })
            console.log(`Saved visual fixture screenshot: ${screenshotPath}`)
        })

        test(`Verify Interactive Speaking Flow on ${vp.name}`, async ({ page }) => {
            await page.setViewportSize({ width: vp.width, height: vp.height })

            // Mock evaluate API response based on input sentences
            await page.route('**/api/v1/speaking/evaluate', async (route, request) => {
                const bodyStr = request.postData() || ''
                let refText = 'Hallo, ich heisse Anna.'
                if (bodyStr.includes('Vietnam')) {
                    refText = 'Ich komme aus Vietnam.'
                } else if (bodyStr.includes('Deutsch')) {
                    refText = 'Ich lerne Deutsch.'
                }

                const words = refText.replace(/[!?.,:;]/g, '').split(/\s+/).filter(Boolean)

                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify({
                        transcript: refText,
                        accuracy: 95,
                        durationSec: 2,
                        words: words.map(w => ({
                            word: w,
                            status: 'correct',
                            score: 95
                        })),
                        overallTips: ['💡 Phát âm rất tốt.'],
                        suggestRetry: false
                    })
                })
            })

            // Mock progress API response
            await page.route('**/api/v1/speaking/progress', async route => {
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify({
                        success: true,
                        xpEarned: 15,
                        stars: 3,
                        questEpisodeReceipt: {
                            completedCheckpoints: 3,
                            checkpointCount: 3,
                            scoreBand: 'EXCELLENT',
                            masteryContribution: 'Chúc mừng! Bạn đã hoàn thành xuất sắc phần luyện nói.',
                            pronunciationFeedbackState: 'evaluated'
                        }
                    })
                })
            })

            // Go to seeded developer speaking lesson
            await page.goto('/speaking/dev-a1-begruessung-01')
            await page.waitForLoadState('networkidle')
            await hideDevOverlay(page)

            // ═══ Phase 1: Intro Screen ═══
            // Assert lesson title and start button are visible
            const lessonTitle = page.locator('h1', { hasText: 'Hallo sagen' })
            await expect(lessonTitle).toBeVisible()

            const startBtn = page.locator('button[class*="btnPrimary"]').filter({ hasText: /Bắt đầu luyện tập/i }).first()
            await expect(startBtn).toBeVisible()

            // Take intro screenshot in-memory
            const introScreenshotBuffer = await page.screenshot()

            // Click start button
            await startBtn.click()
            await page.waitForTimeout(500)

            // ═══ Phase 2: Practice (Loop through 3 sentences) ═══
            let resultScreenshotBuffer: Buffer | null = null
            const sentencesCount = 3
            for (let i = 0; i < sentencesCount; i++) {
                // Ensure we are in recording/idle state (Nhấn nút mic để bắt đầu)
                const recordHint = page.locator('span[class*="waveformPlaceholder"]').first()
                await expect(recordHint).toBeVisible()
                await expect(recordHint).toHaveText(/Nhấn nút mic để bắt đầu/i)

                // Click record button (starts recording)
                const recordBtn = page.locator('button[class*="recordBtn"]').first()
                await expect(recordBtn).toBeVisible()
                await recordBtn.click()

                // Wait for recording active state (recordTimer becomes visible)
                const recordTimer = page.locator('span[class*="recordTimer"]').first()
                await expect(recordTimer).toBeVisible()

                // Click stop button (now it has class recordBtnRecording and stops recording)
                await recordBtn.click()

                // Wait for evaluation result panel to appear
                const resultPanel = page.locator('div[class*="resultPanel"]').first()
                await expect(resultPanel).toBeVisible()

                const scoreText = resultPanel.locator('div[class*="scoreValue"]').first()
                await expect(scoreText).toHaveText('95%')

                // Take screenshot of first sentence result in-memory
                if (i === 0) {
                    resultScreenshotBuffer = await page.screenshot()
                }

                // Click next/complete button
                const nextBtn = page.locator('button[class*="btnPrimary"]').filter({ hasText: i < sentencesCount - 1 ? /Tiếp theo/i : /Hoàn thành/i }).first()
                await expect(nextBtn).toBeVisible()
                await nextBtn.click()
                await page.waitForTimeout(500)
            }

            // ═══ Phase 3: Summary Screen ═══
            const summaryTitle = page.locator('h2', { hasText: 'Xuất sắc!' })
            await expect(summaryTitle).toBeVisible()

            const finalScore = page.locator('div[class*="scoreCircleContainer"]').locator('div[class*="scoreValue"]').first()
            await expect(finalScore).toHaveText('95%')

            const xpText = page.locator('span', { hasText: /\+15 XP/i })
            await expect(xpText).toBeVisible()

            // Verify no horizontal overflow
            await expectNoHorizontalOverflow(page)

            // Take summary screenshot in-memory
            const summaryScreenshotBuffer = await page.screenshot()

            // Write all screenshots to disk at the very end
            fs.writeFileSync(path.join(OUT_DIR, `speaking-intro-${vp.name}.png`), introScreenshotBuffer)
            console.log(`Saved speaking intro screenshot: speaking-intro-${vp.name}.png`)
            if (resultScreenshotBuffer) {
                fs.writeFileSync(path.join(OUT_DIR, `speaking-results-${vp.name}.png`), resultScreenshotBuffer)
                console.log(`Saved speaking results screenshot: speaking-results-${vp.name}.png`)
            }
            fs.writeFileSync(path.join(OUT_DIR, `speaking-summary-${vp.name}.png`), summaryScreenshotBuffer)
            console.log(`Saved speaking summary screenshot: speaking-summary-${vp.name}.png`)
        })

        test(`Verify Speaking Submit Error Fallback on ${vp.name}`, async ({ page }) => {
            await page.setViewportSize({ width: vp.width, height: vp.height })

            // Mock evaluate endpoint to fail with 500 status code
            await page.route('**/api/v1/speaking/evaluate', async route => {
                await route.fulfill({
                    status: 500,
                    contentType: 'application/json',
                    body: JSON.stringify({ success: false }),
                })
            })

            // Go to seeded developer speaking lesson and start practice
            await page.goto('/speaking/dev-a1-begruessung-01')
            await page.waitForLoadState('networkidle')
            await hideDevOverlay(page)

            const startBtn = page.locator('button[class*="btnPrimary"]').filter({ hasText: /Bắt đầu luyện tập/i }).first()
            await startBtn.click()
            await page.waitForTimeout(500)

            // Click record button
            const recordBtn = page.locator('button[class*="recordBtn"]').first()
            await recordBtn.click()
            
            // Wait for recording active state
            const recordTimer = page.locator('span[class*="recordTimer"]').first()
            await expect(recordTimer).toBeVisible()

            // Click stop button to trigger evaluation
            await recordBtn.click()

            // Verify that the Vietnamese error message is correctly displayed in the tips section
            const errorTip = page.locator('div[class*="tipsSection"]').locator('div[class*="tipItem"]', { hasText: '⚠️ Không thể kết nối hệ thống AI. Vui lòng thử lại.' }).first()
            await expect(errorTip).toBeVisible()

            // Verify no horizontal overflow
            await expectNoHorizontalOverflow(page)

            // Capture screenshot of submission error fallback
            const screenshotPath = path.join(OUT_DIR, `speaking-submit-error-${vp.name}.png`)
            await page.screenshot({ path: screenshotPath })
            console.log(`Saved submit error screenshot: ${screenshotPath}`)
        })
    }
})
