import { expect, test, type Page } from '@playwright/test'
import * as fs from 'node:fs'
import * as path from 'node:path'
import dotenv from 'dotenv'
import { PrismaClient } from '../../apps/web/generated/prisma'

// Load environment variables from workspace root .env
dotenv.config({ path: path.resolve(__dirname, '..', '..', '.env') })

const prisma = new PrismaClient()
const OUT_DIR = process.env.FUXIE_QA_OUT_DIR
    ? path.resolve(process.env.FUXIE_QA_OUT_DIR)
    : path.resolve(__dirname, '..', '..', 'tmp', 'browser-qa', 'badges-leaderboard')

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

test.describe('Badges and Leaderboard Modules E2E & Visual Verification', () => {
    let userId: string

    test.beforeAll(async () => {
        if (!fs.existsSync(OUT_DIR)) {
            fs.mkdirSync(OUT_DIR, { recursive: true })
        }

        // Find dev-learner user ID
        const user = await prisma.user.findUnique({
            where: { firebaseUid: 'dev-learner' },
        })
        if (!user) {
            throw new Error('dev-learner user not found. Please run seed-dev-data first.')
        }
        userId = user.id
    })

    test.afterAll(async () => {
        await prisma.$disconnect()
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
        // =====================================================================
        // BADGES TESTS
        // =====================================================================

        test(`Verify Badges Visual QA Success Fixture on ${vp.name}`, async ({ page }) => {
            await page.setViewportSize({ width: vp.width, height: vp.height })

            // Go to badges page under visual-qa fixture success state
            await page.goto('/badges?fixture=visual-qa&state=success')
            await page.waitForLoadState('networkidle')
            await hideDevOverlay(page)

            // Assert Slice 3 Motivation Fixture title and elements exist
            const badgeUnlockCard = page.locator('[data-role="rewards-badge-unlock-state"]').first()
            await expect(badgeUnlockCard).toBeVisible()
            await expect(badgeUnlockCard.locator('h2')).toContainText(/A2 Alltagssieger freigeschaltet/i)

            // Verify no horizontal overflow
            await expectNoHorizontalOverflow(page)

            // Save screenshot
            const screenshotPath = path.join(OUT_DIR, `badges-success-${vp.name}.png`)
            await page.screenshot({ path: screenshotPath })
            console.log(`Saved badges success fixture screenshot: ${screenshotPath}`)
        })

        test(`Verify Badges Dynamic Live DB State on ${vp.name}`, async ({ page }) => {
            await page.setViewportSize({ width: vp.width, height: vp.height })

            // 1. Seed Achievement and UserAchievement
            const firstQuestAchievement = await prisma.achievement.upsert({
                where: { slug: 'first-quest' },
                update: {},
                create: {
                    slug: 'first-quest',
                    title: 'Phát Súng Đầu Tiên',
                    description: 'Bước chân đầu tiên luôn nặng nề nhất — nhưng em đã vượt qua vạch xuất phát.',
                    category: 'learning',
                    conditionType: 'completions',
                    conditionValue: 1,
                    xpReward: 50
                }
            })

            await prisma.userAchievement.deleteMany({ where: { userId } })
            await prisma.analyticsEvent.deleteMany({
                where: { userId, eventName: 'meaningful_action_completed' }
            })

            // Mark first-quest as earned
            await prisma.userAchievement.create({
                data: {
                    userId,
                    achievementId: firstQuestAchievement.id,
                    earnedAt: new Date()
                }
            })

            // Add one vocabulary event to show 50% vocabulary-starter progress (needs 2)
            await prisma.analyticsEvent.create({
                data: {
                    userId,
                    role: 'LEARNER',
                    eventName: 'meaningful_action_completed',
                    actionId: 'action-1',
                    actionType: 'microgame_vocabulary',
                    skill: 'vocabulary',
                    level: 'A1',
                    createdAt: new Date()
                }
            })

            // Ensure user profile level is set to A1
            await prisma.userProfile.upsert({
                where: { userId },
                update: { currentLevel: 'A1' },
                create: { userId, displayName: 'Lina Nguyen', currentLevel: 'A1' }
            })

            // Go to badges page
            await page.goto('/badges')
            await page.waitForLoadState('networkidle')
            await hideDevOverlay(page)

            // Assert shelf headers and status panels
            await expect(page.locator('h1')).toContainText(/Ke thanh tuu hoc tap cua em/i)
            await expect(page.locator('p', { hasText: 'Earned' }).locator('..').locator('p').last()).toContainText('1')

            // Verify earned badge card exists and is visible
            const firstQuestCard = page.locator('div', { hasText: 'Phát Súng Đầu Tiên' }).first()
            await expect(firstQuestCard).toBeVisible()
            await expect(firstQuestCard.locator('span', { hasText: 'earned' }).first()).toBeVisible()

            // Verify active in-progress badge shows 50%
            const vocabStarterCard = page.locator('div', { hasText: 'Từ vựng Khởi Nguyên' }).first()
            await expect(vocabStarterCard).toBeVisible()
            await expect(vocabStarterCard.locator('span', { hasText: '50%' }).first()).toBeVisible()

            // Verify no horizontal overflow
            await expectNoHorizontalOverflow(page)

            // Save default badges screenshot
            const screenshotPath = path.join(OUT_DIR, `badges-default-${vp.name}.png`)
            await page.screenshot({ path: screenshotPath })
            console.log(`Saved badges default screenshot: ${screenshotPath}`)
        })

        // =====================================================================
        // LEADERBOARD TESTS
        // =====================================================================

        test(`Verify Leaderboard Weekly Success State on ${vp.name}`, async ({ page }) => {
            await page.setViewportSize({ width: vp.width, height: vp.height })

            // Mock weekly leaderboard API call
            await page.route('**/api/v1/leaderboard?period=weekly', async route => {
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify({
                        success: true,
                        data: {
                            period: 'weekly',
                            currentLeague: 'BRONZE',
                            entries: [
                                { rank: 1, userId: 'user-1', displayName: 'Anna Schmidt', avatarUrl: null, currentLevel: 'A2', weeklyXp: 850, totalXp: 2500, streak: 12, isCurrentUser: false },
                                { rank: 2, userId: 'user-2', displayName: 'Markus Weber', avatarUrl: null, currentLevel: 'B1', weeklyXp: 720, totalXp: 4200, streak: 8, isCurrentUser: false },
                                { rank: 3, userId: 'user-3', displayName: 'Sarah Meier', avatarUrl: null, currentLevel: 'A1', weeklyXp: 600, totalXp: 1200, streak: 5, isCurrentUser: false },
                                { rank: 4, userId: 'dev-learner-id', displayName: 'Lina Nguyen', avatarUrl: null, currentLevel: 'A2', weeklyXp: 450, totalXp: 3200, streak: 3, isCurrentUser: true }
                            ],
                            currentUser: { rank: 4, userId: 'dev-learner-id', displayName: 'Lina Nguyen', avatarUrl: null, currentLevel: 'A2', weeklyXp: 450, totalXp: 3200, streak: 3, isCurrentUser: true }
                        }
                    })
                })
            })

            // Go to leaderboard
            await page.goto('/leaderboard')
            await page.waitForLoadState('networkidle')
            await hideDevOverlay(page)

            // Assert Header
            await expect(page.locator('h1')).toContainText(/Giải đấu BRONZE/i)

            // Verify podium ranks
            const firstPlace = page.locator('div', { hasText: 'Anna Schmidt' }).first()
            await expect(firstPlace).toBeVisible()
            await expect(firstPlace).toContainText('850')

            // Verify current user highlighted row
            const currentUserRow = page.locator('p', { hasText: 'Lina Nguyen (Du)' }).locator('..').locator('..')
            await expect(currentUserRow).toBeVisible()
            await expect(currentUserRow).toHaveClass(/.*bg-gradient-to-r from-amber-50 to-orange-50.*/)

            // Verify no horizontal overflow
            await expectNoHorizontalOverflow(page)

            // Save weekly leaderboard screenshot
            const screenshotPath = path.join(OUT_DIR, `leaderboard-weekly-${vp.name}.png`)
            await page.screenshot({ path: screenshotPath })
            console.log(`Saved weekly leaderboard screenshot: ${screenshotPath}`)
        })

        test(`Verify Leaderboard Alltime Success State on ${vp.name}`, async ({ page }) => {
            await page.setViewportSize({ width: vp.width, height: vp.height })

            // Mock alltime leaderboard API call
            await page.route('**/api/v1/leaderboard?period=alltime', async route => {
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify({
                        success: true,
                        data: {
                            period: 'alltime',
                            entries: [
                                { rank: 1, userId: 'user-2', displayName: 'Markus Weber', avatarUrl: null, currentLevel: 'B1', weeklyXp: 0, totalXp: 4200, streak: 8, isCurrentUser: false },
                                { rank: 2, userId: 'dev-learner-id', displayName: 'Lina Nguyen', avatarUrl: null, currentLevel: 'A2', weeklyXp: 0, totalXp: 3200, streak: 3, isCurrentUser: true },
                                { rank: 3, userId: 'user-1', displayName: 'Anna Schmidt', avatarUrl: null, currentLevel: 'A2', weeklyXp: 0, totalXp: 2500, streak: 12, isCurrentUser: false }
                            ],
                            currentUser: { rank: 2, userId: 'dev-learner-id', displayName: 'Lina Nguyen', avatarUrl: null, currentLevel: 'A2', weeklyXp: 0, totalXp: 3200, streak: 3, isCurrentUser: true }
                        }
                    })
                })
            })

            // Mock weekly so initial page load works without failing
            await page.route('**/api/v1/leaderboard?period=weekly', async route => {
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify({ success: true, data: { entries: [] } })
                })
            })

            await page.goto('/leaderboard')
            await page.waitForLoadState('networkidle')
            await hideDevOverlay(page)

            // Click "Mọi thời gian" (alltime) tab button
            const alltimeTab = page.locator('button', { hasText: 'Mọi thời gian' }).first()
            await alltimeTab.click()
            await page.waitForTimeout(300)

            // Verify podium renders Markus Weber at rank 1
            const firstPlace = page.locator('div', { hasText: 'Markus Weber' }).first()
            await expect(firstPlace).toBeVisible()
            await expect(firstPlace).toContainText(/4[.,]200/)

            // Verify current user Lina Nguyen is on podium (2nd place)
            const secondPlace = page.locator('div', { hasText: 'Lina Nguyen' }).first()
            await expect(secondPlace).toBeVisible()
            await expect(secondPlace).toContainText(/3[.,]200/)

            // Verify no horizontal overflow
            await expectNoHorizontalOverflow(page)

            // Save alltime leaderboard screenshot
            const screenshotPath = path.join(OUT_DIR, `leaderboard-alltime-${vp.name}.png`)
            await page.screenshot({ path: screenshotPath })
            console.log(`Saved alltime leaderboard screenshot: ${screenshotPath}`)
        })

        test(`Verify Leaderboard Empty State on ${vp.name}`, async ({ page }) => {
            await page.setViewportSize({ width: vp.width, height: vp.height })

            // Goto shop using visual-qa empty fixture parameter to bypass DB loading
            await page.goto('/leaderboard?fixture=visual-qa&state=empty')
            await page.waitForLoadState('networkidle')
            await hideDevOverlay(page)

            // Assert empty illustration header and buttons are rendered
            const emptyRoot = page.locator('div', { hasText: 'Chưa có ai ghi XP trong bảng này' }).first()
            await expect(emptyRoot).toBeVisible()

            const questCta = emptyRoot.locator('a', { hasText: 'Làm quest hôm nay' }).first()
            await expect(questCta).toBeVisible()
            await expect(questCta).toHaveAttribute('href', '/dashboard')

            const srsCta = emptyRoot.locator('a', { hasText: 'Ôn SRS để lấy XP' }).first()
            await expect(srsCta).toBeVisible()
            await expect(srsCta).toHaveAttribute('href', '/review')

            // Verify no horizontal overflow
            await expectNoHorizontalOverflow(page)

            // Save empty state screenshot
            const screenshotPath = path.join(OUT_DIR, `leaderboard-empty-${vp.name}.png`)
            await page.screenshot({ path: screenshotPath })
            console.log(`Saved leaderboard empty screenshot: ${screenshotPath}`)
        })

        test(`Verify Leaderboard Error Fallback State on ${vp.name}`, async ({ page }) => {
            await page.setViewportSize({ width: vp.width, height: vp.height })

            // Goto shop using visual-qa error fixture parameter
            await page.goto('/leaderboard?fixture=visual-qa&state=error')
            await page.waitForLoadState('networkidle')
            await hideDevOverlay(page)

            // Assert error warning is displayed
            const errorRoot = page.locator('div', { hasText: 'Chưa tải được bảng xếp hạng. Em thử lại sau một chút nhé.' }).first()
            await expect(errorRoot).toBeVisible()

            // Verify no horizontal overflow
            await expectNoHorizontalOverflow(page)

            // Save error state screenshot
            const screenshotPath = path.join(OUT_DIR, `leaderboard-error-${vp.name}.png`)
            await page.screenshot({ path: screenshotPath })
            console.log(`Saved leaderboard error screenshot: ${screenshotPath}`)
        })
    }
})
