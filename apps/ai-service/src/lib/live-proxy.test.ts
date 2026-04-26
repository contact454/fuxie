import { describe, expect, it } from 'vitest'
import { createLiveProxyToken, verifyLiveProxyToken } from './live-proxy.js'

describe('Gemini Live proxy token', () => {
    it('accepts a valid signed token', () => {
        const token = createLiveProxyToken('user-1', 'proxy-secret', 60, 1000)

        expect(verifyLiveProxyToken(token, 'proxy-secret', 1030)).toBe(true)
    })

    it('rejects a token signed with another secret', () => {
        const token = createLiveProxyToken('user-1', 'proxy-secret', 60, 1000)

        expect(verifyLiveProxyToken(token, 'other-secret', 1030)).toBe(false)
    })

    it('rejects expired tokens outside the allowed clock skew', () => {
        const token = createLiveProxyToken('user-1', 'proxy-secret', 60, 1000)

        expect(verifyLiveProxyToken(token, 'proxy-secret', 1091)).toBe(false)
    })

    it('rejects malformed tokens', () => {
        expect(verifyLiveProxyToken('not-a-token', 'proxy-secret', 1000)).toBe(false)
    })
})
