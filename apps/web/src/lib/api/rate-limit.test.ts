import { randomUUID } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import { enforceRateLimit } from './rate-limit'

describe('web API rate limiter', () => {
    it('allows requests below quota', () => {
        const key = `allowed-${randomUUID()}`

        expect(enforceRateLimit(key, { keyPrefix: 'test', windowMs: 1000, max: 2 }, 1000)).toBeNull()
        expect(enforceRateLimit(key, { keyPrefix: 'test', windowMs: 1000, max: 2 }, 1001)).toBeNull()
    })

    it('returns a 429 response once the quota is exceeded', () => {
        const key = `blocked-${randomUUID()}`

        expect(enforceRateLimit(key, { keyPrefix: 'test', windowMs: 1000, max: 1 }, 1000)).toBeNull()
        const response = enforceRateLimit(key, { keyPrefix: 'test', windowMs: 1000, max: 1 }, 1001)

        expect(response?.status).toBe(429)
        expect(response?.headers.get('Retry-After')).toBe('1')
    })
})
