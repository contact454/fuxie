import { describe, expect, it } from 'vitest'
import {
    getTelemetrySnapshot,
    recordLiveProxyAccepted,
    recordLiveProxyClosed,
    recordLiveProxyError,
    recordLiveProxyMessage,
    recordLiveProxyRejected,
} from './observability.js'

describe('AI service observability', () => {
    it('tracks Gemini Live proxy activity in telemetry snapshots', () => {
        const before = getTelemetrySnapshot().liveProxy

        recordLiveProxyAccepted()
        recordLiveProxyMessage('to_upstream', 10)
        recordLiveProxyMessage('to_client', 20)
        recordLiveProxyError('upstream', 'upstream failed')
        recordLiveProxyRejected()
        recordLiveProxyClosed()

        const after = getTelemetrySnapshot().liveProxy

        expect(after.activeConnections).toBe(before.activeConnections)
        expect(after.totalConnections).toBe(before.totalConnections + 1)
        expect(after.rejectedConnections).toBe(before.rejectedConnections + 1)
        expect(after.messagesToUpstream).toBe(before.messagesToUpstream + 1)
        expect(after.messagesToClient).toBe(before.messagesToClient + 1)
        expect(after.bytesToUpstream).toBe(before.bytesToUpstream + 10)
        expect(after.bytesToClient).toBe(before.bytesToClient + 20)
        expect(after.upstreamErrors).toBe(before.upstreamErrors + 1)
        expect(after.lastError).toBe('upstream failed')
    })
})
