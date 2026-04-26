import type { Context, MiddlewareHandler, Next } from 'hono'

type RateLimitResult = {
    allowed: boolean
    remaining: number
    resetAt: number
    retryAfterSeconds: number
}

type RateLimitOptions = {
    keyPrefix: string
    windowMs: number
    max: number
}

type Bucket = {
    count: number
    resetAt: number
}

const buckets = new Map<string, Bucket>()
const MAX_BUCKETS = 10_000

export function checkRateLimit(key: string, options: RateLimitOptions, now = Date.now()): RateLimitResult {
    cleanupExpiredBuckets(now)

    const bucketKey = `${options.keyPrefix}:${key}`
    const existing = buckets.get(bucketKey)
    const bucket = existing && existing.resetAt > now
        ? existing
        : { count: 0, resetAt: now + options.windowMs }

    bucket.count += 1
    buckets.set(bucketKey, bucket)

    const retryAfterSeconds = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000))
    const remaining = Math.max(0, options.max - bucket.count)

    return {
        allowed: bucket.count <= options.max,
        remaining,
        resetAt: bucket.resetAt,
        retryAfterSeconds,
    }
}

export function rateLimit(options: RateLimitOptions): MiddlewareHandler {
    return async (c: Context, next: Next) => {
        const result = checkRateLimit(getClientKey(c), options)

        c.header('X-RateLimit-Limit', String(options.max))
        c.header('X-RateLimit-Remaining', String(result.remaining))
        c.header('X-RateLimit-Reset', String(Math.ceil(result.resetAt / 1000)))

        if (!result.allowed) {
            c.header('Retry-After', String(result.retryAfterSeconds))
            return c.json({
                success: false,
                error: {
                    code: 'RATE_LIMITED',
                    message: 'Too many requests. Please try again later.',
                },
            }, 429)
        }

        await next()
    }
}

export function getRateLimitNumber(name: string, fallback: number): number {
    const value = Number(process.env[name])
    return Number.isFinite(value) && value > 0 ? value : fallback
}

function getClientKey(c: Context): string {
    return (
        c.req.header('cf-connecting-ip') ||
        c.req.header('x-real-ip') ||
        c.req.header('x-forwarded-for')?.split(',')[0]?.trim() ||
        'unknown'
    )
}

function cleanupExpiredBuckets(now: number) {
    if (buckets.size < MAX_BUCKETS) {
        return
    }

    for (const [key, bucket] of buckets.entries()) {
        if (bucket.resetAt <= now) {
            buckets.delete(key)
        }
    }
}
