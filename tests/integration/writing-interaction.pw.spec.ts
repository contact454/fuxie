import { expect, test, type Page } from '@playwright/test'
import * as fs from 'node:fs'
import * as path from 'node:path'

const OUT_DIR = path.resolve(__dirname, '..', '..', 'tmp', 'browser-qa', 'writing')

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

test.describe('Writing Module E2E & Visual Verification', () => {
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
        test(`Verify Writing Error Visual Fixture on ${vp.name}`, async ({ page }) => {
            await page.setViewportSize({ width: vp.width, height: vp.height })

            // Navigate to the visual QA route for writing error state
            await page.goto('/writing/W-A1-T1-001?state=error&fixture=visual-qa')
            await page.waitForLoadState('networkidle')
            await hideDevOverlay(page)

            // Assert exact container/state roles are visible
            const errorState = page.locator('[data-role="writing-error-state"]')
            await expect(errorState).toBeVisible()

            const canvas = page.locator('[data-role="editor-canvas"]')
            await expect(canvas).toBeVisible()

            const feedback = page.locator('[data-role="writing-structure-feedback"]')
            await expect(feedback).toBeVisible()

            // Verify no horizontal overflow
            await expectNoHorizontalOverflow(page)

            // Capture screenshot
            const screenshotPath = path.join(OUT_DIR, `writing-error-state-${vp.name}.png`)
            await page.screenshot({ path: screenshotPath })
            console.log(`Saved visual fixture screenshot: ${screenshotPath}`)
        })

        test(`Verify Interactive Writing Formular Flow on ${vp.name}`, async ({ page }) => {
            await page.setViewportSize({ width: vp.width, height: vp.height })

            // Mock successful submission API response
            await page.route('**/api/v1/writing/submit', async route => {
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify({
                        success: true,
                        data: {
                            attemptId: 'test-attempt-formular-id',
                            xpEarned: 15,
                            streak: 1,
                            totalScore: 12,
                            maxScore: 15,
                            percentScore: 80,
                            estimatedLevel: 'A1',
                            overallFeedback: 'Rất tốt! Bạn đã điền biểu mẫu đầy đủ.',
                            overallFeedbackNative: 'Sehr gut! Du hast das Formular vollstaendig ausgefuellt.',
                            criteria: [
                                {
                                    id: 'inhalt',
                                    name: 'Inhalt',
                                    nameNative: 'Nội dung',
                                    score: 4,
                                    maxScore: 5,
                                    reasoning: 'Alle wichtigen Angaben sind eingetragen.',
                                    reasoningNative: 'Tất cả các thông tin quan trọng đều đã được điền.'
                                },
                                {
                                    id: 'korrektheit',
                                    name: 'Korrektheit',
                                    nameNative: 'Chính xác',
                                    score: 4,
                                    maxScore: 5,
                                    reasoning: 'Keine gravierenden Fehler.',
                                    reasoningNative: 'Không có lỗi nghiêm trọng.'
                                }
                            ],
                            corrections: []
                        }
                    })
                })
            })

            // Go to seeded developer writing formular lesson
            await page.goto('/writing/W-A1-T1-001')
            await page.waitForLoadState('networkidle')
            await hideDevOverlay(page)

            // Assert Fuxie mascot is present
            const coachMascot = page.locator('[data-role="fuxie-coach-mascot"]').first()
            await expect(coachMascot).toBeVisible()

            // Fill out 6 fields: Familienname, Vorname, Geburtsdatum, Adresse, Telefon, E-Mail
            await page.getByPlaceholder('Familienname').fill('Nguyen')
            await page.getByPlaceholder('Vorname').fill('Linh')
            await page.getByPlaceholder('Geburtsdatum').fill('1998-01-01')
            await page.getByPlaceholder('Adresse').fill('Hauptstrasse 12, 10115 Berlin')
            await page.getByPlaceholder('Telefon').fill('030 123456')
            await page.getByPlaceholder('E-Mail').fill('linh.nguyen@example.com')

            // Submit the form
            const submitBtn = page.locator('button').filter({ hasText: /Nộp bài/i }).first()
            await expect(submitBtn).toBeVisible()
            await expect(submitBtn).not.toBeDisabled()
            await submitBtn.click()
            await page.waitForTimeout(1000)

            // Results Screen (Feedback Phase)
            const evaluationHeader = page.locator('h3').filter({ hasText: /Bewertung/i }).first()
            await expect(evaluationHeader).toBeVisible()

            const scoreText = page.locator('div').filter({ hasText: '12/15' }).first()
            await expect(scoreText).toBeVisible()

            // Verify no horizontal overflow
            await expectNoHorizontalOverflow(page)

            // Take results page screenshot
            const screenshotPath = path.join(OUT_DIR, `writing-formular-results-${vp.name}.png`)
            await page.screenshot({ path: screenshotPath })
            console.log(`Saved interactive formular results screenshot: ${screenshotPath}`)
        })

        test(`Verify Interactive Writing E-Mail Flow on ${vp.name}`, async ({ page }) => {
            await page.setViewportSize({ width: vp.width, height: vp.height })

            // Mock successful submission API response
            await page.route('**/api/v1/writing/submit', async route => {
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify({
                        success: true,
                        data: {
                            attemptId: 'test-attempt-email-id',
                            xpEarned: 20,
                            streak: 1,
                            totalScore: 13,
                            maxScore: 15,
                            percentScore: 86,
                            estimatedLevel: 'A1',
                            overallFeedback: 'Thư viết tốt, ngữ pháp chuẩn chỉnh.',
                            overallFeedbackNative: 'Guter Brief, korrekte Grammatik.',
                            criteria: [
                                {
                                    id: 'inhalt',
                                    name: 'Inhalt',
                                    nameNative: 'Nội dung',
                                    score: 5,
                                    maxScore: 5,
                                    reasoning: 'Alle Inhaltspunkte abgedeckt.',
                                    reasoningNative: 'Đã bao phủ toàn bộ các ý cần viết.'
                                }
                            ],
                            corrections: [
                                {
                                    original: 'Hallo Tom',
                                    corrected: 'Hallo Tom,',
                                    type: 'Kommasetzung',
                                    typeNative: 'Đặt dấu phẩy',
                                    explanation: 'Nach der Anrede steht im Deutschen ein Komma.',
                                    explanationNative: 'Sau lời chào trong tiếng Đức cần có dấu phẩy.'
                                }
                            ]
                        }
                    })
                })
            })

            // Go to seeded developer writing email lesson
            await page.goto('/writing/W-A1-T2-001')
            await page.waitForLoadState('networkidle')
            await hideDevOverlay(page)

            // Assert Fuxie mascot is present
            const coachMascot = page.locator('[data-role="fuxie-coach-mascot"]').first()
            await expect(coachMascot).toBeVisible()

            // Fill text editor
            const textarea = page.getByPlaceholder('Viết bài của em tại đây...')
            await expect(textarea).toBeVisible()

            // Input enough words (30+)
            const textToSubmit = "Hallo Tom, ich danke dir herzlich fuer die Einladung zu deiner Geburtstagsparty. Ich komme sehr gerne und freue mich rất nhiều darauf. Soll ich einen Salat oder ein Getraenk mitbringen? Bitte gib mir Bescheid. Bis bald, dein Linh."
            await textarea.fill(textToSubmit)

            // Submit the email
            const submitBtn = page.locator('button').filter({ hasText: /Nộp bài/i }).first()
            await expect(submitBtn).toBeVisible()
            await expect(submitBtn).not.toBeDisabled()
            await submitBtn.click()
            await page.waitForTimeout(1000)

            // Results Screen (Feedback Phase)
            const evaluationHeader = page.locator('h3').filter({ hasText: /Bewertung/i }).first()
            await expect(evaluationHeader).toBeVisible()

            const scoreText = page.locator('div').filter({ hasText: '13/15' }).first()
            await expect(scoreText).toBeVisible()

            const correctionHeader = page.locator('h3').filter({ hasText: /Fehlerkorrektur/i }).first()
            await expect(correctionHeader).toBeVisible()

            // Verify no horizontal overflow
            await expectNoHorizontalOverflow(page)

            // Take results page screenshot
            const screenshotPath = path.join(OUT_DIR, `writing-email-results-${vp.name}.png`)
            await page.screenshot({ path: screenshotPath })
            console.log(`Saved interactive email results screenshot: ${screenshotPath}`)
        })

        test(`Verify Writing Submit Error Fallback on ${vp.name}`, async ({ page }) => {
            await page.setViewportSize({ width: vp.width, height: vp.height })

            // Mock submission endpoint to fail with 500 status code
            await page.route('**/api/v1/writing/submit', async route => {
                await route.fulfill({
                    status: 500,
                    contentType: 'application/json',
                    body: JSON.stringify({ success: false }),
                })
            })

            // Go to seeded developer writing email lesson
            await page.goto('/writing/W-A1-T2-001')
            await page.waitForLoadState('networkidle')
            await hideDevOverlay(page)

            // Fill text editor with valid content
            const textarea = page.getByPlaceholder('Viết bài của em tại đây...')
            await expect(textarea).toBeVisible()
            const textToSubmit = "Hallo Tom, ich danke dir herzlich fuer die Einladung zu deiner Geburtstagsparty. Ich komme sehr gerne und freue mich rất nhiều darauf. Soll ich einen Salat oder ein Getraenk mitbringen? Bitte gib mir Bescheid. Bis bald, dein Linh."
            await textarea.fill(textToSubmit)

            // Click submit to trigger error path
            const submitBtn = page.locator('button').filter({ hasText: /Nộp bài/i }).first()
            await expect(submitBtn).toBeVisible()
            await submitBtn.click()
            await page.waitForTimeout(1000)

            // Verify that the Vietnamese error message "Lỗi khi nộp bài." is correctly displayed
            const errorBanner = page.locator('div').filter({ hasText: 'Lỗi khi nộp bài.' }).first()
            await expect(errorBanner).toBeVisible()

            // Verify no horizontal overflow
            await expectNoHorizontalOverflow(page)

            // Capture screenshot of submission error fallback
            const screenshotPath = path.join(OUT_DIR, `writing-submit-error-${vp.name}.png`)
            await page.screenshot({ path: screenshotPath })
            console.log(`Saved submit error screenshot: ${screenshotPath}`)
        })
    }
})
