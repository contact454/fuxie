import { expect, test, type Page } from '@playwright/test'

type DevRole = 'learner' | 'teacher' | 'admin'

const ADMIN_QUERY = '/api/v1/admin/analytics/activation?from=2026-05-01&to=2026-05-22'

test.describe('Production hardening smoke', () => {
    test('unauthenticated users are redirected away from protected app routes', async ({ page }) => {
        await page.context().clearCookies()

        for (const route of ['/dashboard', '/teacher', '/admin']) {
            await page.goto(route, { waitUntil: 'networkidle' })
            await expect(page).toHaveURL(/\/login/)
        }
    })

    test('learner role cannot enter teacher/admin surfaces or privileged APIs', async ({ page }) => {
        await loginAs(page, 'learner', '/dashboard')
        await expect(page).toHaveURL(/\/dashboard/)

        await page.goto('/teacher', { waitUntil: 'networkidle' })
        await expect(page).toHaveURL(/\/dashboard/)

        await page.goto('/admin', { waitUntil: 'networkidle' })
        await expect(page).toHaveURL(/\/dashboard/)

        const teacherApi = await page.request.get('/api/v1/teacher/classrooms')
        expect(teacherApi.status()).toBe(403)

        const adminApi = await page.request.get(ADMIN_QUERY)
        expect(adminApi.status()).toBe(403)
    })

    test('teacher role can enter staff surfaces but not admin-only analytics', async ({ page }) => {
        await loginAs(page, 'teacher', '/teacher')
        await expect(page).toHaveURL(/\/teacher/)
        await expect(page.locator('body')).not.toContainText('Fuxie - Login')

        await page.goto('/admin', { waitUntil: 'networkidle' })
        await expect(page).toHaveURL(/\/admin/)
        await expect(page.locator('body')).not.toContainText('Fuxie - Login')

        const teacherApi = await page.request.get('/api/v1/teacher/classrooms')
        expect(teacherApi.status()).toBe(200)

        const adminApi = await page.request.get(ADMIN_QUERY)
        expect(adminApi.status()).toBe(403)
    })

    test('admin role can enter admin and teacher surfaces plus admin analytics', async ({ page }) => {
        await loginAs(page, 'admin', '/admin')
        await expect(page).toHaveURL(/\/admin/)
        await expect(page.locator('body')).not.toContainText('Fuxie - Login')

        await page.goto('/teacher', { waitUntil: 'networkidle' })
        await expect(page).toHaveURL(/\/teacher/)
        await expect(page.locator('body')).not.toContainText('Fuxie - Login')

        const teacherApi = await page.request.get('/api/v1/teacher/classrooms')
        expect(teacherApi.status()).toBe(200)

        const adminApi = await page.request.get(ADMIN_QUERY)
        expect(adminApi.status()).toBe(200)
        await expectJsonSuccess(adminApi)
    })

    test('learner read-only motivation endpoints stay available', async ({ page }) => {
        await loginAs(page, 'learner', '/dashboard')

        const missionResponse = await page.request.get('/api/v1/missions')
        expect(missionResponse.status()).toBe(200)
        await expectJsonSuccess(missionResponse)

        const walletResponse = await page.request.get('/api/v1/rewards/wallet')
        expect(walletResponse.status()).toBe(200)
        await expectJsonSuccess(walletResponse)
    })
})

async function loginAs(page: Page, role: DevRole, redirect: string) {
    await page.context().clearCookies()
    await page.goto(
        `/api/dev-auth/login?role=${role}&redirect=${encodeURIComponent(redirect)}`,
        { waitUntil: 'networkidle' },
    )
}

async function expectJsonSuccess(response: { json: () => Promise<unknown> }) {
    const body = await response.json()
    expect(body).toMatchObject({ success: true })
}
