/**
 * Playwright globalSetup: mint a learner cookie via the dev-auth endpoint
 * and persist it as Playwright `storageState` so every test starts logged
 * in.
 *
 * Vai chinh: QA Automation Engineer
 * Vai phoi hop: Frontend Engineer
 *
 * Why dev-auth instead of a real Firebase login?
 *   - The dev server (`pnpm dev:web`) reuses `next-firebase-auth-edge` at
 *     runtime, but `FUXIE_DEV_AUTH_ENABLED=true` short-circuits the
 *     middleware to a deterministic learner identity, which is exactly
 *     the surface CI needs to measure on stable, seeded data.
 *   - The endpoint `/api/dev-auth/login?role=learner` returns a redirect
 *     (302) carrying `Set-Cookie: fuxie-dev-user=learner`. We capture
 *     that cookie and write it into the Playwright storage state file.
 *
 * Required env on the dev server:
 *   - FUXIE_DEV_AUTH_ENABLED=true
 */

import type { FullConfig } from '@playwright/test'
import { mkdir, writeFile } from 'node:fs/promises'
import * as path from 'node:path'

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:3005'
const ROLE = 'learner'
// Resolve workspace-root-anchored storage path so Playwright writes to the
// gitignored top-level `tmp/` folder regardless of which cwd the runner is
// invoked from. `__dirname` here is `<root>/tests/integration`.
const WORKSPACE_ROOT = path.resolve(__dirname, '..', '..')
const STORAGE_PATH = path.join(
    WORKSPACE_ROOT,
    'tmp',
    'playwright',
    'learner-storage.json',
)
const LOGIN_PATH = `/api/dev-auth/login?role=${ROLE}&redirect=%2Fdashboard`

export default async function globalSetup(_config: FullConfig): Promise<void> {
    const loginUrl = `${BASE_URL}${LOGIN_PATH}`
    let response: Response

    try {
        response = await fetch(loginUrl, { redirect: 'manual' })
    } catch (err) {
        throw new Error(
            `[playwright global-setup] Could not reach dev-auth at ${loginUrl}.\n` +
                `Start the dev server first (e.g. \`pnpm dev:web\`) with FUXIE_DEV_AUTH_ENABLED=true,\n` +
                `or run with PLAYWRIGHT_AUTOSTART_WEB=1.\n` +
                `Underlying error: ${err instanceof Error ? err.message : String(err)}`,
        )
    }

    // The endpoint returns a 302 redirect on success or 404 when dev auth
    // is disabled.
    if (response.status === 404) {
        throw new Error(
            '[playwright global-setup] /api/dev-auth/login returned 404 — set FUXIE_DEV_AUTH_ENABLED=true on the dev server.',
        )
    }
    if (response.status >= 400) {
        const body = await response.text()
        throw new Error(
            `[playwright global-setup] Dev-auth login failed (${response.status}): ${body.slice(0, 200)}`,
        )
    }

    const setCookie = response.headers.get('set-cookie')
    if (!setCookie) {
        throw new Error(
            '[playwright global-setup] Dev-auth response carried no Set-Cookie header.',
        )
    }

    const cookie = parseSetCookie(setCookie, BASE_URL)
    if (!cookie) {
        throw new Error(
            `[playwright global-setup] Failed to parse Set-Cookie header: ${setCookie}`,
        )
    }

    const storageState = {
        cookies: [cookie],
        origins: [],
    }

    await mkdir(path.dirname(STORAGE_PATH), { recursive: true })
    await writeFile(STORAGE_PATH, JSON.stringify(storageState, null, 2), 'utf8')
}

interface PlaywrightCookie {
    name: string
    value: string
    domain: string
    path: string
    expires: number
    httpOnly: boolean
    secure: boolean
    sameSite: 'Strict' | 'Lax' | 'None'
}

/**
 * Minimal Set-Cookie parser. We only need the first `name=value` pair plus
 * `Path`, `HttpOnly`, `SameSite`, and `Max-Age` attributes. Multi-cookie
 * Set-Cookie headers are split on `,` followed by a space and a token —
 * this intentionally does not support full RFC 6265 because the dev-auth
 * endpoint emits a single, well-formed cookie.
 */
function parseSetCookie(header: string, baseUrl: string): PlaywrightCookie | null {
    const firstCookie = header.split(/,\s*(?=[A-Za-z][A-Za-z0-9._-]*=)/)[0] ?? ''
    const parts = firstCookie.split(';').map((p) => p.trim())
    if (parts.length === 0) return null

    const [nameValue, ...attrs] = parts
    const eq = nameValue.indexOf('=')
    if (eq <= 0) return null

    const name = nameValue.slice(0, eq).trim()
    const value = nameValue.slice(eq + 1).trim()

    const url = new URL(baseUrl)
    let cookiePath = '/'
    let httpOnly = false
    let secure = false
    let sameSite: 'Strict' | 'Lax' | 'None' = 'Lax'
    let maxAge = 60 * 60 * 8 // dev-auth cookie default

    for (const attr of attrs) {
        const [k, v] = attr.split('=').map((s) => s.trim())
        const key = k.toLowerCase()
        if (key === 'path' && v) cookiePath = v
        else if (key === 'httponly') httpOnly = true
        else if (key === 'secure') secure = true
        else if (key === 'samesite' && v) {
            const lower = v.toLowerCase()
            if (lower === 'strict') sameSite = 'Strict'
            else if (lower === 'none') sameSite = 'None'
            else sameSite = 'Lax'
        } else if (key === 'max-age' && v) {
            const parsed = Number.parseInt(v, 10)
            if (Number.isFinite(parsed)) maxAge = parsed
        }
    }

    return {
        name,
        value,
        domain: url.hostname,
        path: cookiePath,
        expires: Math.floor(Date.now() / 1000) + maxAge,
        httpOnly,
        secure,
        sameSite,
    }
}
