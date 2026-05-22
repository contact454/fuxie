/**
 * Slow 4G CDP throttling helper.
 *
 * Vai chinh: QA Automation Engineer
 * Vai phoi hop: Frontend Engineer
 *
 * Spec source-of-truth:
 *   - requirements.md Req 14.3 ("network throttling Slow 4G")
 *   - requirements.md Req 18.3 ("network throttling Slow 4G ... cache state empty")
 *
 * Profile values match Chrome DevTools' built-in "Slow 4G" preset:
 *   - downloadThroughput ≈ 400 Kbps  (≈ 50 KB/s)
 *   - uploadThroughput   ≈ 400 Kbps  (≈ 50 KB/s)
 *   - latency           ≈ 400 ms
 *
 * Reference: Chromium DevTools Network panel preset.
 */

import type { Page } from '@playwright/test'

export interface NetworkProfile {
    downloadThroughputBytesPerSec: number
    uploadThroughputBytesPerSec: number
    latencyMs: number
    label: string
}

export const SLOW_4G: NetworkProfile = {
    // Slow 4G: 400 kbps down, 400 kbps up, 400ms latency.
    downloadThroughputBytesPerSec: (400 * 1000) / 8,
    uploadThroughputBytesPerSec: (400 * 1000) / 8,
    latencyMs: 400,
    label: 'Slow 4G',
}

/**
 * Apply CDP `Network.emulateNetworkConditions` to a Playwright page. The
 * CDP session is also returned so callers can disable cache via
 * `Network.setCacheDisabled` before the navigation (Req 18.3 demands an
 * empty cache state when measuring transferred bytes).
 */
export async function applyNetworkThrottle(
    page: Page,
    profile: NetworkProfile = SLOW_4G,
): Promise<void> {
    const client = await page.context().newCDPSession(page)
    await client.send('Network.enable')
    await client.send('Network.clearBrowserCache')
    await client.send('Network.setCacheDisabled', { cacheDisabled: true })
    await client.send('Network.emulateNetworkConditions', {
        offline: false,
        latency: profile.latencyMs,
        downloadThroughput: profile.downloadThroughputBytesPerSec,
        uploadThroughput: profile.uploadThroughputBytesPerSec,
    })
}
