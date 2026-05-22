import { describe, expect, it } from 'vitest'

import { handleApiError } from './error-handler'

describe('handleApiError', () => {
    it('preserves explicit HTTP status errors from route guards', async () => {
        const response = handleApiError(Object.assign(new Error('Forbidden area'), { status: 403 }))

        expect(response.status).toBe(403)
        await expect(response.json()).resolves.toMatchObject({
            success: false,
            error: {
                code: 'FORBIDDEN',
                message: 'Forbidden area',
            },
        })
    })
})
