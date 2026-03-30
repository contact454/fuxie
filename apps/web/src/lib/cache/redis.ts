import { Redis } from '@upstash/redis'

// ─── Lazy-init Upstash Redis ─────────────────────────
// Graceful no-op when UPSTASH_REDIS_REST_URL is not set
let redis: Redis | null = null
let disabled = false

function getRedis(): Redis | null {
    if (disabled) return null
    if (redis) return redis

    const url = process.env.UPSTASH_REDIS_REST_URL
    const token = process.env.UPSTASH_REDIS_REST_TOKEN

    if (!url || !token) {
        disabled = true
        return null
    }

    redis = new Redis({ url, token })

    return redis
}

// ─── Cache Operations ────────────────────────────────

/** Get a cached value by key. Returns null on miss or error. */
export async function cacheGet<T>(key: string): Promise<T | null> {
    try {
        const client = getRedis()
        if (!client) return null

        const value = await client.get<T>(key)
        if (value !== null && value !== undefined) return value
        return null
    } catch (err) {
        console.warn(`[Cache] GET error for ${key}:`, err)
        return null
    }
}

/** Set a cached value with TTL (seconds). Fails silently on error. */
export async function cacheSet(key: string, value: unknown, ttlSeconds: number): Promise<void> {
    try {
        const client = getRedis()
        if (!client) return

        await client.set(key, value, { ex: ttlSeconds })

    } catch (err) {
        console.warn(`[Cache] SET error for ${key}:`, err)
    }
}

/**
 * Cache-aside pattern: try cache → miss → fetch → cache result.
 * Falls through to fetcher on any error (graceful degradation).
 */
export async function cacheWrap<T>(
    key: string,
    ttlSeconds: number,
    fetcher: () => Promise<T>,
): Promise<T> {
    // Try cache first
    const cached = await cacheGet<T>(key)
    if (cached !== null) return cached

    // Cache miss — fetch from source
    const result = await fetcher()

    // Store in cache (fire-and-forget, don't await to keep response fast)
    cacheSet(key, result, ttlSeconds).catch(() => {})

    return result
}

/** Delete one or more cache keys. */
export async function cacheInvalidate(...keys: string[]): Promise<void> {
    try {
        const client = getRedis()
        if (!client || keys.length === 0) return

        await client.del(...keys)

    } catch (err) {
        console.warn(`[Cache] INVALIDATE error:`, err)
    }
}

/**
 * Delete all keys matching a prefix (e.g. "dash:content:*").
 * Uses SCAN to avoid blocking — safe for production.
 */
export async function cacheInvalidatePrefix(prefix: string): Promise<void> {
    try {
        const client = getRedis()
        if (!client) return

        let cursor = 0
        do {
            const result = await client.scan(cursor, {
                match: `${prefix}*`,
                count: 100,
            })
            cursor = Number(result[0])
            const keys = result[1] as string[]
            if (keys.length > 0) {
                await client.del(...keys)

            }
        } while (cursor !== 0)
    } catch (err) {
        console.warn(`[Cache] INVALIDATE prefix error for ${prefix}:`, err)
    }
}
