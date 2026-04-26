import { randomUUID } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import { checkRateLimit } from './rate-limit.js'

describe('AI service rate limiter', () => {
    it('allows requests inside the configured window quota', () => {
        const key = `allowed-${randomUUID()}`

        expect(checkRateLimit(key, { keyPrefix: 'test', windowMs: 1000, max: 2 }, 1000)).toMatchObject({
            allowed: true,
            remaining: 1,
        })
        expect(checkRateLimit(key, { keyPrefix: 'test', windowMs: 1000, max: 2 }, 1001)).toMatchObject({
            allowed: true,
            remaining: 0,
        })
    })

    it('blocks requests over quota until the window resets', () => {
        const key = `blocked-${randomUUID()}`

        checkRateLimit(key, { keyPrefix: 'test', windowMs: 1000, max: 1 }, 1000)
        expect(checkRateLimit(key, { keyPrefix: 'test', windowMs: 1000, max: 1 }, 1001)).toMatchObject({
            allowed: false,
            remaining: 0,
            retryAfterSeconds: 1,
        })
        expect(checkRateLimit(key, { keyPrefix: 'test', windowMs: 1000, max: 1 }, 2001)).toMatchObject({
            allowed: true,
            remaining: 0,
        })
    })
})
