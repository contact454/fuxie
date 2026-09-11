import { randomUUID } from 'node:crypto'
import { expect, test, type Page } from '@playwright/test'

type DevRole = 'learner' | 'teacher' | 'admin'
type SessionItem = {
    id: string
    format: 'INTRO' | 'MULTIPLE_CHOICE' | 'TYPING'
    data: { options?: Array<{ id: string; label: string }> }
}
type SessionView = {
    state: 'ready'
    attemptId: string
    publicRevision: string
    contractVersion: 2
    items: SessionItem[]
    nextQuestionId: string | null
    completionAvailable: boolean
}

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

    test('session v2 start-answer-resume-complete is owner-scoped and idempotent', async ({ page }) => {
        await loginAs(page, 'learner', '/dashboard')

        const startResponse = await page.request.post('/api/v1/session/start', {
            data: { contractVersion: 2, clientStartKey: randomUUID() },
        })
        expect(startResponse.status()).toBe(200)
        const startBody = await startResponse.json()
        expect(startBody).toMatchObject({ success: true, data: { state: 'ready', contractVersion: 2 } })
        let view = startBody.data as SessionView
        expect(view.items.length).toBeGreaterThan(0)

        const prematureComplete = await page.request.post('/api/v1/session/complete', {
            data: { contractVersion: 2, attemptId: view.attemptId, publicRevision: view.publicRevision },
        })
        expect(prematureComplete.status()).toBe(409)
        await expect(prematureComplete.json()).resolves.toMatchObject({
            success: false,
            error: { code: 'SESSION_INCOMPLETE' },
        })

        await loginAs(page, 'teacher', '/teacher')
        const crossUserRead = await page.request.get(`/api/v1/session/${view.attemptId}`)
        expect(crossUserRead.status()).toBe(404)

        await loginAs(page, 'learner', '/dashboard')
        const resumed = await page.request.get(`/api/v1/session/${view.attemptId}`)
        expect(resumed.status()).toBe(200)
        const resumedBody = await resumed.json()
        expect(resumedBody).toMatchObject({ success: true, data: { attemptId: view.attemptId } })
        view = resumedBody.data as SessionView

        let steps = 0
        while (!view.completionAvailable && view.nextQuestionId) {
            steps++
            expect(steps).toBeLessThanOrEqual(20)
            const item = view.items.find(candidate => candidate.id === view.nextQuestionId)
            expect(item).toBeTruthy()
            const answer = answerFor(item!)
            const answerResponse = await page.request.post(`/api/v1/session/${view.attemptId}/answers`, {
                data: {
                    contractVersion: 2,
                    publicRevision: view.publicRevision,
                    questionId: item!.id,
                    answer,
                },
            })
            expect(answerResponse.status()).toBe(200)
            const answerBody = await answerResponse.json()
            expect(answerBody).toMatchObject({ success: true, data: { attemptId: view.attemptId } })
            view = answerBody.data as SessionView
        }
        expect(view.completionAvailable).toBe(true)

        const completePayload = { contractVersion: 2, attemptId: view.attemptId, publicRevision: view.publicRevision }
        const completeResponse = await page.request.post('/api/v1/session/complete', { data: completePayload })
        expect(completeResponse.status()).toBe(200)
        const completeBody = await completeResponse.json()
        expect(completeBody).toMatchObject({
            success: true,
            data: { receipt: { attemptId: view.attemptId, contractVersion: 2 } },
        })

        const retryResponse = await page.request.post('/api/v1/session/complete', { data: completePayload })
        expect(retryResponse.status()).toBe(200)
        const retryBody = await retryResponse.json()
        expect(retryBody.data.receipt).toEqual(completeBody.data.receipt)
    })
})

function answerFor(item: SessionItem) {
    if (item.format === 'INTRO') return { kind: 'ack' as const, acknowledged: true as const }
    if (item.format === 'MULTIPLE_CHOICE') {
        const optionId = item.data.options?.[0]?.id
        if (!optionId) throw new Error(`Session item ${item.id} has no option`)
        return { kind: 'option' as const, optionId }
    }
    return { kind: 'text' as const, text: '__smoke_answer__' }
}

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
