import { expect, test, type Page } from '@playwright/test'
import * as fs from 'node:fs'
import * as path from 'node:path'
import dotenv from 'dotenv'
import { PrismaClient, ShopRedeemRequestStatus } from '../../apps/web/generated/prisma'

// Load environment variables from workspace root .env
dotenv.config({ path: path.resolve(__dirname, '..', '..', '.env') })

const prisma = new PrismaClient()
const OUT_DIR = process.env.FUXIE_QA_OUT_DIR
    ? path.resolve(process.env.FUXIE_QA_OUT_DIR)
    : path.resolve(__dirname, '..', '..', 'tmp', 'browser-qa', 'rewards-shop')

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

test.describe('Reward Shop Module E2E & Visual Verification', () => {
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
        test(`Verify Empty Catalog State on ${vp.name}`, async ({ page }) => {
            await page.setViewportSize({ width: vp.width, height: vp.height })

            // Go to rewards shop under visual-qa fixture empty state
            await page.goto('/rewards/shop?fixture=visual-qa&state=empty')
            await page.waitForLoadState('networkidle')
            await hideDevOverlay(page)

            // Assert empty state is visible
            const emptyShell = page.locator('[data-surface-id="rewards-shop"][data-surface-state="empty"]').first()
            await expect(emptyShell).toBeVisible()

            // Verify redirection button points to /course and click it
            const ctaLink = emptyShell.locator('a', { hasText: 'Tiếp tục học' }).first()
            await expect(ctaLink).toBeVisible()
            await ctaLink.click()
            await page.waitForURL('**/course**')

            // Verify no horizontal overflow on course page
            await expectNoHorizontalOverflow(page)

            // Save screenshot
            await page.goto('/rewards/shop?fixture=visual-qa&state=empty')
            await page.waitForLoadState('networkidle')
            await hideDevOverlay(page)
            const screenshotPath = path.join(OUT_DIR, `shop-empty-${vp.name}.png`)
            await page.screenshot({ path: screenshotPath })
            console.log(`Saved empty state screenshot: ${screenshotPath}`)
        })

        test(`Verify Error Fallback State on ${vp.name}`, async ({ page }) => {
            await page.setViewportSize({ width: vp.width, height: vp.height })

            // Go to rewards shop under visual-qa fixture error state
            await page.goto('/rewards/shop?fixture=visual-qa&state=error')
            await page.waitForLoadState('networkidle')
            await hideDevOverlay(page)

            // Assert error state shell is visible
            const errorShell = page.locator('[data-surface-id="rewards-shop"][data-surface-state="error"]').first()
            await expect(errorShell).toBeVisible()
            await expect(errorShell.locator('h2')).toContainText(/Shop tạm thời không phản hồi/i)

            // Verify cached wallet is rendered
            const walletPill = page.locator('[data-role="shop-wallet"]').first()
            await expect(walletPill).toBeVisible()
            await expect(walletPill.locator('[data-role="wallet-fucoin"]')).toContainText('200')
            await expect(walletPill.locator('[data-role="wallet-xp"]')).toContainText('320')

            // Verify no horizontal overflow
            await expectNoHorizontalOverflow(page)

            // Save screenshot
            const screenshotPath = path.join(OUT_DIR, `shop-error-${vp.name}.png`)
            await page.screenshot({ path: screenshotPath })
            console.log(`Saved error state screenshot: ${screenshotPath}`)
        })

        test(`Verify Card States and Tabs on ${vp.name}`, async ({ page }) => {
            await page.setViewportSize({ width: vp.width, height: vp.height })

            // Seed DB state for the test
            // 1. Set wallet balance to 250
            await prisma.userWallet.upsert({
                where: { userId },
                update: { balance: 250 },
                create: { userId, balance: 250 }
            })

            // 2. Clear all requests, then create:
            // - PENDING request for mocktest-unlock
            // - APPROVED + fulfilled request for fuxie-sky-outfit
            await prisma.shopRedeemRequest.deleteMany({ where: { userId } })
            
            await prisma.shopRedeemRequest.create({
                data: {
                    userId,
                    itemId: 'mocktest-unlock',
                    itemTitle: 'Mở khóa mock test',
                    itemCategory: 'learning',
                    itemBenefit: 'Advanced mock test',
                    cost: 300,
                    walletBalanceAtRequest: 250,
                    status: ShopRedeemRequestStatus.PENDING,
                    itemSnapshot: {}
                }
            })

            await prisma.shopRedeemRequest.create({
                data: {
                    userId,
                    itemId: 'fuxie-sky-outfit',
                    itemTitle: 'Fuxie Sky Outfit',
                    itemCategory: 'cosmetic',
                    itemBenefit: 'Cosmetic mascot',
                    cost: 180,
                    walletBalanceAtRequest: 250,
                    status: ShopRedeemRequestStatus.APPROVED,
                    fulfilledAt: new Date(),
                    itemSnapshot: {}
                }
            })

            // Go to rewards shop page
            await page.goto('/rewards/shop')
            await page.waitForLoadState('networkidle')
            await hideDevOverlay(page)

            // Verify wallet values
            const walletPill = page.locator('[data-role="shop-wallet"]').first()
            await expect(walletPill).toBeVisible()
            await expect(walletPill.locator('[data-role="wallet-fucoin"]')).toContainText('250')

            // Verify item card states
            // affordable: coach-hint-pack (cost 220, balance 250)
            const affordableCard = page.locator('[data-shop-item-id="coach-hint-pack"]')
            await expect(affordableCard).toBeVisible()
            await expect(affordableCard).toHaveAttribute('data-card-state', 'affordable')
            await expect(affordableCard.locator('button', { hasText: 'Đổi' }).first()).toBeEnabled()

            // unaffordable: speaking-feedback-pass (cost 420, balance 250)
            const unaffordableCard = page.locator('[data-shop-item-id="speaking-feedback-pass"]')
            await expect(unaffordableCard).toBeVisible()
            await expect(unaffordableCard).toHaveAttribute('data-card-state', 'unaffordable')
            await expect(unaffordableCard.locator('button', { hasText: 'Đổi' }).first()).toBeDisabled()
            await expect(unaffordableCard.locator('[data-role="shop-card-hint"]')).toContainText('Còn thiếu 170 coin')

            // locked: fuxie-real-gift-voucher (preview_locked status)
            const lockedCard = page.locator('[data-shop-item-id="fuxie-real-gift-voucher"]')
            await expect(lockedCard).toBeVisible()
            await expect(lockedCard).toHaveAttribute('data-card-state', 'locked')
            await expect(lockedCard.locator('[role="note"]')).toContainText('Chưa mở')

            // owned: fuxie-sky-outfit
            const ownedCard = page.locator('[data-shop-item-id="fuxie-sky-outfit"]')
            await expect(ownedCard).toBeVisible()
            await expect(ownedCard).toHaveAttribute('data-card-state', 'owned')
            // marketShelfFrame overlay exists
            await expect(ownedCard.locator('img[src*="market-shelf-frame"]')).toBeVisible()
            // secondary "Trang bị" CTA is present
            await expect(ownedCard.locator('button', { hasText: 'Trang bị' }).first()).toBeVisible()

            // pending: mocktest-unlock
            const pendingCard = page.locator('[data-shop-item-id="mocktest-unlock"]')
            await expect(pendingCard).toBeVisible()
            await expect(pendingCard).toHaveAttribute('data-card-state', 'pending')
            // spinner overlay is visible
            await expect(pendingCard.locator('[data-role="shop-pending-overlay"]')).toBeVisible()

            // Verify no horizontal overflow
            await expectNoHorizontalOverflow(page)

            // Save default catalog screenshot
            const defaultScreenshotPath = path.join(OUT_DIR, `shop-default-${vp.name}.png`)
            await page.screenshot({ path: defaultScreenshotPath })
            console.log(`Saved default shop screenshot: ${defaultScreenshotPath}`)

            // Switch to Inventory tab
            const inventoryTab = page.locator('[data-role="shop-tab"][data-shop-tab="inventory"]')
            await expect(inventoryTab).toBeVisible()
            await inventoryTab.click()
            await page.waitForTimeout(300)

            // Verify active tab attribute
            const backboneRoot = page.locator('[data-role="shop-backbone"]').first()
            await expect(backboneRoot).toHaveAttribute('data-active-tab', 'inventory')

            // Verify inventory list contains fuxie-sky-outfit
            const inventoryList = page.locator('[data-role="shop-inventory-list"]').first()
            await expect(inventoryList).toBeVisible()
            const inventoryItem = inventoryList.locator('[data-role="shop-inventory-item"][data-shop-item-id="fuxie-sky-outfit"]')
            await expect(inventoryItem).toBeVisible()

            // Click "Trang bị" (Equip) inside Inventory list
            const equipBtn = inventoryItem.locator('button', { hasText: 'Trang bị' }).first()
            await expect(equipBtn).toBeVisible()
            await equipBtn.click()
            await page.waitForTimeout(300)

            // Verify equipped item changes equipped state synchronously
            await expect(inventoryItem).toHaveAttribute('data-inventory-equipped', 'true')
            await expect(backboneRoot).toHaveAttribute('data-equipped-item-id', 'fuxie-sky-outfit')

            // Verify mascot pose changes synchronously
            const mascot = page.locator('[data-role="shop-mascot"]').first()
            await expect(mascot).toBeVisible()
            await expect(mascot).toHaveAttribute('data-mascot-pose-src', /resultCelebration|result-celebration/i)

            // Save inventory screenshot
            const inventoryScreenshotPath = path.join(OUT_DIR, `shop-inventory-${vp.name}.png`)
            await page.screenshot({ path: inventoryScreenshotPath })
            console.log(`Saved inventory tab screenshot: ${inventoryScreenshotPath}`)
        })

        test(`Verify Pending Redeem Click and 10s Revert on ${vp.name}`, async ({ page }) => {
            await page.setViewportSize({ width: vp.width, height: vp.height })

            // Set balance to 200, clean requests
            await prisma.userWallet.upsert({
                where: { userId },
                update: { balance: 200 },
                create: { userId, balance: 200 }
            })
            await prisma.shopRedeemRequest.deleteMany({ where: { userId } })

            // Mock the POST redeem API to simulate success request creation (so client marks pending)
            // but we won't mutate database, so the server page won't update its own database pending state.
            // When client's 10s timer fires, it will revert because the server's db state never updated,
            // or client-side revert triggers toast and returns card to affordable state.
            await page.route('**/api/v1/rewards/shop/*/redeem', async route => {
                await route.fulfill({
                    status: 202,
                    contentType: 'application/json',
                    body: JSON.stringify({
                        success: true,
                        data: {
                            status: 'pending_created',
                            request: {
                                id: 'new-request-id',
                                itemId: 'fuxie-sky-outfit',
                                status: 'PENDING'
                            }
                        }
                    })
                })
            })

            // Go to rewards shop page
            await page.goto('/rewards/shop')
            await page.waitForLoadState('networkidle')
            await hideDevOverlay(page)

            const outfitCard = page.locator('[data-shop-item-id="fuxie-sky-outfit"]')
            await expect(outfitCard).toHaveAttribute('data-card-state', 'affordable')

            // Click "Đổi" CTA
            const redeemBtn = outfitCard.locator('button', { hasText: 'Đổi' }).first()
            await redeemBtn.click()

            // Verify immediately flips to pending state (optimistic update)
            await expect(outfitCard).toHaveAttribute('data-card-state', 'pending')
            await expect(outfitCard.locator('[data-role="shop-pending-overlay"]')).toBeVisible()

            // Save screenshot in pending state
            const pendingScreenshotPath = path.join(OUT_DIR, `shop-pending-${vp.name}.png`)
            await page.screenshot({ path: pendingScreenshotPath })

            // Wait 10.5 seconds for auto-revert flow
            await page.waitForTimeout(10500)

            // Verify revert toast tray has been rendered
            const toast = page.locator('[data-role="shop-revert-toast"]').first()
            await expect(toast).toBeVisible()
            await expect(toast).toContainText(/Yêu cầu đổi "Fuxie Sky Outfit" chưa được duyệt sau 10 giây/i)

            // Verify card reverted back to affordable state
            await expect(outfitCard).toHaveAttribute('data-card-state', 'affordable')
            await expect(outfitCard.locator('[data-role="shop-pending-overlay"]')).not.toBeVisible()

            // Save revert state screenshot
            const revertScreenshotPath = path.join(OUT_DIR, `shop-revert-${vp.name}.png`)
            await page.screenshot({ path: revertScreenshotPath })
            console.log(`Saved revert flow screenshot: ${revertScreenshotPath}`)
        })
    }
})
