import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { withAuth } from '@/lib/auth/middleware'
import { cacheGet, cacheSet } from '@/lib/cache/redis'

/**
 * GET /api/v1/tts?text=Hallo&speed=1.0
 *
 * On-demand German TTS using Google Cloud Text-to-Speech REST API.
 * Returns audio/mpeg binary.
 * Uses the Firebase service account credentials for authentication.
 *
 * Server-side caching:
 *   - Cache key: `tts:<sha256(text|speed)>` in Upstash Redis
 *   - TTL: 7 days (audio for same text+speed is always identical)
 *   - Stores base64-encoded audio to avoid binary issues
 *   - 100 users requesting "Hallo" = 1 TTS API call + 99 cache hits
 */

const querySchema = z.object({
    text: z.string().min(1).max(200),
    speed: z.coerce.number().min(0.5).max(2.0).default(1.0),
})

const TTS_CACHE_TTL = 7 * 24 * 60 * 60 // 7 days in seconds

// Cache access token to avoid re-creating for every request
let cachedToken: { token: string; expiresAt: number } | null = null

async function getAccessToken(): Promise<string> {
    // Check cache
    if (cachedToken && Date.now() < cachedToken.expiresAt - 60_000) {
        return cachedToken.token
    }

    const saKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
    if (!saKey) throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY not set')

    const sa = JSON.parse(saKey)

    // Create JWT for Google OAuth2
    const header = { alg: 'RS256', typ: 'JWT' }
    const now = Math.floor(Date.now() / 1000)
    const payload = {
        iss: sa.client_email,
        scope: 'https://www.googleapis.com/auth/cloud-platform',
        aud: 'https://oauth2.googleapis.com/token',
        iat: now,
        exp: now + 3600,
    }

    // Import crypto for JWT signing
    const crypto = await import('node:crypto')

    const encode = (obj: Record<string, unknown>) =>
        Buffer.from(JSON.stringify(obj)).toString('base64url')

    const unsignedJwt = `${encode(header)}.${encode(payload)}`
    const sign = crypto.createSign('RSA-SHA256')
    sign.update(unsignedJwt)
    const signature = sign.sign(sa.private_key, 'base64url')
    const jwt = `${unsignedJwt}.${signature}`

    // Exchange JWT for access token
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
    })

    if (!tokenRes.ok) {
        throw new Error(`Token exchange failed: ${tokenRes.status}`)
    }

    const tokenData = await tokenRes.json()
    cachedToken = {
        token: tokenData.access_token,
        expiresAt: Date.now() + (tokenData.expires_in * 1000),
    }

    return cachedToken.token
}

/**
 * Generate a short hash key for the TTS cache.
 * Using a simple FNV-1a-like hash to avoid crypto import overhead for cache keys.
 */
function ttsCacheKey(text: string, speed: number): string {
    // Normalize: lowercase, trim whitespace, round speed to 1 decimal
    const normalized = `${text.trim().toLowerCase()}|${speed.toFixed(1)}`
    // Simple hash — collisions are harmless (just re-fetch TTS)
    let hash = 0x811c9dc5
    for (let i = 0; i < normalized.length; i++) {
        hash ^= normalized.charCodeAt(i)
        hash = (hash * 0x01000193) >>> 0
    }
    return `tts:${hash.toString(36)}`
}

export async function GET(req: NextRequest) {
    try {
        await withAuth(req)

        const params = Object.fromEntries(req.nextUrl.searchParams)
        const { text, speed } = querySchema.parse(params)

        // ── Check server-side cache ──────────────────
        const cacheKey = ttsCacheKey(text, speed)
        const cachedAudio = await cacheGet<string>(cacheKey)

        if (cachedAudio) {
            const audioBuffer = Buffer.from(cachedAudio, 'base64')
            return new NextResponse(audioBuffer, {
                status: 200,
                headers: {
                    'Content-Type': 'audio/mpeg',
                    'Content-Length': audioBuffer.length.toString(),
                    'Cache-Control': 'public, max-age=604800, stale-while-revalidate=86400',
                    'X-Cache': 'HIT',
                },
            })
        }

        // ── Cache miss — call Google Cloud TTS ───────
        const accessToken = await getAccessToken()

        const ttsRes = await fetch(
            'https://texttospeech.googleapis.com/v1/text:synthesize',
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    input: { text },
                    voice: {
                        languageCode: 'de-DE',
                        name: 'de-DE-Wavenet-C', // Female Hochdeutsch
                        ssmlGender: 'FEMALE',
                    },
                    audioConfig: {
                        audioEncoding: 'MP3',
                        speakingRate: speed,
                        pitch: 0,
                    },
                }),
            }
        )

        if (!ttsRes.ok) {
            const errText = await ttsRes.text()
            console.error('TTS API error:', ttsRes.status, errText)
            return NextResponse.json(
                { success: false, error: 'TTS generation failed' },
                { status: 500 }
            )
        }

        const ttsData = await ttsRes.json()
        const audioBase64: string = ttsData.audioContent
        const audioBuffer = Buffer.from(audioBase64, 'base64')

        // ── Store in Redis cache (fire-and-forget) ───
        cacheSet(cacheKey, audioBase64, TTS_CACHE_TTL).catch(() => {})

        return new NextResponse(audioBuffer, {
            status: 200,
            headers: {
                'Content-Type': 'audio/mpeg',
                'Content-Length': audioBuffer.length.toString(),
                'Cache-Control': 'public, max-age=604800, stale-while-revalidate=86400',
                'X-Cache': 'MISS',
            },
        })
    } catch (error: unknown) {
        const errMsg = error instanceof Error ? error.message : 'Internal error'
        console.error('TTS error:', error)
        return NextResponse.json(
            { success: false, error: errMsg },
            { status: 500 }
        )
    }
}
